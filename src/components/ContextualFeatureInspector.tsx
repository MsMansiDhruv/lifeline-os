import React, { useState } from 'react';
import { X, MapPin, ShieldCheck, Activity, ArrowRight, Database, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { BridgeIcon } from './common/TacticalIcons';
import { EvidenceClass, EVIDENCE_CLASS_CONFIG } from '../types/evidence';

export interface EvidenceLedgerEntry {
  source?: string;
  date?: string;
  method?: string;
  limitation?: string;
  parentData?: string;
}

export interface InspectedFeatureMetric {
  label: string;
  value: string;
  highlight?: boolean;
  color?: string;
  ledger?: EvidenceLedgerEntry;
}

export interface InspectedFeatureData {
  id: string;
  type: 'chokepoint' | 'village' | 'facility' | 'intervention';
  title: string;
  subtitle?: string;
  coordinates: [number, number];
  statusText: string;
  statusColor: 'rose' | 'amber' | 'emerald' | 'cyan' | 'purple';
  evidenceClass: EvidenceClass;
  dataState: 'LIVE' | 'STALE' | 'PARTIAL' | 'UNAVAILABLE' | 'SIMULATED';
  metrics: InspectedFeatureMetric[];
  description: string;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

interface ContextualFeatureInspectorProps {
  feature: InspectedFeatureData | null;
  onClose: () => void;
}

export const ContextualFeatureInspector: React.FC<ContextualFeatureInspectorProps> = ({
  feature,
  onClose,
}) => {
  const [selectedMetricIdx, setSelectedMetricIdx] = useState<number | null>(null);

  if (!feature) return null;

  const colorStyles = {
    rose: 'bg-rose-950/90 text-rose-300 border-rose-700/80',
    amber: 'bg-amber-950/90 text-amber-300 border-amber-700/80',
    emerald: 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80',
    cyan: 'bg-cyan-950/90 text-cyan-300 border-cyan-700/80',
    purple: 'bg-purple-950/90 text-purple-300 border-purple-700/80',
  }[feature.statusColor];

  const evConf = EVIDENCE_CLASS_CONFIG[feature.evidenceClass] || EVIDENCE_CLASS_CONFIG.UNKNOWN;
  const activeMetric = selectedMetricIdx !== null ? feature.metrics[selectedMetricIdx] : null;

  return (
    <div className="fixed bottom-6 right-6 z-40 w-84 sm:w-96 max-h-[85vh] overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl text-slate-100 p-4 select-none animate-in fade-in slide-in-from-bottom-4">
      {/* Header with Type & Close */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-cyan-400 shrink-0">
            {feature.type === 'chokepoint' && <BridgeIcon size={16} color="#f59e0b" />}
            {feature.type === 'facility' && <Activity className="w-4 h-4 text-rose-400" />}
            {feature.type === 'village' && <MapPin className="w-4 h-4 text-emerald-400" />}
            {feature.type === 'intervention' && <ShieldCheck className="w-4 h-4 text-cyan-400" />}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-white break-words leading-snug">{feature.title}</h4>
            {feature.subtitle && (
              <p className="text-[11px] text-slate-400 break-words">{feature.subtitle}</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          title="Close inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Badges: Status + Evidence Class (Requirement A) + Data State */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${colorStyles}`}>
          {feature.statusText}
        </span>
        <span
          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${evConf.badgeBg} ${evConf.badgeText} ${evConf.badgeBorder} flex items-center gap-1`}
          title={`Evidence Provenance Tier: ${evConf.label}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${evConf.dotColor}`}></span>
          {evConf.label}
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          STATE: {feature.dataState}
        </span>
      </div>

      {/* Requirement B: Evidence Ledger Instructions */}
      <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1 text-cyan-400/90 font-mono">
          <Database className="w-3 h-3" />
          Click any metric for Evidence Ledger
        </span>
        {selectedMetricIdx !== null && (
          <button
            type="button"
            onClick={() => setSelectedMetricIdx(null)}
            className="text-xs text-slate-500 hover:text-slate-300 font-mono"
          >
            Close Ledger
          </button>
        )}
      </div>

      {/* Key Metrics Grid with Clickable Evidence Ledger */}
      <div className="grid grid-cols-2 gap-2 mt-1.5 text-xs">
        {feature.metrics.map((m, idx) => {
          const isSelected = selectedMetricIdx === idx;
          const hasLedger = Boolean(m.ledger && (m.ledger.source || m.ledger.method));
          return (
            <button
              type="button"
              key={idx}
              onClick={() => setSelectedMetricIdx(isSelected ? null : idx)}
              className={`p-2 rounded-xl text-left border transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-cyan-950/60 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                  : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 block font-medium truncate">{m.label}</span>
                {hasLedger ? (
                  <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-cyan-300">
                    audit
                  </span>
                ) : (
                  <span className="text-[9px] font-mono px-1 rounded bg-zinc-800 text-zinc-400">
                    ?
                  </span>
                )}
              </div>
              <span className={`text-sm font-bold mt-0.5 block ${m.color || 'text-white'}`}>
                {m.value}
              </span>
            </button>
          );
        })}
      </div>

      {/* Requirement B: Expanded Evidence Ledger Details */}
      {activeMetric && (
        <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-cyan-800/60 text-[11px] animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <span className="font-mono font-bold text-cyan-300 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              Evidence Ledger: {activeMetric.label}
            </span>
            <span className="font-mono text-xs font-bold text-white">{activeMetric.value}</span>
          </div>

          {activeMetric.ledger ? (
            <div className="space-y-1.5 font-sans">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">Source Agency / Sensor:</span>
                <span className="text-slate-200 font-medium">
                  {activeMetric.ledger.source || <span className="text-zinc-500 font-mono">UNKNOWN</span>}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block">Observation Date:</span>
                  <span className="text-slate-200 font-mono">
                    {activeMetric.ledger.date || <span className="text-zinc-500">UNKNOWN</span>}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block">Parent Dataset:</span>
                  <span className="text-slate-200 truncate block">
                    {activeMetric.ledger.parentData || <span className="text-zinc-500 font-mono">UNKNOWN</span>}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">Measurement Method:</span>
                <span className="text-slate-300 text-[10px] leading-relaxed block">
                  {activeMetric.ledger.method || <span className="text-zinc-500 font-mono">UNKNOWN</span>}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-amber-400/90 block">Known Uncertainty & Limitations:</span>
                <span className="text-amber-200/90 text-[10px] leading-relaxed block bg-amber-950/30 p-1.5 rounded border border-amber-900/40">
                  {activeMetric.ledger.limitation || <span className="text-zinc-500 font-mono">UNKNOWN (No uncertainty bounds published)</span>}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-2 rounded bg-zinc-900/70 border border-zinc-800 text-center">
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono font-bold text-[10px] border border-zinc-700">
                PROVENANCE: UNKNOWN
              </span>
              <p className="text-[10px] text-zinc-400 mt-1">
                No sensor telemetry, regulatory survey, or GIS parent lineage is linked for this measurement.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Description & Methodological Context */}
      <p className="text-[11px] text-slate-300/90 leading-relaxed mt-2.5 p-2 rounded-xl bg-slate-950/40 border border-slate-800/60 font-sans break-words">
        {feature.description}
      </p>

      {/* Bottom Coordinates & Action Button */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-800/80">
        <span className="text-[10px] font-mono text-slate-500">
          GPS: {feature.coordinates[0].toFixed(4)}, {feature.coordinates[1].toFixed(4)}
        </span>

        {feature.actionButton && (
          <button
            type="button"
            onClick={feature.actionButton.onClick}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <span>{feature.actionButton.label}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
