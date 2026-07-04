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
  ShieldAlert, Lock, Settings, Trash2, Plus, Edit, ArrowLeft, ChevronLeft
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
    <div className={`min-h-screen transition-colors duration-300 font-sans ${theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      


      {/* Floating security watermark text overlay across application canvas (Item 18) */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 -rotate-12 opacity-[0.03] select-none pointer-events-none text-center font-mono text-3xl z-0 tracking-widest text-indigo-500">
        SECURE IPTV PLATFORM COPY SHIELD VERIFICATION {license?.securityToken?.substring(0, 15)}
      </div>

      {/* Top Navigation Bar */}
      <header className={`sticky top-0 z-30 px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b ${theme === "dark" ? "bg-slate-950/80 border-slate-800 backdrop-blur" : "bg-white/80 border-slate-200 backdrop-blur"}`}>
        
        {/* App Title & Dynamic Clock */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-indigo-500/10">
            <Tv className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-widest">{t.appName}</h1>
            <div className="flex items-center gap-1.5 text-xs opacity-60">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono font-bold">{currentTime || "00:00:00"}</span>
            </div>
          </div>
        </div>

        {/* Global Control Toggles & Global Search */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Channel Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 opacity-50" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-9 pr-4 py-1.5 rounded-xl text-xs w-56 outline-none transition-all ${theme === "dark" ? "bg-slate-900 border border-slate-800 text-white focus:border-cyan-400" : "bg-slate-100 border border-slate-200 text-slate-900 focus:border-indigo-500"}`}
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
            className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide flex items-center gap-1.5 transition ${
              isTvMode ? "bg-cyan-500 text-black shadow shadow-cyan-400/20" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {isTvMode ? t.remoteMode : t.mouseMode}
          </button>

          {/* Theme Selector */}
          <button
            onClick={() => {
              const next = theme === "dark" ? "light" : "dark";
              setTheme(next);
              localStorage.setItem("iptv_theme", next);
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title={t.themeToggle}
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Global Language Dropdown */}
          <div className="relative flex items-center gap-1.5 bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold">
            <Globe className="w-3.5 h-3.5" />
            <select
              value={lang}
              onChange={(e) => {
                const nextLang = e.target.value as IPTVLanguage;
                setLang(nextLang);
                localStorage.setItem("iptv_lang", nextLang);
              }}
              className="bg-transparent outline-none cursor-pointer pr-1"
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
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-red-950 border-2 border-red-500 text-red-200 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-in text-xs font-bold max-w-md text-center">
          <AlertTriangle className="w-5 h-5 text-red-400 animate-ping flex-shrink-0" />
          <span>{securityToast}</span>
        </div>
      )}

      {/* Main Grid Workspace */}
      <main className="max-w-[1600px] mx-auto p-6 relative z-10">
        
        {activeCategory === null ? (
          /* CASE 1: CATEGORIES DASHBOARD PAGE (SEKMELER TABLOSU) */
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Dashboard Header with a Back button in the top left */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/40 pb-4 mb-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExitApp}
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-white rounded-xl text-xs font-black transition duration-300 shadow-md cursor-pointer"
                  title="Uygulamadan Çık"
                >
                  <ArrowLeft className="w-4 h-4 text-cyan-400" />
                  <span>Geri / Çıkış</span>
                </button>
                <div>
                  <h2 className="text-xl font-black tracking-wider text-white">Yayın Kategorileri</h2>
                  <p className="text-xs text-slate-400 mt-0.5">İzlemek istediğiniz yayın türünü seçerek tüm listeyi alfabetik (A-Z) olarak listeleyin.</p>
                </div>
              </div>
              <span className="text-xs font-mono bg-slate-900/60 px-3 py-1 rounded text-cyan-400 border border-cyan-400/20 font-bold self-start sm:self-center">
                TOPLAM YAYIN: {channels.length}
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
                    className={`relative overflow-hidden rounded-2xl border p-5 flex flex-col justify-between text-left h-44 group transition-all duration-300 cursor-pointer ${
                      theme === "dark" 
                        ? "bg-slate-900/60 border-slate-800/80 hover:border-cyan-400 hover:shadow-cyan-500/5 hover:shadow-xl hover:bg-slate-900" 
                        : "bg-white border-slate-200 hover:border-indigo-500 hover:shadow-indigo-500/5 hover:shadow-xl hover:bg-slate-50"
                    } ${isFocused ? "border-cyan-400 border-4 scale-102 ring-4 ring-cyan-400/30" : ""}`}
                  >
                    {/* Background decoration gradient */}
                    <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-cyan-400/10 to-indigo-500/0 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500"></div>

                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-xl bg-slate-800 text-cyan-400 border border-slate-700/40 group-hover:text-white group-hover:bg-gradient-to-r group-hover:from-cyan-500 group-hover:to-indigo-600 transition-all duration-300 shadow">
                        <IconComp className="w-5 h-5" />
                      </div>
                      {count !== undefined && (
                        <span className="font-mono text-[10px] font-black bg-slate-950/60 px-2.5 py-1 rounded-full text-slate-400 border border-slate-800/40 group-hover:border-cyan-500/30">
                          {count} {lang === "TR" ? "YAYIN" : "ITEMS"}
                        </span>
                      )}
                    </div>

                    <div className="mt-4">
                      <h3 className="font-extrabold text-sm tracking-wide text-white group-hover:text-cyan-400 transition-colors">
                        {cat.label}
                      </h3>
                      <p className="text-[11px] opacity-60 mt-1 leading-relaxed text-slate-400 line-clamp-2">
                        {getCategoryDescription(cat.id)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Info Metrics, Security & Autotarama Panels at the Bottom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 border-t border-slate-800/40 pt-8">
              
              {/* SECURITY STATUS DISPLAY */}
              <div className={`p-5 rounded-2xl border text-xs ${theme === "dark" ? "bg-slate-900/40 border-slate-800" : "bg-slate-100 border-slate-200"}`}>
                <div className="flex items-center gap-2 font-bold mb-3">
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                  <span className="text-white">{t.securityShield}</span>
                </div>
                <p className="text-[11px] opacity-70 leading-relaxed mb-3 text-slate-400">
                  {t.securityOk}
                </p>
                <div className="flex flex-col gap-1.5 font-mono text-[10px] text-indigo-400 bg-slate-950/40 p-3 rounded-xl border border-white/5">
                  <div>HOST: {license?.host || "Verified"}</div>
                  <div>VIOLATIONS BLOCKED: {securityViolations}</div>
                  <div>ENCRYPTION: SHIELD-2026-v6</div>
                </div>
              </div>

              {/* DAILY SCAN AUTOMATIC DISCOVERY STATUS */}
              <div className={`p-5 rounded-2xl border text-xs ${theme === "dark" ? "bg-slate-900/40 border-slate-800 shadow-lg shadow-cyan-500/5" : "bg-white border-slate-200 shadow-sm"}`}>
                <div className="flex items-center gap-2 font-bold mb-3">
                  <RefreshCw className={`w-4 h-4 text-cyan-400 ${isScanningPlaylists ? "animate-spin" : ""}`} />
                  <span className="text-white">Otomatik Arama ve IPTV Güncelleme Veritabanı</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                  Küresel kamu sunucularındaki ücretsiz m3u/m3u8 listeleri otomatik aranır, filtrelenir ve aynı isimdeki yayınlar akıllıca birleştirilir.
                </p>

                {/* Advanced Search Options */}
                <div className="flex flex-col gap-3 mb-4 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/40">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Arama Veritabanı Kaynağı</label>
                    <select
                      value={scanPreset}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setScanPreset(val);
                        if (val !== "custom") {
                          setScanCustomUrl("");
                        }
                      }}
                      className={`px-3 py-2 rounded-xl text-xs outline-none transition ${theme === "dark" ? "bg-slate-900 border border-slate-800 text-white focus:border-cyan-400" : "bg-slate-100 border border-slate-200 text-slate-900 focus:border-indigo-500"}`}
                    >
                      <option value="all">🌐 Tüm Küresel Sunucular (Google + Yandex + GitHub)</option>
                      <option value="tr">🇹🇷 IPTV-Org Türkiye TV Paketi</option>
                      <option value="world">🇺🇸 Free World TV Canlı Yayın Kataloğu</option>
                      <option value="radio">📻 Türkiye Canlı Radyo & Müzik Listesi</option>
                      <option value="custom">🔗 Özel M3U Havuzu (.m3u Linki Girin)</option>
                    </select>
                  </div>

                  {scanPreset === "custom" && (
                    <div className="flex flex-col gap-1 animate-fade-in">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Özel M3U Akış Linki</label>
                      <input
                        type="text"
                        placeholder="https://.../playlist.m3u"
                        value={scanCustomUrl}
                        onChange={(e) => setScanCustomUrl(e.target.value)}
                        className={`px-3 py-2 rounded-xl text-xs outline-none transition ${theme === "dark" ? "bg-slate-900 border border-slate-800 text-white focus:border-cyan-400" : "bg-slate-100 border border-slate-200 text-slate-900 focus:border-indigo-500"}`}
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kanal İsmi / Kelime Filtresi (İsteğe Bağlı)</label>
                    <input
                      type="text"
                      placeholder="Örn: Spor, Haber, TRT, Music..."
                      value={scanKeyword}
                      onChange={(e) => setScanKeyword(e.target.value)}
                      className={`px-3 py-2 rounded-xl text-xs outline-none transition ${theme === "dark" ? "bg-slate-900 border border-slate-800 text-white focus:border-cyan-400" : "bg-slate-100 border border-slate-200 text-slate-900 focus:border-indigo-500"}`}
                    />
                  </div>
                </div>

                <button
                  onClick={handleForceAutoTarama}
                  disabled={isScanningPlaylists}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold tracking-wider text-[10px] uppercase transition duration-300 flex items-center justify-center gap-2 border cursor-pointer ${
                    isScanningPlaylists 
                      ? "bg-cyan-500/10 border-cyan-400/30 text-cyan-400 animate-pulse" 
                      : "bg-indigo-600/20 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-indigo-600 hover:text-white hover:shadow-lg border-indigo-500/30 text-indigo-300"
                  }`}
                >
                  {isScanningPlaylists ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Tarama ve Birleştirme Yapılıyor...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Veritabanında Ara & Kanalları Güncelle
                    </>
                  )}
                </button>

                {/* Scan Metrics Board */}
                {scanStats && (
                  <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-cyan-400/10 flex flex-col gap-2 font-mono text-[10px] animate-fade-in text-slate-300">
                    <div className="text-cyan-400 font-bold border-b border-white/5 pb-1 flex justify-between">
                      <span>TARAMA ÖZETİ:</span>
                      <span className="text-[9px] bg-cyan-400/10 px-1.5 py-0.5 rounded text-cyan-400 font-mono">BAŞARILI</span>
                    </div>
                    <div className="flex flex-col gap-1 border-b border-white/5 pb-2 text-[9px] text-slate-400">
                      <div className="font-sans font-bold text-slate-400">Aranan Motorlar:</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/5 text-slate-300 font-mono">www.google.com</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/5 text-slate-300 font-mono">www.yandex.com</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/5 text-slate-300 font-mono">www.github.com</span>
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

          </div>
        ) : (
          /* CASE 2: DETAILED OPENED CATEGORY VIEW (YENİ AÇILAN SAYFA) */
          <div className="flex flex-col gap-6 animate-fade-in">
            
            {/* Category Detail Header with a Geri (Back) button at the top left */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/40 pb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveCategory(null)}
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-cyan-400 text-slate-300 hover:text-white rounded-xl text-xs font-black transition duration-300 shadow-md cursor-pointer"
                  title="Kategorilere Dön"
                >
                  <ArrowLeft className="w-4 h-4 text-cyan-400" />
                  <span>Geri Dön</span>
                </button>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-800 rounded-xl border border-slate-700 text-cyan-400">
                    {(() => {
                      const Icon = categoriesList.find(c => c.id === activeCategory)?.icon || Tv2;
                      return <Icon className="w-5 h-5" />;
                    })()}
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-wide text-white">
                      {categoriesList.find(c => c.id === activeCategory)?.label || t.allCategories}
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-none">
                      {getCategoryDescription(activeCategory)}
                    </p>
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono bg-slate-900/60 px-3 py-1.5 rounded-xl text-slate-400 border border-slate-800">
                KANAL SAYISI: {filteredChannels.length}
              </span>
            </div>

            {/* Custom List M3U Loading Panel (If active category is CustomPlaylist) */}
            {activeCategory === "CustomPlaylist" && (
              <div className={`p-6 rounded-2xl border ${theme === "dark" ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"}`}>
                <h3 className="text-base font-black tracking-wide mb-2 flex items-center gap-2 text-white">
                  <PlusCircle className="w-5 h-5 text-cyan-400" />
                  {t.m3uUploadTitle}
                </h3>
                <p className="text-xs opacity-60 text-slate-400 mb-4">
                  Kendi IPTV sağlayıcınızdan aldığınız .m3u bağlantısını yapıştırabilir veya cihazınızdan .m3u uzantılı dosya seçip yükleyebilirsiniz.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder={t.m3uPlaceholder}
                    value={customM3uUrl}
                    onChange={(e) => setCustomM3uUrl(e.target.value)}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-xs outline-none transition ${theme === "dark" ? "bg-slate-950 border border-slate-800 text-white focus:border-cyan-400" : "bg-slate-100 border border-slate-200 text-slate-900 focus:border-indigo-500"}`}
                  />
                  <button
                    onClick={handleLoadCustomM3uUrl}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold tracking-wide text-xs transition shadow-lg shadow-cyan-500/10 cursor-pointer"
                  >
                    {t.m3uLoadBtn}
                  </button>
                </div>

                <div className="flex items-center gap-4 mt-4 border-t border-slate-800/40 pt-4">
                  <span className="text-xs text-slate-400 font-bold">{t.m3uFileBtn}:</span>
                  <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] uppercase tracking-wider py-2 px-4 rounded-xl transition border border-white/5 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    M3U Dosyası Yükle
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
              <div className={`p-6 rounded-2xl border ${theme === "dark" ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"}`}>
                <div className="flex justify-between items-center border-b border-slate-800/40 pb-4 mb-6">
                  <h3 className="text-base font-black tracking-wide flex items-center gap-2 text-white">
                    <ShieldAlert className="w-5 h-5 text-indigo-400" />
                    {t.adminPanel}
                  </h3>
                  {adminToken && (
                    <button
                      onClick={handleAdminLogout}
                      className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-300 font-bold text-xs transition border border-red-500/20 cursor-pointer"
                    >
                      Güvenli Çıkış (Logout)
                    </button>
                  )}
                </div>

                {adminError && (
                  <div className="p-3 mb-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-bold">
                    {adminError}
                  </div>
                )}
                {adminSuccess && (
                  <div className="p-3 mb-4 rounded-xl bg-green-950/40 border border-green-500/30 text-green-400 text-xs font-bold">
                    {adminSuccess}
                  </div>
                )}

                {!adminToken ? (
                  <form onSubmit={handleAdminLogin} className="max-w-md mx-auto py-8 text-center">
                    <Lock className="w-12 h-12 mx-auto text-indigo-400 mb-4 animate-bounce" />
                    <h4 className="text-sm font-black mb-2 text-white">{t.adminPinPrompt}</h4>
                    <p className="text-[11px] text-slate-400 mb-6">
                      Yayın eklemek, silmek ve genel güncellemeleri yönetmek için yönetici şifrenizi (Varsayılan: evim1234) giriniz.
                    </p>
                    
                    <div className="flex flex-col gap-3">
                      <input
                        type="password"
                        maxLength={12}
                        placeholder="••••"
                        value={adminPinInput}
                        onChange={(e) => setAdminPinInput(e.target.value)}
                        className={`text-center tracking-widest text-lg font-black px-4 py-3 rounded-xl outline-none transition ${theme === "dark" ? "bg-slate-950 border border-slate-800 text-white focus:border-cyan-400" : "bg-slate-100 border border-slate-200 text-slate-900 focus:border-indigo-500"}`}
                      />
                      <button
                        type="submit"
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold tracking-wide text-xs transition shadow-lg shadow-cyan-500/10 cursor-pointer"
                      >
                        {t.adminLoginBtn}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* LEFT: ADD/EDIT STREAM FORM */}
                    <div className="flex flex-col gap-4">
                      <h4 className="text-xs font-extrabold text-cyan-400 tracking-wider uppercase flex items-center gap-1.5">
                        {editingChannelId ? (
                          <>
                            <Edit className="w-4 h-4 animate-pulse" />
                            <span>Kanalı Düzenle & Güncelle</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>{t.adminAddChannel}</span>
                          </>
                        )}
                      </h4>
                      
                      <form onSubmit={editingChannelId ? handleAdminUpdateChannel : handleAdminAddChannel} className="flex flex-col gap-3 text-xs">
                        <div className="flex flex-col gap-1">
                          <label className="text-slate-400 font-bold">{t.adminChannelName} *</label>
                          <input
                            type="text"
                            required
                            placeholder="Örn: TRT 1 HD"
                            value={addChannelName}
                            onChange={(e) => setAddChannelName(e.target.value)}
                            className={`px-3 py-2 rounded-xl outline-none ${theme === "dark" ? "bg-slate-950 border border-slate-800 text-white" : "bg-slate-100 border border-slate-200"}`}
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-slate-400 font-bold">{t.adminChannelUrl} *</label>
                          <input
                            type="text"
                            required
                            placeholder="https://.../master.m3u8"
                            value={addChannelUrl}
                            onChange={(e) => setAddChannelUrl(e.target.value)}
                            className={`px-3 py-2 rounded-xl outline-none ${theme === "dark" ? "bg-slate-950 border border-slate-800 text-white" : "bg-slate-100 border border-slate-200"}`}
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-slate-400 font-bold">{t.adminChannelLogo}</label>
                          <input
                            type="text"
                            placeholder="https://.../logo.png"
                            value={addChannelLogo}
                            onChange={(e) => setAddChannelLogo(e.target.value)}
                            className={`px-3 py-2 rounded-xl outline-none ${theme === "dark" ? "bg-slate-950 border border-slate-800 text-white" : "bg-slate-100 border border-slate-200"}`}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-slate-400 font-bold">{t.adminChannelCategory}</label>
                            <select
                              value={addChannelCategory}
                              onChange={(e) => setAddChannelCategory(e.target.value)}
                              className={`px-2 py-2 rounded-xl outline-none ${theme === "dark" ? "bg-slate-950 border border-slate-800 text-white" : "bg-slate-100 border border-slate-200 text-slate-900"}`}
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
                            <label className="text-slate-400 font-bold">Dil (Lang)</label>
                            <select
                              value={addChannelLanguage}
                              onChange={(e) => setAddChannelLanguage(e.target.value)}
                              className={`px-2 py-2 rounded-xl outline-none ${theme === "dark" ? "bg-slate-950 border border-slate-800 text-white" : "bg-slate-100 border border-slate-200 text-slate-900"}`}
                            >
                              <option value="TR">TR</option>
                              <option value="EN">EN</option>
                              <option value="DE">DE</option>
                              <option value="FR">FR</option>
                              <option value="ES">ES</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-slate-400 font-bold">Tür (Type)</label>
                            <select
                              value={addChannelType}
                              onChange={(e) => setAddChannelType(e.target.value as any)}
                              className={`px-2 py-2 rounded-xl outline-none ${theme === "dark" ? "bg-slate-950 border border-slate-800 text-white" : "bg-slate-100 border border-slate-200 text-slate-900"}`}
                            >
                              <option value="live">Live TV</option>
                              <option value="movie">Movie</option>
                              <option value="series">Series</option>
                              <option value="documentary">Documentary</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-slate-400 font-bold">{t.adminChannelDesc}</label>
                          <textarea
                            placeholder="Yayına dair ek bilgiler, program açıklaması..."
                            value={addChannelDesc}
                            onChange={(e) => setAddChannelDesc(e.target.value)}
                            rows={2}
                            className={`px-3 py-2 rounded-xl outline-none resize-none ${theme === "dark" ? "bg-slate-950 border border-slate-800 text-white" : "bg-slate-100 border border-slate-200"}`}
                          />
                        </div>

                        <div className="flex gap-2 mt-2">
                          <button
                            type="submit"
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold tracking-wide text-xs transition shadow-lg shadow-cyan-500/10 cursor-pointer"
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
                              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                            >
                              İptal
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    {/* RIGHT: PIN MANAGER & CURRENT CHANNELS DELETE LIST */}
                    <div className="flex flex-col gap-6">
                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40">
                        <h4 className="text-xs font-extrabold text-indigo-400 tracking-wider uppercase flex items-center gap-1.5 mb-3">
                          <Settings className="w-4 h-4" />
                          {t.adminChangePin}
                        </h4>
                        <form onSubmit={handleAdminChangePin} className="flex flex-col gap-3 text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1">
                              <label className="text-slate-400 font-bold">Mevcut Şifre</label>
                              <input
                                type="password"
                                required
                                placeholder="••••"
                                value={currentPinInput}
                                onChange={(e) => setCurrentPinInput(e.target.value)}
                                className={`px-3 py-2 rounded-xl outline-none ${theme === "dark" ? "bg-slate-950 border border-slate-800 text-white" : "bg-slate-100 border border-slate-200"}`}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-slate-400 font-bold">Yeni Şifre</label>
                              <input
                                type="password"
                                required
                                placeholder="••••"
                                value={newPinInput}
                                onChange={(e) => setNewPinInput(e.target.value)}
                                className={`px-3 py-2 rounded-xl outline-none ${theme === "dark" ? "bg-slate-950 border border-slate-800 text-white" : "bg-slate-100 border border-slate-200"}`}
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold tracking-wide transition border border-white/5 cursor-pointer"
                          >
                            {t.adminSavePin}
                          </button>
                        </form>
                      </div>

                      <div className="flex flex-col gap-3">
                        <h4 className="text-xs font-extrabold text-red-400 tracking-wider uppercase">
                          Yayın Listesi ve Genel Güncelleme ({channels.length})
                        </h4>
                        <p className="text-[10px] opacity-60">
                          Aşağıdaki listeden dilediğiniz yayını tek tıkla sistemden kaldırabilirsiniz.
                        </p>
                        
                        <div className="max-h-64 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/30 p-2 flex flex-col gap-1.5">
                          {channels.map((c) => (
                            <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/40 text-xs">
                              <div className="flex items-center gap-2 overflow-hidden mr-2">
                                <img src={c.logo} className="w-6 h-6 rounded object-cover bg-slate-800 flex-shrink-0" alt="" />
                                <div className="overflow-hidden">
                                  <span className="font-bold truncate block text-white">{c.name}</span>
                                  <span className="text-[9px] opacity-50 block">{c.category} • {c.type}</span>
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
                                  className="p-1.5 rounded-lg bg-cyan-600/10 hover:bg-cyan-500 hover:text-black text-cyan-400 transition cursor-pointer"
                                  title="Düzenle"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleAdminDeleteChannel(c.id)}
                                  className="p-1.5 rounded-lg bg-red-600/10 hover:bg-red-600 hover:text-white text-red-400 transition cursor-pointer"
                                  title={t.adminDeleteChannel}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CHANNELS GRID CATALOG (ALFABETİK A/Z SIRALANMIŞ KUTUCUKLAR) */}
            {activeCategory !== "AdminPanel" && (
              <div>
                {filteredChannels.length === 0 ? (
                  <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl p-6">
                    <Tv className="w-12 h-12 mx-auto text-slate-600 mb-4 animate-bounce" />
                    <h4 className="text-base font-black mb-1">Kanal Listesi Boş</h4>
                    <p className="text-xs text-slate-400">
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
                          className={`relative rounded-2xl overflow-hidden border cursor-pointer group transition-all duration-300 flex flex-col justify-between ${
                            theme === "dark" ? "bg-slate-900/80 border-slate-800 hover:border-cyan-400" : "bg-white border-slate-200 hover:border-indigo-500"
                          } ${isFocused ? "border-cyan-400 border-4 scale-102 ring-4 ring-cyan-400/30" : ""}`}
                        >
                          {/* Logo and Image Area */}
                          <div className="relative aspect-video w-full bg-slate-950/80 overflow-hidden">
                            <img
                              src={chan.logo}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                              alt={chan.name}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                            
                            {/* Type Badge */}
                            <span className="absolute top-2 left-2 text-[8px] font-black tracking-widest uppercase bg-cyan-400 text-black px-2 py-0.5 rounded shadow">
                              {chan.type}
                            </span>

                            {/* Language Badge */}
                            <span className="absolute top-2 right-2 text-[8px] font-bold bg-slate-950/80 text-white px-1.5 py-0.5 rounded">
                              {chan.language}
                            </span>

                            {/* Continue watching indicator */}
                            {hasSavedPos && (
                              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-0.5 bg-indigo-600 text-[9px] font-bold text-white rounded">
                                <Clock className="w-2.5 h-2.5" />
                                <span>Devam Et</span>
                              </div>
                            )}

                            {/* Favorite Button */}
                            <button
                              onClick={(e) => toggleFavorite(chan.id, e)}
                              className={`absolute bottom-2 right-2 p-1.5 rounded-full transition ${
                                isFav ? "bg-red-500 text-white" : "bg-black/50 hover:bg-black/80 text-white"
                              }`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-current animate-pulse" : ""}`} />
                            </button>
                          </div>

                          {/* Info and Description */}
                          <div className="p-3.5 flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="font-extrabold text-xs tracking-wide truncate group-hover:text-cyan-400 transition mb-1 text-white">
                                {chan.name}
                              </h4>
                              <p className="text-[10px] opacity-60 text-slate-400 line-clamp-2 h-7 leading-relaxed font-sans">
                                {chan.description}
                              </p>
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[9px] font-mono text-cyan-400">
                              <span className="font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                                CANLI:
                              </span>
                              <span className="text-slate-400 font-bold">12:00 - 14:00</span>
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

      </main>

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
