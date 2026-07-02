# Auditoría estática vs docs/codex/estandares (EST-001…008)
# Uso: ./scripts/auditar-estandares-desviaciones.ps1
# Exit 0 siempre (informa; no bloquea CI salvo -FailOnP1)

param(
  [switch]$FailOnP1
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$migrations = Join-Path $repoRoot "supabase/migrations"
$features = Join-Path $repoRoot "src/app/features"

function Count-Matches {
  param([string]$Path, [string]$Pattern, [string[]]$Glob = @("*.sql"))
  if (-not (Test-Path $Path)) { return 0 }
  $total = 0
  foreach ($g in $Glob) {
    $files = Get-ChildItem -Path $Path -Recurse -File -Filter $g -ErrorAction SilentlyContinue
    foreach ($f in $files) {
      $m = Select-String -Path $f.FullName -Pattern $Pattern -AllMatches -ErrorAction SilentlyContinue
      if ($m) { $total += ($m | ForEach-Object { $_.Matches.Count } | Measure-Object -Sum).Sum }
    }
  }
  return $total
}

function Count-Files {
  param([string]$Path, [string]$Pattern)
  if (-not (Test-Path $Path)) { return 0 }
  return @(Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match $Pattern }).Count
}

Write-Host "=== Auditoría EST (baseline constitución técnica) ===" -ForegroundColor Cyan
Write-Host "Repo: $repoRoot`n"

$checks = @(
  @{
    Id = "EST-DB-01"
    Tier = "Legacy"
    Label = "Índices ux_ (legacy; nuevo: uq_/ix_)"
    Value = (Count-Matches -Path $migrations -Pattern "\bux_")
  },
  @{
    Id = "EST-DB-02"
    Tier = "Legacy"
    Label = "Triggers trg_ (legacy; nuevo: tg_)"
    Value = (Count-Matches -Path $migrations -Pattern "\btrg_")
  },
  @{
    Id = "EST-DB-03"
    Tier = "Legacy"
    Label = "Triggers tr_ (legacy; nuevo: tg_)"
    Value = (Count-Matches -Path $migrations -Pattern "\btr_")
  },
  @{
    Id = "EST-DB-04"
    Tier = "P1"
    Label = "Policies FOR ALL (*_all) en migraciones"
    Value = (Count-Matches -Path $migrations -Pattern "policy \w+_all on")
  },
  @{
    Id = "EST-DB-05"
    Tier = "Info"
    Label = "RPC listar_/obtener_/guardar_/confirmar_ (conforme)"
    Value = (Count-Matches -Path $migrations -Pattern "function public\.(listar_|obtener_|guardar_|confirmar_)")
  },
  @{
    Id = "EST-DB-06"
    Tier = "Review"
    Label = "grant to anon en migraciones (revisar superseded)"
    Value = (Count-Matches -Path $migrations -Pattern "grant .+ to anon")
  },
  @{
    Id = "EST-TS-01"
    Tier = "P2"
    Label = "Database['public']['Tables'] fuera de data-access/mappers"
    Value = (Count-Matches -Path $features -Pattern "Database\['public'\]\['Tables'\]" -Glob @("*.ts"))
  },
  @{
    Id = "EST-TS-02"
    Tier = "P2"
    Label = "Símbolos Payroll/Employee (inglés residual)"
    Value = (Count-Matches -Path $features -Pattern "\b(Payroll[A-Z]|Employee[A-Z]|buildPayroll)" -Glob @("*.ts"))
  },
  @{
    Id = "EST-TS-03"
    Tier = "P2"
    Label = "Archivos *.util.ts / *.helpers.ts"
    Value = (Count-Files -Path $features -Pattern "\.(util|helpers)\.ts$")
  },
  @{
    Id = "EST-NG-01"
    Tier = "Info"
    Label = "injectSupabase en components/pasos (debe ser ~0)"
    Value = (Count-Matches -Path $features -Pattern "injectSupabase" -Glob @("*component*.ts"))
  }
)

$p1Hits = 0
foreach ($c in $checks) {
  $color = switch ($c.Tier) {
    "P1" { if ($c.Value -gt 0) { $script:p1Hits++; "Yellow" } else { "Green" }; break }
    "P2" { "DarkYellow"; break }
    "Legacy" { "Gray"; break }
    default { "White" }
  }
  Write-Host ("[{0}] {1,-55} {2,4}  ({3})" -f $c.Id, $c.Label, $c.Value, $c.Tier) -ForegroundColor $color
}

Write-Host "`nDocumento: docs/codex/auditorias/auditoria-estandares-desviaciones-2026-07.md"
Write-Host "Backlog P1 RLS: BKL-12 (policies *_all -> por operación)`n"

if ($FailOnP1 -and $p1Hits -gt 0) {
  Write-Host "FAIL: hallazgos P1 pendientes ($p1Hits checks)" -ForegroundColor Red
  exit 1
}

Write-Host "OK: reporte generado (legacy esperado; ver auditoría para priorización)." -ForegroundColor Green
exit 0
