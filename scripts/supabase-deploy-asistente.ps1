# Asistente preguntor: genera supabase/.env (NVIDIA_*) desde Python/.env y opcionalmente sube secrets por CLI.
# Uso: .\scripts\supabase-deploy-asistente.ps1

param(
  [string]$EnvFile = (Join-Path $PSScriptRoot "..\..\Python\.env"),
  [string]$ProjectRef = $env:SUPABASE_PROJECT_REF
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

if (-not $ProjectRef) {
  $refFile = Join-Path $repoRoot "supabase\.temp\project-ref"
  if (Test-Path $refFile) {
    $ProjectRef = (Get-Content $refFile -Raw).Trim()
  }
}
if (-not $ProjectRef) {
  Write-Error "Define SUPABASE_PROJECT_REF o ejecuta supabase link (genera supabase/.temp/project-ref)."
}
$outEnv = Join-Path $repoRoot "supabase\.env"
$envPath = Resolve-Path $EnvFile -ErrorAction SilentlyContinue
if (-not $envPath) {
  Write-Error "No existe: $EnvFile"
}

$vars = @{}
Get-Content $envPath | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith("#")) { return }
  $i = $line.IndexOf("=")
  if ($i -lt 1) { return }
  $key = $line.Substring(0, $i).Trim()
  $val = $line.Substring($i + 1).Trim().Trim('"').Trim("'")
  if ($key -match "^(NVIDIA_API_KEY|NVIDIA_MODEL)$") { $vars[$key] = $val }
}

if (-not $vars["NVIDIA_API_KEY"]) { Write-Error "Falta NVIDIA_API_KEY en $envPath" }
if (-not $vars["NVIDIA_MODEL"]) { $vars["NVIDIA_MODEL"] = "qwen/qwen3.5-122b-a10b" }

@(
  "NVIDIA_API_KEY=$($vars['NVIDIA_API_KEY'])",
  "NVIDIA_MODEL=$($vars['NVIDIA_MODEL'])"
) | Set-Content -Path $outEnv -Encoding utf8

Write-Host "Generado $outEnv (gitignored)."
Write-Host ""
Write-Host "Dashboard: Edge Functions -> Secrets -> NVIDIA_API_KEY y NVIDIA_MODEL"
Write-Host "Pega index.ts desde supabase/functions/erp-asistente-preguntor/ en super-service -> Deploy"
Write-Host "ERP: public/app-config.json -> asistentePreguntorFunction: super-service"
Write-Host ""

if (Get-Command supabase -ErrorAction SilentlyContinue) {
  Set-Location $repoRoot
  if (-not (Test-Path "supabase\.temp\project-ref")) {
    supabase link --project-ref $ProjectRef
  }
  supabase secrets set --env-file $outEnv
  Write-Host "Secrets subidos. Redeploy super-service en el dashboard."
} else {
  Write-Host "Sin Supabase CLI: copia valores de supabase\.env a Secrets en el dashboard."
}
