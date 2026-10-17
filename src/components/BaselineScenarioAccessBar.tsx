import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { EvidenceBadge } from './common/EvidenceBadge';

interface BaselineScenarioAccessBarProps {
  progress: number; // 0 (baseline) .. 1 (simulated closure)
  onChangeProgress: (progress: number) => void;
  className?: string;
}

export const BaselineScenarioAccessBar: React.FC<BaselineScenarioAccessBarProps> = ({
  progress,
  onChangeProgress,
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    let start = performance.now();
    const duration = 2800; // 2.8s smooth transition
    const initialProgress = progress;

    const frame = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const nextProgress = Math.min(1, initialProgress + t * (1 - initialProgress));
      onChangeProgress(nextProgress);

      if (nextProgress < 1) {
        animRef.current = requestAnimationFrame(frame);
      } else {
        setIsPlaying(false);
      }
    };

    animRef.current = requestAnimationFrame(frame);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying]);

  // Interpolated metrics across the 319 settlements
  const totalSettlements = 319;
  const noRouteCount = Math.round(progress * 42);
  const reroutedCount = Math.round(progress * 41);
  const reachableCount = totalSettlements - noRouteCount - reroutedCount;
  const maxDetourKm = (progress * 11.68).toFixed(2);

  const isBaseline = progress <= 0.05;
  const isFullySimulated = progress >= 0.95;

  return (
    <div
      className={`bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 shadow-2xl text-slate-100 select-none ${className}`}
    >
      {/* Header with Title & Non-negotiable Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
            <span>🗺️ Baseline vs Scenario Access</span>
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-600/80 text-[10px] font-mono font-extrabold uppercase tracking-wide">
            SIMULATED CLOSURE, not a confirmed event
          </span>
        </div>

        <div className="flex items-center gap-1">
          <EvidenceBadge evidenceClass="SIMULATED" size="xs" />
          <EvidenceBadge evidenceClass="MODELLED" size="xs" />
        </div>
      </div>

      {/* Live Metrics Counter Bar */}
      <div className="grid grid-cols-4 gap-1.5 mt-2.5 text-center font-mono text-[11px]">
        <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60">
          <span className="text-[10px] text-emerald-400 block font-semibold">Reachable</span>
          <span className="text-sm font-bold text-emerald-300">{reachableCount}</span>
          <span className="text-[9px] text-slate-400 block">Baseline Direct</span>
        </div>

        <div className="p-1.5 rounded-lg bg-amber-950/60 border border-amber-800/60">
          <span className="text-[10px] text-amber-400 block font-semibold">Rerouted</span>
          <span className="text-sm font-bold text-amber-300">{reroutedCount}</span>
          <span className="text-[9px] text-slate-400 block">+km Detour</span>
        </div>

        <div className="p-1.5 rounded-lg bg-rose-950/60 border border-rose-800/60">
          <span className="text-[10px] text-rose-400 block font-semibold">No Route</span>
          <span className="text-sm font-bold text-rose-300">{noRouteCount}</span>
          <span className="text-[9px] text-slate-400 block">Cut-Off</span>
        </div>

        <div className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800">
          <span className="text-[10px] text-cyan-400 block font-semibold">Max Detour</span>
          <span className="text-sm font-bold text-cyan-300">{maxDetourKm} km</span>
          <span className="text-[9px] text-slate-400 block truncate" title="Binnakandi">Binnākāndi</span>
        </div>
      </div>

      {/* Slider Controls with Play / Pause / Reset */}
      <div className="mt-2.5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (isFullySimulated) {
              onChangeProgress(0);
              setIsPlaying(true);
            } else {
              setIsPlaying(!isPlaying);
            }
          }}
          className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center shrink-0 cursor-pointer shadow-md transition-all"
          title={isPlaying ? 'Pause animation' : isFullySimulated ? 'Replay simulation' : 'Animate to simulated closure'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsPlaying(false);
            onChangeProgress(0);
          }}
          className={`p-1.5 rounded-lg border text-xs font-mono shrink-0 cursor-pointer transition-all ${
            isBaseline
              ? 'bg-slate-800 text-slate-500 border-slate-700'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600'
          }`}
          title="Reset to 100% baseline reachable state"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="flex-1 flex flex-col gap-0.5">
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span className={isBaseline ? 'text-emerald-400 font-bold' : ''}>Baseline Access (319)</span>
            <span className="text-slate-500">|</span>
            <span className={isFullySimulated ? 'text-rose-400 font-bold' : ''}>Simulated Closure (42 Cut)</span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(progress * 100)}
            onChange={(e) => {
              setIsPlaying(false);
              onChangeProgress(parseInt(e.target.value, 10) / 100);
            }}
            className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
