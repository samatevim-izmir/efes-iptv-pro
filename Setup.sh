#!/bin/bash

# EFES IPTV PRO - macOS & Linux Automatic Installer & Launcher
clear
echo -e "\033[1;36m=======================================================================\033[0m"
echo -e "\033[1;35m"
echo "   ######## ######## ########  ######     #### ########  ######## ##     ## "
echo "   ##       ##       ##       ##    ##     ##  ##     ##    ##    ##     ## "
echo "   ##       ##       ##       ##           ##  ##     ##    ##    ##     ## "
echo "   ######   ######   ######    ######      ##  ########     ##    ##     ## "
echo "   ##       ##       ##             ##     ##  ##           ##     ##   ##  "
echo "   ##       ##       ##       ##    ##     ##  ##           ##      ## ##   "
echo "   ######## ##       ########  ######     #### ##           ##       ###    "
echo -e "\033[0m"
echo -e "\033[1;36m          EFES IPTV PRO - MACOS / LINUX KURULUM SIHIRBAZI\033[0m"
echo -e "\033[1;36m=======================================================================\033[0m"
echo ""

# Node.js Check
echo -e "\033[1;33m[1/5] Node.js durumu kontrol ediliyor...\033[0m"
if ! command -v node &> /dev/null
then
    echo -e "\033[1;31m[HATA] Node.js sisteminizde kurulu degil!\033[0m"
    echo "Lutfen once https://nodejs.org/ adresinden Node.js indirin ve kurun."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Alternatif olarak terminalden 'brew install node' komutu ile kurabilirsiniz."
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "Alternatif olarak 'sudo apt install nodejs npm' komutu ile kurabilirsiniz."
    fi
    echo ""
    read -p "Devam etmek icin Enter tusuna basin (Kurulum bittikten sonra)..."
    exit 1
else
    echo -e "\033[1;32m[TAMAM] Node.js bulundu: $(node -v)\033[0m"
fi
echo ""

# Install Dependencies
echo -e "\033[1;33m[2/5] Bagimliliklar (Kutuphaneler) yukleniyor...\033[0m"
npm install
if [ $? -ne 0 ]; then
    echo -e "\033[1;31m[HATA] Bagimliliklar yuklenirken bir hata olustu!\033[0m"
    exit 1
fi
echo -e "\033[1;32m[TAMAM] Bagimliliklar yuklendi.\033[0m"
echo ""

# Build Production Version
echo -e "\033[1;33m[3/5] Uygulama dosyasi optimize ediliyor ve derleniyor...\033[0m"
npm run build
if [ $? -ne 0 ]; then
    echo -e "\033[1;31m[HATA] Derleme (build) sirasinda bir hata olustu!\033[0m"
    exit 1
fi
echo -e "\033[1;32m[TAMAM] Optimize edilmis surum derlendi.\033[0m"
echo ""

# Create Fast-Startup Launcher (Baslat.sh)
echo -e "\033[1;33m[4/5] Hizli baslatma betigi olusturuluyor...\033[0m"
cat << 'EOF' > ./Baslat.sh
#!/bin/bash
clear
echo -e "\033[1;36m=======================================================================\033[0m"
echo -e "\033[1;32m          EFES IPTV PRO - AKTIF VE CALISIYOR\033[0m"
echo -e "\033[1;36m=======================================================================\033[0m"
echo ""
echo -e " [OK] Yerel sunucu baslatildi!"
echo -e " [OK] Tarayici otomatik olarak aciliyor..."
echo -e " [OK] Adres: http://localhost:3000"
echo ""
echo " NOT: Bu terminal penceresi acik kaldigi surece yayinlarinizi izleyebilirsiniz."
echo " Pencereyi simge durumuna kuculterek arka planda birakabilirsiniz."
echo -e "\033[1;36m=======================================================================\033[0m"
echo ""

sleep 2
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "http://localhost:3000"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "http://localhost:3000"
fi

npm run start
EOF

chmod +x ./Baslat.sh
echo -e "\033[1;32m[TAMAM] Baslat.sh basariyla olusturuldu.\033[0m"
echo ""

# Create Desktop Shortcut
echo -e "\033[1;33m[5/5] Masaustune 'EFES IPTV PRO' kisayolu olusturuluyor...\033[0m"
DESKTOP_DIR="$HOME/Desktop"

if [ -d "$DESKTOP_DIR" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        SHORTCUT_FILE="$DESKTOP_DIR/EFES IPTV PRO.command"
        echo "#!/bin/bash" > "$SHORTCUT_FILE"
        echo "cd \"$(pwd)\"" >> "$SHORTCUT_FILE"
        echo "./Baslat.sh" >> "$SHORTCUT_FILE"
        chmod +x "$SHORTCUT_FILE"
        echo -e "\033[1;32m[TAMAM] macOS Masaüstünüze 'EFES IPTV PRO.command' kisayolu eklendi!\033[0m"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        SHORTCUT_FILE="$DESKTOP_DIR/efes-iptv.desktop"
        echo "[Desktop Entry]" > "$SHORTCUT_FILE"
        echo "Version=1.0" >> "$SHORTCUT_FILE"
        echo "Type=Application" >> "$SHORTCUT_FILE"
        echo "Name=EFES IPTV PRO" >> "$SHORTCUT_FILE"
        echo "Comment=EFES IPTV PRO Player" >> "$SHORTCUT_FILE"
        echo "Exec=bash -c 'cd \"$(pwd)\" && ./Baslat.sh'" >> "$SHORTCUT_FILE"
        echo "Icon=video-television" >> "$SHORTCUT_FILE"
        echo "Terminal=true" >> "$SHORTCUT_FILE"
        echo "Categories=AudioVideo;Player;" >> "$SHORTCUT_FILE"
        chmod +x "$SHORTCUT_FILE"
        echo -e "\033[1;32m[TAMAM] Linux Masaüstünüze 'efes-iptv.desktop' kisayolu eklendi!\033[0m"
    fi
else
    echo -e "\033[1;31m[UYARI] Masaustu dizini bulunamadi. Manuel baslatabilirsiniz.\033[0m"
fi
echo ""

echo -e "\033[1;36m=======================================================================\033[0m"
echo -e "\033[1;32m  TEBRIKLER! KURULUM TAMAMLANDI VE KISAYOLLAR HAZIRLANDI.\033[0m"
echo -e "\033[1;36m=======================================================================\033[0m"
echo ""
echo " - Masaustunuzdeki kisayolu kullanarak uygulamayi tek tikla baslatabilirsiniz."
echo " - Uygulama acildiginda kendi M3U listenizi ekleyip hemen izleyebilirsiniz."
echo ""
read -p "Simdi uygulamayi baslatmak ister misiniz? (y/n): " launch_choice

if [[ "$launch_choice" =~ ^[Yy]$ ]]; then
    echo "Uygulama baslatiliyor..."
    ./Baslat.sh &
fi

echo "Kurulum Sihirbazi kapatiliyor. Artik dosyalar otomatik temizlenecektir..."
chmod +x ./temizle.sh
./temizle.sh &
exit 0
