#!/usr/bin/env bash
# =============================================================================
# Trip Planner - Dev Environment Startup  (Mac / Linux)
# =============================================================================
# Usage:
#   bash scripts/dev-start.sh                  full startup
#   bash scripts/dev-start.sh --skip-schema    skip schema (faster restart)
#   bash scripts/dev-start.sh --same-window    run vercel dev in THIS terminal
#
# Requirements: Node.js, npm  (no psql needed — uses the project's pg package)
# =============================================================================

set -euo pipefail

SKIP_SCHEMA=false
SAME_WINDOW=false
for arg in "$@"; do
  case $arg in
    --skip-schema) SKIP_SCHEMA=true ;;
    --same-window) SAME_WINDOW=true ;;
  esac
done

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DBUTIL="$ROOT/scripts/db-util.cjs"

CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
RED='\033[0;31m';  MAGENTA='\033[0;35m'; GRAY='\033[0;90m'; NC='\033[0m'

step() { echo -e "\n${CYAN}> $1${NC}"; }
ok()   { echo -e "  ${GREEN}OK  $1${NC}"; }
warn() { echo -e "  ${YELLOW}--  $1${NC}"; }
fail() { echo -e "  ${RED}XX  $1${NC}"; exit 1; }

echo ""
echo -e "  ${MAGENTA}Trip Planner - Dev Startup${NC}"
echo -e "  ${GRAY}----------------------------------------${NC}"

# ── 1. Prerequisites ──────────────────────────────────────────────────────────
step "Checking prerequisites"

for cmd in node npm; do
  command -v "$cmd" &>/dev/null || fail "$cmd not found. Install Node.js from https://nodejs.org"
  ok "$cmd found"
done

if ! command -v vercel &>/dev/null; then
  warn "Vercel CLI not found -- installing globally..."
  npm install -g vercel || fail "npm install -g vercel failed"
fi
ok "vercel CLI found"

# ── 2. npm install (needed early so db-util.cjs can require pg) ───────────────
step "Checking npm dependencies"

if [ ! -d "$ROOT/node_modules" ]; then
  echo -e "  ${GRAY}Running npm install...${NC}"
  (cd "$ROOT" && npm install) || fail "npm install failed"
  ok "Dependencies installed"
else
  ok "node_modules present"
fi

# ── 3. .env.local ─────────────────────────────────────────────────────────────
step "Checking .env.local"

ENV_FILE="$ROOT/.env.local"
if [ ! -f "$ENV_FILE" ]; then
  EXAMPLE="$ROOT/.env.example"
  if [ -f "$EXAMPLE" ]; then
    cp "$EXAMPLE" "$ENV_FILE"
    warn ".env.local not found -- copied from .env.example"
    echo -e "  ${YELLOW}Edit $ENV_FILE then re-run this script.${NC}"
    exit 1
  fi
  fail ".env.local missing. Create it with DATABASE_URL=... and USE_LOCAL_PG=true"
fi
ok ".env.local exists"

# Load .env.local (skip comments/blanks, no overwrite of existing env vars)
while IFS= read -r line; do
  line="${line%%#*}"
  line="$(echo "$line" | tr -d '\r\t')"
  line="${line#"${line%%[![:space:]]*}"}"
  [ -z "$line" ] || [[ "$line" != *=* ]] && continue
  key="${line%%=*}"
  val="${line#*=}"
  val="${val%\"}" val="${val#\"}" val="${val%\'}" val="${val#\'}"
  [ -z "${!key+x}" ] && export "$key=$val"
done < "$ENV_FILE"

[ -z "${DATABASE_URL:-}" ] && fail "DATABASE_URL not set in .env.local"
[ "${USE_LOCAL_PG:-}" != "true" ] && warn "USE_LOCAL_PG is not 'true' — you may be targeting Neon, not local PostgreSQL"
ok "DATABASE_URL loaded"

# ── 4. Start PostgreSQL ───────────────────────────────────────────────────────
step "Starting PostgreSQL"

PG_STARTED=false

# ── Option A: Docker (preferred) ──────────────────────────────────────────────
if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
  COMPOSE_FILE="$ROOT/docker-compose.yml"
  if [ -f "$COMPOSE_FILE" ]; then
    # docker compose up -d is idempotent: creates, starts, or no-ops as needed
    echo -e "  ${GRAY}Running docker compose up -d...${NC}"
    docker compose -f "$COMPOSE_FILE" up -d &>/dev/null \
      && ok "PostgreSQL (Docker) started via docker compose" && PG_STARTED=true \
      || warn "docker compose up failed"
  else
    # No compose file — manage the container directly
    CONTAINER_STATUS=$(docker ps -a --filter "name=^postgres-db$" --format "{{.Status}}" 2>/dev/null || true)
    if [[ "$CONTAINER_STATUS" == Up* ]]; then
      ok "PostgreSQL (Docker: postgres-db) already running"
      PG_STARTED=true
    elif [ -n "$CONTAINER_STATUS" ]; then
      echo -e "  ${GRAY}Starting Docker container postgres-db...${NC}"
      docker start postgres-db &>/dev/null && ok "PostgreSQL (Docker: postgres-db) started" && PG_STARTED=true \
        || warn "docker start postgres-db failed"
    else
      warn "postgres-db container not found and no docker-compose.yml present"
    fi
  fi
