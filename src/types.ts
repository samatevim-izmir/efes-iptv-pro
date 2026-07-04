export interface IPTVChannel {
  id: string;
  name: string;
  logo: string;
  streamUrl: string;
  category: string;
  description: string;
  language: string;
  type: "live" | "movie" | "series" | "documentary";
  dubbingOptions?: string[];
  lastPosition?: number; // Saved video position in seconds (Kaldığın Yerden Devam Et)
  duration?: number;
}

export interface EPGProgram {
  title: string;
  description: string;
  start: string;
  end: string;
  duration: string;
  isLiveNow: boolean;
}

export interface EPGData {
  channelId: string;
  date: string;
  programs: EPGProgram[];
}

export interface LicenseStatus {
  authorized: boolean;
  securityToken: string;
  systemIntegrity: string;
  timestamp: number;
  clientIp: string;
  host: string;
  protectionLevel: string;
  watermark: string;
}

export type IPTVLanguage = "TR" | "EN" | "DE" | "FR" | "ES";

export interface TranslationDict {
  appName: string;
  splashWelcome: string;
  splashSecurity: string;
  liveTv: string;
  movies: string;
  series: string;
  documentaries: string;
  radios: string;
  favorites: string;
  history: string;
  customPlaylist: string;
  allCategories: string;
  searchPlaceholder: string;
  nowPlaying: string;
  upNext: string;
  noEpg: string;
  epgGuide: string;
  m3uUploadTitle: string;
  m3uPlaceholder: string;
  m3uLoadBtn: string;
  m3uFileBtn: string;
  aspectRatio: string;
  dubbingSelect: string;
  themeToggle: string;
  remoteMode: string;
  mouseMode: string;
  remoteTip: string;
  resumeWatchTitle: string;
  resumeText: string;
  resumeYes: string;
  resumeNo: string;
  securityShield: string;
  securityOk: string;
  autoTaramaText: string;
  autoTaramaBtn: string;
  watchTimeLeft: string;
  addedFav: string;
  removedFav: string;
  bgPlayActive: string;
  adminPanel: string;
  adminPinPrompt: string;
  adminLoginBtn: string;
  adminWrongPin: string;
  adminChangePin: string;
  adminNewPin: string;
  adminSavePin: string;
  adminPinSuccess: string;
  adminAddChannel: string;
  adminChannelName: string;
  adminChannelUrl: string;
  adminChannelCategory: string;
  adminChannelLogo: string;
  adminChannelDesc: string;
  adminSuccessAdd: string;
  adminDeleteChannel: string;
}

