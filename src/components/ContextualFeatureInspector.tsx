import React, { useState } from 'react';
import { X, MapPin, ShieldCheck, Activity, ArrowRight, FileText, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { BridgeIcon } from './common/TacticalIcons';
import { EvidenceClass } from '../types/evidence';
import { EvidenceBadge } from './common/EvidenceBadge';

export interface MetricLineage {
  source?: string;
  date?: string;
  method?: string;
  limitation?: string;
  parentData?: string;
}

export interface InspectedFeatureData {
  id: string;
  type: 'chokepoint' | 'village' | 'facility' | 'intervention';
  title: string;
  subtitle?: string;
  coordinates: [number, number];
  statusText: string;
  statusColor: 'rose' | 'amber' | 'emerald' | 'cyan' | 'purple';
  evidenceClass: EvidenceClass | string;
  dataState: 'LIVE' | 'STALE' | 'PARTIAL' | 'UNAVAILABLE' | 'SIMULATED';
  metrics: Array<{
    label: string;
    value: string;
    highlight?: boolean;
    color?: string;
    evidenceClass?: EvidenceClass;
    lineage?: MetricLineage;
  }>;
  description: string;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

interface ContextualFeatureInspectorProps {
  feature: InspectedFeatureData | null;
  onClose: () => void;
  className?: string;
}

export const ContextualFeatureInspector: React.FC<ContextualFeatureInspectorProps> = ({
  feature,
  onClose,
  className = '',
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

  const activeMetric = selectedMetricIdx !== null ? feature.metrics[selectedMetricIdx] : null;

  return (
    <div
      className={`fixed bottom-20 right-4 sm:right-6 z-40 w-84 sm:w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl text-slate-100 p-4 select-none animate-in fade-in slide-in-from-bottom-4 max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 ${className}`}
    >
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
            <h4 className="text-sm font-bold text-white truncate leading-snug">{feature.title}</h4>
            {feature.subtitle && (
              <p className="text-[11px] text-slate-400 truncate">{feature.subtitle}</p>
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

      {/* Badges: Consistent Evidence-Class Badge + Status + Data State */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
        <EvidenceBadge evidenceClass={feature.evidenceClass} size="xs" />
        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${colorStyles}`}>
          {feature.statusText}
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          {feature.dataState}
        </span>
      </div>

      {/* Helper Prompt for Evidence Ledger */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2.5 px-1">
        <span>Operational Metrics</span>
        <span className="text-cyan-400">Click number for Evidence Ledger</span>
      </div>

      {/* Key Metrics Grid (Clickable for Evidence Ledger) */}
      <div className="grid grid-cols-2 gap-2 mt-1.5 text-xs">
        {feature.metrics.map((m, idx) => {
          const isSelected = selectedMetricIdx === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedMetricIdx(isSelected ? null : idx)}
              className={`p-2 rounded-xl text-left transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-cyan-950/60 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                  : 'bg-slate-950/70 hover:bg-slate-850 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-slate-400 block font-medium truncate">{m.label}</span>
                {m.evidenceClass && <EvidenceBadge evidenceClass={m.evidenceClass} size="xs" showDot={false} />}
              </div>
              <div className="flex items-baseline justify-between mt-0.5">
                <span className={`text-sm font-bold block ${m.color || 'text-white'}`}>
                  {m.value}
                </span>
                <span className="text-[9px] text-cyan-400 opacity-70">
                  {isSelected ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* EVIDENCE LEDGER EXPANSION */}
      {activeMetric && (
        <div className="mt-2.5 p-3 rounded-xl bg-slate-950/95 border border-cyan-500/60 font-mono text-[11px] space-y-1.5 animate-in fade-in slide-in-from-top-1 shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-bold text-cyan-300 flex items-center gap-1.5 text-[10px] uppercase">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              Evidence Ledger • {activeMetric.label}
            </span>
            <EvidenceBadge evidenceClass={activeMetric.evidenceClass || feature.evidenceClass || 'UNKNOWN'} size="xs" />
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[10px] pt-0.5">
            <div>
              <span className="text-slate-500 block">Source:</span>
              <span className="text-slate-200 font-semibold">{activeMetric.lineage?.source || 'UNKNOWN'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Date / Timestamp:</span>
              <span className="text-slate-200 font-semibold">{activeMetric.lineage?.date || 'UNKNOWN'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Method:</span>
              <span className="text-slate-200 font-semibold">{activeMetric.lineage?.method || 'UNKNOWN'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Limitation:</span>
              <span className="text-slate-200 font-semibold">{activeMetric.lineage?.limitation || 'UNKNOWN'}</span>
            </div>
          </div>

          <div className="text-[10px] pt-1.5 border-t border-slate-800/80">
            <span className="text-slate-500 block">Parent Data:</span>
            <span className="text-slate-300">{activeMetric.lineage?.parentData || 'UNKNOWN'}</span>
          </div>
        </div>
      )}

      {/* Description & Methodological Context */}
      <p className="text-[11px] text-slate-300/90 leading-relaxed mt-3 p-2 rounded-xl bg-slate-950/40 border border-slate-800/60 font-sans">
        {feature.description}
      </p>

      {/* Bottom Coordinates & Action Button */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-800/80">
        <span className="text-[10px] font-mono text-slate-500">
          GPS: {feature.coordinates[0].toFixed(4)}°N, {feature.coordinates[1].toFixed(4)}°E
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
