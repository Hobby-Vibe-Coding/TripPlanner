# =============================================================================
# Trip Planner - Dev Environment Shutdown  (Windows / PowerShell)
# =============================================================================
# Usage: .\scripts\dev-stop.ps1
#        .\scripts\dev-stop.ps1 -StopPostgres   (also stop the PG service)
# =============================================================================

param(
    [switch]$StopPostgres   # also stop the PostgreSQL Windows service
)

$ErrorActionPreference = "SilentlyContinue"
$ROOT = Resolve-Path (Join-Path $PSScriptRoot "..")

function Write-Step  ([string]$msg) { Write-Host "`n> $msg" -ForegroundColor Cyan }
function Write-OK    ([string]$msg) { Write-Host "  OK  $msg" -ForegroundColor Green }
function Write-Warn  ([string]$msg) { Write-Host "  --  $msg" -ForegroundColor Yellow }

Write-Host ""
Write-Host "  Trip Planner - Dev Shutdown" -ForegroundColor Magenta
Write-Host "  -----------------------------------------" -ForegroundColor DarkGray

# -- Stop vercel / node processes ----------------------------------------------
Write-Step "Stopping vercel dev"

# Find node.exe processes running vercel dev (via WMI command line query)
$vercelProcs = @()
try {
    $wmiProcs = Get-WmiObject Win32_Process -Filter "Name='node.exe'"
    foreach ($p in $wmiProcs) {
        if ($p.CommandLine -like "*vercel*") {
            $vercelProcs += $p
        }
    }
} catch {}

if ($vercelProcs.Count -gt 0) {
    foreach ($p in $vercelProcs) {
        try {
            Stop-Process -Id $p.ProcessId -Force
            Write-OK "Stopped process $($p.ProcessId): $($p.CommandLine.Substring(0, [Math]::Min(60, $p.CommandLine.Length)))..."
        } catch {
            Write-Warn "Could not stop process $($p.ProcessId): $_"
        }
    }
} else {
    Write-Warn "No vercel dev process found (may have already been stopped)"
}

# Also close any PowerShell windows that were opened by dev-start.ps1
$psProcs = Get-WmiObject Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue
foreach ($p in ($psProcs | Where-Object { $p.CommandLine -like "*vercel dev*" })) {
    try {
        Stop-Process -Id $p.ProcessId -Force
        Write-OK "Closed dev terminal (pid $($p.ProcessId))"
    } catch {}
}

# -- Optionally stop PostgreSQL -------------------------------------------------
if ($StopPostgres) {
    Write-Step "Stopping PostgreSQL"
    $stopped = $false

    # Try Docker first
    if (Get-Command "docker" -ErrorAction SilentlyContinue) {
        $composeFile = Join-Path $ROOT "docker-compose.yml"
        if (Test-Path $composeFile) {
            Write-Host "  Running docker compose down..." -ForegroundColor DarkGray
            & docker compose -f $composeFile down *>$null
            if ($LASTEXITCODE -eq 0) { Write-OK "PostgreSQL stopped (docker compose down)"; $stopped = $true }
            else { Write-Warn "docker compose down failed" }
        } else {
            $cs = "$((& docker ps --filter "name=^postgres-db$" --format "{{.Status}}" 2>&1))".Trim()
            if ($cs -like "Up*") {
                & docker stop postgres-db *>$null
                Write-OK "Stopped Docker container postgres-db"
                $stopped = $true
            }
        }
    }

    # Fall back to Windows service
    if (-not $stopped) {
        $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($null -ne $pgService) {
            if ($pgService.Status -eq "Running") {
                try {
                    Stop-Service -Name $pgService.Name -Force
                    Write-OK "Stopped $($pgService.Name)"
                } catch {
                    Write-Warn ("Could not stop " + $pgService.Name)
                }
            } else {
                Write-Warn "PostgreSQL service is not running"
            }
        } else {
            Write-Warn "No PostgreSQL Docker container or Windows service found"
        }
    }
} else {
    Write-Host ""
    Write-Host "  PostgreSQL is still running." -ForegroundColor DarkGray
    Write-Host "  To also stop it: .\scripts\dev-stop.ps1 -StopPostgres" -ForegroundColor DarkGray
}

Write-Host ""
Write-OK "Done."
Write-Host ""
