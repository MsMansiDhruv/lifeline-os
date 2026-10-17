import React from 'react';
import { X, MapPin, AlertTriangle, ShieldCheck, Activity, ExternalLink, ArrowRight } from 'lucide-react';
import { BridgeIcon, CampIcon, DroneIcon, BoatIcon } from './common/TacticalIcons';

export interface InspectedFeatureData {
  id: string;
  type: 'chokepoint' | 'village' | 'facility' | 'intervention';
  title: string;
  subtitle?: string;
  coordinates: [number, number];
  statusText: string;
  statusColor: 'rose' | 'amber' | 'emerald' | 'cyan' | 'purple';
  evidenceClass: 'OBSERVED' | 'OFFICIAL' | 'MODELLED' | 'ASSUMED';
  dataState: 'LIVE' | 'STALE' | 'PARTIAL' | 'UNAVAILABLE' | 'SIMULATED';
  metrics: Array<{
    label: string;
    value: string;
    highlight?: boolean;
    color?: string;
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
}

export const ContextualFeatureInspector: React.FC<ContextualFeatureInspectorProps> = ({
  feature,
  onClose,
}) => {
  if (!feature) return null;

  const colorStyles = {
    rose: 'bg-rose-950/90 text-rose-300 border-rose-700/80',
    amber: 'bg-amber-950/90 text-amber-300 border-amber-700/80',
    emerald: 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80',
    cyan: 'bg-cyan-950/90 text-cyan-300 border-cyan-700/80',
    purple: 'bg-purple-950/90 text-purple-300 border-purple-700/80',
  }[feature.statusColor];

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl text-slate-100 p-4 select-none animate-in fade-in slide-in-from-bottom-4">
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

      {/* Badges: Status + Evidence Class + Data State */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${colorStyles}`}>
          {feature.statusText}
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          PROVENANCE: {feature.evidenceClass}
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          STATE: {feature.dataState}
        </span>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
        {feature.metrics.map((m, idx) => (
          <div key={idx} className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block font-medium">{m.label}</span>
            <span className={`text-sm font-bold mt-0.5 block ${m.color || 'text-white'}`}>
              {m.value}
            </span>
          </div>
        ))}
      </div>

      {/* Description & Methodological Context */}
      <p className="text-[11px] text-slate-300/90 leading-relaxed mt-3 p-2 rounded-xl bg-slate-950/40 border border-slate-800/60 font-sans">
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
