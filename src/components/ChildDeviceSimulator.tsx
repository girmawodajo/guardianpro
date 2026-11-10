import React, { useState } from 'react';
import { KidProfile, ScreenTimeRequest, BlockedSiteRequest, ChildFileItem } from '../types';
import {
  Smartphone,
  ShieldAlert,
  Lock,
  Wifi,
  Battery,
  Clock,
  Globe,
  Send,
  AlertOctagon,
  Sparkles,
  Gamepad2,
  Tv,
  Languages,
  BookOpen,
  Share2,
  FolderOpen,
  Box,
  Camera,
  Music,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowLeft,
  Search,
  EyeOff,
  Eye,
  Settings,
  Cpu,
  HardDrive,
  ShieldCheck,
  Activity,
  Zap,
  Download,
} from 'lucide-react';

interface ChildDeviceSimulatorProps {
  kids: KidProfile[];
  selectedKidId: string;
  onSelectKid: (id: string) => void;
  onRequestExtraTime: (request: Omit<ScreenTimeRequest, 'id' | 'timestamp' | 'status'>) => void;
  onRequestBlockedSite: (request: Omit<BlockedSiteRequest, 'id' | 'timestamp' | 'status'>) => void;
  onTriggerSos: (kidId: string, kidName: string) => void;
  pendingRequests: ScreenTimeRequest[];
  pendingSiteRequests: BlockedSiteRequest[];
  onToggleStealthMode?: (kidId: string, enabled: boolean) => void;
  onOpenLiveCamera?: () => void;
  onOpenApkDownload?: () => void;
  files?: ChildFileItem[];
}

