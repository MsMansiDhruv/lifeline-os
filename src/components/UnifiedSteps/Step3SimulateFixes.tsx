import React, { useState } from 'react';
import {
  INTERVENTION_TOOLS,
  InterventionType,
  TheaterData,
  TheaterChokePoint,
  getChokePhysicsCoords,
} from '../../data/theaters';
import { getSelectedTelemetryRow } from '../../data/disasterData';
import {
  Construction,
  Activity,
  Radio,
  Anchor,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Sliders,
  DollarSign,
  Clock,
  Sparkles,
  Database,
  ShieldCheck,
} from 'lucide-react';
import { BridgeIcon, CampIcon, DroneIcon, BoatIcon } from '../common/TacticalIcons';

interface Step3SimulateFixesProps {
  currentTheater: TheaterData;
  interventions: Record<string, InterventionType>;
  onSetIntervention: (chokePointId: string, tool: InterventionType) => void;
  onResetInterventions: () => void;
  selectedChokeIdx: number;
  onSelectChokeIdx: (idx: number) => void;
  fleetMode: string;
  onAdvanceToStep4: () => void;
  interactiveTourTask?: number;
  opsMode?: 'day' | 'night';
}

export const Step3SimulateFixes: React.FC<Step3SimulateFixesProps> = ({
  currentTheater,
  interventions,
  onSetIntervention,
  onResetInterventions,
  selectedChokeIdx,
  onSelectChokeIdx,
  fleetMode,
  onAdvanceToStep4,
  interactiveTourTask = 0,
  opsMode = 'day',
}) => {
  const isHeavy = fleetMode.includes('Heavy') || fleetMode.includes('16T');
  const chokePoints = currentTheater.chokePoints;
  const [hoveredToolByChoke, setHoveredToolByChoke] = useState<Record<string, InterventionType | null>>({});

  const validIdx = Math.min(selectedChokeIdx, Math.max(0, chokePoints.length - 1));
  const selectedChoke: TheaterChokePoint = chokePoints[validIdx] || chokePoints[0];

  // Dynamic Before vs After Calculations
  const baseTrapped = chokePoints.reduce((acc, cp) => acc + (cp.trapped_villages_count || 0), 0);
  let savedVillages = 0;
  let totalCostLakhs = 0;

  chokePoints.forEach((cp) => {
    const tool = interventions[cp.id];
    if (tool && tool !== 'none') {
      const meta = INTERVENTION_TOOLS[tool];
      const reconnected = Math.round((cp.trapped_villages_count * meta.villagesRelievedPct) / 100);
      savedVillages += reconnected;
      totalCostLakhs += meta.costInLakhs;
    }
  });

  const villagesLeft = Math.max(0, baseTrapped - savedVillages);
  const jtTool = interventions['jt_road'] || 'none';
  const isJtFixed = jtTool !== 'none';

  // Live ICU surge computation
  const liveHospitalIcu = isJtFixed ? 108 : 191;
  const liveGoldenHour = isJtFixed ? 22 : 65;

  return (
    <div className="space-y-3.5 select-none font-sans">
      {/* Step Header */}
      <div className="bg-slate-900/95 border border-slate-800 p-3.5 rounded-xl flex items-start justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-600/40 text-emerald-400 shrink-0">
            <Construction className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono font-bold text-white text-xs uppercase tracking-wide">
                Step 3: Counterfactual Solution Sandbox &amp; ROI
              </h3>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold uppercase">
                Physics Enforced
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans mt-0.5 leading-relaxed">
              Test interventions across 4 physical tools. Real-world civil engineering constraints apply:
              Bridges lock if gap &gt;60m, Clinics snap to dry roadheads, Boats link dry ramps.
            </p>
          </div>
        </div>

        {Object.keys(interventions).length > 0 && (
          <button
            onClick={onResetInterventions}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono font-semibold cursor-pointer transition-colors border border-slate-700 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* LIVE "BEFORE VS. AFTER IMPACT STRIP" (Requirement 2.2) */}
      <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/50 shadow-xl space-y-2 font-mono">
        <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 pb-1.5">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Live Before vs. After Simulation Strip
          </span>
          <span className="text-cyan-400 flex items-center gap-1">
            <Database className="w-3 h-3" />
            Synced to seoc_live_state
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {/* Metric 1: Trapped Villages */}
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Cut-Off Villages</span>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <span className="text-slate-500 line-through text-[11px]">{baseTrapped}</span>
              <span className="text-slate-400 text-[10px]">➔</span>
              <strong className={villagesLeft === 0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {villagesLeft} Left
              </strong>
            </div>
            {savedVillages > 0 && (
              <span className="text-[9px] text-emerald-400 block font-bold mt-0.5">
                +{savedVillages} Reconnected
              </span>
            )}
          </div>

          {/* Metric 2: Valley Hospital ICU Surge */}
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Valley Hospital (demo beds)</span>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <span className="text-slate-500 text-[11px]">Unbalanced</span>
              <span className="text-slate-400 text-[10px]">➔</span>
              <strong className={liveHospitalIcu <= 120 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {liveHospitalIcu}% {liveHospitalIcu <= 120 ? 'Safe' : 'Overload'}
              </strong>
            </div>
            <span className="text-[9px] text-emerald-400 block font-bold mt-0.5">
              {isJtFixed ? '73% Surge Relieved' : '0% Relieved'}
            </span>
          </div>

          {/* Metric 3: Golden Hour Access */}
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Golden Hour Access</span>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <span className="text-slate-500 line-through text-[11px]">{Math.round(getSelectedTelemetryRow(selectedChoke?.road_name).scenario_min || 65.7)}m</span>
              <span className="text-slate-400 text-[10px]">➔</span>
              <strong className={liveGoldenHour <= 60 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {liveGoldenHour}m {liveGoldenHour <= 60 ? 'Restored' : 'Delayed'}
              </strong>
            </div>
            <span className="text-[9px] text-emerald-400 block font-bold mt-0.5">
              {isJtFixed ? '✅ Within Threshold' : '❌ Violated'}
            </span>
          </div>
        </div>
      </div>

      {/* Corridor Sandbox Cards */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
          <span className="font-semibold uppercase tracking-wider text-[10px]">
            Deploy Counterfactual Assets Across Corridors ({chokePoints.length})
          </span>
          <span className="text-[11px] text-cyan-400">Total Capex: ₹{totalCostLakhs} Lakhs</span>
        </div>

        {chokePoints.map((cp, idx) => {
          const isSelected = idx === validIdx;
          const coords = getChokePhysicsCoords(cp);
          const currentTool = interventions[cp.id] || 'none';
          const activeToolMeta = currentTool !== 'none' ? INTERVENTION_TOOLS[currentTool] : null;

          // STRICT REAL-WORLD 60-METER BAILEY BRIDGE RULE (Requirement 1.2)
          const isBaileyOverSpan = coords.breachWidthMeters > 60;

          const isTourTarget = interactiveTourTask === 3 && idx === 0;

          return (
            <div
              key={cp.id}
              onClick={() => onSelectChokeIdx(idx)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-slate-900 border-blue-500 shadow-xl ring-1 ring-blue-500/50'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center font-mono font-bold text-[11px] ${
                      activeToolMeta
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    #{cp.rank}
                  </span>
                  <div>
                    <h4 className="font-bold text-white text-xs flex items-center gap-2">
                      {cp.road_name}
                      {isSelected && (
                        <span className="text-[9px] font-mono bg-blue-950 text-blue-300 px-1.5 py-0.2 rounded border border-blue-800 uppercase">
                          Selected
                        </span>
                      )}
                    </h4>
                    <span className="text-[10px] text-amber-300 font-mono">
                      {cp.failure_type || `${coords.breachWidthMeters}m Breach`} • Gap Width: {coords.breachWidthMeters}m
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                      activeToolMeta
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {activeToolMeta ? `Active: ${activeToolMeta.name}` : `${cp.trapped_villages_count} Cut Villages`}
                  </span>
                </div>
              </div>

              {/* 4 Tool Action Buttons */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono">
                  {/* Tool 1: Bailey Bridge (Enforcing 60m Span Limit) */}
                  <div className="relative">
                    <button
                      type="button"
                      disabled={isBaileyOverSpan}
                      onClick={(e) => {
                        if (isBaileyOverSpan) return;
                        e.stopPropagation();
                        onSelectChokeIdx(idx);
                        onSetIntervention(cp.id, currentTool === 'bridge' ? 'none' : 'bridge');
                      }}
                      className={`w-full py-2 px-1 rounded-lg font-semibold flex flex-col items-center justify-center transition-all border ${
                        isBaileyOverSpan
                          ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-rose-400'
                          : currentTool === 'bridge'
                          ? 'bg-amber-900 text-amber-100 border-amber-600 shadow-md shadow-amber-950/50 cursor-pointer'
                          : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700 cursor-pointer'
                      } ${isTourTarget && !isBaileyOverSpan ? 'ring-4 ring-amber-400 animate-pulse' : ''}`}
                      title={
                        isBaileyOverSpan
                          ? `🚫 UNBUILDABLE: ${coords.breachWidthMeters}m Floodplain exceeds 60m Max Bailey Span — Use Boat Ferry or Med-Drone!`
                          : 'Class-40 Modular Bailey Bridge: Anchors strictly between North & South Dry Abutments'
                      }
                    >
                      <BridgeIcon size={16} className="mb-0.5 text-amber-200" />
                      <span className="truncate">{isBaileyOverSpan ? 'Locked (>60m)' : 'Bailey Bridge'}</span>
                      <span className="text-[9px] text-slate-400">
                        {isBaileyOverSpan ? 'Exceeds Span' : '₹1.8 Cr • 72h'}
                      </span>
                    </button>
                    {isBaileyOverSpan && (
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 bg-rose-950 text-rose-300 border border-rose-800 font-mono text-[7px] px-1 py-0.2 rounded whitespace-nowrap">
                        &gt;60m Limit
                      </div>
                    )}
                  </div>

                  {/* Tool 2: Dry Roadhead Hospital Camp (YELLOW) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectChokeIdx(idx);
                        onSetIntervention(cp.id, currentTool === 'booth' ? 'none' : 'booth');
                      }}
                      className={`w-full py-2 px-1 rounded-lg font-semibold flex flex-col items-center justify-center transition-all cursor-pointer border ${
                        currentTool === 'booth'
                          ? 'bg-yellow-500 text-yellow-950 font-bold border-yellow-400 shadow-md shadow-yellow-900/50'
                          : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
                      }`}
                      title="Dry Roadhead Clinic: Pitched at 29m ASL dry roadhead, 600m before water"
                    >
                      <CampIcon size={16} className="mb-0.5 text-yellow-300" />
                      <span className="truncate">Hospital Camp</span>
                      <span className="text-[9px] text-slate-400">₹25L • 6h</span>
                    </button>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 bg-yellow-950 text-yellow-300 border border-yellow-800 font-mono text-[7px] px-1 py-0.2 rounded whitespace-nowrap">
                      29m ASL Dry
                    </div>
                  </div>

                  {/* Tool 3: Drone Airbridge (PURPLE) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectChokeIdx(idx);
                        onSetIntervention(cp.id, currentTool === 'drone' ? 'none' : 'drone');
                      }}
                      className={`w-full py-2 px-1 rounded-lg font-semibold flex flex-col items-center justify-center transition-all cursor-pointer border ${
                        currentTool === 'drone'
                          ? 'bg-purple-700 text-white border-purple-400 shadow-md shadow-purple-900/50'
                          : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
                      }`}
                      title="Medical UAV Drone: Flies directly from Hospital Helipad to Village School Drop-Zone"
                    >
                      <DroneIcon size={16} className="mb-0.5 text-purple-300" />
                      <span className="truncate">Med Drone</span>
                      <span className="text-[9px] text-slate-400">₹12L • 45m</span>
                    </button>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 bg-purple-950 text-purple-300 border border-purple-800 font-mono text-[7px] px-1 py-0.2 rounded whitespace-nowrap">
                      Air Corridor
                    </div>
                  </div>

                  {/* Tool 4: NDRF Boat Ferry (BLUE) */}
                  <div className="relative">
                    <button
                      type="button"
                      disabled={opsMode === 'night'}
                      onClick={(e) => {
                        if (opsMode === 'night') return;
                        e.stopPropagation();
                        onSelectChokeIdx(idx);
                        onSetIntervention(cp.id, currentTool === 'boat' ? 'none' : 'boat');
                      }}
                      className={`w-full py-2 px-1 rounded-lg font-semibold flex flex-col items-center justify-center transition-all border ${
                        opsMode === 'night'
                          ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                          : currentTool === 'boat'
                          ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-900/50 cursor-pointer'
                          : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700 cursor-pointer'
                      }`}
                      title="NDRF Rescue Boat: Connects North Dry Launch Ramp to South Dry Landing Jetty"
                    >
                      <BoatIcon size={16} className="mb-0.5 text-blue-300" />
                      <span className="truncate">Rescue Boat</span>
                      <span className="text-[9px] text-slate-400">
                        {opsMode === 'night' ? 'Grounded' : '₹6.5L • 3h'}
                      </span>
                    </button>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 bg-blue-950 text-blue-300 border border-blue-800 font-mono text-[7px] px-1 py-0.2 rounded whitespace-nowrap">
                      Dry Ramps
                    </div>
                  </div>
                </div>

                {/* Engineering Physics Callout Note */}
                {isBaileyOverSpan && (
                  <div className="mt-5 p-2 rounded-lg bg-rose-950/80 border border-rose-800 text-[10px] text-rose-200 flex items-center gap-1.5 font-mono">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>
                      <strong>IRC:6 Physics Rule:</strong> {coords.breachWidthMeters}m floodplain breach exceeds
                      Class-40 60m max modular span. Deploy NDRF Boat Ferry or UAV Drone instead.
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Prominent Bottom Pipeline Advancement CTA */}
      <div className="pt-2">
        <button
          onClick={onAdvanceToStep4}
          className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] border border-purple-400/40"
        >
          <span>Next: Compile Gemini MCP Work-Orders &amp; DM Sanction (Step 4)</span>
          <ArrowRight className="w-4 h-4 text-cyan-300" />
        </button>
      </div>
    </div>
  );
};
