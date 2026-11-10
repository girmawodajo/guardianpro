import React, { useState } from 'react';
import {
  KidProfile,
  GeofenceZone,
  SafetyAlert,
  ScreenTimeRequest,
  BlockedSiteRequest,
  LocationPoint,
  DowntimeSchedule,
  RouteMovementRecord,
  CallLog,
  SmsMessage,
  SurroundAudioSession,
  SocialAccountConfig,
  SocialActivityItem,
  ChildFileItem,
} from '../types';
import { InteractiveMap } from './InteractiveMap';
import { RouteHistoryPanel } from './RouteHistoryPanel';
import { SurroundSoundAndCommsPanel } from './SurroundSoundAndCommsPanel';
import { SocialMediaPanel } from './SocialMediaPanel';
import { FileAccessPanel } from './FileAccessPanel';
import {
  Clock,
  ShieldCheck,
  MapPin,
  Sparkles,
  Lock,
  Unlock,
  Pause,
  Play,
  Gamepad2,
  Tv,
  Languages,
  BookOpen,
  Share2,
  FolderOpen,
  Box,
  Battery,
  AlertTriangle,
  Smartphone,
  Plus,
  Check,
  X,
  Search,
  Globe,
  Sliders,
  Bell,
  Navigation,
  CheckCircle2,
  ShieldAlert,
  Calendar,
  MessageSquare,
  Zap,
  EyeOff,
  Eye,
  Settings,
  History,
  Radio,
  Phone,
  Camera,
} from 'lucide-react';

interface ParentDashboardProps {
  kids: KidProfile[];
  selectedKidId: string;
  onSelectKid: (id: string) => void;
  geofences: GeofenceZone[];
  alerts: SafetyAlert[];
  pendingRequests: ScreenTimeRequest[];
  pendingSiteRequests: BlockedSiteRequest[];
  locationHistory: LocationPoint[];
  routeMovementRecords?: RouteMovementRecord[];
  callLogs?: CallLog[];
  smsMessages?: SmsMessage[];
  audioSessions?: SurroundAudioSession[];
  onToggleKidLock: (kidId: string) => void;
  onToggleKidInternet: (kidId: string) => void;
  onUpdateCategoryLimit: (kidId: string, category: string, newLimitMinutes: number) => void;
  onToggleContentFilter: (kidId: string, filterId: string) => void;
  onToggleAppStatus: (kidId: string, appId: string, newStatus: 'allowed' | 'time_limited' | 'blocked') => void;
  onApproveScreenTimeRequest: (requestId: string, approvedMinutes: number) => void;
  onDeclineScreenTimeRequest: (requestId: string) => void;
  onApproveSiteRequest: (requestId: string) => void;
  onDeclineSiteRequest: (requestId: string) => void;
  onAddCustomBlockedWebsite: (kidId: string, domain: string) => void;
  onRemoveCustomBlockedWebsite: (kidId: string, domain: string) => void;
  onAddGeofenceClick: () => void;
  onOpenAiScanner: () => void;
  onOpenAiCoach: () => void;
  onOpenAiDigest: () => void;
  onOpenLiveCamera?: () => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onUseRealLocation?: () => void;
  usingRealLocation?: boolean;
  onToggleStealthMode?: (kidId: string, enabled?: boolean, appName?: any) => void;
  onSimulateCall?: (kidId: string, contactName: string, phone: string, type: 'incoming' | 'outgoing' | 'blocked') => void;
  onSimulateSms?: (kidId: string, contactName: string, phone: string, text: string, riskCategory: any) => void;
  onStartSurroundAudio?: (kidId: string) => void;
  socialAccounts?: SocialAccountConfig[];
  socialActivities?: SocialActivityItem[];
  onUpdateSocialAccountStatus?: (accountId: string, newStatus: SocialAccountConfig['status']) => void;
  onUpdateSocialAccountLimit?: (accountId: string, newLimitMinutes: number) => void;
  onToggleSocialAccountShield?: (
    accountId: string,
    field: 'dmShieldEnabled' | 'safeModeEnforced' | 'nsfwShieldEnabled' | 'commentFilterEnabled'
  ) => void;
  onPauseAllSocial?: (kidId: string) => void;
  onTakeSocialParentAction?: (
    activityId: string,
    action: 'blocked_contact' | 'warned_kid' | 'removed_content' | 'dismissed'
  ) => void;
  onAddSimulatedSocialActivity?: (activity: Omit<SocialActivityItem, 'id'>) => void;
  files?: ChildFileItem[];
  onUpdateFileStatus?: (fileId: string, status: ChildFileItem['status']) => void;
  onUpdateFilePermission?: (fileId: string, permission: ChildFileItem['parentPermission']) => void;
  onDeleteFile?: (fileId: string) => void;
  onAddSimulatedFile?: (file: Omit<ChildFileItem, 'id'>) => void;
  onOpenApkDownload?: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  kids,
  selectedKidId,
  onSelectKid,
  geofences,
  alerts,
  pendingRequests,
  pendingSiteRequests,
  locationHistory,
  onToggleKidLock,
  onToggleKidInternet,
  onUpdateCategoryLimit,
  onToggleContentFilter,
  onToggleAppStatus,
  onApproveScreenTimeRequest,
  onDeclineScreenTimeRequest,
  onApproveSiteRequest,
  onDeclineSiteRequest,
  onAddCustomBlockedWebsite,
  onRemoveCustomBlockedWebsite,
  onAddGeofenceClick,
  onOpenAiScanner,
  onOpenAiCoach,
  onOpenAiDigest,
  onOpenLiveCamera,
  isSimulating,
  onToggleSimulation,
  onUseRealLocation,
  usingRealLocation,
  routeMovementRecords = [],
  onToggleStealthMode,
  callLogs = [],
  smsMessages = [],
  audioSessions = [],
  onSimulateCall = () => {},
  onSimulateSms = () => {},
  onStartSurroundAudio = () => {},
  socialAccounts = [],
  socialActivities = [],
  onUpdateSocialAccountStatus = () => {},
  onUpdateSocialAccountLimit = () => {},
  onToggleSocialAccountShield = () => {},
  onPauseAllSocial = () => {},
  onTakeSocialParentAction = () => {},
  onAddSimulatedSocialActivity = () => {},
  files = [],
  onUpdateFileStatus = () => {},
  onUpdateFilePermission = () => {},
  onDeleteFile = () => {},
  onAddSimulatedFile = () => {},
  onOpenApkDownload,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'screentime' | 'content' | 'location' | 'insights' | 'surround_comms' | 'social_media' | 'files'>('overview');

