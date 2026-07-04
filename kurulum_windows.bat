@echo off
title EFES IPTV PRO - Otomatik Kurulum ve Baslatici
color 0B
echo =======================================================
echo     EFES IPTV PRO - OTOMATIK KURULUM VE BASLATICI
echo =======================================================
echo.

:: Node.js check
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [HATA] Node.js bilgisayarinizda kurulu degil!
    echo Lutfen once https://nodejs.org/ adresinden Node.js indirin ve kurun.
    echo Kurulum bittikten sonra bu dosyayi tekrar calistirin.
    echo.
    pause
    exit
)

echo [1/4] Node.js dogrulandi. Bagimliliklar yukleniyor...
call npm install

if %errorlevel% neq 0 (
    echo [HATA] Bagimliliklar yuklenirken bir sorun olustu! Lutfen internet baglantinizi kontrol edin.
    pause
    exit
)

echo.
echo [2/4] Uygulama basariyla kuruldu! Uretim surumu derleniyor...
call npm run build

if %errorlevel% neq 0 (
    echo [HATA] Derleme (build) sirasinda hata olustu!
    pause
    exit
)

echo.
echo [3/4] EFES IPTV PRO hazir hale getirildi.
echo Yerel sunucu baslatiliyor...
echo.

:: Start server in separate window
start cmd /k "npm run start"

echo [4/4] Uygulama sunucusu baslatildi!
echo Tarayicinizda http://localhost:3000 adresi otomatik olarak aciliyor...
timeout /t 3 >nul
start http://localhost:3000

echo.
echo =======================================================
echo   Kurulum Tamamlandi! Keyifli seyirler dileriz.
echo   Sunucuyu kapatmak icin acilan siyah pencereyi kapatabilirsiniz.
echo =======================================================
echo.
pause