export const ChildDeviceSimulator: React.FC<ChildDeviceSimulatorProps> = ({
  kids,
  selectedKidId,
  onSelectKid,
  onRequestExtraTime,
  onRequestBlockedSite,
  onTriggerSos,
  pendingRequests,
  pendingSiteRequests,
  onToggleStealthMode,
  onOpenLiveCamera,
  onOpenApkDownload,
  files = [],
}) => {
  const kid = kids.find((k) => k.id === selectedKidId) || kids[0];

  const [activeTab, setActiveTab] = useState<'home' | 'browser' | 'requests' | 'system_diag' | 'social_shield' | 'files_explorer'>('home');
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [browserUrl, setBrowserUrl] = useState('https://khanacademy.org');
  const [activeWebPage, setActiveWebPage] = useState<string | null>('https://khanacademy.org');
  const [extraTimeReason, setExtraTimeReason] = useState('');
  const [requestedMinutes, setRequestedMinutes] = useState(30);
  const [sosSending, setSosSending] = useState(false);
  const [sosSuccess, setSosSuccess] = useState(false);
  const [showStealthDiagView, setShowStealthDiagView] = useState(false);

  const isStealthActive = kid.isStealthModeEnabled ?? true;
  const stealthTitle = kid.stealthAppName || 'Device Helper';

  // App icon mapping
  const getAppIcon = (iconName: string) => {
    switch (iconName) {
      case 'Gamepad2':
        return <Gamepad2 className="w-6 h-6 text-amber-400" />;
      case 'Tv':
        return <Tv className="w-6 h-6 text-red-400" />;
      case 'Languages':
        return <Languages className="w-6 h-6 text-emerald-400" />;
      case 'BookOpen':
        return <BookOpen className="w-6 h-6 text-blue-400" />;
      case 'Share2':
        return <Share2 className="w-6 h-6 text-pink-400" />;
      case 'Box':
        return <Box className="w-6 h-6 text-emerald-500" />;
      case 'Camera':
        return <Camera className="w-6 h-6 text-purple-400" />;
      case 'Music':
        return <Music className="w-6 h-6 text-green-400" />;
      default:
        return <Sparkles className="w-6 h-6 text-indigo-400" />;
    }
  };

  // Check if browser URL is blocked by content filters
  const isUrlBlocked = (urlToCheck: string) => {
    const domain = urlToCheck.replace(/https?:\/\//, '').split('/')[0].toLowerCase();
    if (kid.contentFilters.customBlockedWebsites.some((b) => domain.includes(b.toLowerCase()))) {
      return true;
    }
    if (domain.includes('discord') || domain.includes('reddit') || domain.includes('omegle') || domain.includes('adult') || domain.includes('casino')) {
      return true;
    }
    return false;
  };

  const handleBrowserNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    let formatted = browserUrl.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = 'https://' + formatted;
    }
    setActiveWebPage(formatted);
  };

  const handleSendExtraTimeRequest = (e: React.FormEvent) => {
    e.preventDefault();
    onRequestExtraTime({
      kidId: kid.id as any,
      kidName: kid.name,
      requestMinutes: requestedMinutes,
      reason: extraTimeReason || 'Finished homework, asking for extra leisure time',
      appName: selectedApp ? selectedApp.name : 'General Device',
    });
    setExtraTimeReason('');
    setSelectedApp(null);
  };

  const handleSendSiteRequest = (url: string) => {
    onRequestBlockedSite({
      kidId: kid.id as any,
      kidName: kid.name,
      url: url,
      siteName: url.replace(/https?:\/\//, '').split('/')[0],
      category: 'Web Browsing',
    });
  };

  const handleSosHold = () => {
    setSosSending(true);
    setTimeout(() => {
      onTriggerSos(kid.id, kid.name);
      setSosSending(false);
      setSosSuccess(true);
      setTimeout(() => setSosSuccess(false), 5000);
    }, 1000);
  };

  const totalUsed = kid.screenTime.usedMinutes;
  const totalLimit = kid.screenTime.dailyLimitMinutes;
  const isTimeExceeded = totalUsed >= totalLimit;

  return (
    <div className="max-w-md mx-auto my-4">
      {/* Device Selector Switcher Bar */}
      <div className="mb-4 flex items-center justify-between bg-slate-800 p-2 rounded-xl border border-slate-700">
        <span className="text-xs text-slate-400 font-medium px-2">Previewing Device:</span>
        <div className="flex space-x-2">
          {kids.map((k) => (
            <button
              key={k.id}
              onClick={() => {
                onSelectKid(k.id);
                setSelectedApp(null);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                k.id === selectedKidId
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {k.name} ({k.deviceModel})
            </button>
          ))}
        </div>
      </div>

      {/* Real Device APK Download Callout */}
      {onOpenApkDownload && (
        <div className="mb-4 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-emerald-950/80 border border-emerald-500/40 p-3 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Install on Real Android Phone</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">APK v2.4</span>
              </div>
              <p className="text-[11px] text-slate-400">Scan QR or download APK to pair {kid.name}&apos;s real device</p>
            </div>
          </div>
          <button
            onClick={onOpenApkDownload}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20 shrink-0 cursor-pointer"
          >
            Get APK Link
          </button>
        </div>
      )}

      {/* Simulated Smartphone Container */}
      <div className="relative mx-auto w-full max-w-[360px] h-[720px] bg-slate-950 rounded-[44px] p-3 shadow-2xl border-[6px] border-slate-800 ring-1 ring-slate-700/50 flex flex-col overflow-hidden text-slate-100">
        {/* Dynamic Island / Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 w-28 h-5 bg-black rounded-full flex items-center justify-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-900"></div>
        </div>

        {/* Status Bar */}
        <div className="relative z-30 pt-1.5 px-6 flex items-center justify-between text-[11px] font-semibold text-slate-300">
          <span>9:41</span>
          <div className="flex items-center space-x-1.5">
            <Wifi className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-[10px]">{kid.batteryLevel}%</span>
            <Battery className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Kids Guardian Status Banner - Masked if Stealth Mode is Enabled */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between text-xs text-slate-300 mt-1">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            {isStealthActive ? (
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>{stealthTitle}</span>
              </span>
            ) : (
              <span className="font-semibold text-slate-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Protection Active</span>
              </span>
            )}
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">
              Access Granted
            </span>
          </div>
          <button
            onClick={() => {
              if (onToggleStealthMode) {
                onToggleStealthMode(kid.id, !isStealthActive);
              }
            }}
            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1"
            title="Toggle app stealth masking on child device"
          >
            {isStealthActive ? (
              <>
                <EyeOff className="w-3 h-3 text-amber-400" />
                <span className="text-amber-400 font-bold">Stealth ON</span>
              </>
            ) : (
              <>
                <Eye className="w-3 h-3 text-slate-400" />
                <span>Stealth OFF</span>
              </>
            )}
          </button>
        </div>

        {/* SCREEN STATE: 1. Full Locked Overlay */}
        {(kid.isDeviceLocked || kid.isInternetPaused) ? (
          <div className="flex-1 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-red-500/20 text-red-400 flex items-center justify-center mb-4 ring-1 ring-red-500/40 shadow-lg">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {kid.isDeviceLocked ? 'Device Locked by Parent' : 'Internet Connection Paused'}
            </h3>
            <p className="text-xs text-slate-400 mb-6 max-w-xs">
              {kid.isDeviceLocked
                ? 'Your parents have locked screen access for bedtime, study hour, or family time.'
                : 'Web access is currently paused on your device.'}
            </p>

            {/* Request Time Button */}
            <form onSubmit={handleSendExtraTimeRequest} className="w-full bg-slate-800 p-4 rounded-2xl border border-slate-700 text-left">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Send Request to Mom & Dad:</label>
              <input
                type="text"
                placeholder="Why do you need extra time? (e.g. math homework)"
                value={extraTimeReason}
                onChange={(e) => setExtraTimeReason(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mb-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-blue-600/30"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Request Unlock / Extra Time</span>
              </button>
            </form>

            {/* SOS Emergency button */}
            <div className="mt-6">
              <button
                onClick={handleSosHold}
                disabled={sosSending}
                className="bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/50 px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md"
              >
                <AlertOctagon className="w-4 h-4 text-red-400" />
                <span>{sosSending ? 'Sending SOS...' : 'Emergency SOS Button'}</span>
              </button>
            </div>
          </div>
        ) : selectedApp ? (
          /* APP LAUNCH SCREEN / BLOCKED APP STATE */
          <div className="flex-1 bg-slate-900 flex flex-col p-4 z-20">
            <button
              onClick={() => setSelectedApp(null)}
              className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>

            {selectedApp.status === 'blocked' ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <div className="w-14 h-14 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mb-3">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold text-white mb-1">{selectedApp.name} is Blocked</h4>
                <p className="text-xs text-slate-400 mb-6">This application is restricted by your parent safety settings.</p>

                <form onSubmit={handleSendExtraTimeRequest} className="w-full bg-slate-800 p-4 rounded-2xl border border-slate-700 text-left">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Ask Parent for App Access:</label>
                  <input
                    type="text"
                    placeholder="Reason for requesting app access..."
                    value={extraTimeReason}
                    onChange={(e) => setExtraTimeReason(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mb-3 outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Permission Request</span>
                  </button>
                </form>
              </div>
            ) : selectedApp.dailyLimitMinutes && selectedApp.usedMinutesToday >= selectedApp.dailyLimitMinutes ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                  <Clock className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold text-white mb-1">Daily Limit Reached</h4>
                <p className="text-xs text-slate-400 mb-6">
                  You have used all {selectedApp.dailyLimitMinutes} minutes allowed today for {selectedApp.name}.
                </p>

                <form onSubmit={handleSendExtraTimeRequest} className="w-full bg-slate-800 p-4 rounded-2xl border border-slate-700 text-left">
                  <label className="text-xs font-semibold text-slate-300 block mb-1 font-mono">Request +15m or +30m:</label>
                  <div className="flex space-x-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setRequestedMinutes(15)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${requestedMinutes === 15 ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'}`}
                    >
                      +15 mins
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestedMinutes(30)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${requestedMinutes === 30 ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'}`}
                    >
                      +30 mins
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Brief explanation..."
                    value={extraTimeReason}
                    onChange={(e) => setExtraTimeReason(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mb-3 outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Request to Parents</span>
                  </button>
                </form>
              </div>
            ) : (
              /* ACTIVE APP OPEN SIMULATION */
              <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
                      {getAppIcon(selectedApp.icon)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">{selectedApp.name}</h4>
                      <p className="text-xs text-emerald-400 font-medium">Active & Approved Session</p>
                    </div>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Category:</span>
                      <span className="font-semibold capitalize">{selectedApp.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Time Used Today:</span>
                      <span className="font-semibold text-amber-400">{selectedApp.usedMinutesToday} mins</span>
                    </div>
                  </div>
                </div>

                <div className="text-center p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-emerald-300">Safe Child Environment Active</p>
                  <p className="text-[10px] text-slate-400 mt-1">Screen time monitored automatically</p>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'browser' ? (
          /* BROWSER TAB SIMULATOR */
          <div className="flex-1 bg-slate-900 flex flex-col z-20">
            {/* Address Bar */}
            <form onSubmit={handleBrowserNavigate} className="p-2.5 bg-slate-950 border-b border-slate-800 flex items-center space-x-2">
              <Globe className="w-4 h-4 text-blue-400 shrink-0" />
              <input
                type="text"
                value={browserUrl}
                onChange={(e) => setBrowserUrl(e.target.value)}
                placeholder="Enter website URL..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button type="submit" className="bg-blue-600 text-white px-2.5 py-1.5 rounded-xl text-xs font-semibold">
                Go
              </button>
            </form>

            {/* Quick Web Shortcuts */}
            <div className="p-2 bg-slate-950/60 border-b border-slate-800/60 flex space-x-2 overflow-x-auto text-[10px]">
              <button
                onClick={() => {
                  setBrowserUrl('https://khanacademy.org');
                  setActiveWebPage('https://khanacademy.org');
                }}
                className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg text-emerald-400 border border-slate-700 shrink-0"
              >
                Khan Academy (Safe)
              </button>
              <button
                onClick={() => {
                  setBrowserUrl('https://scratch.mit.edu');
                  setActiveWebPage('https://scratch.mit.edu');
                }}
                className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg text-blue-400 border border-slate-700 shrink-0"
              >
                Scratch Coding (Safe)
              </button>
              <button
                onClick={() => {
                  setBrowserUrl('https://discord.com');
                  setActiveWebPage('https://discord.com');
                }}
                className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg text-red-400 border border-slate-700 shrink-0"
              >
                Discord (Blocked Test)
              </button>
            </div>

            {/* Render Simulated Web Content or Blocked Web Banner */}
            {activeWebPage && isUrlBlocked(activeWebPage) ? (
              <div className="flex-1 p-6 flex flex-col items-center justify-center text-center bg-slate-950">
                <div className="w-14 h-14 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mb-3">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-white mb-1">Website Blocked by KidsGuardian</h4>
                <p className="text-xs text-slate-400 mb-4 max-w-xs">
                  Access to <span className="text-red-300 font-mono">{activeWebPage}</span> is restricted by content safety filters.
                </p>

                <button
                  onClick={() => handleSendSiteRequest(activeWebPage)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Ask Mom & Dad to Allow Site</span>
                </button>
              </div>
            ) : (
              <div className="flex-1 p-4 bg-slate-950 flex flex-col items-center justify-center text-center">
                <Globe className="w-10 h-10 text-emerald-400 mb-2" />
                <h5 className="font-bold text-white text-sm">{activeWebPage}</h5>
                <p className="text-xs text-emerald-400 font-medium mt-1">Verified Safe Content Category</p>
                <div className="mt-4 p-3 bg-slate-900 border border-slate-800 rounded-xl text-left text-xs text-slate-400 w-full max-w-xs">
                  <span className="text-slate-300 font-semibold block mb-1">SafeSearch Protection Active</span>
                  Filtered for explicit keywords, malware domains, and mature content.
                </div>
              </div>
            )}
          </div>
        ) : (
          /* HOME SCREEN APP GRID */
          <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Daily Screen Time Progress Widget */}
              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 mb-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-300 font-semibold">Today's Screen Time</span>
                  <span className={`font-bold ${isTimeExceeded ? 'text-red-400' : 'text-blue-400'}`}>
                    {totalUsed}m / {totalLimit}m
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isTimeExceeded ? 'bg-red-500' : totalUsed > totalLimit * 0.8 ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, (totalUsed / totalLimit) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Installed Apps Grid */}
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Your Installed Apps</h4>
              <div className="grid grid-cols-3 gap-3">
                {kid.installedApps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className="flex flex-col items-center p-3 bg-slate-900 hover:bg-slate-800 rounded-2xl border border-slate-800/80 transition-all hover:scale-105 relative group"
                  >
                    <div className="p-2.5 bg-slate-800 rounded-xl mb-1.5 shadow-md">
                      {getAppIcon(app.icon)}
                    </div>
                    <span className="text-[11px] font-medium text-slate-200 text-center truncate w-full">{app.name}</span>
                    {app.status === 'blocked' && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500/80 rounded-full flex items-center justify-center text-[10px] text-white">
                        <Lock className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Camera Check-in Button */}
            {onOpenLiveCamera && (
              <div className="pt-2">
                <button
                  onClick={onOpenLiveCamera}
                  className="w-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 py-2 rounded-2xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
                >
                  <Camera className="w-4 h-4 text-purple-400" />
                  <span>Camera Check-in / Photo Verification</span>
                </button>
              </div>
            )}

            {/* Emergency SOS Panic Button */}
            <div className="pt-4 border-t border-slate-900">
              {sosSuccess ? (
                <div className="bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 p-2.5 rounded-xl text-xs font-semibold text-center flex items-center justify-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>SOS Alert Sent to Parent Dashboard!</span>
                </div>
              ) : (
                <button
                  onClick={handleSosHold}
                  disabled={sosSending}
                  className="w-full bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-red-600/30 transition-all active:scale-95"
                >
                  <AlertOctagon className="w-4 h-4 animate-bounce" />
                  <span>{sosSending ? 'Broadcasting Location...' : 'HOLD FOR EMERGENCY SOS'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* SCREEN STATE: 4. Disguised Stealth Utility Dashboard */}
        {activeTab === 'system_diag' && (
          <div className="flex-1 p-4 space-y-3 bg-slate-950 text-slate-200 overflow-y-auto z-10">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-700">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white">{stealthTitle}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Build v14.2.0 • System Service</p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                OPTIMIZED
              </span>
            </div>

            {/* Disguise Card 1: Storage Analysis */}
            <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                  <span>Internal Storage</span>
                </span>
                <span className="font-mono text-[11px] text-slate-400">64.2 GB / 128 GB (50%)</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-1/2 rounded-full"></div>
              </div>
              <p className="text-[10px] text-slate-400">System cache clean. No junk files detected.</p>
            </div>

            {/* Disguise Card 2: Memory & Battery */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span>RAM Usage</span>
                </div>
                <span className="text-sm font-bold text-white font-mono">2.8 GB / 4 GB</span>
                <span className="text-[9px] text-emerald-400 block font-medium">Normal Load</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
                  <Battery className="w-3.5 h-3.5 text-amber-400" />
                  <span>Battery Health</span>
                </div>
                <span className="text-sm font-bold text-white font-mono">{kid.batteryLevel}% (Good)</span>
                <span className="text-[9px] text-amber-400 block font-medium">Power Saver Ready</span>
              </div>
            </div>

            {/* Disguise Card 3: Background Services */}
            <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Background Protection Services</span>
              </span>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center text-slate-400 border-b border-slate-800/80 pb-1">
                  <span>Device Policy Enforcer</span>
                  <span className="text-emerald-400 font-mono text-[10px]">Active</span>
                </div>
                <div className="flex justify-between items-center text-slate-400 border-b border-slate-800/80 pb-1">
                  <span>Location Telemetry Protocol</span>
                  <span className="text-emerald-400 font-mono text-[10px]">Active</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Network Content Inspection</span>
                  <span className="text-emerald-400 font-mono text-[10px]">Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'social_shield' && (
          /* SOCIAL SHIELD VIEW */
          <div className="flex-1 bg-slate-950 p-4 space-y-3 overflow-y-auto z-20">
            <div className="flex items-center space-x-2 text-pink-400 border-b border-slate-800 pb-2">
              <Share2 className="w-4 h-4" />
              <h4 className="font-bold text-xs text-white">Social Media Safety Status</h4>
            </div>

            <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Active Protections</span>
                <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  3 Shields On
                </span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-400">
                <p className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Stranger Direct Message Shield (Active)</span>
                </p>
                <p className="flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Cyberbullying Comment Filter (Active)</span>
                </p>
                <p className="flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Force Private Profile Enforcement (Active)</span>
                </p>
              </div>
            </div>

            <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">Monitored Social Apps</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <span className="font-bold text-white block">TikTok</span>
                  <span className="text-slate-400 text-[10px]">30m limit • DM Blocked</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <span className="font-bold text-white block">Instagram</span>
                  <span className="text-slate-400 text-[10px]">45m limit • Filter On</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <span className="font-bold text-white block">Snapchat</span>
                  <span className="text-slate-400 text-[10px]">30m limit • Shield On</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <span className="font-bold text-white block">Discord</span>
                  <span className="text-slate-400 text-[10px]">60m limit • Safe Mode</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'files_explorer' && (
          /* CHILD FILE EXPLORER VIEW */
          <div className="flex-1 bg-slate-950 p-4 space-y-3 overflow-y-auto z-20">
            <div className="flex items-center space-x-2 text-amber-400 border-b border-slate-800 pb-2">
              <FolderOpen className="w-4 h-4" />
              <h4 className="font-bold text-xs text-white">Files & Downloads</h4>
            </div>

            <div className="space-y-2">
              {files.filter((f) => f.kidId === kid.id && f.status !== 'deleted').length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No local files stored.</p>
              ) : (
                files
                  .filter((f) => f.kidId === kid.id && f.status !== 'deleted')
                  .map((f) => (
                    <div
                      key={f.id}
                      className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                        f.status === 'quarantined'
                          ? 'bg-purple-950/20 border-purple-500/40 text-purple-200'
                          : f.isFlagged
                          ? 'bg-red-950/20 border-red-500/40 text-red-200'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold text-[11px]">
                        <span className="truncate max-w-[160px] text-white">{f.fileName}</span>
                        <span className="text-[10px] opacity-70">{f.fileSizeMb} MB</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="opacity-60">{f.category}</span>
                        {f.status === 'quarantined' ? (
                          <span className="text-purple-400 font-bold">Quarantined by Parent</span>
                        ) : f.parentPermission === 'blocked' ? (
                          <span className="text-red-400 font-bold">Access Blocked</span>
                        ) : (
                          <span className="text-emerald-400 font-bold">Available</span>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* Bottom Navigation Dock */}
        <div className="bg-slate-900/95 border-t border-slate-800 px-4 py-2 flex items-center justify-around z-30">
          <button
            onClick={() => {
              setActiveTab('home');
              setSelectedApp(null);
            }}
            className={`flex flex-col items-center space-y-0.5 text-[10px] font-medium ${
              activeTab === 'home' && !selectedApp ? 'text-blue-400' : 'text-slate-400'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Apps</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('browser');
              setSelectedApp(null);
            }}
            className={`flex flex-col items-center space-y-0.5 text-[10px] font-medium ${
              activeTab === 'browser' ? 'text-blue-400' : 'text-slate-400'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Web</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('files_explorer');
              setSelectedApp(null);
            }}
            className={`flex flex-col items-center space-y-0.5 text-[10px] font-medium ${
              activeTab === 'files_explorer' ? 'text-amber-400' : 'text-slate-400'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Files</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('social_shield');
              setSelectedApp(null);
            }}
            className={`flex flex-col items-center space-y-0.5 text-[10px] font-medium ${
              activeTab === 'social_shield' ? 'text-pink-400' : 'text-slate-400'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Social</span>
          </button>
          {isStealthActive && (
            <button
              onClick={() => {
                setActiveTab('system_diag');
                setSelectedApp(null);
              }}
              className={`flex flex-col items-center space-y-0.5 text-[10px] font-medium ${
                activeTab === 'system_diag' ? 'text-amber-400' : 'text-slate-400'
              }`}
              title="Disguised System Diagnostics screen seen if app is opened"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 font-semibold">Disguise</span>
            </button>
          )}
        </div>

        {/* Home Indicator Bar */}
        <div className="w-32 h-1 bg-slate-700 rounded-full mx-auto my-1"></div>
      </div>
    </div>
  );
};
