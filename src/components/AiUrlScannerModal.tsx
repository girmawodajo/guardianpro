import React, { useState } from 'react';
import { AiUrlAnalysisResult } from '../types';
import { Sparkles, ShieldCheck, AlertTriangle, X, ExternalLink, CheckCircle, ShieldAlert } from 'lucide-react';

interface AiUrlScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  kidAge: number;
  onAddCustomBlockRule?: (url: string) => void;
  onAddCustomAllowRule?: (url: string) => void;
}

export const AiUrlScannerModal: React.FC<AiUrlScannerModalProps> = ({
  isOpen,
  onClose,
  kidAge,
  onAddCustomBlockRule,
  onAddCustomAllowRule,
}) => {
  const [urlInput, setUrlInput] = useState('https://roblox.com');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiUrlAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlInput.trim(),
          kidAge,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to analyze website content');
      }

      const data: AiUrlAnalysisResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error executing AI safety scan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Gemini AI URL Safety Inspector</h3>
              <p className="text-xs text-slate-400">Evaluate any domain or URL for age appropriateness</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          <form onSubmit={handleScan} className="flex gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="e.g. reddit.com, scratch.mit.edu, twitch.tv"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-blue-600/30"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{loading ? 'Scanning...' : 'Scan URL'}</span>
            </button>
          </form>

          {error && <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-xs text-red-300">{error}</div>}

          {/* Results Output */}
          {result && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs text-slate-400">Analyzed Domain</span>
                  <h4 className="font-bold text-white text-base flex items-center space-x-2">
                    <span>{result.domain}</span>
                    <a href={result.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </h4>
                </div>

                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center space-x-1 ${
                    result.rating === 'Safe'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : result.rating === 'Caution'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-red-500/20 text-red-300 border-red-500/40'
                  }`}
                >
                  {result.rating === 'Safe' ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {result.rating} ({result.safetyScore}/100)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Recommended Min Age</span>
                  <span className="font-semibold text-blue-400 text-sm">{result.ageRating}</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Suggested Action</span>
                  <span className="font-semibold text-amber-400 uppercase text-xs">{result.recommendedAction}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-400 block mb-1">AI Safety Summary:</span>
                <p className="text-xs text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-800 leading-relaxed">
                  {result.summary}
                </p>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-400 block mb-1">Key Observations & Risks:</span>
                <ul className="space-y-1">
                  {result.reasons.map((r, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start space-x-1.5">
                      <span className="text-blue-400 font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Actions to add to custom block or allow list */}
              <div className="pt-2 border-t border-slate-800 flex justify-end space-x-2">
                {onAddCustomAllowRule && (
                  <button
                    onClick={() => {
                      onAddCustomAllowRule(result.domain);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-semibold"
                  >
                    + Allow Domain
                  </button>
                )}
                {onAddCustomBlockRule && (
                  <button
                    onClick={() => {
                      onAddCustomBlockRule(result.domain);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 text-xs font-semibold"
                  >
                    + Block Domain
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
