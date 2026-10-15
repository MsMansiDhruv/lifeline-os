import React, { useState } from 'react';
import { SettlementRecord } from '../../types';
import { Table, Search, Download, Filter, CheckCircle2, ShieldAlert, Award, TrendingUp } from 'lucide-react';

interface MatrixTabProps {
  settlements: SettlementRecord[];
}

interface DecisionMatrixRow {
  corridor: string;
  roadName: string;
  tool: string;
  capexLakhs: number;
  deployTimeHrs: number;
  villagesSaved: number;
  populationProtected: number;
  traumaTimeMins: number;
  hospitalOverloadCutPct: number;
  costPerCitizen: number;
  priorityRank: number;
  ndmaStatus: 'RECOMMENDED' | 'VIABLE' | 'SECONDARY' | 'CONTINGENCY';
}

const DECISION_MATRIX_DATA: DecisionMatrixRow[] = [
  {
    corridor: 'Corridor #1',
    roadName: 'JT Road Breach',
    tool: 'Bailey Bridge (24m Quad)',
    capexLakhs: 72,
    deployTimeHrs: 48,
    villagesSaved: 27,
    populationProtected: 38400,
    traumaTimeMins: 22,
    hospitalOverloadCutPct: 56,
    costPerCitizen: 187,
    priorityRank: 1,
    ndmaStatus: 'RECOMMENDED',
  },
  {
    corridor: 'Corridor #1',
    roadName: 'JT Road Breach',
    tool: 'Mobile Health Clinic Booth',
    capexLakhs: 15,
    deployTimeHrs: 6,
    villagesSaved: 22,
    populationProtected: 31200,
    traumaTimeMins: 35,
    hospitalOverloadCutPct: 73,
    costPerCitizen: 48,
    priorityRank: 2,
    ndmaStatus: 'RECOMMENDED',
  },
  {
    corridor: 'Corridor #2',
    roadName: 'Harinagar Causeway',
    tool: 'Mobile Health Clinic Booth',
    capexLakhs: 15,
    deployTimeHrs: 6,
    villagesSaved: 22,
    populationProtected: 29500,
    traumaTimeMins: 28,
    hospitalOverloadCutPct: 45,
    costPerCitizen: 51,
    priorityRank: 1,
    ndmaStatus: 'RECOMMENDED',
  },
  {
    corridor: 'Corridor #2',
    roadName: 'Harinagar Causeway',
    tool: 'Autonomous UAV Drone Shuttle',
    capexLakhs: 8,
    deployTimeHrs: 0.75,
    villagesSaved: 14,
    populationProtected: 19800,
    traumaTimeMins: 45,
    hospitalOverloadCutPct: 28,
    costPerCitizen: 40,
    priorityRank: 2,
    ndmaStatus: 'VIABLE',
  },
  {
    corridor: 'Corridor #3',
    roadName: 'Korkoli Approach',
    tool: 'NDRF Motorized Boat Ferry',
    capexLakhs: 3.5,
    deployTimeHrs: 3,
    villagesSaved: 14,
    populationProtected: 16500,
    traumaTimeMins: 38,
    hospitalOverloadCutPct: 35,
    costPerCitizen: 21,
    priorityRank: 1,
    ndmaStatus: 'RECOMMENDED',
  },
  {
    corridor: 'Corridor #4',
    roadName: 'Borkhola Link Road',
    tool: 'Bailey Bridge (18m Triple)',
    capexLakhs: 55,
    deployTimeHrs: 36,
    villagesSaved: 11,
    populationProtected: 14200,
    traumaTimeMins: 24,
    hospitalOverloadCutPct: 40,
    costPerCitizen: 387,
    priorityRank: 1,
    ndmaStatus: 'RECOMMENDED',
  },
];

