import React from 'react';
import { X, HelpCircle, AlertCircle, ShieldAlert, Radio, Activity, Navigation } from 'lucide-react';
import { EvidenceBadge } from './common/EvidenceBadge';

interface WhatWeDontKnowModalProps {
  isOpen: boolean;
  onClose: () => void;
  theaterName: string;
}

export const WhatWeDontKnowModal: React.FC<WhatWeDontKnowModalProps> = ({
  isOpen,
  onClose,
  theaterName,
}) => {
  if (!isOpen) return null;

  const unknownItems = [
    {
      id: 'gauge-telemetry',
      title: 'River Gauge & Streamflow Telemetry',
      category: 'Hydrology',
      badge: 'UNKNOWN',
      icon: Radio,
      whatWeKnow: 'Copernicus GloFAS 4.0 provides regional runoff models and catchment estimates.',
      whatWeDontKnow: 'No live telemetry stream from Central Water Commission (CWC) or local river stage gauges is connected. River discharge and velocity cannot be confirmed as real-time ground truth.',
      operationalSafeguard: 'NDRF boat operations require physical depth verification before launch; automated dispatch relies on conservative safety margins.',
    },
    {
      id: 'closure-verification',
      title: 'Road & Bridge Breach Ground Truth',
      category: 'Infrastructure',
      badge: 'REPORTED',
      icon: ShieldAlert,
      whatWeKnow: 'OSM topological road graph identifies structural choke points and cut-edges.',
      whatWeDontKnow: 'Field closures are SIMULATED on the OSM graph. Physical barricades, actual mud depths, and current scour stability are unverified by continuous ground sensors.',
      operationalSafeguard: 'Marked strictly as "SIMULATED CLOSURE on OSM graph". Advance drone/patrol scout required before committing heavy engineering equipment.',
    },
    {
      id: 'hospital-beds',
      title: 'Real-Time Hospital ICU & Bed Capacities',
      category: 'Healthcare',
      badge: 'ASSUMED',
      icon: Activity,
      whatWeKnow: 'Static baseline bed registries from district health profiles (e.g. NHM Cachar, SMCH Apex).',
      whatWeDontKnow: 'Facility bed counts, oxygen availability, and patient intake numbers are assumed demo values, not live EMR/EHR system feeds.',
      operationalSafeguard: 'Ambulance surge balancing operates as a deterministic decision support model; casualty diversion must be confirmed with hospital dispatch coordinators.',
    },
    {
      id: 'sar-subcanopy',
      title: 'Sub-Canopy Flood Inundation Under Dense Foliage',
      category: 'Remote Sensing',
      badge: 'UNKNOWN',
      icon: Navigation,
      whatWeKnow: 'Sentinel-1 C-Band SAR provides cloud-penetrating microwave backscatter mapping.',
      whatWeDontKnow: 'Double-bounce radar returns beneath dense tree canopies, arecanut groves, and urban sheet-metal roofs may cause under-detection of flooded roads.',
      operationalSafeguard: 'Highways under dense vegetation are classified as "Marginally Exposed / Risk" rather than dry without optical or ground verification.',
    },
    {
      id: 'microclimate-flights',
      title: 'Micro-Scale Drone & Flight Weather Conditions',
      category: 'Aviation Safety',
      badge: 'UNKNOWN',
      icon: AlertCircle,
      whatWeKnow: 'Macro-scale wind speeds and precipitation from Open-Meteo 10m forecast models.',
      whatWeDontKnow: 'Localized valley gusts, riverine thermal updrafts, and localized downdrafts are unknown without on-site anemometer telemetry.',
      operationalSafeguard: 'Autonomous flight profiles enforce a strict 45 km/h hard ceiling with automatic mission abort if signal is degraded.',
    },
  ];

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-600/60 flex items-center justify-center text-amber-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  What We Don't Know • Epistemic Disclosures
                </h3>
                <EvidenceBadge evidenceClass="UNKNOWN" size="xs" />
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {theaterName} • Honest identification of telemetry gaps, assumed baselines &amp; unverified parameters
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close disclosures"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Disclosures Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 text-xs text-amber-200 leading-relaxed font-sans">
            <strong>Disaster Intelligence Principle:</strong> High-stakes emergency decisions require complete transparency about what data is unverified or missing. Below is the active ledger of parameters operating under assumption or absence of telemetry.
          </div>

          <div className="space-y-3">
            {unknownItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">{item.title}</span>
                    <span className="text-[10px] font-mono text-slate-500">[{item.category}]</span>
                  </div>
                  <EvidenceBadge evidenceClass={item.badge} size="xs" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-850">
                    <span className="text-emerald-400 font-bold block mb-1">✓ What We Know:</span>
                    <p className="text-slate-300 font-sans text-xs leading-relaxed">{item.whatWeKnow}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-850">
                    <span className="text-rose-400 font-bold block mb-1">✗ What We Don't Know:</span>
                    <p className="text-slate-300 font-sans text-xs leading-relaxed">{item.whatWeDontKnow}</p>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-400 pt-1 flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold shrink-0">Operational Safeguard:</span>
                  <span className="text-slate-300 font-sans text-xs">{item.operationalSafeguard}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 px-6 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Active Unknowns: 5 Items Documented</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs cursor-pointer transition-colors"
          >
            Acknowledge &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
