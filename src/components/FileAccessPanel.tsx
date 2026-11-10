import React, { useState } from 'react';
import { KidProfile, ChildFileItem, FileCategory } from '../types';
import {
  Folder,
  FileText,
  FileCode,
  Image,
  Video,
  Music,
  HardDrive,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Trash2,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Eye,
  Download,
  Upload,
  FileCheck,
  Ban,
  Archive,
  FolderOpen,
  Info,
  Check,
  X,
  Plus,
} from 'lucide-react';

interface FileAccessPanelProps {
  selectedKid: KidProfile;
  files: ChildFileItem[];
  onUpdateFileStatus: (fileId: string, status: ChildFileItem['status']) => void;
  onUpdateFilePermission: (fileId: string, permission: ChildFileItem['parentPermission']) => void;
  onDeleteFile: (fileId: string) => void;
  onAddSimulatedFile?: (file: Omit<ChildFileItem, 'id'>) => void;
}

export const FileAccessPanel: React.FC<FileAccessPanelProps> = ({
  selectedKid,
  files,
  onUpdateFileStatus,
  onUpdateFilePermission,
  onDeleteFile,
  onAddSimulatedFile,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | 'flagged' | 'malicious' | 'suspicious' | 'safe'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected file for inspection modal
  const [inspectingFile, setInspectingFile] = useState<ChildFileItem | null>(null);

  // Add file simulator form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newCategory, setNewCategory] = useState<FileCategory>('downloads');
  const [newFileSize, setNewFileSize] = useState('5.2');
  const [newTextSnippet, setNewTextSnippet] = useState('');
  const [isScanningNew, setIsScanningNew] = useState(false);

  // Filter files for current child
  const kidFiles = files.filter((f) => f.kidId === selectedKid.id && f.status !== 'deleted');
  const flaggedFiles = kidFiles.filter((f) => f.isFlagged && f.status !== 'quarantined');
  const quarantinedFiles = files.filter((f) => f.kidId === selectedKid.id && f.status === 'quarantined');

  // Storage metrics calculation
  const totalStorageMb = kidFiles.reduce((acc, curr) => acc + curr.fileSizeMb, 0);

  const getCategoryMeta = (cat: FileCategory) => {
    switch (cat) {
      case 'photos':
        return { name: 'Photos', icon: Image, color: 'text-purple-400 bg-purple-500/20 border-purple-500/30' };
      case 'videos':
        return { name: 'Videos', icon: Video, color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' };
      case 'documents':
        return { name: 'Documents', icon: FileText, color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' };
      case 'downloads':
        return { name: 'Downloads', icon: Download, color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30' };
      case 'audio':
        return { name: 'Audio', icon: Music, color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' };
      case 'executables':
        return { name: 'APKs & Apps', icon: FileCode, color: 'text-red-400 bg-red-500/20 border-red-500/30' };
      default:
        return { name: cat, icon: Folder, color: 'text-slate-400 bg-slate-800 border-slate-700' };
    }
  };

  // Filtered files list
  const filteredFiles = kidFiles.filter((f) => {
    if (activeCategory !== 'all' && f.category !== activeCategory) return false;
    if (riskFilter === 'flagged' && !f.isFlagged) return false;
    if (riskFilter === 'malicious' && f.riskLevel !== 'malicious') return false;
    if (riskFilter === 'suspicious' && f.riskLevel !== 'suspicious') return false;
    if (riskFilter === 'safe' && f.riskLevel !== 'safe') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = f.fileName.toLowerCase().includes(q);
      const matchPath = f.filePath.toLowerCase().includes(q);
      const matchSnippet = f.detectedTextSnippet?.toLowerCase().includes(q) || false;
      return matchName || matchPath || matchSnippet;
    }
    return true;
  });

  const handleCreateSimulatedFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    setIsScanningNew(true);
    let isFlagged = false;
    let riskLevel: ChildFileItem['riskLevel'] = 'safe';
    let riskCategory: ChildFileItem['riskCategory'] = 'safe';
    let aiScanSummary = 'Verified safe file addition.';

    try {
      const res = await fetch('/api/ai/file-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: newFileName.trim(),
          category: newCategory,
          fileSizeMb: parseFloat(newFileSize) || 1.0,
          textSnippet: newTextSnippet.trim(),
          kidAge: selectedKid.age,
        }),
      });
      const data = await res.json();
      if (data) {
        isFlagged = data.isFlagged;
        riskLevel = data.riskLevel || 'safe';
        riskCategory = data.riskCategory || 'safe';
        aiScanSummary = data.aiScanSummary || 'Scanned by KidsGuardian File Shield.';
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanningNew(false);
    }

    if (onAddSimulatedFile) {
      onAddSimulatedFile({
        kidId: selectedKid.id,
        fileName: newFileName.trim(),
        category: newCategory,
        fileSizeMb: parseFloat(newFileSize) || 1.0,
        mimeType: newCategory === 'executables' ? 'application/vnd.android.package-archive' : 'application/octet-stream',
        filePath: `/sdcard/${newCategory.charAt(0).toUpperCase() + newCategory.slice(1)}/${newFileName.trim()}`,
        modifiedTimestamp: 'Just now',
        isFlagged,
        riskLevel,
        riskCategory,
        status: isFlagged && riskLevel === 'malicious' ? 'quarantined' : 'normal',
        parentPermission: isFlagged ? 'blocked' : 'allowed',
        aiScanSummary,
        detectedTextSnippet: newTextSnippet.trim() || undefined,
      });
    }

    setNewFileName('');
    setNewTextSnippet('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Storage Capacity */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <FolderOpen className="w-6 h-6 text-amber-400" />
              <h2 className="text-xl font-black text-white tracking-wide">
                Child Device Remote File Access & Malware Vault
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Remote inspection, APK sideload detection, and automated file quarantine for {selectedKid.name}.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Simulate Device File Sync</span>
          </button>
        </div>

        {/* Storage & Security Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Files Monitored</span>
              <HardDrive className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white font-mono">{kidFiles.length} Files</div>
            <p className="text-[11px] text-slate-400 mt-1">Total Size: {totalStorageMb.toFixed(1)} MB</p>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Flagged Security Risks</span>
              <ShieldAlert className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-xl font-bold text-white font-mono flex items-center space-x-2">
              <span className={flaggedFiles.length > 0 ? 'text-red-400' : 'text-emerald-400'}>
                {flaggedFiles.length} Hazards
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {flaggedFiles.length > 0 ? 'Action needed' : 'Storage clean'}
            </p>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Quarantined Vault</span>
              <Archive className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-purple-300 font-mono">{quarantinedFiles.length} Locked</div>
            <p className="text-[11px] text-slate-400 mt-1">Isolated from execution</p>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>AI File Shield</span>
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400 font-mono">Real-Time</div>
            <p className="text-[11px] text-emerald-300 mt-1">APK Sideload & Content Inspection</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
        {/* Category Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeCategory === 'all'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Categories ({kidFiles.length})
          </button>
          {(['executables', 'documents', 'photos', 'videos', 'downloads', 'audio'] as FileCategory[]).map((cat) => {
            const meta = getCategoryMeta(cat);
            const count = kidFiles.filter((f) => f.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeCategory === cat
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <meta.icon className="w-3.5 h-3.5" />
                <span>{meta.name}</span>
                <span className="opacity-60">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search & Risk Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="flex items-center space-x-2 flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search file names, paths, or text snippets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-medium">Risk Filter:</span>
            <button
              onClick={() => setRiskFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                riskFilter === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-800/60 text-slate-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setRiskFilter('flagged')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                riskFilter === 'flagged' ? 'bg-red-600/30 text-red-300 border border-red-500/50' : 'bg-slate-800/60 text-slate-400'
              }`}
            >
              Flagged
            </button>
            <button
              onClick={() => setRiskFilter('malicious')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                riskFilter === 'malicious' ? 'bg-red-600/30 text-red-300 border border-red-500/50' : 'bg-slate-800/60 text-slate-400'
              }`}
            >
              Malicious (APKs)
            </button>
            <button
              onClick={() => setRiskFilter('suspicious')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                riskFilter === 'suspicious' ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50' : 'bg-slate-800/60 text-slate-400'
              }`}
            >
              Suspicious
            </button>
          </div>
        </div>
      </div>

      {/* File Items Grid / List */}
      {filteredFiles.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-slate-400">
          <FileCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
          <p className="font-semibold text-sm">No files found matching your search or filter.</p>
          <p className="text-xs opacity-75 mt-1">Child's filesystem storage is clean and within boundaries.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFiles.map((file) => {
            const catMeta = getCategoryMeta(file.category);
            const isQuarantined = file.status === 'quarantined';

            return (
              <div
                key={file.id}
                className={`bg-slate-900 border rounded-2xl p-5 shadow-xl space-y-4 transition-all relative overflow-hidden ${
                  file.isFlagged && !isQuarantined
                    ? 'border-red-500/50 bg-red-950/10'
                    : isQuarantined
                    ? 'border-purple-500/50 bg-purple-950/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* File Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className={`p-3 rounded-2xl border ${catMeta.color}`}>
                      <catMeta.icon className="w-6 h-6" />
                    </div>

                    <div className="space-y-0.5">
                      <h4 className="font-bold text-sm text-white break-all leading-snug">{file.fileName}</h4>
                      <p className="text-[11px] text-slate-400 font-mono break-all">{file.filePath}</p>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500 pt-0.5">
                        <span>{file.fileSizeMb} MB</span>
                        <span>•</span>
                        <span>{file.modifiedTimestamp}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-col items-end space-y-1">
                    {file.riskLevel === 'malicious' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-bold">
                        MALICIOUS
                      </span>
                    )}
                    {file.riskLevel === 'suspicious' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                        SUSPICIOUS
                      </span>
                    )}
                    {file.riskLevel === 'safe' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                        SAFE
                      </span>
                    )}

                    {isQuarantined && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold">
                        QUARANTINED
                      </span>
                    )}
                  </div>
                </div>

                {/* Optional Image Preview */}
                {file.previewUrl && (
                  <div className="rounded-xl overflow-hidden border border-slate-800 h-32 bg-slate-950 relative">
                    <img src={file.previewUrl} alt={file.fileName} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* AI Safety Analysis Summary */}
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start space-x-2 ${
                    file.isFlagged
                      ? 'bg-red-950/20 border-red-500/30 text-red-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-purple-400" />
                  <div>
                    <span className="font-bold block mb-0.5">AI File Inspector:</span>
                    <p className="leading-relaxed">{file.aiScanSummary}</p>
                    {file.detectedTextSnippet && (
                      <div className="mt-1.5 p-2 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-amber-300">
                        "{file.detectedTextSnippet}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Controls & Quick Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center space-x-1 text-[11px]">
                    <span className="text-slate-400">Permission:</span>
                    <select
                      value={file.parentPermission}
                      onChange={(e) => onUpdateFilePermission(file.id, e.target.value as any)}
                      className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-2 py-1 font-semibold focus:outline-none"
                    >
                      <option value="allowed">Allowed</option>
                      <option value="restricted">Restricted</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Quarantine Button */}
                    <button
                      onClick={() => onUpdateFileStatus(file.id, isQuarantined ? 'normal' : 'quarantined')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                        isQuarantined
                          ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30'
                          : 'bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-purple-600/30'
                      }`}
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>{isQuarantined ? 'Un-Quarantine' : 'Quarantine Vault'}</span>
                    </button>

                    {/* Remote Wipe / Delete */}
                    <button
                      onClick={() => onDeleteFile(file.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 text-xs font-bold flex items-center space-x-1 transition-all"
                      title="Permanently remove file from child device"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remote Wipe</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SIMULATE FILE ADDITION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base text-white">Simulate Device File Sync</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSimulatedFile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">File Name</label>
                <input
                  type="text"
                  placeholder="e.g. Fortnite_Free_VBucks.apk or Math_Test.pdf"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as FileCategory)}
                    className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
                  >
                    <option value="executables">APK / Executable</option>
                    <option value="documents">Document (PDF/DOCX)</option>
                    <option value="photos">Photo / Image</option>
                    <option value="videos">Video</option>
                    <option value="downloads">Download</option>
                    <option value="audio">Audio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">File Size (MB)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newFileSize}
                    onChange={(e) => setNewFileSize(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Extracted Text or Metadata Snippet
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 'Package name: com.unverified.cheat' or 'Midterm answer key Q1: A...'"
                  value={newTextSnippet}
                  onChange={(e) => setNewTextSnippet(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isScanningNew || !newFileName.trim()}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center space-x-2"
                >
                  {isScanningNew ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isScanningNew ? 'AI Scanning...' : 'Sync & Scan File'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
