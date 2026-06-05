#!/usr/bin/env bash
# =============================================================================
# Trip Planner — Dev Environment Shutdown  (Mac / Linux)
# =============================================================================
# Usage: bash scripts/dev-stop.sh
#        bash scripts/dev-stop.sh --stop-postgres   (also stop PostgreSQL)
# =============================================================================

STOP_PG=false
for arg in "$@"; do
  [ "$arg" = "--stop-postgres" ] && STOP_PG=true
done

CYAN='\033[0;36m' GREEN='\033[0;32m' YELLOW='\033[1;33m' GRAY='\033[0;90m' MAGENTA='\033[0;35m' NC='\033[0m'

step() { echo -e "\n${CYAN}► $1${NC}"; }
ok()   { echo -e "  ${GREEN}✓ $1${NC}"; }
warn() { echo -e "  ${YELLOW}⚠ $1${NC}"; }

echo ""
echo -e "  ${MAGENTA}Trip Planner — Dev Shutdown${NC}"
echo -e "  ${GRAY}─────────────────────────────────────────${NC}"

# ── Stop vercel / node processes ──────────────────────────────────────────────
step "Stopping vercel dev"

PIDS=$(pgrep -f "vercel dev" 2>/dev/null || true)
if [ -n "$PIDS" ]; then
  echo "$PIDS" | xargs kill -TERM 2>/dev/null || true
  sleep 1
  # Force-kill any that didn't stop
  REMAINING=$(pgrep -f "vercel dev" 2>/dev/null || true)
  [ -n "$REMAINING" ] && echo "$REMAINING" | xargs kill -KILL 2>/dev/null || true
  ok "vercel dev stopped (pids: $PIDS)"
else
  warn "No vercel dev process found (may have already been stopped)"
fi

# Also kill any node processes that are child processes of vercel
NODE_PIDS=$(pgrep -f "node.*vercel" 2>/dev/null || true)
if [ -n "$NODE_PIDS" ]; then
  echo "$NODE_PIDS" | xargs kill -TERM 2>/dev/null || true
  ok "Related node processes stopped"
fi

# ── Optionally stop PostgreSQL ─────────────────────────────────────────────────
if [ "$STOP_PG" = true ]; then
  step "Stopping PostgreSQL"
  ROOT="$(cd "$(dirname "$0")/.." && pwd)"
  COMPOSE_FILE="$ROOT/docker-compose.yml"
  PG_STOPPED=false

  # Docker compose down (preferred when compose file is present)
  if command -v docker &>/dev/null && [ -f "$COMPOSE_FILE" ]; then
    echo -e "  ${GRAY}Running docker compose down...${NC}"
    docker compose -f "$COMPOSE_FILE" down &>/dev/null \
      && ok "PostgreSQL stopped (docker compose down)" && PG_STOPPED=true \
      || warn "docker compose down failed"
  fi

  if [ "$PG_STOPPED" = false ]; then
  OS="$(uname)"
  if [ "$OS" = "Darwin" ]; then
    PG_SERVICE=$(brew services list 2>/dev/null | awk '/^postgresql/ {print $1}' | head -1)
    if [ -n "$PG_SERVICE" ]; then
      brew services stop "$PG_SERVICE" && ok "PostgreSQL stopped (brew: $PG_SERVICE)" || warn "Could not stop via brew"
    else
      warn "No Homebrew PostgreSQL service found"
    fi
  else
    if sudo systemctl stop postgresql 2>/dev/null; then
      ok "PostgreSQL stopped (systemctl)"
    else
      PG_VERSION=$(pg_lsclusters -h 2>/dev/null | awk '{print $1}' | tail -1)
      if [ -n "$PG_VERSION" ]; then
        sudo pg_ctlcluster "$PG_VERSION" main stop 2>/dev/null && ok "PostgreSQL stopped (cluster $PG_VERSION)"
      else
        warn "Could not stop PostgreSQL automatically"
      fi
    fi
  fi
  fi  # PG_STOPPED = false
else
  echo ""
  echo -e "  ${GRAY}PostgreSQL is still running.${NC}"
  echo -e "  ${GRAY}To also stop it: bash scripts/dev-stop.sh --stop-postgres${NC}"
fi

echo ""
ok "Done."
echo ""
