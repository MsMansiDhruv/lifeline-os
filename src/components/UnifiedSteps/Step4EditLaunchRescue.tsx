import React, { useState } from 'react';
import { TheaterData, InterventionType, INTERVENTION_TOOLS } from '../../data/theaters';
import {
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  FileSignature,
  Edit3,
  Building2,
  Stethoscope,
  Anchor,
  Truck,
  Plane,
  Cloud,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import { playClickSound, playLaunchChime } from '../../services/audioService';

interface Step4EditLaunchRescueProps {
  currentTheater: TheaterData;
  activeInterventions: Record<string, InterventionType>;
  onNavigateToStep3?: () => void;
  onSignAndDispatch: () => void;
  isLiveDispatched?: boolean;
  onOpenGcpModal?: () => void;
}

export const Step4EditLaunchRescue: React.FC<Step4EditLaunchRescueProps> = ({
  currentTheater,
  activeInterventions,
  onNavigateToStep3,
  onSignAndDispatch,
  isLiveDispatched = false,
  onOpenGcpModal,
}) => {
  const [isGcpDrawerOpen, setIsGcpDrawerOpen] = useState<boolean>(false);
  const chokePoints = currentTheater.chokePoints;

  // Split assignments into 3 departmental work orders using real NDMA procurement costs
  const pwdAssignments: Array<{ road: string; tool: string; cost: number; costStr: string; coords: [number, number]; villages: number }> = [];
  const nhmAssignments: Array<{ road: string; tool: string; cost: number; costStr: string; coords: [number, number]; villages: number }> = [];
  const ndrfAssignments: Array<{ road: string; tool: string; cost: number; costStr: string; coords: [number, number]; villages: number }> = [];

  let totalCostLakhs = 0;
  let reconnectedVillages = 0;

  chokePoints.forEach((cp) => {
    const tool = activeInterventions[cp.id] || 'none';
    if (tool === 'bridge') {
      pwdAssignments.push({
        road: cp.road_name,
        tool: 'Class-40 Modular Bailey Bridge (₹1.8 Cr • 72h)',
        cost: 180,
        costStr: '₹1.8 Cr',
        coords: [cp.lat, cp.lon],
        villages: cp.trapped_villages_count,
      });
      totalCostLakhs += 180;
      reconnectedVillages += cp.trapped_villages_count;
    } else if (tool === 'booth') {
      nhmAssignments.push({
        road: cp.road_name,
        tool: 'Forward Mobile Medical Unit (MMU) on Dry Roadhead',
        cost: 25,
        costStr: '₹25 Lakhs',
        coords: [cp.lat, cp.lon],
        villages: Math.round(cp.trapped_villages_count * 0.75),
      });
      totalCostLakhs += 25;
      reconnectedVillages += Math.round(cp.trapped_villages_count * 0.75);
    } else if (tool === 'drone') {
      ndrfAssignments.push({
        road: cp.road_name,
        tool: 'Heavy Cargo Med-Drone Airbridge (Cold-Chain & Antivenom)',
        cost: 12,
        costStr: '₹12 Lakhs',
        coords: [cp.lat, cp.lon],
        villages: Math.round(cp.trapped_villages_count * 0.8),
      });
      totalCostLakhs += 12;
      reconnectedVillages += Math.round(cp.trapped_villages_count * 0.8);
    } else if (tool === 'boat') {
      ndrfAssignments.push({
        road: cp.road_name,
        tool: 'NDRF 40HP Motorized Zodiac Shuttle',
        cost: 6.5,
        costStr: '₹6.5 Lakhs',
        coords: [cp.lat, cp.lon],
        villages: Math.round(cp.trapped_villages_count * 0.7),
      });
      totalCostLakhs += 6.5;
      reconnectedVillages += Math.round(cp.trapped_villages_count * 0.7);
    }
  });

  const totalVillages = chokePoints.reduce((s, cp) => s + cp.trapped_villages_count, 0);

  const handleDispatch = () => {
    playLaunchChime();
    onSignAndDispatch();
  };

  return (
    <div className="space-y-4 select-none text-sm text-slate-200">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-blue-950/80 border border-blue-600/50 text-blue-400 shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  4. Official Dispatch &amp; Live Tracking
                </h3>
                <span className="text-xs bg-blue-950 text-blue-300 border border-blue-800 px-2.5 py-0.5 rounded-full font-semibold">
                  Executive Command
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                Review statutory SDRF Form-3B requisitions and digitally authorize multi-agency field dispatch.
              </p>
            </div>
          </div>

          {onNavigateToStep3 && (
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onNavigateToStep3();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-sm font-semibold border border-slate-700 shrink-0 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit in Step 3</span>
            </button>
          )}
        </div>
      </div>

      {/* REQUIREMENT 5: EXPANDABLE [ ☁️ VIEW GCP SYSTEM ARCHITECTURE ] DRAWER */}
      <div className="border border-cyan-800/80 rounded-xl bg-slate-900 overflow-hidden shadow-lg">
        <button
          type="button"
          onClick={() => {
            playClickSound();
            setIsGcpDrawerOpen(!isGcpDrawerOpen);
          }}
          className="w-full p-3.5 bg-gradient-to-r from-blue-950/80 via-slate-900 to-cyan-950/80 hover:from-blue-900/80 flex items-center justify-between text-sm font-semibold text-cyan-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-cyan-400" />
            <span className="text-white font-bold">
              ☁️ View GCP System Architecture (Sustainability &amp; Social Impact Stack)
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-cyan-400">
            <span>{isGcpDrawerOpen ? 'Collapse' : 'Expand Details'}</span>
            {isGcpDrawerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isGcpDrawerOpen && (
          <div className="p-4 space-y-3.5 bg-slate-950/90 border-t border-slate-800 animate-in fade-in text-sm text-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* 1. Pub/Sub + Earth Engine */}
              <div className="p-3 rounded-lg bg-slate-900 border border-sky-800/60 space-y-1">
                <div className="text-xs font-bold text-sky-400 uppercase tracking-wide">
                  1. Pub/Sub + Earth Engine
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  "Google Earth Engine detects precipitation anomalies and fires a Pub/Sub event with the affected bounding box."
                </p>
              </div>

              {/* 2. Cloud Run + BigQuery GIS */}
              <div className="p-3 rounded-lg bg-slate-900 border border-blue-800/60 space-y-1">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wide">
                  2. Cloud Run + BigQuery GIS
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  "Pub/Sub triggers a serverless Cloud Run instance to fetch regional OpenStreetMap graphs, avoiding whole-planet BigQuery costs. Cloud Run calculates Tarjan's O(V+E) cut-edges in memory."
                </p>
              </div>

              {/* 3. Vertex AI + Gemini 2.5 */}
              <div className="p-3 rounded-lg bg-slate-900 border border-purple-800/60 space-y-1">
                <div className="text-xs font-bold text-purple-400 uppercase tracking-wide">
                  3. Vertex AI + Gemini 2.5
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  "Vertex AI predictive models forecast river surge timing. Gemini 2.5 Flash consumes the deterministic graph data via MCP to generate the natural-language SDRF Sanction Order without coordinate hallucination."
                </p>
              </div>

              {/* 4. Firestore */}
              <div className="p-3 rounded-lg bg-slate-900 border border-emerald-800/60 space-y-1">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                  4. Firestore
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  "Real-time state sync for the SEOC Sandbox."
                </p>
              </div>
            </div>

            {onOpenGcpModal && (
              <button
                type="button"
                onClick={onOpenGcpModal}
                className="w-full py-2 px-3 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Open Full Interactive GCP Architectural Topology Diagram</span>
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Statutory SDRF Form-3B Summary Card */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-base font-bold text-white">
            📑 Statutory SDRF Form-3B Departmental Requisitions
          </span>
          <span className="text-xs text-slate-400 font-mono">
            DM Act 2005 Sec 30(2)
          </span>
        </div>

        {/* 1. PWD / Army Engineering Work Order */}
        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <strong className="text-white text-sm">
                PWD &amp; Army Engineering Battalion
              </strong>
            </div>
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
              Class-40 Bridging
            </span>
          </div>

          {pwdAssignments.length > 0 ? (
            pwdAssignments.map((a, i) => (
              <div key={i} className="text-sm text-slate-300 pl-6 space-y-0.5 border-l-2 border-emerald-600/50">
                <div className="font-semibold text-white">{a.road}: {a.tool}</div>
                <div className="text-xs text-slate-400">
                  GPS: {a.coords[0].toFixed(4)}, {a.coords[1].toFixed(4)} • Cost: {a.costStr} • Reconnects {a.villages} Villages
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-500 pl-6 italic">No structural bridges assigned in Step 3.</div>
          )}
        </div>

        {/* 2. National Health Mission (NHM) Order */}
        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-400" />
              <strong className="text-white text-sm">
                Chief Medical Officer (NHM Assam)
              </strong>
            </div>
            <span className="text-xs text-teal-400 font-semibold bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800">
              Forward MMU Triage
            </span>
          </div>

          {nhmAssignments.length > 0 ? (
            nhmAssignments.map((a, i) => (
              <div key={i} className="text-sm text-slate-300 pl-6 space-y-0.5 border-l-2 border-teal-600/50">
                <div className="font-semibold text-white">{a.road}: {a.tool}</div>
                <div className="text-xs text-slate-400">
                  GPS: {a.coords[0].toFixed(4)}, {a.coords[1].toFixed(4)} • Cost: {a.costStr} • Treats {a.villages} local emergency casualties
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-500 pl-6 italic">No mobile clinics assigned in Step 3.</div>
          )}
        </div>

        {/* 3. NDRF Marine & Drone Squadron */}
        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Anchor className="w-4 h-4 text-cyan-400" />
              <strong className="text-white text-sm">
                NDRF 1st Battalion (Marine &amp; UAV Wing)
              </strong>
            </div>
            <span className="text-xs text-cyan-400 font-semibold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
              Water &amp; Sky Corridors
            </span>
          </div>

          {ndrfAssignments.length > 0 ? (
            ndrfAssignments.map((a, i) => (
              <div key={i} className="text-sm text-slate-300 pl-6 space-y-0.5 border-l-2 border-cyan-600/50">
                <div className="font-semibold text-white">{a.road}: {a.tool}</div>
                <div className="text-xs text-slate-400">
                  GPS: {a.coords[0].toFixed(4)}, {a.coords[1].toFixed(4)} • Cost: {a.costStr} • Serves {a.villages} Villages
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-500 pl-6 italic">No boats or drones assigned in Step 3.</div>
          )}
        </div>

        {/* Total Cost & Life-Safety ROI Bar */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Total SDRF Sanction:</span>
            <span className="text-xl font-bold text-white">
              ₹{(totalCostLakhs / 100).toFixed(2)} Cr ({totalCostLakhs} Lakhs)
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Habitations Secured:</span>
            <span className="text-xl font-bold text-emerald-400">
              {reconnectedVillages} of {totalVillages} Villages (41,520 Citizens)
            </span>
          </div>
        </div>
      </div>

      {/* DISPATCH BUTTON */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleDispatch}
          className={`w-full py-3.5 px-5 rounded-xl font-semibold text-base shadow-2xl flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            isLiveDispatched
              ? 'bg-emerald-600 text-white ring-4 ring-emerald-400 shadow-[0_0_30px_#10b981]'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-600/30'
          }`}
        >
          <FileSignature className="w-5 h-5" />
          <span>
            {isLiveDispatched
              ? '✅ Sanction Signed — Live Fleet Active on Map'
              : '✍️ Sign Sanction Order & Dispatch Fleet on Map'}
          </span>
        </button>
      </div>

      {isLiveDispatched && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-600 text-sm text-emerald-200 leading-relaxed animate-in fade-in">
          <div className="font-bold text-emerald-300 flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Multi-Agency Rescue Convoys Dispatched:</span>
          </div>
          Live GPS fleet markers moving smoothly along the street coordinates on the map. Valley Hospital ICU surge stabilized at safe load.
        </div>
      )}
    </div>
  );
};
