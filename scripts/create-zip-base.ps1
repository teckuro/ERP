param(
  [string]$OutputName = "angular-erp-base-clean.zip"
)

$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$stage = Join-Path $env:TEMP ("angular-erp-pack-" + [guid]::NewGuid().ToString("N"))
$dest = Join-Path $root $OutputName

$rootResolved = [System.IO.Path]::GetFullPath($root)
$destResolved = [System.IO.Path]::GetFullPath($dest)
if (-not $destResolved.StartsWith($rootResolved, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Destino fuera del workspace: $destResolved"
}

Remove-Item -LiteralPath $destResolved -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null
New-Item -ItemType Directory -Path (Join-Path $stage "public") | Out-Null

$rootFiles = @(
  "angular.json",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "tsconfig.app.json",
  "tsconfig.spec.json",
  ".gitignore",
  ".env.example",
  "README.md",
  "SUPABASE_SETUP.md"
)

foreach ($file in $rootFiles) {
  $source = Join-Path $root $file
  if (Test-Path $source) {
    Copy-Item -LiteralPath $source -Destination $stage -Force
  }
  else {
    Write-Warning "No existe: $file"
  }
}

$directories = @(
  "src",
  "scripts",
  "bd",
  "docs",
  ".cursor"
)

foreach ($directory in $directories) {
  $source = Join-Path $root $directory
  if (Test-Path $source) {
    Copy-Item -LiteralPath $source -Destination $stage -Recurse -Force
  }
  else {
    Write-Warning "No existe: $directory"
  }
}

$publicConfigExample = Join-Path $root "public\app-config.example.json"
if (Test-Path $publicConfigExample) {
  Copy-Item -LiteralPath $publicConfigExample -Destination (Join-Path $stage "public\app-config.example.json") -Force
}
else {
  Write-Warning "No existe: public\app-config.example.json"
}

$sensitiveFiles = @(
  ".env",
  ".env.local",
  "public\app-config.json"
)

foreach ($file in $sensitiveFiles) {
  Remove-Item -LiteralPath (Join-Path $stage $file) -Force -ErrorAction SilentlyContinue
}

Get-ChildItem -LiteralPath $stage -Recurse -Filter "*.bak" | Remove-Item -Force -ErrorAction SilentlyContinue

$manifest = @(
  "Archivo: $OutputName",
  "Origen: $root",
  "Generado: $((Get-Date).ToString('yyyy-MM-dd HH:mm:ss zzz'))",
  "",
  "Incluye:",
  "- archivos base de Angular y npm",
  "- src",
  "- scripts",
  "- bd",
  "- docs",
  "- .cursor",
  "- public/app-config.example.json",
  "",
  "Excluye:",
  "- node_modules",
  "- dist",
  "- .angular",
  "- .git",
  "- zips previos",
  "- .env",
  "- .env.local",
  "- public/app-config.json",
  "- *.bak"
)
Set-Content -LiteralPath (Join-Path $stage "ZIP-MANIFEST.txt") -Value $manifest -Encoding UTF8

Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $destResolved -CompressionLevel Optimal -Force

Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue

Write-Output "ZIP base limpio: $destResolved"
