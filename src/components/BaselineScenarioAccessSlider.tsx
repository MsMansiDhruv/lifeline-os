import React from 'react';
import { Sliders, AlertTriangle, ArrowLeftRight, CheckCircle2, Navigation, AlertOctagon } from 'lucide-react';
import { EVIDENCE_CLASS_CONFIG } from '../types/evidence';

interface BaselineScenarioAccessSliderProps {
  sliderValue: number; // 0 (100% baseline) to 100 (100% simulated closure)
  onChangeSliderValue: (val: number) => void;
  isSimulatedClosureActive: boolean;
  onToggleSimulatedClosure: () => void;
  isRerouted?: boolean;
  onToggleReroute?: () => void;
  reachableCount: number;
  reroutedCount: number;
  isolatedCount: number;
  totalCount: number;
}

export const BaselineScenarioAccessSlider: React.FC<BaselineScenarioAccessSliderProps> = ({
  sliderValue,
  onChangeSliderValue,
  isSimulatedClosureActive,
  onToggleSimulatedClosure,
  isRerouted = false,
  onToggleReroute,
  reachableCount,
  reroutedCount,
  isolatedCount,
  totalCount,
}) => {
  const simBadge = EVIDENCE_CLASS_CONFIG.SIMULATED;

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-3 shadow-xl select-none text-slate-100 max-w-xl w-full">
      {/* Header with Mandatory Badge */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${simBadge.badgeBg} ${simBadge.badgeText} ${simBadge.badgeBorder} flex items-center gap-1 shrink-0`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${simBadge.dotColor} animate-pulse`}></span>
            SIMULATED CLOSURE, not a confirmed event
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onToggleReroute && (
            <button
              type="button"
              onClick={onToggleReroute}
              className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                isRerouted
                  ? 'bg-blue-950 border-blue-500 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Reroute ambulances and habitations via elevated Kumbhirgram bypass"
            >
              <span>🚑 {isRerouted ? 'Rerouted (Bypass)' : 'Reroute Habitations'}</span>
            </button>
          )}

          {/* Quick Toggle Button */}
          <button
            type="button"
            onClick={onToggleSimulatedClosure}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              isSimulatedClosureActive
                ? 'bg-rose-950/70 border-rose-600 text-rose-300'
                : 'bg-emerald-950/70 border-emerald-600 text-emerald-300'
            }`}
            title="Toggle between Baseline Normal Access and Simulated Closure Impact"
          >
            <ArrowLeftRight className="w-3 h-3" />
            <span>{isSimulatedClosureActive ? 'Simulated Cut Active' : 'Baseline Normal'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Transition Slider */}
      <div className="mt-2.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
          <span className={sliderValue === 0 ? 'text-emerald-400 font-bold' : ''}>
            Baseline (0% Disruption)
          </span>
          <span className="text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
            {sliderValue}% Impact State
          </span>
          <span className={sliderValue === 100 ? 'text-rose-400 font-bold' : ''}>
            Severed Closure (100%)
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={sliderValue}
          onChange={(e) => onChangeSliderValue(parseInt(e.target.value, 10))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 hover:accent-rose-400 transition-all"
        />
      </div>

      {/* Live Settlement Access Counter (Requirement C) */}
      <div className="grid grid-cols-3 gap-2 mt-2.5 text-center text-xs">
        <div className="p-1.5 rounded-xl bg-emerald-950/40 border border-emerald-900/50">
          <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-400 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            Reachable
          </div>
          <span className="text-sm font-mono font-bold text-emerald-300 block mt-0.5">
            {reachableCount}
          </span>
        </div>

        <div className="p-1.5 rounded-xl bg-amber-950/40 border border-amber-900/50">
          <div className="flex items-center justify-center gap-1 text-[10px] text-amber-400 font-medium">
            <Navigation className="w-3 h-3" />
            Rerouted (+km)
          </div>
          <span className="text-sm font-mono font-bold text-amber-300 block mt-0.5">
            {reroutedCount}
          </span>
        </div>

        <div className="p-1.5 rounded-xl bg-rose-950/40 border border-rose-900/50">
          <div className="flex items-center justify-center gap-1 text-[10px] text-rose-400 font-medium">
            <AlertOctagon className="w-3 h-3" />
            No Route (Cut-off)
          </div>
          <span className="text-sm font-mono font-bold text-rose-300 block mt-0.5">
            {isolatedCount}
          </span>
        </div>
      </div>

      <div className="mt-2 text-[10px] text-slate-400 font-mono text-center">
        Total Habitations Evaluated: <strong className="text-white">{totalCount}</strong> | Detour Penalty: <span className="text-amber-300 font-bold">+47 mins via Kumbhirgram</span>
      </div>
    </div>
  );
};
