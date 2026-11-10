import React from 'react';
import { ViewMode, KidProfile, SafetyAlert, UserAccountProfile } from '../types';
import { Shield, Smartphone, UserCheck, AlertTriangle, Sparkles, Lock, Pause, Play, Bell, Camera, Download, PlusSquare, KeyRound, User } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderNavbarProps {
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
  kids: KidProfile[];
  alerts: SafetyAlert[];
  userProfile?: UserAccountProfile | null;
  onOpenOnboarding?: () => void;
  onOpenAiDigest: () => void;
  onOpenAiCoach: () => void;
  onOpenLiveCamera?: () => void;
  onOpenApkDownload?: () => void;
  onToggleAllLock: () => void;
  onToggleAllInternet: () => void;
  allLocked: boolean;
  allPaused: boolean;
  activeSosAlert?: SafetyAlert | null;
  onDismissSos?: () => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  viewMode,
  onSetViewMode,
  kids,
  alerts,
  userProfile,
  onOpenOnboarding,
  onOpenAiDigest,
  onOpenAiCoach,
  onOpenLiveCamera,
  onOpenApkDownload,
  onToggleAllLock,
  onToggleAllInternet,
  allLocked,
  allPaused,
  activeSosAlert,
  onDismissSos,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const unreadAlertsCount = alerts.filter((a) => !a.read).length;

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      {/* Active SOS Urgent Banner if triggered */}
      {activeSosAlert && (
        <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between text-sm font-semibold animate-bounce shadow-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-300 animate-spin" />
            <span>
              EMERGENCY SOS ALERT: {activeSosAlert.kidName} triggered SOS at {activeSosAlert.timestamp}!
            </span>
          </div>
          <button
            onClick={onDismissSos}
            className="bg-red-800 hover:bg-red-900 px-3 py-1 rounded text-xs text-white border border-red-400"
          >
            Acknowledge & Dismiss
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-400/40">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white italic">
                GUARDIAN<span className="text-indigo-400">PATH</span>
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Parental Controls & Real-Time Safety</p>
          </div>
        </div>

        {/* View Mode Switcher (Parent Dashboard vs Child Companion Device View) */}
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700/80 shadow-inner">
          <button
            onClick={() => onSetViewMode('parent')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'parent'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Parent Dashboard</span>
          </button>
          <button
            onClick={() => onSetViewMode('child')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'child'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Child Device View</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>
        </div>

        {/* Quick Actions & AI Tools */}
        <div className="flex items-center space-x-2">
          {/* 1-Tap Native Install Button */}
          {!isInstalled && (
            <button
              onClick={() => {
                if (isInstallable) {
                  install();
                } else if (onOpenApkDownload) {
                  onOpenApkDownload();
                }
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 hover:from-indigo-500 to-emerald-600 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all active:scale-95 cursor-pointer"
              title="Install Native Android WebAPK (Fixes Parse Error)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          {/* APK Download Center Button */}
          {onOpenApkDownload && (
            <button
              onClick={onOpenApkDownload}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600/20 to-indigo-600/20 hover:from-emerald-600/30 hover:to-indigo-600/30 text-emerald-300 text-xs font-semibold border border-emerald-500/40 transition-all hover:border-emerald-400 shadow-sm"
              title="Download Android APK (Child Companion & Parent Console)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Download APK</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded font-mono">v2.4</span>
            </button>
          )}

          {/* Live Camera Button */}
          {onOpenLiveCamera && (
            <button
              onClick={onOpenLiveCamera}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-semibold border border-purple-500/30 transition-all hover:border-purple-400"
            >
              <Camera className="w-3.5 h-3.5 text-purple-400" />
              <span>Live Camera</span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
            </button>
          )}

          {/* AI Safety Digest */}
          <button
            onClick={onOpenAiDigest}
            className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all hover:border-blue-500/50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Safety Digest</span>
          </button>

          {/* AI Screen Time Coach */}
          <button
            onClick={onOpenAiCoach}
            className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all hover:border-indigo-500/50"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Time Coach</span>
          </button>

          {/* Quick Instant Lock / Internet Toggle */}
          <button
            onClick={onToggleAllInternet}
            className={`p-2 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1 ${
              allPaused
                ? 'bg-amber-600/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title={allPaused ? 'Resume Internet for all kids' : 'Pause Internet for all kids'}
          >
            {allPaused ? <Play className="w-4 h-4 text-amber-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
            <span className="hidden sm:inline">{allPaused ? 'Internet Paused' : 'Pause Web'}</span>
          </button>

          <button
            onClick={onToggleAllLock}
            className={`p-2 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1 ${
              allLocked
                ? 'bg-red-600/20 text-red-300 border-red-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title={allLocked ? 'Unlock all kid devices' : 'Lock all kid devices immediately'}
          >
            <Lock className={`w-4 h-4 ${allLocked ? 'text-red-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">{allLocked ? 'Devices Locked' : 'Lock All'}</span>
          </button>

          {/* Account & Device Setup / Access Grant Modal Button */}
          {onOpenOnboarding && (
            <button
              onClick={onOpenOnboarding}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
              title="Account, Device Role & System Permissions (Access Grant)"
            >
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">
                {userProfile?.name ? userProfile.name.split(' ')[0] : 'Device Setup'}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                {userProfile?.deviceRole === 'child' ? 'Child' : 'Family'}
              </span>
            </button>
          )}

          {/* Notification bell badge */}
          <div className="relative">
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
              <Bell className="w-4 h-4" />
            </div>
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {unreadAlertsCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
