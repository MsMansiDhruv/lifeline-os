import React, { useState } from 'react';
import { FleetMode } from '../../types';
import { LeafletMap, MapLine, MapMarker } from '../LeafletMap';
import { JuryScorecard } from '../JuryScorecard';
import {
  INTERVENTION_TOOLS,
  InterventionType,
  TheaterData,
  TheaterChokePoint,
} from '../../data/theaters';
import {
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MapPin,
  CheckCircle2,
  Clock,
  DollarSign,
  Activity,
  Layers,
  Flame,
} from 'lucide-react';

interface PercolationTabProps {
  currentTheater: TheaterData;
  interventions: Record<string, InterventionType>;
  onSetIntervention: (chokePointId: string, tool: InterventionType) => void;
  onResetInterventions: () => void;
  fleetMode: FleetMode;
  tourStep?: number;
}

export const PercolationTab: React.FC<PercolationTabProps> = ({
  currentTheater,
  interventions,
  onSetIntervention,
  onResetInterventions,
  fleetMode,
  tourStep = 0,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [showAllCorridors, setShowAllCorridors] = useState<boolean>(false);
  const isHeavy = fleetMode === 'Heavy Supply (Truck/Bus)';

  const chokePoints = currentTheater.chokePoints;
  const selectedChoke: TheaterChokePoint = chokePoints[selectedIdx] || chokePoints[0];
  const activeTool = interventions[selectedChoke.id] || 'none';

  const displayedEdges = showAllCorridors ? chokePoints : chokePoints.slice(0, 5);

  // Compute map markers and lines dynamically
  const mapMarkers: MapMarker[] = [];
  const mapLines: MapLine[] = [];

  // 1. Choke Point Markers
  chokePoints.forEach((cp, idx) => {
    const toolKey = interventions[cp.id] || 'none';
    const isSelected = cp.id === selectedChoke.id;
    const toolMeta = toolKey !== 'none' ? INTERVENTION_TOOLS[toolKey] : null;

    let markerType: MapMarker['type'] = 'chokepoint';
    let badge = `RANK #${cp.rank} • ${cp.trapped_villages_count} VILLAGES CUT`;

    if (toolMeta) {
      if (toolKey === 'bridge') {
        markerType = 'bridge';
        badge = 'BAILEY BRIDGE ACTIVE';
      } else if (toolKey === 'boat') {
        markerType = 'boat';
        badge = 'FERRY EVACUATION';
      } else if (toolKey === 'drone') {
        markerType = 'drone';
        badge = 'MED-DRONE AIR CORRIDOR';
      } else if (toolKey === 'booth') {
        markerType = 'booth';
        badge = 'FIELD CLINIC BOOTH';
      }
    }

    mapMarkers.push({
      lat: cp.lat,
      lon: cp.lon,
      title: cp.road_name,
      description: `${cp.exposed_meters}m breach • Baseline ${cp.baseline_km}km vs Detour ${cp.detour_km}km • ${
        toolMeta ? toolMeta.desc : 'Traps ' + cp.trapped_villages_count + ' settlements without land egress.'
      }`,
      type: markerType,
      badge: isSelected ? `[SELECTED] ${badge}` : badge,
    });
  });

  // 2. Trapped Village Pins for the selected corridor
  selectedChoke.villages.forEach((village) => {
    let pinType: MapMarker['type'] = 'isolated';
    let badgeText = 'TRAPPED (NO LAND EGRESS)';

    if (activeTool === 'bridge') {
      pinType = 'reachable';
      badgeText = 'SECURED VIA BAILEY BRIDGE';
    } else if (activeTool === 'boat') {
      pinType = 'boat';
      badgeText = 'EVACUATING VIA RESCUE BOAT';
    } else if (activeTool === 'drone') {
      pinType = 'drone';
      badgeText = 'SUPPLIED VIA MED-DRONE';
    } else if (activeTool === 'booth') {
      pinType = 'booth';
      badgeText = 'TREATED AT FIELD CLINIC';
    }

    mapMarkers.push({
      lat: village.lat,
      lon: village.lon,
      title: village.name,
      description: `Pop: ${village.population?.toLocaleString() || '2,400'} • Dependent on ${selectedChoke.road_name}`,
      type: pinType,
      badge: badgeText,
    });

    // Catchment line connecting choke point to village
    const toolMeta = activeTool !== 'none' ? INTERVENTION_TOOLS[activeTool] : null;
    mapLines.push({
      id: `catchment_${village.id}`,
      points: [
        [selectedChoke.lat, selectedChoke.lon],
        [village.lat, village.lon],
      ],
      color: toolMeta ? toolMeta.pinColor : '#ffaa00',
      dashArray: toolMeta ? undefined : '5, 8',
      weight: toolMeta ? 3 : 2,
      label: toolMeta
        ? `${toolMeta.name} Vector: ${selectedChoke.road_name} ➔ ${village.name}`
        : `Severed Catchment: ${selectedChoke.road_name} ➔ ${village.name}`,
      layerType: 'catchment',
    });
  });

  // 3. Hospital Markers
  currentTheater.hospitals.forEach((hosp) => {
    let surgeVal = hosp.baseline_surge;
    // Relieve surge if active tools
    if (activeTool !== 'none' && hosp.id === selectedChoke.nearest_hospital_id) {
      const relief = INTERVENTION_TOOLS[activeTool].hospitalSurgeReliefPct;
      surgeVal = Math.round(surgeVal * (1 - relief / 100));
    }

    mapMarkers.push({
      lat: hosp.lat,
      lon: hosp.lon,
      title: hosp.name,
      description: `${hosp.beds} beds • Current Catchment Load: ${surgeVal > 0 ? '+' + surgeVal + '%' : surgeVal + '%'}`,
      type: 'facility',
      badge: hosp.type === 'starved' ? 'CUT-OFF CLINIC (-85%)' : `SURGE +${surgeVal}%`,
    });
  });

  // 4. Breach Span line & Specialized Tool Vectors
  const spanHalfLen = 0.0022;
  const toolMeta = activeTool !== 'none' ? INTERVENTION_TOOLS[activeTool] : null;

  if (activeTool === 'bridge') {
    mapLines.push({
      id: 'hardened_span',
      points: [
        [selectedChoke.lat - spanHalfLen, selectedChoke.lon - spanHalfLen],
        [selectedChoke.lat + spanHalfLen, selectedChoke.lon + spanHalfLen],
      ],
      color: '#10b981',
      weight: 8,
      label: `BAILEY BRIDGE ACTIVE: Full Highway & 16T Truck Access Restored`,
      layerType: 'baseline',
    });
  } else if (activeTool === 'boat') {
    mapLines.push({
      id: 'boat_corridor',
      points: [
        [selectedChoke.lat - spanHalfLen * 2, selectedChoke.lon - spanHalfLen * 2],
        [selectedChoke.lat + spanHalfLen * 2, selectedChoke.lon + spanHalfLen * 2],
      ],
      color: '#06b6d4',
      dashArray: '4, 4',
      weight: 5,
      label: `MARINE FERRY SHUTTLE: Critical Patient Water Transfer Active`,
      layerType: 'boat',
    });
  } else if (activeTool === 'drone') {
    // Air corridor from nearest hospital directly to trapped villages
    const nearestHosp =
      currentTheater.hospitals.find((h) => h.id === selectedChoke.nearest_hospital_id) ||
      currentTheater.hospitals[0];

    if (nearestHosp) {
      mapLines.push({
        id: 'drone_air_corridor',
        points: [
          [nearestHosp.lat, nearestHosp.lon],
          [selectedChoke.lat, selectedChoke.lon],
        ],
        color: '#a855f7',
        weight: 4,
        dashArray: '4, 4',
        label: `UAV AIRBRIDGE: 12-Min Emergency Medical Supply Line`,
        layerType: 'drone',
      });

      // Add a drone icon marker midway
      const midLat = (nearestHosp.lat + selectedChoke.lat) / 2;
      const midLon = (nearestHosp.lon + selectedChoke.lon) / 2;
      mapMarkers.push({
        lat: midLat,
        lon: midLon,
        title: 'Med-Drone In-Flight',
        description: 'Air-dropping blood units, antivenom & emergency insulin',
        type: 'drone',
        badge: 'FLIGHT TIME: 12 MINS',
      });
    }
  } else if (activeTool === 'booth') {
    mapMarkers.push({
      lat: selectedChoke.lat + 0.0015,
      lon: selectedChoke.lon + 0.0015,
      title: 'Mobile Field Clinic Booth',
      description: 'Treating 75% of casualties on-site to relieve hospital emergency rooms',
      type: 'booth',
      badge: 'TRIAGE OPERATIONAL (-80% SURGE)',
    });
  } else {
    // Severed Breach line
    mapLines.push({
      id: 'severed_span',
      points: [
        [selectedChoke.lat - spanHalfLen, selectedChoke.lon - spanHalfLen],
        [selectedChoke.lat + spanHalfLen, selectedChoke.lon + spanHalfLen],
      ],
      color: '#f43f5e',
      weight: 7,
      label: `Severed Bridge Breach: ${selectedChoke.road_name} (${selectedChoke.exposed_meters}m Exposed Span)`,
      className: 'severed-span-anim',
      layerType: 'severed',
    });
  }

  // Baseline vs Detour Lines
  mapLines.push({
    id: 'baseline_route',
    points: [
      [selectedChoke.lat + 0.012, selectedChoke.lon + 0.018],
      [selectedChoke.lat, selectedChoke.lon],
      [selectedChoke.lat - 0.015, selectedChoke.lon - 0.022],
    ],
    color: '#10b981',
    weight: activeTool === 'bridge' ? 7 : 4,
    label:
      activeTool === 'bridge'
        ? `Direct Highway Restored: Baseline ${selectedChoke.baseline_km} km Operational`
        : `Normal Pre-Flood Primary Route: ${selectedChoke.baseline_km} km (Blocked at Breach)`,
    layerType: 'baseline',
  });

  if (activeTool !== 'bridge') {
    mapLines.push({
      id: 'detour_route',
      points: [
        [selectedChoke.lat + 0.012, selectedChoke.lon + 0.018],
        [selectedChoke.lat + 0.035, selectedChoke.lon + 0.025],
        [selectedChoke.lat + 0.045, selectedChoke.lon + 0.012],
        [selectedChoke.lat - 0.015, selectedChoke.lon - 0.022],
      ],
      color: '#f43f5e',
      dashArray: '6, 8',
      weight: 3.5,
      label: `Forced Emergency Flood Detour Route: ${selectedChoke.detour_km} km (+${(
        selectedChoke.detour_km - selectedChoke.baseline_km
      ).toFixed(1)} km surcharge)`,
      layerType: 'detour',
    });
  }

  return (
    <div className="space-y-4">
      {/* Split-Screen Workspace (40% Actionable List | 60% Hero Map) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (40%): Actionable Choke Point Cards with 4-Tool Jury Sandbox */}
        <div className="lg:col-span-5 space-y-3">
          {/* Section Header */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              Critical Bottlenecks ({chokePoints.length})
            </span>
            <div className="flex items-center gap-2">
              {Object.values(interventions).some((v) => v !== 'none') && (
                <button
                  onClick={onResetInterventions}
                  className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer font-medium"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All</span>
                </button>
              )}
              <span className="text-[10px] font-mono text-neutral-400 bg-[#161b22] px-2 py-0.5 rounded border border-[#30363d]">
                4-Tool Sandbox
              </span>
            </div>
          </div>

          {/* List of Compact Corridor Cards */}
          <div className="space-y-2.5">
            {displayedEdges.map((cp, idx) => {
              const isSelected = cp.id === selectedChoke.id;
              const tool = interventions[cp.id] || 'none';
              const toolMeta = tool !== 'none' ? INTERVENTION_TOOLS[tool] : null;
              const isSpotlight = idx === 0 && (tourStep === 2 || tourStep === 3);

              return (
                <div
                  key={cp.id}
                  id={idx === 0 ? 'tour-step-2-chokepoint-card' : undefined}
                  onClick={() => setSelectedIdx(idx)}
                  className={`rounded-xl border transition-all cursor-pointer overflow-hidden ${
                    isSpotlight
                      ? 'border-emerald-400 ring-4 ring-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.7)] z-50 relative bg-[#1c2128]'
                      : isSelected
                      ? 'border-blue-500/80 shadow-[0_0_15px_rgba(59,130,246,0.2)] bg-[#1c2128]'
                      : 'border-[#30363d] bg-[#161b22] hover:border-neutral-500'
                  }`}
                >
                  {/* Card Header & Impact Row */}
                  <div className="p-3.5 flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/60 shrink-0">
                          #{cp.rank}
                        </span>
                        <div className="truncate">
                          <h3 className="text-xs font-bold text-white truncate">
                            {cp.road_name}
                          </h3>
                          <span className="text-[10px] text-neutral-400 block truncate">
                            {cp.exposed_meters}m breach • {cp.spans_count} span{cp.spans_count > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Status / Relief Pill */}
                      {toolMeta ? (
                        <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold border font-mono bg-emerald-950 text-emerald-300 border-emerald-700/80">
                          {toolMeta.statusBadge.split(' ')[0]} {toolMeta.statusBadge.split(' ')[1]}
                        </span>
                      ) : (
                        <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold border font-mono bg-rose-950 text-rose-400 border-rose-800">
                          {cp.trapped_villages_count} Villages Cut
                        </span>
                      )}
                    </div>

                    {/* 4-Option Jury Sandbox Tool Bar */}
                    <div className="pt-1 border-t border-[#21262d]">
                      <div className="text-[10px] text-neutral-400 font-semibold mb-1.5 flex items-center justify-between">
                        <span>Select Intervention Tool:</span>
                        {toolMeta && (
                          <span className="text-cyan-400 font-mono text-[10px]">
                            {toolMeta.timeStr} • {toolMeta.costStr}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {/* Tool 1: Bailey Bridge */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetIntervention(cp.id, tool === 'bridge' ? 'none' : 'bridge');
                          }}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-bold flex flex-col items-start transition-all cursor-pointer border ${
                            tool === 'bridge'
                              ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                              : 'bg-[#0d1117] text-neutral-300 border-[#30363d] hover:border-emerald-500/60'
                          }`}
                        >
                          <span className="flex items-center gap-1 font-bold">
                            Bailey Bridge
                          </span>
                          <span className="text-[9px] text-neutral-400 font-mono">
                            ₹72L | 48h (16T Capable)
                          </span>
                        </button>

                        {/* Tool 2: Rescue Boat */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetIntervention(cp.id, tool === 'boat' ? 'none' : 'boat');
                          }}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-bold flex flex-col items-start transition-all cursor-pointer border ${
                            tool === 'boat'
                              ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                              : 'bg-[#0d1117] text-neutral-300 border-[#30363d] hover:border-cyan-500/60'
                          }`}
                        >
                          <span className="flex items-center gap-1 font-bold">
                            Rescue Boat
                          </span>
                          <span className="text-[9px] text-neutral-400 font-mono">
                            ₹3.5L | 3h (-35% Surge)
                          </span>
                        </button>

                        {/* Tool 3: Med-Drone */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetIntervention(cp.id, tool === 'drone' ? 'none' : 'drone');
                          }}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-bold flex flex-col items-start transition-all cursor-pointer border ${
                            tool === 'drone'
                              ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                              : 'bg-[#0d1117] text-neutral-300 border-[#30363d] hover:border-purple-500/60'
                          }`}
                        >
                          <span className="flex items-center gap-1 font-bold">
                            Med-Drone
                          </span>
                          <span className="text-[9px] text-neutral-400 font-mono">
                            ₹8L | 45m (-45% Surge)
                          </span>
                        </button>

                        {/* Tool 4: Health Booth */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetIntervention(cp.id, tool === 'booth' ? 'none' : 'booth');
                          }}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-bold flex flex-col items-start transition-all cursor-pointer border ${
                            tool === 'booth'
                              ? 'bg-teal-600 text-white border-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.4)]'
                              : 'bg-[#0d1117] text-neutral-300 border-[#30363d] hover:border-teal-500/60'
                          }`}
                        >
                          <span className="flex items-center gap-1 font-bold">
                            Field Clinic
                          </span>
                          <span className="text-[9px] text-neutral-400 font-mono">
                            ₹15L | 6h (-80% Surge)
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Selected Card Expandable Sub-Drawer */}
                  {isSelected && (
                    <div className="bg-[#0d1117] border-t border-[#30363d] p-3.5 space-y-2.5 text-xs">
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-[#161b22] p-2 rounded-lg border border-[#21262d]">
                          <span className="text-neutral-400 block text-[10px] uppercase">
                            Span Architecture
                          </span>
                          <strong className="text-white">
                            {cp.spans_count} spans • {cp.exposed_meters}m breach
                          </strong>
                        </div>
                        <div className="bg-[#161b22] p-2 rounded-lg border border-[#21262d]">
                          <span className="text-neutral-400 block text-[10px] uppercase">
                            Baseline vs Detour
                          </span>
                          <strong className="text-amber-400">
                            {cp.baseline_km}km ➔ {cp.detour_km}km (+
                            {(cp.detour_km - cp.baseline_km).toFixed(1)}km)
                          </strong>
                        </div>
                      </div>

                      {/* Trapped Settlements Details */}
                      <div>
                        <span className="text-[10px] text-neutral-400 uppercase font-semibold block mb-1">
                          Dependent Settlements ({cp.villages.length} Primary Listed):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {cp.villages.map((v) => (
                            <span
                              key={v.id}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                                toolMeta
                                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
                                  : 'bg-rose-950/70 text-rose-300 border-rose-800'
                              }`}
                            >
                              {v.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {toolMeta && (
                        <div className="p-2 rounded bg-blue-950/50 border border-blue-800/60 text-[11px] text-blue-200">
                          <strong>Active Simulation Effect:</strong> {toolMeta.desc}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Show All / Show Top 5 Toggle */}
          {chokePoints.length > 5 && (
            <button
              onClick={() => setShowAllCorridors((prev) => !prev)}
              className="w-full py-2 px-3 rounded-xl bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-xs font-semibold text-neutral-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {showAllCorridors ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-blue-400" />
                  <span>Show Top 5 Bottlenecks</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
                  <span>Show All {chokePoints.length} Bottlenecks</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Right Column (60%): Live Hero Map + Jury Simulation Scorecard Strip */}
        <div className="lg:col-span-7 space-y-3.5 sticky top-20">
          {/* Live "🎛️ Jury Simulation Scorecard" Strip Right Above The Map (Spotlight Step 3) */}
          <div
            id="tour-step-3-sandbox-scorecard"
            className={`transition-all duration-300 rounded-xl ${
              tourStep === 3
                ? 'ring-4 ring-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.7)] z-50 relative'
                : ''
            }`}
          >
            <JuryScorecard chokePoints={chokePoints} interventions={interventions} />
          </div>

          {/* Hero Map */}
          <div className="relative">
            <LeafletMap
              key={currentTheater.id}
              theaterId={currentTheater.id}
              center={[selectedChoke.lat, selectedChoke.lon]}
              zoom={currentTheater.zoom}
              height="620px"
              floodPolygon={currentTheater.floodPolygon}
              markers={mapMarkers}
              lines={mapLines}
              showLayerControls={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