export const TRANSLATIONS: Record<IPTVLanguage, TranslationDict> = {
  TR: {
    appName: "EFES İPTV PRO",
    splashWelcome: "EFES İPTV Akıllı Altyapı Hazırlanıyor...",
    splashSecurity: "Güvenlik ve Lisans Doğrulaması Yapılıyor...",
    liveTv: "Canlı Yayınlar",
    movies: "Filmler",
    series: "Diziler",
    documentaries: "Belgeseller",
    radios: "Radyolar",
    favorites: "Favorilerim",
    history: "Son İzlenenler",
    customPlaylist: "Özel M3U Listeniz",
    allCategories: "Tüm Kategoriler",
    searchPlaceholder: "Kanal, dizi veya film ara...",
    nowPlaying: "Şu An Oynatılan Program",
    upNext: "Sıradaki Program",
    noEpg: "Bu kanal için EPG verisi bulunamadı.",
    epgGuide: "24 Saatlik Yayın Akışı (EPG)",
    m3uUploadTitle: "Kendi M3U Listenizi Ekleyin",
    m3uPlaceholder: "M3U Çalma Listesi URL'sini yapıştırın...",
    m3uLoadBtn: "Listeyi Yükle",
    m3uFileBtn: "M3U Dosyası Seç (.m3u)",
    aspectRatio: "Ekran Boyutu",
    dubbingSelect: "Dublaj / Ses Seçimi",
    themeToggle: "Tema Değiştir",
    remoteMode: "Kumanda (TV) Modu",
    mouseMode: "Dokunmatik/Fare Modu",
    remoteTip: "TV'de Yön Tuşları, Enter ve Esc tuşlarıyla tam kumanda kontrolü sağlayın.",
    resumeWatchTitle: "Kaldığın Yerden Devam Et",
    resumeText: "Bu yayını daha önce izlemiştiniz. Kaldığınız saniyeden devam etmek ister misiniz?",
    resumeYes: "Evet, Devam Et",
    resumeNo: "En Baştan Başlat",
    securityShield: "Lisans ve Kopya Koruma Kalkanı",
    securityOk: "Sistem Koruması Aktif (Değişiklik ve Kod Çekimi Engellendi)",
    autoTaramaText: "24 saatlik periyotlarla otomatik ulusal yayın ve film listeleri taranıp güncellendi.",
    autoTaramaBtn: "Şimdi Tara & Güncelle",
    watchTimeLeft: "Kaldığı süre:",
    addedFav: "Favorilere eklendi",
    removedFav: "Favorilerden çıkarıldı",
    bgPlayActive: "Arka Planda Ses Çalma Aktif",
    adminPanel: "Yönetici Kontrol Paneli",
    adminPinPrompt: "Yönetici Giriş Kodunu Giriniz",
    adminLoginBtn: "Yönetici Girişi",
    adminWrongPin: "Hatalı Giriş Kodu!",
    adminChangePin: "Giriş Kodunu Değiştir",
    adminNewPin: "Yeni Giriş Kodu (Sadece Rakam)",
    adminSavePin: "Yeni Giriş Kodunu Kaydet",
    adminPinSuccess: "Yönetici Giriş Kodu Başarıyla Güncellendi",
    adminAddChannel: "Yeni Kanal / Yayın Ekle",
    adminChannelName: "Yayın / Kanal Adı",
    adminChannelUrl: "Yayın Akış Kaynağı URL (M3U8 / MP4)",
    adminChannelCategory: "Yayın Kategorisi",
    adminChannelLogo: "Kanal / Film Görsel Logo URL",
    adminChannelDesc: "Yayın Açıklaması",
    adminSuccessAdd: "Yeni yayın listeye başarıyla eklendi",
    adminDeleteChannel: "Bu Yayını Listeden Kaldır"
  },
  EN: {
    appName: "EFES IPTV PRO",
    splashWelcome: "EFES IPTV Smart Infrastructure Booting...",
    splashSecurity: "Validating Security and License Integrity...",
    liveTv: "Live TV",
    movies: "Movies",
    series: "Series",
    documentaries: "Documentaries",
    radios: "Radios",
    favorites: "My Favorites",
    history: "Watch History",
    customPlaylist: "Custom M3U List",
    allCategories: "All Categories",
    searchPlaceholder: "Search channel, series or movie...",
    nowPlaying: "Now Playing",
    upNext: "Up Next",
    noEpg: "No EPG data found for this channel.",
    epgGuide: "24-Hour Broadcast Schedule (EPG)",
    m3uUploadTitle: "Add Your Own M3U Playlist",
    m3uPlaceholder: "Paste M3U Playlist URL...",
    m3uLoadBtn: "Load Playlist",
    m3uFileBtn: "Choose M3U File (.m3u)",
    aspectRatio: "Aspect Ratio",
    dubbingSelect: "Audio / Dubbing Selection",
    themeToggle: "Toggle Theme",
    remoteMode: "Remote (TV) Mode",
    mouseMode: "Touch/Mouse Mode",
    remoteTip: "Control completely using Arrow Keys, Enter, and Esc on TV.",
    resumeWatchTitle: "Resume Playback",
    resumeText: "You watched this before. Would you like to resume from where you left off?",
    resumeYes: "Yes, Resume",
    resumeNo: "Start from Beginning",
    securityShield: "License & Copy Protection Shield",
    securityOk: "System Integrity Active (Cloning & Tampering Prevented)",
    autoTaramaText: "National broadcasts, movie, and series lists are automatically scanned and updated every 24 hours.",
    autoTaramaBtn: "Scan & Update Now",
    watchTimeLeft: "Time left:",
    addedFav: "Added to favorites",
    removedFav: "Removed from favorites",
    bgPlayActive: "Background Audio Playback Active",
    adminPanel: "Admin Control Panel",
    adminPinPrompt: "Enter Administrator Access Code",
    adminLoginBtn: "Admin Login",
    adminWrongPin: "Incorrect Access Code!",
    adminChangePin: "Change Access Code",
    adminNewPin: "New Access Code (Numeric Only)",
    adminSavePin: "Save New Access Code",
    adminPinSuccess: "Access Code Updated Successfully",
    adminAddChannel: "Add New Stream / Channel",
    adminChannelName: "Stream / Channel Name",
    adminChannelUrl: "Stream Source URL (M3U8 / MP4)",
    adminChannelCategory: "Stream Category",
    adminChannelLogo: "Channel / Movie Artwork Logo URL",
    adminChannelDesc: "Stream Description",
    adminSuccessAdd: "New stream successfully added to global database",
    adminDeleteChannel: "Remove This Stream From Database"
  },
  DE: {
    appName: "EFES IPTV PRO",
    splashWelcome: "EFES IPTV Smart-Infrastruktur wird vorbereitet...",
    splashSecurity: "Sicherheits- und Lizenzüberprüfung...",
    liveTv: "Live TV",
    movies: "Filme",
    series: "Serien",
    documentaries: "Dokumentationen",
    radios: "Radios",
    favorites: "Meine Favoriten",
    history: "Verlauf",
    customPlaylist: "Eigene M3U-Liste",
    allCategories: "Alle Kategorien",
    searchPlaceholder: "Suche Kanal, Serie oder Film...",
    nowPlaying: "Aktuelle Sendung",
    upNext: "Nächste Sendung",
    noEpg: "Keine EPG-Daten für diesen Kanal gefunden.",
    epgGuide: "24-Stunden-Programmführer (EPG)",
    m3uUploadTitle: "Eigene M3U-Wiedergabeliste hinzufügen",
    m3uPlaceholder: "M3U-Wiedergabelisten-URL einfügen...",
    m3uLoadBtn: "Liste laden",
    m3uFileBtn: "M3U-Datei auswählen (.m3u)",
    aspectRatio: "Bildformat",
    dubbingSelect: "Audio / Synchronisation",
    themeToggle: "Thema wechseln",
    remoteMode: "Fernbedienungsmodus (TV)",
    mouseMode: "Touch/Mausmodus",
    remoteTip: "Vollständige Steuerung mit Pfeiltasten, Eingabe- und Esc-Taste auf dem Fernseher.",
    resumeWatchTitle: "Wiedergabe fortsetzen",
    resumeText: "Sie haben das schon einmal gesehen. Möchten Sie dort fortfahren, wo Sie aufgehört haben?",
    resumeYes: "Ja, fortsetzen",
    resumeNo: "Von vorne beginnen",
    securityShield: "Lizenz- und Kopierschutzschild",
    securityOk: "Integritätsschutz aktiv (Klonen & Code-Änderung gesperrt)",
    autoTaramaText: "Senderlisten und Filme werden alle 24 Stunden automatisch gescannt und aktualisiert.",
    autoTaramaBtn: "Jetzt scannen",
    watchTimeLeft: "Verbleibende Zeit:",
    addedFav: "Zu Favoriten hinzugefügt",
    removedFav: "Aus Favoriten entfernt",
    bgPlayActive: "Hintergrund-Audio-Wiedergabe aktiv",
    adminPanel: "Admin-Bereich",
    adminPinPrompt: "Admin-Zugangscode eingeben",
    adminLoginBtn: "Admin-Login",
    adminWrongPin: "Falscher Zugangscode!",
    adminChangePin: "Zugangscode ändern",
    adminNewPin: "Neuer Code (Nur Zahlen)",
    adminSavePin: "Neuen Code speichern",
    adminPinSuccess: "Zugangscode erfolgreich aktualisiert",
    adminAddChannel: "Neuen Sender hinzufügen",
    adminChannelName: "Sendername",
    adminChannelUrl: "Stream-Quell-URL (M3U8 / MP4)",
    adminChannelCategory: "Kategorie",
    adminChannelLogo: "Sender-Logo-URL",
    adminChannelDesc: "Beschreibung",
    adminSuccessAdd: "Sender erfolgreich hinzugefügt",
    adminDeleteChannel: "Diesen Sender löschen"
  },
  FR: {
    appName: "EFES IPTV PRO",
    splashWelcome: "Démarrage de l'infrastructure intelligente EFES IPTV...",
    splashSecurity: "Validation de la sécurité et de l'intégrité de la licence...",
    liveTv: "TV en Direct",
    movies: "Films",
    series: "Séries",
    documentaries: "Documentaires",
    radios: "Radios",
    favorites: "Mes Favoris",
    history: "Historique",
    customPlaylist: "Liste M3U Personnalisée",
    allCategories: "Toutes Catégories",
    searchPlaceholder: "Rechercher chaîne, série ou film...",
    nowPlaying: "Programme Actuel",
    upNext: "Programme Suivant",
    noEpg: "Aucune donnée EPG trouvée pour cette chaîne.",
    epgGuide: "Guide des programmes 24H (EPG)",
    m3uUploadTitle: "Ajoutez votre propre liste M3U",
    m3uPlaceholder: "Coller l'URL de la liste M3U...",
    m3uLoadBtn: "Charger la liste",
    m3uFileBtn: "Choisir un fichier M3U (.m3u)",
    aspectRatio: "Format d'image",
    dubbingSelect: "Sélection Audio / Doublage",
    themeToggle: "Changer de thème",
    remoteMode: "Mode Télécommande (TV)",
    mouseMode: "Mode Tactile/Souris",
    remoteTip: "Contrôlez entièrement avec les touches fléchées, Entrée et Échap sur TV.",
    resumeWatchTitle: "Reprendre la lecture",
    resumeText: "Vous avez déjà regardé cela. Voulez-vous reprendre là où vous vous étiez arrêté ?",
    resumeYes: "Oui, reprendre",
    resumeNo: "Recommencer au début",
    securityShield: "Bouclier de protection et de licence",
    securityOk: "Protection active (Copie de code et clonage bloqués)",
    autoTaramaText: "Les listes de diffusion nationale et de films sont scannées et mises à jour toutes les 24 heures.",
    autoTaramaBtn: "Mettre à jour maintenant",
    watchTimeLeft: "Temps restant:",
    addedFav: "Ajouté aux favoris",
    removedFav: "Supprimé des favoris",
    bgPlayActive: "Lecture audio en arrière-plan active",
    adminPanel: "Panneau d'administration",
    adminPinPrompt: "Entrez le code d'accès administrateur",
    adminLoginBtn: "Connexion Admin",
    adminWrongPin: "Code d'accès incorrect !",
    adminChangePin: "Modifier le code d'accès",
    adminNewPin: "Nouveau code d'accès (Numérique uniquement)",
    adminSavePin: "Enregistrer le code",
    adminPinSuccess: "Code d'accès mis à jour avec succès",
    adminAddChannel: "Ajouter un nouveau flux / chaîne",
    adminChannelName: "Nom de la chaîne",
    adminChannelUrl: "URL du flux (M3U8 / MP4)",
    adminChannelCategory: "Catégorie",
    adminChannelLogo: "URL du logo / affiche",
    adminChannelDesc: "Description",
    adminSuccessAdd: "Flux ajouté avec succès",
    adminDeleteChannel: "Supprimer ce flux"
  },
  ES: {
    appName: "EFES IPTV PRO",
    splashWelcome: "Iniciando infraestructura inteligente EFES IPTV...",
    splashSecurity: "Validando seguridad e integridad de licencia...",
    liveTv: "TV en Vivo",
    movies: "Películas",
    series: "Series",
    documentaries: "Documentales",
    radios: "Radios",
    favorites: "Mis Favoritos",
    history: "Historial",
    customPlaylist: "Lista M3U Personalizada",
    allCategories: "Todas las Categorías",
    searchPlaceholder: "Buscar canal, serie o película...",
    nowPlaying: "Programa Actual",
    upNext: "Siguiente Programa",
    noEpg: "No hay datos de EPG para este canal.",
    epgGuide: "Guía de Programación de 24 Horas (EPG)",
    m3uUploadTitle: "Agrega tu lista M3U",
    m3uPlaceholder: "Pegar URL de lista M3U...",
    m3uLoadBtn: "Cargar Lista",
    m3uFileBtn: "Elegir archivo M3U (.m3u)",
    aspectRatio: "Relación de Aspecto",
    dubbingSelect: "Selección de Audio / Doblaje",
    themeToggle: "Cambiar Tema",
    remoteMode: "Modo Mando (TV)",
    mouseMode: "Modo Táctil/Ratón",
    remoteTip: "Control total mediante flechas de dirección, Enter y Esc en TV.",
    resumeWatchTitle: "Reanudar Reproducción",
    resumeText: "Ya viste esto antes. ¿Deseas reanudar desde donde lo dejaste?",
    resumeYes: "Sí, reanudar",
    resumeNo: "Empezar de nuevo",
    securityShield: "Escudo de licencia y protección contra copias",
    securityOk: "Protección activa (Clonación y modificación de código deshabilitadas)",
    autoTaramaText: "Los canales nacionales y películas se escanean y actualizan automáticamente cada 24 horas.",
    autoTaramaBtn: "Escanear y actualizar ahora",
    watchTimeLeft: "Tiempo restante:",
    addedFav: "Añadido a favoritos",
    removedFav: "Eliminado de favoritos",
    bgPlayActive: "Reproducción de audio en segundo plano activa",
    adminPanel: "Panel de Administración",
    adminPinPrompt: "Ingrese el código de acceso de administrador",
    adminLoginBtn: "Acceso Admin",
    adminWrongPin: "¡Código de acceso incorrecto!",
    adminChangePin: "Cambiar código de acceso",
    adminNewPin: "Nuevo código (Solo números)",
    adminSavePin: "Guardar nuevo código",
    adminPinSuccess: "Código de acceso actualizado correctamente",
    adminAddChannel: "Agregar nueva transmisión / canal",
    adminChannelName: "Nombre del canal",
    adminChannelUrl: "URL del flujo (M3U8 / MP4)",
    adminChannelCategory: "Categoría",
    adminChannelLogo: "URL del logo / ilustración",
    adminChannelDesc: "Descripción",
    adminSuccessAdd: "Transmisión agregada con éxito",
    adminDeleteChannel: "Eliminar esta transmisión"
  }
};
