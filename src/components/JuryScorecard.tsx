import React from 'react';
import { Sliders, CheckCircle2, Clock, Activity, Coins, ShieldCheck, Radio } from 'lucide-react';
import { INTERVENTION_TOOLS, InterventionType, TheaterChokePoint } from '../data/theaters';

interface JuryScorecardProps {
  chokePoints: TheaterChokePoint[];
  interventions: Record<string, InterventionType>;
  panelWidth?: number;
}

export const JuryScorecard: React.FC<JuryScorecardProps> = ({
  chokePoints,
  interventions,
  panelWidth = 430,
}) => {
  const activeEntries = Object.entries(interventions).filter(
    ([, tool]) => tool && tool !== 'none'
  );

  const activeDeploymentsCount = activeEntries.length;

  let totalVillagesReached = 0;
  let totalTrappedVillages = 0;
  let totalBudgetLakhs = 0;
  let fastestMinutes: number | null = null;
  let fastestLabel = 'Standby';
  let totalSurgeReliefSum = 0;

  chokePoints.forEach((cp) => {
    totalTrappedVillages += cp.trapped_villages_count;
    const toolKey = interventions[cp.id];
    if (toolKey && toolKey !== 'none') {
      const tool = INTERVENTION_TOOLS[toolKey];
      const reached = Math.round((cp.trapped_villages_count * tool.villagesRelievedPct) / 100);
      totalVillagesReached += reached;
      totalBudgetLakhs += tool.costInLakhs;
      totalSurgeReliefSum += tool.hospitalSurgeReliefPct;

      if (fastestMinutes === null || tool.timeMinutes < fastestMinutes) {
        fastestMinutes = tool.timeMinutes;
        fastestLabel = `${tool.timeStr} (${tool.name.split(' ')[0]})`;
      }
    }
  });

  const avgSurgeRelief =
    activeDeploymentsCount > 0 ? Math.round(totalSurgeReliefSum / activeDeploymentsCount) : 0;

  const budgetDisplay =
    totalBudgetLakhs >= 100
      ? `₹${(totalBudgetLakhs / 100).toFixed(2)} Cr`
      : `₹${totalBudgetLakhs.toFixed(1)} L`;

  const isWide = panelWidth >= 440;

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 shadow-lg select-none">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-slate-900 text-slate-300 border border-slate-700/60">
            <Sliders className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            Live Simulation Scorecard
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
            Counterfactual
          </span>
        </div>

        {activeDeploymentsCount > 0 ? (
          <span className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {activeDeploymentsCount} Active
          </span>
        ) : (
          <span className="text-[10px] font-mono text-slate-500">
            Select a counterfactual tool
          </span>
        )}
      </div>

      {/* Auto-Adjusting Grid based on Panel Width: 2 cols when < 440px, 4 cols when >= 440px */}
      <div className={`grid gap-2.5 ${isWide ? 'grid-cols-4' : 'grid-cols-2'}`}>
        {/* Cell 1: Active Deployments */}
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            Deployments
          </span>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="font-mono font-semibold text-[20px] text-white tabular-nums leading-none">
              {activeDeploymentsCount}
            </span>
            <span className="font-mono text-xs text-slate-500">/ {chokePoints.length}</span>
          </div>
        </div>

        {/* Cell 2: Villages Reconnected */}
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Reconnected
          </span>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span
              className={`font-mono font-semibold text-[20px] tabular-nums leading-none ${
                totalVillagesReached > 0 ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              {totalVillagesReached}
            </span>
            <span className="font-mono text-xs text-slate-500">/ {totalTrappedVillages}</span>
          </div>
        </div>

        {/* Cell 3: Clinical Surge Relief */}
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            ER Relief
          </span>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span
              className={`font-mono font-semibold text-[20px] tabular-nums leading-none ${
                avgSurgeRelief > 0 ? 'text-cyan-400' : 'text-slate-400'
              }`}
            >
              {avgSurgeRelief > 0 ? `-${avgSurgeRelief}%` : '0%'}
            </span>
            <span className="font-mono text-[10px] text-slate-500">Peak ICU</span>
          </div>
        </div>

        {/* Cell 4: Sanctioned Budget */}
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            Sanction
          </span>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span
              className={`font-mono font-semibold text-[20px] tabular-nums leading-none ${
                totalBudgetLakhs > 0 ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              {totalBudgetLakhs > 0 ? budgetDisplay : '₹0.0 L'}
            </span>
            <span className="font-mono text-[10px] text-slate-500">Capex</span>
          </div>
        </div>
      </div>

      {/* Subtle Bottom Status Strip: Fastest Response Time */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-purple-400" />
          <span>Fastest Vector:</span>
        </span>
        <span className={fastestMinutes !== null ? 'text-purple-300 font-semibold' : 'text-slate-500'}>
          {fastestLabel}
        </span>
      </div>
    </div>
  );
};
