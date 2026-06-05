# =============================================================================
# Trip Planner - Dev Environment Startup  (Windows / PowerShell)
# =============================================================================
# Usage:
#   .\scripts\dev-start.ps1                  full startup, vercel dev in new window
#   .\scripts\dev-start.ps1 -SkipSchema      skip schema (faster restart)
#   .\scripts\dev-start.ps1 -SameWindow      run vercel dev in THIS terminal
#
# Requirements: Node.js, npm  (no psql needed - uses the project's pg package)
# =============================================================================

param(
    [switch]$SkipSchema,
    [switch]$SameWindow
)

Set-StrictMode -Off
$ErrorActionPreference = "Stop"
$ROOT    = Resolve-Path (Join-Path $PSScriptRoot "..")
$DBUTIL  = Join-Path $PSScriptRoot "db-util.cjs"

function Step { param([string]$msg) Write-Host ("`n> " + $msg) -ForegroundColor Cyan }
function OK   { param([string]$msg) Write-Host ("  OK  " + $msg) -ForegroundColor Green }
function Warn { param([string]$msg) Write-Host ("  --  " + $msg) -ForegroundColor Yellow }
function Fail { param([string]$msg) Write-Host ("  XX  " + $msg) -ForegroundColor Red; exit 1 }

function Invoke-DBUtil {
    param([string[]]$CmdArgs)
    $out = & node $DBUTIL @CmdArgs 2>&1
    return @{ Output = ($out | Out-String).Trim(); Exit = $LASTEXITCODE }
}

Write-Host ""
Write-Host "  Trip Planner - Dev Startup" -ForegroundColor Magenta
Write-Host "  ----------------------------------------" -ForegroundColor DarkGray

# -- 1. Prerequisites ----------------------------------------------------------
Step "Checking prerequisites"

foreach ($cmd in @("node", "npm")) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Fail "$cmd not found. Install Node.js from https://nodejs.org"
    }
    OK "$cmd found"
}

if (-not (Get-Command "vercel" -ErrorAction SilentlyContinue)) {
    Warn "Vercel CLI not found -- installing globally..."
    npm install -g vercel
    if ($LASTEXITCODE -ne 0) { Fail "npm install -g vercel failed" }
}
OK "vercel CLI found"

# -- 2. npm install (needed early so db-util.cjs can require('pg')) ------------
Step "Checking npm dependencies"

$nodeModulesPath = Join-Path $ROOT "node_modules"
if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "  Running npm install..." -ForegroundColor DarkGray
    Push-Location $ROOT
    npm install
    Pop-Location
    if ($LASTEXITCODE -ne 0) { Fail "npm install failed" }
    OK "Dependencies installed"
} else {
    OK "node_modules present"
}

# -- 3. .env.local -------------------------------------------------------------
Step "Checking .env.local"

$envFile = Join-Path $ROOT ".env.local"
if (-not (Test-Path $envFile)) {
    $exampleFile = Join-Path $ROOT ".env.example"
    if (Test-Path $exampleFile) {
        Copy-Item $exampleFile $envFile
        Warn ".env.local not found -- copied from .env.example"
        Write-Host "     Edit $envFile then re-run this script." -ForegroundColor Yellow
        exit 1
    }
    Fail ".env.local missing. Create it with DATABASE_URL and USE_LOCAL_PG=true"
}
OK ".env.local exists"

# Load .env.local into this process (skip blanks and comments, no overwrite)
foreach ($rawLine in (Get-Content $envFile)) {
    $trimmed = $rawLine.Trim()
    if ($trimmed -eq "" -or $trimmed.StartsWith("#")) { continue }
    $eqPos = $trimmed.IndexOf("=")
    if ($eqPos -lt 1) { continue }
    $envKey = $trimmed.Substring(0, $eqPos).Trim()
    $envVal = $trimmed.Substring($eqPos + 1).Trim()
    $envVal = $envVal -replace '^"(.*)"$', '$1' -replace "^'(.*)'$", '$1'
    if (-not [System.Environment]::GetEnvironmentVariable($envKey)) {
        [System.Environment]::SetEnvironmentVariable($envKey, $envVal, "Process")
    }
}

$dbUrl = $env:DATABASE_URL
if (-not $dbUrl) { Fail "DATABASE_URL not set in .env.local" }

if ($env:USE_LOCAL_PG -ne "true") {
    Warn "USE_LOCAL_PG is not 'true' -- you may be targeting Neon, not local PostgreSQL"
}
OK "DATABASE_URL loaded"

# -- 4. Start PostgreSQL -------------------------------------------------------
Step "Starting PostgreSQL"

$pgStarted = $false

