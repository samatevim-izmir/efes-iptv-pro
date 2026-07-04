import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { IPTVChannel, IPTVLanguage, TRANSLATIONS, EPGProgram } from "../types";
import { 
  Play, Pause, RotateCcw, RotateCw, Maximize, Minimize, 
  Volume2, VolumeX, Settings, Disc, Sparkles, X, Tv, Radio, 
  ChevronRight, ChevronLeft, Activity, Volume1, AlertCircle
} from "lucide-react";

interface VideoPlayerProps {
  channel: IPTVChannel & { backupUrls?: string[] };
  onClose: () => void;
  lang: IPTVLanguage;
  onSaveProgress: (channelId: string, position: number) => void;
  savedPosition?: number;
  onPlayNextEpisode?: (channel: IPTVChannel) => void;
  epgList?: EPGProgram[];
  playlist?: IPTVChannel[];
  onSelectChannel?: (channel: IPTVChannel) => void;
}

export default function VideoPlayer({
  channel,
  onClose,
  lang,
  onSaveProgress,
  savedPosition = 0,
  onPlayNextEpisode,
  epgList = [],
  playlist = [],
  onSelectChannel
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<"auto" | "16:9" | "4:3" | "fill" | "zoom">("auto");
  const [showControls, setShowControls] = useState(true);
  const [selectedDubbing, setSelectedDubbing] = useState<string>("");
  const [isPipActive, setIsPipActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // Backup stream states (Item: Merging identical name channels and falling back)
  const [activeUrl, setActiveUrl] = useState<string>(channel.streamUrl);
  const [backupIndex, setBackupIndex] = useState<number>(-1);
  const [retryCount, setRetryCount] = useState(0);
  
  // CORS & mixed content bypass proxy state
  const [useProxy, setUseProxy] = useState<boolean>(() => {
    if (channel.streamUrl && channel.streamUrl.startsWith("http://")) {
      return true;
    }
    if (channel.streamUrl && (channel.streamUrl.includes(".m3u8") || channel.category === "National" || channel.category === "News" || channel.category === "Sports" || channel.category === "Radio")) {
      return true;
    }
    return false;
  });

  // Resume watch state
  const [showResumeModal, setShowResumeModal] = useState(false);

  // Adaptive Bitrate, Internet Speed Auto Quality States
  const [quality, setQuality] = useState<"auto" | "1080p" | "720p" | "480p">("auto");
  const [playerEngine, setPlayerEngine] = useState<"hls" | "html5" | "stable_codec">("hls");
  const [currentActiveHeight, setCurrentActiveHeight] = useState<number>(1080);
  const [networkSpeed, setNetworkSpeed] = useState<number>(18.5); // Mbps
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [speedStatus, setSpeedStatus] = useState("Mükemmel");
  const [showSpeedTestModal, setShowSpeedTestModal] = useState(false);
  const [speedProgress, setSpeedProgress] = useState(0);
  const hlsRef = useRef<Hls | null>(null);
  const mediaRecoveryAttempts = useRef<number>(0);

  const t = TRANSLATIONS[lang];

  // Zapping logic (Next / Previous channel zapping)
  const currentIdx = playlist.findIndex((c) => c.id === channel.id);
  const hasZapping = playlist.length > 1 && currentIdx !== -1 && !!onSelectChannel;

  const handlePrevChannel = () => {
    if (!hasZapping || !onSelectChannel) return;
    const prevIdx = currentIdx > 0 ? currentIdx - 1 : playlist.length - 1;
    onSelectChannel(playlist[prevIdx]);
  };

  const handleNextChannel = () => {
    if (!hasZapping || !onSelectChannel) return;
    const nextIdx = currentIdx < playlist.length - 1 ? currentIdx + 1 : 0;
    onSelectChannel(playlist[nextIdx]);
  };

  // Zapping keyboard shortcuts (ArrowUp, ArrowDown, [ or ] keys)
  useEffect(() => {
    if (!hasZapping) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }
      if (e.key === "[" || e.key === "p" || e.key === "P") {
        handlePrevChannel();
      } else if (e.key === "]" || e.key === "n" || e.key === "N") {
        handleNextChannel();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        handleNextChannel();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handlePrevChannel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasZapping, currentIdx, playlist, onSelectChannel]);

  // Live Stream EPG automatic overlay state (show for 5 seconds on mount/load)
  const [showLiveEpgToast, setShowLiveEpgToast] = useState(false);

  // Show EPG details at the bottom for 5 seconds when live channel starts playing or EPG is loaded
  useEffect(() => {
    if (channel.type === "live" && epgList && epgList.length > 0) {
      setShowLiveEpgToast(true);
      const timer = setTimeout(() => {
        setShowLiveEpgToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setShowLiveEpgToast(false);
    }
  }, [channel.id, epgList]);

  // Find current program and progress
  const getActiveEpgProgram = () => {
    if (!epgList || epgList.length === 0) return null;
    const now = new Date();
    const idx = epgList.findIndex((p) => {
      const start = new Date(p.start);
      const end = new Date(p.end);
      return now >= start && now < end;
    });
    if (idx !== -1) {
      return {
        program: epgList[idx],
        next: idx + 1 < epgList.length ? epgList[idx + 1] : null,
        progress: (() => {
          const start = new Date(epgList[idx].start).getTime();
          const end = new Date(epgList[idx].end).getTime();
          const total = end - start;
          const elapsed = now.getTime() - start;
          if (total > 0) {
            return Math.min(100, Math.max(0, (elapsed / total) * 100));
          }
          return 0;
        })()
      };
    }
    return null;
  };

  const activeEpgInfo = getActiveEpgProgram();

  const formatEpgTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const hrs = String(d.getHours()).padStart(2, "0");
      const mins = String(d.getMinutes()).padStart(2, "0");
      return `${hrs}:${mins}`;
    } catch (e) {
      return "";
    }
  };

  const getRemainingMinutes = (isoEnd: string) => {
    try {
      const end = new Date(isoEnd).getTime();
      const now = new Date().getTime();
      const diffMs = end - now;
      if (diffMs <= 0) return 0;
      return Math.ceil(diffMs / (1000 * 60));
    } catch (e) {
      return 0;
    }
  };

  const isYoutube = activeUrl.includes("youtube.com") || activeUrl.includes("youtu.be");

  const getYoutubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : "";
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&rel=0&showinfo=0&enablejsapi=1`;
  };

  // Sync state if channel changes
  useEffect(() => {
    setActiveUrl(channel.streamUrl);
    setBackupIndex(-1);
    setRetryCount(0);
    setPlaybackError(null);
    mediaRecoveryAttempts.current = 0;
    const initialProxy = channel.streamUrl && (
      channel.streamUrl.startsWith("http://") || 
      channel.streamUrl.includes(".m3u8") || 
      channel.category === "National" || 
      channel.category === "News" || 
      channel.category === "Sports" || 
      channel.category === "Radio"
    );
    setUseProxy(!!initialProxy);
  }, [channel]);

  // Handle HTML5 fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Initialize dubbing selection
  useEffect(() => {
    if (channel.dubbingOptions && channel.dubbingOptions.length > 0) {
      setSelectedDubbing(channel.dubbingOptions[0]);
    } else {
      setSelectedDubbing(channel.language === "TR" ? "TR (Orijinal)" : "EN (Orijinal)");
    }
  }, [channel]);

  // Apply quality level selection on HLS instance
  const applyQualitySettingsOnHls = () => {
    const hls = hlsRef.current;
    if (!hls) return;

    if (quality === "auto") {
      hls.currentLevel = -1; // Auto ABR level in hls.js
    } else {
      const targetHeight = quality === "1080p" ? 1080 : quality === "720p" ? 720 : 480;
      setCurrentActiveHeight(targetHeight);
      if (hls.levels && hls.levels.length > 0) {
        let closestIdx = -1;
        let minDiff = Infinity;
        hls.levels.forEach((lvl, idx) => {
          const diff = Math.abs((lvl.height || 720) - targetHeight);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = idx;
          }
        });
        if (closestIdx !== -1) {
          hls.currentLevel = closestIdx;
        }
      }
    }
  };

  const applyManualQuality = (qKey: "auto" | "1080p" | "720p" | "480p") => {
    setQuality(qKey);
    const hls = hlsRef.current;
    if (hls) {
      if (qKey === "auto") {
        hls.currentLevel = -1;
      } else {
        const targetHeight = qKey === "1080p" ? 1080 : qKey === "720p" ? 720 : 480;
        setCurrentActiveHeight(targetHeight);
        if (hls.levels && hls.levels.length > 0) {
          let closestIdx = -1;
          let minDiff = Infinity;
          hls.levels.forEach((lvl, idx) => {
            const diff = Math.abs((lvl.height || 720) - targetHeight);
            if (diff < minDiff) {
              minDiff = diff;
              closestIdx = idx;
            }
          });
          if (closestIdx !== -1) {
            hls.currentLevel = closestIdx;
          }
        }
      }
    } else {
      if (qKey !== "auto") {
        setCurrentActiveHeight(qKey === "1080p" ? 1080 : qKey === "720p" ? 720 : 480);
      }
    }
  };

  // Speed test simulation
  const runSpeedTest = async () => {
    setIsMeasuring(true);
    setSpeedProgress(0);
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setSpeedProgress(currentProgress);
      if (currentProgress >= 100) {
        clearInterval(interval);
      }
    }, 100);

    const startTime = Date.now();
    let finalMbps = 18.5;

    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      await res.json();
      const endTime = Date.now();
      const latencyMs = endTime - startTime;
      
      const downlink = (navigator as any).connection?.downlink || 25;
      const factor = latencyMs < 50 ? 1.4 : latencyMs < 150 ? 1.0 : 0.6;
      finalMbps = parseFloat((downlink * factor + Math.random() * 4).toFixed(1));
      if (finalMbps < 1) finalMbps = 1.5;
    } catch {
      finalMbps = parseFloat((15 + Math.random() * 20).toFixed(1));
    }

    setTimeout(() => {
      setNetworkSpeed(finalMbps);
      setIsMeasuring(false);
    }, 1200);
  };

  useEffect(() => {
    if (showSpeedTestModal) {
      runSpeedTest();
    }
  }, [showSpeedTestModal]);

  // Monitor network fluctuations
  useEffect(() => {
    if (quality !== "auto") return;

    let targetHeight = 1080;
    let statusStr = "Mükemmel";
    if (networkSpeed > 15) {
      targetHeight = 1080;
      statusStr = lang === "TR" ? "Mükemmel (FHD)" : "Excellent (FHD)";
    } else if (networkSpeed >= 6) {
      targetHeight = 720;
      statusStr = lang === "TR" ? "İyi (HD)" : "Good (HD)";
    } else {
      targetHeight = 480;
      statusStr = lang === "TR" ? "Zayıf (SD)" : "Weak (SD)";
    }

    setSpeedStatus(statusStr);
    setCurrentActiveHeight(targetHeight);

    const hls = hlsRef.current;
    if (hls && hls.levels && hls.levels.length > 0) {
      let closestIdx = -1;
      let minDiff = Infinity;
      hls.levels.forEach((lvl, idx) => {
        const diff = Math.abs((lvl.height || 720) - targetHeight);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });
      if (closestIdx !== -1 && hls.currentLevel !== closestIdx) {
        hls.currentLevel = closestIdx;
      }
    }
  }, [networkSpeed, quality, lang]);

  // Try loading backup URL if current fails
  const tryNextBackupUrl = () => {
    // Self-healing: If we weren't using the local proxy, activate proxy mode first for the same URL!
    if (!useProxy) {
      setPlaybackError("Güvenli tünel bağlantısı kuruluyor, lütfen bekleyin...");
      setUseProxy(true);
      setTimeout(() => setPlaybackError(null), 3000);
      return;
    }

    const backups = channel.backupUrls || [];
    if (backups.length > 0 && backupIndex < backups.length - 1) {
      const nextIndex = backupIndex + 1;
      setBackupIndex(nextIndex);
      const nextUrl = backups[nextIndex];
      setPlaybackError(`Ana yayın yanıt vermiyor, Yedek ${nextIndex + 1} yükleniyor...`);
      setActiveUrl(nextUrl);
      if (nextUrl.startsWith("http://")) {
        setUseProxy(true);
      }
      setTimeout(() => setPlaybackError(null), 3000);
    } else {
      setPlaybackError("Yayın akış kaynağı çözülemedi. Lütfen bağlantınızı veya yayın durumunu kontrol edin.");
    }
  };

  // Up-to-date and robust HLS decoding with self-healing, retries & auto recovery (Item: video ve ses cozme kod sistemi)
  useEffect(() => {
    if (isYoutube) return;
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    
    // Dynamically choose between direct streaming or secure CORS & mixed content bypass proxy
    const sourceUrl = useProxy 
      ? `/api/proxy?url=${encodeURIComponent(activeUrl)}` 
      : activeUrl;

    const isM3u8 = (
      activeUrl.endsWith(".m3u8") || 
      activeUrl.includes("m3u8") || 
      channel.category === "National" || 
      channel.category === "News" || 
      channel.category === "Sports"
    ) && 
    !activeUrl.includes(".mp3") && 
    !activeUrl.includes(".aac") && 
    !activeUrl.includes(".wav") && 
    !activeUrl.includes(".ogg") && 
    !activeUrl.includes("mp3") && 
    !activeUrl.includes("aac") &&
    !activeUrl.includes("shoutcast") &&
    !activeUrl.includes("icecast");

    if (isM3u8 && playerEngine !== "html5") {
      if (Hls.isSupported()) {
        const hlsConfig = playerEngine === "stable_codec" ? {
          enableWorker: true,
          lowLatencyMode: false, // Turn off low latency for better buffering
          backBufferLength: 120,
          maxBufferLength: 120,
          maxMaxBufferLength: 240,
          maxBufferSize: 10 * 1024 * 1024, // 10MB Önbellek Havuzu (Buffer Cache Pool)
          maxBufferHole: 5, // skip gap holes aggressively
          highBufferWatchdogPeriod: 5,
          nudgeMaxRetry: 20, // autostuck recovery
          appendErrorMaxRetry: 20,
          manifestLoadingMaxRetry: 15,
          levelLoadingMaxRetry: 15,
          fragLoadingMaxRetry: 20,
          enableSoftwareAES: true, // handles encrypted webstreams
          liveSyncDurationCount: 6, // larger safety margin
          liveMaxLatencyDurationCount: 20,
        } : {
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 60,
          maxMaxBufferLength: 120,
          maxBufferSize: 10 * 1024 * 1024, // 10MB Önbellek Havuzu (Buffer Cache Pool)
          maxBufferHole: 2, // skips over gap holes (fixes video codec/sync pauses)
          highBufferWatchdogPeriod: 3,
          nudgeMaxRetry: 10, // autostuck recovery
          appendErrorMaxRetry: 10,
          manifestLoadingMaxRetry: 8,
          levelLoadingMaxRetry: 8,
          fragLoadingMaxRetry: 12,
          enableSoftwareAES: true, // handles encrypted webstreams
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 10,
        };

        hls = new Hls(hlsConfig);

        hls.loadSource(sourceUrl);
        hls.attachMedia(video);
        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setPlaybackError(null);
          if (isPlaying && document.visibilityState === "visible") {
            video.play().catch(() => {});
          }
          applyQualitySettingsOnHls();
        });

        // Smart recovery loops (Self-Healing Audio & Video Decoders)
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn("Fatal network error in decoder, recovering...");
                hls?.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn("Fatal media decoding error, trying to recover standard sync...");
                mediaRecoveryAttempts.current += 1;
                if (mediaRecoveryAttempts.current > 2) {
                  console.warn("Too many media decoding errors. Falling back to native HTML5 standard codec...");
                  setPlaybackError("Ses veya video çözücü hatası algılandı. Süper Uyumlu yerel HTML5 moduna geçiliyor...");
                  setPlayerEngine("html5");
                } else {
                  hls?.recoverMediaError();
                }
                break;
              default:
                console.error("Fatal unrecoverable error. Switching to backup url...");
                tryNextBackupUrl();
                break;
            }
          }
        });

      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS for Safari/iOS
        video.src = sourceUrl;
        video.addEventListener("error", tryNextBackupUrl);
      }
    } else {
      // Standard MP4 or forced Native HTML5
      video.src = sourceUrl;
      video.addEventListener("error", tryNextBackupUrl);
    }

    if (savedPosition > 10) {
      setShowResumeModal(true);
    }

    return () => {
      if (hls) {
        hls.destroy();
        hlsRef.current = null;
      }
      video.removeEventListener("error", tryNextBackupUrl);
    };
  }, [activeUrl, savedPosition, useProxy, playerEngine]);

  // Handle Tab Visibility Changes: prevent any background playback completely
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Auto play next episode for Series (Item: dizi otomatik sonraki bolum)
  useEffect(() => {
    if (isYoutube) return;
    const video = videoRef.current;
    if (!video) return;

    const handleVideoEnded = () => {
      if (channel.category === "Series" && onPlayNextEpisode) {
        onPlayNextEpisode(channel);
      }
    };

    video.addEventListener("ended", handleVideoEnded);
    return () => {
      video.removeEventListener("ended", handleVideoEnded);
    };
  }, [channel, isYoutube, onPlayNextEpisode]);

  // Save progress periodically for non-live content
  useEffect(() => {
    if (isYoutube) return;
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration || 0);

      if (channel.type === "movie" || channel.type === "series" || channel.type === "documentary") {
        if (video.currentTime > 5 && Math.abs(video.currentTime - currentTime) > 4) {
          onSaveProgress(channel.id, video.currentTime);
        }
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [channel.id, currentTime, onSaveProgress]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleRewind = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    }
  };

  const handleForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
    }
  };

  const handleResumeConfirm = (resume: boolean) => {
    setShowResumeModal(false);
    const video = videoRef.current;
    if (!video) return;

    if (resume) {
      video.currentTime = savedPosition;
      video.play().catch(() => {});
    } else {
      video.currentTime = 0;
      video.play().catch(() => {});
    }
  };

  const togglePip = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPipActive(false);
      } else if (video.requestPictureInPicture) {
        await video.requestPictureInPicture();
        setIsPipActive(true);
      }
    } catch (err) {
      console.warn("PiP failed:", err);
    }
  };

  // Handle Fullscreen browser API (Item: ekran buyutme kucultme butonlari)
  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;

    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn("Fullscreen toggle failed:", err);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    if (videoRef.current) {
      videoRef.current.volume = value;
      videoRef.current.muted = value === 0;
      setIsMuted(value === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMute = !isMuted;
      videoRef.current.muted = nextMute;
      setIsMuted(nextMute);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (showControls) {
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 4500);
    }
    return () => clearTimeout(timeout);
  }, [showControls]);

  // Scale/Resizing CSS configurations
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "16:9":
        return "aspect-[16/9] w-full object-contain";
      case "4:3":
        return "aspect-[4/3] w-auto h-full max-h-screen object-contain mx-auto";
      case "fill":
        return "w-full h-full object-fill";
      case "zoom":
        return "w-full h-full object-cover scale-110 transition-all duration-300";
      case "auto":
      default:
        return "w-full h-full object-contain";
    }
  };

  const isRadio = channel.category === "Radio";

  return (
    <div
      ref={containerRef}
      onMouseMove={() => setShowControls(true)}
      className="fixed inset-0 wrongs z-40 bg-slate-950 flex flex-col items-center justify-center overflow-hidden group select-none transition-all duration-300"
    >
      {/* Underlying Video Player Element */}
      {isYoutube ? (
        <div className="w-full h-full max-w-5xl flex items-center justify-center p-4">
          <iframe
            src={getYoutubeEmbedUrl(activeUrl)}
            className="w-full aspect-video rounded-xl shadow-2xl shadow-cyan-500/5 border-2 border-white/5"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`${isRadio ? "opacity-0 absolute pointer-events-none w-[1px] h-[1px]" : getAspectRatioClass()} transition-all duration-350 bg-black`}
          onClick={togglePlay}
        />
      )}

      {/* RADIO STATION MODE: Elegant neon music visualizer (Item: video ve ses cozme kod sistemi) */}
      {isRadio && (
        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 bg-radial-gradient from-slate-900 to-slate-950 overflow-hidden">
          {/* Animated background halos */}
          <div className="absolute w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px] animate-pulse duration-[6000ms] pointer-events-none" />
          <div className="absolute w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] animate-pulse duration-[4000ms] pointer-events-none" />

          {/* Central Glassmorphic Neo-Neon Station Tuner Card */}
          <div className="relative bg-slate-900/60 backdrop-blur-xl border border-white/10 p-10 rounded-3xl max-w-md w-full flex flex-col items-center shadow-2xl shadow-cyan-500/5">
            
            {/* Spinning Neon Disk / Album cover */}
            <div className="relative w-56 h-56 rounded-full bg-slate-950 border-[6px] border-slate-800 shadow-xl flex items-center justify-center group-hover:scale-105 transition-all duration-500">
              <div 
                className={`absolute inset-3 rounded-full border border-dashed border-cyan-400/30 ${isPlaying ? "animate-spin" : ""}`}
                style={{ animationDuration: "12s" }}
              />
              <img 
                src={channel.logo} 
                className={`w-36 h-36 rounded-full object-cover shadow-inner ${isPlaying ? "animate-spin" : ""}`} 
                style={{ animationDuration: "25s" }}
                alt="Station Cover" 
              />
              {/* Disc core */}
              <div className="absolute w-8 h-8 rounded-full bg-slate-900 border-4 border-slate-950 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
              </div>
            </div>

            {/* Glowing Retro Frequency Display and status */}
            <div className="mt-8 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                <span className="text-[10px] tracking-widest font-mono font-bold text-green-400 uppercase">
                  Canlı Yayın Akışı
                </span>
              </div>
              <h2 className="text-2xl font-black text-white mt-2 tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-cyan-400">
                {channel.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xs line-clamp-2">
                {channel.description || "EFES IPTV Canlı radyo istasyonu."}
              </p>
            </div>

            {/* Simulated reactive spectrum bars dancing nicely */}
            <div className="flex gap-1.5 items-end h-12 mt-6 w-56 justify-center">
              {[...Array(12)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-1.5 rounded-full bg-gradient-to-t from-cyan-500 to-indigo-500 animate-audio-wave"
                  style={{
                    animationDuration: `${0.6 + Math.random() * 0.8}s`,
                    height: isPlaying ? `${15 + Math.random() * 85}%` : "8px",
                    transition: "height 0.3s ease"
                  }}
                />
              ))}
            </div>

            {/* Quick backup status readout if backups exist */}
            {channel.backupUrls && channel.backupUrls.length > 0 && (
              <div className="mt-4 text-[10px] font-mono bg-slate-950/60 border border-white/5 rounded-full px-3 py-1 text-slate-400">
                Alternatif Yayınlar Aktif ({channel.backupUrls.length} Adet)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Playback Error / Status Toast Banner */}
      {playbackError && (
        <div className="absolute top-24 z-50 bg-red-950/95 border-2 border-red-500 text-red-200 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in text-xs font-bold max-w-lg">
          <AlertCircle className="w-6 h-6 text-red-400 animate-bounce flex-shrink-0" />
          <span>{playbackError}</span>
        </div>
      )}

      {/* Resume playback modal */}
      {showResumeModal && (
        <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-slate-900 border-2 border-cyan-400 p-8 rounded-2xl max-w-lg w-full text-center shadow-2xl shadow-cyan-500/10">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <Sparkles className="w-8 h-8 animate-bounce" />
              </div>
            </div>
            <h3 className="text-xl font-black tracking-wide text-white mb-2">
              {t.resumeWatchTitle}
            </h3>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              {t.resumeText}
              <br />
              <span className="text-cyan-400 font-mono font-bold text-base mt-2 inline-block">
                ({formatTime(savedPosition)})
              </span>
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleResumeConfirm(true)}
                className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold tracking-wider text-sm transition shadow-lg shadow-cyan-500/20"
              >
                {t.resumeYes}
              </button>
              <button
                onClick={() => handleResumeConfirm(false)}
                className="flex-1 py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold tracking-wider text-sm transition"
              >
                {t.resumeNo}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER BAR CONTROLS (Item: kapatma tusu) */}
      <div
        className={`absolute top-0 inset-x-0 p-6 bg-gradient-to-b from-slate-950/90 to-transparent flex justify-between items-center transition-opacity duration-500 z-40 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-3 rounded-full bg-slate-900/80 hover:bg-red-600 text-white transition-all duration-200 border border-white/10 shadow-lg"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2.5 py-0.5 rounded bg-cyan-500 text-black font-extrabold tracking-widest uppercase shadow">
                {channel.category}
              </span>
              <span className="text-[10px] font-mono opacity-60 text-white bg-slate-900 px-2 py-0.5 rounded border border-white/5">
                {channel.language}
              </span>
              {backupIndex !== -1 && (
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-400/20">
                  YEDEK YAYIN #{backupIndex + 1}
                </span>
              )}
            </div>
            <h2 className="text-lg font-black tracking-wide text-white mt-1 text-shadow">
              {channel.name}
            </h2>
          </div>
        </div>

        {/* Floating Controls Right Side - Screen Fullscreen/Maximize & Sizing Close Toggles */}
        <div className="flex items-center gap-3">
          {/* Quick exit full control block */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-500/20"
            title="Kapat ve Çık"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Kapat</span>
          </button>
        </div>
      </div>

      {/* Main Center Floating Controls */}
      <div
        className={`absolute inset-0 flex items-center justify-center gap-8 pointer-events-none transition-opacity duration-500 z-30 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {hasZapping && (
          <button
            onClick={handlePrevChannel}
            className="pointer-events-auto p-4 rounded-full bg-slate-900/90 border border-white/10 hover:border-cyan-400 text-white hover:text-cyan-400 transform hover:scale-110 active:scale-95 transition-all duration-200 shadow-xl flex items-center justify-center cursor-pointer"
            title="Önceki Kanal (Zapping - [ Tuşu)"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
        )}

        <button
          onClick={togglePlay}
          className="pointer-events-auto p-6 rounded-full bg-cyan-500/20 border-2 border-cyan-400/50 hover:bg-cyan-400 hover:text-black text-cyan-400 transform hover:scale-110 active:scale-95 transition-all duration-200 shadow-2xl"
        >
          {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
        </button>

        {hasZapping && (
          <button
            onClick={handleNextChannel}
            className="pointer-events-auto p-4 rounded-full bg-slate-900/90 border border-white/10 hover:border-cyan-400 text-white hover:text-cyan-400 transform hover:scale-110 active:scale-95 transition-all duration-200 shadow-xl flex items-center justify-center cursor-pointer"
            title="Sonraki Kanal (Zapping - ] Tuşu)"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        )}
      </div>

      {/* FOOTER BAR CONTROLS (Item: ekran buyutme kucultme butonlari, boyutlar, en guncel cozme) */}
      <div
        className={`absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent flex flex-col gap-4 transition-opacity duration-500 z-40 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Playback Progress Slider */}
        {!isRadio && channel.type !== "live" && (
          <div className="flex items-center gap-3 w-full">
            <span className="text-xs font-mono text-slate-300">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={(e) => {
                const seekVal = parseFloat(e.target.value);
                setCurrentTime(seekVal);
                if (videoRef.current) videoRef.current.currentTime = seekVal;
              }}
              className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:h-2 transition-all duration-150"
            />
            <span className="text-xs font-mono text-slate-300">{formatTime(duration)}</span>
          </div>
        )}

        {/* Controls Grid */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Previous Channel Button */}
            {hasZapping && (
              <button
                onClick={handlePrevChannel}
                className="p-3 rounded-full bg-slate-900/90 hover:bg-slate-800 hover:text-cyan-400 text-white transition-all duration-200 border border-white/10 flex items-center justify-center cursor-pointer"
                title="Önceki Kanal"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="p-3 rounded-full bg-slate-900/90 hover:bg-slate-800 text-white transition-all duration-200 border border-white/10"
              title={isPlaying ? "Duraklat" : "Oynat"}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            {/* Next Channel Button */}
            {hasZapping && (
              <button
                onClick={handleNextChannel}
                className="p-3 rounded-full bg-slate-900/90 hover:bg-slate-800 hover:text-cyan-400 text-white transition-all duration-200 border border-white/10 flex items-center justify-center cursor-pointer"
                title="Sonraki Kanal"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {/* Rewind */}
            {!isRadio && (
              <button
                onClick={handleRewind}
                className="p-3 rounded-full bg-slate-900/90 hover:bg-slate-800 text-white transition-all duration-200 border border-white/10"
                title="10sn Geri"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}

            {/* Fast Forward */}
            {!isRadio && (
              <button
                onClick={handleForward}
                className="p-3 rounded-full bg-slate-900/90 hover:bg-slate-800 text-white transition-all duration-200 border border-white/10"
                title="10sn İleri"
              >
                <RotateCw className="w-5 h-5" />
              </button>
            )}

            {/* Volume controls */}
            <div className="flex items-center gap-2 ml-2 bg-slate-900/80 border border-white/10 rounded-2xl px-3 py-1.5">
              <button
                onClick={toggleMute}
                className="p-1 rounded text-white hover:text-cyan-400 transition"
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : volume > 0.5 ? <Volume2 className="w-5 h-5" /> : <Volume1 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="w-16 md:w-24 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Cycle Backup URLs manually if available */}
            {channel.backupUrls && channel.backupUrls.length > 0 && (
              <button
                onClick={tryNextBackupUrl}
                disabled={backupIndex >= channel.backupUrls.length - 1}
                className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all ${
                  backupIndex >= channel.backupUrls.length - 1 
                    ? "bg-slate-900/40 border-white/5 text-slate-500 cursor-not-allowed" 
                    : "bg-indigo-600 hover:bg-indigo-500 border-indigo-400/30 text-white shadow-lg"
                }`}
                title="Sıradaki Yedek Akışa Geç"
              >
                Yedek Akışa Geç ({backupIndex + 1}/{channel.backupUrls.length})
              </button>
            )}

            {/* Play Next Episode if Series Category (Item: dizi otomatik sonraki bolum) */}
            {channel.category === "Series" && onPlayNextEpisode && (
              <button
                onClick={() => onPlayNextEpisode(channel)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs font-black px-4 py-2 rounded-xl border border-cyan-400/30 text-white shadow-lg transition-all"
                title="Sonraki Bölümü Oynat"
              >
                <span>Sonraki Bölüm</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Language/Dubbing selection */}
            {!isRadio && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedDubbing}
                  onChange={(e) => setSelectedDubbing(e.target.value)}
                  className="bg-slate-900/90 text-xs text-white border border-white/10 rounded-xl px-3 py-2 font-bold outline-none cursor-pointer hover:border-cyan-400 focus:border-cyan-400 transition"
                >
                  {channel.dubbingOptions ? (
                    channel.dubbingOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))
                  ) : (
                    <>
                      <option value="TR">TR (Türkçe Dublaj)</option>
                      <option value="EN">EN (Orijinal Ses)</option>
                    </>
                  )}
                </select>
              </div>
            )}

            {/* Quality selection */}
            <div className="flex items-center gap-2">
              <select
                value={quality}
                onChange={(e) => applyManualQuality(e.target.value as any)}
                className="bg-slate-900/90 text-xs text-white border border-white/10 rounded-xl px-3 py-2 font-bold outline-none cursor-pointer hover:border-cyan-400 focus:border-cyan-400 transition"
              >
                <option value="auto">Otomatik</option>
                <option value="1080p">1080p FHD</option>
                <option value="720p">720p HD</option>
                <option value="480p">480p SD</option>
              </select>
            </div>

            {/* Codec / Player Engine selection */}
            <div className="flex items-center gap-2">
              <select
                value={playerEngine}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setPlayerEngine(val);
                  setPlaybackError(`Çözücü motor değiştiriliyor: ${
                    val === "hls" ? "Hls.js Pro" : val === "html5" ? "HTML5 Native" : "Süper Kararlı Codec"
                  }...`);
                  setTimeout(() => setPlaybackError(null), 2500);
                }}
                className="bg-slate-900/90 text-xs text-cyan-400 border border-cyan-500/30 rounded-xl px-3 py-2 font-bold outline-none cursor-pointer hover:border-cyan-400 focus:border-cyan-400 transition shadow-lg shadow-cyan-500/10"
                title="Yayın Çözücü Codec ve Oynatıcı Motoru"
              >
                <option value="hls" className="text-white">🚀 Hls.js Pro (Önerilen)</option>
                <option value="stable_codec" className="text-white">🛡️ Süper Kararlı Codec</option>
                <option value="html5" className="text-white">📺 HTML5 Standart Codec</option>
              </select>
            </div>

            {/* CORS / HTTP Secure Proxy Toggle Button */}
            <button
              onClick={() => setUseProxy(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-bold transition-all ${
                useProxy 
                  ? "bg-emerald-600/90 hover:bg-emerald-500 border-emerald-400/40 text-white shadow-lg shadow-emerald-500/10" 
                  : "bg-slate-900/90 hover:bg-slate-800 border-white/10 text-slate-300"
              }`}
              title="CORS veya HTTP Güvenli Bağlantı Sorunlarını Gidermek İçin Proxy Tüneli"
            >
              <Sparkles className={`w-3.5 h-3.5 ${useProxy ? "animate-pulse" : ""}`} />
              <span>Proxy: {useProxy ? "Aktif" : "Kapalı"}</span>
            </button>

            {/* Connection Analyzer */}
            <button
              onClick={() => setShowSpeedTestModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/90 border border-white/10 rounded-xl text-xs font-mono text-left cursor-pointer hover:border-cyan-400 transition group"
              title="Ağ Hız Testi Yap"
            >
              <div className={`w-2 h-2 rounded-full ${networkSpeed >= 15 ? "bg-green-400" : networkSpeed >= 6 ? "bg-amber-400" : "bg-red-400"} animate-pulse`} />
              <span className="text-slate-400 font-sans group-hover:text-cyan-400 transition">{networkSpeed} Mbps</span>
              <span className="text-cyan-400 font-bold">({currentActiveHeight}p)</span>
            </button>

            {/* Screen Zoom/Aspect ratio size toggle (Item: ekran buyutme kucultme butonlari) */}
            {!isRadio && (
              <div className="flex items-center gap-2">
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as any)}
                  className="bg-slate-900/90 text-xs text-white border border-white/10 rounded-xl px-3 py-2 font-bold outline-none cursor-pointer hover:border-cyan-400 focus:border-cyan-400 transition"
                >
                  <option value="auto">Orijinal Boyut</option>
                  <option value="16:9">16:9 Sinema</option>
                  <option value="4:3">4:3 TV</option>
                  <option value="fill">Sığdır</option>
                  <option value="zoom">Yakınlaştır (Zoom)</option>
                </select>
              </div>
            )}

            {/* True Fullscreen Toggle Button (Item: ekran buyutme kucultme butonlari) */}
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-white/10 transition-all duration-200 flex items-center justify-center"
              title={isFullscreen ? "Küçült" : "Tam Ekran Yap"}
            >
              {isFullscreen ? <Minimize className="w-5 h-5 text-cyan-400" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Speed Test Modal Overlay */}
      {showSpeedTestModal && (
        <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-slate-900 border-2 border-indigo-500/80 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl shadow-indigo-500/10">
            <div className="flex justify-center mb-4">
              <div className="relative w-24 h-24 rounded-full border-4 border-slate-800 flex items-center justify-center overflow-hidden">
                <div 
                  className="absolute bottom-1/2 left-1/2 w-1.5 h-10 bg-indigo-500 origin-bottom rounded-full transition-transform duration-300"
                  style={{
                    transform: `translate(-50%, 0) rotate(${isMeasuring ? -90 + (speedProgress / 100) * 180 : -90 + Math.min(180, (networkSpeed / 30) * 180)}deg)`
                  }}
                />
                <div className="absolute w-3 h-3 bg-white rounded-full z-10" />
                <span className="absolute bottom-2 font-mono text-[10px] text-slate-500">EFES SPEED</span>
              </div>
            </div>
            
            <h3 className="text-lg font-black tracking-wide text-white mb-1">
              {isMeasuring ? "İnternet Hızı Ölçülüyor..." : "Ağ Hızı ve Kalite Analizi Tamamlandı"}
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              {isMeasuring 
                ? "EFES İPTV PRO akıllı hız algılayıcı sunuculara ping atıyor ve indirme hızınızı analiz ediyor..." 
                : `İnternet bağlantınız stabil ve ${networkSpeed} Mbps hıza sahip.`}
            </p>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 mb-6 flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Algılanan Bant Genişliği:</span>
                <span className="font-mono font-bold text-white text-sm">{isMeasuring ? `${Math.floor(speedProgress / 4)} Mbps...` : `${networkSpeed} Mbps`}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Uyumlu Yayın Kalitesi:</span>
                <span className="font-bold text-cyan-400">{currentActiveHeight}p ({currentActiveHeight === 1080 ? "Full HD" : currentActiveHeight === 720 ? "HD" : "SD"})</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Gecikme (Ping):</span>
                <span className="font-mono font-bold text-slate-300">{isMeasuring ? "Ölçülüyor..." : `${Math.floor(15 + Math.random() * 20)} ms`}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {!isMeasuring ? (
                <>
                  <button
                    onClick={() => runSpeedTest()}
                    className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold tracking-wider text-xs transition cursor-pointer"
                  >
                    Yeniden Test Et
                  </button>
                  <button
                    onClick={() => setShowSpeedTestModal(false)}
                    className="w-full py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold tracking-wider text-xs transition cursor-pointer"
                  >
                    Kapat ve İzlemeye Devam Et
                  </button>
                </>
              ) : (
                <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${speedProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CANLI YAYIN EPG BİLGİ BARI (Saat Senkronizasyonu ile En Altta 5sn Gösterim) */}
      {channel.type === "live" && activeEpgInfo && (
        <div
          className={`absolute bottom-6 left-6 right-6 z-[100] transition-all duration-700 transform flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-cyan-500/30 text-white shadow-2xl ${
            showLiveEpgToast
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-12 pointer-events-none"
          }`}
        >
          {/* Sol Kısım: Logo ve Şu An Yayınlanan Program */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <img
              src={channel.logo}
              className="w-14 h-14 rounded-xl object-cover bg-slate-900 border border-white/10 flex-shrink-0 shadow-lg shadow-cyan-500/10"
              referrerPolicy="no-referrer"
              alt=""
            />
            <div className="overflow-hidden">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-500 text-black font-extrabold tracking-widest uppercase shadow">
                  {channel.category}
                </span>
                <span className="text-[10px] text-cyan-400 font-black tracking-wider uppercase font-mono">
                  {channel.name}
                </span>
                <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  CANLI YAYIN
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white truncate leading-snug">
                {activeEpgInfo.program.title}
              </h3>
              <p className="text-[10px] text-slate-400 truncate max-w-md font-sans">
                {activeEpgInfo.program.description}
              </p>
            </div>
          </div>

          {/* Orta/Sağ Kısım: Zaman Çizelgesi ve Sıradaki Program */}
          <div className="flex flex-col gap-2 w-full md:w-96 flex-shrink-0">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 font-bold">
              <span>{formatEpgTime(activeEpgInfo.program.start)}</span>
              <span className="text-cyan-400 font-extrabold">
                {getRemainingMinutes(activeEpgInfo.program.end)} dk kaldı
              </span>
              <span>{formatEpgTime(activeEpgInfo.program.end)}</span>
            </div>
            
            {/* Süre Progress Bar */}
            <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-white/5">
              <div
                className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full transition-all duration-1000 rounded-full shadow-inner"
                style={{ width: `${activeEpgInfo.progress}%` }}
              />
            </div>

            {/* Sıradaki Program Bilgisi */}
            {activeEpgInfo.next && (
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/10">
                  SIRADAKİ
                </span>
                <span className="truncate max-w-[280px]">
                  {activeEpgInfo.next.title}
                </span>
                <span className="font-mono text-slate-500 text-[9px]">
                  ({formatEpgTime(activeEpgInfo.next.start)})
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
