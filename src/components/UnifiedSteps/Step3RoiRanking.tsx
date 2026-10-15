import React, { useState } from 'react';
import { TheaterData, INTERVENTION_TOOLS, InterventionType } from '../../data/theaters';
import {
  TrendingUp,
  Award,
  Clock,
  Truck,
  CheckCircle2,
  Sliders,
  DollarSign,
  Zap,
  FileText,
  ArrowRight,
} from 'lucide-react';

interface Step3RoiRankingProps {
  currentTheater: TheaterData;
  onDeployTool: (chokeId: string, tool: InterventionType) => void;
  activeInterventions: Record<string, InterventionType>;
  onAdvanceToStep4?: () => void;
}

export const Step3RoiRanking: React.FC<Step3RoiRankingProps> = ({
  currentTheater,
  onDeployTool,
  activeInterventions,
  onAdvanceToStep4,
}) => {
  const [selectedToolFilter, setSelectedToolFilter] = useState<string>('all');
  const authorityName = currentTheater.authorityName;

  const topChoke = currentTheater.chokePoints[0] || {
    id: 'choke_1',
    road_name: 'Primary Arterial Corridor',
    trapped_villages_count: 27,
  };

  // Base population calculation for top corridor
  const estPopPerVillage = 1200;
  const totalTrappedPeople = topChoke.trapped_villages_count * estPopPerVillage;

  // Compute Efficiency Score for all 4 tools using the exact user-specified INR formula:
  // Efficiency Score = (People Reached + (Hospital Surge Relieved % * 50)) / (Cost in ₹ Lakhs * Deployment Hours)
  const rankedTools = (
    Object.keys(INTERVENTION_TOOLS) as (keyof typeof INTERVENTION_TOOLS)[]
  ).map((toolKey) => {
    const tool = INTERVENTION_TOOLS[toolKey];
    const peopleReached = Math.round((totalTrappedPeople * tool.villagesRelievedPct) / 100);
    const surgeReliefBonus = tool.hospitalSurgeReliefPct * 50;
    const costLakhs = tool.costInLakhs;
    const hours = tool.timeHours;

    const denominator = costLakhs * hours;
    const efficiencyScore = Math.round(((peopleReached + surgeReliefBonus) / denominator) * 10) / 10;

    return {
      key: toolKey,
      name: tool.name,
      label: tool.label,
      costStr: tool.costStr,
      timeStr: tool.timeStr,
      costInLakhs: costLakhs,
      timeHours: hours,
      peopleReached,
      surgeRelievedPct: tool.hospitalSurgeReliefPct,
      truckAccessible: tool.truckAccessible,
      efficiencyScore,
      desc: tool.desc,
      pinColor: tool.pinColor,
    };
  }).sort((a, b) => b.efficiencyScore - a.efficiencyScore);

  return (
    <div className="space-y-4">
      {/* Step Header */}
      <div className="bg-[#161b22] border border-[#30363d] p-3 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-950/80 border border-amber-600/40 text-amber-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">
              Step 3: 📈 Multi-Tool Value &amp; ROI Ranking (All 4 Tools)
            </h3>
            <p className="text-[11px] text-[#8b949e]">
              Ranks Health Booths, Drones, Boats, and Bridges using true Cost-Time-Efficiency in Indian Rupees (₹ Lakhs).
            </p>
          </div>
        </div>
      </div>

      {/* Formula Explanation Card (In plain language, zero jargon) */}
      <div className="bg-[#0d1117] border border-[#30363d] p-3.5 rounded-xl text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-cyan-400 font-bold text-[11px] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Decision-Grade Efficiency Score Formula:
          </span>
          <span className="text-[10px] font-mono text-neutral-400 bg-[#161b22] px-2 py-0.5 rounded border border-[#21262d]">
            Grounded in INR (₹)
          </span>
        </div>

        <div className="p-2.5 bg-[#161b22] rounded-lg border border-[#21262d] font-mono text-[11px] text-emerald-300 text-center">
          Efficiency Score = [People Reached + (Hospital Surge Relieved % × 50)] / (Cost in ₹ Lakhs × Hours)
        </div>

        <p className="text-[11px] text-neutral-300 leading-relaxed">
          <strong>Why this changes tactical triage:</strong> A <span className="text-emerald-400 font-semibold">₹15L Health Booth (6 hrs)</span> or <span className="text-purple-400 font-semibold">₹8L Med-Drone (45 mins)</span> delivers a massive immediate ROI score within the golden hour because deployment takes hours instead of days. However, the <span className="text-blue-400 font-semibold">₹72L Modular Bailey Bridge (48 hrs)</span> is <strong>mandatory for 16T Heavy Supply Trucks</strong> to carry heavy food rations and excavators.
        </p>
      </div>

      {/* Ranked Multi-Tool Table */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden shadow-lg">
        <div className="px-4 py-2.5 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between text-xs">
          <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            Ranked Interventions for {topChoke.road_name.split(' ')[0]}
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">
            Catchment: {totalTrappedPeople.toLocaleString()} Citizens
          </span>
        </div>

        <div className="divide-y divide-[#21262d]">
          {rankedTools.map((t, idx) => {
            const isDeployed = activeInterventions[topChoke.id] === t.key;

            return (
              <div
                key={t.key}
                className={`p-3.5 transition-colors ${
                  isDeployed ? 'bg-emerald-950/30' : 'hover:bg-[#1c2128]'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  {/* Tool Identity & Badge */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                        idx === 0
                          ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                          : idx === 1
                          ? 'bg-neutral-300 text-black'
                          : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-xs flex items-center gap-2">
                        {t.label}
                        {t.truckAccessible && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                            <Truck className="w-2.5 h-2.5" />
                            16T Truck Capable
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-neutral-400 max-w-md mt-0.5">{t.desc}</p>
                    </div>
                  </div>

                  {/* Quantitative Metrics & Deploy CTA */}
                  <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right font-mono">
                      <div className="text-xs font-extrabold text-amber-400">
                        {t.efficiencyScore} <span className="text-[9px] text-neutral-400">pts</span>
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        {t.costStr} • {t.timeStr}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeployTool(topChoke.id, isDeployed ? 'none' : (t.key as InterventionType))}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer shadow-sm ${
                        isDeployed
                          ? 'bg-emerald-600 text-white shadow-emerald-900/50 ring-1 ring-emerald-400'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      {isDeployed ? '✓ Deployed on Map' : 'Deploy on Map ➔'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strategic Takeaway for Civil Defense */}
      <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-xl text-xs space-y-1 text-neutral-300">
        <strong className="text-white block">Civil Defense Allocation Rule:</strong>
        <p className="text-[11px] leading-relaxed">
          1. <strong>Hour 0–6:</strong> Deploy <span className="text-purple-300 font-bold">Med-Drones</span> (45 mins) and <span className="text-cyan-300 font-bold">Rescue Boats</span> (3 hrs) to stabilize critical casualties.
          <br />
          2. <strong>Hour 6–12:</strong> Erect <span className="text-emerald-300 font-bold">Mobile Health Booths</span> (6 hrs) directly at roadheads to halt the hospital surge cascade.
          <br />
          3. <strong>Hour 12–48:</strong> Construct <span className="text-blue-300 font-bold">Class-40 Bailey Bridges</span> (48 hrs) to restore heavy logistics, food trucks, and permanent civilian egress.
        </p>
      </div>

      {/* Advance to Step 4 Requisition & DM Workflow CTA */}
      {onAdvanceToStep4 && (
        <button
          type="button"
          onClick={onAdvanceToStep4}
          className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 shadow-lg shadow-blue-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <FileText className="w-4 h-4 text-amber-300" />
          <span>Advance to Step 4: Raise Official SDRF Requisition Ticket &amp; DM Approval ➔</span>
        </button>
      )}
    </div>
  );
};
