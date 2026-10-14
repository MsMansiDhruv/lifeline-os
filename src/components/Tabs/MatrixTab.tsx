import React, { useState } from 'react';
import { SettlementRecord } from '../../types';
import { Table, Search, Download, Filter } from 'lucide-react';

interface MatrixTabProps {
  settlements: SettlementRecord[];
}

export const MatrixTab: React.FC<MatrixTabProps> = ({ settlements }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = settlements.filter((s) => {
    const matchesSearch = s.village_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.baseline_facility_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.scenario_facility_name.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    return s.modeled_status === statusFilter;
  });

  const handleDownloadCsv = () => {
    const headers = [
      'Settlement ID',
      'Settlement Name',
      'Status',
      'Baseline (km)',
      'Scenario (km)',
      'Delta Dist (km)',
      'Baseline Time (min)',
      'Flood Time (min)',
      'Delta Delay (min)',
      'Detour Ratio',
      'Baseline Facility',
      'Scenario Facility',
    ];

    const rows = filtered.map((s) => [
      s.village_id,
      `"${s.village_name}"`,
      s.modeled_status,
      s.baseline_km,
      s.scenario_km !== null ? s.scenario_km : 'INF',
      s.additional_km !== null ? s.additional_km : 'N/A',
      s.baseline_min,
      s.scenario_min !== null ? s.scenario_min : 'INF',
      s.additional_min !== null ? s.additional_min : 'N/A',
      s.detour_ratio !== null ? s.detour_ratio : 'N/A',
      `"${s.baseline_facility_name}"`,
      `"${s.scenario_facility_name}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'cachar_vulnerability_matrix.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#161b22] p-4 rounded-xl border border-[#30363d]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search settlement, baseline, or rerouted facility..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0d1117] text-xs text-[#c9d1d9] pl-9 pr-3 py-2 rounded-lg border border-[#30363d] focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0d1117] text-xs text-[#c9d1d9] border border-[#30363d] rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses ({settlements.length})</option>
            <option value="MODEL_ISOLATED">Completely Isolated</option>
            <option value="REROUTED_ALT_FACILITY">Rerouted Alt Facility</option>
            <option value="REACHABLE_SAME_FACILITY">Reachable Same Facility</option>
          </select>

          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-semibold border border-[#30363d] transition-colors cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d1117] text-[#8b949e] border-b border-[#30363d] sticky top-0 z-10">
              <tr>
                <th className="py-3 px-3.5 font-semibold">Settlement</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-3 font-semibold">Baseline (km)</th>
                <th className="py-3 px-3 font-semibold">Scenario (km)</th>
                <th className="py-3 px-3 font-semibold">Δ Dist (km)</th>
                <th className="py-3 px-3 font-semibold">Base Time</th>
                <th className="py-3 px-3 font-semibold">Flood Time</th>
                <th className="py-3 px-3 font-semibold">Δ Delay</th>
                <th className="py-3 px-3 font-semibold">Detour Ratio</th>
                <th className="py-3 px-3 font-semibold">Baseline Facility</th>
                <th className="py-3 px-3 font-semibold">Scenario Facility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#21262d] text-[#c9d1d9]">
              {filtered.map((row) => (
                <tr key={row.village_id} className="hover:bg-[#1c2128] transition-colors">
                  <td className="py-3 px-3.5 font-bold text-white whitespace-nowrap">
                    {row.village_name}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    {row.modeled_status === 'MODEL_ISOLATED' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/60 text-red-400 border border-red-800/40">
                        MODEL_ISOLATED
                      </span>
                    )}
                    {row.modeled_status === 'REROUTED_ALT_FACILITY' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-400 border border-amber-800/40">
                        REROUTED_ALT
                      </span>
                    )}
                    {row.modeled_status === 'REACHABLE_SAME_FACILITY' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                        REACHABLE
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono">{row.baseline_km.toFixed(2)}</td>
                  <td className="py-3 px-3 font-mono font-medium">
                    {row.scenario_km !== null ? (
                      <span className="text-white">{row.scenario_km.toFixed(2)}</span>
                    ) : (
                      <span className="text-red-400 font-bold">INF</span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold">
                    {row.additional_km !== null ? (
                      row.additional_km > 0 ? (
                        <span className="text-amber-400">+{row.additional_km.toFixed(2)}</span>
                      ) : (
                        <span className="text-[#8b949e]">0.00</span>
                      )
                    ) : (
                      <span className="text-red-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono text-emerald-400">{row.baseline_min}m</td>
                  <td className="py-3 px-3 font-mono">
                    {row.scenario_min !== null ? (
                      <span className="text-amber-400">{row.scenario_min}m</span>
                    ) : (
                      <span className="text-red-400 font-bold">NONE</span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold">
                    {row.additional_min !== null ? (
                      row.additional_min > 0 ? (
                        <span className="text-red-400">+{row.additional_min}m</span>
                      ) : (
                        <span className="text-[#8b949e]">0.0m</span>
                      )
                    ) : (
                      <span className="text-red-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold">
                    {row.detour_ratio !== null ? (
                      <span className="text-cyan-300">{row.detour_ratio}x</span>
                    ) : (
                      <span className="text-[#8b949e]">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-[#8b949e] truncate max-w-[150px]">
                    {row.baseline_facility_name}
                  </td>
                  <td className="py-3 px-3 text-[#c9d1d9] truncate max-w-[160px]">
                    {row.scenario_facility_name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
