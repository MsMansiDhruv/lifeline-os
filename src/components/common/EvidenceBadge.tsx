import React from 'react';
import { EvidenceClass } from '../../types/evidence';

export const EVIDENCE_CLASS_STYLES: Record<EvidenceClass, {
  bg: string;
  text: string;
  border: string;
  dot: string;
  description: string;
}> = {
  OBSERVED: {
    bg: 'bg-cyan-950/90',
    text: 'text-cyan-300',
    border: 'border-cyan-600/80',
    dot: 'bg-cyan-400',
    description: 'Direct instrument or satellite measurement',
  },
  OFFICIAL: {
    bg: 'bg-emerald-950/90',
    text: 'text-emerald-300',
    border: 'border-emerald-600/80',
    dot: 'bg-emerald-400',
    description: 'Authoritative government agency record',
  },
  REPORTED: {
    bg: 'bg-amber-950/90',
    text: 'text-amber-300',
    border: 'border-amber-600/80',
    dot: 'bg-amber-400',
    description: 'Field inspection or ground dispatch report',
  },
  MODELLED: {
    bg: 'bg-purple-950/90',
    text: 'text-purple-300',
    border: 'border-purple-600/80',
    dot: 'bg-purple-400',
    description: 'Computed via network graph or hydrological model',
  },
  ASSUMED: {
    bg: 'bg-orange-950/90',
    text: 'text-orange-300',
    border: 'border-orange-600/80',
    dot: 'bg-orange-400',
    description: 'Parametric baseline assumption or demo estimate',
  },
  SIMULATED: {
    bg: 'bg-fuchsia-950/90',
    text: 'text-fuchsia-300',
    border: 'border-fuchsia-600/80',
    dot: 'bg-fuchsia-400',
    description: 'Synthetic counterfactual test case',
  },
  UNKNOWN: {
    bg: 'bg-slate-900',
    text: 'text-slate-400',
    border: 'border-slate-700',
    dot: 'bg-slate-500',
    description: 'Unverified provenance or missing telemetry',
  },
};

export const EvidenceBadge: React.FC<{
  evidenceClass: EvidenceClass | string;
  size?: 'xs' | 'sm';
  showDot?: boolean;
  className?: string;
}> = ({ evidenceClass, size = 'xs', showDot = true, className = '' }) => {
  const normClass = (
    evidenceClass && evidenceClass.toUpperCase() in EVIDENCE_CLASS_STYLES
      ? evidenceClass.toUpperCase()
      : 'UNKNOWN'
  ) as EvidenceClass;
  const style = EVIDENCE_CLASS_STYLES[normClass] || EVIDENCE_CLASS_STYLES.UNKNOWN;

  const sizeClass = size === 'xs' ? 'text-[9px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-bold uppercase rounded border ${style.bg} ${style.text} ${style.border} ${sizeClass} ${className}`}
      title={`${normClass}: ${style.description}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />}
      <span>{normClass}</span>
    </span>
  );
};
