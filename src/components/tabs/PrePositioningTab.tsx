import React, { useState } from 'react';
import { StagingHub, SettlementRecord } from '../../types';
import { MapView, MapMarkerItem, MapPolylineItem } from '../MapView';
import { Anchor, Download, Ship, Compass } from 'lucide-react';

interface PrePositioningTabProps {
  stagingHubs: StagingHub[];
  records: SettlementRecord[];
}

export const PrePositioningTab: React.FC<PrePositioningTabProps> = ({
  stagingHubs,
  records,
}) => {
  const [selectedHubId, setSelectedHubId] = useState<number | 'all'>('all');

  const isolatedVillages = records.filter((r) => r.modeled_status === 'MODEL_ISOLATED');
  const isolatedMap = new Map(isolatedVillages.map((v) => [v.village_name.toLowerCase(), v]));

  const displayedHubs =
    selectedHubId === 'all'
      ? stagingHubs
      : stagingHubs.filter((h) => h.hub_id === selectedHubId);

  // Map markers and transit vectors
  const mapMarkers: MapMarkerItem[] = [];
  const mapPolylines: MapPolylineItem[] = [];

  const colors = ['#ffaa00', '#00e5ff', '#00e676'];

  stagingHubs.forEach((hub, idx) => {
    const isSelected = selectedHubId === 'all' || selectedHubId === hub.hub_id;
    const hubColor = colors[idx % colors.length];

    mapMarkers.push({
      lat: hub.lat,
      lon: hub.lon,
      title: `⚓ ${hub.hub_name}`,
      popupHtml: `
        <div style="font-family: sans-serif;">
          <b style="color: #00BFFF;">⚓ ${hub.hub_name}</b><br/>
          <b>Roadhead Node:</b> #${hub.node}<br/>
          <b>Servicing:</b> ${hub.assigned_settlements_count} Isolated Settlements<br/>
          <b>Assets:</b> ${hub.recommended_relief_assets}
        </div>
      `,
      type: 'staging_hub',
    });

    const assignedNames = hub.assigned_villages_str.split(',').map((s) => s.trim().toLowerCase());
    assignedNames.forEach((name) => {
      // Find matching isolated village coordinates
      const matched = isolatedVillages.find((v) =>
        v.village_name.toLowerCase().includes(name) || name.includes(v.village_name.toLowerCase())
      );

      if (matched) {
        mapPolylines.push({
          coords: [
            [hub.lat, hub.lon],
            [matched.lat, matched.lon],
          ],
          color: isSelected ? hubColor : '#555555',
          weight: isSelected ? 3.5 : 1.5,
          dashArray: '6, 8',
          opacity: isSelected ? 0.9 : 0.35,
          tooltip: `Rescue Vector: ${hub.nearest_roadhead} ➔ ${matched.village_name}`,
        });

        mapMarkers.push({
          lat: matched.lat,
          lon: matched.lon,
          title: `Cut-off: ${matched.village_name} (Hub #${hub.hub_id})`,
          radius: isSelected ? 8 : 5,
          color: '#ff4d4d',
        });
      }
    });
  });

  const exportCSV = () => {
    const headers = [
      'Hub ID',
      'Name',
      'Roadhead',
      'Latitude',
      'Longitude',
      'Assigned Settlements Count',
      'Assigned Villages',
      'Avg Boat Transit (km)',
      'Max Boat Transit (km)',
      'Est Boat Transit (min)',
      'Recommended Assets',
      'Tier',
    ];
    const rows = stagingHubs.map((h) => [
      h.hub_id,
      `"${h.hub_name}"`,
      `"${h.nearest_roadhead}"`,
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

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'asdma_silchar_prepositioned_hubs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const center: [number, number] =
    selectedHubId !== 'all' && displayedHubs.length > 0
      ? [displayedHubs[0].lat, displayedHubs[0].lon]
      : [24.83, 92.8];

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Anchor className="w-5 h-5 text-[#00BFFF]" />
          Feature 2: Pre-Positioning Supply Hub Optimization (k-Medoids / Facility Location)
        </h3>
        <p className="text-xs text-[#c9d1d9] mt-2 leading-relaxed">
          <b>Preventative Operations Engine:</b> When settlements are severed from road networks (
          <code className="text-[#ff4d4d]">MODEL_ISOLATED</code>), standard ground ambulances cannot reach them. Instead of dispatching
          ad-hoc rescue craft across uncharted floodplains, Lifeline OS executes a combinatorial <b>k-Medoids facility location optimization</b>{' '}
          across non-flooded roadhead nodes along the flood perimeter. This identifies optimal dry staging bases to position{' '}
          <b>SDRF Zodiac rescue craft, 4x4 mobile medical units, and air-drop pads</b>, minimizing water transit distance and maximizing survival windows.
        </p>
      </div>

      {/* Top 4 Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8b949e]">
            Staging Bases
          </div>
          <div className="text-2xl font-bold text-[#00BFFF] mt-1">{stagingHubs.length} Roadheads</div>
          <div className="text-[11px] text-[#8b949e] mt-1">High-Ground Dry Perimeters</div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8b949e] flex items-center gap-1.5">
            <span className="pulse-success"></span> Cut-Off Settlements Serviced
          </div>
          <div className="text-2xl font-bold text-[#00e676] mt-1">8 (100%)</div>
          <div className="text-[11px] text-[#00e676]/80 mt-1">Full Inundation Coverage</div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8b949e]">
            Avg Water Rescue Transit
          </div>
          <div className="text-2xl font-bold text-white mt-1">10.8 km</div>
          <div className="text-[11px] text-[#8b949e] mt-1">Perimeter to Trapped Habitations</div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8b949e] flex items-center gap-1.5">
            <span className="pulse-warning"></span> Avg Boat Response Window
          </div>
          <div className="text-2xl font-bold text-[#ffaa00] mt-1">~36 min</div>
          <div className="text-[11px] text-[#ffaa00]/80 mt-1">@ 18 km/h SDRF Zodiac Speed</div>
        </div>
      </div>

      {/* Two Column Layout: Staging Base Manifest & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Cards & CSV Download */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Ship className="w-4 h-4 text-[#00e5ff]" />
              Staging Base Command Manifest & Asset Packages
            </h4>
            <select
              value={selectedHubId}
              onChange={(e) =>
                setSelectedHubId(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="bg-[#0d1117] border border-[#30363d] rounded px-2.5 py-1 text-xs text-white"
            >
              <option value="all">All Staging Bases</option>
              {stagingHubs.map((h) => (
                <option key={h.hub_id} value={h.hub_id}>
                  {h.hub_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {displayedHubs.map((hub) => (
              <div
                key={hub.hub_id}
                className="bg-[#161b22] border border-[#30363d] border-l-4 border-l-[#00BFFF] p-4 rounded-lg shadow-md space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#00e5ff] text-sm flex items-center gap-2">
                    ⚓ {hub.hub_name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#21262d] text-[#58a6ff] border border-[#388bfd]/40 font-mono">
                    {hub.hub_tier}
                  </span>
                </div>

                <div className="text-xs text-[#c9d1d9] space-y-1">
                  <div>
                    <b>Roadhead Node:</b> #{hub.node} (Dry & Accessible via Highway Grid)
                  </div>
                  <div>
                    <b>Coordinates:</b> {hub.lat.toFixed(5)}°N, {hub.lon.toFixed(5)}°E
                  </div>
                  <div>
                    <b>Assigned Cut-Off Settlements ({hub.assigned_settlements_count}):</b>{' '}
                    <span className="text-[#ffaa00] font-semibold">{hub.assigned_villages_str}</span>
                  </div>
                  <div className="text-[#8b949e]">
                    <b>Avg Boat Transit:</b> {hub.avg_boat_transit_km} km (Max: {hub.max_boat_transit_km} km) &nbsp;|&nbsp;{' '}
                    <b>Est. Transit Time:</b> ~{hub.est_boat_transit_min} min (@ 18 km/h SDRF speed)
                  </div>
                </div>

                <div className="bg-[#0d1117] p-2.5 rounded border border-[#21262d] text-xs text-[#7ee787]">
                  <b>🚨 Recommended Pre-Positioning Asset Package:</b>
                  <div className="mt-0.5">{hub.recommended_relief_assets}</div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={exportCSV}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-[#21262d] hover:bg-[#30363d] text-white border border-[#30363d] text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#58a6ff]" />
            Export ASDMA Pre-Positioning Operational Plan (CSV)
          </button>
        </div>

        {/* Right: Map with Staging Hubs & Water Transit Vectors */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#ffaa00]" />
              Tactical Staging Hubs & Water Transit Corridors
            </h4>
            <span className="text-[11px] text-[#8b949e]">Dashed lines show boat rescue vectors</span>
          </div>

          <MapView
            center={center}
            zoom={selectedHubId !== 'all' ? 12 : 10}
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
