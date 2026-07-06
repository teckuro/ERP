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

function Get-RelativePathCompat {
  param(
    [Parameter(Mandatory = $true)][string]$BasePath,
    [Parameter(Mandatory = $true)][string]$TargetPath
  )

  $baseFull = [System.IO.Path]::GetFullPath($BasePath)
  if (-not $baseFull.EndsWith([System.IO.Path]::DirectorySeparatorChar)) {
    $baseFull += [System.IO.Path]::DirectorySeparatorChar
  }
  $targetFull = [System.IO.Path]::GetFullPath($TargetPath)
  $relativeUri = New-Object System.Uri($baseFull)
  $targetUri = New-Object System.Uri($targetFull)
  return [System.Uri]::UnescapeDataString($relativeUri.MakeRelativeUri($targetUri).ToString()).Replace("\", "/")
}

function Add-RelativeFile {
  param(
    [Parameter(Mandatory = $true)][string]$RelativePath
  )

  $normalized = $RelativePath.Replace("/", [System.IO.Path]::DirectorySeparatorChar).Replace("\", [System.IO.Path]::DirectorySeparatorChar)
  $fullPath = Join-Path $repoRoot $normalized

  if (Test-Path $fullPath -PathType Leaf) {
    if (-not $script:ContextPackFiles.Contains($RelativePath)) {
      [void]$script:ContextPackFiles.Add($RelativePath)
    }
  }
}

function Add-RelativeDirectoryFiles {
  param(
    [Parameter(Mandatory = $true)][string]$RelativeDirectory,
    [string[]]$Include = @("*.md", "*.mdc")
  )

  $normalized = $RelativeDirectory.Replace("/", [System.IO.Path]::DirectorySeparatorChar).Replace("\", [System.IO.Path]::DirectorySeparatorChar)
  $fullDirectory = Join-Path $repoRoot $normalized

  if (-not (Test-Path $fullDirectory -PathType Container)) {
    return
  }

  foreach ($pattern in $Include) {
    Get-ChildItem -Path $fullDirectory -Recurse -File -Filter $pattern | ForEach-Object {
      $relative = Get-RelativePathCompat -BasePath $repoRoot -TargetPath $_.FullName
      if (-not $script:ContextPackFiles.Contains($relative)) {
        [void]$script:ContextPackFiles.Add($relative)
      }
    }
  }
}

$script:ContextPackFiles = New-Object System.Collections.Generic.List[string]
$files = $script:ContextPackFiles

# Núcleo mínimo para tareas Cursor/Codex.
$coreFiles = @(
  "README.md",
  "package.json",
  "angular.json",
  "docs/codex/contexto-rapido.md",
  "docs/codex/AGENTS.md",
  "docs/codex/README.md",
  "docs/codex/estandares/README.md",
  "docs/codex/estandares/EST-008-ia.md",
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
  ".cursor/rules/erp-estandares.mdc",
  ".cursor/rules/erp-orquestador.mdc",
  ".cursor/rules/erp-ui-noia.mdc",
  ".cursor/rules/erp-protected-files.mdc",
  ".cursor/skills/erp-codex-docs/SKILL.md"
)

foreach ($file in $coreFiles) {
  Add-RelativeFile -RelativePath $file
}

Add-RelativeDirectoryFiles -RelativeDirectory "docs/codex/estandares"

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
    Add-RelativeFile -RelativePath $file
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
    Add-RelativeFile -RelativePath $file
  }
}

if ($IncludeNomina) {
  Add-RelativeDirectoryFiles -RelativeDirectory "docs/codex/modulos/nomina-mensual"
}

if ($IncludeMovimientos) {
  Add-RelativeDirectoryFiles -RelativeDirectory "docs/codex/modulos/movimientos-variables"
  Add-RelativeDirectoryFiles -RelativeDirectory "docs/codex/modulos/haberes-descuentos"
}

if ($IncludeParametros) {
  Add-RelativeDirectoryFiles -RelativeDirectory "docs/codex/modulos/parametros"
}

foreach ($file in $ExtraFiles) {
  Add-RelativeFile -RelativePath $file
}

$files = $script:ContextPackFiles

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
