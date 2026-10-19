import React, { useState } from 'react';
import {
  X,
  MapPin,
  ShieldCheck,
  Activity,
  ArrowRight,
  Database,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  FileText,
  Clock,
  Layers,
} from 'lucide-react';
import { BridgeIcon } from './common/TacticalIcons';
import { EvidenceClass, EVIDENCE_CLASS_CONFIG } from '../types/evidence';
import { InspectedFeatureData } from './ContextualFeatureInspector';
import { StatusBadge, Button } from './common/UIPrimitives';

interface RightContextualInspectorProps {
  feature: InspectedFeatureData | null;
  onClose: () => void;
  onFocusCoordinates?: (coords: [number, number]) => void;
}

export const RightContextualInspector: React.FC<RightContextualInspectorProps> = ({
  feature,
  onClose,
  onFocusCoordinates,
}) => {
  const [selectedMetricIdx, setSelectedMetricIdx] = useState<number | null>(null);

  if (!feature) return null;

  const evConf = EVIDENCE_CLASS_CONFIG[feature.evidenceClass] || EVIDENCE_CLASS_CONFIG.UNKNOWN;
  const activeMetric = selectedMetricIdx !== null ? feature.metrics[selectedMetricIdx] : null;

  const getStatusType = (color: string) => {
    switch (color) {
      case 'emerald':
        return 'success';
      case 'amber':
        return 'warning';
      case 'rose':
        return 'error';
      case 'cyan':
        return 'info';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="w-full h-full bg-[#0E1625] flex flex-col overflow-hidden text-[#E8EEF7]">
      {/* 1. Header */}
      <div className="px-4 py-3 border-b border-[#26364B] flex items-start justify-between gap-2.5 shrink-0 bg-[#0E1625]">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#182437] border border-[#26364B] flex items-center justify-center text-[#13B8D5] shrink-0 mt-0.5">
            {feature.type === 'chokepoint' && <BridgeIcon size={16} color="#F0B44D" />}
            {feature.type === 'facility' && <Activity className="w-4 h-4 text-[#F06472]" />}
            {feature.type === 'village' && <MapPin className="w-4 h-4 text-[#22C58B]" />}
            {feature.type === 'intervention' && <ShieldCheck className="w-4 h-4 text-[#13B8D5]" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase text-[#74859D] font-bold">
                {feature.type}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-[#E8EEF7] truncate leading-tight mt-0.5">
              {feature.title}
            </h3>
            {feature.subtitle && (
              <p className="text-[11px] text-[#9AAAC0] truncate mt-0.5">{feature.subtitle}</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-md flex items-center justify-center text-[#9AAAC0] hover:text-[#E8EEF7] hover:bg-[#182437] transition-colors cursor-pointer shrink-0"
          title="Close inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Status Badges */}
      <div className="px-4 py-2.5 bg-[#121D2D] border-b border-[#26364B] flex flex-wrap items-center gap-1.5 shrink-0">
        <StatusBadge status={getStatusType(feature.statusColor)} label={feature.statusText} />
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${evConf.badgeBg} ${evConf.badgeText} ${evConf.badgeBorder}`}
          title={`Evidence Provenance: ${evConf.label}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${evConf.dotColor}`} />
          {evConf.label}
        </span>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#182437] text-[#9AAAC0] border border-[#26364B]">
          {feature.dataState}
        </span>
      </div>

      {/* 3. Vertically Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Description Section */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase text-[#74859D] font-bold tracking-wider">
            Operational Summary
          </span>
          <p className="text-xs text-[#9AAAC0] leading-relaxed bg-[#121D2D] border border-[#26364B] p-2.5 rounded-lg">
            {feature.description}
          </p>
        </div>

        {/* Metrics Grid with Clickable Evidence Ledger */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#74859D] font-bold tracking-wider">
              Telemetry &amp; Access Metrics
            </span>
            <span className="text-[10px] font-mono text-[#13B8D5] flex items-center gap-1">
              <Database className="w-3 h-3" />
              Click for Ledger
            </span>
          </div>

          <div className="space-y-1.5">
            {feature.metrics.map((m, idx) => {
              const isSelected = selectedMetricIdx === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedMetricIdx(isSelected ? null : idx)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#182437] border-[#13B8D5] ring-1 ring-[#13B8D5]/40'
                      : 'bg-[#121D2D] border-[#26364B] hover:border-[#354964]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#9AAAC0] font-medium">{m.label}</span>
                    <span className="font-mono font-semibold text-[#E8EEF7]">{m.value}</span>
                  </div>

                  {/* Nested Evidence Ledger Drawer */}
                  {isSelected && m.ledger && (
                    <div className="mt-2.5 pt-2 border-t border-[#26364B] space-y-1.5 text-[11px] font-mono text-[#9AAAC0] animate-in fade-in">
                      <div className="flex justify-between">
                        <span className="text-[#74859D]">Source:</span>
                        <span className="text-[#E8EEF7] font-semibold">{m.ledger.source || 'Standard Model'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#74859D]">Observed Date:</span>
                        <span className="text-[#E8EEF7]">{m.ledger.date || 'Live Stream'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#74859D]">Method:</span>
                        <span className="text-[#13B8D5] truncate max-w-[170px]" title={m.ledger.method}>
                          {m.ledger.method || 'Algorithmic'}
                        </span>
                      </div>
                      {m.ledger.limitation && (
                        <div className="mt-1 p-1.5 rounded bg-[#182437] border border-[#26364B] text-[10px] text-[#F0B44D]">
                          <strong>Limitation:</strong> {m.ledger.limitation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Spatial Coordinates Box */}
        <div className="p-2.5 rounded-lg bg-[#121D2D] border border-[#26364B] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5 text-[#9AAAC0]">
            <MapPin className="w-3.5 h-3.5 text-[#13B8D5]" />
            <span>Coordinates:</span>
          </div>
          <span className="text-[#E8EEF7] font-semibold">
            {feature.coordinates[0].toFixed(4)}°N, {feature.coordinates[1].toFixed(4)}°E
          </span>
        </div>
      </div>

      {/* 4. Action Footer */}
      <div className="p-3 border-t border-[#26364B] bg-[#0E1625] shrink-0 space-y-2">
        {feature.actionButton && (
          <Button
            variant="primary"
            size="md"
            onClick={feature.actionButton.onClick}
            className="w-full"
          >
            {feature.actionButton.label}
          </Button>
        )}
        {onFocusCoordinates && (
          <Button
            variant="secondary"
            size="sm"
            icon={MapPin}
            onClick={() => onFocusCoordinates(feature.coordinates)}
            className="w-full text-xs"
          >
            Center on Map
          </Button>
        )}
      </div>
    </div>
  );
};
