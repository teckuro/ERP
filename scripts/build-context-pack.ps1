param(
  [string]$OutputPath = "tmp/context-pack.zip",
  [string[]]$ExtraFiles = @(),
  [switch]$IncludeEmpleadoAdvanced,
  [switch]$IncludeShellNoia,
  [switch]$IncludeNomina,
  [switch]$IncludeMovimientos,
  [switch]$IncludeParametros
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$stageRoot = Join-Path $repoRoot "tmp/context-pack-stage"
$outputFullPath = if ([System.IO.Path]::IsPathRooted($OutputPath)) { $OutputPath } else { Join-Path $repoRoot $OutputPath }

function Add-RelativeFile {
  param(
    [Parameter(Mandatory = $true)][string]$RelativePath,
    [Parameter(Mandatory = $true)][System.Collections.Generic.List[string]]$Collector
  )

  $normalized = $RelativePath.Replace("/", [System.IO.Path]::DirectorySeparatorChar).Replace("\", [System.IO.Path]::DirectorySeparatorChar)
  $fullPath = Join-Path $repoRoot $normalized

  if (Test-Path $fullPath -PathType Leaf) {
    if (-not $Collector.Contains($RelativePath)) {
      $Collector.Add($RelativePath) | Out-Null
    }
  }
}

function Add-RelativeDirectoryFiles {
  param(
    [Parameter(Mandatory = $true)][string]$RelativeDirectory,
    [Parameter(Mandatory = $true)][System.Collections.Generic.List[string]]$Collector,
    [string[]]$Include = @("*.md", "*.mdc")
  )

  $normalized = $RelativeDirectory.Replace("/", [System.IO.Path]::DirectorySeparatorChar).Replace("\", [System.IO.Path]::DirectorySeparatorChar)
  $fullDirectory = Join-Path $repoRoot $normalized

  if (-not (Test-Path $fullDirectory -PathType Container)) {
    return
  }

  foreach ($pattern in $Include) {
    Get-ChildItem -Path $fullDirectory -Recurse -File -Filter $pattern | ForEach-Object {
      $relative = [System.IO.Path]::GetRelativePath($repoRoot, $_.FullName).Replace("\", "/")
      if (-not $Collector.Contains($relative)) {
        $Collector.Add($relative) | Out-Null
      }
    }
  }
}

$files = [System.Collections.Generic.List[string]]::new()

# Núcleo mínimo para tareas Cursor/Codex.
$coreFiles = @(
  "README.md",
  "package.json",
  "angular.json",
  "docs/codex/contexto-rapido.md",
  "docs/codex/AGENTS.md",
  "docs/codex/README.md",
  "docs/codex/CHANGELOG.md",
  "docs/codex/orquestador/contexto-proyecto.md",
  "docs/codex/orquestador/estado-fases.md",
  "docs/codex/peticiones-estilos.md",
  "docs/codex/arquitectura/frontend-interfaces.md",
  "docs/codex/ui-form-guidelines.md",
  "docs/codex/ui-button-guidelines.md",
  "docs/codex/ui-tables.md",
  "docs/codex/estilos/README.md",
  "docs/codex/diseno/bitacora-operativa-noia.md",
  "docs/codex/diseno/erp-shell-bitacora-operativa-01.md",
  ".cursor/rules/erp-codex-contract.mdc",
  ".cursor/rules/erp-orquestador.mdc",
  ".cursor/rules/erp-ui-noia.mdc",
  ".cursor/rules/erp-protected-files.mdc",
  ".cursor/skills/erp-codex-docs/SKILL.md"
)

foreach ($file in $coreFiles) {
  Add-RelativeFile -RelativePath $file -Collector $files
}

if ($IncludeEmpleadoAdvanced) {
  $empleadosFiles = @(
    "docs/codex/modulos/empleados/README.md",
    "docs/codex/modulos/empleados/creacion-avanzada.md",
    "docs/codex/modulos/empleados/emp-adv-css-budget-reduce-01.md",
    "src/app/features/empleados/pages/form-empleado/form-empleado.ts",
    "src/app/features/empleados/pages/form-empleado/form-empleado.html",
    "src/app/features/empleados/pages/form-empleado/form-empleado.css",
    "src/app/features/empleados/pages/form-empleado/form-empleado.wizard.css",
    "src/app/features/empleados/pages/form-empleado/form-empleado.feedback.css"
  )
  foreach ($file in $empleadosFiles) {
    Add-RelativeFile -RelativePath $file -Collector $files
  }
}

if ($IncludeShellNoia) {
  $shellFiles = @(
    "docs/codex/diseno/erp-shell-bitacora-operativa-01.md",
    "src/app/layout/layout-shell/layout-shell.ts",
    "src/app/layout/layout-shell/layout-shell.html",
    "src/app/layout/layout-shell/layout-shell.css",
    "src/app/layout/header/header.ts",
    "src/app/layout/header/header.html",
    "src/app/layout/header/header.css",
    "src/app/layout/sidebar/sidebar.ts",
    "src/app/layout/sidebar/sidebar.html",
    "src/app/layout/sidebar/sidebar.css"
  )
  foreach ($file in $shellFiles) {
    Add-RelativeFile -RelativePath $file -Collector $files
  }
}

if ($IncludeNomina) {
  Add-RelativeDirectoryFiles -RelativeDirectory "docs/codex/modulos/nomina-mensual" -Collector $files
}

if ($IncludeMovimientos) {
  Add-RelativeDirectoryFiles -RelativeDirectory "docs/codex/modulos/movimientos-variables" -Collector $files
  Add-RelativeDirectoryFiles -RelativeDirectory "docs/codex/modulos/haberes-descuentos" -Collector $files
}

if ($IncludeParametros) {
  Add-RelativeDirectoryFiles -RelativeDirectory "docs/codex/modulos/parametros" -Collector $files
}

foreach ($file in $ExtraFiles) {
  Add-RelativeFile -RelativePath $file -Collector $files
}

if (Test-Path $stageRoot) {
  Remove-Item $stageRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $stageRoot | Out-Null

foreach ($relative in $files) {
  $source = Join-Path $repoRoot ($relative.Replace("/", [System.IO.Path]::DirectorySeparatorChar))
  $target = Join-Path $stageRoot ($relative.Replace("/", [System.IO.Path]::DirectorySeparatorChar))
  $targetDirectory = Split-Path $target -Parent

  if (-not (Test-Path $targetDirectory)) {
    New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null
  }

  Copy-Item -Path $source -Destination $target -Force
}

$outputDirectory = Split-Path $outputFullPath -Parent
if (-not (Test-Path $outputDirectory)) {
  New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
}

if (Test-Path $outputFullPath) {
  Remove-Item $outputFullPath -Force
}

Compress-Archive -Path (Join-Path $stageRoot "*") -DestinationPath $outputFullPath -Force

Write-Host "Context pack creado: $outputFullPath"
Write-Host "Archivos incluidos: $($files.Count)"
