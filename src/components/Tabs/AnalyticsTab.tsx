import React from 'react';
import { SettlementRecord } from '../../types';
import { BarChart3, PieChart, Activity } from 'lucide-react';

interface AnalyticsTabProps {
  settlements: SettlementRecord[];
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ settlements }) => {
  const isolated = settlements.filter((s) => s.modeled_status === 'MODEL_ISOLATED').length;
  const rerouted = settlements.filter((s) => s.modeled_status === 'REROUTED_ALT_FACILITY').length;
  const reachable = settlements.filter((s) => s.modeled_status === 'REACHABLE_SAME_FACILITY').length;
  const total = settlements.length || 1;

  const topDetours = [...settlements]
    .filter((s) => s.modeled_status === 'REROUTED_ALT_FACILITY' && s.additional_km !== null)
    .sort((a, b) => (b.additional_km || 0) - (a.additional_km || 0))
    .slice(0, 8);

  const maxDetourVal = Math.max(...topDetours.map((d) => d.additional_km || 0), 1);

  const scatterPoints = settlements.filter((s) => s.scenario_min !== null && (s.additional_km || 0) > 0);

  // Donut SVG calculations
  const pIsolated = (isolated / total) * 100;
  const pRerouted = (rerouted / total) * 100;
  const pReachable = (reachable / total) * 100;

  const r = 40;
  const c = 2 * Math.PI * r;
  const strokeIsolated = (pIsolated / 100) * c;
  const strokeRerouted = (pRerouted / 100) * c;
  const strokeReachable = (pReachable / 100) * c;

  return (
    <div className="space-y-6">
      {/* Top 2 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Donut */}
        <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-xl shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-400" />
              Settlement Vulnerability Classification
            </h4>
            <span className="text-xs text-[#8b949e]">Total: {total}</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-2">
            {/* SVG Donut */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={r} fill="transparent" stroke="#21262d" strokeWidth="16" />
                {/* Reachable */}
                <circle
                  cx="50"
                  cy="50"
                  r={r}
                  fill="transparent"
                  stroke="#00e676"
                  strokeWidth="16"
                  strokeDasharray={`${strokeReachable} ${c - strokeReachable}`}
                  strokeDashoffset={0}
                />
                {/* Rerouted */}
                <circle
                  cx="50"
                  cy="50"
                  r={r}
                  fill="transparent"
                  stroke="#ffaa00"
                  strokeWidth="16"
                  strokeDasharray={`${strokeRerouted} ${c - strokeRerouted}`}
                  strokeDashoffset={-strokeReachable}
                />
                {/* Isolated */}
                <circle
                  cx="50"
                  cy="50"
                  r={r}
                  fill="transparent"
                  stroke="#ff4d4d"
                  strokeWidth="16"
                  strokeDasharray={`${strokeIsolated} ${c - strokeIsolated}`}
                  strokeDashoffset={-(strokeReachable + strokeRerouted)}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-extrabold text-white">{total}</span>
                <span className="text-[10px] text-[#8b949e] uppercase">Sites</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#ff4d4d]" />
                  <span className="text-[#c9d1d9]">Completely Isolated</span>
                </div>
                <span className="font-bold text-white">{isolated} ({pIsolated.toFixed(1)}%)</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#ffaa00]" />
                  <span className="text-[#c9d1d9]">Rerouted (Alt Facility)</span>
                </div>
                <span className="font-bold text-white">{rerouted} ({pRerouted.toFixed(1)}%)</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#00e676]" />
                  <span className="text-[#c9d1d9]">Reachable (Same Facility)</span>
                </div>
                <span className="font-bold text-white">{reachable} ({pReachable.toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Top Severe Detours Bar Chart */}
        <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-xl shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              Top Severe Detour Settlements (Δ km Surcharge)
            </h4>
            <span className="text-xs text-[#8b949e]">Top 8 Ranked</span>
          </div>

          <div className="space-y-2.5">
            {topDetours.map((item) => {
              const km = item.additional_km || 0;
              const widthPct = Math.round((km / maxDetourVal) * 100);
              return (
                <div key={item.village_id} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-[#c9d1d9]">
                    <span className="font-medium truncate max-w-[200px]">{item.village_name}</span>
                    <span className="font-bold text-cyan-400">+{km.toFixed(2)} km (+{item.additional_min}m)</span>
                  </div>
                  <div className="w-full bg-[#0d1117] h-2.5 rounded-full overflow-hidden border border-[#21262d]">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-red-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart 3: Baseline vs Disaster Travel-Time Delay */}
      <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-xl shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            ⏱️ Baseline vs Flood Travel-Time Degradation (Baseline Minutes vs Flooded Minutes)
          </h4>
          <span className="text-xs text-[#8b949e]">Access Time Divergence</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d1117] text-[#8b949e] border-b border-[#30363d]">
              <tr>
                <th className="py-2.5 px-3">Settlement</th>
                <th className="py-2.5 px-3">Baseline Time</th>
                <th className="py-2.5 px-3">Disaster Time</th>
                <th className="py-2.5 px-3">Δ Added Delay</th>
                <th className="py-2.5 px-3">Detour Ratio</th>
                <th className="py-2.5 px-3">Primary Factor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#21262d] text-[#c9d1d9]">
              {scatterPoints.map((item) => (
                <tr key={item.village_id} className="hover:bg-[#21262d] transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-white">{item.village_name}</td>
                  <td className="py-2.5 px-3 text-emerald-400">{item.baseline_min} min ({item.baseline_km} km)</td>
                  <td className="py-2.5 px-3 text-red-400 font-medium">{item.scenario_min} min ({item.scenario_km} km)</td>
                  <td className="py-2.5 px-3 text-amber-400 font-bold">+{item.additional_min} min delay</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-cyan-300">{item.detour_ratio}x</td>
                  <td className="py-2.5 px-3 text-[#8b949e]">Approach road submerged & mud factor</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
