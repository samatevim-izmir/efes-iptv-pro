import React, { useEffect, useState } from "react";
import { IPTVLanguage, TRANSLATIONS } from "../types";
// @ts-ignore
import clockTowerImg from "../assets/images/izmir_clock_tower_live_1783144132677.jpg";

interface SplashLoaderProps {
  onLoaded: () => void;
  lang: IPTVLanguage;
}

export default function SplashLoader({ onLoaded, lang }: SplashLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [clockTime, setClockTime] = useState("");

  const t = TRANSLATIONS[lang];

  // Update clock on the tower in real-time
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      setClockTime(`${hours}:${minutes}:${seconds}`);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate premium booting stages and security integration verification
  useEffect(() => {
    const steps = [
      { prg: 10, text: t.splashWelcome },
      { prg: 25, text: t.splashSecurity },
      { prg: 45, text: "Lisans Doğrulaması Başarılı. [OK]" },
      { prg: 65, text: "Ulusal Kanallar ve EPG Otomatik Güncelleniyor..." },
      { prg: 85, text: "Android TV ve Mobil Arayüz Optimizasyonu Hazırlanıyor..." },
      { prg: 100, text: "Güvenli Koruma Kalkanı Devreye Alındı. Başlatılıyor!" }
    ];

    let currentStepIdx = 0;
    const interval = setInterval(() => {
      if (currentStepIdx < steps.length) {
        setProgress(steps[currentStepIdx].prg);
        setStatusText(steps[currentStepIdx].text);
        currentStepIdx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          onLoaded();
        }, 200);
      }
    }, 180);

    return () => clearInterval(interval);
  }, [lang, onLoaded, t]);

  return (
    <div id="splash-screen" className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-white overflow-hidden p-6 select-none">
      
      {/* Header Info */}
      <div className="w-full flex justify-between items-center text-xs opacity-60 font-mono tracking-widest max-w-5xl">
        <div>SECURITY ID: SECURE-IPTV-2026</div>
        <div>CLOCK: {clockTime}</div>
      </div>

      {/* Main 3D / Animated Sea, Tower, and Seagull Visual Area */}
      <div className="relative w-full max-w-3xl h-[36vh] scale-80 flex items-center justify-center overflow-hidden rounded-2xl bg-slate-950 border border-cyan-400/20 shadow-2xl shadow-cyan-500/5">
        
        {/* Photorealistic Izmir Clock Tower & Sea Video Background with Zoom Motion */}
        <img 
          src={clockTowerImg} 
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none z-0 opacity-80 animate-ken-burns scale-110"
          alt="Izmir Live Feed"
          referrerPolicy="no-referrer"
        />

        {/* Live Broadcast / Camera Overlay elements */}
        <div className="absolute inset-0 z-40 pointer-events-none p-4 flex flex-col justify-between font-mono text-[10px] text-cyan-400">
          {/* Top Row: CAM indicator & REC blinking badge */}
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-1.5 bg-slate-950/85 px-2.5 py-1 rounded-md border border-cyan-500/30">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
              </span>
              <span>IZMIR_KORDON_LIVE_CAM_01</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950/85 px-2.5 py-1 rounded-md border border-red-500/30 text-red-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="font-black tracking-wider">CANLI (REC)</span>
            </div>
          </div>

          {/* Viewfinder Corner Brackets */}
          <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-cyan-400/60"></div>
          <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-cyan-400/60"></div>
          <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-cyan-400/60"></div>
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-cyan-400/60"></div>

          {/* Center Crosshair Viewfinder */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-40">
            <div className="w-6 h-[1px] bg-cyan-400"></div>
            <div className="h-6 w-[1px] bg-cyan-400 absolute"></div>
            <div className="w-2 h-2 rounded-full border border-cyan-400 absolute"></div>
          </div>

          {/* Digital Telemetry Display */}
          <div className="absolute left-6 top-16 flex flex-col gap-1 text-[9px] text-slate-300 bg-slate-950/70 p-2 rounded border border-white/5">
            <div>SENS: TR_EGE_75</div>
            <div>ELEV: 2.40m</div>
            <div>LAT: 38.4189° N</div>
            <div>LON: 27.1287° E</div>
          </div>

          {/* Bottom Row: Resolution & Quality Indicator */}
          <div className="flex justify-between items-center w-full mt-auto">
            <div className="bg-slate-950/85 px-2.5 py-1 rounded-md border border-cyan-500/30 text-slate-300">
              <span>FPS: 60.00 | H265_AUTO_CODEC</span>
            </div>
            <div className="bg-slate-950/85 px-2.5 py-1 rounded-md border border-cyan-500/30 text-slate-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>1080p ULTRA HD</span>
            </div>
          </div>
        </div>

        {/* Scanlines & Video Screen Filter Glass Effect */}
        <div className="absolute inset-0 z-35 pointer-events-none opacity-[0.08] bg-gradient-to-b from-cyan-400/0 via-cyan-400/10 to-cyan-400/0 bg-[length:100%_4px] animate-scanline"></div>

        {/* 1. EXTRA FLYING SEAGULLS (Real-time animated overlay on top of background image) */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* Seagull 1 */}
          <div className="absolute animate-seagull-glide-1 left-[-50px] top-[15%]">
            <svg width="24" height="12" viewBox="0 0 24 12" fill="none" className="stroke-white/80 stroke-2 animate-seagull-flap">
              <path d="M2 10C6 4 10 4 12 8C14 4 18 4 22 10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {/* Seagull 2 */}
          <div className="absolute animate-seagull-glide-2 left-[-60px] top-[28%]">
            <svg width="18" height="9" viewBox="0 0 24 12" fill="none" className="stroke-white/60 stroke-2 animate-seagull-flap-slow">
              <path d="M2 10C6 4 10 4 12 8C14 4 18 4 22 10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {/* Seagull 3 */}
          <div className="absolute animate-seagull-glide-3 left-[-40px] top-[8%]">
            <svg width="20" height="10" viewBox="0 0 24 12" fill="none" className="stroke-white/70 stroke-2 animate-seagull-flap">
              <path d="M2 10C6 4 10 4 12 8C14 4 18 4 22 10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

      </div>

      {/* Loading Progress & Status Information */}
      <div className="w-full max-w-xl flex flex-col items-center px-4 mb-8">
        <h1 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-cyan-400 mb-2 font-sans animate-pulse">
          {t.appName}
        </h1>
        <p className="text-xs font-mono text-cyan-400 mb-6 h-6 text-center tracking-wide">
          {statusText}
        </p>

        {/* Dynamic Glowing Loading Bar */}
        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-indigo-500/20 p-[2px]">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-full shadow-lg shadow-cyan-500/50 transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Progress percent */}
        <div className="mt-2 text-[10px] font-mono text-slate-400 tracking-wider">
          YÜKLENİYOR %{progress}
        </div>
      </div>

      {/* Footer License Status */}
      <div className="w-full flex flex-col items-center gap-1 text-[9px] font-mono text-slate-500 text-center max-w-xl">
        <div className="flex items-center gap-1.5 text-cyan-400/60">
          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.4 0 2.5 1.1 2.5 2.5S13.4 12 12 12s-2.5-1.1-2.5-2.5S10.6 7 12 7zm0 11c-2.7 0-5-1.5-6-3.8.1-2 4-3.2 6-3.2s5.9 1.1 6 3.2c-1 2.3-3.3 3.8-6 3.8z"/>
          </svg>
          MILITARY OBATED COPIER-PROTECTED WEB ENVIRONMENT
        </div>
        <div>LICENSED TO: {lang} GLOBAL CLIENT</div>
      </div>

      {/* Additional custom animations styles for splash screen parallax */}
      <style>{`
        @keyframes kenBurns {
          0% { transform: scale(1.08) translate(0, 0); }
          50% { transform: scale(1.18) translate(-1.5%, -1%); }
          100% { transform: scale(1.08) translate(0, 0); }
        }
        .animate-ken-burns {
          animation: kenBurns 28s infinite ease-in-out;
        }

        @keyframes seagull-glide-1 {
          0% { transform: translate(-100px, 0px) scaleX(1); }
          50% { transform: translate(500px, -20px) scaleX(1); }
          51% { transform: translate(500px, -20px) scaleX(-1); }
          100% { transform: translate(-100px, 0px) scaleX(-1); }
        }
        @keyframes seagull-glide-2 {
          0% { transform: translate(900px, 10px) scaleX(-1); }
          50% { transform: translate(100px, -10px) scaleX(-1); }
          51% { transform: translate(100px, -10px) scaleX(1); }
          100% { transform: translate(900px, 10px) scaleX(1); }
        }
        @keyframes seagull-glide-3 {
          0% { transform: translate(-50px, -30px) scaleX(1); }
          100% { transform: translate(1000px, 20px) scaleX(1); }
        }
        @keyframes seagull-flap {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(4deg); }
        }
        @keyframes seagull-flap-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-3px) rotate(-4deg); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scanline {
          animation: scanline 6s infinite linear;
        }

        .animate-seagull-glide-1 {
          animation: seagull-glide-1 16s infinite linear;
        }
        .animate-seagull-glide-2 {
          animation: seagull-glide-2 22s infinite linear;
        }
        .animate-seagull-glide-3 {
          animation: seagull-glide-3 12s infinite linear;
        }
        .animate-seagull-flap {
          animation: seagull-flap 0.6s infinite ease-in-out;
        }
        .animate-seagull-flap-slow {
          animation: seagull-flap-slow 1s infinite ease-in-out;
        }
      `}</style>

    </div>
  );
}
