import React, { useState } from 'react';
import { KidProfile } from '../types';
import { Sparkles, Clock, X, Check, BookOpen, Gamepad2, Video, MessageSquare } from 'lucide-react';

interface AiScreenTimeCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  kid: KidProfile;
  onApplyRecommendedLimits: (kidId: string, totalLimitMinutes: number, categoryBreakdown: any[]) => void;
}

export const AiScreenTimeCoachModal: React.FC<AiScreenTimeCoachModalProps> = ({
  isOpen,
  onClose,
  kid,
  onApplyRecommendedLimits,
}) => {
  const [grade, setGrade] = useState('5th Grade');
  const [interests, setInterests] = useState('Coding, Roblox, Educational Videos');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/screen-time-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kidName: kid.name,
          age: kid.age,
          grade,
          interests,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate AI screen time plan');
      }

      const data = await res.json();
      setRecommendations(data);
    } catch (err: any) {
      setError(err.message || 'Error generating recommendations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100 animate-in fade-in zoom-in-95">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Gemini AI Screen Time Coach</h3>
              <p className="text-xs text-slate-400">Tailored digital wellness recommendations for {kid.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <form onSubmit={handleGenerateCoach} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Child Age / Grade</label>
                <input
                  type="text"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="e.g. 5th Grade"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Interests & Hobbies</label>
                <input
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="e.g. Math, Gaming, Drawing"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 shadow-md shadow-indigo-600/30"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{loading ? 'Consulting Gemini Coach...' : 'Generate Recommended Plan'}</span>
            </button>
          </form>

          {error && <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-xs text-red-300">{error}</div>}

          {recommendations && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs text-slate-400">Total Recommended Daily Limit</span>
                <span className="text-base font-bold text-indigo-400">
                  {Math.floor(recommendations.dailyLimitMinutes / 60)}h {recommendations.dailyLimitMinutes % 60}m
                </span>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-400 block mb-2">Category Breakdown:</span>
                <div className="space-y-2">
                  {recommendations.breakdown.map((item: any, idx: number) => (
                    <div key={idx} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-white block">{item.category}</span>
                        <span className="text-[10px] text-slate-400">{item.advice}</span>
                      </div>
                      <span className="font-mono text-indigo-300 font-bold">{item.limitMinutes} mins</span>
                    </div>
                  ))}
                </div>
              </div>

              {recommendations.wellnessTips && (
                <div>
                  <span className="text-xs font-medium text-slate-400 block mb-1">Parent Wellness Tips:</span>
                  <ul className="space-y-1">
                    {recommendations.wellnessTips.map((tip: string, idx: number) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start space-x-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() => {
                    onApplyRecommendedLimits(kid.id, recommendations.dailyLimitMinutes, recommendations.breakdown);
                    onClose();
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Recommendations to {kid.name}'s Profile</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
