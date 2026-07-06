# PowerShell script to create the folder hierarchy for focusflow_ai project
# Run this script in the project's root directory.

# Define the folder structure as a hashtable where keys are folder paths relative to the script location
$folders = @(
    "server",
    "server\models",
    "src",
    "dist",
    "node_modules"
)

foreach ($folder in $folders) {
    $fullPath = Join-Path -Path $PSScriptRoot -ChildPath $folder
    if (-Not (Test-Path -Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        Write-Host "Created folder: $fullPath"
    } else {
        Write-Host "Folder already exists: $fullPath"
    }
}

# Optional: create placeholder files if they don't exist
$files = @(
    ".gitignore",
    "README.md",
    "package.json",
    "tsconfig.json",
    "vite.config.ts"
)

foreach ($file in $files) {
    $filePath = Join-Path -Path $PSScriptRoot -ChildPath $file
    if (-Not (Test-Path -Path $filePath)) {
        New-Item -ItemType File -Path $filePath -Force | Out-Null
        Write-Host "Created placeholder file: $filePath"
    } else {
        Write-Host "File already exists: $filePath"
    }
}

Write-Host "Folder hierarchy setup complete."
