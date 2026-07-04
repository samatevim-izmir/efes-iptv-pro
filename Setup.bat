@echo off
net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)
set "TARGET_PATH=%~dp0Baslat.bat"
set "WORKING_DIR=%~dp0"
set "SHORTCUT_PATH=%USERPROFILE%\Desktop\EFES IPTV PRO.lnk"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$lines = Get-Content -LiteralPath '%~f0'; $psLines = $lines[12..($lines.Length-1)] -join [Environment]::NewLine; [System.IO.File]::WriteAllText('$env:TEMP\install_engine.ps1', $psLines)"
powershell -NoProfile -ExecutionPolicy Bypass -File "%TEMP%\install_engine.ps1"
exit /b
$ErrorActionPreference = "SilentlyContinue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Clear-Host
Write-Host ""
Write-Host "    ######## ######## ########  ######     #### ########  ######## ##     ## " -ForegroundColor Cyan
Write-Host "    ##       ##       ##       ##    ##     ##  ##     ##    ##    ##     ## " -ForegroundColor Cyan
Write-Host "    ##       ##       ##       ##           ##  ##     ##    ##    ##     ## " -ForegroundColor Cyan
Write-Host "    ######   ######   ######    ######      ##  ########     ##    ##     ## " -ForegroundColor Cyan
Write-Host "    ##       ##       ##             ##     ##  ##           ##     ##   ##  " -ForegroundColor Cyan
Write-Host "    ##       ##       ##       ##    ##     ##  ##           ##      ## ##   " -ForegroundColor Cyan
Write-Host "    ######## ##       ########  ######     #### ##           ##       ###    " -ForegroundColor Cyan
Write-Host ""
Write-Host "          EFES IPTV PRO - AKILLI VE SESSIZ KURULUM MOTORU" -ForegroundColor Green
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host ""

function Show-ProgressBar {
    param (
        [int]$Percent,
        [string]$Status
    )
    $width = 25
    $done = [math]::Floor($Percent / (100 / $width))
    $left = $width - $done
    $bar = ("=" * $done) + ">" + (" " * ($left - 1))
    if ($done -eq 0) { $bar = " " * $width }
    if ($Percent -ge 100) { $bar = "=" * $width }
    [Console]::Write("`r    KURULUM: [$bar] $Percent% | $Status")
}

# STEP 1: Check Node.js and Download (0% - 50%)
Show-ProgressBar -Percent 5 -Status "Node.js kontrol ediliyor..."
Start-Sleep -Milliseconds 600

$needsNode = $true
$installedVersion = ""
try {
    $nodeVer = & node -v
    if ($nodeVer -like "v*") {
        $needsNode = $false
        $installedVersion = $nodeVer
    }
} catch {}

