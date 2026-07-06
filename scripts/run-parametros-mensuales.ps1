param(
  [Parameter(Mandatory = $true)]
  [string]$Periodo,

  [string]$PythonProjectPath = "..\Python",

  [string]$DbUrl = "",

  [switch]$ApplySql,

  [switch]$RunValidations,

  [switch]$Force
)

$ErrorActionPreference = "Stop"

function Fail($Message) {
  Write-Host "ERROR: $Message" -ForegroundColor Red
  exit 1
}

function Resolve-ExistingPath($PathValue, $Label) {
  $resolved = Resolve-Path -LiteralPath $PathValue -ErrorAction SilentlyContinue
  if (-not $resolved) {
    Fail "$Label no existe: $PathValue"
  }
  return $resolved.Path
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

function Test-ColumnExists($DatabaseUrl, $TableName, $ColumnName) {
  $safeTable = $TableName.Replace("'", "''")
  $safeColumn = $ColumnName.Replace("'", "''")
  $sql = "select exists(select 1 from information_schema.columns where table_schema = 'public' and table_name = '$safeTable' and column_name = '$safeColumn');"
  $value = Invoke-PsqlScalar $DatabaseUrl $sql
  return $value -eq "t"
}

function Get-CountByColumn($DatabaseUrl, $TableName, $ColumnName, $Period) {
  if (-not (Test-TableExists $DatabaseUrl $TableName)) {
    return $null
  }
  if (-not (Test-ColumnExists $DatabaseUrl $TableName $ColumnName)) {
    return $null
  }
  $safePeriod = $Period.Replace("'", "''")
  $sql = "select count(*) from public.$TableName where $ColumnName = '$safePeriod';"
  return [int](Invoke-PsqlScalar $DatabaseUrl $sql)
}

function Get-PeriodState($DatabaseUrl, $Period) {
  if (-not (Test-TableExists $DatabaseUrl "periodo_remuneracion")) {
    return $null
  }
  if (-not (Test-ColumnExists $DatabaseUrl "periodo_remuneracion" "codigo")) {
    return $null
  }
  if (-not (Test-ColumnExists $DatabaseUrl "periodo_remuneracion" "estado")) {
    return $null
  }
  $safePeriod = $Period.Replace("'", "''")
  $sql = "select coalesce(estado, '') from public.periodo_remuneracion where codigo = '$safePeriod' limit 1;"
  $value = Invoke-PsqlScalar $DatabaseUrl $sql
  if ([string]::IsNullOrWhiteSpace($value)) {
    return $null
  }
  return $value
}

if ($Periodo -notmatch '^\d{4}-(0[1-9]|1[0-2])$') {
  Fail "Periodo invalido. Usa formato YYYY-MM, por ejemplo 2026-05."
}

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$pythonRoot = Resolve-ExistingPath $PythonProjectPath "PythonProjectPath"
$runner = Join-Path $pythonRoot "00_ejecutar_flujo_parametros_v611.py"
if (-not (Test-Path -LiteralPath $runner)) {
  Fail "No se encontro el runner Python v6.11: $runner"
}

$venvPython = Join-Path $pythonRoot ".venv\Scripts\python.exe"
if (Test-Path -LiteralPath $venvPython) {
  $pythonExe = $venvPython
} else {
  $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
  if (-not $pythonCommand) {
    Fail "No se encontro Python. Activa el entorno Python o instala Python antes de ejecutar el flujo."
  }
  $pythonExe = $pythonCommand.Source
}

$resolvedDbUrl = $DbUrl
if ([string]::IsNullOrWhiteSpace($resolvedDbUrl)) {
  $resolvedDbUrl = $env:SUPABASE_DB_URL_LOCAL
}
if ([string]::IsNullOrWhiteSpace($resolvedDbUrl)) {
  $resolvedDbUrl = $env:DATABASE_URL
}
if ([string]::IsNullOrWhiteSpace($resolvedDbUrl)) {
  $resolvedDbUrl = $env:SUPABASE_DB_URL
}

Write-Host "Flujo seguro de parametros mensuales"
Write-Host "Periodo    : $Periodo"
Write-Host "Python root: $pythonRoot"
Write-Host "Python exe : $pythonExe"
Write-Host "Runner     : $runner"

$runnerArgs = @(
  "-B",
  $runner,
  "--periodo",
  $Periodo,
  "--modo",
  "full",
  "--base-dir",
  $pythonRoot
)

Write-Host ""
Write-Host "Generando SQL mensual..."
& $pythonExe @runnerArgs
if ($LASTEXITCODE -ne 0) {
  Fail "El runner Python no pudo generar la carga mensual. Revisa los logs bajo Python/runs/$Periodo/logs."
}

$sqlPath = Join-Path $pythonRoot "runs\$Periodo\mensual\parametros_mensuales_${Periodo}_v611.sql"
if (-not (Test-Path -LiteralPath $sqlPath)) {
  Fail "No se encontro el SQL mensual esperado: $sqlPath"
}

Write-Host ""
Write-Host "SQL generado:"
Write-Host $sqlPath

if (-not $ApplySql) {
  Write-Host ""
  Write-Host "No se aplico SQL. Usa -ApplySql para aplicar en una BD revisada."
  exit 0
}

if ([string]::IsNullOrWhiteSpace($resolvedDbUrl)) {
  Fail "Para aplicar SQL usa -DbUrl o define SUPABASE_DB_URL_LOCAL, DATABASE_URL o SUPABASE_DB_URL."
}

Write-Host ""
Write-Host "Prevalidando datos existentes del periodo..."

$officialExisting = New-Object System.Collections.Generic.List[string]
$clientExisting = New-Object System.Collections.Generic.List[string]
$estadoPeriodo = Get-PeriodState $resolvedDbUrl $Periodo
$periodoCerradoOCorregido = ($estadoPeriodo -eq "cerrado" -or $estadoPeriodo -eq "corregido")

$tables = @(
  @{ Name = "parametros_generales"; Column = "periodo"; Label = "parametros_generales" },
  @{ Name = "parametros_legales"; Column = "periodo"; Label = "parametros_legales" },
  @{ Name = "tramo_carga"; Column = "periodo"; Label = "tramo_carga" },
  @{ Name = "tramo_impuesto"; Column = "periodo"; Label = "tramo_impuesto" },
  @{ Name = "tabla_impuesto_unico"; Column = "periodo"; Label = "tabla_impuesto_unico" },
  @{ Name = "afp_vigencia"; Column = "periodo"; Label = "afp_vigencia" },
  @{ Name = "afc_parametro"; Column = "periodo"; Label = "afc_parametro" },
  @{ Name = "ley_16744_parametros"; Column = "periodo"; Label = "ley_16744_parametros" },
  @{ Name = "ips_ex_caja_tasa_basica"; Column = "periodo"; Label = "ips_ex_caja_tasa_basica" }
)

foreach ($table in $tables) {
  try {
    $count = Get-CountByColumn $resolvedDbUrl $table.Name $table.Column $Periodo
    if ($null -ne $count -and $count -gt 0) {
      $officialExisting.Add("$($table.Label): $count registros")
    }
  } catch {
    Write-Host "Aviso: no se pudo revisar $($table.Label). Se continua con el resto."
  }
}

try {
  $clienteCount = Get-CountByColumn $resolvedDbUrl "parametros_generales_cliente" "periodo" $Periodo
  if ($null -ne $clienteCount -and $clienteCount -gt 0) {
    $clientExisting.Add("parametros_generales_cliente: $clienteCount registros")
  }
} catch {
  Write-Host "Aviso: no se pudo revisar parametros_generales_cliente. Se continua con el resto."
}

if ($estadoPeriodo) {
  Write-Host ""
  Write-Host "Estado del periodo:"
  Write-Host "- periodo_remuneracion: estado $estadoPeriodo"
}

if ($officialExisting.Count -gt 0) {
  Write-Host ""
  Write-Host "Datos oficiales existentes del periodo:"
  foreach ($item in $officialExisting) {
    Write-Host "- $item"
  }
  Write-Host ""
  Write-Host "La carga mensual oficial puede actualizar o reemplazar este snapshot oficial."
}

if ($clientExisting.Count -gt 0) {
  Write-Host ""
  Write-Host "Configuracion cliente existente:"
  foreach ($item in $clientExisting) {
    Write-Host "- $item"
  }
  Write-Host ""
  Write-Host "La carga mensual oficial no deberia modificar esta tabla."
  Write-Host "Si despues de aplicar oficiales existen diferencias, revisa la reconciliacion desde Parametros."
}

if ($periodoCerradoOCorregido) {
  Write-Host ""
  Write-Host "Advertencia fuerte: este periodo esta $estadoPeriodo. No se recomienda aplicar una carga mensual directa."
}

$requiresForce = ($officialExisting.Count -gt 0) -or $periodoCerradoOCorregido

if ($requiresForce) {

  if (-not $Force) {
    Write-Host ""
    Write-Host "No se aplico SQL."
    Write-Host "Se detectaron datos oficiales existentes o un estado de periodo sensible."
    Write-Host "Vuelve a ejecutar con -Force solo si confirmas actualizar el snapshot oficial."
    Write-Host "La configuracion cliente no deberia ser modificada por la carga oficial."
    exit 2
  }

  Write-Host ""
  Write-Host "-Force recibido: se aplicara SQL bajo responsabilidad operativa sobre el snapshot oficial."
} else {
  if ($clientExisting.Count -gt 0) {
    Write-Host ""
    Write-Host "No se detectaron datos oficiales existentes que exijan -Force."
  } else {
    Write-Host "No se detectaron datos existentes para $Periodo en las tablas oficiales revisadas."
  }
}

Write-Host ""
Write-Host "Aplicando SQL mensual..."
& psql $resolvedDbUrl -v ON_ERROR_STOP=1 -f $sqlPath
if ($LASTEXITCODE -ne 0) {
  Fail "psql fallo al aplicar el SQL mensual."
}

if ($RunValidations) {
  $validations = Join-Path $repoRoot "bd\base\v11\partes\90_validaciones_v11.sql"
  if (-not (Test-Path -LiteralPath $validations)) {
    Fail "No se encontro el archivo de validaciones v11: $validations"
  }
  Write-Host ""
  Write-Host "Ejecutando validaciones v11..."
  & psql $resolvedDbUrl -v ON_ERROR_STOP=1 -f $validations
  if ($LASTEXITCODE -ne 0) {
    Fail "Las validaciones v11 fallaron."
  }
}

Write-Host ""
Write-Host "Carga mensual finalizada."
