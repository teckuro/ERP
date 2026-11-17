# Regenera todos los SQL mensuales v6.11 desde runs/**/mensual/*.json
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$python = $null
foreach ($candidate in @(
        "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
        "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
        "$env:USERPROFILE\.local\bin\python3.14.exe",
        "python3",
        "python"
    )) {
    if ($candidate -and (Get-Command $candidate -ErrorAction SilentlyContinue)) {
        $python = (Get-Command $candidate).Source
        break
    }
}
if (-not $python) {
    throw "No se encontro Python. Instala Python o agrega python al PATH."
}
Set-Location $root
& $python "04_render_parametros_mensuales_v611_sql_full.py" --regenerar-runs @args
