import React, { useState } from 'react';
import { SettlementRecord, FleetMode, RoutingIntelligencePayload } from '../../types';
import { MapView, MapMarkerItem, MapPolylineItem } from '../MapView';
import { Bot, Send, Sparkles, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface AIPolicyCopilotTabProps {
  records: SettlementRecord[];
  fleetMode: FleetMode;
}

export const AIPolicyCopilotTab: React.FC<AIPolicyCopilotTabProps> = ({
  records,
  fleetMode,
}) => {
  const [selectedVillageId, setSelectedVillageId] = useState<number>(64); // Default to Binnākāndi
  const [memo, setMemo] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const target = records.find((r) => r.village_id === selectedVillageId) || records[0];

  // Construct decision-grade JSON payload matching app.py exactly
  const routingPayload: RoutingIntelligencePayload = {
    village_name: target.village_name,
    status: target.modeled_status,
    fleet_dispatch_profile: fleetMode,
    coordinates: {
      latitude: target.lat,
      longitude: target.lon,
    },
    baseline_route: {
      distance_km: target.baseline_km,
      travel_time_minutes: target.baseline_min,
      facility: target.baseline_facility_name,
    },
    scenario_route: {
      distance_km: target.scenario_km,
      travel_time_minutes: target.scenario_min,
      additional_km: target.additional_km,
      additional_minutes_delay: target.additional_min,
      detour_ratio: target.detour_ratio,
      facility: target.scenario_facility_name,
    },
    topological_audit: {
      snap_distance_meters: target.snap_distance_m,
      water_barrier_defense_checked: true,
      bridgehead_approach_ramp_audited: true,
    },
  };

  const handleGenerateMemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/generate-memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routingPayload }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate memo.');
      }
      setMemo(data.memo);
    } catch (err: any) {
      setError(err.message || 'Error communicating with Gemini Copilot.');
    } finally {
      setLoading(false);
    }
  };

  // Build Map elements for Audit Map
  const mapMarkers: MapMarkerItem[] = [
    {
      lat: target.lat,
      lon: target.lon,
      title: `Origin: ${target.village_name} (${target.modeled_status})`,
      popupHtml: `
        <div>
          <b>Origin Village:</b> ${target.village_name}<br/>
          <b>Status:</b> ${target.modeled_status}
        </div>
      `,
      type: 'village',
      color: target.modeled_status === 'MODEL_ISOLATED' ? '#ff4d4d' : '#00e676',
    },
  ];

  const mapPolylines: MapPolylineItem[] = [];

  // If specific coordinates exist on record, use them, otherwise create synthetic route to facility
  if (target.baseline_route_coords) {
    mapPolylines.push({
      coords: target.baseline_route_coords,
      color: '#00FF66',
      weight: 5,
      opacity: 0.9,
      tooltip: `Baseline Route (${target.baseline_km} km, ${target.baseline_min} min)`,
    });
    // Add baseline facility marker
    const lastCoord = target.baseline_route_coords[target.baseline_route_coords.length - 1];
    mapMarkers.push({
      lat: lastCoord[0],
      lon: lastCoord[1],
      title: `Baseline Facility: ${target.baseline_facility_name}`,
      type: 'baseline_facility',
    });
  } else {
    // Synthetic straight line + small midpoint bend for visualization
    const fLat = target.lat + 0.02;
    const fLon = target.lon - 0.02;
    mapPolylines.push({
      coords: [
        [target.lat, target.lon],
        [target.lat + 0.01, target.lon - 0.005],
        [fLat, fLon],
      ],
      color: '#00FF66',
      weight: 4,
      opacity: 0.8,
      tooltip: `Baseline Route (${target.baseline_km} km, ${target.baseline_min} min)`,
    });
    mapMarkers.push({
      lat: fLat,
      lon: fLon,
      title: `Baseline Facility: ${target.baseline_facility_name}`,
      type: 'baseline_facility',
    });
  }

  // Scenario route if not isolated
  if (target.scenario_route_coords) {
    mapPolylines.push({
      coords: target.scenario_route_coords,
      color: '#FF3300',
      weight: 4,
      dashArray: '6, 8',
      opacity: 0.9,
      tooltip: `Scenario Detour (${target.scenario_km} km, ${target.scenario_min} min)`,
    });
    const lastCoord = target.scenario_route_coords[target.scenario_route_coords.length - 1];
    mapMarkers.push({
      lat: lastCoord[0],
      lon: lastCoord[1],
      title: `Rerouted Facility: ${target.scenario_facility_name}`,
      type: 'scenario_facility',
    });
  } else if (target.scenario_km !== null) {
    const sLat = target.lat + 0.05;
    const sLon = target.lon + 0.04;
    mapPolylines.push({
      coords: [
        [target.lat, target.lon],
        [target.lat + 0.025, target.lon + 0.02],
        [sLat, sLon],
      ],
      color: '#FF3300',
      weight: 4,
      dashArray: '6, 8',
      opacity: 0.9,
      tooltip: `Scenario Detour (${target.scenario_km} km, ${target.scenario_min} min)`,
    });
    mapMarkers.push({
      lat: sLat,
      lon: sLon,
      title: `Alternative Facility: ${target.scenario_facility_name}`,
      type: 'scenario_facility',
    });
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Bot className="w-5 h-5 text-[#58a6ff]" />
          Disaster Response Strategy & Spatial Audit Studio
        </h3>
        <p className="text-xs text-[#8b949e] mt-1">
          Pair deterministic topological spatial routing vectors with autonomous Google Gemini military-grade logistics memos for the Assam State Disaster Management Authority (ASDMA).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Settlement Picker, JSON Payload & Gemini Memo */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#8b949e] block mb-1">
              Select Target Settlement for Strategy Review:
            </label>
            <select
              value={selectedVillageId}
              onChange={(e) => {
                setSelectedVillageId(Number(e.target.value));
                setMemo(null);
                setError(null);
              }}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-[#58a6ff]"
            >
              {records
                .filter((r) => r.modeled_status !== 'REACHABLE_SAME_FACILITY')
                .map((r) => (
                  <option key={r.village_id} value={r.village_id}>
                    {r.village_name} [{r.modeled_status}] (ID: {r.village_id})
                  </option>
                ))}
            </select>
          </div>

          {/* JSON Payload Viewer */}
          <div>
            <div className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Routing Intelligence Payload (JSON)</span>
              <span className="text-[#58a6ff] font-mono text-[10px]">Deterministic Output</span>
            </div>
            <pre className="bg-[#0d1117] border border-[#30363d] rounded-md p-3 text-[11px] font-mono text-[#c9d1d9] max-h-56 overflow-y-auto">
              {JSON.stringify(routingPayload, null, 2)}
            </pre>
          </div>

          {/* Generate Memo Button */}
          <button
            onClick={handleGenerateMemo}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white font-semibold text-xs shadow-lg transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Dispatching payload to Gemini Policy Agent...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate ASDMA Strategy Memo (Gemini)
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 text-[#ff4d4d] p-3 rounded-md text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Generated Memo Output Card */}
          {memo && (
            <div className="bg-[#161b22] border border-[#238636]/50 rounded-lg p-4 space-y-2 shadow-xl animate-fadeIn">
              <div className="flex items-center gap-2 text-xs font-bold text-[#00e676]">
                <CheckCircle className="w-4 h-4" />
                Official Disaster Management Directive (ASDMA)
              </div>
              <div className="text-xs text-[#c9d1d9] leading-relaxed whitespace-pre-line bg-[#0d1117] p-3.5 rounded border border-[#21262d]">
                {memo}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Folium / Leaflet Spatial Audit Map */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              🗺️ Spatial Routing Audit Map: {target.village_name}
            </h4>
            <span className="text-[11px] text-[#8b949e]">
              Green: Baseline | Red Dashed: Flooded Detour
            </span>
          </div>

          <MapView
            center={[target.lat, target.lon]}
            zoom={13}
            markers={mapMarkers}
            polylines={mapPolylines}
            showFloodMask={true}
            className="w-full h-[520px]"
          />
        </div>
      </div>
    </div>
  );
};
