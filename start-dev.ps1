$ErrorActionPreference = 'Stop'
Set-Location 'd:\sme-ai-dashboard'
$exe = 'C:\Program Files\nodejs\npm.cmd'
# Use cmd /c with start /B to fully detach the node process
cmd /c "start /B ""dev"" ""$exe"" run dev > d:\sme-ai-dashboard\dev.log 2>&1"
Start-Sleep -Seconds 2
Write-Host "Launched. Tail of dev.log:"
if (Test-Path 'd:\sme-ai-dashboard\dev.log') {
    Get-Content 'd:\sme-ai-dashboard\dev.log' -Tail 30
} else {
    Write-Host "(no log yet)"
}
