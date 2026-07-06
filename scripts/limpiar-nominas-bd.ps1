param(
  [string]$Periodo = "",

  [string]$DbUrl = "",

  [switch]$Force,

  [switch]$TodosLosPeriodos
)

$ErrorActionPreference = "Stop"

function Fail($Message) {
  Write-Host "ERROR: $Message" -ForegroundColor Red
  exit 1
}

function Invoke-PsqlScalar($DatabaseUrl, $Sql) {
  $output = & psql $DatabaseUrl -v ON_ERROR_STOP=1 -At -c $Sql 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw ($output -join [Environment]::NewLine)
  }
  return (($output | Select-Object -First 1) -as [string]).Trim()
}

function Test-TableExists($DatabaseUrl, $TableName) {
  $safe = $TableName.Replace("'", "''")
  $value = Invoke-PsqlScalar $DatabaseUrl "select to_regclass('public.$safe') is not null;"
  return $value -eq "t"
}

function Get-Count($DatabaseUrl, $Table, $PeriodColumn, $Period) {
  if (-not (Test-TableExists $DatabaseUrl $Table)) {
    return $null
  }
  $safeTable = $Table
  if (-not [string]::IsNullOrWhiteSpace($Period)) {
    $safePeriod = $Period.Replace("'", "''")
    $sql = "select count(*)::text from public.$safeTable where $PeriodColumn = '$safePeriod';"
  } else {
    $sql = "select count(*)::text from public.$safeTable;"
  }
  return [int](Invoke-PsqlScalar $DatabaseUrl $sql)
}

function Get-ParametrosCongeladosCount($DatabaseUrl, $Period) {
  if (-not (Test-TableExists $DatabaseUrl "nomina_calculo_parametro")) {
    return $null
  }
  if (-not (Test-TableExists $DatabaseUrl "nomina_calculo_periodo")) {
    $sql = "select count(*)::text from public.nomina_calculo_parametro;"
    return [int](Invoke-PsqlScalar $DatabaseUrl $sql)
  }
  if (-not [string]::IsNullOrWhiteSpace($Period)) {
    $safePeriod = $Period.Replace("'", "''")
    $sql = @"
select count(*)::text
from public.nomina_calculo_parametro p
join public.nomina_calculo_periodo c on c.id_calculo_periodo = p.id_calculo_periodo
where c.periodo = '$safePeriod';
"@
  } else {
    $sql = "select count(*)::text from public.nomina_calculo_parametro;"
  }
  return [int](Invoke-PsqlScalar $DatabaseUrl $sql)
}

function Get-MovimientosNominaCount($DatabaseUrl, $Period) {
  if (-not (Test-TableExists $DatabaseUrl "movimiento_nomina")) {
    return $null
  }
  if (-not (Test-TableExists $DatabaseUrl "nomina_periodo")) {
    return Get-Count $DatabaseUrl "movimiento_nomina" "" $Period
  }
  if ([string]::IsNullOrWhiteSpace($Period)) {
    $sql = "select count(*)::text from public.movimiento_nomina;"
  } else {
    $safePeriod = $Period.Replace("'", "''")
    $sql = @"
select count(*)::text
from public.movimiento_nomina m
join public.nomina_periodo n on n.id = m.id_nomina_periodo
where n.periodo = '$safePeriod';
"@
  }
  return [int](Invoke-PsqlScalar $DatabaseUrl $sql)
}

function Get-ConsolidacionCount($DatabaseUrl, $Period) {
  if (-not (Test-TableExists $DatabaseUrl "nomina_consolidacion")) {
    return $null
  }
  if (-not (Test-TableExists $DatabaseUrl "nomina_periodo")) {
    return Get-Count $DatabaseUrl "nomina_consolidacion" "" $Period
  }
  if ([string]::IsNullOrWhiteSpace($Period)) {
    $sql = "select count(*)::text from public.nomina_consolidacion;"
  } else {
    $safePeriod = $Period.Replace("'", "''")
    $sql = @"
select count(*)::text
from public.nomina_consolidacion c
where exists (
  select 1 from public.nomina_periodo n
  where n.periodo = '$safePeriod'
    and (n.id = c.id_nomina_origen or n.id = c.id_nomina_destino)
);
"@
  }
  return [int](Invoke-PsqlScalar $DatabaseUrl $sql)
}

if ($TodosLosPeriodos) {
  $Periodo = ""
}

if (-not [string]::IsNullOrWhiteSpace($Periodo) -and $Periodo -notmatch '^\d{4}-(0[1-9]|1[0-2])$') {
  Fail "Periodo invalido. Usa YYYY-MM, -TodosLosPeriodos, o deja vacio con -TodosLosPeriodos."
}

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
  Fail "Define SUPABASE_DB_URL, SUPABASE_DB_URL_LOCAL o DATABASE_URL (o pasa -DbUrl)."
}

$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
  Fail "No se encontro psql en PATH. Instala PostgreSQL client."
}

$sqlPath = Join-Path $PSScriptRoot "..\bd\scripts\limpiar-nominas-mensuales.sql"
if (-not (Test-Path -LiteralPath $sqlPath)) {
  Fail "No existe $sqlPath"
}

$scopeLabel = if ([string]::IsNullOrWhiteSpace($Periodo)) { "TODOS los periodos" } else { "periodo $Periodo" }

Write-Host ""
Write-Host "Limpieza nómina mensual en BD" -ForegroundColor Cyan
Write-Host "Alcance    : $scopeLabel"
Write-Host "Tablas     : nomina_liquidacion_*, nomina_calculo_*, nomina_periodo (+ segmentos/movimientos), consolidacion, diagnostico"
Write-Host ""

