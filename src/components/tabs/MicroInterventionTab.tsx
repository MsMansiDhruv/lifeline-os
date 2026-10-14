import React, { useState } from 'react';
import { BridgeIntervention } from '../../types';
import { MapView, MapMarkerItem, MapPolylineItem } from '../MapView';
import { Wrench, Download, ShieldCheck, Activity } from 'lucide-react';

interface MicroInterventionTabProps {
  bridgeInterventions: BridgeIntervention[];
}

export const MicroInterventionTab: React.FC<MicroInterventionTabProps> = ({
  bridgeInterventions,
}) => {
  const [spanFilter, setSpanFilter] = useState<string>('All Spans (≤150m)');
  const [selectedRank, setSelectedRank] = useState<number>(1);

  const filteredBridges = bridgeInterventions.filter((b) => {
    if (spanFilter === 'Short Span / Culvert (≤25m)') return b.span_length_m <= 25.0;
    if (spanFilter === 'Single-Single Bailey (26–45m)')
      return b.span_length_m > 25.0 && b.span_length_m <= 45.0;
    if (spanFilter === 'Modular Heavy Bailey (46–90m)')
      return b.span_length_m > 45.0 && b.span_length_m <= 90.0;
    if (spanFilter === 'Pontoon / Long Span (91–150m)') return b.span_length_m > 90.0;
    return true;
  });

  const activeBridge =
    bridgeInterventions.find((b) => b.rank === selectedRank) ||
    filteredBridges[0] ||
    bridgeInterventions[0];

  const topBridge = bridgeInterventions[0];

  // Map markers & bridge span polylines
  const mapMarkers: MapMarkerItem[] = [
    {
      lat: activeBridge.lat,
      lon: activeBridge.lon,
      title: `🌉 Priority #${activeBridge.rank}: ${activeBridge.road_name}`,
      popupHtml: `
        <div style="font-family: sans-serif;">
          <b style="color: #00FF66;">BRIDGE PRIORITY #${activeBridge.rank}</b><br/>
          <b>Location:</b> ${activeBridge.road_name}<br/>
          <b>Span:</b> ${activeBridge.span_length_m}m &nbsp;|&nbsp; <b>ROI:</b> ${activeBridge.roi_score}<br/>
          <b>Structure:</b> ${activeBridge.recommended_structure}<br/>
          <b>Install:</b> ~${activeBridge.est_install_hrs} hrs
        </div>
      `,
      type: 'bridge',
    },
    ...filteredBridges.slice(0, 10).map((b) => ({
      lat: b.lat,
      lon: b.lon,
      title: `Rank #${b.rank}: ${b.road_name} (ROI: ${b.roi_score})`,
      radius: b.rank === activeBridge.rank ? 0 : 6,
      color: '#ffaa00',
    })),
  ];

  // Bridge span line (small synthetic span across the river coordinate)
  const dLat = 0.0003;
  const dLon = 0.0003;
  const bridgeSpanCoords: [number, number][] = [
    [activeBridge.lat - dLat, activeBridge.lon - dLon],
    [activeBridge.lat + dLat, activeBridge.lon + dLon],
  ];

  const mapPolylines: MapPolylineItem[] = [
    {
      coords: bridgeSpanCoords,
      color: '#00FF66',
      weight: 6,
      opacity: 1.0,
      tooltip: `Bailey Bridge Span: ${activeBridge.span_length_m}m`,
    },
  ];

  const exportCSV = () => {
    const headers = [
      'Rank',
      'Location',
      'Node U',
      'Node V',
      'Latitude',
      'Longitude',
      'Span (m)',
      'Reconnected Villages Count',
      'Reconnected Villages',
      'Pop Reconnected',
      'Detour Saved (km)',
      'ROI Score',
      'Intervention Type',
      'Structure',
      'Install Time (hrs)',
    ];

    const rows = bridgeInterventions.map((b) => [
      b.rank,
      `"${b.road_name}"`,
      b.u,
      b.v,
      b.lat,
      b.lon,
      b.span_length_m,
      b.reconnected_villages_count,
      `"${b.reconnected_villages_str}"`,
      b.reconnected_population,
      b.km_saved,
      b.roi_score,
      `"${b.intervention_type}"`,
      `"${b.recommended_structure}"`,
      b.est_install_hrs,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'military_bro_bridge_roi_manifest.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Overview Description */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-xl">🌉</span>
          Feature 4: Micro-Intervention ROI Engine (The Engineering Fix)
        </h3>
        <p className="text-xs text-[#c9d1d9] mt-2 leading-relaxed">
          <b>Tactical Resource Allocation:</b> An operations commander (Indian Army Corps of Engineers / BRO / ASDMA) has
          resources to deploy only <b>one or two temporary Bailey bridges, folding pontoon crossings, or modular culvert decks</b>.
          Where does it go? Lifeline OS evaluates candidate severed road edges, simulates their individual topological restoration,
          and quantitatively ranks each crossing by accessibility <b>Return on Investment (ROI)</b>:
        </p>
        <div className="bg-[#0d1117] border border-[#30363d] p-3 rounded-md my-3 font-mono text-xs text-[#00e676] text-center">
          ROI(e) = (Reconnected Population + ∑ Δ km saved) / Span Length (meters)
        </div>
      </div>

      {/* Top 4 Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8b949e]">
            Severed Spans Evaluated
          </div>
          <div className="text-2xl font-bold text-[#00BFFF] mt-1">{bridgeInterventions.length} Sites</div>
          <div className="text-[11px] text-[#8b949e] mt-1">Cachar Water Breaches</div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8b949e]">
            Top Recommended Crossing
          </div>
          <div className="text-base font-bold text-[#00e676] truncate mt-1" title={topBridge.road_name}>
            {topBridge.road_name.slice(0, 24)}...
          </div>
          <div className="text-[11px] text-[#00e676]/80 mt-1">Sadarghat Sector (Rank #1)</div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8b949e] flex items-center gap-1.5">
            <span className="pulse-warning"></span> Peak ROI Score
          </div>
          <div className="text-2xl font-bold text-[#ffaa00] mt-1">{topBridge.roi_score.toFixed(1)}</div>
          <div className="text-[11px] text-[#ffaa00]/80 mt-1">Citizens Reconnected / Meter</div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8b949e] flex items-center gap-1.5">
            <span className="pulse-success"></span> Max Citizens Reconnected
          </div>
          <div className="text-2xl font-bold text-[#d2a8ff] mt-1">
            {Math.max(...bridgeInterventions.map((b) => b.reconnected_population)).toLocaleString()}
          </div>
          <div className="text-[11px] text-[#d2a8ff]/80 mt-1">Direct Land Access Restored</div>
        </div>
      </div>

      {/* Filter and Selection Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-[#8b949e] font-semibold block mb-1">
            Filter by Engineering Span Capacity:
          </label>
          <select
            value={spanFilter}
            onChange={(e) => {
              setSpanFilter(e.target.value);
            }}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-xs text-white"
          >
            <option value="All Spans (≤150m)">All Spans (≤150m)</option>
            <option value="Short Span / Culvert (≤25m)">Short Span / Culvert (≤25m)</option>
            <option value="Single-Single Bailey (26–45m)">Single-Single Bailey (26–45m)</option>
            <option value="Modular Heavy Bailey (46–90m)">Modular Heavy Bailey (46–90m)</option>
            <option value="Pontoon / Long Span (91–150m)">Pontoon / Long Span (91–150m)</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs text-[#8b949e] font-semibold block mb-1">
            Inspect Candidate Micro-Intervention:
          </label>
          <select
            value={activeBridge.rank}
            onChange={(e) => setSelectedRank(Number(e.target.value))}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-xs text-white font-mono"
          >
            {filteredBridges.slice(0, 20).map((b) => (
              <option key={b.rank} value={b.rank}>
                Rank #{b.rank}: {b.road_name} | ROI: {b.roi_score} | Span: {b.span_length_m}m
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Two Column Layout: Dossier & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Spec Card and Table */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00e676]" />
            Tactical Bridging Spec Sheet & ROI Dossier
          </h4>

          {/* Active Bridge Card */}
          <div className="bg-[#161b22] border border-[#30363d] border-l-4 border-l-[#00e676] p-4 rounded-lg shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#00e676] text-sm flex items-center gap-1.5">
                🌉 Rank #{activeBridge.rank}: {activeBridge.road_name}
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#238636] text-white">
                ROI: {activeBridge.roi_score.toFixed(2)}
              </span>
            </div>

            <div className="text-xs text-[#c9d1d9] space-y-1">
              <div>
                <b>Severed Node Pair:</b> #{activeBridge.u} ➔ #{activeBridge.v}
              </div>
              <div>
                <b>Coordinates:</b> {activeBridge.lat.toFixed(5)}°N, {activeBridge.lon.toFixed(5)}°E
              </div>
              <div>
                <b>Intervention Category:</b>{' '}
                <span className="text-[#58a6ff] font-semibold">{activeBridge.intervention_type}</span>
              </div>
              <div>
                <b>Reconnected Communities:</b>{' '}
                <span className="text-[#ffaa00]">{activeBridge.reconnected_villages_str}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#0d1117] p-2 rounded text-center border border-[#21262d]">
                <div className="text-[10px] text-[#8b949e]">Span Gap</div>
                <div className="text-sm font-bold text-[#00BFFF]">{activeBridge.span_length_m} m</div>
              </div>
              <div className="bg-[#0d1117] p-2 rounded text-center border border-[#21262d]">
                <div className="text-[10px] text-[#8b949e]">Pop. Reconnected</div>
                <div className="text-sm font-bold text-[#00e676]">
                  {activeBridge.reconnected_population.toLocaleString()}
                </div>
              </div>
              <div className="bg-[#0d1117] p-2 rounded text-center border border-[#21262d]">
                <div className="text-[10px] text-[#8b949e]">Detour Avoidance</div>
                <div className="text-sm font-bold text-[#ffaa00]">{activeBridge.km_saved} km</div>
              </div>
            </div>

            <div className="bg-[#0d1117] p-3 rounded border border-[#21262d] text-xs text-[#7ee787] space-y-1">
              <div>
                <b>🎖️ Recommended Military / BRO Structure:</b>
                <div className="text-white font-medium">{activeBridge.recommended_structure}</div>
              </div>
              <div>
                <b>⏱️ Est. Construction & Launch Window:</b> ~{activeBridge.est_install_hrs} hours (1 Combat Engineer Platoon)
              </div>
            </div>
          </div>

          {/* Table of Top 10 Interventions */}
          <div className="border border-[#30363d] rounded-lg overflow-hidden bg-[#161b22]">
            <div className="max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0d1117] text-[#8b949e] sticky top-0 border-b border-[#30363d]">
                  <tr>
                    <th className="p-2">Rank</th>
                    <th className="p-2">Location</th>
                    <th className="p-2 text-right">Span</th>
                    <th className="p-2 text-right">Pop.</th>
                    <th className="p-2 text-right">ROI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#21262d]">
                  {filteredBridges.slice(0, 10).map((b) => (
                    <tr
                      key={b.rank}
                      onClick={() => setSelectedRank(b.rank)}
                      className={`cursor-pointer transition-colors ${
                        b.rank === activeBridge.rank
                          ? 'bg-[#238636]/20 text-white'
                          : 'hover:bg-[#21262d] text-[#c9d1d9]'
                      }`}
                    >
                      <td className="p-2 font-mono font-bold text-[#58a6ff]">#{b.rank}</td>
                      <td className="p-2 font-medium truncate max-w-[150px]">{b.road_name}</td>
                      <td className="p-2 text-right font-mono">{b.span_length_m}m</td>
                      <td className="p-2 text-right text-[#00e676]">{b.reconnected_population}</td>
                      <td className="p-2 text-right font-bold text-[#ffaa00]">{b.roi_score.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={exportCSV}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-[#21262d] hover:bg-[#30363d] text-white border border-[#30363d] text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#58a6ff]" />
            Export BRO / Corps of Engineers Bridging Directive (CSV)
          </button>
        </div>

        {/* Right: Map */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00FF66]" />
              Tactical Bridging Location & Approach Roads
            </h4>
            <span className="text-[11px] text-[#8b949e]">Green bar marks proposed Bailey span</span>
          </div>

          <MapView
            center={[activeBridge.lat, activeBridge.lon]}
            zoom={13}
            markers={mapMarkers}
            polylines={mapPolylines}
            showFloodMask={true}
            className="w-full h-[500px]"
          />
        </div>
      </div>
    </div>
  );
};
