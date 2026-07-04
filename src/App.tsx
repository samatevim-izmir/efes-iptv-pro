import React, { useEffect, useState, useRef } from "react";
import { IPTVChannel, IPTVLanguage, TRANSLATIONS, EPGProgram, LicenseStatus } from "./types";
import SplashLoader from "./components/SplashLoader";
import VideoPlayer from "./components/VideoPlayer";
import RemoteControlHelp from "./components/RemoteControlHelp";
import { parseM3U } from "./components/M3uParser";
import {
  Tv, Film, PlayCircle, Heart, History, PlusCircle, Globe, Radio,
  Moon, Sun, Clock, ShieldCheck, RefreshCw, Upload, Sparkles,
  Tv2, CheckCircle, Search, HelpCircle, Eye, AlertTriangle, FileText,
  ShieldAlert, Lock, Settings, Trash2, Plus, Edit, ArrowLeft, ChevronLeft,
  Download, Smartphone, Monitor
} from "lucide-react";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<IPTVLanguage>("TR");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [channels, setChannels] = useState<IPTVChannel[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<IPTVChannel[]>([]);
  const [customM3uUrl, setCustomM3uUrl] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<IPTVChannel | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [epgList, setEpgList] = useState<EPGProgram[]>([]);
  const [isTvMode, setIsTvMode] = useState(false);
  const [showRemoteHelp, setShowRemoteHelp] = useState(false);

  // Keyboard navigation states (for Android TV arrow key navigation)
  const [focusedSection, setFocusedSection] = useState<"sidebar" | "grid" | "topbar">("grid");
  const [focusedSidebarIdx, setFocusedSidebarIdx] = useState(0);
  const [focusedGridIdx, setFocusedGridIdx] = useState(0);

  // Saved playback positions for "Kaldığın Yerden Devam Et" (Item 4)
  const [savedPositions, setSavedPositions] = useState<Record<string, number>>({});

  // Security & Integrity license state (Item 18)
  const [license, setLicense] = useState<LicenseStatus | null>(null);
  const [securityToast, setSecurityToast] = useState("");
  const [securityViolations, setSecurityViolations] = useState(0);

  // Current system clock
  const [currentTime, setCurrentTime] = useState("");

  // Admin Mode states
  const [adminToken, setAdminToken] = useState<string | null>(() => sessionStorage.getItem("admin_token"));
  const [adminPinInput, setAdminPinInput] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminSuccess, setAdminSuccess] = useState("");
  
  // Change PIN states
  const [currentPinInput, setCurrentPinInput] = useState("");
  const [newPinInput, setNewPinInput] = useState("");

  // Scan public playlist states
  const [scanPreset, setScanPreset] = useState<"all" | "tr" | "world" | "radio">("all");
  const [scanKeyword, setScanKeyword] = useState("");
  const [scanCustomUrl, setScanCustomUrl] = useState("");
  const [scanStats, setScanStats] = useState<{
    playlistsScanned: number;
    successCount: number;
    failCount: number;
    newChannelsAdded: number;
    streamsMerged: number;
    totalChannelsCount: number;
  } | null>(null);
  const [isScanningPlaylists, setIsScanningPlaylists] = useState(false);

  // Add channel states
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [addChannelName, setAddChannelName] = useState("");
  const [addChannelUrl, setAddChannelUrl] = useState("");
  const [addChannelLogo, setAddChannelLogo] = useState("");
  const [addChannelCategory, setAddChannelCategory] = useState("National");
  const [addChannelLanguage, setAddChannelLanguage] = useState("TR");
  const [addChannelType, setAddChannelType] = useState<"live" | "movie" | "series" | "documentary">("live");
  const [addChannelDesc, setAddChannelDesc] = useState("");

  // Upgrade states
  const [isUpdatingTurkish, setIsUpdatingTurkish] = useState(false);
  const [turkishUpdateResult, setTurkishUpdateResult] = useState("");
  const [upgradeFilePath, setUpgradeFilePath] = useState("src/App.tsx");
  const [upgradeFileContent, setUpgradeFileContent] = useState("");
  const [isUpgradingFile, setIsUpgradingFile] = useState(false);
  const [upgradeFileResult, setUpgradeFileResult] = useState("");
  const [isUpgradingZip, setIsUpgradingZip] = useState(false);
  const [upgradeZipResult, setUpgradeZipResult] = useState("");

  // PWA (Progressive Web App) Install state and handlers
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Check standalone mode
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      setShowInstallHelp(true);
      return;
    }
    deferredPrompt.prompt();
    try {
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsAppInstalled(true);
      }
    } catch (err) {
      console.error("Install prompt error:", err);
    }
    setDeferredPrompt(null);
  };

  const t = TRANSLATIONS[lang];

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");
    setAdminSuccess("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: adminPinInput })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem("admin_token", data.token);
        setAdminToken(data.token);
        setAdminPinInput("");
        setSecurityToast("Yönetici girişi başarılı!");
        setTimeout(() => setSecurityToast(""), 3000);
      } else {
        setAdminError(t.adminWrongPin);
      }
    } catch {
      setAdminError("Giriş başarısız, lütfen tekrar deneyin.");
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem("admin_token");
    setAdminToken(null);
    setAdminSuccess("");
    setAdminError("");
  };

  const handleAdminChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");
    setAdminSuccess("");
    if (!newPinInput || !/^\d+$/.test(newPinInput)) {
      setAdminError("Yeni giriş kodu sadece rakamlardan oluşmalıdır.");
      return;
    }
    try {
      const res = await fetch("/api/admin/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: adminToken,
          currentPin: currentPinInput,
          newPin: newPinInput
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminSuccess(t.adminPinSuccess);
        setCurrentPinInput("");
        setNewPinInput("");
        setSecurityToast(t.adminPinSuccess);
        setTimeout(() => setSecurityToast(""), 3000);
      } else {
        setAdminError(data.error || "Giriş kodu değiştirilemedi.");
      }
    } catch {
      setAdminError("Sunucu bağlantı hatası.");
    }
  };

  const handleAdminUpdateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannelId) return;
    setAdminError("");
    setAdminSuccess("");
    if (!addChannelName.trim() || !addChannelUrl.trim()) {
      setAdminError("Kanal adı ve yayın kaynağı URL zorunludur.");
      return;
    }
    try {
      const res = await fetch("/api/admin/update-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: adminToken,
          channel: {
            id: editingChannelId,
            name: addChannelName,
            logo: addChannelLogo,
            streamUrl: addChannelUrl,
            category: addChannelCategory,
            description: addChannelDesc,
            language: addChannelLanguage,
            type: addChannelType
          }
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminSuccess("Kanal başarıyla güncellendi!");
        setEditingChannelId(null);
        setAddChannelName("");
        setAddChannelUrl("");
        setAddChannelLogo("");
        setAddChannelDesc("");
        
        // Reload channels list dynamically
        const channelsRes = await fetch("/api/auto-channels");
        const channelsData = await channelsRes.json();
        if (channelsData.channels) {
          setChannels(channelsData.channels);
        }
        setSecurityToast("Kanal Başarıyla Güncellendi");
        setTimeout(() => setSecurityToast(""), 3000);
      } else {
        setAdminError(data.error || "Kanal güncellenemedi.");
      }
    } catch {
      setAdminError("Bağlantı hatası oluştu.");
    }
  };

  const handleAdminAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");
    setAdminSuccess("");
    if (!addChannelName.trim() || !addChannelUrl.trim()) {
      setAdminError("Kanal adı ve yayın kaynağı URL zorunludur.");
      return;
    }
    try {
      const res = await fetch("/api/admin/add-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: adminToken,
          channel: {
            name: addChannelName,
            logo: addChannelLogo,
            streamUrl: addChannelUrl,
            category: addChannelCategory,
            description: addChannelDesc,
            language: addChannelLanguage,
            type: addChannelType
          }
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminSuccess(t.adminSuccessAdd);
        setAddChannelName("");
        setAddChannelUrl("");
        setAddChannelLogo("");
        setAddChannelDesc("");
        
        // Reload channels list dynamically!
        const channelsRes = await fetch("/api/auto-channels");
        const channelsData = await channelsRes.json();
        if (channelsData.channels) {
          setChannels(channelsData.channels);
        }
        setSecurityToast(t.adminSuccessAdd);
        setTimeout(() => setSecurityToast(""), 3000);
      } else {
        setAdminError(data.error || "Kanal eklenemedi.");
      }
    } catch {
      setAdminError("Bağlantı hatası oluştu.");
    }
  };

  const handleAdminDeleteChannel = async (id: string) => {
    if (!window.confirm("Bu yayını silmek istediğinize emin misiniz?")) return;
    setAdminError("");
    setAdminSuccess("");
    try {
      const res = await fetch("/api/admin/delete-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: adminToken,
          id
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminSuccess("Yayın listeden başarıyla kaldırıldı.");
        
        // Reload channels list dynamically!
        const channelsRes = await fetch("/api/auto-channels");
        const channelsData = await channelsRes.json();
        if (channelsData.channels) {
          setChannels(channelsData.channels);
        }
        setSecurityToast("Kanal Silindi");
        setTimeout(() => setSecurityToast(""), 3000);
      } else {
        setAdminError(data.error || "Kanal silinemedi.");
      }
    } catch {
      setAdminError("Kanal silinirken hata oluştu.");
    }
  };

  // Handle Turkish channels automatic internet database refresh
  const handleUpdateTurkishChannels = async () => {
    if (!adminToken) return;
    setIsUpdatingTurkish(true);
    setTurkishUpdateResult("");
    try {
      setSecurityToast("Türksat Yayınları İnternetten Güncelleniyor...");
      const res = await fetch("/api/admin/update-turkish-channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: adminToken })
      });
      const data = await res.json();
      if (res.ok) {
        const statsMsg = `Başarı! ${data.searchedSources} kaynaktan ${data.successfulSources} tanesi başarıyla tarandı. ` +
          `• Güncellenen Yayın Linki: ${data.updatedUrlsCount} • Güncellenen/Düzeltilen Kategori: ${data.updatedCategoriesCount} ` +
          `• Toplam Yayın Sayısı: ${data.totalCount}`;
        setTurkishUpdateResult(statsMsg);
        setSecurityToast("Yayınlar ve Kategoriler Güncellendi!");
        // Refresh local state list
        const channelsRes = await fetch("/api/auto-channels");
        const channelsData = await channelsRes.json();
        if (channelsData.channels) {
          setChannels(channelsData.channels);
        }
      } else {
        setTurkishUpdateResult(`Hata: ${data.error || "Güncelleme başarısız."}`);
      }
    } catch (err: any) {
      setTurkishUpdateResult(`Hata: ${err.message}`);
    } finally {
      setIsUpdatingTurkish(false);
    }
  };

  // Handle single file upgrade/overwrite
  const handleUpgradeFile = async () => {
    if (!adminToken) return;
    if (!upgradeFilePath || !upgradeFileContent) {
      setUpgradeFileResult("Lütfen dosya yolu ve dosya içeriğini doldurunuz.");
      return;
    }
    setIsUpgradingFile(true);
    setUpgradeFileResult("");
    try {
      setSecurityToast("Dosya Üzerine Yazılıyor...");
      const res = await fetch("/api/admin/upgrade-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: adminToken,
          filePath: upgradeFilePath,
          content: upgradeFileContent
        })
      });
      const data = await res.json();
      if (res.ok) {
        setUpgradeFileResult(`Başarılı! ${upgradeFilePath} dosyası başarıyla güncellendi.`);
        setSecurityToast("Sistem Dosyası Güncellendi!");
        setUpgradeFileContent("");
      } else {
        setUpgradeFileResult(`Hata: ${data.error || "Dosya güncellenemedi."}`);
      }
    } catch (err: any) {
      setUpgradeFileResult(`Hata: ${err.message}`);
    } finally {
      setIsUpgradingFile(false);
    }
  };

  // Handle ZIP file upload and extract upgrade
  const handleUpgradeZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!adminToken) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUpgradingZip(true);
    setUpgradeZipResult("ZIP Dosyası Okunuyor...");
    setSecurityToast("Yeni Sürüm ZIP Yükleniyor...");

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        try {
          const res = await fetch("/api/admin/upgrade-zip", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: adminToken,
              zipBase64: base64
            })
          });
          const data = await res.json();
          if (res.ok) {
            setUpgradeZipResult("Sürüm başarıyla güncellendi! Değişikliklerin devreye girmesi için sayfa yeniden yükleniyor...");
            setSecurityToast("Sürüm Güncellendi!");
            setTimeout(() => {
              window.location.reload();
            }, 3000);
          } else {
            setUpgradeZipResult(`Hata: ${data.error || "ZIP yüklenemedi."}`);
          }
        } catch (err: any) {
          setUpgradeZipResult(`Hata: ${err.message}`);
        } finally {
          setIsUpgradingZip(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUpgradeZipResult(`Dosya okuma hatası: ${err.message}`);
      setIsUpgradingZip(false);
    }
  };

  // Load language preference and favorites on startup
  useEffect(() => {
    const savedLang = localStorage.getItem("iptv_lang") as IPTVLanguage;
    if (savedLang) setLang(savedLang);

    const savedTheme = localStorage.getItem("iptv_theme") as "dark" | "light";
    if (savedTheme) setTheme(savedTheme);

    const savedFavs = JSON.parse(localStorage.getItem("iptv_favorites") || "[]");
    setFavorites(savedFavs);

    const savedHist = JSON.parse(localStorage.getItem("iptv_history") || "[]");
    setHistory(savedHist);

    const savedPos = JSON.parse(localStorage.getItem("iptv_positions") || "{}");
    setSavedPositions(savedPos);
  }, []);

  // Update clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch verified license status and seed channel databases (Item 8 & 18)
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        // Fetch auto discovery list
        const res = await fetch("/api/auto-channels");
        const data = await res.json();
        if (data.channels) {
          setChannels(data.channels);
        }

        // Fetch license signature check
        const licRes = await fetch("/api/verify-license");
        const licData = await licRes.json();
        setLicense(licData);
      } catch (err) {
        console.error("Error fetching boot data:", err);
      }
    };
    fetchMetadata();
  }, []);

  // Anti-tamper protection controls (Item 18)
  useEffect(() => {
    const disableInspect = (e: KeyboardEvent) => {
      // Prevent F12, Ctrl+Shift+I, Ctrl+U
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.key === "u") ||
        (e.ctrlKey && e.key === "U")
      ) {
        e.preventDefault();
        setSecurityViolations(v => v + 1);
        setSecurityToast("DİKKAT: Güvenlik Kalkanı Aktif. Kaynak kodu incelemesi engellendi.");
        setTimeout(() => setSecurityToast(""), 4000);
      }
    };

    const disableRightClick = (e: MouseEvent) => {
      e.preventDefault();
      setSecurityViolations(v => v + 1);
      setSecurityToast("GÜVENLİ ALTYAPI: Sağ tıklama ve kod kopyalama sınırlandırıldı.");
      setTimeout(() => setSecurityToast(""), 4000);
    };

    document.addEventListener("keydown", disableInspect);
    document.addEventListener("contextmenu", disableRightClick);

    return () => {
      document.removeEventListener("keydown", disableInspect);
      document.removeEventListener("contextmenu", disableRightClick);
    };
  }, []);

  // Fetch EPG for selected channel automatically (Item 9)
  useEffect(() => {
    if (!selectedChannel) return;

    const fetchEPG = async () => {
      try {
        const res = await fetch(`/api/epg?channelId=${selectedChannel.id}`);
        const data = await res.json();
        if (data.programs) {
          setEpgList(data.programs);
        }
      } catch (err) {
        console.error("Error loading EPG:", err);
      }
    };
    fetchEPG();
  }, [selectedChannel]);

  // Categories Sidebar Array
  const categoriesList = [
    { id: "National", label: t.liveTv, icon: Tv2 },
    { id: "Premium", label: "Premium Platformlar", icon: Sparkles },
    { id: "Movies", label: t.movies, icon: Film },
    { id: "Series", label: t.series, icon: PlayCircle },
    { id: "Documentary", label: t.documentaries, icon: Globe },
    { id: "Radio", label: t.radios, icon: Radio },
    { id: "Favorites", label: t.favorites, icon: Heart },
    { id: "History", label: t.history, icon: History },
    { id: "CustomPlaylist", label: t.customPlaylist, icon: PlusCircle },
    { id: "AdminPanel", label: t.adminPanel, icon: ShieldAlert }
  ];

  // Helpers for Categories Dashboard (Sekmeler)
  const getCategoryCount = (catId: string) => {
    if (catId === "Favorites") return favorites.length;
    if (catId === "History") return history.length;
    if (catId === "CustomPlaylist") return channels.filter(c => c.id.startsWith("custom_")).length;
    if (catId === "AdminPanel") return undefined;
    return channels.filter(c => c.category === catId).length;
  };

  const getCategoryDescription = (catId: string | null) => {
    if (!catId) return "";
    switch (catId) {
      case "National": return lang === "TR" ? "Canlı ulusal, haber ve spor TV yayınları." : "Live national, news, and sports channels.";
      case "Premium": return lang === "TR" ? "Netflix, BluTV, Exxen, Gain ve TOD Premium film, dizi ve özel içerikleri." : "Premium Turkish OTT platform movies, series, and exclusives.";
      case "Movies": return lang === "TR" ? "Özenle seçilmiş yerli ve yabancı sinema filmleri." : "Selected blockbuster movies.";
      case "Series": return lang === "TR" ? "Popüler dizi serileri ve tüm bölümler." : "Popular TV series and complete episodes.";
      case "Documentary": return lang === "TR" ? "Doğa, uzay, bilim ve tarih belgeselleri." : "Nature, science, and history documentaries.";
      case "Radio": return lang === "TR" ? "Kesintisiz müzik ve sohbet radyoları." : "Continuous music and talk radio stations.";
      case "Favorites": return lang === "TR" ? "Hızlı erişim için favoriye eklediğiniz yayınlar." : "Your bookmarked favorite streams.";
      case "History": return lang === "TR" ? "Son izlediğiniz ve yarım kalan yayınlar." : "Recently watched and incomplete content.";
      case "CustomPlaylist": return lang === "TR" ? "Cihazınızdan veya URL ile harici liste yükleyin." : "Load custom playlists via M3U files or URL.";
      case "AdminPanel": return lang === "TR" ? "Kanal ekleme, güncelleme ve PIN kodunu yönetme." : "Add, update channels, and manage PIN.";
      default: return "";
    }
  };

  const handleExitApp = () => {
    setLoading(true);
    // Mimic app shutdown and fresh start after a tiny timeout
    setTimeout(() => {
      setLoading(false);
      setActiveCategory(null);
    }, 2000);
  };

  // Filtering channels
  const getFilteredChannels = () => {
    if (!activeCategory) return [];
    let list = [...channels];
    if (activeCategory === "Favorites") {
      list = list.filter(c => favorites.includes(c.id));
    } else if (activeCategory === "History") {
      list = history;
    } else if (activeCategory === "CustomPlaylist") {
      list = list.filter(c => c.id.startsWith("custom_"));
    } else {
      list = list.filter(c => c.category === activeCategory);
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }

    // A/Z alfabetik sıralama
    list.sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }));

    return list;
  };

  const filteredChannels = getFilteredChannels();

  // Keyboard navigation for TV Box remote keys (Up, Down, Left, Right, Enter, Escape)
  useEffect(() => {
    if (!isTvMode) return;

    const handleTvKeys = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Backspace") {
        e.preventDefault();
        if (selectedChannel) {
          setSelectedChannel(null);
        } else if (activeCategory !== null) {
          setActiveCategory(null);
        } else {
          setShowRemoteHelp(false);
        }
        return;
      }

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          if (focusedSection === "grid") {
            if (focusedGridIdx >= 4) {
              setFocusedGridIdx(focusedGridIdx - 4);
            } else {
              setFocusedSection("topbar");
            }
          } else if (focusedSection === "sidebar") {
            setFocusedSidebarIdx(prev => Math.max(0, prev - 1));
          }
          break;

        case "ArrowDown":
          e.preventDefault();
          if (focusedSection === "topbar") {
            setFocusedSection("grid");
            setFocusedGridIdx(0);
          } else if (focusedSection === "grid") {
            if (focusedGridIdx + 4 < filteredChannels.length) {
              setFocusedGridIdx(focusedGridIdx + 4);
            }
          } else if (focusedSection === "sidebar") {
            setFocusedSidebarIdx(prev => Math.min(categoriesList.length - 1, prev + 1));
          }
          break;

        case "ArrowLeft":
          e.preventDefault();
          if (focusedSection === "grid") {
            if (focusedGridIdx % 4 === 0) {
              setFocusedSection("sidebar");
            } else {
              setFocusedGridIdx(prev => Math.max(0, prev - 1));
            }
          } else if (focusedSection === "topbar") {
            setFocusedSection("sidebar");
          }
          break;

        case "ArrowRight":
          e.preventDefault();
          if (focusedSection === "sidebar") {
            setFocusedSection("grid");
            setActiveCategory(categoriesList[focusedSidebarIdx].id);
            setFocusedGridIdx(0);
          } else if (focusedSection === "grid") {
            setFocusedGridIdx(prev => Math.min(filteredChannels.length - 1, prev + 1));
          }
          break;

        case "Enter":
          e.preventDefault();
          if (focusedSection === "sidebar") {
            setActiveCategory(categoriesList[focusedSidebarIdx].id);
            setFocusedSection("grid");
            setFocusedGridIdx(0);
          } else if (focusedSection === "grid") {
            if (filteredChannels[focusedGridIdx]) {
              handlePlayChannel(filteredChannels[focusedGridIdx]);
            }
          }
          break;

        case "Escape":
          e.preventDefault();
          setShowRemoteHelp(false);
          break;
      }
    };

    window.addEventListener("keydown", handleTvKeys);
    return () => window.removeEventListener("keydown", handleTvKeys);
  }, [isTvMode, focusedSection, focusedSidebarIdx, focusedGridIdx, filteredChannels, selectedChannel, activeCategory]);

  // Favorite button action
  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updated;
    if (favorites.includes(id)) {
      updated = favorites.filter(fid => fid !== id);
      setSecurityToast(t.removedFav);
    } else {
      updated = [...favorites, id];
      setSecurityToast(t.addedFav);
    }
    setFavorites(updated);
    localStorage.setItem("iptv_favorites", JSON.stringify(updated));
    setTimeout(() => setSecurityToast(""), 3000);
  };

  // Channel click handler - integrates Kaldığın Yerden Devam Et and Son İzlenenler
  const handlePlayChannel = (chan: IPTVChannel) => {
    // Save in Watch History if not exists
    const withoutCurrent = history.filter(h => h.id !== chan.id);
    const updatedHistory = [chan, ...withoutCurrent].slice(0, 30);
    setHistory(updatedHistory);
    localStorage.setItem("iptv_history", JSON.stringify(updatedHistory));

    // Open Main Video Player
    setSelectedChannel(chan);
  };

  // Background Audio minimization trigger (Item 6)
  const handleClosePlayerAndBackgroundAudio = () => {
    setSelectedChannel(null);
  };

  // Saved position tracker (Item 4)
  const handleSavePlaybackProgress = (channelId: string, seconds: number) => {
    const updated = { ...savedPositions, [channelId]: seconds };
    setSavedPositions(updated);
    localStorage.setItem("iptv_positions", JSON.stringify(updated));
  };

  // Handle autoplay or manually trigger next episode for Series (Item: dizi otomatik sonraki bolum)
  const handlePlayNextEpisode = (current: IPTVChannel) => {
    // Find all channels of category 'Series' or 'Diziler'
    const seriesChannels = channels.filter(c => c.category === "Series" || c.category === "Diziler");
    // Find current channel index
    const idx = seriesChannels.findIndex(c => c.id === current.id);
    if (idx !== -1 && idx < seriesChannels.length - 1) {
      const nextChan = seriesChannels[idx + 1];
      setSelectedChannel(nextChan);
      setSecurityToast(`Sonraki Bölüm Başlatılıyor: ${nextChan.name}`);
      setTimeout(() => setSecurityToast(""), 4000);
    } else {
      setSecurityToast("Dizi serisinin sonuna ulaşıldı.");
      setTimeout(() => setSecurityToast(""), 4000);
    }
  };

  // M3U Loading URLs handler
  const handleLoadCustomM3uUrl = async () => {
    if (!customM3uUrl.trim()) return;
    try {
      setSecurityToast("M3U Çalma Listesi Çekiliyor...");
      // Proxying request to prevent CORS error
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(customM3uUrl)}`;
      const res = await fetch(proxyUrl);
      const text = await res.text();
      const parsed = parseM3U(text);
      if (parsed.length > 0) {
        setChannels(prev => [...prev, ...parsed]);
        setActiveCategory("CustomPlaylist");
        setSecurityToast(`${parsed.length} Kanal Özel Listenize Eklendi!`);
      } else {
        setSecurityToast("Hata: Geçerli kanal bulunamadı veya bağlantı hatalı.");
      }
    } catch (err) {
      setSecurityToast("Bağlantı Hatası: Liste yüklenemedi.");
    }
    setTimeout(() => setSecurityToast(""), 4000);
  };

  // Local M3U File picker handler
  const handleLoadM3uFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseM3U(text);
      if (parsed.length > 0) {
        setChannels(prev => [...prev, ...parsed]);
        setActiveCategory("CustomPlaylist");
        setSecurityToast(`${parsed.length} Kanal Dosyadan Eklendi!`);
      } else {
        setSecurityToast("Hata: Dosya içeriği geçersiz.");
      }
    };
    reader.readAsText(file);
    setTimeout(() => setSecurityToast(""), 4000);
  };

  // Automatic daily lists scan refresh simulation (Item 8)
  const handleForceAutoTarama = async () => {
    setIsScanningPlaylists(true);
    setSecurityToast("IPTV Sunucuları ve Veritabanı Taranıyor...");
    setScanStats(null);
    try {
      const res = await fetch("/api/scan-public-playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customSourceUrl: scanCustomUrl,
          keywordFilter: scanKeyword,
          selectedPreset: scanPreset
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setChannels(data.channels);
        setScanStats(data.stats);
        setSecurityToast("İnternet Taraması Tamamlandı! Kanallar Birleştirildi.");
      } else {
        setSecurityToast("Tarama hatası oluştu, yerel liste yüklendi.");
      }
    } catch (err) {
      setSecurityToast("Bağlantı hatası: Sunucuya ulaşılamadı.");
    }
    setIsScanningPlaylists(false);
    setTimeout(() => setSecurityToast(""), 5000);
  };

  if (loading) {
    return <SplashLoader lang={lang} onLoaded={() => setLoading(false)} />;
  }

  return (
    <div className={`min-h-screen font-sans bg-cyber-bg text-white selection:bg-cyber-accent/20 selection:text-cyber-accent`}>
      
      {/* Floating security watermark text overlay across application canvas (Item 18) */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 -rotate-12 opacity-[0.02] select-none pointer-events-none text-center font-mono text-3xl z-0 tracking-widest text-cyber-accent">
        SECURE IPTV PLATFORM COPY SHIELD VERIFICATION {license?.securityToken?.substring(0, 15)}
      </div>

      {/* Main Terminal Grid Container */}
      <div className="min-h-screen flex flex-col md:flex-row relative z-10">
        
        {/* Left Side: Slim Cyber Status Bar */}
        <div className="hidden md:flex flex-col items-center justify-between py-8 px-4 border-r border-white/10 w-16 shrink-0 bg-black/40">
          <div className="flex flex-col gap-6 items-center">
            <div className="w-3 h-3 rounded-full bg-cyber-accent shadow-[0_0_12px_#00ff66] animate-pulse" title="System Normal"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>
          </div>
          <div className="font-mono text-[8px] text-white/20 -rotate-90 origin-center whitespace-nowrap tracking-widest py-4">
            SYS_v6.82
          </div>
        </div>

        {/* Middle Left Side: Categories Nav Pane Sidebar */}
        <aside className="hidden md:flex flex-col border-r border-white/10 p-6 w-64 shrink-0 bg-black/20">
          <div className="brand-id font-display text-xl font-extrabold tracking-widest text-cyber-accent mb-8 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-cyber-accent animate-ping rounded-full"></span>
            EFES_PRO
          </div>
          
          <div className="flex-1 flex flex-col justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[9px] text-white/30 mb-2 tracking-widest block font-bold">CATEGORIES_INDEX</span>
              {categoriesList.map((cat, idx) => {
                const isActive = activeCategory === cat.id;
                const count = getCategoryCount(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(isActive ? null : cat.id)}
                    className={`text-left font-mono text-[10px] tracking-wider uppercase py-2.5 px-3 rounded-md border transition-all duration-300 cursor-pointer flex justify-between items-center ${
                      isActive
                        ? "bg-cyber-accent/10 border-cyber-accent/50 text-cyber-accent shadow-[0_0_12px_rgba(0,255,102,0.1)] font-bold"
                        : "bg-transparent border-transparent text-white/40 hover:text-white/80 hover:bg-white/5"
                    }`}
                  >
                    <span>{String(idx + 1).padStart(2, '0')}_{cat.id.toUpperCase().substring(0, 15)}</span>
                    {count !== undefined && (
                      <span className="text-[8px] text-white/30">[{count}]</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 pt-4 border-t border-white/5 font-mono text-[9px] text-white/30 flex flex-col gap-1">
              <div>UPLINK: <span className="text-white">842.1 MBPS</span></div>
              <div>VERIFY: <span className="text-cyber-accent">PASS</span></div>
            </div>
          </div>
        </aside>

        {/* Right Side: Main Viewport (Top Header + Contents Grid + Bottom Status Footer) */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* Top Navigation Bar */}
          <header className="sticky top-0 z-30 px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-cyber-bg/90 backdrop-blur-md">
            
            {/* App Title & Dynamic Clock */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-cyber-accent/15 border border-cyber-accent/30 text-cyber-accent shadow-[0_0_15px_rgba(0,255,102,0.1)]">
                <Tv className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h1 className="font-display text-sm sm:text-base font-black tracking-widest text-white uppercase">{t.appName}</h1>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyber-accent">
                  <Clock className="w-3 h-3" />
                  <span className="font-bold">{currentTime || "00:00:00"}</span>
                </div>
              </div>
            </div>

            {/* Global Control Toggles & Global Search */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Channel Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-white/40" />
                <input
                  type="text"
                  placeholder="SYSTEM_SEARCH_QUERY..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 rounded-none bg-white/5 border border-white/10 text-xs w-48 sm:w-56 outline-none transition-all focus:border-cyber-accent focus:bg-white/10 text-white font-mono placeholder:text-white/20"
                />
              </div>

              {/* TV / Remote Controller Mode Toggle */}
              <button
                onClick={() => {
                  setIsTvMode(!isTvMode);
                  if (!isTvMode) {
                    setShowRemoteHelp(true);
                    setFocusedSection("grid");
                  }
                }}
                className={`px-3 py-1.5 rounded-none text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer border ${
                  isTvMode ? "bg-cyber-accent text-black border-cyber-accent font-bold" : "bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10"
                }`}
              >
                <HelpCircle className="w-3 h-3" />
                {isTvMode ? t.remoteMode : t.mouseMode}
              </button>

              {/* Global Language Dropdown */}
              <div className="relative flex items-center gap-1 bg-white/5 border border-white/10 text-white/60 px-2.5 py-1.5 rounded-none text-[10px] font-mono">
                <Globe className="w-3.5 h-3.5 text-cyber-accent" />
                <select
                  value={lang}
                  onChange={(e) => {
                    const nextLang = e.target.value as IPTVLanguage;
                    setLang(nextLang);
                    localStorage.setItem("iptv_lang", nextLang);
                  }}
                  className="bg-transparent outline-none cursor-pointer pr-1 text-white uppercase"
                >
                  <option value="TR" className="text-black">TR (Türkçe)</option>
                  <option value="EN" className="text-black">EN (English)</option>
                  <option value="DE" className="text-black">DE (Deutsch)</option>
                  <option value="FR" className="text-black">FR (Français)</option>
                  <option value="ES" className="text-black">ES (Español)</option>
                </select>
              </div>

            </div>

          </header>

          {/* Security Toast Warning for Anti-cloning / Code protections (Item 18) */}
          {securityToast && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-red-950/90 border border-red-500 text-red-200 px-5 py-3 rounded-none shadow-2xl flex items-center gap-3 animate-slide-in text-xs font-mono max-w-md text-center backdrop-blur-md">
              <AlertTriangle className="w-4 h-4 text-red-400 animate-ping flex-shrink-0" />
              <span>{securityToast}</span>
            </div>
          )}

          {/* Main Grid Workspace */}
          <main className="max-w-[1600px] mx-auto p-6 relative z-10">
        
        {activeCategory === null ? (
          /* CASE 1: CATEGORIES DASHBOARD PAGE (SEKMELER TABLOSU) */
          <div className="flex flex-col gap-6 animate-fade-in font-sans">
            {/* Dashboard Header with a Back button in the top left */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExitApp}
                  className="flex items-center gap-2 px-3.5 py-2 bg-white/5 border border-white/10 hover:border-cyber-accent text-white hover:text-cyber-accent rounded-none text-[10px] font-mono uppercase tracking-wider transition duration-300 shadow-md cursor-pointer"
                  title="Uygulamadan Çık"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-cyber-accent" />
                  <span>SYS_EXIT / TERMINATE</span>
                </button>
                <div>
                  <h2 className="text-xl font-display font-black tracking-widest text-white uppercase">YAYIN_KATEGORİLERİ</h2>
                  <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider mt-0.5">SELECT_NODE_FOR_STREAM_BROADCAST_CATALOGUE</p>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-black/60 px-3.5 py-1.5 text-cyber-accent border border-cyber-accent/20 font-bold self-start sm:self-center uppercase tracking-widest">
                TOTAL_STREAMS: {channels.length}
              </span>
            </div>

            {/* Grid of Categories (Box icons) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {categoriesList.map((cat, idx) => {
                const IconComp = cat.icon;
                const count = getCategoryCount(cat.id);
                const isFocused = isTvMode && focusedSection === "sidebar" && focusedSidebarIdx === idx;

                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      if (isTvMode) {
                        setFocusedSidebarIdx(idx);
                        setFocusedSection("grid");
                        setFocusedGridIdx(0);
                      }
                    }}
                    className={`relative overflow-hidden rounded-none border p-5 flex flex-col justify-between text-left h-44 group transition-all duration-300 cursor-pointer ${
                      theme === "dark" 
                        ? "bg-cyber-bg/40 border-white/10 hover:border-cyber-accent hover:bg-black/85 hover:shadow-[0_0_15px_rgba(0,255,102,0.08)]" 
                        : "bg-white border-slate-200 hover:border-indigo-500 hover:shadow-indigo-500/5 hover:shadow-xl hover:bg-slate-50"
                    } ${isFocused ? "border-cyber-accent border-2 scale-102 ring-2 ring-cyber-accent/20" : ""}`}
                  >
                    {/* Background decoration grid pattern */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle,rgba(0,255,102,0.05)_1px,transparent_1px)] bg-[size:12px_12px] group-hover:scale-110 transition-transform duration-500"></div>

                    <div className="flex items-start justify-between relative z-10">
                      <div className="p-2.5 rounded-none bg-white/5 text-cyber-accent border border-white/10 group-hover:text-black group-hover:bg-cyber-accent group-hover:border-cyber-accent transition-all duration-300 shadow">
                        <IconComp className="w-4 h-4" />
                      </div>
                      {count !== undefined && (
                        <span className="font-mono text-[9px] font-bold bg-white/5 px-2 py-0.5 text-white/50 border border-white/10 group-hover:border-cyber-accent/30 uppercase tracking-widest">
                          [{count} {lang === "TR" ? "YAYIN" : "ITEMS"}]
                        </span>
                      )}
                    </div>

                    <div className="mt-4 relative z-10">
                      <div className="font-mono text-[9px] text-cyber-accent/60 mb-1">
                        NODE_{String(idx + 1).padStart(2, '0')} // LOCAL_PORT
                      </div>
                      <h3 className="font-display font-extrabold text-sm tracking-widest text-white uppercase group-hover:text-cyber-accent transition-colors">
                        {cat.label}
                      </h3>
                      <p className="text-[10px] font-mono opacity-50 mt-1 leading-relaxed text-white line-clamp-2">
                        {getCategoryDescription(cat.id)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Info Metrics, Security & Autotarama Panels at the Bottom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 border-t border-white/10 pt-8">
              
              {/* SECURITY STATUS DISPLAY */}
              <div className={`p-5 rounded-none border border-white/10 text-xs bg-black/40 font-mono`}>
                <div className="flex items-center gap-2 font-bold mb-3 font-display uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-cyber-accent" />
                  <span className="text-white">{t.securityShield}</span>
                </div>
                <p className="text-[10px] opacity-70 leading-relaxed mb-4 text-white uppercase tracking-wider">
                  {t.securityOk}
                </p>
                <div className="flex flex-col gap-1.5 font-mono text-[10px] text-cyber-accent bg-black/60 p-3 rounded-none border border-white/5">
                  <div>HOST: {license?.host || "VERIFIED"}</div>
                  <div>VIOLATIONS BLOCKED: {securityViolations}</div>
                  <div>ENCRYPTION: SHIELD_AES256_v6</div>
                </div>
              </div>

              {/* DAILY SCAN AUTOMATIC DISCOVERY STATUS */}
              <div className={`p-5 rounded-none border border-white/10 text-xs bg-black/40 font-mono`}>
                <div className="flex items-center gap-2 font-bold mb-3 font-display uppercase tracking-wider">
                  <RefreshCw className={`w-4 h-4 text-cyber-accent ${isScanningPlaylists ? "animate-spin" : ""}`} />
                  <span className="text-white">IPTV_CORE_ENGINE_SCANNER</span>
                </div>
                <p className="text-[10px] text-white/50 leading-relaxed mb-4 uppercase tracking-wider">
                  Küresel kamu sunucularındaki ücretsiz m3u/m3u8 listeleri otomatik aranır, filtrelenir ve aynı isimdeki yayınlar akıllıca birleştirilir.
                </p>

                {/* Advanced Search Options */}
                <div className="flex flex-col gap-3 mb-4 bg-black/60 p-3.5 border border-white/5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Arama Veritabanı Kaynağı</label>
                    <select
                      value={scanPreset}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setScanPreset(val);
                        if (val !== "custom") {
                          setScanCustomUrl("");
                        }
                      }}
                      className="px-3 py-2 rounded-none text-xs outline-none bg-white/5 border border-white/10 text-white focus:border-cyber-accent font-mono"
                    >
                      <option value="all" className="text-black bg-white">🌐 Tüm Küresel Sunucular (Google + Yandex + GitHub)</option>
                      <option value="tr" className="text-black bg-white">🇹🇷 IPTV-Org Türkiye TV Paketi</option>
                      <option value="world" className="text-black bg-white">🇺🇸 Free World TV Canlı Yayın Kataloğu</option>
                      <option value="radio" className="text-black bg-white">📻 Türkiye Canlı Radyo & Müzik Listesi</option>
                      <option value="custom" className="text-black bg-white">🔗 Özel M3U Havuzu (.m3u Linki Girin)</option>
                    </select>
                  </div>

                  {scanPreset === "custom" && (
                    <div className="flex flex-col gap-1 animate-fade-in">
                      <label className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Özel M3U Akış Linki</label>
                      <input
                        type="text"
                        placeholder="https://.../playlist.m3u"
                        value={scanCustomUrl}
                        onChange={(e) => setScanCustomUrl(e.target.value)}
                        className="px-3 py-2 rounded-none text-xs outline-none bg-white/5 border border-white/10 text-white focus:border-cyber-accent font-mono"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Kanal İsmi / Kelime Filtresi (İsteğe Bağlı)</label>
                    <input
                      type="text"
                      placeholder="Örn: Spor, Haber, TRT, Music..."
                      value={scanKeyword}
                      onChange={(e) => setScanKeyword(e.target.value)}
                      className="px-3 py-2 rounded-none text-xs outline-none bg-white/5 border border-white/10 text-white focus:border-cyber-accent font-mono"
                    />
                  </div>
                </div>

                <button
                  onClick={handleForceAutoTarama}
                  disabled={isScanningPlaylists}
                  className={`w-full py-2.5 px-4 rounded-none font-mono font-bold tracking-widest text-[10px] uppercase transition duration-300 flex items-center justify-center gap-2 border cursor-pointer ${
                    isScanningPlaylists 
                      ? "bg-cyber-accent/15 border-cyber-accent text-cyber-accent animate-pulse" 
                      : "bg-white/5 hover:bg-cyber-accent hover:text-black hover:border-cyber-accent border-white/10 text-white"
                  }`}
                >
                  {isScanningPlaylists ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      SYS_SCANNING_AND_COMPILING_DIRECTORIES...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      EXECUTE_DATABASE_SCAN_AND_UPDATE
                    </>
                  )}
                </button>

                {/* Scan Metrics Board */}
                {scanStats && (
                  <div className="mt-4 p-3 rounded-none bg-black/60 border border-cyber-accent/20 flex flex-col gap-2 font-mono text-[10px] animate-fade-in text-slate-300">
                    <div className="text-cyber-accent font-bold border-b border-white/5 pb-1 flex justify-between">
                      <span>TARAMA ÖZETİ:</span>
                      <span className="text-[9px] bg-cyber-accent/10 px-1.5 py-0.5 rounded-none text-cyber-accent font-mono">SUCCESS_OK</span>
                    </div>
                    <div className="flex flex-col gap-1 border-b border-white/5 pb-2 text-[9px] text-slate-400">
                      <div className="font-sans font-bold text-slate-400">Aranan Motorlar:</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="px-1.5 py-0.5 rounded-none bg-black border border-white/5 text-slate-300 font-mono">www.google.com</span>
                        <span className="px-1.5 py-0.5 rounded-none bg-black border border-white/5 text-slate-300 font-mono">www.yandex.com</span>
                        <span className="px-1.5 py-0.5 rounded-none bg-black border border-white/5 text-slate-300 font-mono">www.github.com</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sorgulanan Kaynak:</span>
                      <span className="font-bold text-white">{scanStats.playlistsScanned} Motor Dizin</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Eklenen Yeni Kanal:</span>
                      <span className="font-bold text-green-400">+{scanStats.newChannelsAdded}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Birleştirilen Yayın:</span>
                      <span className="font-bold text-cyan-400">+{scanStats.streamsMerged} Akış</span>
                    </div>
                    <div className="flex justify-between border-t border-white/5 pt-1 font-bold text-white">
                      <span>Toplam Kanal:</span>
                      <span>{scanStats.totalChannelsCount}</span>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* PWA INSTALL & HOME SCREEN SHORTCUT BANNER */}
            <div className="p-6 rounded-none border border-white/10 bg-black/40 font-mono mt-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/5 text-cyber-accent border border-white/10 flex-shrink-0">
                    <Monitor className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-display font-black tracking-widest text-white flex items-center gap-2 uppercase">
                      LOCAL_SYSTEM_DEPLOYS
                      <span className="text-[9px] font-bold bg-cyber-accent/10 px-2 py-0.5 text-cyber-accent border border-cyber-accent/20">
                        PWA_INSTALLER
                      </span>
                    </h3>
                    <p className="text-[10px] text-white/50 leading-relaxed mt-1.5 max-w-3xl uppercase tracking-wider">
                      EFES IPTV PRO uygulamasını tarayıcınızdan bağımsız, tam ekran ve kesintisiz çalışacak şekilde doğrudan masaüstünüze veya mobil ana ekranınıza bir uygulama kısayolu olarak ekleyebilirsiniz. 
                      Ayrıca bilgisayarınıza yerel kurulum yaptıysanız, masaüstünüze otomatik kısayol oluşturulmuştur.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 flex-shrink-0">
                  <button
                    onClick={handleInstallApp}
                    className="px-5 py-2.5 rounded-none bg-cyber-accent text-black font-mono font-bold text-xs tracking-wider hover:bg-white hover:text-black transition duration-300 flex items-center gap-2 cursor-pointer uppercase"
                  >
                    <Download className="w-4 h-4" />
                    <span>{deferredPrompt ? "INSTALL_SHORTCUT_EXEC" : "INSTALL_APP_EXEC"}</span>
                  </button>

                  <button
                    onClick={() => setShowAndroidModal(true)}
                    className="px-5 py-2.5 rounded-none bg-[#3DDC84] text-black font-mono font-bold text-xs tracking-wider hover:bg-white hover:text-black transition duration-300 flex items-center gap-2 cursor-pointer uppercase"
                    title="Android Cihazlar ve Android TV için Akıllı Kurulum"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>ANDROID_INSTALL_EXEC</span>
                  </button>

                  <button
                    onClick={() => setShowInstallHelp(!showInstallHelp)}
                    className="px-4 py-2.5 rounded-none bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 font-mono text-xs transition duration-300 flex items-center gap-1.5 cursor-pointer uppercase"
                  >
                    <HelpCircle className="w-4 h-4 text-cyber-accent" />
                    <span>HOW_TO_GUIDE</span>
                  </button>
                </div>
              </div>

              {/* Install guide inline expansion */}
              {showInstallHelp && (
                <div className="mt-5 pt-5 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs animate-fade-in uppercase tracking-wider">
                  <div className="p-4 rounded-none bg-black/60 border border-white/5">
                    <h4 className="font-bold text-cyber-accent flex items-center gap-1.5 mb-2 font-display">
                      <Monitor className="w-4 h-4" />
                      01. CHROME / EDGE / OPERA (DESKTOP)
                    </h4>
                    <p className="text-[10px] text-white/40 leading-relaxed">
                      Adres çubuğunun sağ tarafındaki "Yükle" düğmesine tıklayın ya da tarayıcı menüsünden "Efes IPTV Pro Uygulamasını Yükle" seçeneğini seçin. Kısayol masaüstünüze eklenecektir.
                    </p>
                  </div>

                  <div className="p-4 rounded-none bg-black/60 border border-white/5">
                    <h4 className="font-bold text-cyber-accent flex items-center gap-1.5 mb-2 font-display">
                      <Smartphone className="w-4 h-4" />
                      02. SMARTPHONES (IOS / ANDROID)
                    </h4>
                    <p className="text-[10px] text-white/40 leading-relaxed">
                      Safari (iOS): Paylaş butonuna basıp "Ana Ekrana Ekle" seçeneğini seçin. <br />
                      Chrome (Android): Sağ üstteki üç noktaya tıklayıp "Uygulamayı Yükle" veya "Ana Ekrana Ekle" seçeneğine tıklayın.
                    </p>
                  </div>

                  <div className="p-4 rounded-none bg-black/60 border border-white/5">
                    <h4 className="font-bold text-cyber-accent flex items-center gap-1.5 mb-2 font-display">
                      <CheckCircle className="w-4 h-4" />
                      03. LOCAL OFFLINE COMMANDS
                    </h4>
                    <p className="text-[10px] text-white/40 leading-relaxed">
                      Yerel sunucu kurulum betiğini (kurulum_windows.bat veya kurulum_linux_macos.sh) çalıştırdıktan sonra, masaüstünüze otomatik olarak EFES IPTV PRO kısayolu oluşturulur.
                    </p>
                  </div>

                  <div className="col-span-1 md:col-span-3 flex justify-end">
                    <button
                      onClick={() => setShowInstallHelp(false)}
                      className="text-[10px] text-cyber-accent hover:text-white underline mt-2 cursor-pointer"
                    >
                      CLOSE_INSTALLATION_GUIDE
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        ) : (
          /* CASE 2: DETAILED OPENED CATEGORY VIEW (YENİ AÇILAN SAYFA) */
          <div className="flex flex-col gap-6 animate-fade-in font-sans">
            
            {/* Category Detail Header with a Geri (Back) button at the top left */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveCategory(null)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-white/5 border border-white/10 hover:border-cyber-accent text-white hover:text-cyber-accent rounded-none text-[10px] font-mono uppercase tracking-wider transition duration-300 shadow-md cursor-pointer"
                  title="Kategorilere Dön"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-cyber-accent" />
                  <span>SYS_NAV_BACK</span>
                </button>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white/5 rounded-none border border-white/10 text-cyber-accent">
                    {(() => {
                      const Icon = categoriesList.find(c => c.id === activeCategory)?.icon || Tv2;
                      return <Icon className="w-4 h-4" />;
                    })()}
                  </div>
                  <div>
                    <h2 className="text-base font-display font-black tracking-widest text-white uppercase">
                      {categoriesList.find(c => c.id === activeCategory)?.label || t.allCategories}
                    </h2>
                    <p className="text-[10px] font-mono text-white/40 mt-0.5 uppercase tracking-wider leading-none">
                      {getCategoryDescription(activeCategory)}
                    </p>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-black/60 px-3.5 py-1.5 text-cyber-accent border border-cyber-accent/20 font-bold self-start uppercase tracking-widest">
                STREAM_NODES: {filteredChannels.length}
              </span>
            </div>

            {/* Custom List M3U Loading Panel (If active category is CustomPlaylist) */}
            {activeCategory === "CustomPlaylist" && (
              <div className="p-6 rounded-none border border-white/10 bg-black/40 font-mono">
                <h3 className="text-sm font-display font-black tracking-widest mb-2 flex items-center gap-2 text-white uppercase">
                  <PlusCircle className="w-4 h-4 text-cyber-accent" />
                  {t.m3uUploadTitle}
                </h3>
                <p className="text-[10px] opacity-60 text-white mb-4 uppercase tracking-wider">
                  Kendi IPTV sağlayıcınızdan aldığınız .m3u bağlantısını yapıştırabilir veya cihazınızdan .m3u uzantılı dosya seçip yükleyebilirsiniz.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder={t.m3uPlaceholder}
                    value={customM3uUrl}
                    onChange={(e) => setCustomM3uUrl(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-none text-xs outline-none bg-white/5 border border-white/10 text-white focus:border-cyber-accent font-mono placeholder:text-white/25"
                  />
                  <button
                    onClick={handleLoadCustomM3uUrl}
                    className="px-5 py-2.5 rounded-none bg-cyber-accent text-black font-mono font-bold tracking-wider text-xs transition duration-300 hover:bg-white cursor-pointer uppercase"
                  >
                    {t.m3uLoadBtn}
                  </button>
                </div>

                <div className="flex items-center gap-4 mt-4 border-t border-white/5 pt-4">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{t.m3uFileBtn}:</span>
                  <label className="cursor-pointer bg-white/5 hover:bg-white/10 text-white font-mono font-bold text-[9px] uppercase tracking-wider py-2 px-4 border border-white/10 transition flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-cyber-accent" />
                    SELECT_M3U_FILE
                    <input
                      type="file"
                      accept=".m3u"
                      onChange={handleLoadM3uFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Admin Panel Panel (If active category is AdminPanel) */}
            {activeCategory === "AdminPanel" && (
              <div className="p-6 rounded-none border border-white/10 bg-black/40 font-mono">
                <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
                  <h3 className="text-sm font-display font-black tracking-widest flex items-center gap-2 text-white uppercase">
                    <ShieldAlert className="w-4 h-4 text-cyber-accent" />
                    {t.adminPanel}
                  </h3>
                  {adminToken && (
                    <button
                      onClick={handleAdminLogout}
                      className="px-3 py-1.5 rounded-none bg-red-600/10 hover:bg-red-600 hover:text-white border border-red-500/20 text-red-400 font-mono text-[10px] tracking-widest uppercase transition duration-300 cursor-pointer"
                    >
                      SYS_LOGOUT / REVOKE_TOKEN
                    </button>
                  )}
                </div>

                {adminError && (
                  <div className="p-3 mb-4 rounded-none bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-bold uppercase">
                    {adminError}
                  </div>
                )}
                {adminSuccess && (
                  <div className="p-3 mb-4 rounded-none bg-green-950/40 border border-green-500/30 text-green-400 text-xs font-bold uppercase">
                    {adminSuccess}
                  </div>
                )}

                {!adminToken ? (
                  <form onSubmit={handleAdminLogin} className="max-w-md mx-auto py-8 text-center uppercase">
                    <Lock className="w-10 h-10 mx-auto text-cyber-accent mb-4 animate-bounce" />
                    <h4 className="text-xs font-bold tracking-widest mb-2 text-white">{t.adminPinPrompt}</h4>
                    <p className="text-[10px] text-white/40 mb-6 leading-relaxed">
                      Yayın eklemek, silmek ve genel güncellemeleri yönetmek için yönetici şifrenizi (Varsayılan: evim1234) giriniz.
                    </p>
                    
                    <div className="flex flex-col gap-3">
                      <input
                        type="password"
                        maxLength={12}
                        placeholder="••••"
                        value={adminPinInput}
                        onChange={(e) => setAdminPinInput(e.target.value)}
                        className="text-center tracking-widest text-lg font-black px-4 py-3 rounded-none outline-none bg-white/5 border border-white/10 text-white focus:border-cyber-accent font-mono"
                      />
                      <button
                        type="submit"
                        className="w-full py-3 rounded-none bg-cyber-accent text-black font-mono font-bold tracking-widest text-xs transition duration-300 hover:bg-white cursor-pointer"
                      >
                        {t.adminLoginBtn}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* LEFT: ADD/EDIT STREAM FORM */}
                    <div className="flex flex-col gap-4">
                      <h4 className="text-[10px] font-bold text-cyber-accent tracking-widest uppercase flex items-center gap-1.5 font-display">
                        {editingChannelId ? (
                          <>
                            <Edit className="w-4 h-4 animate-pulse" />
                            <span>SYS_UPDATE_STREAM</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>{t.adminAddChannel}</span>
                          </>
                        )}
                      </h4>
                      
                      <form onSubmit={editingChannelId ? handleAdminUpdateChannel : handleAdminAddChannel} className="flex flex-col gap-3 text-xs uppercase">
                        <div className="flex flex-col gap-1">
                          <label className="text-white/40 font-bold tracking-widest text-[9px]">{t.adminChannelName} *</label>
                          <input
                            type="text"
                            required
                            placeholder="Örn: TRT 1 HD"
                            value={addChannelName}
                            onChange={(e) => setAddChannelName(e.target.value)}
                            className="px-3 py-2 rounded-none outline-none bg-white/5 border border-white/10 text-white focus:border-cyber-accent font-mono placeholder:text-white/25"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-white/40 font-bold tracking-widest text-[9px]">{t.adminChannelUrl} *</label>
                          <input
                            type="text"
                            required
                            placeholder="https://.../master.m3u8"
                            value={addChannelUrl}
                            onChange={(e) => setAddChannelUrl(e.target.value)}
                            className="px-3 py-2 rounded-none outline-none bg-white/5 border border-white/10 text-white focus:border-cyber-accent font-mono placeholder:text-white/25"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-white/40 font-bold tracking-widest text-[9px]">{t.adminChannelLogo}</label>
                          <input
                            type="text"
                            placeholder="https://.../logo.png"
                            value={addChannelLogo}
                            onChange={(e) => setAddChannelLogo(e.target.value)}
                            className="px-3 py-2 rounded-none outline-none bg-white/5 border border-white/10 text-white focus:border-cyber-accent font-mono placeholder:text-white/25"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-white/40 font-bold tracking-widest text-[9px]">{t.adminChannelCategory}</label>
                            <select
                              value={addChannelCategory}
                              onChange={(e) => setAddChannelCategory(e.target.value)}
                              className="px-2 py-2 rounded-none outline-none bg-black border border-white/10 text-white focus:border-cyber-accent font-mono"
                            >
                              <option value="National">National</option>
                              <option value="Premium">Premium</option>
                              <option value="Movies">Movies</option>
                              <option value="Series">Series</option>
                              <option value="Documentary">Documentary</option>
                              <option value="News">News</option>
                              <option value="Sports">Sports</option>
                              <option value="Kids">Kids</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-white/40 font-bold tracking-widest text-[9px]">DİL (LANG)</label>
                            <select
                              value={addChannelLanguage}
                              onChange={(e) => setAddChannelLanguage(e.target.value)}
                              className="px-2 py-2 rounded-none outline-none bg-black border border-white/10 text-white focus:border-cyber-accent font-mono"
                            >
                              <option value="TR">TR</option>
                              <option value="EN">EN</option>
                              <option value="DE">DE</option>
                              <option value="FR">FR</option>
                              <option value="ES">ES</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-white/40 font-bold tracking-widest text-[9px]">TÜR (TYPE)</label>
                            <select
                              value={addChannelType}
                              onChange={(e) => setAddChannelType(e.target.value as any)}
                              className="px-2 py-2 rounded-none outline-none bg-black border border-white/10 text-white focus:border-cyber-accent font-mono"
                            >
                              <option value="live">Live TV</option>
                              <option value="movie">Movie</option>
                              <option value="series">Series</option>
                              <option value="documentary">Documentary</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-white/40 font-bold tracking-widest text-[9px]">{t.adminChannelDesc}</label>
                          <textarea
                            placeholder="Yayına dair ek bilgiler, program açıklaması..."
                            value={addChannelDesc}
                            onChange={(e) => setAddChannelDesc(e.target.value)}
                            rows={2}
                            className="px-3 py-2 rounded-none outline-none resize-none bg-white/5 border border-white/10 text-white focus:border-cyber-accent font-mono placeholder:text-white/25"
                          />
                        </div>

                        <div className="flex gap-2 mt-2">
                          <button
                            type="submit"
                            className="flex-1 py-2.5 rounded-none bg-cyber-accent text-black font-mono font-bold tracking-wider text-xs transition duration-300 hover:bg-white cursor-pointer"
                          >
                            {editingChannelId ? "Değişiklikleri Kaydet" : t.adminAddChannel}
                          </button>
                          {editingChannelId && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingChannelId(null);
                                setAddChannelName("");
                                setAddChannelUrl("");
                                setAddChannelLogo("");
                                setAddChannelDesc("");
                                setAdminSuccess("");
                                setAdminError("");
                              }}
                              className="px-4 py-2.5 rounded-none bg-white/5 hover:bg-white/10 text-white font-mono font-bold text-xs transition border border-white/10 cursor-pointer"
                            >
                              İptal
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    {/* RIGHT: PIN MANAGER & CURRENT CHANNELS DELETE LIST */}
                    <div className="flex flex-col gap-6">
                      <div className="p-4 rounded-none border border-white/10 bg-black/60">
                        <h4 className="text-[10px] font-bold text-cyber-accent tracking-widest uppercase flex items-center gap-1.5 mb-3 font-display">
                          <Settings className="w-4 h-4" />
                          {t.adminChangePin}
                        </h4>
                        <form onSubmit={handleAdminChangePin} className="flex flex-col gap-3 text-xs uppercase">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1">
                              <label className="text-white/40 font-bold tracking-widest text-[9px]">Mevcut Şifre</label>
                              <input
                                type="password"
                                required
                                placeholder="••••"
                                value={currentPinInput}
                                onChange={(e) => setCurrentPinInput(e.target.value)}
                                className="px-3 py-2 rounded-none outline-none bg-white/5 border border-white/10 text-white focus:border-cyber-accent font-mono"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-white/40 font-bold tracking-widest text-[9px]">Yeni Şifre</label>
                              <input
                                type="password"
                                required
                                placeholder="••••"
                                value={newPinInput}
                                onChange={(e) => setNewPinInput(e.target.value)}
                                className="px-3 py-2 rounded-none outline-none bg-white/5 border border-white/10 text-white focus:border-cyber-accent font-mono"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="py-2 rounded-none bg-white/5 hover:bg-white/10 text-white font-mono font-bold tracking-widest transition border border-white/10 cursor-pointer"
                          >
                            {t.adminSavePin}
                          </button>
                        </form>
                      </div>

                      <div className="flex flex-col gap-3">
                        <h4 className="text-[10px] font-bold text-cyber-accent tracking-widest uppercase font-display">
                          Yayın Listesi ve Genel Güncelleme ({channels.length})
                        </h4>
                        <p className="text-[10px] text-white/40 uppercase tracking-wider">
                          Aşağıdaki listeden dilediğiniz yayını tek tıkla sistemden kaldırabilirsiniz.
                        </p>
                        
                        <div className="max-h-64 overflow-y-auto border border-white/10 bg-black/40 p-2 flex flex-col gap-1.5">
                          {channels.map((c) => (
                            <div key={c.id} className="flex items-center justify-between p-2 rounded-none bg-black/40 border border-white/5 text-xs">
                              <div className="flex items-center gap-2 overflow-hidden mr-2">
                                <img src={c.logo} className="w-6 h-6 rounded-none object-cover bg-black border border-white/10 flex-shrink-0" alt="" />
                                <div className="overflow-hidden">
                                  <span className="font-bold truncate block text-white uppercase text-[10px]">{c.name}</span>
                                  <span className="text-[8px] text-white/40 block font-mono uppercase tracking-wider">{c.category} • {c.type}</span>
                                </div>
                              </div>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingChannelId(c.id);
                                    setAddChannelName(c.name);
                                    setAddChannelUrl(c.streamUrl);
                                    setAddChannelLogo(c.logo || "");
                                    setAddChannelCategory(c.category || "National");
                                    setAddChannelLanguage(c.language || "TR");
                                    setAddChannelType(c.type || "live");
                                    setAddChannelDesc(c.description || "");
                                    setAdminSuccess(`"${c.name}" kanalı düzenleme formuna yüklendi.`);
                                  }}
                                  className="p-1.5 bg-white/5 hover:bg-cyber-accent text-white hover:text-black transition border border-white/10 cursor-pointer"
                                  title="Düzenle"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleAdminDeleteChannel(c.id)}
                                  className="p-1.5 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white transition border border-red-500/20 cursor-pointer"
                                  title={t.adminDeleteChannel}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM: SYSTEM UPDATER & TURKISH CHANNELS SYNC PANELS */}
                  <div className="mt-8 border-t border-white/10 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Panel 1: Turksat Stream Dynamic Auto-Updater */}
                    <div className="p-4 rounded-none border border-white/10 bg-black/60 flex flex-col justify-between">
                      <div>
                        <h4 className="text-[10px] font-bold text-cyber-accent tracking-widest uppercase flex items-center gap-1.5 mb-2 font-display">
                          <RefreshCw className={`w-4 h-4 ${isUpdatingTurkish ? "animate-spin" : ""}`} />
                          TÜRKSAT YAYINLARINI İNTERNETTEN GÜNCELLE
                        </h4>
                        <p className="text-[10px] text-white/40 mb-4 leading-relaxed uppercase tracking-wider font-mono">
                          Bu özellik, internetteki en güncel ve çalışan kamu oynatma listelerinden (iptv-org vb.) yeni çalışan akış adreslerini çeker ve veritabanınızdaki mevcut TR kanallarıyla otomatik eşleştirerek günceller.
                        </p>
                      </div>
                      <div>
                        {turkishUpdateResult && (
                          <div className="p-2.5 mb-3 rounded-none bg-white/5 border border-white/10 text-[9px] font-mono text-white/80 uppercase leading-relaxed">
                            {turkishUpdateResult}
                          </div>
                        )}
                        <button
                          type="button"
                          disabled={isUpdatingTurkish}
                          onClick={handleUpdateTurkishChannels}
                          className={`w-full py-2.5 rounded-none font-mono font-bold tracking-widest text-xs transition duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                            isUpdatingTurkish 
                              ? "bg-white/10 text-white/40 cursor-not-allowed border border-white/5" 
                              : "bg-cyber-accent text-black hover:bg-white"
                          }`}
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingTurkish ? "animate-spin" : ""}`} />
                          {isUpdatingTurkish ? "GÜNCELLENİYOR..." : "YAYIN ADRESLERİNİ GÜNCELLE"}
                        </button>
                      </div>
                    </div>

                    {/* Panel 2: System Version Upgrade & Code Overwriter */}
                    <div className="p-4 rounded-none border border-white/10 bg-black/60">
                      <h4 className="text-[10px] font-bold text-cyber-accent tracking-widest uppercase flex items-center gap-1.5 mb-2 font-display">
                        <Upload className="w-4 h-4" />
                        SİSTEM SÜRÜMÜ GÜNCELLEME VE DOSYA YAZMA
                      </h4>
                      <p className="text-[10px] text-white/40 mb-4 leading-relaxed uppercase tracking-wider font-mono">
                        Uygulamanın yeni bir sürümü geldiğinde, sürüm dosyalarını (.zip veya tekil kod dosyası olarak) yükleyip mevcut sürümün üzerine yazabilirsiniz.
                      </p>

                      <div className="flex flex-col gap-4 text-xs">
                        {/* ZIP Overwrite */}
                        <div className="border-b border-white/5 pb-3">
                          <label className="text-white/40 font-bold tracking-widest text-[9px] block mb-1.5 font-mono">SÜRÜM GÜNCELLEME (.ZIP YÜKLE)</label>
                          <div className="relative">
                            <input
                              type="file"
                              accept=".zip"
                              disabled={isUpgradingZip}
                              onChange={handleUpgradeZip}
                              className="w-full text-[10px] font-mono text-white/50 file:mr-3 file:py-1.5 file:px-3 file:rounded-none file:border-0 file:text-[9px] file:font-bold file:tracking-widest file:uppercase file:bg-white/10 file:text-white file:cursor-pointer hover:file:bg-white/20"
                            />
                          </div>
                          {upgradeZipResult && (
                            <div className="mt-2 p-2 rounded-none bg-white/5 border border-white/10 text-[9px] font-mono text-white/80 uppercase leading-relaxed">
                              {upgradeZipResult}
                            </div>
                          )}
                        </div>

                        {/* Individual File Overwrite */}
                        <div>
                          <label className="text-white/40 font-bold tracking-widest text-[9px] block mb-1 font-mono">TEK DOSYA ÜZERİNE YAZ</label>
                          <div className="flex flex-col gap-2">
                            <input
                              type="text"
                              placeholder="Örn: src/App.tsx veya server.ts"
                              value={upgradeFilePath}
                              onChange={(e) => setUpgradeFilePath(e.target.value)}
                              className="px-3 py-1.5 rounded-none outline-none bg-white/5 border border-white/10 text-white focus:border-cyber-accent font-mono placeholder:text-white/25 text-[10px]"
                            />
                            <textarea
                              placeholder="Yeni dosya içeriği (kod) buraya yapıştırılmalıdır..."
                              value={upgradeFileContent}
                              onChange={(e) => setUpgradeFileContent(e.target.value)}
                              rows={3}
                              className="px-3 py-1.5 rounded-none outline-none resize-none bg-white/5 border border-white/10 text-white focus:border-cyber-accent font-mono placeholder:text-white/25 text-[10px]"
                            />
                            <button
                              type="button"
                              disabled={isUpgradingFile}
                              onClick={handleUpgradeFile}
                              className={`w-full py-2 rounded-none font-mono font-bold tracking-widest text-[10px] transition duration-300 cursor-pointer ${
                                isUpgradingFile 
                                  ? "bg-white/10 text-white/40 cursor-not-allowed" 
                                  : "bg-white text-black hover:bg-cyber-accent"
                              }`}
                            >
                              {isUpgradingFile ? "YAZILIYOR..." : "KODU DOSYANIN ÜZERİNE YAZ"}
                            </button>
                          </div>
                          {upgradeFileResult && (
                            <div className="mt-2 p-2 rounded-none bg-white/5 border border-white/10 text-[9px] font-mono text-white/80 uppercase leading-relaxed">
                              {upgradeFileResult}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              </div>
            )}

            {/* CHANNELS GRID CATALOG (ALFABETİK A/Z SIRALANMIŞ KUTUCUKLAR) */}
            {activeCategory !== "AdminPanel" && (
              <div>
                {filteredChannels.length === 0 ? (
                  <div className="text-center py-20 bg-black/40 border border-dashed border-white/10 rounded-none p-6 font-mono uppercase tracking-wider">
                    <Tv className="w-10 h-10 mx-auto text-white/30 mb-4 animate-pulse" />
                    <h4 className="text-xs font-bold mb-1 text-white">STREAM_NODE_EMPTY</h4>
                    <p className="text-[10px] text-white/40">
                      Bu kategoride kanal bulunamadı veya aramanızla eşleşen sonuç yok.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredChannels.map((chan, idx) => {
                      const isFav = favorites.includes(chan.id);
                      const isFocused = isTvMode && focusedSection === "grid" && focusedGridIdx === idx;
                      const hasSavedPos = savedPositions[chan.id] !== undefined;

                      return (
                        <div
                          key={chan.id}
                          onClick={() => {
                            if (isTvMode) {
                              setFocusedGridIdx(idx);
                              setFocusedSection("grid");
                            }
                            handlePlayChannel(chan);
                          }}
                          className={`relative rounded-none overflow-hidden border cursor-pointer group transition-all duration-300 flex flex-col justify-between bg-black/40 border-white/10 hover:border-cyber-accent ${isFocused ? "border-cyber-accent ring-4 ring-cyber-accent/30 scale-102" : ""}`}
                        >
                          {/* Logo and Image Area */}
                          <div className="relative aspect-video w-full bg-black overflow-hidden border-b border-white/5">
                            <img
                              src={chan.logo}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                              alt={chan.name}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80"></div>
                            
                            {/* Type Badge */}
                            <span className="absolute top-2 left-2 text-[8px] font-mono font-black tracking-widest uppercase bg-cyber-accent text-black px-1.5 py-0.5 shadow">
                              {chan.type}
                            </span>

                            {/* Language Badge */}
                            <span className="absolute top-2 right-2 text-[8px] font-mono font-bold bg-black text-white px-1.5 py-0.5 border border-white/10">
                              {chan.language}
                            </span>

                            {/* Continue watching indicator */}
                            {hasSavedPos && (
                              <div className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-cyber-accent text-[8px] font-mono font-bold text-black uppercase">
                                <Clock className="w-2.5 h-2.5" />
                                <span>CONTINUE</span>
                              </div>
                            )}

                            {/* Favorite Button */}
                            <button
                              onClick={(e) => toggleFavorite(chan.id, e)}
                              className={`absolute bottom-2 right-2 p-1.5 transition ${
                                isFav ? "bg-red-600 text-white" : "bg-black/80 hover:bg-black text-white border border-white/10"
                              }`}
                            >
                              <Heart className={`w-3 h-3 ${isFav ? "fill-current animate-pulse" : ""}`} />
                            </button>
                          </div>

                          {/* Info and Description */}
                          <div className="p-3.5 flex-1 flex flex-col justify-between font-mono">
                            <div>
                              <h4 className="font-display font-black text-xs tracking-wider truncate group-hover:text-cyber-accent transition mb-1 text-white uppercase">
                                {chan.name}
                              </h4>
                              <p className="text-[10px] text-white/40 line-clamp-2 h-7 leading-relaxed font-sans uppercase">
                                {chan.description}
                              </p>
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[9px] text-cyber-accent uppercase tracking-widest">
                              <span className="font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyber-accent animate-ping"></span>
                                LIVE_NODE:
                              </span>
                              <span className="text-white/40 font-bold">12:00 - 14:00</span>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* TV REMOTE CONTROLLER NAVIGATION TUTORIAL (Item 15) */}
        {showRemoteHelp && (
          <RemoteControlHelp lang={lang} onClose={() => setShowRemoteHelp(false)} />
        )}

        {/* ANDROID SMART SETUP & DETAILED INSTALLATION MODAL */}
        {showAndroidModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-2xl bg-[#0a0a0a] border border-cyber-accent/30 p-6 md:p-8 rounded-none relative shadow-[0_0_50px_rgba(0,255,102,0.15)] font-mono uppercase tracking-wider text-xs">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-white/10 pb-4 mb-6">
                <div>
                  <h3 className="text-base font-display font-black text-cyber-accent flex items-center gap-2.5">
                    <Smartphone className="w-5 h-5 animate-bounce-short text-[#3DDC84]" />
                    <span>ANDROID & ANDROID TV_SETUP_SYSTEM</span>
                  </h3>
                  <p className="text-[10px] text-white/40 mt-1">EFES IPTV PRO - MOBİL VE TV KUTUSU AKILLI ENTEGRASYONU</p>
                </div>
                <button 
                  onClick={() => setShowAndroidModal(false)}
                  className="px-2.5 py-1 text-[10px] bg-white/5 hover:bg-cyber-accent hover:text-black border border-white/10 hover:border-transparent transition cursor-pointer text-white"
                >
                  [X]
                </button>
              </div>

              {/* Main Content: Two Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Side: Setup Methods */}
                <div className="flex flex-col gap-4">
                  <div className="p-4 bg-white/5 border border-white/10">
                    <h4 className="font-bold text-white flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-[#3DDC84]"></span>
                      YÖNTEM 1: WEBAPK / PWA KURULUMU
                    </h4>
                    <p className="text-[10px] text-white/60 leading-relaxed">
                      Android akıllı telefonunuzda veya tabletinizde yerel uygulama gibi çalışır.
                    </p>
                    <button
                      onClick={() => {
                        setShowAndroidModal(false);
                        handleInstallApp();
                      }}
                      className="mt-3 w-full py-2 bg-[#3DDC84] text-black text-[10px] font-bold hover:bg-white hover:text-black transition duration-200 cursor-pointer text-center block animate-pulse"
                    >
                      ŞİMDİ ANDROID'E YÜKLE
                    </button>
                  </div>

                  <div className="p-4 bg-white/5 border border-white/10">
                    <h4 className="font-bold text-white flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-cyber-accent"></span>
                      YÖNTEM 2: ANDROID TV / MI BOX / FIRE STICK
                    </h4>
                    <p className="text-[10px] text-white/60 leading-relaxed mb-2">
                      Televizyon kumandası ile tam uyumlu televizyon modunu etkinleştirin. Tarayıcıda bu adresi açıp sık kullanılanlara ekleyebilirsiniz.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setIsTvMode(true);
                          setShowAndroidModal(false);
                          setSecurityToast("Kumanda Uyumlu TV Modu Aktif Edildi!");
                          setTimeout(() => setSecurityToast(""), 3000);
                        }}
                        className="flex-1 py-2 bg-white/5 border border-white/10 hover:border-cyber-accent text-white text-[10px] hover:text-cyber-accent transition duration-200 cursor-pointer text-center"
                      >
                        TV MODUNU AÇ
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Side: QR Code scan & URL share */}
                <div className="flex flex-col items-center justify-center p-4 bg-black/40 border border-white/10 text-center">
                  <h4 className="font-bold text-white/80 text-[10px] mb-3">TELEFONDAN HEMEN TARATIN</h4>
                  
                  {/* Clean high-contrast API generated QR Code */}
                  <div className="p-2.5 bg-white border border-white/20">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=0a0a0a&bgcolor=ffffff&data=${encodeURIComponent(window.location.origin)}`} 
                      alt="IPTV QR Code"
                      className="w-36 h-36"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  
                  <p className="text-[9px] text-white/40 mt-3 leading-relaxed">
                    Android telefonunuzun veya tabletinizin kamerasını bu QR koda doğrultarak uygulamayı anında mobil cihazınıza taşıyabilirsiniz.
                  </p>
                  
                  <div className="w-full mt-4 p-2 bg-white/5 border border-white/5 text-[9px] text-cyber-accent select-all break-all text-center">
                    {window.location.origin}
                  </div>
                </div>

              </div>

              {/* Footer info banner */}
              <div className="mt-6 pt-4 border-t border-white/10 text-center text-[9px] text-white/30">
                LİSANS DURUMU: <span className="text-cyber-accent">DOĞRULANDI</span> | KOPYA KORUMA KALKANI ETKİN
              </div>

            </div>
          </div>
        )}

      </main>

        </div> {/* Closes Right Side: Main Viewport */}
      </div> {/* Closes Main Terminal Grid Container */}

      {/* ACTIVE MOVIE / TV CHANNELS PLAYER DIALOG */}
      {selectedChannel && (
        <VideoPlayer
          channel={selectedChannel}
          lang={lang}
          savedPosition={savedPositions[selectedChannel.id] || 0}
          onSaveProgress={handleSavePlaybackProgress}
          onClose={handleClosePlayerAndBackgroundAudio}
          onPlayNextEpisode={handlePlayNextEpisode}
          epgList={epgList}
          playlist={filteredChannels}
          onSelectChannel={handlePlayChannel}
        />
      )}

      {/* Interactive visual ripples style */}
      <style>{`
        @keyframes audio-wave {
          0%, 100% { height: 4px; }
          50% { height: 12px; }
        }
        @keyframes audio-wave-tall {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        @keyframes audio-wave-mid {
          0%, 100% { height: 4px; }
          50% { height: 10px; }
        }

        .animate-audio-wave {
          animation: audio-wave 1s infinite ease-in-out;
        }
        .animate-audio-wave-tall {
          animation: audio-wave-tall 0.8s infinite ease-in-out;
        }
        .animate-audio-wave-mid {
          animation: audio-wave-mid 1.2s infinite ease-in-out;
        }

        .animate-bounce-short {
          animation: bounce-short 3s infinite ease-in-out;
        }

        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>

    </div>
  );
}
