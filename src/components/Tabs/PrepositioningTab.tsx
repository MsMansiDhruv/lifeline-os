import React, { useState } from 'react';
import { STAGING_HUBS, SETTLEMENTS_LIGHT } from '../../data/disasterData';
import { StagingHubRecord } from '../../types';
import { LeafletMap } from '../LeafletMap';
import { Anchor, Download, Navigation, Shield, CheckCircle } from 'lucide-react';

export const PrepositioningTab: React.FC = () => {
  const [selectedHubId, setSelectedHubId] = useState<number | 'all'>('all');

  const displayHubs = selectedHubId === 'all'
    ? STAGING_HUBS
    : STAGING_HUBS.filter((h) => h.hub_id === selectedHubId);

  // Download CSV
  const handleDownloadCsv = () => {
    const headers = [
      'Hub ID',
      'Hub Name',
      'Roadhead Node',
      'Latitude',
      'Longitude',
      'Assigned Settlements Count',
      'Assigned Villages',
      'Avg Boat Transit (km)',
      'Max Boat Transit (km)',
      'Est Boat Transit (min)',
      'Recommended Relief Assets',
      'Hub Tier',
    ];

    const rows = STAGING_HUBS.map((h) => [
      h.hub_id,
      `"${h.hub_name}"`,
      h.node,
      h.lat,
      h.lon,
      h.assigned_settlements_count,
      `"${h.assigned_villages_str}"`,
      h.avg_boat_transit_km,
      h.max_boat_transit_km,
      h.est_boat_transit_min,
      `"${h.recommended_relief_assets}"`,
      `"${h.hub_tier}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'asdma_silchar_prepositioned_hubs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Build Map Markers and Transit Vector Lines
  const mapMarkers = [
    // Staging Hub Markers
    ...displayHubs.map((h) => ({
      lat: h.lat,
      lon: h.lon,
      title: h.hub_name,
      description: `Dry Roadhead Node #${h.node}. Servicing ${h.assigned_settlements_count} cut-off settlements. Assets: ${h.recommended_relief_assets}`,
      type: 'hub' as const,
      badge: `Base #${h.hub_id}`,
    })),
    // Isolated Settlements
    ...SETTLEMENTS_LIGHT.filter((s) => s.modeled_status === 'MODEL_ISOLATED').map((s) => ({
      lat: s.lat,
      lon: s.lon,
      title: `Cut-Off Habitat: ${s.village_name}`,
      description: `Complete land-route isolation. Requires water/air rescue.`,
      type: 'isolated' as const,
      badge: 'ISOLATED',
    })),
  ];

  // Map Lines: dashed lines from each hub to its assigned settlements
  const lines: Array<{
    points: [number, number][];
    color: string;
    dashArray?: string;
    weight?: number;
    label?: string;
  }> = [];

  const colors = ['#ffaa00', '#00e5ff', '#00e676'];

  displayHubs.forEach((hub, idx) => {
    const hubColor = colors[idx % colors.length];
    const assignedNames = hub.assigned_villages_str.split(',').map((v: string) => v.trim().toLowerCase());

    SETTLEMENTS_LIGHT.filter((s) => s.modeled_status === 'MODEL_ISOLATED').forEach((s) => {
      // Connect if matched
      if (assignedNames.some((name: string) => s.village_name.toLowerCase().includes(name) || name.includes(s.village_name.toLowerCase()))) {
        lines.push({
          points: [
            [hub.lat, hub.lon],
            [s.lat, s.lon],
          ],
          color: hubColor,
          dashArray: '6, 8',
          weight: 3,
          label: `Rescue Vector: ${hub.hub_name} ➔ ${s.village_name}`,
        });
      }
    });
  });

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-xl shadow-md">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-800/50 mt-0.5">
            <Anchor className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Feature 2: Pre-Positioning Supply Hub Optimization (k-Medoids / Facility Location)
            </h3>
            <p className="text-xs text-[#8b949e] mt-1 leading-relaxed">
              <strong className="text-[#c9d1d9]">Preventative Operations Engine:</strong> When settlements are completely cut off (
              <span className="text-red-400 font-mono">MODEL_ISOLATED</span>), standard road ambulances cannot navigate through floodwaters.
              Lifeline OS executes combinatorial <strong className="text-cyan-400">k-Medoids facility location optimization</strong> across non-flooded roadhead nodes along the flood perimeter:
              <br />
              <span className="font-mono text-cyan-300">min_(S ⊆ V_dry, |S|=k) Σ_(v ∈ V_iso) min_(s ∈ S) d(v, s)</span>
              <br />
              This identifies optimal dry staging bases to position <strong className="text-white">SDRF Zodiac rescue craft, 4x4 mobile intensive care units, and airdrop pads</strong>, minimizing water transit distance and maximizing survival windows.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl">
          <div className="text-xs text-[#8b949e] uppercase font-semibold">Staging Bases</div>
          <div className="text-2xl font-bold text-[#00BFFF] mt-1">{STAGING_HUBS.length} Strategic Hubs</div>
          <div className="text-[11px] text-[#8b949e] mt-1">High-elevation dry roadheads</div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-[#8b949e] uppercase font-semibold">
            <span>Cut-Off Settlements Serviced</span>
            <span className="pulse-success" />
          </div>
          <div className="text-2xl font-bold text-[#00e676] mt-1">12 (100% Coverage)</div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Zero unassigned cut-off settlements</div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl">
          <div className="text-xs text-[#8b949e] uppercase font-semibold">Avg Water Rescue Transit</div>
          <div className="text-2xl font-bold text-white mt-1">5.5 km</div>
          <div className="text-[11px] text-[#8b949e] mt-1">Max cluster distance: 9.8 km</div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-[#8b949e] uppercase font-semibold">
            <span>Avg Boat Response Window</span>
            <span className="pulse-warning" />
          </div>
          <div className="text-2xl font-bold text-[#ffaa00] mt-1">~18.3 min</div>
          <div className="text-[11px] text-amber-400/80 mt-1">@ 18 km/h SDRF Zodiac transit speed</div>
        </div>
      </div>

      {/* Two Columns: Manifest & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Command Manifest */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Navigation className="w-4 h-4 text-cyan-400" />
              Staging Base Command Manifest & Asset Packages
            </h4>

            <select
              value={selectedHubId}
              onChange={(e) => setSelectedHubId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-[#161b22] text-xs text-[#c9d1d9] border border-[#30363d] rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
            >
              <option value="all">All Staging Bases</option>
              {STAGING_HUBS.map((h) => (
                <option key={h.hub_id} value={h.hub_id}>
                  Base #{h.hub_id} ({h.nearest_roadhead})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {displayHubs.map((hub) => (
              <div
                key={hub.hub_id}
                className="bg-[#161b22] border border-[#30363d] border-l-4 border-l-cyan-400 p-4 rounded-r-xl shadow-md space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-cyan-300 flex items-center gap-1.5">
                    ⚓ {hub.hub_name}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#21262d] text-cyan-400 border border-cyan-800/40">
                    {hub.hub_tier}
                  </span>
                </div>

                <div className="text-[#c9d1d9] space-y-1">
                  <div>
                    <strong>Roadhead Node:</strong> #{hub.node} (Dry & Accessible via Highway Grid)
                  </div>
                  <div>
                    <strong>Coordinates:</strong> {hub.lat.toFixed(5)}°N, {hub.lon.toFixed(5)}°E
                  </div>
                  <div>
                    <strong>Assigned Cut-Off Settlements ({hub.assigned_settlements_count}):</strong>{' '}
                    <span className="text-amber-400 font-medium">{hub.assigned_villages_str}</span>
                  </div>
                  <div className="flex gap-4 text-[#8b949e] pt-1">
                    <span>Avg Boat Transit: <strong className="text-white">{hub.avg_boat_transit_km} km</strong> (Max: {hub.max_boat_transit_km} km)</span>
                    <span>Est Transit: <strong className="text-emerald-400">~{hub.est_boat_transit_min} min</strong></span>
                  </div>
                </div>

                <div className="mt-2 p-2.5 rounded bg-[#0d1117] border border-[#21262d] text-emerald-300 text-[11px] leading-relaxed">
                  <strong className="text-emerald-400 block mb-0.5">🚨 Recommended Pre-Positioning Asset Package:</strong>
                  {hub.recommended_relief_assets}
                </div>
              </div>
            ))}
          </div>

          {/* Export Button */}
          <button
            onClick={handleDownloadCsv}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-semibold border border-[#30363d] shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export ASDMA Pre-Positioning Operational Plan (CSV)</span>
          </button>
        </div>

        {/* Right Column: Tactical Map */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#8b949e]">
            <span className="font-medium text-white">Tactical Staging Hubs & Water Transit Corridors</span>
            <span>BARAK RIVER BASIN</span>
          </div>

          <LeafletMap
            center={[24.83, 92.85]}
            zoom={10}
            height="520px"
            markers={mapMarkers}
            lines={lines}
          />
          <div className="text-[11px] text-[#8b949e] italic flex items-center justify-between">
            <span>⚓ Blue/Orange markers = Dry roadhead hubs</span>
            <span>Dashed lines = Water rescue vectors</span>
          </div>
        </div>
      </div>
    </div>
  );
};
