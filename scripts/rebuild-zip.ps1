# Rebuild D:\sme-ai-dashboard.zip from a clean staging dir with strict
# path/dir allowlists. The previous build pipeline had a bug where it
# leaked .bat / .ps1 scripts because of a full-path vs relative-path
# mismatch — this version uses relative-name matching for both files
# and directories.

$ErrorActionPreference = "Stop"

$srcRoot  = "d:\sme-ai-dashboard"
$stageDir = Join-Path $env:TEMP ("sme-zip-stage-" + [Guid]::NewGuid().ToString("N").Substring(0,8))
$zipPath  = "d:\sme-ai-dashboard.zip"

# Excluded relative directory names (matched anywhere in the path)
$excludedDirs = @(
  "node_modules", "dist", ".puku", ".vscode", ".git"
)

# Excluded relative file names (matched by leaf name only)
$excludedFiles = @(
  "dev.log", "debug.log", "dev-tail.txt", "dev.err.log",
  "run-dev.bat", "install.bat", "start-dev.ps1",
  "rebuild-zip.ps1",
  ".env", ".env.local", ".env.development", ".env.production"
)

New-Item -ItemType Directory -Path $stageDir -Force | Out-Null
Write-Host "Staging to: $stageDir"

# Mirror files using ROBOCOPY for speed + reliability.
# /MIR would delete extras we don't want; use /E (copy subdirs incl. empties)
# and rely on /XF /XD for exclusions.
$robocopyArgs = @(
  $srcRoot, $stageDir,
  "/E",             # copy subdirectories, including empty ones
  "/NFL", "/NDL", "/NP", "/NJH", "/NJS", "/NC", "/NS",  # quiet
  "/R:0", "/W:0",
  "/XD", $excludedDirs,
  "/XF", $excludedFiles
)

# Use Start-Process with /WAIT so we can capture the exit code (robocopy returns 1 on success-with-skips)
$p = Start-Process -FilePath "robocopy.exe" -ArgumentList $robocopyArgs -NoNewWindow -Wait -PassThru
Write-Host "Robocopy exit code: $($p.ExitCode)  (0-7 = success, 8+ = failure)"

# Sanity-check: nothing excluded should be in the stage
$leakedDirs = Get-ChildItem -Path $stageDir -Directory -Recurse |
  Where-Object { $excludedDirs -contains $_.Name }
$leakedFiles = Get-ChildItem -Path $stageDir -File -Recurse |
  Where-Object { $excludedFiles -contains $_.Name }

if ($leakedDirs.Count -gt 0 -or $leakedFiles.Count -gt 0) {
  Write-Host "BLOCKED — leaked paths found in stage:"
  $leakedDirs  | ForEach-Object { Write-Host "  DIR: $($_.FullName)" }
  $leakedFiles | ForEach-Object { Write-Host "  FILE: $($_.FullName)" }
  Remove-Item -Path $stageDir -Recurse -Force
  exit 2
}

# Build the zip using System.IO.Compression.ZipFile (deterministic, no PowerShell caveats)
Add-Type -AssemblyName "System.IO.Compression.FileSystem"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
[System.IO.Compression.ZipFile]::CreateFromDirectory($stageDir, $zipPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)

# Verify zip contents
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
$entryCount = $zip.Entries.Count
$totalSize = ($zip.Entries | Measure-Object -Property Length -Sum).Sum
$zip.Dispose()

Write-Host ("ZIP: {0}" -f $zipPath)
Write-Host ("Size: {0:N0} bytes ({1:N1} KB)" -f $totalSize, ($totalSize/1KB))
Write-Host ("Entries: {0}" -f $entryCount)

# Cleanup
Remove-Item -Path $stageDir -Recurse -Force
Write-Host "Stage cleaned up."

# Verify the patched model id is inside the zip
$verifyScript = @"
Add-Type -AssemblyName 'System.IO.Compression.FileSystem'
`$z = [System.IO.Compression.ZipFile]::OpenRead('$zipPath')
`$entry = `$z.GetEntry('server.ts')
if (-not `$entry) { Write-Host 'server.ts NOT in zip'; exit 3 }
`$reader = New-Object System.IO.StreamReader(`$entry.Open())
`$content = `$reader.ReadToEnd()
`$reader.Close()
`$z.Dispose()
`$bad = ([regex]::Matches(`$content, 'gemini-3.5-flash')).Count
`$good = ([regex]::Matches(`$content, 'MODEL_ID')).Count
Write-Host ("Stale gemini-3.5-flash occurrences inside server.ts: {0}" -f `$bad)
Write-Host ("MODEL_ID references inside server.ts: {0}" -f `$good)
"@
$verifyScript | Out-File -FilePath (Join-Path $env:TEMP "verify-zip.ps1") -Encoding ASCII
& powershell.exe -ExecutionPolicy Bypass -File (Join-Path $env:TEMP "verify-zip.ps1")
Remove-Item (Join-Path $env:TEMP "verify-zip.ps1") -Force

Write-Host "READY TO UPLOAD"
