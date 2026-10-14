import React, { useState } from 'react';
import { CriticalChokePoint } from '../../types';
import { MapView, MapMarkerItem } from '../MapView';
import { AlertTriangle, Wrench, ShieldAlert } from 'lucide-react';

interface CutEdgePercolationTabProps {
  chokePoints: CriticalChokePoint[];
}

export const CutEdgePercolationTab: React.FC<CutEdgePercolationTabProps> = ({ chokePoints }) => {
  const [selectedTier, setSelectedTier] = useState<string>('All Bottlenecks');
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  const filtered = chokePoints.filter((cp) => {
    if (selectedTier === 'CRITICAL_BOTTLENECK') return cp.action_tier === 'CRITICAL_BOTTLENECK';
    if (selectedTier === 'HIGH_VULNERABILITY') return cp.action_tier === 'HIGH_VULNERABILITY';
    return true;
  });

  const activeEdge = filtered[selectedIdx] || filtered[0] || chokePoints[0];

  // Map markers: top 10 bottlenecks as circles, plus active edge as wrench
  const mapMarkers: MapMarkerItem[] = [
    {
      lat: activeEdge.lat,
      lon: activeEdge.lon,
      title: `CHOKE POINT: ${activeEdge.road_name}`,
      popupHtml: `
        <div style="font-family: sans-serif;">
          <b style="color: #ff4d4d;">🚨 CHOKE POINT: ${activeEdge.road_name}</b><br/>
          <b>Isolates:</b> ${activeEdge.isolated_villages_count} Villages if breached<br/>
          <b>Action:</b> ${activeEdge.recommended_engineering_intervention}
        </div>
      `,
      type: 'choke_point',
    },
    ...filtered.slice(0, 10).map((cp) => ({
      lat: cp.lat,
      lon: cp.lon,
      title: `${cp.road_name} (Cuts ${cp.isolated_villages_count} villages)`,
      radius: Math.max(6, Math.min(16, cp.isolated_villages_count)),
      color: '#ff4d4d',
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Overview Description */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-xl">🔬</span>
          Feature 1: Pre-Disaster Cut-Edge Percolation (Criticality Index)
        </h3>
        <p className="text-xs text-[#c9d1d9] mt-2 leading-relaxed">
          <b>Preventative Operations Engine:</b> Instead of waiting for floodwaters to strike, Lifeline OS models the road network's
          topological graph as a <b>2-edge-connected condensation tree</b> (<code className="text-[#58a6ff]">nx.k_edge_components(G, k=2)</code>)
          months before peak rainfall. It evaluates graph articulation cut-edges to quantify <b>Community Isolation Risk</b>:
        </p>
        <div className="bg-[#0d1117] border border-[#30363d] p-3 rounded-md my-3 font-mono text-xs text-[#58a6ff] text-center">
          Criticality(e) = ∑<sub>v ∈ Villages</sub> Δ Isolation(e)
        </div>
        <p className="text-xs text-[#8b949e] italic">
          If Road Segment e washes out, exactly how many settlements lose 100% of their land-route egress to healthcare?
        </p>
      </div>

      {/* Top 4 Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8b949e]">
            Graph Articulation Bridges
          </div>
          <div className="text-2xl font-bold text-white mt-1">{chokePoints.length} Corridors</div>
          <div className="text-[11px] text-[#8b949e] mt-1">48 Topological Cut-Edges</div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8b949e] flex items-center gap-1.5">
            <span className="pulse-danger"></span> Max Cut Vulnerability
          </div>
          <div className="text-2xl font-bold text-[#ff4d4d] mt-1">18 Settlements</div>
          <div className="text-[11px] text-[#ff4d4d]/80 mt-1">Harinagar Inbound Access</div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8b949e] flex items-center gap-1.5">
            <span className="pulse-warning"></span> Severe Choke Points (≥10 vils)
          </div>
          <div className="text-2xl font-bold text-[#ffaa00] mt-1">4 Roads</div>
          <div className="text-[11px] text-[#ffaa00]/80 mt-1">Single Points of Failure</div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8b949e]">
            Action Timeframe
          </div>
          <div className="text-2xl font-bold text-[#00e676] mt-1">Pre-Monsoon</div>
          <div className="text-[11px] text-[#00e676]/80 mt-1">Deployment Window: T - 90d</div>
        </div>
      </div>

      {/* Two Columns: Choke Point Table & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Table and Inspection Card */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#ffaa00]" />
              Systemic Choke Points Ranked by Community Isolation Risk
            </h4>
            <select
              value={selectedTier}
              onChange={(e) => {
                setSelectedTier(e.target.value);
                setSelectedIdx(0);
              }}
              className="bg-[#0d1117] border border-[#30363d] rounded px-2.5 py-1 text-xs text-white"
            >
              <option value="All Bottlenecks">All Priorities</option>
              <option value="CRITICAL_BOTTLENECK">CRITICAL (≥15 settlements)</option>
              <option value="HIGH_VULNERABILITY">HIGH (8–14 settlements)</option>
            </select>
          </div>

          <div className="border border-[#30363d] rounded-lg overflow-hidden bg-[#161b22]">
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0d1117] text-[#8b949e] sticky top-0 border-b border-[#30363d]">
                  <tr>
                    <th className="p-2.5">Corridor</th>
                    <th className="p-2.5">Sector</th>
                    <th className="p-2.5 text-center">Villages Cut</th>
                    <th className="p-2.5">Span</th>
                    <th className="p-2.5">Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#21262d]">
                  {filtered.map((cp, idx) => (
                    <tr
                      key={cp.corridor_id}
                      onClick={() => setSelectedIdx(idx)}
                      className={`cursor-pointer transition-colors ${
                        cp.corridor_id === activeEdge.corridor_id
                          ? 'bg-[#1f6feb]/20 text-white'
                          : 'hover:bg-[#21262d] text-[#c9d1d9]'
                      }`}
                    >
                      <td className="p-2.5 font-medium">{cp.road_name}</td>
                      <td className="p-2.5 text-[#8b949e]">{cp.serving_settlement}</td>
                      <td className="p-2.5 text-center font-bold text-[#ff4d4d]">
                        {cp.isolated_villages_count}
                      </td>
                      <td className="p-2.5 font-mono text-[11px]">{cp.total_length_m}m</td>
                      <td className="p-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            cp.action_tier === 'CRITICAL_BOTTLENECK'
                              ? 'bg-[#ff4d4d]/20 text-[#ff4d4d] border border-[#ff4d4d]/40'
                              : cp.action_tier === 'HIGH_VULNERABILITY'
                              ? 'bg-[#ffaa00]/20 text-[#ffaa00] border border-[#ffaa00]/40'
                              : 'bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/40'
                          }`}
                        >
                          {cp.action_tier.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Engineering Spec Card */}
          <div className="bg-[#161b22] border-l-4 border-[#ff4d4d] border-t border-r border-b border-[#30363d] rounded-md p-4 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#ff4d4d]" />
                {activeEdge.road_name}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-[#ff4d4d]/20 text-[#ff4d4d] font-bold">
                Cuts {activeEdge.isolated_villages_count} Habitations
              </span>
            </div>

            <div className="text-[#c9d1d9] space-y-1 pt-1">
              <div>
                • <b>Logistical Role:</b> Primary artery serving{' '}
                <span className="text-[#58a6ff]">{activeEdge.serving_settlement}</span> (
                {activeEdge.highway_type.toUpperCase()}).
              </div>
              <div>
                • <b>Vulnerability Score:</b> Single point of failure. Breach isolates{' '}
                <span className="text-[#ff4d4d] font-bold">{activeEdge.isolated_villages_count} whole habitations</span>{' '}
                simultaneously across {activeEdge.segments_count} contiguous segments.
              </div>
              <div>
                • <b>Corridor Span:</b> {activeEdge.total_length_m} meters (Centroid:{' '}
                {activeEdge.lat.toFixed(5)}°N, {activeEdge.lon.toFixed(5)}°E)
              </div>
              <div>
                • <b>Preventative Action:</b>{' '}
                <span className="text-[#00e676] font-bold">
                  {activeEdge.recommended_engineering_intervention}
                </span>
              </div>
              <div>
                • <b>Implementation Window:</b> Pre-monsoon dry season deployment (January–April).
              </div>
            </div>
          </div>
        </div>

        {/* Right: Interactive Folium / Leaflet Choke Point Map */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#00BFFF]" />
              Critical Choke Point Map: {activeEdge.road_name}
            </h4>
            <span className="text-[11px] text-[#8b949e]">
              Red circles indicate top community bottlenecks
            </span>
          </div>

          <MapView
            center={[activeEdge.lat, activeEdge.lon]}
            zoom={13}
            markers={mapMarkers}
            showFloodMask={true}
            className="w-full h-[480px]"
          />
        </div>
      </div>
    </div>
  );
};
