import React, { useState } from 'react';
import { GeofenceZone, KidId } from '../types';
import { MapPin, X, ShieldCheck, Home, GraduationCap, Trees, Navigation } from 'lucide-react';

interface AddGeofenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGeofence: (geofence: GeofenceZone) => void;
}

export const AddGeofenceModal: React.FC<AddGeofenceModalProps> = ({ isOpen, onClose, onAddGeofence }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'home' | 'school' | 'park' | 'relatives' | 'custom'>('school');
  const [radiusMeters, setRadiusMeters] = useState(250);
  const [notifyOnArrival, setNotifyOnArrival] = useState(true);
  const [notifyOnDeparture, setNotifyOnDeparture] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Default coords near center
    const defaultCoords =
      type === 'school'
        ? { lat: 37.7749, lng: -122.4194 }
        : type === 'park'
        ? { lat: 37.765, lng: -122.432 }
        : { lat: 37.779, lng: -122.418 };

    const newZone: GeofenceZone = {
      id: 'geo-' + Date.now(),
      name: name.trim(),
      type,
      lat: defaultCoords.lat,
      lng: defaultCoords.lng,
      radiusMeters,
      notifyOnArrival,
      notifyOnDeparture,
      assignedKidIds: ['leo', 'maya'],
    };

    onAddGeofence(newZone);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-slate-100 animate-in fade-in zoom-in-95">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Create New Safe Geofence Zone</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Zone Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Lincoln High School, Soccer Field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Zone Category</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: 'school', label: 'School', icon: GraduationCap },
                { key: 'home', label: 'Home', icon: Home },
                { key: 'park', label: 'Park', icon: Trees },
                { key: 'custom', label: 'Custom', icon: MapPin },
              ].map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setType(cat.key as any)}
                    className={`flex flex-col items-center p-2 rounded-xl border text-xs font-semibold ${
                      type === cat.key ? 'bg-blue-600/20 text-blue-300 border-blue-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1 text-xs text-slate-400">
              <label className="font-medium">Safety Radius (Meters)</label>
              <span className="font-mono text-blue-400 font-bold">{radiusMeters}m</span>
            </div>
            <input
              type="range"
              min="100"
              max="1000"
              step="50"
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="flex items-center space-x-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={notifyOnArrival}
                onChange={(e) => setNotifyOnArrival(e.target.checked)}
                className="rounded accent-blue-500"
              />
              <span>Send notification when child ARRIVES</span>
            </label>
            <label className="flex items-center space-x-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={notifyOnDeparture}
                onChange={(e) => setNotifyOnDeparture(e.target.checked)}
                className="rounded accent-blue-500"
              />
              <span>Send notification when child LEAVES</span>
            </label>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md shadow-blue-600/30"
            >
              Save Safe Geofence Zone
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
