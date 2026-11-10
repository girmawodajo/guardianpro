import React, { useState, useEffect, useRef } from 'react';
import { CallLog, SmsMessage, SurroundAudioSession, KidProfile } from '../types';
import {
  Mic,
  Volume2,
  Phone,
  MessageSquare,
  ShieldAlert,
  Play,
  Pause,
  Square,
  Radio,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneOff,
  Send,
  Sparkles,
  Filter,
  Activity,
  Zap,
  Lock,
  Download,
  Plus,
} from 'lucide-react';

interface SurroundSoundAndCommsPanelProps {
  callLogs: CallLog[];
  smsMessages: SmsMessage[];
  audioSessions: SurroundAudioSession[];
  kids: KidProfile[];
  selectedKidId: string;
  onSelectKid: (id: string) => void;
  onSimulateCall: (kidId: string, contactName: string, phone: string, type: 'incoming' | 'outgoing' | 'blocked') => void;
  onSimulateSms: (kidId: string, contactName: string, phone: string, text: string, riskCategory: any) => void;
  onStartSurroundAudio: (kidId: string) => void;
}

export const SurroundSoundAndCommsPanel: React.FC<SurroundSoundAndCommsPanelProps> = ({
  callLogs,
  smsMessages,
  audioSessions,
  kids,
  selectedKidId,
  onSelectKid,
  onSimulateCall,
  onSimulateSms,
  onStartSurroundAudio,
}) => {
  const [subTab, setSubTab] = useState<'surround' | 'calls' | 'sms'>('surround');

  // Surround Sound Live State
  const [isLiveListening, setIsLiveListening] = useState<boolean>(false);
  const [decibels, setDecibels] = useState<number>(42);
  const [activePlaybackId, setActivePlaybackId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [simulatedWords, setSimulatedWords] = useState<string[]>(['ambient sound', 'classroom']);

  // Call & SMS Filters & Inputs
  const [callFilter, setCallFilter] = useState<'all' | 'flagged' | 'blocked'>('all');
  const [smsFilter, setSmsFilter] = useState<'all' | 'flagged' | 'stranger_danger' | 'cyberbullying'>('all');

  // Simulation Form states
  const [simCallName, setSimCallName] = useState('Unknown Caller');
  const [simCallPhone, setSimCallPhone] = useState('+1 (555) 998-1029');
  const [simCallType, setSimCallType] = useState<'incoming' | 'outgoing' | 'blocked'>('incoming');

  const [simSmsName, setSimSmsName] = useState('Unknown Contact');
  const [simSmsPhone, setSimSmsPhone] = useState('+1 (555) 441-9022');
  const [simSmsText, setSimSmsText] = useState('Where are you right now? Meet me outside.');
  const [simSmsRisk, setSimSmsRisk] = useState<'stranger_danger' | 'cyberbullying' | 'safe'>('stranger_danger');

  const selectedKid = kids.find((k) => k.id === selectedKidId) || kids[0];

  const kidCallLogs = callLogs.filter((c) => c.kidId === selectedKidId);
  const kidSmsMessages = smsMessages.filter((s) => s.kidId === selectedKidId);
  const kidAudioSessions = audioSessions.filter((a) => a.kidId === selectedKidId);

  // Live Listening audio visualizer spectrum animation
  useEffect(() => {
    let timer: any;
    if (isLiveListening) {
      timer = setInterval(() => {
        // Random decibel fluctuation (35 dB to 85 dB)
        const newDb = Math.floor(38 + Math.random() * 45);
        setDecibels(newDb);
      }, 300);
    } else {
      setDecibels(42);
    }
    return () => clearInterval(timer);
  }, [isLiveListening]);

  // Audio Playback simulation timer
  useEffect(() => {
    let timer: any;
    if (activePlaybackId) {
      timer = setInterval(() => {
        setPlaybackProgress((prev) => {
          if (prev >= 100) {
            setActivePlaybackId(null);
            return 0;
          }
          return prev + 10;
        });
      }, 500);
    } else {
      setPlaybackProgress(0);
    }
    return () => clearInterval(timer);
  }, [activePlaybackId]);

  // Filtered Calls & SMS
  const filteredCalls = kidCallLogs.filter((c) => {
    if (callFilter === 'flagged') return c.isFlagged;
    if (callFilter === 'blocked') return c.type === 'blocked';
    return true;
  });

  const filteredSms = kidSmsMessages.filter((s) => {
    if (smsFilter === 'flagged') return s.isFlagged;
    if (smsFilter === 'stranger_danger') return s.riskCategory === 'stranger_danger';
    if (smsFilter === 'cyberbullying') return s.riskCategory === 'cyberbullying';
    return true;
  });

  const formatDuration = (secs: number) => {
    if (secs === 0) return '0s';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const handleTriggerSimCall = (e: React.FormEvent) => {
    e.preventDefault();
    onSimulateCall(selectedKid.id, simCallName, simCallPhone, simCallType);
    setSimCallName('');
  };

  const handleTriggerSimSms = (e: React.FormEvent) => {
    e.preventDefault();
    onSimulateSms(selectedKid.id, simSmsName, simSmsPhone, simSmsText, simSmsRisk);
    setSimSmsText('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-6 shadow-2xl text-slate-100">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              Surround Sound & Communication Monitoring
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center space-x-1">
                <Mic className="w-3 h-3 text-purple-400 animate-pulse" />
                <span>LIVE SURROUND MIC</span>
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Listen to ambient environment surround sound, inspect call logs, and review incoming SMS text messages
            </p>
          </div>
        </div>

        {/* Child Selection Bar */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {kids.map((k) => (
            <button
              key={k.id}
              onClick={() => onSelectKid(k.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                selectedKidId === k.id
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{k.avatar}</span>
              <span>{k.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setSubTab('surround')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            subTab === 'surround'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>Ambient Surround Sound</span>
          <span className="ml-1 px-1.5 py-0.2 rounded bg-purple-400/20 text-purple-300 text-[10px] font-mono">
            {kidAudioSessions.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('calls')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            subTab === 'calls'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>Call Logs & Telephony</span>
          <span className="ml-1 px-1.5 py-0.2 rounded bg-purple-400/20 text-purple-300 text-[10px] font-mono">
            {kidCallLogs.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('sms')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            subTab === 'sms'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>SMS Text Messages</span>
          <span className="ml-1 px-1.5 py-0.2 rounded bg-purple-400/20 text-purple-300 text-[10px] font-mono">
            {kidSmsMessages.length}
          </span>
        </button>
      </div>

      {/* SECTION 1: Ambient Surround Sound Listening Engine */}
      {subTab === 'surround' && (
        <div className="space-y-6">
          {/* Live Audio Console */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-5 shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    isLiveListening
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse ring-4 ring-red-500/10'
                      : 'bg-slate-900 text-purple-400 border border-slate-800'
                  }`}
                >
                  <Radio className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white flex items-center gap-2">
                    Live Surround Sound Microphone
                    {isLiveListening ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold animate-pulse">
                        LIVE STREAMING
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        STANDBY
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Stream live ambient audio around {selectedKid.name}'s phone without alerting target device
                  </p>
                </div>
              </div>

              {/* Toggle Live Audio Streaming Button */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsLiveListening(!isLiveListening)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all shadow-lg ${
                    isLiveListening
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 animate-pulse'
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                  }`}
                >
                  {isLiveListening ? (
                    <>
                      <Square className="w-4 h-4 fill-white" />
                      <span>Stop Live Surround Stream</span>
                    </>
                  ) : (
                    <>
                      <Radio className="w-4 h-4" />
                      <span>Start Live Surround Audio</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onStartSurroundAudio(selectedKid.id)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-purple-300 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-all"
                >
                  <Mic className="w-4 h-4 text-purple-400" />
                  <span>Record 30s Ambient Snapshot</span>
                </button>
              </div>
            </div>

            {/* Audio Spectrum Visualizer & Decibel Meter */}
            <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium flex items-center space-x-1.5">
                  <Volume2 className="w-4 h-4 text-purple-400" />
                  <span>Real-time Decibel & Acoustic Noise Meter</span>
                </span>
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xs text-purple-400 font-bold bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-500/20">
                    {decibels} dB SPL
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Environment Context: {decibels > 65 ? 'High Noise / Playground' : decibels > 50 ? 'Moderate / Conversation' : 'Quiet Classroom'}
                  </span>
                </div>
              </div>

              {/* Animated Waveform Spectrum Bars */}
              <div className="h-20 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center px-4 space-x-1.5 overflow-hidden">
                {Array.from({ length: 32 }).map((_, idx) => {
                  const baseH = isLiveListening
                    ? Math.max(12, Math.floor(Math.sin(idx + Date.now() / 200) * 35 + decibels * 0.8))
                    : [15, 25, 40, 15, 30, 50, 20, 10, 35, 60, 25, 15, 45, 30, 10][idx % 15];
                  return (
                    <div
                      key={idx}
                      className={`w-1.5 rounded-full transition-all duration-150 ${
                        isLiveListening
                          ? idx % 4 === 0
                            ? 'bg-purple-500 shadow-sm shadow-purple-500'
                            : idx % 3 === 0
                            ? 'bg-blue-400'
                            : 'bg-emerald-400'
                          : 'bg-slate-800'
                      }`}
                      style={{ height: `${baseH}%` }}
                    />
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>20 Hz (Low Bass)</span>
                <span>1 kHz (Voice Frequency Range)</span>
                <span>20 kHz (Treble Noise)</span>
              </div>
            </div>
          </div>

          {/* Recorded Ambient Audio Sessions History */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-200 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>Surround Sound Audio Snapshots & Recordings</span>
            </h4>

            {kidAudioSessions.length === 0 ? (
              <div className="bg-slate-950 p-8 rounded-xl border border-slate-800 text-center text-slate-400">
                <Mic className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-medium">No recorded surround sound clips for {selectedKid.name}.</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Click "Record 30s Ambient Snapshot" or trigger live listening above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {kidAudioSessions.map((session) => {
                  const isPlayingThis = activePlaybackId === session.id;
                  return (
                    <div
                      key={session.id}
                      className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 shadow-md hover:border-purple-500/40 transition-all"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <Mic className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-white block capitalize">
                              {session.ambientContext.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{session.timestamp}</span>
                          </div>
                        </div>

                        <span className="font-mono text-[11px] bg-slate-900 px-2 py-0.5 rounded text-purple-300 border border-slate-800">
                          {session.noiseLevelDb} dB • {session.durationSeconds}s
                        </span>
                      </div>

                      {/* Waveform Mini Bar & Play Controls */}
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center space-x-3">
                        <button
                          onClick={() => {
                            if (isPlayingThis) {
                              setActivePlaybackId(null);
                            } else {
                              setActivePlaybackId(session.id);
                            }
                          }}
                          className="w-8 h-8 rounded-lg bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-sm"
                        >
                          {isPlayingThis ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>

                        <div className="flex-1 space-y-1">
                          <div className="h-6 flex items-center space-x-0.5">
                            {session.audioWaveform.map((val, idx) => (
                              <div
                                key={idx}
                                className={`flex-1 rounded-sm transition-all ${
                                  isPlayingThis && (idx / session.audioWaveform.length) * 100 <= playbackProgress
                                    ? 'bg-purple-400'
                                    : 'bg-slate-700'
                                }`}
                                style={{ height: `${Math.max(15, val)}%` }}
                              />
                            ))}
                          </div>
                          {isPlayingThis && (
                            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                              <div
                                className="bg-purple-500 h-full transition-all duration-300"
                                style={{ width: `${playbackProgress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Detected Acoustic Tags */}
                      {session.detectedKeywords && session.detectedKeywords.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="text-slate-500">Detected Keywords:</span>
                          {session.detectedKeywords.map((kw, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-800 font-mono"
                            >
                              #{kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: Call Logs & Telephony Inspection */}
      {subTab === 'calls' && (
        <div className="space-y-6">
          {/* Header & Simulator Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-purple-400" />
              <h4 className="font-bold text-sm text-slate-200">Phone Call Logs & Whitelist Protection</h4>
            </div>

            {/* Call Filters */}
            <div className="flex items-center space-x-1.5 text-[11px]">
              <span className="text-slate-400 mr-1 flex items-center space-x-1">
                <Filter className="w-3 h-3" />
                <span>Filter:</span>
              </span>
              {['all', 'flagged', 'blocked'].map((f) => (
                <button
                  key={f}
                  onClick={() => setCallFilter(f as any)}
                  className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-all ${
                    callFilter === f
                      ? 'bg-purple-600 text-white font-semibold'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Call Logs Table */}
          {filteredCalls.length === 0 ? (
            <div className="bg-slate-950 p-8 rounded-xl border border-slate-800 text-center text-slate-400">
              <PhoneOff className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-medium">No calls found matching filter for {selectedKid.name}.</p>
            </div>
          ) : (
            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              <div className="divide-y divide-slate-800 text-xs">
                {filteredCalls.map((call) => (
                  <div key={call.id} className="p-3.5 flex items-center justify-between hover:bg-slate-900/60 transition-all">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          call.type === 'blocked'
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : call.isFlagged
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : call.type === 'incoming'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }`}
                      >
                        {call.type === 'incoming' ? (
                          <PhoneIncoming className="w-4 h-4" />
                        ) : call.type === 'outgoing' ? (
                          <PhoneOutgoing className="w-4 h-4" />
                        ) : (
                          <PhoneOff className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h5 className="font-bold text-slate-100">{call.contactName}</h5>
                          {call.isFlagged && (
                            <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.2 rounded font-medium flex items-center space-x-1">
                              <AlertTriangle className="w-3 h-3 text-red-400" />
                              <span>Flagged Threat</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {call.phoneNumber} • {call.timestamp}
                        </p>
                        {call.flagReason && (
                          <p className="text-[10px] text-amber-400 mt-0.5 font-medium">{call.flagReason}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-slate-400 text-xs">{formatDuration(call.durationSeconds)}</span>
                      {call.audioRecordingAvailable && (
                        <button
                          onClick={() => alert(`Playing recorded call audio snippet for ${call.contactName}`)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-purple-300 border border-slate-700 text-[10px] font-semibold flex items-center space-x-1"
                        >
                          <Volume2 className="w-3 h-3 text-purple-400" />
                          <span>Call Audio</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trigger Test Call Form Simulator */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <h5 className="font-bold text-xs text-slate-300 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Real-time Incoming/Outgoing Call on Child Device</span>
            </h5>

            <form onSubmit={handleTriggerSimCall} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="Caller Name (e.g. Unknown Stranger)"
                value={simCallName}
                onChange={(e) => setSimCallName(e.target.value)}
                className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                required
              />
              <input
                type="text"
                placeholder="Phone Number (+1 555...)"
                value={simCallPhone}
                onChange={(e) => setSimCallPhone(e.target.value)}
                className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                required
              />
              <select
                value={simCallType}
                onChange={(e) => setSimCallType(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="incoming">Incoming Call</option>
                <option value="outgoing">Outgoing Call</option>
                <option value="blocked">Auto-Blocked Call</option>
              </select>

              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-md"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Simulate Call Event</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SECTION 3: SMS & Text Message Monitoring */}
      {subTab === 'sms' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <h4 className="font-bold text-sm text-slate-200">SMS Text Messages & AI Risk Detection</h4>
            </div>

            {/* SMS Filters */}
            <div className="flex items-center space-x-1.5 text-[11px]">
              <span className="text-slate-400 mr-1 flex items-center space-x-1">
                <Filter className="w-3 h-3" />
                <span>Filter:</span>
              </span>
              {['all', 'flagged', 'stranger_danger', 'cyberbullying'].map((f) => (
                <button
                  key={f}
                  onClick={() => setSmsFilter(f as any)}
                  className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-all ${
                    smsFilter === f
                      ? 'bg-purple-600 text-white font-semibold'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                  }`}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* SMS Messages Feed */}
          {filteredSms.length === 0 ? (
            <div className="bg-slate-950 p-8 rounded-xl border border-slate-800 text-center text-slate-400">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-medium">No SMS messages found matching filter for {selectedKid.name}.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSms.map((sms) => (
                <div
                  key={sms.id}
                  className={`bg-slate-950 p-4 rounded-xl border space-y-2 transition-all ${
                    sms.isFlagged
                      ? 'border-red-500/40 bg-red-950/10 shadow-lg shadow-red-500/5'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white">{sms.contactName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({sms.phoneNumber})</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase ${
                          sms.type === 'received' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {sms.type}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {sms.isFlagged && (
                        <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-bold flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                          <span className="uppercase">{sms.riskCategory?.replace('_', ' ')}</span>
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">{sms.timestamp}</span>
                    </div>
                  </div>

                  {/* Text Message Content */}
                  <p className="text-xs text-slate-200 bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 leading-relaxed font-sans">
                    "{sms.messageText}"
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Simulate SMS Form */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <h5 className="font-bold text-xs text-slate-300 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Real-time Text Message / SMS Incident</span>
            </h5>

            <form onSubmit={handleTriggerSimSms} className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Sender Name"
                  value={simSmsName}
                  onChange={(e) => setSimSmsName(e.target.value)}
                  className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Phone Number (+1 555...)"
                  value={simSmsPhone}
                  onChange={(e) => setSimSmsPhone(e.target.value)}
                  className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  required
                />
                <select
                  value={simSmsRisk}
                  onChange={(e) => setSimSmsRisk(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="stranger_danger">Stranger Threat Risk</option>
                  <option value="cyberbullying">Cyberbullying Risk</option>
                  <option value="safe">Normal / Safe Message</option>
                </select>
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Text Message Content..."
                  value={simSmsText}
                  onChange={(e) => setSimSmsText(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center space-x-1 shadow-md shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send SMS Test</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