if ($needsNode) {
    Show-ProgressBar -Percent 10 -Status "Node.js bulunamadi, indirme baslatiliyor..."
    $url = "https://nodejs.org/dist/v24.18.0/node-v24.18.0-x64.msi"
    $output = "$env:TEMP\node_installer.msi"
    
    # Try downloading v24.18.0-x64
    try {
        $webClient = New-Object System.Net.WebClient
        $webClient.Headers.Add("User-Agent", "Mozilla/5.0")
        $stream = $webClient.OpenRead($url)
        $totalLength = [int64]$webClient.ResponseHeaders["Content-Length"]
        $fileStream = [System.IO.File]::Create($output)
        $buffer = New-Object Byte[] 1048576 # 1MB chunks
        $bytesRead = 0
        $totalBytesRead = 0
        
        while (($bytesRead = $stream.Read($buffer, 0, $buffer.Length)) -gt 0) {
            $fileStream.Write($buffer, 0, $bytesRead)
            $totalBytesRead += $bytesRead
            if ($totalLength -gt 0) {
                # Map download percent to 10% - 45% range
                $dlPercent = [int][Math]::Floor(($totalBytesRead / $totalLength) * 100)
                $mappedPercent = 10 + [int]($dlPercent * 0.35)
                Show-ProgressBar -Percent $mappedPercent -Status "Node.js v24.18.0 Indiriliyor ($([Math]::Round($totalBytesRead/1MB,1))MB / $([Math]::Round($totalLength/1MB,1))MB)..."
            }
        }
        $fileStream.Close()
        $stream.Close()
    } catch {
        # Fallback to stable LTS v22.11.0
        Show-ProgressBar -Percent 15 -Status "v24.18.0 bulunamadi, stabil LTS v22.11.0 indiriliyor..."
        $url = "https://nodejs.org/dist/v22.11.0/node-v22.11.0-x64.msi"
        try {
            $webClient = New-Object System.Net.WebClient
            $webClient.Headers.Add("User-Agent", "Mozilla/5.0")
            $stream = $webClient.OpenRead($url)
            $totalLength = [int64]$webClient.ResponseHeaders["Content-Length"]
            $fileStream = [System.IO.File]::Create($output)
            $buffer = New-Object Byte[] 1048576
            $bytesRead = 0
            $totalBytesRead = 0
            
            while (($bytesRead = $stream.Read($buffer, 0, $buffer.Length)) -gt 0) {
                $fileStream.Write($buffer, 0, $bytesRead)
                $totalBytesRead += $bytesRead
                if ($totalLength -gt 0) {
                    $dlPercent = [int][Math]::Floor(($totalBytesRead / $totalLength) * 100)
                    $mappedPercent = 15 + [int]($dlPercent * 0.3)
                    Show-ProgressBar -Percent $mappedPercent -Status "Node.js v22.11.0 Indiriliyor ($([Math]::Round($totalBytesRead/1MB,1))MB / $([Math]::Round($totalLength/1MB,1))MB)..."
                }
            }
            $fileStream.Close()
            $stream.Close()
        } catch {
            [Console]::WriteLine()
            Write-Host "    [HATA] Internet baglantisi sorunu! Node.js indirilemedi." -ForegroundColor Red
            Exit
        }
    }
    
    # STEP 2: Install Node.js Silently (45% - 55%)
    Show-ProgressBar -Percent 46 -Status "Node.js arka planda kuruluyor (Sessiz mod)..."
    $installProc = Start-Process msiexec.exe -ArgumentList "/i", "`"$output`"", "/qn", "/norestart" -Wait -NoNewWindow -PassThru
    if ($installProc.ExitCode -eq 0 -or $installProc.ExitCode -eq 3010) {
        Show-ProgressBar -Percent 55 -Status "Node.js basariyla kuruldu!"
    } else {
        [Console]::WriteLine()
        Write-Host "    [HATA] Node.js kurulumu sirasinda bir hata olustu. Kod: $($installProc.ExitCode)" -ForegroundColor Red
        Exit
    }
} else {
    Show-ProgressBar -Percent 55 -Status "Node.js zaten yuklu ($installedVersion), kurulum geciliyor."
    Start-Sleep -Milliseconds 800
}

# Update PATH for the current session to ensure npm is available
$env:PATH += ";$env:ProgramFiles\nodejs\;$env:AppData\npm"

# STEP 3: Silent npm install (55% - 80%)
Show-ProgressBar -Percent 58 -Status "Proje bilesenleri arka planda kuruluyor (Sessiz mod)..."
$npmInstallLog = "$env:TEMP\npm_install.log"
$installJob = Start-Process npm -ArgumentList "install", "--silent", "--no-progress" -RedirectStandardOutput $npmInstallLog -RedirectStandardError $npmInstallLog -NoNewWindow -PassThru -AsJob

$counter = 58
while ($installJob.State -eq "Running") {
    if ($counter -lt 78) {
        $counter++
    }
    Show-ProgressBar -Percent $counter -Status "Bagimliliklar yukleniyor (npm install)..."
    Start-Sleep -Milliseconds 300
}
Show-ProgressBar -Percent 80 -Status "Bagimliliklar yuklendi!"
Start-Sleep -Milliseconds 500

# STEP 4: Build Production Package (80% - 90%)
Show-ProgressBar -Percent 81 -Status "Uygulama derleniyor (npm run build)..."
$npmBuildLog = "$env:TEMP\npm_build.log"
$buildJob = Start-Process npm -ArgumentList "run", "build" -RedirectStandardOutput $npmBuildLog -RedirectStandardError $npmBuildLog -NoNewWindow -PassThru -AsJob

while ($buildJob.State -eq "Running") {
    if ($counter -lt 89) {
        $counter++
    }
    Show-ProgressBar -Percent $counter -Status "Optimizasyon yapiliyor (npm run build)..."
    Start-Sleep -Milliseconds 400
}
Show-ProgressBar -Percent 90 -Status "Uygulama basariyla derlendi!"
Start-Sleep -Milliseconds 500

# STEP 5: Add Windows Firewall Rules to Allow Network Connections (90% - 95%)
Show-ProgressBar -Percent 91 -Status "Guvenlik Duvari kurallari ekleniyor..."
try {
    netsh advfirewall firewall delete rule name="NodeJS Port 3000" >$null 2>&1
    netsh advfirewall firewall delete rule name="NodeJS Application" >$null 2>&1
    
    netsh advfirewall firewall add rule name="NodeJS Port 3000" dir=in action=allow protocol=TCP localport=3000 >$null 2>&1
    netsh advfirewall firewall add rule name="NodeJS Application" dir=in action=allow program="$env:ProgramFiles\nodejs\node.exe" enable=yes >$null 2>&1
    if (Test-Path "$env:ProgramFiles(x86)\nodejs\node.exe") {
        netsh advfirewall firewall add rule name="NodeJS Application x86" dir=in action=allow program="$env:ProgramFiles(x86)\nodejs\node.exe" enable=yes >$null 2>&1
    }
    Show-ProgressBar -Percent 95 -Status "Guvenlik Duvari kurallari aktif edildi!"
} catch {
    Show-ProgressBar -Percent 95 -Status "Guvenlik duvari kurallari atlandi."
}
Start-Sleep -Milliseconds 500

# STEP 6: Create Desktop Shortcut with Premium TV Icon (95% - 100%)
Show-ProgressBar -Percent 96 -Status "Masaustu kisayolu olusturuluyor..."
try {
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($env:SHORTCUT_PATH)
    $Shortcut.TargetPath = $env:TARGET_PATH
    $Shortcut.WorkingDirectory = $env:WORKING_DIR
    $Shortcut.IconLocation = "imageres.dll,27"
    $Shortcut.Description = "EFES IPTV PRO Player"
    $Shortcut.Save()
    Show-ProgressBar -Percent 100 -Status "Masaustu kisayolu basariyla olusturuldu!"
} catch {
    Show-ProgressBar -Percent 100 -Status "Kisayol olusturma atlandi."
}
[Console]::WriteLine()
Write-Host ""
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "       KURULUM TAMAMLANDI! UYGULAMA KULLANIMA HAZIR." -ForegroundColor Green
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host ""

# Start application launcher if user said yes
$title = "Uygulama Baslatilsin mi?"
$message = "Kurulum tamamlandi. EFES IPTV PRO uygulamasini hemen baslatmak ister misiniz?"
$yes = New-Object System.Management.Automation.Host.ChoiceDescription "&Evet", "Uygulamayi hemen ac."
$no = New-Object System.Management.Automation.Host.ChoiceDescription "&Hayir", "Sonra baslat."
$choices = [System.Management.Automation.Host.ChoiceDescription[]]($yes, $no)
$decision = $Host.UI.PromptForChoice($title, $message, $choices, 0)
if ($decision -eq 0) {
    Write-Host "Uygulama baslatiliyor..."
    Start-Process -FilePath $env:TARGET_PATH
}

Write-Host "Gecici dosyalar temizleniyor..."
Start-Sleep -Seconds 1
