import React, { useState } from 'react';
import { KidProfile, GeofenceZone, LocationPoint } from '../types';
import { MapPin, Navigation, Compass, Layers, ShieldCheck, Zap, AlertTriangle, Battery, User } from 'lucide-react';

interface InteractiveMapProps {
  kids: KidProfile[];
  geofences: GeofenceZone[];
  selectedKidId: string;
  onSelectKid: (id: string) => void;
  locationHistory: LocationPoint[];
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onAddGeofenceClick: () => void;
  onUseRealLocation?: () => void;
  usingRealLocation?: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  kids,
  geofences,
  selectedKidId,
  onSelectKid,
  locationHistory,
  isSimulating,
  onToggleSimulation,
  onAddGeofenceClick,
  onUseRealLocation,
  usingRealLocation,
}) => {
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'terrain'>('streets');
  const [showGeofences, setShowGeofences] = useState(true);
  const [showHistoryPath, setShowHistoryPath] = useState(true);
  const [activeMarkerInfo, setActiveMarkerInfo] = useState<string | null>(selectedKidId);

  // SVG coordinate transformation mapping lat/lng to map SVG viewBox (800x500)
  // Center roughly around SF coordinates (37.77, -122.42)
  const mapCenterLat = 37.7720;
  const mapCenterLng = -122.4220;
  const latSpan = 0.035;
  const lngSpan = 0.045;

  const getSvgCoords = (lat: number, lng: number) => {
    const x = ((lng - (mapCenterLng - lngSpan / 2)) / lngSpan) * 800;
    const y = (((mapCenterLat + latSpan / 2) - lat) / latSpan) * 500;
    return { x: Math.max(40, Math.min(760, x)), y: Math.max(40, Math.min(460, y)) };
  };

  const selectedKid = kids.find((k) => k.id === selectedKidId) || kids[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative text-slate-100">
      {/* Map Header Overlay Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-700/60 shadow-lg">
        {/* Kid Switcher Chips */}
        <div className="flex items-center space-x-2">
          {kids.map((kid) => {
            const isSelected = kid.id === selectedKidId;
            return (
              <button
                key={kid.id}
                onClick={() => {
                  onSelectKid(kid.id);
                  setActiveMarkerInfo(kid.id);
                }}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                <img src={kid.avatar} alt={kid.name} className="w-5 h-5 rounded-full object-cover border border-white/40" />
                <span>{kid.name.split(' ')[0]}</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Simulation Movement Toggle */}
          <button
            onClick={onToggleSimulation}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isSimulating
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/30 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30'
            }`}
            title="Simulate real-time walking movement for kids"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isSimulating ? 'Simulating Movement...' : 'Simulate GPS Walk'}</span>
          </button>

          {/* Real Browser Geolocation button */}
          {onUseRealLocation && (
            <button
              onClick={onUseRealLocation}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                usingRealLocation
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Pin real browser GPS position"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{usingRealLocation ? 'Live GPS Active' : 'Use My GPS'}</span>
            </button>
          )}

          {/* Layers button */}
          <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setMapStyle('streets')}
              className={`px-2 py-1 text-xs rounded-md ${mapStyle === 'streets' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Dark
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`px-2 py-1 text-xs rounded-md ${mapStyle === 'satellite' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Satellite
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Map Stage (SVG Vector Map Canvas) */}
      <div className="w-full h-[460px] relative bg-slate-950 overflow-hidden select-none">
        <svg className="w-full h-full" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
          {/* Map Base Textures / Grid Lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke={mapStyle === 'satellite' ? '#1e293b' : '#0f172a'} strokeWidth="1" />
            </pattern>

            <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background rect */}
          <rect width="800" height="500" fill={mapStyle === 'satellite' ? '#090d16' : '#090e17'} />
          <rect width="800" height="500" fill="url(#grid)" opacity="0.6" />

          {/* Simulated Roads / Highways */}
          <path d="M 50,250 C 200,220 400,280 750,230" stroke="#1e293b" strokeWidth="12" fill="none" strokeLinecap="round" />
          <path d="M 50,250 C 200,220 400,280 750,230" stroke="#334155" strokeWidth="6" fill="none" strokeLinecap="round" />

          <path d="M 380,30 L 390,470" stroke="#1e293b" strokeWidth="10" fill="none" />
          <path d="M 380,30 L 390,470" stroke="#334155" strokeWidth="4" fill="none" />

          <path d="M 150,100 C 300,120 500,80 680,140" stroke="#1e293b" strokeWidth="8" fill="none" />
          <path d="M 150,100 C 300,120 500,80 680,140" stroke="#334155" strokeWidth="3" fill="none" />

          {/* Secondary streets */}
          <line x1="100" y1="180" x2="700" y2="180" stroke="#1e293b" strokeWidth="3" strokeDasharray="4 4" />
          <line x1="100" y1="340" x2="700" y2="340" stroke="#1e293b" strokeWidth="3" strokeDasharray="4 4" />
          <line x1="220" y1="80" x2="220" y2="420" stroke="#1e293b" strokeWidth="3" strokeDasharray="4 4" />
          <line x1="580" y1="80" x2="580" y2="420" stroke="#1e293b" strokeWidth="3" strokeDasharray="4 4" />

          {/* Park Green Area */}
          <path
            d="M 280,300 C 320,290 380,310 390,360 C 400,410 320,440 270,410 C 240,380 250,320 280,300 Z"
            fill="#064e3b"
            opacity="0.35"
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <text x="310" y="360" fill="#34d399" fontSize="11" fontWeight="600" opacity="0.8">
            Sunset Park Zone
          </text>

          {/* School Area */}
          <path
            d="M 450,120 C 520,110 570,140 560,200 C 540,240 460,230 440,190 C 430,150 440,130 450,120 Z"
            fill="#1e1b4b"
            opacity="0.4"
            stroke="#6366f1"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <text x="470" y="165" fill="#818cf8" fontSize="11" fontWeight="600" opacity="0.8">
            Oakwood Elementary
          </text>

          {/* Geofence Circles */}
          {showGeofences &&
            geofences.map((gf) => {
              const coords = getSvgCoords(gf.lat, gf.lng);
              const isAssignedToSelected = gf.assignedKidIds.includes(selectedKidId as any);
              return (
                <g key={gf.id}>
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={gf.radiusMeters / 6}
                    fill={gf.type === 'home' ? '#3b82f6' : gf.type === 'school' ? '#6366f1' : '#10b981'}
                    fillOpacity="0.12"
                    stroke={gf.type === 'home' ? '#60a5fa' : gf.type === 'school' ? '#818cf8' : '#34d399'}
                    strokeWidth={isAssignedToSelected ? '2' : '1'}
                    strokeDasharray={isAssignedToSelected ? 'none' : '4 4'}
                  />
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r="4"
                    fill={gf.type === 'home' ? '#60a5fa' : gf.type === 'school' ? '#818cf8' : '#34d399'}
                  />
                  <text
                    x={coords.x}
                    y={coords.y - gf.radiusMeters / 6 - 6}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="10"
                    fontWeight="500"
                  >
                    {gf.name} ({gf.radiusMeters}m)
                  </text>
                </g>
              );
            })}

          {/* Location History Dotted Path Line */}
          {showHistoryPath && locationHistory.length > 1 && (
            <g>
              <path
                d={locationHistory
                  .map((pt, idx) => {
                    const c = getSvgCoords(pt.lat, pt.lng);
                    return `${idx === 0 ? 'M' : 'L'} ${c.x} ${c.y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#60a5fa"
                strokeWidth="2.5"
                strokeDasharray="4 4"
                opacity="0.6"
              />
              {locationHistory.map((pt, idx) => {
                const c = getSvgCoords(pt.lat, pt.lng);
                return (
                  <circle key={idx} cx={c.x} cy={c.y} r="3" fill="#93c5fd" opacity="0.7" />
                );
              })}
            </g>
          )}

          {/* Kids Marker Icons */}
          {kids.map((kid) => {
            const coords = getSvgCoords(kid.currentLocation.lat, kid.currentLocation.lng);
            const isSelected = kid.id === selectedKidId;

            return (
              <g
                key={kid.id}
                transform={`translate(${coords.x}, ${coords.y})`}
                className="cursor-pointer transition-all duration-500"
                onClick={() => {
                  onSelectKid(kid.id);
                  setActiveMarkerInfo(activeMarkerInfo === kid.id ? null : kid.id);
                }}
              >
                {/* Pulse Ring */}
                <circle r={isSelected ? '28' : '20'} fill={isSelected ? '#2563eb' : '#475569'} opacity="0.25">
                  <animate attributeName="r" values={isSelected ? '24;34;24' : '18;24;18'} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0.05;0.3" dur="2s" repeatCount="indefinite" />
                </circle>

                {/* Outer Pin Halo */}
                <circle
                  r={isSelected ? '18' : '15'}
                  fill={isSelected ? '#1d4ed8' : '#334155'}
                  stroke={isSelected ? '#60a5fa' : '#94a3b8'}
                  strokeWidth="2.5"
                />

                {/* Kid Avatar Clipping */}
                <foreignObject x={isSelected ? -14 : -12} y={isSelected ? -14 : -12} width={isSelected ? 28 : 24} height={isSelected ? 28 : 24}>
                  <img
                    src={kid.avatar}
                    alt={kid.name}
                    className="w-full h-full rounded-full object-cover pointer-events-none border border-white"
                  />
                </foreignObject>

                {/* Label Pin Badge */}
                <g transform="translate(0, 26)">
                  <rect
                    x="-40"
                    y="0"
                    width="80"
                    height="18"
                    rx="9"
                    fill={isSelected ? '#1e40af' : '#0f172a'}
                    stroke={isSelected ? '#3b82f6' : '#334155'}
                    strokeWidth="1"
                  />
                  <text x="0" y="12" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="600">
                    {kid.name.split(' ')[0]}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Selected Kid Location Floating Card Info */}
        {selectedKid && (
          <div className="absolute bottom-4 left-4 z-20 max-w-sm bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-slate-700 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-3">
                <img src={selectedKid.avatar} alt={selectedKid.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500" />
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                    {selectedKid.name}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/30">
                      GPS Live
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-blue-400" />
                    {selectedKid.currentLocation.address}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center space-x-1.5">
                <Battery className="w-4 h-4 text-emerald-400" />
                <span>{selectedKid.batteryLevel}% Battery</span>
              </div>
              <div className="flex items-center space-x-1 text-slate-400">
                <Navigation className="w-3.5 h-3.5 text-indigo-400" />
                <span>Updated {selectedKid.currentLocation.lastUpdated}</span>
              </div>
            </div>
          </div>
        )}

        {/* Map Right Floating Tool Sidebar */}
        <div className="absolute bottom-4 right-4 z-20 flex flex-col space-y-2">
          <button
            onClick={onAddGeofenceClick}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all border border-blue-400/30"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>+ New Safe Zone</span>
          </button>

          <button
            onClick={() => setShowGeofences(!showGeofences)}
            className={`p-2 rounded-xl border text-xs font-medium backdrop-blur-md flex items-center justify-center space-x-1.5 ${
              showGeofences ? 'bg-slate-800/90 text-blue-400 border-blue-500/40' : 'bg-slate-900/80 text-slate-400 border-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Geofences ({geofences.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
