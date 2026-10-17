import React, { useState } from 'react';
import { X, Search, Database, ExternalLink, ShieldCheck, Download, AlertTriangle, Layers } from 'lucide-react';
import { evidenceCatalogueService, EvidenceDatasetItem } from '../services/evidenceCatalogueService';
import { EvidenceState, EvidenceCategory } from '../types/evidence';

interface EvidenceCatalogueModalProps {
  isOpen: boolean;
  onClose: () => void;
  theaterId: string;
  theaterName: string;
}

export const EvidenceCatalogueModal: React.FC<EvidenceCatalogueModalProps> = ({
  isOpen,
  onClose,
  theaterId,
  theaterName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<EvidenceState | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<EvidenceCategory | 'ALL'>('ALL');

  if (!isOpen) return null;

  const allDatasets = evidenceCatalogueService.getDatasetsByTheater(theaterId);
  const stateCounts = evidenceCatalogueService.getDatasetCountByState(theaterId);

  const filteredDatasets = allDatasets.filter((ds) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      ds.name.toLowerCase().includes(q) ||
      ds.source.toLowerCase().includes(q) ||
      ds.licence.toLowerCase().includes(q) ||
      ds.limitations.toLowerCase().includes(q) ||
      ds.category.toLowerCase().includes(q);

    const matchesState = selectedState === 'ALL' || ds.evidenceState === selectedState;
    const matchesCat = selectedCategory === 'ALL' || ds.category === selectedCategory;

    return matchesQuery && matchesState && matchesCat;
  });

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(filteredDatasets, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeline_evidence_catalogue_${theaterId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Geospatial Evidence Catalogue</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-bold uppercase">
                  {theaterName}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Unified provenance register for satellite imagery, observed extent, field reports &amp; models.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* State Breakdown Counter Bar */}
        <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-slate-400 text-[11px] font-bold">Evidence State Counts:</span>
          {(['OBSERVED', 'OFFICIAL', 'REPORTED', 'MODELLED', 'SIMULATED'] as EvidenceState[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedState(selectedState === st ? 'ALL' : st)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedState === st
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span>{st}</span>
              <span className="px-1 py-0.2 rounded bg-slate-800/80 text-white font-mono text-[9px]">
                {stateCounts[st] || 0}
              </span>
            </button>
          ))}
          {selectedState !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedState('ALL')}
              className="text-[10px] text-cyan-400 hover:underline ml-auto cursor-pointer"
            >
              Reset State Filter
            </button>
          )}
        </div>

        {/* Search & Category Bar */}
        <div className="p-4 px-6 border-b border-slate-800 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search datasets by provider, name, licence, or limitation..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="button"
            onClick={handleExportJson}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>
        </div>

        {/* Dataset List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-700">
          {filteredDatasets.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-mono">
              No matching datasets found for "{searchQuery}".
            </div>
          ) : (
            filteredDatasets.map((ds) => (
              <div
                key={ds.id}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{ds.name}</span>
                      {ds.isPreEvent && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-700">
                          Pre-Event Baseline
                        </span>
                      )}
                      {ds.isPostEvent && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-700">
                          Post-Disaster Impact
                        </span>
                      )}
                    </h4>
                    <span className="text-[11px] font-mono text-cyan-300">{ds.source}</span>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${
                      ds.evidenceState === 'OBSERVED'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        : ds.evidenceState === 'OFFICIAL'
                        ? 'bg-blue-950 text-blue-300 border-blue-700'
                        : ds.evidenceState === 'SIMULATED'
                        ? 'bg-purple-950 text-purple-300 border-purple-700'
                        : 'bg-amber-950 text-amber-300 border-amber-700'
                    }`}
                  >
                    {ds.evidenceState}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
                  <div>
                    <span className="text-slate-500 block">Acquisition Date:</span>
                    <strong className="text-slate-200">{new Date(ds.acquisitionDate).toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Geographic Coverage:</span>
                    <strong className="text-slate-200">{ds.geographicCoverage}</strong>
                  </div>
                  {ds.spatialResolution && (
                    <div>
                      <span className="text-slate-500 block">Spatial Resolution:</span>
                      <strong className="text-cyan-300">{ds.spatialResolution}</strong>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500 block">Licence &amp; Attribution:</span>
                    <strong className="text-slate-200">{ds.licence}</strong>
                  </div>
                </div>

                {/* Freshness & Limitations */}
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-850 text-[11px] font-sans space-y-1">
                  <div>
                    <strong className="text-slate-300 font-mono text-[10px] uppercase">Data Freshness: </strong>
                    <span className="text-slate-400">{ds.freshness}</span>
                  </div>
                  <div>
                    <strong className="text-amber-400 font-mono text-[10px] uppercase">Disclosed Limitations: </strong>
                    <span className="text-slate-400">{ds.limitations}</span>
                  </div>
                </div>

                {ds.sourceUrl && (
                  <div className="pt-1 flex justify-end">
                    <a
                      href={ds.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
                    >
                      <span>Inspect Official Source Record</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 px-6 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>{filteredDatasets.length} datasets catalogued (0 unverified fabrications)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs cursor-pointer"
          >
            Close Catalogue
          </button>
        </div>
      </div>
    </div>
  );
};