$before = @{
  Snapshots = Get-Count $resolvedDbUrl "nomina_calculo_periodo" "periodo" $Periodo
  ParametrosCongelados = Get-ParametrosCongeladosCount $resolvedDbUrl $Periodo
  Liquidaciones = Get-Count $resolvedDbUrl "nomina_liquidacion_periodo" "periodo" $Periodo
  Nominas = Get-Count $resolvedDbUrl "nomina_periodo" "periodo" $Periodo
  Movimientos = Get-MovimientosNominaCount $resolvedDbUrl $Periodo
  Consolidaciones = Get-ConsolidacionCount $resolvedDbUrl $Periodo
}
$before.Diagnostico = Get-Count $resolvedDbUrl "nomina_periodo_diagnostico" "periodo" $Periodo

Write-Host "Antes:"
Write-Host "  nomina_calculo_periodo      : $($before.Snapshots)"
if ($null -ne $before.ParametrosCongelados) {
  Write-Host "  nomina_calculo_parametro    : $($before.ParametrosCongelados) (parametros congelados)"
}
Write-Host "  nomina_liquidacion_periodo  : $($before.Liquidaciones)"
Write-Host "  nomina_periodo              : $($before.Nominas)"
if ($null -ne $before.Movimientos) {
  Write-Host "  movimiento_nomina           : $($before.Movimientos)"
}
if ($null -ne $before.Consolidaciones) {
  Write-Host "  nomina_consolidacion        : $($before.Consolidaciones)"
}
if ($null -ne $before.Diagnostico) {
  Write-Host "  nomina_periodo_diagnostico  : $($before.Diagnostico)"
}

$diagBefore = if ($null -ne $before.Diagnostico) { $before.Diagnostico } else { 0 }
$paramBefore = if ($null -ne $before.ParametrosCongelados) { $before.ParametrosCongelados } else { 0 }
$movBefore = if ($null -ne $before.Movimientos) { $before.Movimientos } else { 0 }
$consBefore = if ($null -ne $before.Consolidaciones) { $before.Consolidaciones } else { 0 }
$nominasBefore = if ($null -ne $before.Nominas) { $before.Nominas } else { 0 }
if ($before.Snapshots -eq 0 -and $before.Liquidaciones -eq 0 -and $diagBefore -eq 0 -and $paramBefore -eq 0 -and $nominasBefore -eq 0 -and $movBefore -eq 0 -and $consBefore -eq 0) {
  Write-Host ""
  Write-Host "No hay registros de nomina mensual en ese alcance. Nada que limpiar." -ForegroundColor Yellow
  exit 0
}

if (-not $Force) {
  Write-Host ""
  Write-Host "Esta operacion BORRA datos de nomina en la BD. No se puede deshacer." -ForegroundColor Yellow
  $confirm = Read-Host "Escribe SI para continuar"
  if ($confirm -ne "SI") {
    Write-Host "Cancelado."
    exit 0
  }
}

$periodoArg = if ([string]::IsNullOrWhiteSpace($Periodo)) { "" } else { $Periodo }
& psql $resolvedDbUrl -v ON_ERROR_STOP=1 -v "periodo=$periodoArg" -f $sqlPath
if ($LASTEXITCODE -ne 0) {
  Fail "Fallo la ejecucion SQL. Revisa el mensaje de psql arriba."
}

if (-not (Test-TableExists $resolvedDbUrl "nomina_periodo_diagnostico")) {
  Write-Host "  (nomina_periodo_diagnostico no existe en esquema; omitido)" -ForegroundColor Yellow
}
if (-not (Test-TableExists $resolvedDbUrl "nomina_calculo_parametro")) {
  Write-Host "  (nomina_calculo_parametro no existe en esquema; omitido)" -ForegroundColor Yellow
}

$after = @{
  Snapshots = Get-Count $resolvedDbUrl "nomina_calculo_periodo" "periodo" $Periodo
  ParametrosCongelados = Get-ParametrosCongeladosCount $resolvedDbUrl $Periodo
  Liquidaciones = Get-Count $resolvedDbUrl "nomina_liquidacion_periodo" "periodo" $Periodo
  Nominas = Get-Count $resolvedDbUrl "nomina_periodo" "periodo" $Periodo
  Movimientos = Get-MovimientosNominaCount $resolvedDbUrl $Periodo
  Consolidaciones = Get-ConsolidacionCount $resolvedDbUrl $Periodo
}
$after.Diagnostico = Get-Count $resolvedDbUrl "nomina_periodo_diagnostico" "periodo" $Periodo

Write-Host ""
Write-Host "Despues:" -ForegroundColor Green
Write-Host "  nomina_calculo_periodo      : $($after.Snapshots)"
if ($null -ne $after.ParametrosCongelados) {
  Write-Host "  nomina_calculo_parametro    : $($after.ParametrosCongelados) (parametros congelados)"
}
Write-Host "  nomina_liquidacion_periodo  : $($after.Liquidaciones)"
Write-Host "  nomina_periodo              : $($after.Nominas)"
if ($null -ne $after.Movimientos) {
  Write-Host "  movimiento_nomina           : $($after.Movimientos)"
}
if ($null -ne $after.Consolidaciones) {
  Write-Host "  nomina_consolidacion        : $($after.Consolidaciones)"
}
if ($null -ne $after.Diagnostico) {
  Write-Host "  nomina_periodo_diagnostico  : $($after.Diagnostico)"
}
Write-Host ""
Write-Host "Listo. Recarga la pantalla de Nómina mensual en el ERP." -ForegroundColor Green