export const MatrixTab: React.FC<MatrixTabProps> = ({ settlements }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'decision' | 'settlements'>('decision');

  const filtered = settlements.filter((s) => {
    const matchesSearch =
      s.village_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.baseline_facility_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.scenario_facility_name.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    return s.modeled_status === statusFilter;
  });

  const handleDownloadCsv = () => {
    const headers = [
      'Corridor',
      'Road Name',
      'Intervention Tool',
      'Capex (Lakhs)',
      'Deploy Time (Hours)',
      'Villages Saved',
      'Population Protected',
      'Trauma Time (Mins)',
      'Hospital Surge Cut (%)',
      'Cost per Citizen (Rs)',
      'NDMA Priority',
    ];

    const rows = DECISION_MATRIX_DATA.map((r) => [
      r.corridor,
      `"${r.roadName}"`,
      `"${r.tool}"`,
      r.capexLakhs,
      r.deployTimeHrs,
      r.villagesSaved,
      r.populationProtected,
      r.traumaTimeMins,
      r.hospitalOverloadCutPct,
      r.costPerCitizen,
      r.priorityRank,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'ndma_decision_matrix.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('decision')}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'decision'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>NDMA Multi-Tool Decision Matrix</span>
          </button>
          <button
            onClick={() => setActiveSubTab('settlements')}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'settlements'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Settlement Vulnerability Table ({settlements.length})</span>
          </button>
        </div>

        <button
          onClick={handleDownloadCsv}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Matrix CSV</span>
        </button>
      </div>

      {activeSubTab === 'decision' ? (
        <div className="space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Optimal SDRF Tool Allocation & Cost-Per-Life-Saved Matrix
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Algorithmic cross-ranking of physical bridge restoration vs. distributed field triage and autonomous airlifts.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px]">
                    <th className="py-2.5 px-3">Corridor & Breach</th>
                    <th className="py-2.5 px-3">Intervention Tool</th>
                    <th className="py-2.5 px-3">Capex</th>
                    <th className="py-2.5 px-3">Deploy Time</th>
                    <th className="py-2.5 px-3">Villages</th>
                    <th className="py-2.5 px-3">Pop Protected</th>
                    <th className="py-2.5 px-3">Golden Hour</th>
                    <th className="py-2.5 px-3">ICU Surge Cut</th>
                    <th className="py-2.5 px-3">Cost/Citizen</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {DECISION_MATRIX_DATA.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-white">
                        <div>{row.corridor}</div>
                        <div className="text-[10px] text-slate-400">{row.roadName}</div>
                      </td>
                      <td className="py-2.5 px-3 text-cyan-300 font-semibold">{row.tool}</td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">₹{row.capexLakhs}L</td>
                      <td className="py-2.5 px-3 text-slate-300">{row.deployTimeHrs}h</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">{row.villagesSaved}</td>
                      <td className="py-2.5 px-3 text-slate-200">{row.populationProtected.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">{row.traumaTimeMins} mins</td>
                      <td className="py-2.5 px-3 text-cyan-400 font-bold">-{row.hospitalOverloadCutPct}%</td>
                      <td className="py-2.5 px-3 text-emerald-300 font-bold">₹{row.costPerCitizen}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            row.ndmaStatus === 'RECOMMENDED'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : 'bg-blue-950 text-blue-300 border-blue-800'
                          }`}
                        >
                          {row.ndmaStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search settlement, baseline, or rerouted facility..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 text-xs text-slate-200 pl-9 pr-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-2 font-mono cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="MODEL_ISOLATED">Isolated Only</option>
                <option value="REROUTED_ALT_FACILITY">Rerouted Alt Facility</option>
                <option value="REACHABLE_SAME_FACILITY">Reachable Same Facility</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto shadow-xl">
            <table className="w-full text-xs font-mono text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px]">
                  <th className="py-2.5 px-3">Settlement</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Base Dist</th>
                  <th className="py-2.5 px-3">Flood Dist</th>
                  <th className="py-2.5 px-3">Delta Dist</th>
                  <th className="py-2.5 px-3">Detour Ratio</th>
                  <th className="py-2.5 px-3">Primary Hospital</th>
                  <th className="py-2.5 px-3">Rerouted Hospital</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.slice(0, 30).map((s) => (
                  <tr key={s.village_id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-white">{s.village_name}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                          s.modeled_status === 'MODEL_ISOLATED'
                            ? 'bg-rose-950 text-rose-300 border-rose-800'
                            : s.modeled_status === 'REROUTED_ALT_FACILITY'
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}
                      >
                        {s.modeled_status.replace('MODEL_', '')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{s.baseline_km} km</td>
                    <td className="py-2.5 px-3 text-slate-200">
                      {s.scenario_km !== null ? `${s.scenario_km} km` : 'INF (Cut)'}
                    </td>
                    <td className="py-2.5 px-3 text-amber-400 font-bold">
                      {s.additional_km !== null ? `+${s.additional_km} km` : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {s.detour_ratio !== null ? `${s.detour_ratio}x` : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 truncate max-w-[140px]">
                      {s.baseline_facility_name}
                    </td>
                    <td className="py-2.5 px-3 text-cyan-300 truncate max-w-[140px]">
                      {s.scenario_facility_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
