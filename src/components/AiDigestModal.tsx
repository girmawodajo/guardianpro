import React, { useState, useEffect } from 'react';
import { KidProfile, SafetyAlert, AiSafetyDigestReport } from '../types';
import { Sparkles, ShieldCheck, AlertTriangle, X, Award, Activity, CheckCircle2, FileText, Download } from 'lucide-react';

interface AiDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  kid: KidProfile;
  alerts: SafetyAlert[];
}

export const AiDigestModal: React.FC<AiDigestModalProps> = ({ isOpen, onClose, kid, alerts }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AiSafetyDigestReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !report && !loading) {
      generateDigest();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const generateDigest = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/safety-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kidName: kid.name,
          age: kid.age,
          screenTimeMinutes: kid.screenTime.usedMinutes,
          categories: kid.screenTime.categories,
          alerts: alerts.filter((a) => a.kidId === kid.id),
          locations: [kid.currentLocation],
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate AI safety digest');
      }

      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl text-slate-100 animate-in fade-in zoom-in-95">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Gemini AI Safety & Wellness Digest</h3>
              <p className="text-xs text-slate-400">Daily digital activity synthesis for {kid.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Sparkles className="w-8 h-8 text-amber-400 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-200">Generating AI Digital Digest...</p>
              <p className="text-xs text-slate-400 mt-1">Synthesizing screen patterns, safety filters & location arrivals</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-950/50 border border-red-500/40 rounded-xl text-xs text-red-300">{error}</div>
          ) : report ? (
            <div className="space-y-4">
              {/* Overall Score Header */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Digital Health Rating</span>
                  <h4 className="text-xl font-extrabold text-white flex items-center space-x-2">
                    <span>{report.overallSafetyRating}</span>
                    <Award className="w-5 h-5 text-amber-400" />
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Wellness Index</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">{report.wellnessScore}/100</span>
                </div>
              </div>

              {/* Summary */}
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-1">Executive Summary</span>
                <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
                  {report.summary}
                </p>
              </div>

              {/* Highlights */}
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-1">Positive Highlights & Safety Achievements</span>
                <div className="space-y-1.5">
                  {report.highlights.map((h, i) => (
                    <div key={i} className="flex items-start space-x-2 text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Factors */}
              {report.riskFactors && report.riskFactors.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-slate-400 block mb-1">Items Needing Parent Guidance</span>
                  <div className="space-y-1.5">
                    {report.riskFactors.map((r, i) => (
                      <div key={i} className="flex items-start space-x-2 text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Advice */}
              <div className="bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-500/30 text-xs">
                <span className="font-semibold text-indigo-300 block mb-1">Gemini AI Screen Time Advice:</span>
                <p className="text-slate-300 leading-relaxed">{report.screenTimeAdvice}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
