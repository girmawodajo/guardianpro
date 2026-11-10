import React, { useState } from 'react';
import { Download, Smartphone, X, Check, ShieldCheck, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallBannerProps {
  onOpenApkModal?: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ onOpenApkModal }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('kg_pwa_banner_dismissed') === 'true';
  });
  const [installing, setInstalling] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);

  // If already installed as native standalone app or user dismissed for this session, hide banner
  if (isInstalled || dismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    setInstalling(true);
    const result = await install();
    setInstalling(false);
    if (result === 'unsupported') {
      setShowHowTo(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('kg_pwa_banner_dismissed', 'true');
  };

  return (
    <div className="relative bg-gradient-to-r from-indigo-950 via-slate-900 to-emerald-950 border-b border-indigo-500/40 text-slate-100 px-4 py-3 shadow-lg z-40 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Headline & Context */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/50 flex items-center justify-center shrink-0 shadow-inner">
            <Smartphone className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white tracking-wide">
                Direct Android Install (WebAPK)
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Fixes Package &amp; Parsing Errors
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Install KidsGuardian natively on Android with 1-tap — runs full screen with 0 invalid package or parse errors!
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <button
            onClick={handleInstallClick}
            disabled={installing}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 hover:from-emerald-500 to-indigo-600 text-white font-semibold text-xs shadow-md shadow-emerald-600/30 flex items-center space-x-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{installing ? 'Opening Prompt...' : '1-Tap Install App'}</span>
          </button>

          <button
            onClick={() => setShowHowTo(!showHowTo)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
          >
            {showHowTo ? 'Hide Guide' : 'How it Works'}
          </button>

          {onOpenApkModal && (
            <button
              onClick={onOpenApkModal}
              className="px-3 py-1.5 rounded-xl bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-300 text-xs font-medium border border-indigo-700/50 transition hidden sm:inline-block"
            >
              APK Download Center
            </button>
          )}

          <button
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded How It Works Guide */}
      {showHowTo && (
        <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs animate-fadeIn">
          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1">
            <div className="font-semibold text-emerald-400 flex items-center space-x-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold">1</span>
              <span>Why Android had &quot;parsing problem&quot;</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              When sideloading a raw file without Google Play Services compilation, Android OS PackageParser can fail on XML schema or target SDK signatures.
            </p>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1">
            <div className="font-semibold text-indigo-400 flex items-center space-x-1.5">
              <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px] font-bold">2</span>
              <span>Native 1-Tap Solution (WebAPK)</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Tap <strong>&quot;1-Tap Install App&quot;</strong> or tap Chrome menu (⋮) &rarr; <strong>&quot;Install app&quot;</strong>. Google Play Services mints a certified native Android app with zero sideload hurdles!
            </p>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1">
            <div className="font-semibold text-amber-400 flex items-center space-x-1.5">
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] font-bold">3</span>
              <span>Compiled Binary AXML APK</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              If you still prefer direct sideloading, our APK generator now packages authentic <code>0x00080003</code> Binary XML in the APK Download Center.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