# -- Option A: Docker (preferred) ----------------------------------------------
if (Get-Command "docker" -ErrorAction SilentlyContinue) {
    $dockerInfo = & docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        $composeFile = Join-Path $ROOT "docker-compose.yml"
        if (Test-Path $composeFile) {
            # docker compose up -d is idempotent: creates, starts, or no-ops as needed
            Write-Host "  Running docker compose up -d..." -ForegroundColor DarkGray
            $prevEap = $ErrorActionPreference; $ErrorActionPreference = "Continue"
            & docker compose -f $composeFile up -d 2>&1 | Out-Null
            $dcExit = $LASTEXITCODE
            $ErrorActionPreference = $prevEap
            if ($dcExit -eq 0) { OK "PostgreSQL (Docker) started via docker compose"; $pgStarted = $true }
            else { Warn "docker compose up failed -- will try other methods" }
        } else {
            # No compose file -- fall back to managing the container directly
            $containerStatus = "$((& docker ps -a --filter "name=^postgres-db$" --format "{{.Status}}" 2>&1))".Trim()
            if ($containerStatus -like "Up*") {
                OK "PostgreSQL (Docker: postgres-db) already running"
                $pgStarted = $true
            } elseif ($containerStatus -ne "") {
                Write-Host "  Starting Docker container postgres-db..." -ForegroundColor DarkGray
                $prevEap = $ErrorActionPreference; $ErrorActionPreference = "Continue"
                & docker start postgres-db 2>&1 | Out-Null
                $dcExit = $LASTEXITCODE
                $ErrorActionPreference = $prevEap
                if ($dcExit -eq 0) { OK "PostgreSQL (Docker: postgres-db) started"; $pgStarted = $true }
                else { Warn "docker start postgres-db failed -- will try other methods" }
            } else {
                Warn "postgres-db container not found and no docker-compose.yml present"
            }
        }
    } else {
        Warn "Docker is installed but not running -- start Docker Desktop and retry, or use a local PostgreSQL service"
    }
}

# -- Option B: Windows service (native PostgreSQL install) ---------------------
if (-not $pgStarted) {
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -ne $pgService) {
        if ($pgService.Status -ne "Running") {
            Write-Host ("  Starting Windows service: " + $pgService.Name + "...") -ForegroundColor DarkGray
            try {
                Start-Service -Name $pgService.Name
                Start-Sleep -Seconds 2
                OK ("PostgreSQL service started (" + $pgService.Name + ")")
                $pgStarted = $true
            } catch {
                Fail "Could not start PostgreSQL service. Try running as Administrator."
            }
        } else {
            OK ("PostgreSQL service already running (" + $pgService.Name + ")")
            $pgStarted = $true
        }
    }
}

if (-not $pgStarted) {
    Warn "Could not start PostgreSQL automatically."
    Write-Host "     If using Docker: make sure Docker Desktop is running." -ForegroundColor DarkGray
    Write-Host "     If using native PG: start the PostgreSQL service manually." -ForegroundColor DarkGray
    Write-Host "     Will attempt to connect anyway..." -ForegroundColor DarkGray
}

# Wait until PG accepts connections (30 s timeout) using db-util ping
Write-Host "  Waiting for PostgreSQL..." -ForegroundColor DarkGray
$pgReady = $false
$dbMissing = $false
for ($i = 1; $i -le 30; $i++) {
    $r = Invoke-DBUtil @("ping")
    if ($r.Exit -eq 0) { $pgReady = $true; break }
    if ($r.Exit -eq 2) { $pgReady = $true; $dbMissing = $true; break }  # PG up, DB not created yet
    Start-Sleep -Seconds 1
}
if (-not $pgReady) { Fail "PostgreSQL did not become ready in 30 seconds. Check DATABASE_URL in .env.local" }
OK "PostgreSQL is accepting connections"

# -- 5. Create database if missing ---------------------------------------------
Step "Ensuring database exists"

# Extract DB name from URL
if ($dbUrl -match "/([^/?]+)(\?|$)") {
    $dbName = $Matches[1]
} else {
    $dbName = "tripplanner"
}

$r = Invoke-DBUtil @("create-db", $dbName)
if ($r.Exit -ne 0) {
    Fail ("Could not create database '" + $dbName + "': " + $r.Output)
}
if ($r.Output -eq "created") {
    OK ("Database '" + $dbName + "' created")
} else {
    OK ("Database '" + $dbName + "' already exists")
}

# -- 6. Apply schemas ----------------------------------------------------------
if (-not $SkipSchema) {
    Step "Applying database schemas"

    foreach ($schemaName in @("schema.sql", "schema-phase-e.sql")) {
        $schemaPath = Join-Path $ROOT $schemaName
        if (Test-Path $schemaPath) {
            $r = Invoke-DBUtil @("run-file", $schemaPath)
            if ($r.Exit -ne 0) {
                Fail ("Schema failed: " + $schemaName + " -- " + $r.Output)
            }
            OK ("Applied " + $schemaName + " (" + $r.Output + ")")
        } else {
            Warn ($schemaName + " not found -- skipping")
        }
    }
} else {
    Warn "Schema application skipped (-SkipSchema)"
}

# -- 7. Launch vercel dev ------------------------------------------------------
Step "Starting vercel dev"

Write-Host ""
Write-Host "  App : http://localhost:3000" -ForegroundColor Green
Write-Host "  API : http://localhost:3000/api" -ForegroundColor Green
Write-Host ""

if ($SameWindow) {
    Set-Location $ROOT
    vercel dev
} else {
    Start-Process powershell.exe -WorkingDirectory $ROOT -ArgumentList @(
        "-NoExit",
        "-Command",
        "Write-Host 'Trip Planner dev server' -ForegroundColor Magenta; vercel dev"
    )
    OK "vercel dev launched in a new terminal window"
    Write-Host ""
    Write-Host "  To stop: .\scripts\dev-stop.ps1" -ForegroundColor DarkGray
    Write-Host ""
}
