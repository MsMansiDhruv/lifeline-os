import React, { useState } from 'react';
import {
  INTERVENTION_TOOLS,
  InterventionType,
  TheaterData,
  TheaterChokePoint,
} from '../../data/theaters';
import { JuryScorecard } from '../JuryScorecard';
import {
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  Construction,
  Activity,
  Radio,
  Anchor,
  Navigation,
  Sliders,
  ChevronRight,
  Clock,
  Truck,
  Moon,
  Sun,
} from 'lucide-react';

interface Step1BottlenecksProps {
  currentTheater: TheaterData;
  interventions: Record<string, InterventionType>;
  onSetIntervention: (chokePointId: string, tool: InterventionType) => void;
  onResetInterventions: () => void;
  selectedChokeIdx: number;
  onSelectChokeIdx: (idx: number) => void;
  fleetMode: string;
  panelWidth?: number;
  interactiveTourTask?: number;
  opsMode?: 'day' | 'night';
}

export const Step1Bottlenecks: React.FC<Step1BottlenecksProps> = ({
  currentTheater,
  interventions,
  onSetIntervention,
  onResetInterventions,
  selectedChokeIdx,
  onSelectChokeIdx,
  fleetMode,
  panelWidth = 430,
  interactiveTourTask = 0,
  opsMode = 'day',
}) => {
  const isHeavy = fleetMode.includes('Heavy') || fleetMode.includes('16T');
  const chokePoints = currentTheater.chokePoints;
  const [hoveredToolByChoke, setHoveredToolByChoke] = useState<Record<string, InterventionType | null>>({});

  const validIdx = Math.min(selectedChokeIdx, Math.max(0, chokePoints.length - 1));
  const selectedChoke: TheaterChokePoint = chokePoints[validIdx] || chokePoints[0];

  const toolIcons: Record<string, React.FC<{ className?: string }>> = {
    bridge: Construction,
    booth: Activity,
    drone: Radio,
    boat: Anchor,
  };

  return (
    <div className="space-y-4 select-none">
      {/* Step Header & Reset */}
      <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-rose-950/80 border border-rose-600/40 text-rose-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-white text-xs uppercase tracking-wide">
              Step 1: Single-Point Road Bottlenecks &amp; Counterfactual Sandbox
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">
              Tarjan O(V+E) cut-edge bridges where washouts leave 0 backup routes. Select a tool to simulate live fixes.
            </p>
          </div>
        </div>

        {Object.keys(interventions).length > 0 && (
          <button
            onClick={onResetInterventions}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono font-semibold cursor-pointer transition-colors border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Live Simulation Scorecard (Auto-adjusts 2x2 or 4x1 based on panel width) */}
      <JuryScorecard chokePoints={chokePoints} interventions={interventions} panelWidth={panelWidth} />

      {/* Bottlenecks List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
          <span className="font-semibold uppercase tracking-wider text-[10px]">
            Severed Articulation Corridors ({chokePoints.length})
          </span>
          <span className="text-[11px] text-cyan-400">Click a card to focus map</span>
        </div>

        {chokePoints.map((cp, idx) => {
          const isSelected = idx === selectedChokeIdx;
          const currentTool = interventions[cp.id] || 'none';
          const activeToolMeta = currentTool !== 'none' ? INTERVENTION_TOOLS[currentTool] : null;
          const isTask1Target = interactiveTourTask === 1 && idx === 0;
          const isTask2Target = interactiveTourTask === 2 && idx === 0;

          // Selective focus blur: Keep active spotlighted card 100% sharp; dim inactive cards
          const isTourDimmed =
            (interactiveTourTask === 1 && idx !== 0) ||
            (interactiveTourTask === 2 && idx !== 0);

          const hoveredTool = hoveredToolByChoke[cp.id] || null;
          const previewTool: keyof typeof INTERVENTION_TOOLS | null =
            hoveredTool && hoveredTool !== 'none'
              ? (hoveredTool as keyof typeof INTERVENTION_TOOLS)
              : currentTool !== 'none'
              ? (currentTool as keyof typeof INTERVENTION_TOOLS)
              : null;
          const previewMeta = previewTool ? INTERVENTION_TOOLS[previewTool] : null;

          const failureTypeLabel =
            cp.failure_type ||
            (cp.id === 'jt_road'
              ? 'Bridge Abutment Washout (48m Span Gap)'
              : cp.id === 'harinagar'
              ? 'Submerged Highway Causeway (1.4m Overtopping Water)'
              : cp.id === 'korkoli_causeway'
              ? 'Culvert Scour & Embankment Breach (32m Gap)'
              : cp.id === 'borkhola_link'
              ? 'Flash Mudflow & Road Slip (60m Blockage)'
              : `${cp.exposed_meters}m River Inundation Breach`);

          const isBaileyDisabled = cp.exposed_meters > 60 || cp.id === 'harinagar';

          return (
            <div
              key={cp.id}
              onClick={() => onSelectChokeIdx(idx)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                isTask1Target
                  ? 'bg-slate-900 border-emerald-400 ring-4 ring-emerald-400 shadow-[0_0_25px_#10b981] animate-pulse z-20 opacity-100 blur-none pointer-events-auto'
                  : isTourDimmed
                  ? 'opacity-20 blur-[1px] pointer-events-none transition-all duration-300'
                  : isSelected
                  ? 'bg-slate-900 border-blue-500 shadow-xl ring-1 ring-blue-500/50'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Task 1 Bouncing Pointer Badge */}
              {isTask1Target && (
                <div className="absolute -top-3.5 left-4 z-30 bg-emerald-400 text-slate-950 font-mono font-bold text-[9px] px-2.5 py-0.5 rounded-full shadow-[0_0_15px_#10b981] animate-bounce flex items-center gap-1">
                  <span>👇 CLICK THIS BUTTON TO TEST</span>
                </div>
              )}

              {/* Card Top: Rank, Name, Trapped Villages */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center font-mono font-bold text-[11px] ${
                      activeToolMeta
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                        : cp.rank === 1
                        ? 'bg-rose-950 text-rose-300 border border-rose-700'
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
                          Active Focus
                        </span>
                      )}
                    </h4>
                    {/* Civil Failure Classification (Requirement 4) */}
                    <div className="text-[10px] text-amber-300 font-mono mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span className="truncate">{failureTypeLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${
                      activeToolMeta
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                        : 'bg-rose-950/80 text-rose-300 border-rose-800'
                    }`}
                  >
                    {activeToolMeta ? (
                      (() => {
                        const reconnected = Math.round(
                          (cp.trapped_villages_count * activeToolMeta.villagesRelievedPct) / 100
                        );
                        const left = cp.trapped_villages_count - reconnected;
                        return left > 0
                          ? `✅ ${reconnected} Reconnected (${left} Left)`
                          : `✅ ${reconnected} Reconnected`;
                      })()
                    ) : (
                      `${cp.trapped_villages_count} Cut Villages`
                    )}
                  </span>
                </div>
              </div>

              {/* Requirement 4: Real Indian Disaster Officer Metrics (NDMA Standard) */}
              <div className="mt-2.5 p-2 rounded-lg bg-slate-900/90 border border-slate-800/90 text-[11px] font-mono space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                    Golden Hour Trauma Access:
                  </span>
                  {activeToolMeta ? (
                    <span className="text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/60">
                      ✅ {isHeavy ? '35 Mins (16T Restored)' : '22 Mins (Within Golden Hour)'}
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-800/60 animate-pulse">
                      ❌ {isHeavy ? '95 Mins (IRC Weight Detour)' : '65 Mins (Critical Delay)'}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-slate-300 border-t border-slate-800/60 pt-1">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Truck className="w-3 h-3 text-amber-400 shrink-0" />
                    Daily Relief Ration Need:
                  </span>
                  <span className="text-amber-300 font-semibold text-[10px] truncate max-w-[220px]" title={`${(cp.trapped_villages_count * 0.685).toFixed(1)} Tons/Day Ration & Potable Water — Requires 16T Truck or 4 Boat Sorties`}>
                    {(cp.trapped_villages_count * 0.685).toFixed(1)} Tons/Day — {isHeavy ? '16T Truck Required' : 'Ambulance / Boat Sorties'}
                  </span>
                </div>
              </div>

              {/* 4 Counterfactual Tool Buttons */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                    Counterfactual Intervention Sandbox:
                  </span>
                  {activeToolMeta && (
                    <span className="text-[10px] font-mono font-semibold text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {activeToolMeta.name} Active
                    </span>
                  )}
                </div>

                <div className={`grid gap-1.5 text-[10px] font-mono ${panelWidth >= 440 ? 'grid-cols-4' : 'grid-cols-2'}`}>
                  {/* Tool 1: Bailey Bridge */}
                  <div className="relative">
                    <button
                      type="button"
                      disabled={isBaileyDisabled}
                      onMouseEnter={() =>
                        !isBaileyDisabled && setHoveredToolByChoke((prev) => ({ ...prev, [cp.id]: 'bridge' }))
                      }
                      onMouseLeave={() =>
                        setHoveredToolByChoke((prev) => ({ ...prev, [cp.id]: null }))
                      }
                      onClick={(e) => {
                        if (isBaileyDisabled) return;
                        e.stopPropagation();
                        onSelectChokeIdx(idx);
                        onSetIntervention(cp.id, currentTool === 'bridge' ? 'none' : 'bridge');
                      }}
                      className={`w-full py-2 px-1 rounded-lg font-semibold flex flex-col items-center justify-center transition-all border ${
                        isBaileyDisabled
                          ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                          : currentTool === 'bridge'
                          ? 'bg-emerald-700 text-white border-emerald-400 shadow-md shadow-emerald-900/50 cursor-pointer'
                          : hoveredTool === 'bridge'
                          ? 'bg-slate-800 text-white border-slate-600 cursor-pointer'
                          : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700 cursor-pointer'
                      } ${
                        isTask2Target
                          ? 'ring-4 ring-emerald-400 shadow-[0_0_15px_#10b981] animate-pulse bg-emerald-950 text-emerald-200'
                          : ''
                      }`}
                      title={
                        isBaileyDisabled
                          ? '❌ Span >60m: Causeway submerged for 600m. Exceeds modular bridge capability; recommend NDRF Boat Ferry or Med-Drone'
                          : 'Class-40 Bailey Bridge: Spans gap, restores 16T Trucks and Ambulances'
                      }
                    >
                      <Construction className="w-3.5 h-3.5 mb-0.5 text-emerald-400" />
                      <span className="truncate">{isBaileyDisabled ? 'Span >60m' : 'Bailey Bridge'}</span>
                      <span className="text-[9px] text-slate-400">{isBaileyDisabled ? 'Disabled' : '₹72L • 48h'}</span>
                    </button>
                    {isTask2Target && !isBaileyDisabled && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 bg-emerald-400 text-slate-950 font-mono font-bold text-[8px] px-1.5 py-0.2 rounded-full shadow-[0_0_10px_#10b981] whitespace-nowrap animate-bounce">
                        👇 SNAP BAILEY BRIDGE
                      </div>
                    )}
                  </div>

                  {/* Tool 2: Field Clinic Booth */}
                  <div className="relative">
                    <button
                      type="button"
                      onMouseEnter={() =>
                        setHoveredToolByChoke((prev) => ({ ...prev, [cp.id]: 'booth' }))
                      }
                      onMouseLeave={() =>
                        setHoveredToolByChoke((prev) => ({ ...prev, [cp.id]: null }))
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectChokeIdx(idx);
                        onSetIntervention(cp.id, currentTool === 'booth' ? 'none' : 'booth');
                      }}
                      className={`w-full py-2 px-1 rounded-lg font-semibold flex flex-col items-center justify-center transition-all cursor-pointer border ${
                        currentTool === 'booth'
                          ? 'bg-emerald-800 text-white border-emerald-400 shadow-md'
                          : hoveredTool === 'booth'
                          ? 'bg-slate-800 text-white border-slate-600'
                          : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
                      } ${
                        hoveredTool === 'booth' ? 'ring-2 ring-emerald-500/50' : ''
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5 mb-0.5 text-emerald-400" />
                      <span className="truncate">Field Clinic</span>
                      <span className="text-[9px] text-slate-400">₹15L • 6h</span>
                    </button>
                  </div>

                  {/* Tool 3: Medical UAV Drone */}
                  <div className="relative">
                    <button
                      type="button"
                      onMouseEnter={() =>
                        setHoveredToolByChoke((prev) => ({ ...prev, [cp.id]: 'drone' }))
                      }
                      onMouseLeave={() =>
                        setHoveredToolByChoke((prev) => ({ ...prev, [cp.id]: null }))
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectChokeIdx(idx);
                        onSetIntervention(cp.id, currentTool === 'drone' ? 'none' : 'drone');
                      }}
                      className={`w-full py-2 px-1 rounded-lg font-semibold flex flex-col items-center justify-center transition-all cursor-pointer border ${
                        currentTool === 'drone'
                          ? 'bg-purple-700 text-white border-purple-400 shadow-md shadow-purple-900/50'
                          : hoveredTool === 'drone'
                          ? 'bg-slate-800 text-white border-slate-600'
                          : opsMode === 'night'
                          ? 'bg-purple-950/70 text-purple-200 border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.35)]'
                          : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
                      }`}
                      title={
                        isHeavy
                          ? '⚠️ Carries Medical Only — Requires Bailey Bridge for 16T Ration Trucks'
                          : opsMode === 'night'
                          ? 'FLIR Thermal Night-Vision Airdrop Active'
                          : 'Autonomous Medical UAV Drone'
                      }
                    >
                      <Radio className="w-3.5 h-3.5 mb-0.5 text-purple-400" />
                      <span className="truncate">Med Drone</span>
                      <span className="text-[9px] text-slate-400">
                        {opsMode === 'night' ? 'FLIR Night' : '₹8L • 45m'}
                      </span>
                    </button>
                    {isHeavy && (
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 bg-amber-950 text-amber-300 border border-amber-700 font-mono text-[7px] px-1 py-0.2 rounded whitespace-nowrap" title="Requires Bailey Bridge for 16T Ration Trucks">
                        Med Only
                      </div>
                    )}
                    {opsMode === 'night' && !isHeavy && (
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 bg-purple-950 text-purple-300 border border-purple-700 font-mono text-[7px] px-1 py-0.2 rounded whitespace-nowrap">
                        Thermal FLIR
                      </div>
                    )}
                  </div>

                  {/* Tool 4: Zodiac Boat Ferry */}
                  <div className="relative">
                    <button
                      type="button"
                      disabled={opsMode === 'night'}
                      onMouseEnter={() =>
                        setHoveredToolByChoke((prev) => ({ ...prev, [cp.id]: 'boat' }))
                      }
                      onMouseLeave={() =>
                        setHoveredToolByChoke((prev) => ({ ...prev, [cp.id]: null }))
                      }
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
                          ? 'bg-cyan-700 text-white border-cyan-400 shadow-md shadow-cyan-900/50 cursor-pointer'
                          : hoveredTool === 'boat'
                          ? 'bg-slate-800 text-white border-slate-600 cursor-pointer'
                          : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700 cursor-pointer'
                      }`}
                      title={
                        opsMode === 'night'
                          ? '🚤 Boat Ferry Grounded at Night (Barak River Zero Nav Visibility)'
                          : isHeavy
                          ? '⚠️ Carries Light Passengers Only — Requires Bailey Bridge for 16T Ration Trucks'
                          : 'Deploy Zodiac Inflatable Boat Ferry'
                      }
                    >
                      <Anchor className="w-3.5 h-3.5 mb-0.5 text-cyan-400" />
                      <span className="truncate">Boat Ferry</span>
                      <span className="text-[9px] text-slate-400">
                        {opsMode === 'night' ? 'Grounded' : '₹3.5L • 3h'}
                      </span>
                    </button>
                    {isHeavy && opsMode !== 'night' && (
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 bg-amber-950 text-amber-300 border border-amber-700 font-mono text-[7px] px-1 py-0.2 rounded whitespace-nowrap" title="Requires Bailey Bridge for 16T Ration Trucks">
                        Light Only
                      </div>
                    )}
                    {opsMode === 'night' && (
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 bg-rose-950 text-rose-300 border border-rose-800 font-mono text-[7px] px-1 py-0.2 rounded whitespace-nowrap">
                        🌙 Grounded
                      </div>
                    )}
                  </div>
                </div>

                {/* REQUIREMENT 2: Dedicated "Operational Effect & Map Action" Explanation Box */}
                {previewMeta ? (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-[11px] font-mono space-y-1.5 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-400 border-b border-slate-800 pb-1">
                      <span className="flex items-center gap-1.5">
                        {React.createElement(toolIcons[previewMeta.type] || Sliders, {
                          className: 'w-3.5 h-3.5 text-emerald-400',
                        })}
                        {previewMeta.name.toUpperCase()} ({previewMeta.setupCost})
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-sans">
                        {hoveredTool ? 'Hover Preview' : 'Active Deployment'}
                      </span>
                    </div>

                    <p className="text-slate-300 leading-relaxed font-sans text-xs">
                      {previewMeta.plainExplanation}
                    </p>

                    <div className="flex items-center gap-1.5 text-[10px] text-cyan-300 bg-cyan-950/40 px-2 py-1 rounded border border-cyan-800/50">
                      <Navigation className="w-3 h-3 shrink-0 text-cyan-400" />
                      <span className="truncate">Map Visual: {previewMeta.mapActionLabel}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 p-2 rounded-lg bg-slate-900/40 border border-slate-800/60 text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                    <Sliders className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>Hover or select an intervention above to preview operational effect &amp; map action</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