  const [customDomainInput, setCustomDomainInput] = useState('');
  const [flaggedTextInput, setFlaggedTextInput] = useState('');
  const [flaggedScanResult, setFlaggedScanResult] = useState<any | null>(null);
  const [flaggedScanLoading, setFlaggedScanLoading] = useState(false);

  const selectedKid = kids.find((k) => k.id === selectedKidId) || kids[0];

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDomainInput.trim()) return;
    onAddCustomBlockedWebsite(selectedKid.id, customDomainInput.trim());
    setCustomDomainInput('');
  };

  const handleScanFlaggedText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flaggedTextInput.trim()) return;

    setFlaggedScanLoading(true);
    setFlaggedScanResult(null);

    try {
      const res = await fetch('/api/ai/flagged-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textSnippet: flaggedTextInput.trim() }),
      });
      const data = await res.json();
      setFlaggedScanResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setFlaggedScanLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Kid Selector Header Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          {kids.map((kid) => {
            const isSelected = kid.id === selectedKidId;
            return (
              <button
                key={kid.id}
                onClick={() => onSelectKid(kid.id)}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/50'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                <img src={kid.avatar} alt={kid.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-white/30" />
                <div className="text-left">
                  <h3 className="font-bold text-sm leading-tight">{kid.name}</h3>
                  <p className="text-[11px] opacity-80">{kid.deviceModel}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Kid Quick Status Summary */}
        <div className="flex items-center space-x-4 text-xs">
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 flex items-center space-x-2">
            <Battery className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300 font-medium">{selectedKid.batteryLevel}% Battery</span>
          </div>

          <button
            onClick={() => onToggleKidInternet(selectedKid.id)}
            className={`px-3 py-1.5 rounded-xl font-semibold border flex items-center space-x-1.5 transition-all ${
              selectedKid.isInternetPaused
                ? 'bg-amber-600/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            {selectedKid.isInternetPaused ? <Play className="w-3.5 h-3.5 text-amber-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
            <span>{selectedKid.isInternetPaused ? 'Resume Web' : 'Pause Web'}</span>
          </button>

          {onOpenLiveCamera && (
            <button
              onClick={onOpenLiveCamera}
              className="px-3 py-1.5 rounded-xl font-semibold border border-purple-500/40 bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 flex items-center space-x-1.5 transition-all shadow-sm"
              title="Open Live Camera Stream & Photo Verification"
            >
              <Camera className="w-3.5 h-3.5 text-purple-400" />
              <span>Camera Stream</span>
            </button>
          )}

          {onOpenApkDownload && (
            <button
              onClick={onOpenApkDownload}
              className="px-3 py-1.5 rounded-xl font-semibold border border-emerald-500/40 bg-gradient-to-r from-emerald-600/20 to-indigo-600/20 text-emerald-300 hover:from-emerald-600/30 hover:to-indigo-600/30 flex items-center space-x-1.5 transition-all shadow-sm"
              title="Download Android APK & Pair Child Device"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pair APK</span>
            </button>
          )}

          <button
            onClick={() => onToggleKidLock(selectedKid.id)}
            className={`px-3 py-1.5 rounded-xl font-semibold border flex items-center space-x-1.5 transition-all ${
              selectedKid.isDeviceLocked
                ? 'bg-red-600/20 text-red-300 border-red-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            {selectedKid.isDeviceLocked ? <Unlock className="w-3.5 h-3.5 text-red-400" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
            <span>{selectedKid.isDeviceLocked ? 'Unlock Device' : 'Lock Device'}</span>
          </button>
        </div>
      </div>

      {/* Primary Control Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-2 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Overview', icon: Clock },
          { id: 'screentime', label: 'Screen Time & Schedules', icon: Clock, badge: pendingRequests.length },
          { id: 'social_media', label: 'Social Media Management', icon: Share2, badge: socialActivities.filter((a) => a.kidId === selectedKid.id && a.isFlagged && a.parentActionTaken !== 'dismissed').length },
          { id: 'files', label: 'File Access & Sideload Vault', icon: FolderOpen, badge: files.filter((f) => f.kidId === selectedKid.id && f.isFlagged && f.status !== 'quarantined').length },
          { id: 'content', label: 'Content Filters & Apps', icon: ShieldCheck, badge: pendingSiteRequests.length },
          { id: 'surround_comms', label: 'Surround Sound & Calls/SMS', icon: Radio },
          { id: 'location', label: 'Live Location & Geofences', icon: MapPin },
          { id: 'insights', label: 'AI Safety & Alerts', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Metric 1: Screen Time */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Daily Screen Time</span>
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-white font-mono">
                  {Math.floor(selectedKid.screenTime.usedMinutes / 60)}h {selectedKid.screenTime.usedMinutes % 60}m
                </span>
                <span className="text-xs text-slate-400">/ {Math.floor(selectedKid.screenTime.dailyLimitMinutes / 60)}h limit</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (selectedKid.screenTime.usedMinutes / selectedKid.screenTime.dailyLimitMinutes) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Metric 2: Content Filter Strictness */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Content Filter Status</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-white capitalize flex items-center space-x-2">
                <span>{selectedKid.contentFilters.strictnessLevel} Protection</span>
              </div>
              <p className="text-[11px] text-emerald-400 mt-2 font-medium">SafeSearch Enforced • 5 Categories Blocked</p>
            </div>

            {/* Metric 3: Current Location */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Current Location</span>
                <MapPin className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-sm font-bold text-white truncate">{selectedKid.currentLocation.address}</p>
              <p className="text-[11px] text-slate-400 mt-2 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Verified {selectedKid.currentLocation.lastUpdated}</span>
              </p>
            </div>

            {/* Metric 4: AI Insights Quick Launcher */}
            <div className="bg-gradient-to-tr from-indigo-950/80 to-blue-950/80 p-5 rounded-2xl border border-indigo-500/30 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-1 text-xs text-indigo-300 font-semibold mb-1">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>AI Wellness Digest</span>
                </div>
                <p className="text-xs text-slate-300 leading-snug">Generate Gemini AI summary for {selectedKid.name}'s daily habits.</p>
              </div>
              <button
                onClick={onOpenAiDigest}
                className="mt-3 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center space-x-1 shadow-md shadow-indigo-600/30"
              >
                <span>Generate Safety Digest</span>
              </button>
            </div>
          </div>

          {/* Stealth Mode Anti-Discovery Settings Card */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <EyeOff className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center space-x-2">
                    <span>Stealth App Masking & Anti-Discovery</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-semibold">
                      STEALTH ACTIVE
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Masks app icon & title as a generic system service to prevent child detection on their phone.
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => onToggleStealthMode && onToggleStealthMode(selectedKid.id, !(selectedKid.isStealthModeEnabled ?? true))}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1.5 ${
                  (selectedKid.isStealthModeEnabled ?? true)
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {(selectedKid.isStealthModeEnabled ?? true) ? (
                  <>
                    <EyeOff className="w-4 h-4 text-amber-400 text-lg" />
                    <span>Stealth Disguise Enabled</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 text-slate-400" />
                    <span>Stealth Disabled</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {(['Device Helper', 'System Settings', 'Battery Optimizer'] as const).map((persona) => {
                const isSelected = (selectedKid.stealthAppName || 'Device Helper') === persona;
                return (
                  <button
                    key={persona}
                    onClick={() => onToggleStealthMode && onToggleStealthMode(selectedKid.id, true, persona)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-md ring-1 ring-blue-500/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">{persona}</span>
                      <Settings className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                    </div>
                    <p className="text-[10px] opacity-80">Mask app title & settings icon</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pending Requests Section */}
          {(pendingRequests.length > 0 || pendingSiteRequests.length > 0) && (
            <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-xl">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2 mb-3">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Pending Approvals from Kids</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-white">{req.kidName}</span>
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-md font-mono">+ {req.requestMinutes}m</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 font-medium">"{req.reason}"</p>
                      <span className="text-[10px] text-slate-500">{req.timestamp}</span>
                    </div>

                    <div className="flex space-x-1.5">
                      <button
                        onClick={() => onApproveScreenTimeRequest(req.id, req.requestMinutes)}
                        className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                        title="Approve extra time"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeclineScreenTimeRequest(req.id)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold"
                        title="Decline request"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {pendingSiteRequests.map((req) => (
                  <div key={req.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-white">{req.kidName}</span>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-md">Site Unblock</span>
                      </div>
                      <p className="text-xs text-blue-400 mt-0.5 font-mono truncate max-w-[180px]">{req.url}</p>
                      <span className="text-[10px] text-slate-500">{req.timestamp}</span>
                    </div>

                    <div className="flex space-x-1.5">
                      <button
                        onClick={() => onApproveSiteRequest(req.id)}
                        className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                        title="Allow site"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeclineSiteRequest(req.id)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold"
                        title="Keep blocked"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Map Preview Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>Live Location Radar & Geofences</span>
              </h3>
              <button
                onClick={() => setActiveTab('location')}
                className="text-xs text-blue-400 hover:underline font-semibold"
              >
                Expand Interactive Map →
              </button>
            </div>
            <InteractiveMap
              kids={kids}
              geofences={geofences}
              selectedKidId={selectedKidId}
              onSelectKid={onSelectKid}
              locationHistory={locationHistory}
              isSimulating={isSimulating}
              onToggleSimulation={onToggleSimulation}
              onAddGeofenceClick={onAddGeofenceClick}
              onUseRealLocation={onUseRealLocation}
              usingRealLocation={usingRealLocation}
            />
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: SCREEN TIME & SCHEDULES */}
      {activeTab === 'screentime' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-white">Screen Time Limits & Downtime Schedules</h3>
              <p className="text-xs text-slate-400">Manage daily limits per category and auto-lock schedules</p>
            </div>

            <button
              onClick={onOpenAiCoach}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-indigo-600/30"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>AI Screen Time Coach</span>
            </button>
          </div>

          {/* Category Screen Time Sliders */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <h4 className="font-bold text-sm text-slate-200">Category Allowance Breakdown for {selectedKid.name}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedKid.screenTime.categories.map((cat, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-white flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                      <span>{cat.category}</span>
                    </span>
                    <span className="font-mono text-slate-300">
                      <strong className="text-white">{cat.usedMinutes}m used</strong> / {cat.limitMinutes}m limit
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="300"
                    step="15"
                    value={cat.limitMinutes}
                    onChange={(e) => onUpdateCategoryLimit(selectedKid.id, cat.category, Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>0 mins</span>
                    <span>1 hour</span>
                    <span>2 hours</span>
                    <span>3+ hours</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Downtime Schedules Cards */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-200 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>Active Downtime Schedules</span>
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedKid.schedules.map((sch) => (
                <div key={sch.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-xs text-white">{sch.name}</h5>
                    <p className="text-xs text-indigo-400 font-mono mt-0.5">
                      {sch.startTime} - {sch.endTime}
                    </p>
                    <div className="flex space-x-1 mt-1.5">
                      {sch.days.map((d, i) => (
                        <span key={i} className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      sch.isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {sch.isActive ? 'Active Schedule' : 'Paused'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: CONTENT FILTERS & APP BLOCKER */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-white">Web Content Filtering & App Controls</h3>
              <p className="text-xs text-slate-400">Strict web domain categories, custom blocklists, and app restrictions</p>
            </div>

            <button
              onClick={onOpenAiScanner}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-blue-600/30"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>AI URL Safety Inspector</span>
            </button>
          </div>

          {/* Web Category Blockers */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
            <h4 className="font-bold text-sm text-slate-200">Enforced Content Filter Categories</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedKid.contentFilters.blockedCategories.map((cat) => (
                <div key={cat.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-xs text-white">{cat.name}</h5>
                    <p className="text-[11px] text-slate-400">{cat.description}</p>
                  </div>
                  <button
                    onClick={() => onToggleContentFilter(selectedKid.id, cat.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold border ${
                      cat.isBlocked
                        ? 'bg-red-600/20 text-red-300 border-red-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {cat.isBlocked ? 'BLOCKED' : 'Allowed'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Installed Apps Permissive Grid */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
            <h4 className="font-bold text-sm text-slate-200">App Blocker Matrix ({selectedKid.name})</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {selectedKid.installedApps.map((app) => (
                <div key={app.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-xs text-white">{app.name}</h5>
                    <span className="text-[10px] text-slate-400 capitalize">{app.category}</span>
                  </div>

                  <select
                    value={app.status}
                    onChange={(e) => onToggleAppStatus(selectedKid.id, app.id, e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 text-xs text-white px-2 py-1 rounded-lg outline-none"
                  >
                    <option value="allowed">Allowed</option>
                    <option value="time_limited">Time Limited</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Blocked Websites Editor */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
            <h4 className="font-bold text-sm text-slate-200">Custom Blocked Domains</h4>
            <form onSubmit={handleAddDomain} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. gambling-site.com, custom-domain.org"
                value={customDomainInput}
                onChange={(e) => setCustomDomainInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold">
                + Add Blocked Domain
              </button>
            </form>

            <div className="flex flex-wrap gap-2 pt-2">
              {selectedKid.contentFilters.customBlockedWebsites.map((dom, i) => (
                <span
                  key={i}
                  className="bg-red-500/10 text-red-300 border border-red-500/30 text-xs px-2.5 py-1 rounded-lg flex items-center space-x-1.5"
                >
                  <span className="font-mono">{dom}</span>
                  <button onClick={() => onRemoveCustomBlockedWebsite(selectedKid.id, dom)} className="hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: LOCATION & GEOFENCES */}
      {activeTab === 'location' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-white">Real-Time Location Tracking & Safe Geofences</h3>
              <p className="text-xs text-slate-400">Monitor live GPS coordinates, set radius alerts, and view timeline history</p>
            </div>

            <button
              onClick={onAddGeofenceClick}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-blue-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Geofence Zone</span>
            </button>
          </div>

          {/* Full Interactive Map */}
          <InteractiveMap
            kids={kids}
            geofences={geofences}
            selectedKidId={selectedKidId}
            onSelectKid={onSelectKid}
            locationHistory={locationHistory}
            isSimulating={isSimulating}
            onToggleSimulation={onToggleSimulation}
            onAddGeofenceClick={onAddGeofenceClick}
            onUseRealLocation={onUseRealLocation}
            usingRealLocation={usingRealLocation}
          />

          {/* Detailed Route Movement History & Playback Engine */}
          <RouteHistoryPanel
            records={routeMovementRecords}
            kids={kids}
            selectedKidId={selectedKidId}
            onSelectKid={onSelectKid}
            isSimulating={isSimulating}
            onToggleSimulation={onToggleSimulation}
          />

          {/* Location History Timeline */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
            <h4 className="font-bold text-sm text-slate-200">Today's Movement Timeline for {selectedKid.name}</h4>
            <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {locationHistory.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3 relative z-10 pl-1">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-xs text-white">{item.locationName}</h5>
                      <span className="text-[10px] text-slate-400 font-mono">{item.time}</span>
                    </div>
                    <p className="text-[11px] text-blue-400 mt-0.5 font-medium">{item.activity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SURROUND SOUND & COMMS */}
      {activeTab === 'surround_comms' && (
        <SurroundSoundAndCommsPanel
          callLogs={callLogs}
          smsMessages={smsMessages}
          audioSessions={audioSessions}
          kids={kids}
          selectedKidId={selectedKidId}
          onSelectKid={onSelectKid}
          onSimulateCall={onSimulateCall}
          onSimulateSms={onSimulateSms}
          onStartSurroundAudio={onStartSurroundAudio}
        />
      )}

      {/* TAB CONTENT 5: AI SAFETY & ALERTS */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-white">AI Cyber Safety & Content Alert Logs</h3>
              <p className="text-xs text-slate-400 font-medium">Flagged keyword analyzer & real-time safety alert feed</p>
            </div>

            <button
              onClick={onOpenAiDigest}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-indigo-600/30"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Generate AI Daily Report</span>
            </button>
          </div>

          {/* Flagged Text Scanner Test Bench */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
            <h4 className="font-bold text-sm text-slate-200 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>AI Message / Search Query Danger Inspector</span>
            </h4>
            <form onSubmit={handleScanFlaggedText} className="flex gap-2">
              <input
                type="text"
                placeholder="Paste suspicious text message or search term (e.g. 'meet me at secret location')"
                value={flaggedTextInput}
                onChange={(e) => setFlaggedTextInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
              />
              <button
                type="submit"
                disabled={flaggedScanLoading}
                className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1"
              >
                <span>{flaggedScanLoading ? 'Scanning...' : 'Scan Text'}</span>
              </button>
            </form>

            {flaggedScanResult && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Category: {flaggedScanResult.riskCategory}</span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                      flaggedScanResult.isRiskFlagged ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {flaggedScanResult.severity}
                  </span>
                </div>
                <p className="text-slate-300">{flaggedScanResult.explanation}</p>
                <div className="text-amber-300 font-semibold">Recommended: {flaggedScanResult.actionRecommended}</div>
              </div>
            )}
          </div>

          {/* Alert History Feed */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
            <h4 className="font-bold text-sm text-slate-200">Recent Safety Alerts Log</h4>
            <div className="space-y-2">
              {alerts.map((alt) => (
                <div key={alt.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-xl ${
                        alt.severity === 'critical'
                          ? 'bg-red-500/20 text-red-400'
                          : alt.severity === 'warning'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-white">{alt.title}</h5>
                      <p className="text-xs text-slate-300">{alt.description}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{alt.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 7: SOCIAL MEDIA MANAGEMENT */}
      {activeTab === 'social_media' && (
        <SocialMediaPanel
          selectedKid={selectedKid}
          accounts={socialAccounts}
          activities={socialActivities}
          onUpdateAccountStatus={onUpdateSocialAccountStatus}
          onUpdateAccountLimit={onUpdateSocialAccountLimit}
          onToggleAccountShield={onToggleSocialAccountShield}
          onPauseAllSocial={onPauseAllSocial}
          onTakeParentAction={onTakeSocialParentAction}
          onAddSimulatedSocialActivity={onAddSimulatedSocialActivity}
        />
      )}

      {/* TAB CONTENT 8: FILE ACCESS & SIDELOAD VAULT */}
      {activeTab === 'files' && (
        <FileAccessPanel
          selectedKid={selectedKid}
          files={files}
          onUpdateFileStatus={onUpdateFileStatus}
          onUpdateFilePermission={onUpdateFilePermission}
          onDeleteFile={onDeleteFile}
          onAddSimulatedFile={onAddSimulatedFile}
        />
      )}
    </div>
  );
};
