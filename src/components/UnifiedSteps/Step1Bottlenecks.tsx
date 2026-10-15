import React from 'react';
import {
  INTERVENTION_TOOLS,
  InterventionType,
  TheaterData,
  TheaterChokePoint,
} from '../../data/theaters';
import { JuryScorecard } from '../JuryScorecard';
import {
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  MapPin,
  CheckCircle2,
  Clock,
  Activity,
  Layers,
  Truck,
} from 'lucide-react';

interface Step1BottlenecksProps {
  currentTheater: TheaterData;
  interventions: Record<string, InterventionType>;
  onSetIntervention: (chokePointId: string, tool: InterventionType) => void;
  onResetInterventions: () => void;
  selectedChokeIdx: number;
  onSelectChokeIdx: (idx: number) => void;
  fleetMode: string;
}

export const Step1Bottlenecks: React.FC<Step1BottlenecksProps> = ({
  currentTheater,
  interventions,
  onSetIntervention,
  onResetInterventions,
  selectedChokeIdx,
  onSelectChokeIdx,
  fleetMode,
}) => {
  const isHeavy = fleetMode.includes('Heavy') || fleetMode.includes('16T');
  const chokePoints = currentTheater.chokePoints;
  const selectedChoke: TheaterChokePoint = chokePoints[selectedIdxOrClamped(selectedChokeIdx, chokePoints.length)];

  function selectedIdxOrClamped(idx: number, len: number) {
    if (len === 0) return 0;
    if (idx >= len) return 0;
    return idx;
  }

  const activeTool = interventions[selectedChoke.id] || 'none';

  return (
    <div className="space-y-4">
      {/* Step Header & Reset */}
      <div className="bg-[#161b22] border border-[#30363d] p-3 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-950/80 border border-rose-600/40 text-rose-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">
              Step 1: 🛣️ Single-Point Road Bottlenecks &amp; 4-Tool Sandbox
            </h3>
            <p className="text-[11px] text-[#8b949e]">
              Tarjan O(V+E) cut-edge bridges where washouts leave 0 backup routes. Select a tool to simulate live fixes.
            </p>
          </div>
        </div>

        {Object.keys(interventions).length > 0 && (
          <button
            onClick={onResetInterventions}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-neutral-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Map</span>
          </button>
        )}
      </div>

      {/* Live Simulation Scorecard */}
      <JuryScorecard chokePoints={chokePoints} interventions={interventions} />

      {/* Bottlenecks List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
          <span className="font-semibold uppercase tracking-wider text-[10px]">
            Severed Articulation Corridors ({chokePoints.length})
          </span>
          <span className="text-[11px] text-cyan-400">Click a card to focus map</span>
        </div>

        {chokePoints.map((cp, idx) => {
          const isSelected = idx === selectedChokeIdx;
          const currentTool = interventions[cp.id] || 'none';
          const toolMeta = currentTool !== 'none' ? INTERVENTION_TOOLS[currentTool] : null;

          return (
            <div
              key={cp.id}
              onClick={() => onSelectChokeIdx(idx)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#1c2128] border-blue-500 shadow-md ring-1 ring-blue-500/50'
                  : 'bg-[#161b22] border-[#30363d] hover:border-neutral-500'
              }`}
            >
              {/* Card Top: Rank, Name, Trapped Villages */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center font-mono font-bold text-[10px] ${
                      toolMeta
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                        : cp.rank === 1
                        ? 'bg-rose-950 text-rose-300 border border-rose-700'
                        : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                    }`}
                  >
                    #{cp.rank}
                  </span>
                  <div>
                    <h4 className="font-bold text-white text-xs flex items-center gap-2">
                      {cp.road_name}
                      {isSelected && (
                        <span className="text-[9px] font-mono bg-blue-950 text-blue-300 px-1.5 py-0.2 rounded border border-blue-800">
                          Active Focus
                        </span>
                      )}
                    </h4>
                    <span className="text-[10px] text-neutral-400">
                      {cp.exposed_meters}m breach • Baseline {cp.baseline_km}km vs Detour {cp.detour_km}km
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${
                      toolMeta
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                        : 'bg-rose-950/80 text-rose-300 border-rose-800'
                    }`}
                  >
                    {toolMeta
                      ? `-${Math.round((cp.trapped_villages_count * toolMeta.villagesRelievedPct) / 100)} Reconnected`
                      : `${cp.trapped_villages_count} Cut Villages`}
                  </span>
                </div>
              </div>

              {/* 4-Tool Sandbox Buttons */}
              <div className="mt-3 pt-2.5 border-t border-[#21262d]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Counterfactual Intervention Sandbox:
                  </span>
                  {toolMeta && (
                    <span className="text-[10px] font-bold text-emerald-400">
                      ● {toolMeta.name} Active
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                  {/* Tool 1: Modular Bailey Bridge ₹72L */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectChokeIdx(idx);
                      onSetIntervention(cp.id, currentTool === 'bridge' ? 'none' : 'bridge');
                    }}
                    className={`py-1.5 px-1 rounded-lg font-bold flex flex-col items-center justify-center transition-all cursor-pointer border ${
                      currentTool === 'bridge'
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-900/50'
                        : 'bg-[#0d1117] text-neutral-300 hover:text-white border-[#21262d] hover:border-neutral-500'
                    }`}
                  >
                    <span className="text-xs">🛠️</span>
                    <span className="truncate">Bridge ₹72L</span>
                    <span className="text-[9px] text-neutral-400 font-mono">48h (16T)</span>
                  </button>

                  {/* Tool 2: Mobile Health Booth ₹15L */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectChokeIdx(idx);
                      onSetIntervention(cp.id, currentTool === 'booth' ? 'none' : 'booth');
                    }}
                    className={`py-1.5 px-1 rounded-lg font-bold flex flex-col items-center justify-center transition-all cursor-pointer border ${
                      currentTool === 'booth'
                        ? 'bg-emerald-700 text-white border-emerald-400 shadow-md'
                        : 'bg-[#0d1117] text-neutral-300 hover:text-white border-[#21262d] hover:border-neutral-500'
                    }`}
                  >
                    <span className="text-xs">⛺</span>
                    <span className="truncate">Booth ₹15L</span>
                    <span className="text-[9px] text-neutral-400 font-mono">6h (-80% ER)</span>
                  </button>

                  {/* Tool 3: Med-Drone ₹8L */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectChokeIdx(idx);
                      onSetIntervention(cp.id, currentTool === 'drone' ? 'none' : 'drone');
                    }}
                    className={`py-1.5 px-1 rounded-lg font-bold flex flex-col items-center justify-center transition-all cursor-pointer border ${
                      currentTool === 'drone'
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-900/50'
                        : 'bg-[#0d1117] text-neutral-300 hover:text-white border-[#21262d] hover:border-neutral-500'
                    }`}
                  >
                    <span className="text-xs">🚁</span>
                    <span className="truncate">Drone ₹8L</span>
                    <span className="text-[9px] text-neutral-400 font-mono">45m Air</span>
                  </button>

                  {/* Tool 4: Rescue Boat ₹3.5L */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectChokeIdx(idx);
                      onSetIntervention(cp.id, currentTool === 'boat' ? 'none' : 'boat');
                    }}
                    className={`py-1.5 px-1 rounded-lg font-bold flex flex-col items-center justify-center transition-all cursor-pointer border ${
                      currentTool === 'boat'
                        ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-900/50'
                        : 'bg-[#0d1117] text-neutral-300 hover:text-white border-[#21262d] hover:border-neutral-500'
                    }`}
                  >
                    <span className="text-xs">🚤</span>
                    <span className="truncate">Boat ₹3.5L</span>
                    <span className="text-[9px] text-neutral-400 font-mono">3h Ferry</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
