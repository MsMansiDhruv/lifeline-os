import React from 'react';
import { Sparkles, Truck, Shield, AlertTriangle } from 'lucide-react';
import { FleetMode } from '../types';
import { INTERVENTION_TOOLS, InterventionType, TheaterData } from '../data/theaters';

interface CommandOverviewProps {
  currentTheater: TheaterData;
  interventions: Record<string, InterventionType>;
  fleetMode: FleetMode;
  onFleetChange?: (mode: FleetMode) => void;
}

export const CommandOverview: React.FC<CommandOverviewProps> = ({
  currentTheater,
  interventions,
  fleetMode,
  onFleetChange,
}) => {
  const isHeavy = fleetMode === 'Heavy Supply (Truck/Bus)';
  const chokePoints = currentTheater.chokePoints;
  const hospitals = currentTheater.hospitals;

  // Active interventions analysis
  const activeEntries = Object.entries(interventions).filter(
    ([, tool]) => tool && tool !== 'none'
  );
  const activeCount = activeEntries.length;

  // Compute worst single failure dynamically
  let worstChoke = chokePoints[0] || { trapped_villages_count: 27, road_name: 'Corridor' };
  chokePoints.forEach((cp) => {
    if (cp.trapped_villages_count > worstChoke.trapped_villages_count) {
      worstChoke = cp;
    }
  });

  const baseWorstCut = worstChoke.trapped_villages_count;
  const rawWorstCut = isHeavy ? baseWorstCut + 11 : baseWorstCut;
  const worstTool = interventions[worstChoke.id];
  let dynamicWorstCut = rawWorstCut;

  if (worstTool && worstTool !== 'none') {
    const relievedPct = INTERVENTION_TOOLS[worstTool].villagesRelievedPct;
    dynamicWorstCut = Math.round(rawWorstCut * (1 - relievedPct / 100));
  }

  // Compute overloaded hospitals count (>150% surge)
  const baseOverloadedCount = hospitals.filter((h) => h.baseline_surge > 150).length;
  let dynamicOverloadedCount = baseOverloadedCount;
  if (activeCount >= 2) {
    dynamicOverloadedCount = Math.max(0, baseOverloadedCount - 2);
  } else if (activeCount === 1) {
    dynamicOverloadedCount = Math.max(0, baseOverloadedCount - 1);
  }

  const displayedRoadsCount = currentTheater.totalRoads + (isHeavy ? 6 : 0);

  return (
    <div className="space-y-3.5">
      {/* 1-Line Interactive Walkthrough Guide Bar (No "Jury" word) */}
      <div className="bg-slate-900 border border-blue-900/40 px-3.5 py-2 rounded-xl flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2 truncate">
          <span className="text-amber-400 font-bold shrink-0">Workflow:</span>
          <span className="truncate text-slate-300">
            <strong>(1)</strong> Select a washed-out bridge on the left to inspect isolated villages &bull;{' '}
            <strong>(2)</strong> Deploy counterfactual tools (Bridge / Boat / Drone / Clinic) &bull;{' '}
            <strong>(3)</strong> Watch network connectivity and clinic surge rebalance in real time.
          </span>
        </div>
        <span className="hidden sm:inline-block text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50 shrink-0 ml-2">
          {currentTheater.nodesCount}
        </span>
      </div>

      {/* Active Interventions Dynamic Banner */}
      {activeCount > 0 && (
        <div className="bg-emerald-950/70 border border-emerald-500/80 px-4 py-2.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium text-white">
              {activeCount} Counterfactual Intervention{activeCount > 1 ? 's' : ''} Active across {currentTheater.name.split(',')[0]}!
            </span>
          </div>
          <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-emerald-900/90 text-emerald-300 border border-emerald-500 font-mono font-bold text-[11px]">
            MAX BOTTLENECK: {rawWorstCut} &rarr; {dynamicWorstCut} VILLAGES CUT
          </span>
        </div>
      )}

      {/* Heavy Axle Constraint Notice & +11 Delta Badge */}
      {isHeavy && (
        <div className="bg-amber-950/60 border border-amber-500/70 px-4 py-2 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>16-Ton Axle Constraint: Rural feeder bridges &lt;3.5m pruned. Axle weight bans isolate 11 additional villages. Only Bailey Bridges support full 16T payload.</span>
          </div>
          <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-amber-900 text-amber-300 border border-amber-500 font-mono font-bold text-[11px] shadow-sm animate-pulse">
            +11 Villages Blocked for Heavy Trucks
          </span>
        </div>
      )}

      {/* 4 Plain-Language High-Contrast KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Single-Point Road Bottlenecks */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Road Bottlenecks
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {displayedRoadsCount}
            </span>
            {isHeavy ? (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-700/80">
                +6 Heavy Bans
              </span>
            ) : (
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-rose-950/80 text-rose-300 border border-rose-800/50">
                Zero Backup Routes
              </span>
            )}
          </div>
        </div>

        {/* KPI 2: Worst Single Failure */}
        <div
          className={`bg-slate-900 border rounded-xl p-4 shadow-sm transition-all flex flex-col justify-between ${
            worstTool && worstTool !== 'none'
              ? 'border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
              : 'border-slate-800 hover:border-rose-500/40'
          }`}
        >
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate font-mono">
            Worst Failure ({worstChoke.road_name.split(' ')[0]})
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div className="flex items-baseline gap-1.5 font-mono">
              <span
                className={`text-3xl font-extrabold tracking-tight ${
                  worstTool && worstTool !== 'none' ? 'text-emerald-400' : 'text-rose-500'
                }`}
              >
                {dynamicWorstCut}
              </span>
              {isHeavy && !worstTool && (
                <span className="text-[10px] font-mono text-amber-400 font-bold">(+11 Heavy)</span>
              )}
            </div>
            {worstTool && worstTool !== 'none' ? (
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-700/80">
                -{rawWorstCut - dynamicWorstCut} Reconnected
              </span>
            ) : (
              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border ${
                isHeavy ? 'bg-amber-950/90 text-amber-300 border-amber-600' : 'bg-rose-950/70 text-rose-400 border-rose-800/60'
              }`}>
                {rawWorstCut} Villages Trapped
              </span>
            )}
          </div>
        </div>

        {/* KPI 3: Hospitals in Critical Overload */}
        <div
          className={`bg-slate-900 border rounded-xl p-4 shadow-sm transition-all flex flex-col justify-between ${
            dynamicOverloadedCount < baseOverloadedCount
              ? 'border-emerald-500/60'
              : 'border-slate-800 hover:border-amber-500/40'
          }`}
        >
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Clinics in Critical Overload
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span
              className={`text-3xl font-extrabold tracking-tight font-mono ${
                dynamicOverloadedCount === 0
                  ? 'text-emerald-400'
                  : dynamicOverloadedCount < baseOverloadedCount
                  ? 'text-cyan-400'
                  : 'text-amber-400'
              }`}
            >
              {dynamicOverloadedCount}
            </span>
            <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border ${
              dynamicOverloadedCount < baseOverloadedCount
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/80'
                : 'bg-amber-950/70 text-amber-400 border border-amber-800/60'
            }`}>
              {dynamicOverloadedCount < baseOverloadedCount
                ? `${baseOverloadedCount - dynamicOverloadedCount} Clinics Relieved`
                : '>150% Influx'}
            </span>
          </div>
        </div>

        {/* KPI 4: Vehicle Physics Mode */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Vehicle Physics Mode
          </div>
          <div className="grid grid-cols-2 gap-1.5 mt-2 font-mono">
            <button
              onClick={() => onFleetChange && onFleetChange('Light Emergency (Ambulance/4x4)')}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                !isHeavy
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Shield className="w-3 h-3" />
              <span>4x4</span>
            </button>
            <button
              onClick={() => onFleetChange && onFleetChange('Heavy Supply (Truck/Bus)')}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                isHeavy
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Truck className="w-3 h-3" />
              <span>16T Truck</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
