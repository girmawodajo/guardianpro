import React, { useState, useEffect } from 'react';
import { RouteMovementRecord, KidProfile } from '../types';
import {
  History,
  Play,
  Pause,
  RotateCcw,
  Download,
  MapPin,
  Navigation,
  Footprints,
  Car,
  Activity,
  Calendar,
  Filter,
  Trash2,
  Clock,
  Radio,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface RouteHistoryPanelProps {
  records: RouteMovementRecord[];
  kids: KidProfile[];
  selectedKidId: string;
  onSelectKid: (id: string) => void;
  onClearHistory?: () => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
}

export const RouteHistoryPanel: React.FC<RouteHistoryPanelProps> = ({
  records,
  kids,
  selectedKidId,
  onSelectKid,
  onClearHistory,
  isSimulating,
  onToggleSimulation,
}) => {
  const [activeDateFilter, setActiveDateFilter] = useState<string>('all');
  const [activeActivityFilter, setActiveActivityFilter] = useState<string>('all');
  const [playbackIndex, setPlaybackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const selectedKid = kids.find((k) => k.id === selectedKidId) || kids[0];

  // Filter records by selected kid and filter criteria
  const kidRecords = records
    .filter((r) => r.kidId === selectedKidId)
    .filter((r) => (activeActivityFilter === 'all' ? true : r.activity === activeActivityFilter));

  // Auto playback effect
  useEffect(() => {
    let timer: any;
    if (isPlaying && kidRecords.length > 0) {
      timer = setInterval(() => {
        setPlaybackIndex((prev) => {
          if (prev >= kidRecords.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500 / playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, kidRecords.length, playbackSpeed]);

  // Calculate distance & stats
  const totalPoints = kidRecords.length;
  const currentRecord = kidRecords[playbackIndex] || kidRecords[0];

  const peakSpeed = kidRecords.reduce((max, r) => Math.max(max, r.speedKmH), 0);
  const avgSpeed =
    kidRecords.length > 0
      ? (kidRecords.reduce((sum, r) => sum + r.speedKmH, 0) / kidRecords.length).toFixed(1)
      : '0.0';

  // Export CSV handler
  const handleExportCsv = () => {
    if (kidRecords.length === 0) return;
    const headers = 'ID,Kid,Timestamp,Date,Latitude,Longitude,Speed_kmh,Activity,Location_Name,Battery\n';
    const rows = kidRecords
      .map(
        (r) =>
          `"${r.id}","${selectedKid.name}","${r.timestamp}","${r.date}",${r.lat},${r.lng},${r.speedKmH},"${r.activity}","${r.locationName.replace(/"/g, '""')}",${r.batteryLevel}%`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedKid.name.toLowerCase().replace(/\s+/g, '_')}_route_history.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActivityBadge = (act: string) => {
    switch (act) {
      case 'walking':
        return (
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center space-x-1">
            <Footprints className="w-3 h-3" />
            <span>Walking</span>
          </span>
        );
      case 'driving':
        return (
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center space-x-1">
            <Car className="w-3 h-3" />
            <span>Vehicle / Bus</span>
          </span>
        );
      case 'cycling':
        return (
          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center space-x-1">
            <Activity className="w-3 h-3" />
            <span>Cycling</span>
          </span>
        );
      default:
        return (
          <span className="bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center space-x-1">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>Stationary</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-6 shadow-2xl text-slate-100">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              Route History & Movement Logs
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                <span>REC LIVE</span>
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Continuous GPS tracking records every movement with speed & timeline playback
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleSimulation}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border transition-all ${
              isSimulating
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-amber-500/30'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isSimulating ? 'Recording Movement Walk...' : 'Simulate & Record Walk'}</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={kidRecords.length === 0}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Movement Stats Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium block">Total Recorded Waypoints</span>
          <span className="text-xl font-bold text-white font-mono mt-0.5 block">{totalPoints} points</span>
        </div>
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium block">Peak Speed</span>
          <span className="text-xl font-bold text-amber-400 font-mono mt-0.5 block">{peakSpeed.toFixed(1)} km/h</span>
        </div>
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium block">Average Moving Speed</span>
          <span className="text-xl font-bold text-blue-400 font-mono mt-0.5 block">{avgSpeed} km/h</span>
        </div>
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium block">GPS Status & Battery</span>
          <span className="text-xl font-bold text-emerald-400 font-mono mt-0.5 block flex items-center space-x-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{selectedKid.batteryLevel}% Bat</span>
          </span>
        </div>
      </div>

      {/* Interactive Timeline Route Replay Controller */}
      {kidRecords.length > 0 && (
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Animated Route Playback</span>
              </span>
              {currentRecord && (
                <span className="text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded text-[11px]">
                  Step {playbackIndex + 1} / {kidRecords.length} • {currentRecord.timestamp}
                </span>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center space-x-1 shadow-md"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play Path'}</span>
              </button>

              <button
                onClick={() => setPlaybackIndex(0)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700"
                title="Reset Playback to Start"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Speed Buttons */}
              <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                {[1, 2, 5].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`px-2 py-0.5 rounded-md font-mono ${
                      playbackSpeed === speed ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline Slider Scrubber */}
          <input
            type="range"
            min="0"
            max={kidRecords.length - 1}
            value={playbackIndex}
            onChange={(e) => setPlaybackIndex(Number(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer"
          />

          {/* Current Waypoint Snapshot Box */}
          {currentRecord && (
            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between text-xs gap-2">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">{currentRecord.locationName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Lat: {currentRecord.lat.toFixed(4)}, Lng: {currentRecord.lng.toFixed(4)}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {getActivityBadge(currentRecord.activity)}
                <span className="font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[11px]">
                  {currentRecord.speedKmH} km/h
                </span>
                <span className="text-slate-400 text-[11px] font-mono">{currentRecord.timestamp}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Movement Log Data Table */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <h4 className="font-bold text-sm text-slate-200 flex items-center space-x-2">
            <Footprints className="w-4 h-4 text-emerald-400" />
            <span>Chronological Movement Log</span>
          </h4>

          {/* Activity Filter Chips */}
          <div className="flex items-center space-x-1.5 text-[11px]">
            <span className="text-slate-400 mr-1 flex items-center space-x-1">
              <Filter className="w-3 h-3" />
              <span>Filter:</span>
            </span>
            {['all', 'walking', 'driving', 'stationary'].map((act) => (
              <button
                key={act}
                onClick={() => setActiveActivityFilter(act)}
                className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-all ${
                  activeActivityFilter === act
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                {act}
              </button>
            ))}
          </div>
        </div>

        {kidRecords.length === 0 ? (
          <div className="bg-slate-950 p-8 rounded-xl border border-slate-800 text-center text-slate-400">
            <Navigation className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-medium">No recorded movements found matching filter.</p>
            <p className="text-[10px] text-slate-500 mt-1">Start "Simulate GPS Walk" to record continuous movements live.</p>
          </div>
        ) : (
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-inner">
            <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-800 text-xs">
              {kidRecords.map((rec, idx) => (
                <div
                  key={rec.id}
                  onClick={() => setPlaybackIndex(idx)}
                  className={`p-3 flex items-center justify-between hover:bg-slate-900/80 transition-all cursor-pointer ${
                    playbackIndex === idx ? 'bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-[10px] text-slate-500 w-5 text-right">{idx + 1}</span>
                    <div>
                      <h5 className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                        {rec.locationName}
                      </h5>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {rec.lat.toFixed(4)}, {rec.lng.toFixed(4)} • ±{rec.accuracyMeters}m
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {getActivityBadge(rec.activity)}
                    <span className="font-mono text-xs text-amber-400 font-semibold w-16 text-right">
                      {rec.speedKmH} km/h
                    </span>
                    <span className="font-mono text-[11px] text-slate-400 w-20 text-right">{rec.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
