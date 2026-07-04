@echo off
title EFES IPTV PRO - Otomatik Kurulum Sihirbazi
color 0B
cls

echo =======================================================================
echo.
echo    ######## ######## ########  ######     #### ########  ######## ##     ## 
echo    ##       ##       ##       ##    ##     ##  ##     ##    ##    ##     ## 
echo    ##       ##       ##       ##           ##  ##     ##    ##    ##     ## 
echo    ######   ######   ######    ######      ##  ########     ##    ##     ## 
echo    ##       ##       ##             ##     ##  ##           ##     ##   ##  
echo    ##       ##       ##       ##    ##     ##  ##           ##      ## ##   
echo    ######## ##       ########  ######     #### ##           ##       ###    
echo.
echo           EFES IPTV PRO - OTOMATIK KURULUM SIHIRBAZI
echo =======================================================================
echo.

:: Check Admin Rights (for some system registrations if needed, but run user-friendly anyway)
net session >nul 2>&1
if %errorlevel% == 0 (
    echo [BILGI] Yonetici haklari onaylandi.
)

:: Node.js Check and Automatic Installation
echo [1/5] Node.js durumu kontrol ediliyor...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [UYARI] Node.js bilgisayarinizda kurulu degil!
    echo [BILGI] Winget araciligiyla otomatik Node.js kurulumu baslatiliyor...
    echo Lutfen acilan pencerelere onay verin.
    echo.
    winget install OpenJS.NodeJS --silent --accept-source-agreements --accept-package-agreements
    if %errorlevel% neq 0 (
        echo [HATA] Otomatik kurulum basarisiz oldu. 
        echo Lutfen tarayicidan manuel yukleyin. Indirme sayfasi aciliyor...
        start https://nodejs.org/
        echo Kurulum bittikten sonra bu sihirbazi tekrar calistirin.
        pause
        exit
    )
    echo [TAMAM] Node.js basariyla kuruldu! Degisikliklerin etkinlesmesi icin devam ediliyor.
) else (
    echo [TAMAM] Node.js zaten yuklu: 
    node -v
)
echo.

:: Install Dependencies
echo [2/5] Bagimliliklar (Kutuphaneler) yukleniyor...
echo Bu islem internet hizina bagli olarak birkac dakika surebilir. Lutfen bekleyin...
call npm install
if %errorlevel% neq 0 (
    echo [HATA] Bagimliliklar yuklenirken bir sorun olustu! Internet baglantinizi kontrol edip tekrar deneyin.
    pause
    exit
)
echo [TAMAM] Bagimliliklar yuklendi.
echo.

:: Build Production Package
echo [3/5] Uygulama dosyasi optimize ediliyor ve derleniyor...
call npm run build
if %errorlevel% neq 0 (
    echo [HATA] Derleme (Build) sirasinda hata olustu!
    pause
    exit
)
echo [TAMAM] Derleme basariyla tamamlandi!
echo.

:: Create Fast-Startup Launcher (Baslat.bat)
echo [4/5] Hizli baslatma betigi olusturuluyor...
(
echo @echo off
echo title EFES IPTV PRO - Calisiyor
echo color 0A
echo cls
echo =======================================================================
echo           EFES IPTV PRO - AKTIF VE CALISIYOR
echo =======================================================================
echo.
echo  [OK] Yerel sunucu baslatildi!
echo  [OK] Tarayici otomatik olarak aciliyor...
echo  [OK] Adres: http://localhost:3000
echo.
echo  NOT: Bu siyah ekran acik kaldigi surece yayinlarinizi izleyebilirsiniz.
echo  Simge durumuna kuculterek arka planda calismaya birakabilirsiniz.
echo =======================================================================
echo.
echo timeout /t 2 ^>nul
echo start http://localhost:3000
echo npm run start
) > "%~dp0Baslat.bat"
echo [TAMAM] Baslat.bat olusturuldu.
echo.

:: Create Desktop Shortcut with Premium TV Icon
echo [5/5] Masaustune 'EFES IPTV PRO' kisayolu olusturuluyor...
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\EFES IPTV PRO.lnk'); $Shortcut.TargetPath = '%~dp0Baslat.bat'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.IconLocation = 'imageres.dll,27'; $Shortcut.Description = 'EFES IPTV PRO Player'; $Shortcut.Save()"

if %errorlevel% neq 0 (
    echo [UYARI] Kisayol olustururken bir sorun yasandi. Masaustune manuel ekleyebilirsiniz.
) else (
    echo [TAMAM] Masaustune TV simgeli 'EFES IPTV PRO' kisayolu başarıyla olusturuldu!
)
echo.

echo =======================================================================
echo   TEBRIKLER! KURULUM TAMAMLANDI VE KISAYOL HAZIRLANDI.
echo =======================================================================
echo.
echo   - Masaustunuzdeki 'EFES IPTV PRO' kisayoluna cift tiklayarak baslatabilirsiniz.
echo   - Uygulama acildiginda kendi M3U listenizi ekleyip hemen izleyebilirsiniz.
echo.
echo   Simdi uygulamayi baslatmak ister misiniz? (E / H)
set /p baslat_onay="Seciminiz: "

if /i "%baslat_onay%"=="E" (
    echo Uygulama baslatiliyor...
    start "" "%~dp0Baslat.bat"
)

echo Kurulum Sihirbazi kapatiliyor. Artik dosyalar otomatik temizlenecektir...
timeout /t 2 >nul
start "" "%~dp0temizle.bat"
exit
