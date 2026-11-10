import React, { useState } from 'react';
import { KidProfile } from '../types';
import { UserPlus, X } from 'lucide-react';

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChild: (kid: KidProfile) => void;
}

export const AddChildModal: React.FC<AddChildModalProps> = ({ isOpen, onClose, onAddChild }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState(11);
  const [deviceModel, setDeviceModel] = useState('iPhone 14');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newId = name.toLowerCase().replace(/\s+/g, '') as any;

    const newKid: KidProfile = {
      id: newId,
      name: name.trim(),
      age: Number(age),
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      deviceModel,
      batteryLevel: 95,
      isOnline: true,
      isDeviceLocked: false,
      isInternetPaused: false,
      currentLocation: {
        address: 'Home (Residence)',
        lat: 37.779,
        lng: -122.418,
        status: 'at_home',
        lastUpdated: 'Just now',
      },
      screenTime: {
        usedMinutes: 45,
        dailyLimitMinutes: age < 12 ? 120 : 180,
        categories: [
          { category: 'Educational', usedMinutes: 30, limitMinutes: 120, iconName: 'GraduationCap', color: '#10b981' },
          { category: 'Gaming', usedMinutes: 15, limitMinutes: 45, iconName: 'Gamepad2', color: '#f59e0b' },
          { category: 'Video Streaming', usedMinutes: 0, limitMinutes: 45, iconName: 'Video', color: '#6366f1' },
          { category: 'Social & Chat', usedMinutes: 0, limitMinutes: 15, iconName: 'MessageSquare', color: '#ec4899' },
        ],
      },
      schedules: [
        {
          id: 'sch-' + Date.now(),
          name: 'Bedtime Downtime',
          startTime: '20:30',
          endTime: '07:00',
          days: ['Mon', 'Tue', 'Wed', 'Thu', 'Sun'],
          isActive: true,
          type: 'bedtime',
        },
      ],
      contentFilters: {
        strictnessLevel: 'strict',
        safeSearchEnforced: true,
        youtubeRestrictedMode: true,
        blockedCategories: [
          { id: 'cat-adult', name: 'Adult Content', description: 'Blocks explicit media', isBlocked: true },
          { id: 'cat-gambling', name: 'Gambling', description: 'Blocks betting', isBlocked: true },
        ],
        customBlockedWebsites: ['omegle.com'],
        customAllowedWebsites: ['khanacademy.org'],
      },
      installedApps: [
        { id: 'app-duo', name: 'Duolingo', icon: 'Languages', category: 'education', status: 'allowed', usedMinutesToday: 30 },
        { id: 'app-roblox', name: 'Roblox', icon: 'Gamepad2', category: 'games', status: 'time_limited', dailyLimitMinutes: 45, usedMinutesToday: 15 },
      ],
    };

    onAddChild(newKid);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-slate-100 animate-in fade-in zoom-in-95">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Add New Child Profile</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Child's Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Noah Miller"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Age</label>
              <input
                type="number"
                min="3"
                max="18"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Device Model</label>
              <input
                type="text"
                value={deviceModel}
                onChange={(e) => setDeviceModel(e.target.value)}
                placeholder="e.g. iPad Air, Galaxy Tab"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md shadow-blue-600/30"
            >
              Save Child Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
