import React, { useState } from 'react';
import {
  KidProfile,
  SocialAccountConfig,
  SocialActivityItem,
  SocialPlatform,
} from '../types';
import {
  Share2,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Sparkles,
  MessageSquare,
  UserX,
  Send,
  Eye,
  EyeOff,
  Download,
  Copy,
  Check,
  Tv,
  Gamepad2,
  Radio,
  Sliders,
  Bell,
  RefreshCw,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';

interface SocialMediaPanelProps {
  selectedKid: KidProfile;
  accounts: SocialAccountConfig[];
  activities: SocialActivityItem[];
  onUpdateAccountStatus: (accountId: string, newStatus: SocialAccountConfig['status']) => void;
  onUpdateAccountLimit: (accountId: string, newLimitMinutes: number) => void;
  onToggleAccountShield: (
    accountId: string,
    field: 'dmShieldEnabled' | 'safeModeEnforced' | 'nsfwShieldEnabled' | 'commentFilterEnabled'
  ) => void;
  onPauseAllSocial: (kidId: string) => void;
  onTakeParentAction: (
    activityId: string,
    action: 'blocked_contact' | 'warned_kid' | 'removed_content' | 'dismissed'
  ) => void;
  onAddSimulatedSocialActivity?: (activity: Omit<SocialActivityItem, 'id'>) => void;
}

export const SocialMediaPanel: React.FC<SocialMediaPanelProps> = ({
  selectedKid,
  accounts,
  activities,
  onUpdateAccountStatus,
  onUpdateAccountLimit,
  onToggleAccountShield,
  onPauseAllSocial,
  onTakeParentAction,
  onAddSimulatedSocialActivity,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'feed' | 'controls' | 'scanner' | 'report'>('feed');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | 'flagged' | 'cyberbullying' | 'stranger_danger' | 'safe'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // AI Scanner state
  const [scanContent, setScanContent] = useState('');
  const [scanPlatform, setScanPlatform] = useState<SocialPlatform>('instagram');
  const [scanSender, setScanSender] = useState('');
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanLoading, setScanLoading] = useState(false);

  // Copy report state
  const [copiedReport, setCopiedReport] = useState(false);

  // Filter accounts for current kid
  const kidAccounts = accounts.filter((a) => a.kidId === selectedKid.id);
  const kidActivities = activities.filter((a) => a.kidId === selectedKid.id);

  const flaggedActivities = kidActivities.filter((a) => a.isFlagged && a.parentActionTaken !== 'dismissed');

  // Total daily social time used
  const totalUsedMinutes = kidAccounts.reduce((acc, curr) => acc + curr.usedMinutesToday, 0);
  const totalLimitMinutes = kidAccounts.reduce((acc, curr) => acc + curr.dailyLimitMinutes, 0);

  // Platform style helpers
  const getPlatformMeta = (platform: SocialPlatform) => {
    switch (platform) {
      case 'instagram':
        return { name: 'Instagram', bg: 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500', badgeBg: 'bg-pink-500/20 text-pink-300 border-pink-500/40', icon: Share2 };
      case 'tiktok':
        return { name: 'TikTok', bg: 'bg-slate-950 border-cyan-500/50', badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', icon: Share2 };
      case 'snapchat':
        return { name: 'Snapchat', bg: 'bg-yellow-500', badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', icon: MessageCircle };
      case 'youtube':
        return { name: 'YouTube', bg: 'bg-red-600', badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40', icon: Tv };
      case 'discord':
        return { name: 'Discord', bg: 'bg-indigo-600', badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', icon: MessageSquare };
      case 'roblox':
        return { name: 'Roblox', bg: 'bg-slate-800', badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40', icon: Gamepad2 };
      case 'whatsapp':
        return { name: 'WhatsApp', bg: 'bg-emerald-600', badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: MessageSquare };
      default:
        return { name: platform, bg: 'bg-blue-600', badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40', icon: Share2 };
    }
  };

  // Filtered activities
  const filteredActivities = kidActivities.filter((act) => {
    if (platformFilter !== 'all' && act.platform !== platformFilter) return false;
    if (riskFilter === 'flagged' && !act.isFlagged) return false;
    if (riskFilter === 'cyberbullying' && act.riskCategory !== 'cyberbullying') return false;
    if (riskFilter === 'stranger_danger' && act.riskCategory !== 'stranger_danger') return false;
    if (riskFilter === 'safe' && act.riskCategory !== 'safe') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesContent = act.content.toLowerCase().includes(q);
      const matchesSender = act.senderOrAuthor.toLowerCase().includes(q);
      return matchesContent || matchesSender;
    }
    return true;
  });

  const handleRunAiScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanContent.trim()) return;

    setScanLoading(true);
    setScanResult(null);

    try {
      const res = await fetch('/api/ai/social-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: scanContent.trim(),
          platform: scanPlatform,
          sender: scanSender.trim() || 'Simulated User',
          kidAge: selectedKid.age,
        }),
      });
      const data = await res.json();
      setScanResult(data);

      if (onAddSimulatedSocialActivity && data) {
        onAddSimulatedSocialActivity({
          kidId: selectedKid.id,
          platform: scanPlatform,
          type: 'direct_message',
          senderOrAuthor: scanSender.trim() || 'Simulated User',
          content: scanContent.trim(),
          timestamp: 'Just now',
          isFlagged: data.isFlagged,
          riskCategory: data.riskCategory || (data.isFlagged ? 'stranger_danger' : 'safe'),
          sentiment: data.sentiment || 'neutral',
          aiSafetyScore: data.aiSafetyScore || 80,
          aiContextAdvice: data.aiContextAdvice || 'Live AI scanned social interaction.',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setScanLoading(false);
    }
  };

  const generateReportText = () => {
    let report = `=== KIDSGUARDIAN SOCIAL MEDIA SAFETY AUDIT ===\n`;
    report += `Child: ${selectedKid.name} (Age ${selectedKid.age})\n`;
    report += `Device: ${selectedKid.deviceModel}\n`;
    report += `Audit Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n\n`;
    report += `--- MONITORED ACCOUNTS & TIME LIMITS ---\n`;
    kidAccounts.forEach((acc) => {
      report += `• ${acc.platformName} (${acc.handle}): ${acc.status.toUpperCase()} | Limit: ${acc.dailyLimitMinutes}m | Used Today: ${acc.usedMinutesToday}m | DM Shield: ${acc.dmShieldEnabled ? 'ACTIVE' : 'OFF'}\n`;
    });
    report += `\n--- RECENT FLAGGED INCIDENTS (${flaggedActivities.length}) ---\n`;
    if (flaggedActivities.length === 0) {
      report += `No active unhandled toxic incidents or stranger risks detected.\n`;
    } else {
      flaggedActivities.forEach((act, idx) => {
        report += `${idx + 1}. [${act.platform.toUpperCase()}] ${act.senderOrAuthor} -> "${act.content}"\n`;
        report += `   Risk Category: ${act.riskCategory.replace('_', ' ').toUpperCase()} | AI Safety Score: ${act.aiSafetyScore}/100\n`;
        report += `   Context Advice: ${act.aiContextAdvice}\n\n`;
      });
    }
    report += `=== END OF AUDIT REPORT ===`;
    return report;
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(generateReportText());
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary Cards */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <Share2 className="w-6 h-6 text-pink-400" />
              <h2 className="text-xl font-black text-white tracking-wide">
                Social Media Control & Cyberbullying Shield
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active DM protection, comment moderation filters, and live AI sentiment analysis for {selectedKid.name}.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onPauseAllSocial(selectedKid.id)}
              className="px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 text-xs font-bold flex items-center space-x-2 transition-all shadow-sm"
            >
              <Lock className="w-4 h-4 text-red-400" />
              <span>Pause All Social Media</span>
            </button>
          </div>
        </div>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Monitored Platforms</span>
              <Share2 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {kidAccounts.filter((a) => a.status !== 'blocked').length} Active / {kidAccounts.length} Total
            </div>
            <p className="text-[11px] text-emerald-400 mt-1">Direct message shield active</p>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Social Time Usage</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {totalUsedMinutes}m / {totalLimitMinutes}m
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, totalLimitMinutes > 0 ? (totalUsedMinutes / totalLimitMinutes) * 100 : 0)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Flagged Risk Alerts</span>
              <ShieldAlert className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-xl font-bold text-white font-mono flex items-center space-x-2">
              <span className={flaggedActivities.length > 0 ? 'text-red-400' : 'text-emerald-400'}>
                {flaggedActivities.length} Incidents
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {flaggedActivities.length > 0 ? 'Requires parent review' : 'No active toxic risks'}
            </p>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Social Safety Index</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400 font-mono">
              {flaggedActivities.length === 0 ? '98%' : flaggedActivities.length < 3 ? '82%' : '65%'} Safe
            </div>
            <p className="text-[11px] text-purple-300 mt-1">AI Sentiment Filter Active</p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 space-x-2 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('feed')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === 'feed'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Monitored Activity Feed</span>
          {flaggedActivities.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-extrabold">
              {flaggedActivities.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('controls')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === 'controls'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Platform Accounts & Shields</span>
        </button>

        <button
          onClick={() => setActiveSubTab('scanner')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === 'scanner'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>AI Content & DM Scanner</span>
        </button>

        <button
          onClick={() => setActiveSubTab('report')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === 'report'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Safety Audit Report</span>
        </button>
      </div>

      {/* SUB-TAB 1: MONITORED ACTIVITY FEED */}
      {activeSubTab === 'feed' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2 flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search messages, usernames, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Risk Filters */}
            <div className="flex items-center space-x-2 text-xs overflow-x-auto">
              <span className="text-slate-400 font-medium">Risk:</span>
              <button
                onClick={() => setRiskFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  riskFilter === 'all'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setRiskFilter('flagged')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  riskFilter === 'flagged'
                    ? 'bg-red-600/30 text-red-300 border border-red-500/50'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                Flagged Risks
              </button>
              <button
                onClick={() => setRiskFilter('cyberbullying')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  riskFilter === 'cyberbullying'
                    ? 'bg-pink-600/30 text-pink-300 border border-pink-500/50'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                Cyberbullying
              </button>
              <button
                onClick={() => setRiskFilter('stranger_danger')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  riskFilter === 'stranger_danger'
                    ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                Stranger Danger
              </button>
            </div>
          </div>

          {/* Activity Cards List */}
          {filteredActivities.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-sm">No monitored social media activities matching your filter.</p>
              <p className="text-xs opacity-75 mt-1">All conversations are currently within safety guidelines.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivities.map((act) => {
                const meta = getPlatformMeta(act.platform);
                const isToxic = act.sentiment === 'toxic' || act.sentiment === 'suspicious';

                return (
                  <div
                    key={act.id}
                    className={`bg-slate-900 border rounded-2xl p-5 shadow-lg transition-all ${
                      act.isFlagged
                        ? 'border-red-500/50 bg-red-950/10'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div className="flex items-center space-x-3">
                        {act.senderAvatar ? (
                          <img
                            src={act.senderAvatar}
                            alt={act.senderOrAuthor}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-700"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 border border-slate-700">
                            {act.senderOrAuthor.charAt(0)}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-white">{act.senderOrAuthor}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.badgeBg}`}>
                              {meta.name}
                            </span>
                            <span className="text-[11px] text-slate-500 capitalize">• {act.type.replace('_', ' ')}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">{act.timestamp}</span>
                        </div>
                      </div>

                      {/* Safety Score Badge */}
                      <div className="flex items-center space-x-2">
                        <div
                          className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center space-x-1 ${
                            act.aiSafetyScore < 40
                              ? 'bg-red-500/20 text-red-300 border-red-500/40'
                              : act.aiSafetyScore < 75
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          {act.aiSafetyScore < 50 ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          <span>Score: {act.aiSafetyScore}/100</span>
                        </div>
                      </div>
                    </div>

                    {/* Message Body */}
                    <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-sm text-slate-200 mb-3 font-sans">
                      "{act.content}"
                    </div>

                    {/* AI Safety Advice Note */}
                    {act.aiContextAdvice && (
                      <div
                        className={`p-3 rounded-xl border text-xs flex items-start space-x-2 mb-3 ${
                          act.isFlagged
                            ? 'bg-red-950/30 border-red-500/30 text-red-200'
                            : 'bg-blue-950/20 border-blue-500/30 text-blue-200'
                        }`}
                      >
                        <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-purple-400" />
                        <div>
                          <span className="font-bold block mb-0.5">AI Safety Advisor:</span>
                          <p>{act.aiContextAdvice}</p>
                        </div>
                      </div>
                    )}

                    {/* Parent Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] text-slate-400">
                        {act.parentActionTaken && act.parentActionTaken !== 'none'
                          ? `Status: ${act.parentActionTaken.replace('_', ' ').toUpperCase()}`
                          : 'Action Required:'}
                      </span>

                      <div className="flex items-center space-x-2">
                        {act.isFlagged && act.parentActionTaken !== 'blocked_contact' && (
                          <button
                            onClick={() => onTakeParentAction(act.id, 'blocked_contact')}
                            className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 text-xs font-bold flex items-center space-x-1.5 transition-all"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Block Sender Contact</span>
                          </button>
                        )}

                        {act.isFlagged && act.parentActionTaken !== 'warned_kid' && (
                          <button
                            onClick={() => onTakeParentAction(act.id, 'warned_kid')}
                            className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center space-x-1.5 transition-all"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            <span>Send Device Warning</span>
                          </button>
                        )}

                        {act.isFlagged && (
                          <button
                            onClick={() => onTakeParentAction(act.id, 'dismissed')}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-all"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Dismiss Alert</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: PLATFORM CONTROLS & SHIELDS */}
      {activeSubTab === 'controls' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kidAccounts.map((acc) => {
              const meta = getPlatformMeta(acc.platform);

              return (
                <div
                  key={acc.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2.5 rounded-xl text-white ${meta.bg}`}>
                        <meta.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-white">{acc.platformName}</h3>
                        <p className="text-xs text-slate-400 font-mono">{acc.handle}</p>
                      </div>
                    </div>

                    {/* Status Select */}
                    <select
                      value={acc.status}
                      onChange={(e) => onUpdateAccountStatus(acc.id, e.target.value as any)}
                      className="bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-1.5 font-bold focus:outline-none focus:border-blue-500"
                    >
                      <option value="active">Active Monitoring</option>
                      <option value="paused">Paused Access</option>
                      <option value="restricted">Restricted (DMs Blocked)</option>
                      <option value="blocked">Fully Blocked</option>
                    </select>
                  </div>

                  {/* Daily Limit Slider */}
                  <div className="space-y-1.5 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Daily Time Allowance</span>
                      <span className="text-blue-400 font-bold font-mono">
                        {acc.dailyLimitMinutes === 0 ? 'Blocked' : `${acc.dailyLimitMinutes} min / day`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="120"
                      step="15"
                      value={acc.dailyLimitMinutes}
                      onChange={(e) => onUpdateAccountLimit(acc.id, parseInt(e.target.value, 10))}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>0m (Blocked)</span>
                      <span>30m</span>
                      <span>60m</span>
                      <span>120m</span>
                    </div>
                  </div>

                  {/* Safety Toggles Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* DM Shield */}
                    <button
                      onClick={() => onToggleAccountShield(acc.id, 'dmShieldEnabled')}
                      className={`p-2.5 rounded-xl border font-semibold flex items-center justify-between text-left transition-all ${
                        acc.dmShieldEnabled
                          ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700'
                      }`}
                    >
                      <div>
                        <span className="block text-[11px] font-bold">DM Contact Shield</span>
                        <span className="text-[10px] opacity-75">Block stranger messages</span>
                      </div>
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                    </button>

                    {/* Comment Filter */}
                    <button
                      onClick={() => onToggleAccountShield(acc.id, 'commentFilterEnabled')}
                      className={`p-2.5 rounded-xl border font-semibold flex items-center justify-between text-left transition-all ${
                        acc.commentFilterEnabled
                          ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700'
                      }`}
                    >
                      <div>
                        <span className="block text-[11px] font-bold">Anti-Bullying Filter</span>
                        <span className="text-[10px] opacity-75">Hide toxic comments</span>
                      </div>
                      <Sparkles className="w-4 h-4 shrink-0" />
                    </button>

                    {/* NSFW Image Shield */}
                    <button
                      onClick={() => onToggleAccountShield(acc.id, 'nsfwShieldEnabled')}
                      className={`p-2.5 rounded-xl border font-semibold flex items-center justify-between text-left transition-all ${
                        acc.nsfwShieldEnabled
                          ? 'bg-purple-600/20 text-purple-300 border-purple-500/40'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700'
                      }`}
                    >
                      <div>
                        <span className="block text-[11px] font-bold">NSFW Image Shield</span>
                        <span className="text-[10px] opacity-75">Auto-blur explicit media</span>
                      </div>
                      <EyeOff className="w-4 h-4 shrink-0" />
                    </button>

                    {/* Private Account Enforcement */}
                    <button
                      onClick={() => onToggleAccountShield(acc.id, 'safeModeEnforced')}
                      className={`p-2.5 rounded-xl border font-semibold flex items-center justify-between text-left transition-all ${
                        acc.safeModeEnforced
                          ? 'bg-amber-600/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700'
                      }`}
                    >
                      <div>
                        <span className="block text-[11px] font-bold">Force Private Profile</span>
                        <span className="text-[10px] opacity-75">Hide public bio & feed</span>
                      </div>
                      <Lock className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: AI CONTENT & DM SCANNER */}
      {activeSubTab === 'scanner' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-600/20 border border-purple-500/40 rounded-2xl text-purple-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Live AI Social Media Safety Inspector</h3>
              <p className="text-xs text-slate-400">
                Paste any social message, comment, or DM snippet to analyze toxicity, predator risk, and cyberbullying.
              </p>
            </div>
          </div>

          <form onSubmit={handleRunAiScan} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Social Platform</label>
                <select
                  value={scanPlatform}
                  onChange={(e) => setScanPlatform(e.target.value as SocialPlatform)}
                  className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-xl p-2.5 focus:outline-none focus:border-purple-500"
                >
                  <option value="instagram">Instagram DM / Comment</option>
                  <option value="tiktok">TikTok Comment / Video caption</option>
                  <option value="snapchat">Snapchat Direct Message</option>
                  <option value="discord">Discord Server Chat / DM</option>
                  <option value="roblox">Roblox In-Game Chat</option>
                  <option value="youtube">YouTube Comment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Sender or Username (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. @unknown_user_99"
                  value={scanSender}
                  onChange={(e) => setScanSender(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-xl p-2.5 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Message or Comment Snippet</label>
              <textarea
                rows={3}
                placeholder="e.g. 'Give me your phone number and address so I can send you free game skins...'"
                value={scanContent}
                onChange={(e) => setScanContent(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-xl p-3 focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={scanLoading || !scanContent.trim()}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-purple-600/30 transition-all"
            >
              {scanLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{scanLoading ? 'Analyzing with Gemini AI...' : 'Run Safety Scan'}</span>
            </button>
          </form>

          {/* Scan Results Display */}
          {scanResult && (
            <div
              className={`p-5 rounded-2xl border ${
                scanResult.isFlagged
                  ? 'bg-red-950/20 border-red-500/40 text-red-200'
                  : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {scanResult.isFlagged ? (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  )}
                  <span className="font-bold text-sm">
                    {scanResult.isFlagged ? 'HIGH RISK CONTENT FLAGGED' : 'SAFE SOCIAL INTERACTION'}
                  </span>
                </div>

                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700">
                  Safety Score: {scanResult.aiSafetyScore}/100
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <p>
                  <strong>Risk Category:</strong>{' '}
                  <span className="capitalize">{scanResult.riskCategory?.replace('_', ' ') || 'None'}</span>
                </p>
                <p>
                  <strong>Sentiment Analysis:</strong>{' '}
                  <span className="capitalize">{scanResult.sentiment}</span>
                </p>
                <p>
                  <strong>AI Parental Advice:</strong> {scanResult.aiContextAdvice}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: SAFETY AUDIT REPORT */}
      {activeSubTab === 'report' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Digital Social Media Safety Report</h3>
              <p className="text-xs text-slate-400">
                Official audit summary for school counselor, parenting records, or cyber safety review.
              </p>
            </div>

            <button
              onClick={handleCopyReport}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 transition-all shadow-md"
            >
              {copiedReport ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedReport ? 'Copied to Clipboard!' : 'Copy Audit Summary'}</span>
            </button>
          </div>

          <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 whitespace-pre-wrap overflow-x-auto leading-relaxed">
            {generateReportText()}
          </pre>
        </div>
      )}
    </div>
  );
};
