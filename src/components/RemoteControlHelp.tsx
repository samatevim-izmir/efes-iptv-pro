import React from "react";
import { IPTVLanguage, TRANSLATIONS } from "../types";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, CornerDownLeft, Eye, HelpCircle } from "lucide-react";

interface RemoteControlHelpProps {
  lang: IPTVLanguage;
  onClose: () => void;
}

export default function RemoteControlHelp({ lang, onClose }: RemoteControlHelpProps) {
  const t = TRANSLATIONS[lang];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-slate-900 border-2 border-indigo-500/40 p-6 md:p-8 rounded-2xl max-w-lg w-full text-white shadow-2xl relative">
        
        {/* Absolute Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition font-mono text-sm border border-white/10 px-2 py-1 rounded"
        >
          ESC / Kapat
        </button>

        <div className="flex items-center gap-3 mb-6">
          <HelpCircle className="w-8 h-8 text-cyan-400" />
          <h3 className="text-xl font-black tracking-wide">
            {t.remoteMode}
          </h3>
        </div>

        <p className="text-xs text-slate-300 mb-6 leading-relaxed">
          {t.remoteTip} Android TV kumandanızın yön tuşları veya bilgisayar klavyeniz ile tam uyumludur.
        </p>

        {/* Remote Keys Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-white/5">
            <div className="flex flex-col gap-1 items-center">
              <div className="flex gap-1">
                <div className="p-1 rounded bg-slate-800 border border-slate-600 text-xs text-center min-w-[24px]">▲</div>
              </div>
              <div className="flex gap-1">
                <div className="p-1 rounded bg-slate-800 border border-slate-600 text-xs text-center min-w-[24px]">◀</div>
                <div className="p-1 rounded bg-slate-800 border border-slate-600 text-xs text-center min-w-[24px]">▼</div>
                <div className="p-1 rounded bg-slate-800 border border-slate-600 text-xs text-center min-w-[24px]">▶</div>
              </div>
            </div>
            <div className="text-xs">
              <span className="font-bold text-cyan-400">Yön Tuşları</span>
              <p className="text-[10px] text-slate-400">Kanallar ve menüler arası gezinme</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-white/5">
            <div className="p-2.5 rounded bg-slate-800 border border-slate-600 flex items-center justify-center">
              <CornerDownLeft className="w-5 h-5 text-white" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-cyan-400">ENTER / OK</span>
              <p className="text-[10px] text-slate-400">Kanalı veya filmi oynatma</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-white/5 col-span-2">
            <div className="px-3 py-1.5 rounded bg-slate-800 border border-slate-600 font-mono text-xs text-white">
              ESC / BACKSPACE
            </div>
            <div className="text-xs">
              <span className="font-bold text-cyan-400">Geri Dönüş</span>
              <p className="text-[10px] text-slate-400">Oynatıcıyı kapatma, ana listeye geri dönme</p>
            </div>
          </div>
        </div>

        {/* Layout Visual Indicator */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 p-4 rounded-xl border border-indigo-500/20 text-center text-xs text-cyan-300">
          <div className="font-bold mb-1">Android TV 6+ Desteği</div>
          Eski televizyonlar ve kumandalı TV Box cihazlarında pürüzsüz çalışma garantisi.
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold tracking-wider transition"
        >
          Anladım, Kapat
        </button>

      </div>
    </div>
  );
}
