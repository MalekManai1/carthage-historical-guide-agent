# Download portable Node.js LTS into .tools/node (Windows x64).
$ErrorActionPreference = "Stop"

$nodeVersion = "22.16.0"
$zip = "node-v$nodeVersion-win-x64.zip"
$url = "https://nodejs.org/dist/v$nodeVersion/$zip"
$tools = $PSScriptRoot
$dest = Join-Path $tools "node"
$zipPath = Join-Path $tools $zip

if (Test-Path (Join-Path $dest "node.exe")) {
    Write-Host "Node.js already installed at $dest"
    & (Join-Path $dest "node.exe") -v
    exit 0
}

Write-Host "Downloading Node.js $nodeVersion..."
Invoke-WebRequest -Uri $url -OutFile $zipPath
Expand-Archive -Path $zipPath -DestinationPath $tools -Force
$extracted = Join-Path $tools "node-v$nodeVersion-win-x64"
if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
Rename-Item $extracted $dest
Remove-Item $zipPath -Force

Write-Host "Installed:"
& (Join-Path $dest "node.exe") -v
& (Join-Path $dest "npm.cmd") -v
