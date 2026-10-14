import React from 'react';
import { SettlementRecord } from '../../types';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Legend,
} from 'recharts';
import { BarChart3, PieChart as PieIcon, TrendingUp } from 'lucide-react';

interface NetworkAnalyticsTabProps {
  records: SettlementRecord[];
}

export const NetworkAnalyticsTab: React.FC<NetworkAnalyticsTabProps> = ({ records }) => {
  // Chart 1: Status Distribution
  const isolated = records.filter((r) => r.modeled_status === 'MODEL_ISOLATED').length;
  const rerouted = records.filter((r) => r.modeled_status === 'REROUTED_ALT_FACILITY').length;
  const reachable = records.filter((r) => r.modeled_status === 'REACHABLE_SAME_FACILITY').length;

  const donutData = [
    { name: 'MODEL_ISOLATED', value: isolated, color: '#ff4d4d' },
    { name: 'REROUTED_ALT_FACILITY', value: rerouted, color: '#ffaa00' },
    { name: 'REACHABLE_SAME_FACILITY', value: reachable, color: '#00e676' },
  ];

  // Chart 2: Top Severe Detours Bar Chart
  const topDetours = records
    .filter((r) => r.modeled_status === 'REROUTED_ALT_FACILITY' && r.additional_km !== null)
    .sort((a, b) => (b.additional_km || 0) - (a.additional_km || 0))
    .slice(0, 8)
    .map((r) => ({
      name: r.village_name,
      additional_km: r.additional_km,
      additional_min: r.additional_min,
      detour_ratio: r.detour_ratio,
    }));

  // Chart 3: Scatter Baseline vs Scenario Minutes
  const scatterData = records
    .filter((r) => r.scenario_min !== null && (r.additional_km || 0) > 0)
    .map((r) => ({
      name: r.village_name,
      baseline_min: r.baseline_min,
      scenario_min: r.scenario_min,
      delay: r.additional_min,
      additional_km: r.additional_km,
    }));

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#58a6ff]" />
          Network Vulnerability Analytics & Metric Distributions
        </h3>
        <p className="text-xs text-[#8b949e] mt-1">
          Topological vulnerability profiling of Cachar District health accessibility during the June 2022 Silchar flood benchmark.
        </p>
      </div>

      {/* Row 1: Donut & Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 flex flex-col">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
            <PieIcon className="w-4 h-4 text-[#00e676]" />
            Settlement Vulnerability Classification
          </h4>
          <p className="text-xs text-[#8b949e] mb-4">
            Distribution of cut-off settlements vs rerouted vs unaffected habitations.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161b22',
                    borderColor: '#30363d',
                    color: '#c9d1d9',
                    fontSize: '12px',
                    borderRadius: '6px',
                  }}
                />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs text-[#c9d1d9]">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Top Severe Detours */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 flex flex-col">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-[#ffaa00]" />
            Top Severe Detour Settlements (Δ km Surcharge)
          </h4>
          <p className="text-xs text-[#8b949e] mb-4">
            Habitations suffering the largest spatial detours to reach secondary care.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDetours} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis
                  dataKey="name"
                  stroke="#8b949e"
                  fontSize={11}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis stroke="#8b949e" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161b22',
                    borderColor: '#30363d',
                    color: '#c9d1d9',
                    fontSize: '12px',
                    borderRadius: '6px',
                  }}
                  formatter={(value: any) => [`+${value} km`, 'Detour Surcharge']}
                />
                <Bar dataKey="additional_km" fill="#ff4d4d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Travel-Time Degradation Scatter Chart */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
        <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
          ⏱️ Baseline vs Flood Travel-Time Comparison (Access Degradation)
        </h4>
        <p className="text-xs text-[#8b949e] mb-4">
          Scatter distribution plotting Baseline Minutes (X) against Flooded Transit Minutes (Y) with bubble size indicating detour km.
        </p>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <XAxis
                type="number"
                dataKey="baseline_min"
                name="Baseline Minutes"
                unit="m"
                stroke="#8b949e"
                fontSize={11}
              />
              <YAxis
                type="number"
                dataKey="scenario_min"
                name="Flooded Minutes"
                unit="m"
                stroke="#8b949e"
                fontSize={11}
              />
              <ZAxis type="number" dataKey="additional_km" range={[60, 400]} name="Additional Detour (km)" />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{
                  backgroundColor: '#161b22',
                  borderColor: '#30363d',
                  color: '#c9d1d9',
                  fontSize: '12px',
                  borderRadius: '6px',
                }}
                formatter={(val: any, name: any) => [
                  name === 'Baseline Minutes'
                    ? `${val} min`
                    : name === 'Flooded Minutes'
                    ? `${val} min`
                    : `+${val} km`,
                  name,
                ]}
              />
              <Scatter name="Settlements" data={scatterData} fill="#58a6ff" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
