import React from 'react';
import { X, AlertCircle, ShieldAlert } from 'lucide-react';
import { EvidenceClass, EVIDENCE_CLASS_CONFIG } from '../types/evidence';

interface UncertaintyItem {
  id: string;
  domain: string;
  title: string;
  evidenceClass: EvidenceClass;
  status: 'UNLINKED' | 'UNVERIFIED' | 'ASSUMED' | 'MODELLED';
  description: string;
  operationalRisk: string;
  remedyAction: string;
}

const UNKNOWN_ITEMS: UncertaintyItem[] = [
  {
    id: 'cwc_gauge_telemetry',
    domain: 'Hydrology & River Stage',
    title: 'Real-time River Gauge Telemetry (Annapurna Ghat)',
    evidenceClass: 'UNKNOWN',
    status: 'UNLINKED',
    description: 'Central Water Commission (CWC) IoT telemetry at Annapurna Ghat is currently unlinked. Peak river stage (24.3m ASL) is modelled from historical 2022 gauge records rather than live automated stream telemetry.',
    operationalRisk: 'Flash flood crest timing may differ by ±2.5 hours from historical hydrograph.',
    remedyAction: 'Deploy SDRF manual staff gauge spotters until CWC API integration is active.',
  },
  {
    id: 'jt_road_scour_depth',
    domain: 'Infrastructure & Road Condition',
    title: 'JT Road Breach Sub-Surface Scour Depth',
    evidenceClass: 'REPORTED',
    status: 'UNVERIFIED',
    description: 'Assam PWD field report confirms an 80m visual surface breach at Binnākāndi Cut, but sub-surface foundation washout and bathymetric scour depth under water have not been surveyed by sonar or ground-penetrating radar.',
    operationalRisk: 'Class-40 Bailey bridge abutments may encounter unsupported embankment soil.',
    remedyAction: 'Mandate Army / PWD combat engineer geo-technical soil probe prior to launching bridge nose.',
  },
  {
    id: 'hospital_bed_telemetry',
    domain: 'Clinical Care & Emergency Access',
    title: 'Real-Time Hospital ICU & Bed Occupancy',
    evidenceClass: 'ASSUMED',
    status: 'ASSUMED',
    description: 'Valley Hospital baseline occupancy is assumed to be 100% (260/260 beds full). No automated HL7 / FHIR electronic health record telemetry stream is connected from regional hospital admissions.',
    operationalRisk: 'Ambulance rerouting to SMCH may overburden Apex trauma ward if elective beds remain unemptied.',
    remedyAction: 'Require District Emergency Operations Centre (DEOC) telephone verbal confirmation with SMCH triage officer.',
  },
  {
    id: 'village_nighttime_headcount',
    domain: 'Demographics & Vulnerability',
    title: 'Exact Habitation Night-time Population',
    evidenceClass: 'MODELLED',
    status: 'MODELLED',
    description: 'Habitation population figures (~1,250 persons per village polygon) are modelled using 2011 Census growth projections and OSM building footprint calculus. Exact night-time headcounts in isolated hamlets are unverified.',
    operationalRisk: 'Ration and boat capacity requirements may have a ±20% estimation uncertainty.',
    remedyAction: 'Zodiac rescue teams must log headcounts on first landing and relay via VHF radio.',
  },
  {
    id: 'minor_bridge_load_rating',
    domain: 'Corridor Routing',
    title: 'Rural Culvert & Minor Span Load Class',
    evidenceClass: 'UNKNOWN',
    status: 'UNVERIFIED',
    description: 'Secondary Kumbhirgram bypass culverts have unknown load ratings; suitability for 30-tonne fuel and oxygen tankers has not been certified by PWD bridge engineers.',
    operationalRisk: 'Heavy military convoys could cause secondary bridge collapse on designated detour routes.',
    remedyAction: 'Restricted to Light Emergency Fleet (Ambulances, 4x4s, <12 tonne transports).',
  },
  {
    id: 'nepal_roshi_debris_volume',
    domain: 'Himalayan Gorge Stability',
    title: 'Roshi Khola Landslide Debris Mass Volume',
    evidenceClass: 'UNKNOWN',
    status: 'UNLINKED',
    description: 'The exact volume of boulder and mud deposits blocking the Roshi gorge Km 48 is unmeasured by airborne LiDAR. Post-event satellite swipe is currently disabled pending calibrated post-event cloud-free imagery.',
    operationalRisk: 'Secondary damming of Roshi Khola could create sudden outburst flood wave.',
    remedyAction: 'Continuous upstream spotter post with satellite phone at Mangaltar junction.',
  },
];

interface WhatWeDontKnowModalProps {
  isOpen: boolean;
  onClose: () => void;
  theaterName?: string;
}

export const WhatWeDontKnowModal: React.FC<WhatWeDontKnowModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-700/60 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">What We Don't Know</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 font-bold">
                  EPISTEMIC REGISTER
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Active uncertainties, unlinked telemetry, and unverified assumptions in this simulation.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Callout */}
        <div className="px-6 py-3 bg-amber-950/20 border-b border-amber-900/30 text-xs text-amber-200/90 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Zero Fabricated Precision:</strong> In life-critical disaster operations, knowing what is <em>unverified</em> is as important as knowing what is observed. The items below represent operational blindspots.
          </span>
        </div>

        {/* Scrollable Register */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3.5 divide-y divide-slate-800/60">
          {UNKNOWN_ITEMS.map((item) => {
            const evConf = EVIDENCE_CLASS_CONFIG[item.evidenceClass] || EVIDENCE_CLASS_CONFIG.UNKNOWN;
            return (
              <div key={item.id} className="pt-3.5 first:pt-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block font-semibold">
                      {item.domain}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">{item.title}</h4>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${evConf.badgeBg} ${evConf.badgeText} ${evConf.badgeBorder}`}>
                      {evConf.label}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {item.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300/90 mt-2 leading-relaxed font-sans">
                  {item.description}
                </p>

                <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] font-mono text-rose-400/90 block font-semibold">
                      Operational Consequence:
                    </span>
                    <span className="text-slate-300 mt-0.5 block leading-snug">
                      {item.operationalRisk}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] font-mono text-emerald-400/90 block font-semibold">
                      Mitigation Directive:
                    </span>
                    <span className="text-slate-300 mt-0.5 block leading-snug">
                      {item.remedyAction}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <span>6 Active Uncertainty Items Registered</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
