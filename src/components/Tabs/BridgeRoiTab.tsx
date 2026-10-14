import React, { useState } from 'react';
import { BRIDGE_INTERVENTIONS } from '../../data/disasterData';
import { BridgeInterventionRecord } from '../../types';
import { LeafletMap } from '../LeafletMap';
import { Wrench, Download, Compass, Shield, Award } from 'lucide-react';

export const BridgeRoiTab: React.FC = () => {
  const [spanFilter, setSpanFilter] = useState<string>('All');
  const [selectedRank, setSelectedRank] = useState<number>(1);

  const filteredBridges = BRIDGE_INTERVENTIONS.filter((b) => {
    if (spanFilter === 'Short') return b.span_length_m <= 25.0;
    if (spanFilter === 'SingleSingle') return b.span_length_m > 25.0 && b.span_length_m <= 45.0;
    if (spanFilter === 'Modular') return b.span_length_m > 45.0 && b.span_length_m <= 90.0;
    if (spanFilter === 'Pontoon') return b.span_length_m > 90.0;
    return true;
  });

  const targetBridge: BridgeInterventionRecord =
    filteredBridges.find((b) => b.rank === selectedRank) ||
    filteredBridges[0] ||
    BRIDGE_INTERVENTIONS[0];

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

    const rows = BRIDGE_INTERVENTIONS.map((b) => [
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
    link.setAttribute('download', 'military_bro_bridge_roi_manifest.csv');
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

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-xl shadow-md">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 mt-0.5">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Feature 4: Micro-Intervention ROI Engine (The Engineering Fix)
            </h3>
            <p className="text-xs text-[#8b949e] mt-1 leading-relaxed">
              <strong className="text-[#c9d1d9]">Tactical Resource Allocation:</strong> An operations commander (Indian Army Corps of Engineers / BRO / ASDMA)
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
          <div className="text-2xl font-bold text-[#00BFFF] mt-1">{BRIDGE_INTERVENTIONS.length} Candidates</div>
          <div className="text-[11px] text-[#8b949e] mt-1">Spans between 8m and 150m</div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl">
          <div className="text-xs text-[#8b949e] uppercase font-semibold">Top Recommended Crossing</div>
          <div className="text-sm font-bold text-[#00e676] mt-1 truncate">
            {BRIDGE_INTERVENTIONS[0].road_name}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Peak accessibility return</div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-[#8b949e] uppercase font-semibold">
            <span>Peak ROI Score</span>
            <Award className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-[#ffaa00] mt-1">{BRIDGE_INTERVENTIONS[0].roi_score}</div>
          <div className="text-[11px] text-amber-400/80 mt-1">Citizens & km saved per meter of span</div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl">
          <div className="text-xs text-[#8b949e] uppercase font-semibold">Max Reconnected Population</div>
          <div className="text-2xl font-bold text-[#d2a8ff] mt-1">14,800 Pop.</div>
          <div className="text-[11px] text-purple-400/80 mt-1">Barak River Crossing bypass</div>
        </div>
      </div>

      {/* Filter and Selection Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#161b22] p-4 rounded-xl border border-[#30363d]">
        <div>
          <label className="block text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-1.5">
            Filter by Engineering Span Capacity:
          </label>
          <select
            value={spanFilter}
            onChange={(e) => {
              setSpanFilter(e.target.value);
            }}
            className="w-full bg-[#0d1117] text-xs text-[#c9d1d9] border border-[#30363d] rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="All">All Spans (&le;150m)</option>
            <option value="Short">Short Span / Culvert (&le;25m)</option>
            <option value="SingleSingle">Single-Single Bailey (26–45m)</option>
            <option value="Modular">Modular Heavy Bailey (46–90m)</option>
            <option value="Pontoon">Pontoon / Long Span (91–150m)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-1.5">
            Inspect Candidate Micro-Intervention:
          </label>
          <select
            value={targetBridge.rank}
            onChange={(e) => setSelectedRank(Number(e.target.value))}
            className="w-full bg-[#0d1117] text-xs text-[#c9d1d9] border border-[#30363d] rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
          >
            {filteredBridges.map((b) => (
              <option key={b.rank} value={b.rank}>
                Rank #{b.rank}: {b.road_name} | ROI: {b.roi_score} | Span: {b.span_length_m}m
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Two Columns: Spec Sheet & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Spec Sheet */}
        <div className="space-y-4">
          <div className="bg-[#161b22] border border-[#30363d] border-l-4 border-l-emerald-500 p-4 rounded-r-xl shadow-md space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-[#00e676] flex items-center gap-1.5">
                🌉 Rank #{targetBridge.rank}: {targetBridge.road_name}
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-600/50">
                ROI: {targetBridge.roi_score.toFixed(2)}
              </span>
            </div>

            <div className="text-[#c9d1d9] space-y-1">
              <div>
                <strong>Severed Node Pair:</strong> #{targetBridge.u} ➔ #{targetBridge.v}
              </div>
              <div>
                <strong>Coordinates:</strong> {targetBridge.lat.toFixed(5)}°N, {targetBridge.lon.toFixed(5)}°E
              </div>
              <div>
                <strong>Intervention Category:</strong> <span className="text-blue-400 font-medium">{targetBridge.intervention_type}</span>
              </div>
              <div>
                <strong>Reconnected Communities:</strong> <span className="text-amber-400 font-medium">{targetBridge.reconnected_villages_str}</span>
              </div>
            </div>

            {/* 3 Metric Mini Cards */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="bg-[#0d1117] p-2.5 rounded-lg border border-[#21262d] text-center">
                <div className="text-[10px] text-[#8b949e]">Span Gap Length</div>
                <div className="text-base font-bold text-[#00BFFF] mt-0.5">{targetBridge.span_length_m} m</div>
              </div>
              <div className="bg-[#0d1117] p-2.5 rounded-lg border border-[#21262d] text-center">
                <div className="text-[10px] text-[#8b949e]">Pop. Reconnected</div>
                <div className="text-base font-bold text-[#00e676] mt-0.5">{targetBridge.reconnected_population.toLocaleString()}</div>
              </div>
              <div className="bg-[#0d1117] p-2.5 rounded-lg border border-[#21262d] text-center">
                <div className="text-[10px] text-[#8b949e]">Detour Avoidance</div>
                <div className="text-base font-bold text-[#ffaa00] mt-0.5">{targetBridge.km_saved} km</div>
              </div>
            </div>

            <div className="mt-2 p-3 rounded-lg bg-[#0d1117] border border-[#21262d] text-[11px] text-emerald-300 leading-relaxed">
              <strong className="text-white block mb-0.5">🎖️ Recommended Military / BRO Structure:</strong>
              {targetBridge.recommended_structure}
              <div className="text-amber-400 font-medium mt-1">
                ⏱️ Est. Construction & Launch Window: ~{targetBridge.est_install_hrs} hours (1 Combat Engineer Platoon)
              </div>
            </div>
          </div>

          {/* Table of Top Ranked Sites */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#30363d] text-xs font-semibold text-white">
              Top Ranked Candidate Crossing Sites
            </div>
            <div className="overflow-x-auto max-h-[220px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0d1117] text-[#8b949e] border-b border-[#30363d] sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Rank</th>
                    <th className="py-2 px-3">Location</th>
                    <th className="py-2 px-3">Span (m)</th>
                    <th className="py-2 px-3">Pop</th>
                    <th className="py-2 px-3">Saved (km)</th>
                    <th className="py-2 px-3">ROI</th>
                    <th className="py-2 px-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#21262d] text-[#c9d1d9]">
                  {filteredBridges.map((b) => (
                    <tr
                      key={b.rank}
                      onClick={() => setSelectedRank(b.rank)}
                      className={`hover:bg-[#21262d] cursor-pointer transition-colors ${
                        b.rank === targetBridge.rank ? 'bg-blue-950/40 text-blue-300' : ''
                      }`}
                    >
                      <td className="py-2 px-3 font-bold">#{b.rank}</td>
                      <td className="py-2 px-3 truncate max-w-[150px]">{b.road_name}</td>
                      <td className="py-2 px-3">{b.span_length_m}</td>
                      <td className="py-2 px-3 text-emerald-400 font-medium">{b.reconnected_population.toLocaleString()}</td>
                      <td className="py-2 px-3 text-amber-400 font-medium">+{b.km_saved}</td>
                      <td className="py-2 px-3 font-bold text-white">{b.roi_score.toFixed(1)}</td>
                      <td className="py-2 px-3">{b.est_install_hrs}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleDownloadCsv}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-semibold border border-[#30363d] shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export BRO / Corps of Engineers Bridging Directive (CSV)</span>
          </button>
        </div>

        {/* Right Column: Tactical Bridge Map */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#8b949e]">
            <span className="font-medium text-white">Tactical Bridging Location & Approach Roads</span>
            <span>Priority #{targetBridge.rank} ({targetBridge.span_length_m}m)</span>
          </div>

          <LeafletMap
            center={[targetBridge.lat, targetBridge.lon]}
            zoom={13}
            height="520px"
            markers={mapMarkers}
            highlightBridge={{
              lat: targetBridge.lat,
              lon: targetBridge.lon,
              title: targetBridge.road_name,
              span_m: targetBridge.span_length_m,
              roi: targetBridge.roi_score,
            }}
          />
          <div className="text-[11px] text-[#8b949e] italic flex items-center justify-between">
            <span className="text-[#00FF66] font-medium">Neon Green Bar = Bailey Bridge Span ({targetBridge.span_length_m}m)</span>
            <span>Cyan Polygon = SAR Flood Mask</span>
          </div>
        </div>
      </div>
    </div>
  );
};
