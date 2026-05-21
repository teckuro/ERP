param([string]$DbUrl = "")

$ErrorActionPreference = "Stop"

function Resolve-DbUrlFromDotEnv {
  $envPath = Join-Path $PSScriptRoot "..\.env"
  if (-not (Test-Path -LiteralPath $envPath)) { return $null }
  $remote = $null
  $local = $null
  foreach ($line in Get-Content $envPath) {
    if ($line -match '^\s*SUPABASE_DB_URL\s*=' -and $line -notmatch '^\s*#') {
      $remote = ($line.Split('=', 2)[1]).Trim().Trim('"').Trim("'")
    }
    if ($line -match '^\s*SUPABASE_DB_URL_LOCAL\s*=' -and $line -notmatch '^\s*#') {
      $local = ($line.Split('=', 2)[1]).Trim().Trim('"').Trim("'")
    }
  }
  if (-not [string]::IsNullOrWhiteSpace($remote)) { return $remote }
  return $local
}

$resolvedDbUrl = $DbUrl
if ([string]::IsNullOrWhiteSpace($resolvedDbUrl)) { $resolvedDbUrl = $env:SUPABASE_DB_URL }
if ([string]::IsNullOrWhiteSpace($resolvedDbUrl)) { $resolvedDbUrl = $env:DATABASE_URL }
if ([string]::IsNullOrWhiteSpace($resolvedDbUrl)) { $resolvedDbUrl = $env:SUPABASE_DB_URL_LOCAL }
if ([string]::IsNullOrWhiteSpace($resolvedDbUrl)) { $resolvedDbUrl = Resolve-DbUrlFromDotEnv }

if ([string]::IsNullOrWhiteSpace($resolvedDbUrl)) {
  Write-Host "ERROR: Define SUPABASE_DB_URL en .env o pasa -DbUrl" -ForegroundColor Red
  exit 1
}

$sqlPath = Join-Path $PSScriptRoot "..\bd\scripts\validar-esquema-nomina-mensual.sql"
& psql $resolvedDbUrl -v ON_ERROR_STOP=1 -f $sqlPath
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Si las secciones Tablas/RPC no devolvieron filas, el esquema nomina mensual esta completo." -ForegroundColor Green
