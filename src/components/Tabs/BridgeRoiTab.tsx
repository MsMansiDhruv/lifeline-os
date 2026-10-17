import React, { useState } from 'react';
import { BRIDGE_INTERVENTIONS } from '../../data/disasterData';
import { BridgeInterventionRecord } from '../../types';
import { TheaterData } from '../../data/theaters';
import { LeafletMap } from '../LeafletMap';
import { Wrench, Download, Compass, Shield, Award } from 'lucide-react';
import { BridgeIcon } from '../common/TacticalIcons';

interface BridgeRoiTabProps {
  currentTheater?: TheaterData;
}

export const BridgeRoiTab: React.FC<BridgeRoiTabProps> = ({ currentTheater }) => {
  const [spanFilter, setSpanFilter] = useState<string>('All');
  const [selectedRank, setSelectedRank] = useState<number>(1);

  const baseBridges: BridgeInterventionRecord[] =
    currentTheater?.bridgeRoi && currentTheater.bridgeRoi.length > 0
      ? currentTheater.bridgeRoi
      : BRIDGE_INTERVENTIONS;

  const filteredBridges = baseBridges.filter((b) => {
    if (spanFilter === 'Short') return b.span_length_m <= 25.0;
    if (spanFilter === 'SingleSingle') return b.span_length_m > 25.0 && b.span_length_m <= 45.0;
    if (spanFilter === 'Modular') return b.span_length_m > 45.0 && b.span_length_m <= 90.0;
    if (spanFilter === 'Pontoon') return b.span_length_m > 90.0;
    return true;
  });

  const targetBridge: BridgeInterventionRecord =
    filteredBridges.find((b) => b.rank === selectedRank) ||
    filteredBridges[0] ||
    baseBridges[0];

  const authorityName = currentTheater?.authorityName || 'Assam State Disaster Management Authority (ASDMA)';
  const authorityShort = currentTheater?.authorityShortName || 'Civil Defense';

  const handleDownloadCsv = () => {
    const headers = [
      'Rank',
      'Location',
      'Span (m)',
      'Population Reconnected',
      'Detour Saved (km)',
      'ROI Score',
      'Recommended Structure',
      'Install Window (hrs)',
      'Latitude',
      'Longitude',
    ];

    const rows = baseBridges.map((b) => [
      b.rank,
      `"${b.road_name}"`,
      b.span_length_m,
      b.reconnected_population,
      b.km_saved,
      b.roi_score,
      `"${b.recommended_structure}"`,
      b.est_install_hrs,
      b.lat,
      b.lon,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${currentTheater?.id || 'theater'}_bridge_roi_manifest.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const mapMarkers = filteredBridges.map((b) => ({
    lat: b.lat,
    lon: b.lon,
    title: `Rank #${b.rank}: ${b.road_name}`,
    description: `ROI: ${b.roi_score} | Span: ${b.span_length_m}m | Reconnects: ${b.reconnected_population.toLocaleString()} pop. Structure: ${b.recommended_structure}`,
    type: 'bridge' as const,
    badge: `ROI ${b.roi_score}`,
  }));

  const mapCenter = currentTheater?.center || [24.85, 92.83];
  const mapZoom = currentTheater?.zoom || 11;

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-xl shadow-md">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 mt-0.5">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BridgeIcon size={18} color="#f59e0b" />
                <span>Micro-Intervention ROI Engine (The Engineering Fix)</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
                {authorityShort}
              </span>
            </div>
            <p className="text-xs text-[#8b949e] mt-1 leading-relaxed">
              <strong className="text-[#c9d1d9]">Tactical Resource Allocation:</strong> An operations commander ({authorityName} & Engineering Corps)
              has resources to deploy only <strong className="text-emerald-400">one or two temporary Bailey bridges, folding pontoon crossings, or modular culvert decks</strong>.
              Where should they go? Lifeline OS simulates the individual topological restoration of candidate severed road spans and quantitatively ranks each crossing by accessibility <strong className="text-white">Return on Investment (ROI)</strong>:
              <br />
              <span className="font-mono text-emerald-400">ROI(e) = (Reconnected Population + Σ Δ km saved) / Span Length (meters)</span>
            </p>
          </div>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl">
          <div className="text-xs text-[#8b949e] uppercase font-semibold">Severed Spans Evaluated</div>
          <div className="text-2xl font-bold text-[#00BFFF] mt-1">{baseBridges.length} Candidates</div>
          <div className="text-[11px] text-[#8b949e] mt-1">Spans between 18m and 360m</div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl">
          <div className="text-xs text-[#8b949e] uppercase font-semibold">Top Ranked Intervention</div>
          <div className="text-2xl font-bold text-[#00e676] mt-1">ROI {baseBridges[0]?.roi_score || 95.8}</div>
          <div className="text-[11px] text-emerald-400/80 mt-1 truncate">
            {baseBridges[0]?.road_name.split('(')[0] || 'Corridor Span'}
          </div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl">
          <div className="text-xs text-[#8b949e] uppercase font-semibold">Max Reconnected Pop</div>
          <div className="text-2xl font-bold text-white mt-1">
            {baseBridges[0]?.reconnected_population.toLocaleString() || '32,400'} People
          </div>
          <div className="text-[11px] text-[#8b949e] mt-1">Single installation impact</div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl">
          <div className="text-xs text-[#8b949e] uppercase font-semibold">Max Detour Distance Saved</div>
          <div className="text-2xl font-bold text-[#ffaa00] mt-1">
            {baseBridges[0]?.km_saved || 11.68} km / trip
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">Direct ambulance restoration</div>
        </div>
      </div>

      {/* Two Columns: Table & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Ranked Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Ranked Bridge Micro-Intervention Prioritization
            </h4>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8b949e]">Span:</span>
              <select
                value={spanFilter}
                onChange={(e) => setSpanFilter(e.target.value)}
                className="bg-[#161b22] text-xs text-[#c9d1d9] border border-[#30363d] rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
              >
                <option value="All">All Spans</option>
                <option value="Short">&lt; 25m</option>
                <option value="SingleSingle">25m – 45m (Single-Single)</option>
                <option value="Modular">45m – 90m (Modular)</option>
                <option value="Pontoon">&gt; 90m (Heavy / Pontoon)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-[#30363d] rounded-xl bg-[#161b22]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#21262d] text-[#8b949e] font-semibold border-b border-[#30363d]">
                <tr>
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Corridor</th>
                  <th className="py-2.5 px-3">Span</th>
                  <th className="py-2.5 px-3">Reconnected</th>
                  <th className="py-2.5 px-3">Saved</th>
                  <th className="py-2.5 px-3">ROI</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363d] text-[#c9d1d9]">
                {filteredBridges.map((b) => {
                  const isSelected = b.rank === targetBridge.rank;
                  return (
                    <tr
                      key={b.rank}
                      onClick={() => setSelectedRank(b.rank)}
                      className={`hover:bg-[#21262d]/70 transition-colors cursor-pointer ${
                        isSelected ? 'bg-emerald-950/40 border-l-2 border-l-emerald-400' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-white">#{b.rank}</td>
                      <td className="py-2.5 px-3 font-medium text-white max-w-[140px] truncate" title={b.road_name}>
                        {b.road_name}
                      </td>
                      <td className="py-2.5 px-3">{b.span_length_m}m</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-semibold">
                        {b.reconnected_population.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-[#ffaa00]">+{b.km_saved} km</td>
                      <td className="py-2.5 px-3 font-bold text-cyan-300">{b.roi_score}</td>
                      <td className="py-2.5 px-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRank(b.rank);
                          }}
                          className="px-2 py-1 rounded bg-[#30363d] hover:bg-emerald-600 hover:text-white text-[11px] font-semibold text-gray-200 transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Selected Bridge Inspection Card */}
          {targetBridge && (
            <div className="bg-[#161b22] border border-[#30363d] border-t-2 border-t-emerald-400 p-4 rounded-xl space-y-2.5 text-xs shadow-md">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">
                  #{targetBridge.rank}: {targetBridge.road_name}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-bold font-mono">
                  ROI Score: {targetBridge.roi_score}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[#8b949e]">
                <div>Span Length: <strong className="text-white">{targetBridge.span_length_m} meters</strong></div>
                <div>Est Assembly: <strong className="text-white">~{targetBridge.est_install_hrs} hours</strong></div>
                <div>Reconnected Pop: <strong className="text-emerald-400">{targetBridge.reconnected_population.toLocaleString()} civilians</strong></div>
                <div>Detour Reduction: <strong className="text-amber-400">+{targetBridge.km_saved} km saved</strong></div>
              </div>

              <div className="p-2.5 rounded bg-[#0d1117] border border-[#21262d] text-[#c9d1d9] space-y-1">
                <div><strong>Engineering Recommendation:</strong> <span className="text-emerald-300 font-medium">{targetBridge.recommended_structure}</span></div>
                <div><strong>Reconnected Settlements:</strong> <span className="text-[#8b949e]">{targetBridge.reconnected_villages_str}</span></div>
              </div>
            </div>
          )}

          {/* Export Button */}
          <button
            onClick={handleDownloadCsv}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-semibold border border-[#30363d] shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export {authorityShort} Bridge Tactical ROI Manifest (CSV)</span>
          </button>
        </div>

        {/* Right Column: Tactical Map */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#8b949e]">
            <span className="font-medium text-white">Severed Bridgeheads & High-ROI Crossing Sites</span>
            <span className="uppercase">{currentTheater?.name.split('(')[0] || 'CRISIS REGION'}</span>
          </div>

          <LeafletMap
            key={currentTheater?.id || 'silchar'}
            center={mapCenter}
            zoom={mapZoom}
            height="520px"
            markers={mapMarkers}
            floodPolygon={currentTheater?.floodPolygon}
          />
          <div className="text-[11px] text-[#8b949e] italic flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <BridgeIcon size={13} color="#10b981" />
              <span>Green markers = Candidate bridge repair sites</span>
            </span>
            <span>Badge indicates calculated accessibility ROI</span>
          </div>
        </div>
      </div>
    </div>
  );
};
