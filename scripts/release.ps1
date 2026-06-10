$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$DefaultKeyPath = Join-Path $env:USERPROFILE ".tauri\yumihub-updater.key"

Set-Location $Root

if (-not $env:TAURI_SIGNING_PRIVATE_KEY) {
  if (-not (Test-Path -LiteralPath $DefaultKeyPath)) {
    throw "Updater signing key not found: $DefaultKeyPath"
  }

  $env:TAURI_SIGNING_PRIVATE_KEY = $DefaultKeyPath
}

bun run cl
bun tauri build

Write-Host "Release artifacts are under src-tauri\target\release\bundle"
