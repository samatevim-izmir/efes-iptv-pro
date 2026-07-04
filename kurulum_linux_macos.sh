#!/bin/bash

# EFES IPTV PRO - Linux & macOS Automatic Installer & Launcher
echo -e "\033[1;36m======================================================="
echo "    EFES IPTV PRO - OTOMATIK KURULUM VE BASLATICI"
echo -e "=======================================================\033[0m"
echo ""

# Node.js check
if ! command -v node &> /dev/null
then
    echo -e "\033[1;31m[HATA] Node.js sisteminizde kurulu degil!\033[0m"
    echo "Lutfen once https://nodejs.org/ adresinden Node.js indirin ve kurun."
    echo "Kurulum bittikten sonra bu dosyayi tekrar calistirin."
    echo ""
    exit 1
fi

echo -e "\033[1;32m[1/4] Node.js dogrulandi. Bagimliliklar yukleniyor...\033[0m"
npm install

if [ $? -ne 0 ]; then
    echo -e "\033[1;31m[HATA] Bagimliliklar yuklenirken bir sorun olustu!\033[0m"
    exit 1
fi

echo ""
echo -e "\033[1;32m[2/4] Uygulama basariyla kuruldu! Uretim surumu derleniyor...\033[0m"
npm run build

if [ $? -ne 0 ]; then
    echo -e "\033[1;31m[HATA] Derleme (build) sirasinda hata olustu!\033[0m"
    exit 1
fi

echo ""
echo -e "\033[1;32m[3/4] EFES IPTV PRO hazir hale getirildi. Sunucu baslatiliyor...\033[0m"
echo ""

# Detect OS to open local server link automatically
open_link() {
    sleep 3
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "http://localhost:3000"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open "http://localhost:3000"
    fi
}

open_link &
npm run start
