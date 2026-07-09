# SEC-05: redeploy Edge Functions con CORS restringido (ERP_ALLOWED_ORIGIN).
# Uso:
#   $env:SUPABASE_PROJECT_REF = "<ref>"
#   $env:ERP_ALLOWED_ORIGIN = "https://erp.ejemplo.cl"   # opcional; sin valor = CORS *
#   .\scripts\sec-deploy-edge-cors.ps1

param(
  [string]$ProjectRef = $env:SUPABASE_PROJECT_REF,
  [string]$AllowedOrigin = $env:ERP_ALLOWED_ORIGIN
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
  Write-Error "Instale Supabase CLI (supabase --version)."
}

if (-not $ProjectRef) {
  $refFile = Join-Path $repoRoot "supabase\.temp\project-ref"
  if (Test-Path $refFile) {
    $ProjectRef = (Get-Content $refFile -Raw).Trim()
  }
}
if (-not $ProjectRef) {
  Write-Error "Define SUPABASE_PROJECT_REF o ejecuta supabase link (genera supabase/.temp/project-ref)."
}

if (-not (Test-Path "supabase\.temp\project-ref")) {
  supabase link --project-ref $ProjectRef
}

if ($AllowedOrigin) {
  Write-Host "Configurando ERP_ALLOWED_ORIGIN=$AllowedOrigin"
  supabase secrets set "ERP_ALLOWED_ORIGIN=$AllowedOrigin"
} else {
  Write-Host "ERP_ALLOWED_ORIGIN no definido: las funciones usarán CORS * (modo desarrollo)."
}

Write-Host "Desplegando admin-usuarios..."
supabase functions deploy admin-usuarios

Write-Host "Desplegando licencia-medica-inbound (sin verify JWT)..."
supabase functions deploy licencia-medica-inbound --no-verify-jwt

Write-Host "Desplegando erp-asistente-preguntor (verify JWT)..."
supabase functions deploy erp-asistente-preguntor

Write-Host ""
Write-Host "Listo. Verifique en Dashboard -> Edge Functions -> Secrets -> ERP_ALLOWED_ORIGIN"
Write-Host "Si el asistente usa otro nombre en producción (super-service), redeploy manual desde el dashboard."
