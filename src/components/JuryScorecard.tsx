import React from 'react';
import { Sliders, CheckCircle2, Clock, Activity } from 'lucide-react';
import { INTERVENTION_TOOLS, InterventionType, TheaterChokePoint } from '../data/theaters';

interface JuryScorecardProps {
  chokePoints: TheaterChokePoint[];
  interventions: Record<string, InterventionType>;
}

export const JuryScorecard: React.FC<JuryScorecardProps> = ({
  chokePoints,
  interventions,
}) => {
  const activeEntries = Object.entries(interventions).filter(
    ([, tool]) => tool && tool !== 'none'
  );

  const activeDeploymentsCount = activeEntries.length;

  let totalVillagesReached = 0;
  let totalTrappedVillages = 0;
  let totalBudgetLakhs = 0;
  let fastestMinutes: number | null = null;
  let fastestLabel = 'None';
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

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3 shadow-md">
      <div className="flex items-center justify-between border-b border-[#21262d] pb-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-blue-950 text-blue-400 border border-blue-800/60">
            <Sliders className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            🎛️ Live Simulation Scorecard
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0d1117] text-neutral-400 border border-[#30363d]">
            Counterfactual Sandbox
          </span>
        </div>

        {activeDeploymentsCount > 0 ? (
          <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/60">
            ● {activeDeploymentsCount} Intervention{activeDeploymentsCount > 1 ? 's' : ''} Active
          </span>
        ) : (
          <span className="text-[11px] font-mono text-neutral-500">
            Select a tool on any bottleneck card to simulate
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        {/* Metric 1: Active Deployments */}
        <div className="bg-[#0d1117] p-2 rounded-lg border border-[#21262d] flex flex-col justify-between">
          <span className="text-[10px] text-neutral-400 uppercase font-semibold">Active Deployments</span>
          <div className="flex items-baseline gap-1 mt-1">
            <strong className="text-sm font-bold text-white font-mono">{activeDeploymentsCount}</strong>
            <span className="text-[10px] text-neutral-500">/ {chokePoints.length} Bottlenecks</span>
          </div>
        </div>

        {/* Metric 2: Villages Reached */}
        <div className="bg-[#0d1117] p-2 rounded-lg border border-[#21262d] flex flex-col justify-between">
          <span className="text-[10px] text-neutral-400 uppercase font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Villages Reached
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <strong className={`text-sm font-bold font-mono ${totalVillagesReached > 0 ? 'text-emerald-400' : 'text-neutral-400'}`}>
              {totalVillagesReached}
            </strong>
            <span className="text-[10px] text-neutral-500">/ {totalTrappedVillages} Trapped</span>
          </div>
        </div>

        {/* Metric 3: Hospital Surge Relieved */}
        <div className="bg-[#0d1117] p-2 rounded-lg border border-[#21262d] flex flex-col justify-between">
          <span className="text-[10px] text-neutral-400 uppercase font-semibold flex items-center gap-1">
            <Activity className="w-3 h-3 text-cyan-400" />
            Surge Relieved
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <strong className={`text-sm font-bold font-mono ${avgSurgeRelief > 0 ? 'text-cyan-400' : 'text-neutral-400'}`}>
              {avgSurgeRelief > 0 ? `-${avgSurgeRelief}%` : '0%'}
            </strong>
            <span className="text-[10px] text-neutral-500">Avg Crisis Relief</span>
          </div>
        </div>

        {/* Metric 4: Fastest Response Time */}
        <div className="bg-[#0d1117] p-2 rounded-lg border border-[#21262d] flex flex-col justify-between">
          <span className="text-[10px] text-neutral-400 uppercase font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3 text-purple-400" />
            Fastest Response
          </span>
          <div className="mt-1 truncate">
            <strong className={`text-xs font-bold font-mono truncate block ${fastestMinutes !== null ? 'text-purple-300' : 'text-neutral-500'}`}>
              {fastestLabel}
            </strong>
          </div>
        </div>

        {/* Metric 5: Total Budget Spent in INR */}
        <div className="bg-[#0d1117] p-2 rounded-lg border border-[#21262d] flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[10px] text-neutral-400 uppercase font-semibold flex items-center gap-1">
            <span className="text-amber-400 font-bold">₹</span>
            Total Budget
          </span>
          <div className="mt-1">
            <strong className={`text-sm font-bold font-mono ${totalBudgetLakhs > 0 ? 'text-amber-400' : 'text-neutral-400'}`}>
              {totalBudgetLakhs > 0 ? budgetDisplay : '₹0.0 L'}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};
