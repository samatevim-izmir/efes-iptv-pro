@echo off
title EFES IPTV PRO - Artık Dosya Temizleyici
color 0C
echo =======================================================================
echo         EFES IPTV PRO - ARTIK DOSYA TEMIZLEME ARACI
echo =======================================================================
echo.
echo  Uygulama yerel kurulumu tamamlandı. Kurulum artıkları temizleniyor...
echo.

:: Wait 2 seconds for Setup.bat to close
timeout /t 2 >nul

:: Delete other installation files
if exist "%~dp0Setup.bat" del /f /q "%~dp0Setup.bat"
if exist "%~dp0kurulum_windows.bat" del /f /q "%~dp0kurulum_windows.bat"
if exist "%~dp0Setup.sh" del /f /q "%~dp0Setup.sh"
if exist "%~dp0kurulum_linux_macos.sh" del /f /q "%~dp0kurulum_linux_macos.sh"

echo [OK] Tüm kurulum artıkları başarıyla temizlendi!
timeout /t 2 >nul

:: Auto delete itself
(goto) 2>nul & del "%~f0"