elif command -v docker &>/dev/null; then
  warn "Docker is installed but not running — start Docker Desktop, or use native PostgreSQL"
fi

# ── Option B: Native PostgreSQL (Homebrew / systemctl / Postgres.app) ─────────
if [ "$PG_STARTED" = false ]; then
  OS="$(uname)"
  if [ "$OS" = "Darwin" ]; then
    if command -v brew &>/dev/null; then
      svc=$(brew services list 2>/dev/null | awk '/^postgresql/{print $1}' | head -1)
      if [ -n "$svc" ]; then
        brew services list | grep "$svc" | grep -q started \
          && ok "PostgreSQL (Homebrew: $svc) already running" && PG_STARTED=true \
          || { brew services start "$svc" && ok "PostgreSQL started (brew: $svc)" && PG_STARTED=true; }
      fi
    fi
    [ "$PG_STARTED" = false ] && [ -d "/Applications/Postgres.app" ] \
      && open -a Postgres && ok "Postgres.app launched" && PG_STARTED=true
  else
    systemctl is-active --quiet postgresql 2>/dev/null \
      && ok "PostgreSQL (systemctl) already running" && PG_STARTED=true
    [ "$PG_STARTED" = false ] && sudo systemctl start postgresql 2>/dev/null \
      && ok "PostgreSQL started (systemctl)" && PG_STARTED=true
    if [ "$PG_STARTED" = false ]; then
      v=$(pg_lsclusters -h 2>/dev/null | awk '{print $1}' | tail -1)
      [ -n "$v" ] && sudo pg_ctlcluster "$v" main start 2>/dev/null \
        && ok "PostgreSQL started (cluster $v)" && PG_STARTED=true
    fi
  fi
fi

[ "$PG_STARTED" = false ] && warn "Could not start PostgreSQL automatically — will attempt to connect anyway"

# Wait for PG to accept connections using db-util ping
echo -e "  ${GRAY}Waiting for PostgreSQL...${NC}"
PG_READY=false
for i in $(seq 1 30); do
  PING=$(node "$DBUTIL" ping 2>&1 || true)
  EC=$?
  [ $EC -eq 0 ] && PG_READY=true && break
  [ $EC -eq 2 ] && PG_READY=true && break  # DB missing but PG is up
  sleep 1
done
$PG_READY || fail "PostgreSQL did not become ready in 30 s. Check DATABASE_URL in .env.local"
ok "PostgreSQL is accepting connections"

# ── 5. Create database if missing ─────────────────────────────────────────────
step "Ensuring database exists"

DB_NAME="${DATABASE_URL##*/}"
DB_NAME="${DB_NAME%%\?*}"

RESULT=$(node "$DBUTIL" create-db "$DB_NAME" 2>&1)
if [ $? -ne 0 ]; then
  fail "Could not create database '$DB_NAME': $RESULT"
fi
[ "$RESULT" = "created" ] && ok "Database '$DB_NAME' created" || ok "Database '$DB_NAME' already exists"

# ── 6. Apply schemas ──────────────────────────────────────────────────────────
if [ "$SKIP_SCHEMA" = false ]; then
  step "Applying database schemas"
  for schema in "$ROOT/schema.sql" "$ROOT/schema-phase-e.sql"; do
    name="$(basename "$schema")"
    if [ -f "$schema" ]; then
      RESULT=$(node "$DBUTIL" run-file "$schema" 2>&1) \
        && ok "Applied $name ($RESULT)" \
        || fail "Schema failed: $name — $RESULT"
    else
      warn "$name not found — skipping"
    fi
  done
else
  warn "Schema application skipped (--skip-schema)"
fi

# ── 7. Launch vercel dev ──────────────────────────────────────────────────────
step "Starting vercel dev"
echo ""
echo -e "  ${GREEN}App : http://localhost:3000${NC}"
echo -e "  ${GREEN}API : http://localhost:3000/api${NC}"
echo ""

cd "$ROOT"
if [ "$SAME_WINDOW" = true ]; then
  vercel dev
else
  OS="$(uname)"
  LAUNCHED=false
  if [ "$OS" = "Darwin" ]; then
    osascript -e "tell application \"Terminal\" to do script \"cd '$ROOT' && vercel dev\"" 2>/dev/null \
      && ok "vercel dev launched in a new Terminal window" && LAUNCHED=true
  fi
  if [ "$LAUNCHED" = false ]; then
    for term in gnome-terminal xterm konsole xfce4-terminal; do
      if command -v "$term" &>/dev/null; then
        $term -- bash -c "cd '$ROOT' && vercel dev; read -p 'Press Enter to close'" &
        ok "vercel dev launched in $term"
        LAUNCHED=true
        break
      fi
    done 2>/dev/null
  fi
  if [ "$LAUNCHED" = false ]; then
    warn "No terminal emulator found — running vercel dev in this window"
    vercel dev
  else
    echo -e "  ${GRAY}To stop: bash scripts/dev-stop.sh${NC}"
    echo ""
  fi
fi
