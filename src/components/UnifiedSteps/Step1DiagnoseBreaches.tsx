import React from 'react';
import {
  ShieldAlert,
  Mountain,
  Navigation,
  Clock,
  Truck,
  ArrowRight,
  Droplets,
  AlertTriangle,
  Layers,
  ChevronRight,
  Activity,
  FileCheck2,
} from 'lucide-react';
import { TheaterData, TheaterChokePoint, getChokePhysicsCoords } from '../../data/theaters';

interface Step1DiagnoseBreachesProps {
  currentTheater: TheaterData;
  selectedChokeIdx: number;
  onSelectChokeIdx: (idx: number) => void;
  fleetMode: string;
  onAdvanceToStep2: () => void;
  interactiveTourTask?: number;
}

export const Step1DiagnoseBreaches: React.FC<Step1DiagnoseBreachesProps> = ({
  currentTheater,
  selectedChokeIdx,
  onSelectChokeIdx,
  fleetMode,
  onAdvanceToStep2,
  interactiveTourTask = 0,
}) => {
  const isHeavy = fleetMode.includes('Heavy') || fleetMode.includes('16T');
  const chokePoints = currentTheater.chokePoints;

  const validIdx = Math.min(selectedChokeIdx, Math.max(0, chokePoints.length - 1));
  const selectedChoke: TheaterChokePoint = chokePoints[validIdx] || chokePoints[0];

  const totalTrappedVillages = chokePoints.reduce(
    (acc, cp) => acc + (cp.trapped_villages_count || 0),
    0
  );

  return (
    <div className="space-y-3.5 select-none font-sans">
      {/* Header Banner: Structural Diagnosis Only (NO DEPLOYMENT BUTTONS) */}
      <div className="bg-slate-900/95 border border-slate-800 p-3.5 rounded-xl flex items-start justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-600/40 text-rose-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono font-bold text-white text-xs uppercase tracking-wide">
                Step 1: Structural &amp; Hydrological Diagnosis
              </h3>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold uppercase">
                Tarjan O(V+E)
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans mt-0.5 leading-relaxed">
              Isolating single-point road cut-edges where culvert scour and flood causeways leave 0 backup routes.
              Review SRTM elevation and detour penalties before testing counterfactuals.
            </p>
          </div>
        </div>
      </div>

      {/* District Severity Metric Row */}
      <div className="grid grid-cols-3 gap-2 text-center font-mono">
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block font-semibold">Severed Corridors</span>
          <span className="text-sm font-bold text-rose-400">{chokePoints.length} Critical Cut-Edges</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block font-semibold">Cut-Off Villages</span>
          <span className="text-sm font-bold text-amber-400">{totalTrappedVillages} Trapped</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block font-semibold">Max Trauma Lag</span>
          <span className="text-sm font-bold text-rose-400">
            {isHeavy ? '95 Mins (+58km)' : '65 Mins (+19km)'}
          </span>
        </div>
      </div>

      {/* Corridor Selection & Diagnosis Cards */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
          <span className="font-semibold uppercase tracking-wider text-[10px]">
            Severed Articulation Corridors ({chokePoints.length})
          </span>
          <span className="text-[11px] text-cyan-400">Click to inspect terrain profile</span>
        </div>

        {chokePoints.map((cp, idx) => {
          const isSelected = idx === validIdx;
          const coords = getChokePhysicsCoords(cp);
          const isTourTarget = interactiveTourTask === 1 && idx === 0;

          return (
            <div
              key={cp.id}
              onClick={() => onSelectChokeIdx(idx)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                isTourTarget
                  ? 'bg-slate-900 border-emerald-400 ring-4 ring-emerald-400 shadow-[0_0_25px_#10b981] animate-pulse z-20 opacity-100'
                  : isSelected
                  ? 'bg-slate-900 border-blue-500 shadow-xl ring-1 ring-blue-500/50'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header: Rank, Name, Cut Villages */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center font-mono font-bold text-[11px] ${
                      cp.rank === 1
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
                          Active Map Focus
                        </span>
                      )}
                    </h4>
                    {/* Civil Failure Classification & Gap Width */}
                    <div className="text-[10px] text-amber-300 font-mono mt-0.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span className="font-semibold">{cp.failure_type || `${coords.breachWidthMeters}m Breach Gap`}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded border bg-rose-950/80 text-rose-300 border-rose-800">
                    {cp.trapped_villages_count} Cut Villages
                  </span>
                </div>
              </div>

              {/* SRTM Elevation Profile Grid (Village Dry 41m vs Roadhead 29m vs Breach 17m) */}
              <div className="mt-3 p-2.5 rounded-lg bg-slate-950/90 border border-slate-800/80 font-mono text-[11px] space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800 pb-1">
                  <span className="flex items-center gap-1 text-cyan-400">
                    <Mountain className="w-3 h-3" />
                    SRTM 30m Elevation &amp; Hydrology Profile
                  </span>
                  <span className="text-slate-500">Gauge Peak: +2.8m</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                  {/* Point 1: Village Ridge */}
                  <div className="p-1.5 rounded bg-emerald-950/40 border border-emerald-800/40">
                    <span className="text-slate-400 block text-[9px]">Village Ridge</span>
                    <strong className="text-emerald-400 font-extrabold">{coords.villageElevationAsl}m ASL</strong>
                    <span className="text-[8px] text-emerald-300 block font-sans">100% Dry Ground</span>
                  </div>

                  {/* Point 2: Dry Roadhead Edge */}
                  <div className="p-1.5 rounded bg-blue-950/40 border border-blue-800/40">
                    <span className="text-slate-400 block text-[9px]">Dry Roadhead</span>
                    <strong className="text-blue-300 font-extrabold">{coords.dryRoadheadElevationAsl}m ASL</strong>
                    <span className="text-[8px] text-blue-300 block font-sans">600m to Water</span>
                  </div>

                  {/* Point 3: Submerged Breach */}
                  <div className="p-1.5 rounded bg-rose-950/40 border border-rose-800/40">
                    <span className="text-slate-400 block text-[9px]">Breach Bed</span>
                    <strong className="text-rose-400 font-extrabold">{coords.wetBreachElevationAsl}m ASL</strong>
                    <span className="text-[8px] text-rose-300 block font-sans">
                      {coords.breachWidthMeters}m Inundated
                    </span>
                  </div>
                </div>

                {/* Golden Hour & Daily Ration Load */}
                <div className="pt-1.5 border-t border-slate-800/60 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-rose-400" />
                      Golden Hour Trauma Access:
                    </span>
                    <span className="text-rose-400 font-bold bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-800/60 animate-pulse">
                      ❌ {isHeavy ? '95 Mins (IRC Weight Surcharge)' : '65 Mins (Critical Delay)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Truck className="w-3 h-3 text-amber-400" />
                      Daily Relief Ration Need:
                    </span>
                    <span className="text-amber-300 font-semibold">
                      {(cp.trapped_villages_count * 0.685).toFixed(1)} MT/Day ({isHeavy ? 'Requires 16T Truck' : 'Requires 4 Boat Sorties'})
                    </span>
                  </div>
                </div>
              </div>

              {/* OSRM Route Penalty Strip */}
              <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono px-1 text-slate-400">
                <span className="flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-emerald-400" />
                  Baseline Highway:{' '}
                  <strong className="text-slate-200">{cp.baseline_km} km</strong>
                </span>
                <span className="text-slate-500">➔</span>
                <span className="flex items-center gap-1 text-rose-400">
                  Forced Mud Detour:{' '}
                  <strong className="font-bold">{cp.detour_km} km (+{(cp.detour_km - cp.baseline_km).toFixed(1)} km)</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Prominent Bottom Pipeline Advancement CTA */}
      <div className="pt-2">
        <button
          onClick={onAdvanceToStep2}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] border border-blue-400/40"
        >
          <span>Next: Inspect Hospital &amp; Patient Impact (Step 2)</span>
          <ArrowRight className="w-4 h-4 text-cyan-300" />
        </button>
      </div>
    </div>
  );
};
