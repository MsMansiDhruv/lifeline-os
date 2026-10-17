import React from 'react';
import { Sliders, CheckCircle2, Clock, Activity, Coins, Radio } from 'lucide-react';
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

  // Baseline 191% down to 108%
  const currentIcuLoad = Math.max(104, 191 - avgSurgeRelief);

  const budgetDisplay =
    totalBudgetLakhs >= 100
      ? `₹${(totalBudgetLakhs / 100).toFixed(2)} Cr`
      : `₹${totalBudgetLakhs.toFixed(1)} L`;

  const isWide = panelWidth >= 440;

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 shadow-lg select-none text-slate-200">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-slate-900 text-slate-200 border border-slate-700">
            <Sliders className="w-4 h-4 text-cyan-400" />
          </span>
          <span className="text-sm font-bold text-white tracking-wide">
            Live SEOC Simulation Scorecard
          </span>
        </div>

        {activeDeploymentsCount > 0 ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {activeDeploymentsCount} of {chokePoints.length} Corridors Active
          </span>
        ) : (
          <span className="text-xs text-slate-400">
            Assign tools to preview impact
          </span>
        )}
      </div>

      {/* Grid of Metrics */}
      <div className={`grid gap-2.5 ${isWide ? 'grid-cols-4' : 'grid-cols-2'}`}>
        {/* Cell 1: Active Deployments */}
        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-blue-400" />
            Deployments
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white tracking-tight leading-none">
              {activeDeploymentsCount}
            </span>
            <span className="text-xs text-slate-400">/ {chokePoints.length}</span>
          </div>
        </div>

        {/* Cell 2: Villages Reconnected */}
        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Reconnected
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span
              className={`text-2xl font-bold tracking-tight leading-none ${
                totalVillagesReached > 0 ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              {totalVillagesReached}
            </span>
            <span className="text-xs text-slate-400">/ {totalTrappedVillages}</span>
          </div>
        </div>

        {/* Cell 3: ICU Load Stabilized (Never negative!) */}
        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-cyan-400" />
            ICU Status (demo)
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span
              className={`text-2xl font-bold tracking-tight leading-none ${
                currentIcuLoad <= 110 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {activeDeploymentsCount > 0 ? `${currentIcuLoad}%` : 'High Load'}
            </span>
            <span className="text-xs text-slate-400">
              {currentIcuLoad <= 110 ? 'Safe' : 'Assumed'}
            </span>
          </div>
        </div>

        {/* Cell 4: Sanctioned Budget */}
        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-400" />
            SDRF Sanction
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span
              className={`text-2xl font-bold tracking-tight leading-none ${
                totalBudgetLakhs > 0 ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              {totalBudgetLakhs > 0 ? budgetDisplay : '₹0.0 L'}
            </span>
            <span className="text-xs text-slate-400">Capex</span>
          </div>
        </div>
      </div>

      {/* Subtle Bottom Status Strip: Fastest Response Time */}
      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-slate-400">Fastest Vector:</span>
        </span>
        <span className={fastestMinutes !== null ? 'text-purple-300 font-semibold' : 'text-slate-500'}>
          {fastestLabel}
        </span>
      </div>
    </div>
  );
};
