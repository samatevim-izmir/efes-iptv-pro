#!/bin/bash
# EFES IPTV PRO - Installation Leftovers Cleaner
echo "======================================================================="
echo "        EFES IPTV PRO - ARTIK DOSYA TEMIZLEME ARACI"
echo "======================================================================="
echo ""
echo "Uygulama yerel kurulumu tamamlandı. Kurulum artıkları temizleniyor..."
echo ""

# Wait 2 seconds for Setup.sh to close
sleep 2

# Delete other installation files and itself
rm -f "$(dirname "$0")/Setup.bat"
rm -f "$(dirname "$0")/kurulum_windows.bat"
rm -f "$(dirname "$0")/Setup.sh"
rm -f "$(dirname "$0")/kurulum_linux_macos.sh"
rm -f "$0"

echo "[OK] Tüm kurulum artıkları başarıyla temizlendi!"
sleep 2
