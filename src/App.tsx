import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { CommandOverview } from './components/CommandOverview';
import { TelemetryDrawer } from './components/TelemetryDrawer';
import { TourOverlay } from './components/TourOverlay';
import { LeafletMap, MapMarker, MapLine } from './components/LeafletMap';

// 4 Connected Unified Steps
import { Step1Bottlenecks } from './components/UnifiedSteps/Step1Bottlenecks';
import { Step2HospitalSurge } from './components/UnifiedSteps/Step2HospitalSurge';
import { Step3RoiRanking } from './components/UnifiedSteps/Step3RoiRanking';
import { Step4AutoOptimizer } from './components/UnifiedSteps/Step4AutoOptimizer';

// Secondary Analytical Tabs
import { PrepositioningTab } from './components/Tabs/PrepositioningTab';
import { TestcasesTab } from './components/Tabs/TestcasesTab';
import { AnalyticsTab } from './components/Tabs/AnalyticsTab';
import { MatrixTab } from './components/Tabs/MatrixTab';

import {
  SETTLEMENTS_LIGHT,
  SETTLEMENTS_HEAVY,
  STAGING_HUBS,
} from './data/disasterData';
import {
  THEATERS,
  TheaterData,
  InterventionType,
  INTERVENTION_TOOLS,
  TheaterChokePoint,
} from './data/theaters';
import { FleetMode } from './types';
import {
  ShieldAlert,
  Activity,
  TrendingUp,
  Zap,
  Anchor,
  FlaskConical,
  BarChart3,
  MapPin,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';

export function App() {
  const [fleetMode, setFleetMode] = useState<FleetMode>('Light Emergency (Ambulance/4x4)');
  const [statusFilter, setStatusFilter] = useState<string>('All Critical');
  const [activeStep, setActiveStep] = useState<string>('step1_bottlenecks');
  const [isTelemetryOpen, setIsTelemetryOpen] = useState<boolean>(false);

  // Active Disaster Theater State
  const [activeTheaterId, setActiveTheaterId] = useState<string>('silchar');
  const [customTheater, setCustomTheater] = useState<TheaterData | null>(null);

  // Multi-Tool Sandbox Interventions: chokePointId -> tool
  const [interventions, setInterventions] = useState<Record<string, InterventionType>>({});

  // Focused corridor index for zooming and trapped village display
  const [selectedChokeIdx, setSelectedChokeIdx] = useState<number>(0);

  // FTUE Walkthrough State
  const [tourStep, setTourStep] = useState<number>(() => {
    try {
      return localStorage.getItem('lifeline_tour_completed') ? 0 : 1;
    } catch {
      return 1;
    }
  });

  const handleStartTour = () => {
    setActiveStep('step1_bottlenecks');
    setTourStep(1);
  };

  const handleSkipTour = () => {
    setTourStep(0);
    try {
      localStorage.setItem('lifeline_tour_completed', 'true');
    } catch {
      // ignore
    }
  };

  const handlePrevTourStep = () => {
    if (tourStep > 1) {
      const prev = tourStep - 1;
      setTourStep(prev);
      if (prev <= 3) {
        setActiveStep('step1_bottlenecks');
      } else if (prev === 4) {
        setActiveStep('step2_surge');
      } else if (prev === 5) {
        setActiveStep('step4_optimize');
      }
    }
  };

  const handleNextTourStep = () => {
    if (tourStep === 1) {
      setActiveStep('step1_bottlenecks');
      setSelectedChokeIdx(0);
      setTourStep(2);
    } else if (tourStep === 2) {
      setTourStep(3);
    } else if (tourStep === 3) {
      const cp1 = currentTheater.chokePoints[0]?.id || 'jt_road';
      const cp2 = currentTheater.chokePoints[1]?.id || 'harinagar';
      setInterventions({
        [cp1]: 'bridge',
        [cp2]: 'drone',
      });
      setTourStep(4);
      setActiveStep('step2_surge');
    } else if (tourStep === 4) {
      setActiveStep('step4_optimize');
      setTourStep(5);
    } else if (tourStep === 5) {
      handleSkipTour();
    }
  };

  const currentTheater =
    activeTheaterId === 'custom' && customTheater
      ? customTheater
      : THEATERS[activeTheaterId] || THEATERS.silchar;

  const isHeavy = fleetMode === 'Heavy Supply (Truck/Bus)';

  // Actual filtering of settlements based on statusFilter (Requirement 4)
  const filteredSettlements = useMemo(() => {
    let list = isHeavy ? SETTLEMENTS_HEAVY : SETTLEMENTS_LIGHT;

    if (statusFilter === 'Isolated Only') {
      return list.filter((s) => s.modeled_status === 'MODEL_ISOLATED');
    }
    if (statusFilter.includes('Severe Detour') || statusFilter.includes('>10km')) {
      return list.filter((s) => (s.additional_km || 0) > 10 || (s.detour_ratio || 0) > 3);
    }
    return list;
  }, [isHeavy, statusFilter]);

  const handleSetIntervention = (chokePointId: string, tool: InterventionType) => {
    setInterventions((prev) => ({
      ...prev,
      [chokePointId]: tool,
    }));
  };

  const handleResetInterventions = () => {
    setInterventions({});
  };

  // Active interventions analysis for the shared context bar
  const activeEntries = Object.entries(interventions).filter(
    ([, tool]) => tool && tool !== 'none'
  );
  const activeCount = activeEntries.length;

  let totalBudgetLakhs = 0;
  activeEntries.forEach(([, tool]) => {
    if (tool !== 'none') {
      totalBudgetLakhs += INTERVENTION_TOOLS[tool].costInLakhs;
    }
  });

  const budgetDisplay =
    totalBudgetLakhs >= 100
      ? `₹${(totalBudgetLakhs / 100).toFixed(2)} Cr`
      : `₹${totalBudgetLakhs.toFixed(1)} L`;

  // Selected choke point object
  const validIdx = Math.min(selectedChokeIdx, Math.max(0, currentTheater.chokePoints.length - 1));
  const selectedChoke: TheaterChokePoint = currentTheater.chokePoints[validIdx] || currentTheater.chokePoints[0];
  const activeSelectedTool = interventions[selectedChoke.id] || 'none';

  // Master Map Center & Zoom: Focus on selected choke point or theater center
  const mapCenter: [number, number] = useMemo(() => {
    if (selectedChoke && activeStep === 'step1_bottlenecks') {
      return [selectedChoke.lat, selectedChoke.lon];
    }
    return currentTheater.center;
  }, [selectedChoke, activeStep, currentTheater.center]);

  const mapZoom = useMemo(() => {
    if (activeStep === 'step1_bottlenecks' && selectedChoke) {
      return 12;
    }
    return currentTheater.zoom;
  }, [activeStep, selectedChoke, currentTheater.zoom]);

  // Unified Master Map Markers Computation across all steps
  const masterMapMarkers: MapMarker[] = useMemo(() => {
    const list: MapMarker[] = [];

    // 1. Choke points (all of them)
    currentTheater.chokePoints.forEach((cp, idx) => {
      const tool = interventions[cp.id] || 'none';
      const isSelected = idx === validIdx && activeStep === 'step1_bottlenecks';
      const meta = tool !== 'none' ? INTERVENTION_TOOLS[tool] : null;

      let markerType: MapMarker['type'] = 'chokepoint';
      let badge = `RANK #${cp.rank} • ${cp.trapped_villages_count} CUT`;

      if (meta) {
        markerType = tool as any;
        badge = meta.statusBadge;
      }

      list.push({
        lat: cp.lat,
        lon: cp.lon,
        title: cp.road_name,
        description: `${cp.exposed_meters}m breach • Baseline ${cp.baseline_km}km vs Detour ${cp.detour_km}km • ${
          meta ? meta.desc : `Traps ${cp.trapped_villages_count} settlements.`
        }`,
        type: markerType,
        badge: isSelected ? `[FOCUS] ${badge}` : badge,
      });
    });

    // 2. Trapped villages for the selected choke point
    if (selectedChoke && selectedChoke.villages) {
      selectedChoke.villages.forEach((village) => {
        let pinType: MapMarker['type'] = 'isolated';
        let badgeText = 'TRAPPED (NO EGRESS)';

        if (activeSelectedTool === 'bridge') {
          pinType = 'reachable';
          badgeText = 'RECONNECTED (BAILEY SPAN)';
        } else if (activeSelectedTool === 'booth') {
          pinType = 'booth';
          badgeText = 'TRIAGED (HEALTH BOOTH)';
        } else if (activeSelectedTool === 'drone') {
          pinType = 'drone';
          badgeText = 'SUPPLIED (MED-DRONE)';
        } else if (activeSelectedTool === 'boat') {
          pinType = 'boat';
          badgeText = 'EVACUATING (RESCUE BOAT)';
        }

        list.push({
          lat: village.lat,
          lon: village.lon,
          title: village.name,
          description: `Pop: ${village.population?.toLocaleString() || '2,400'} • Dependent on ${selectedChoke.road_name}`,
          type: pinType,
          badge: badgeText,
        });
      });
    }

    // 3. Hospital Facilities with Live Surge calculation
    currentTheater.hospitals.forEach((hosp, idx) => {
      let liveSurge = hosp.baseline_surge;
      let badge = hosp.type === 'starved' ? '15% BLOCKED' : `SURGE +${liveSurge}%`;

      if (idx === 0) {
        if (activeSelectedTool === 'booth') {
          liveSurge = 114;
          badge = 'SURGE 114% STABLE GREEN';
        } else if (activeSelectedTool === 'bridge') {
          liveSurge = 118;
          badge = 'SURGE 118% STABLE';
        } else if (activeSelectedTool === 'drone') {
          liveSurge = Math.round(hosp.baseline_surge * (1 - 0.45));
          badge = `SURGE +${liveSurge}% (-45% RELIEF)`;
        } else if (activeSelectedTool === 'boat') {
          liveSurge = Math.round(hosp.baseline_surge * (1 - 0.35));
          badge = `SURGE +${liveSurge}% (-35% RELIEF)`;
        }
      }

      if (hosp.type === 'starved' && activeSelectedTool === 'bridge') {
        badge = '100% ACCESS RESTORED';
      }

      list.push({
        lat: hosp.lat,
        lon: hosp.lon,
        title: hosp.name,
        description: `${hosp.beds} certified beds • Active catchment intake load: ${liveSurge}%`,
        type: 'facility',
        badge,
      });
    });

    // 4. Staging Hubs (if in Prepositioning view)
    if (activeStep === 'prepositioning') {
      const hubs = currentTheater.stagingHubs || STAGING_HUBS;
      hubs.forEach((h) => {
        list.push({
          lat: h.lat,
          lon: h.lon,
          title: h.hub_name,
          description: `Serving ${h.assigned_settlements_count} habitations • ${h.recommended_relief_assets}`,
          type: 'hub',
          badge: h.hub_tier,
        });
      });
    }

    return list;
  }, [currentTheater, interventions, validIdx, selectedChoke, activeSelectedTool, activeStep]);

  // Master Map Lines & Corridors Computation
  const masterMapLines: MapLine[] = useMemo(() => {
    const list: MapLine[] = [];
    if (!selectedChoke) return list;

    const spanHalfLen = 0.0022;

    // Normal baseline route (Solid Green)
    list.push({
      id: 'baseline_normal_route',
      points: [
        [selectedChoke.lat + 0.012, selectedChoke.lon + 0.018],
        [selectedChoke.lat, selectedChoke.lon],
        [selectedChoke.lat - 0.015, selectedChoke.lon - 0.022],
      ],
      color: '#00FF66',
      weight: activeSelectedTool === 'bridge' ? 7 : 4,
      label:
        activeSelectedTool === 'bridge'
          ? `🟢 REOPENED CORRIDOR: Baseline ${selectedChoke.baseline_km} km Restored`
          : `🟢 Normal Pre-Flood Route: ${selectedChoke.baseline_km} km (Blocked by Water)`,
      layerType: 'baseline',
    });

    // Forced detour route (Dashed Red)
    list.push({
      id: 'forced_detour_route',
      points: [
        [selectedChoke.lat + 0.012, selectedChoke.lon + 0.018],
        [selectedChoke.lat + 0.025, selectedChoke.lon + 0.035],
        [selectedChoke.lat + 0.018, selectedChoke.lon - 0.005],
        [selectedChoke.lat - 0.015, selectedChoke.lon - 0.022],
      ],
      color: '#ff3300',
      dashArray: '7, 8',
      weight: 4,
      label: `🔴 Forced Flood Detour: ${selectedChoke.detour_km} km (+${(
        selectedChoke.detour_km - selectedChoke.baseline_km
      ).toFixed(1)} km Surcharge)`,
      layerType: 'detour',
    });

    // Deployed tool special lines
    if (activeSelectedTool === 'bridge') {
      list.push({
        id: 'bailey_hardened_span',
        points: [
          [selectedChoke.lat - spanHalfLen, selectedChoke.lon - spanHalfLen],
          [selectedChoke.lat + spanHalfLen, selectedChoke.lon + spanHalfLen],
        ],
        color: '#10b981',
        weight: 9,
        label: `🛠️ DEPLOYED BAILEY BRIDGE: ${selectedChoke.road_name} (Class-40 16T Truck Capable)`,
        layerType: 'baseline',
      });
    } else if (activeSelectedTool === 'boat') {
      list.push({
        id: 'boat_water_ferry',
        points: [
          [selectedChoke.lat - spanHalfLen * 2, selectedChoke.lon - spanHalfLen * 2],
          [selectedChoke.lat + spanHalfLen * 2, selectedChoke.lon + spanHalfLen * 2],
        ],
        color: '#06b6d4',
        dashArray: '6, 6',
        weight: 5,
        label: `🚤 WATER FERRY ROUTE: Zodiac Emergency Evacuation (3h turnaround)`,
        layerType: 'boat',
      });
    } else if (activeSelectedTool === 'drone') {
      const nearestHosp =
        currentTheater.hospitals.find((h) => h.id === selectedChoke.nearest_hospital_id) ||
        currentTheater.hospitals[0];

      if (nearestHosp) {
        list.push({
          id: 'drone_air_corridor',
          points: [
            [nearestHosp.lat, nearestHosp.lon],
            [selectedChoke.lat, selectedChoke.lon],
          ],
          color: '#a855f7',
          weight: 4,
          dashArray: '4, 4',
          label: `🚁 MED-DRONE AIR CORRIDOR: Direct Hospital Supply line (45m delivery)`,
          layerType: 'drone',
        });
      }
    } else {
      // Severed breach span
      list.push({
        id: 'severed_breach_span',
        points: [
          [selectedChoke.lat - spanHalfLen, selectedChoke.lon - spanHalfLen],
          [selectedChoke.lat + spanHalfLen, selectedChoke.lon + spanHalfLen],
        ],
        color: '#ff1100',
        weight: 7,
        label: `⚡ EXACT BREACH SPAN: ${selectedChoke.road_name} (${selectedChoke.exposed_meters}m Exposed)`,
        className: 'severed-span-anim',
        layerType: 'severed',
      });
    }

    // Catchment lines to trapped villages
    if (selectedChoke.villages) {
      const toolMeta = activeSelectedTool !== 'none' ? INTERVENTION_TOOLS[activeSelectedTool] : null;
      selectedChoke.villages.forEach((village) => {
        list.push({
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
    }

    return list;
  }, [selectedChoke, activeSelectedTool, currentTheater.hospitals]);

  // Core 4 Connected Steps List
  const coreSteps = [
    {
      id: 'step1_bottlenecks',
      stepNum: 'Step 1',
      label: '🛣️ Bottlenecks & 4-Tool Sandbox',
      icon: ShieldAlert,
    },
    {
      id: 'step2_surge',
      stepNum: 'Step 2',
      label: '🏥 Hospital Surge & Triage',
      icon: Activity,
    },
    {
      id: 'step3_roi',
      stepNum: 'Step 3',
      label: '📈 Multi-Tool ROI Ranking',
      icon: TrendingUp,
    },
    {
      id: 'step4_optimize',
      stepNum: 'Step 4',
      label: '⚡ Requisition & DM Sanction',
      icon: Zap,
    },
  ];

  const secondaryTabs = [
    { id: 'prepositioning', label: '⚓ Pre-Positioning Hubs', icon: Anchor },
    { id: 'testcases', label: '🧪 Ground-Truth Tests', icon: FlaskConical },
    { id: 'analytics', label: '📈 Network Analytics', icon: BarChart3 },
    { id: 'matrix', label: `📍 Habitat Registry (${filteredSettlements.length})`, icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex flex-col font-sans">
      {/* Top Header with Live Nominatim Autocomplete Dropdown */}
      <Header
        fleetMode={fleetMode}
        onFleetChange={setFleetMode}
        statusFilter={statusFilter}
        onFilterChange={setStatusFilter}
        onOpenTelemetry={() => setIsTelemetryOpen(true)}
        activeTheaterId={activeTheaterId}
        onSelectTheater={(id) => {
          setActiveTheaterId(id);
          setInterventions({});
          setSelectedChokeIdx(0);
        }}
        customTheater={customTheater}
        onLoadCustomTheater={(th) => {
          setCustomTheater(th);
          setActiveTheaterId('custom');
          setInterventions({});
          setSelectedChokeIdx(0);
        }}
        tourStep={tourStep}
        onStartTour={handleStartTour}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 lg:px-6 py-3 space-y-3">
        {/* Top Operational Overview & High-Contrast KPI Cards */}
        <CommandOverview
          currentTheater={currentTheater}
          interventions={interventions}
          fleetMode={fleetMode}
          onFleetChange={setFleetMode}
        />

        {/* SINGLE UNIFIED LAYOUT: Left 42% Connected Steps + Right 58% Persistent Master Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
          {/* LEFT COLUMN (42%): Connected Context & Step Controller */}
          <div className="lg:col-span-5 space-y-3 max-h-[calc(100vh-140px)] overflow-y-auto pr-1">
            {/* 🔗 Persistent Active Simulation Context Bar */}
            <div className="bg-[#161b22] border border-blue-500/40 rounded-xl p-2.5 shadow-md flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="font-bold text-white flex items-center gap-1.5 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  🔗 Active Context:
                </span>
                <span className="truncate text-neutral-300 font-mono text-[11px]">
                  {currentTheater.name.split(',')[0]} • {isHeavy ? '16T Truck' : '4x4 Ambulance'} •{' '}
                  <strong className="text-emerald-400">{activeCount} Fixes</strong> •{' '}
                  <strong className="text-amber-400">{budgetDisplay}</strong>
                </span>
              </div>
              <button
                onClick={handleResetInterventions}
                disabled={activeCount === 0}
                className="text-[10px] font-mono text-neutral-400 hover:text-white underline cursor-pointer disabled:opacity-40 shrink-0 ml-1"
              >
                Clear
              </button>
            </div>

            {/* 4 Connected Step Tabs Pill Selector */}
            <div className="bg-[#161b22] p-1.5 rounded-xl border border-[#30363d] shadow-sm">
              <div className="grid grid-cols-2 gap-1.5">
                {coreSteps.map((s) => {
                  const Icon = s.icon;
                  const isActive = activeStep === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveStep(s.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-left ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 ring-1 ring-blue-400'
                          : 'bg-[#0d1117] text-[#8b949e] hover:text-white hover:bg-[#21262d] border border-[#21262d]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <div className="truncate">
                        <span className="text-[9px] block opacity-80 uppercase font-mono">{s.stepNum}</span>
                        <span className="truncate block">{s.label.split(' ')[1]}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Secondary Reference Tabs */}
              <div className="flex items-center gap-1 pt-2 mt-2 border-t border-[#21262d] overflow-x-auto scrollbar-none text-[10px]">
                <span className="text-neutral-500 font-mono uppercase px-1">Deep Dives:</span>
                {secondaryTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeStep === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveStep(tab.id)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#21262d] text-white border border-neutral-500 font-bold'
                          : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#21262d]'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{tab.label.split(' ')[1]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Step Panel Render */}
            <div className="space-y-3">
              {activeStep === 'step1_bottlenecks' && (
                <Step1Bottlenecks
                  currentTheater={currentTheater}
                  interventions={interventions}
                  onSetIntervention={handleSetIntervention}
                  onResetInterventions={handleResetInterventions}
                  selectedChokeIdx={validIdx}
                  onSelectChokeIdx={setSelectedChokeIdx}
                  fleetMode={fleetMode}
                />
              )}

              {activeStep === 'step2_surge' && (
                <Step2HospitalSurge
                  currentTheater={currentTheater}
                  interventions={interventions}
                  onGoToStep1={() => setActiveStep('step1_bottlenecks')}
                />
              )}

              {activeStep === 'step3_roi' && (
                <Step3RoiRanking
                  currentTheater={currentTheater}
                  onDeployTool={handleSetIntervention}
                  activeInterventions={interventions}
                  onAdvanceToStep4={() => setActiveStep('step4_optimize')}
                />
              )}

              {activeStep === 'step4_optimize' && (
                <Step4AutoOptimizer
                  currentTheater={currentTheater}
                  fleetMode={fleetMode}
                  onApplyFleetInterventions={(newInterventions) => {
                    setInterventions(newInterventions);
                  }}
                  activeInterventions={interventions}
                />
              )}

              {/* Secondary Tabs */}
              {activeStep === 'prepositioning' && (
                <PrepositioningTab currentTheater={currentTheater} />
              )}
              {activeStep === 'testcases' && <TestcasesTab />}
              {activeStep === 'analytics' && <AnalyticsTab settlements={filteredSettlements} />}
              {activeStep === 'matrix' && <MatrixTab settlements={filteredSettlements} />}
            </div>
          </div>

          {/* RIGHT COLUMN (58%): Persistent Unified Master Map */}
          <div className="lg:col-span-7 sticky top-20 z-10 space-y-2">
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden">
              {/* Map Title Bar */}
              <div className="px-3.5 py-2 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#00e676]" />
                  <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                    Unified Master Map ({currentTheater.name.split('(')[0].trim()})
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161b22] text-cyan-400 border border-[#30363d]">
                    Live Synced
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
                  <span>{activeCount} Active Fixes</span>
                  <span>•</span>
                  <span>{currentTheater.nodesCount}</span>
                </div>
              </div>

              {/* Persistent Leaflet Map Element */}
              <LeafletMap
                theaterId={currentTheater.id}
                center={mapCenter}
                zoom={mapZoom}
                height="640px"
                floodGeoJsonUrl={currentTheater.id === 'silchar' ? '/flood_cleaned.geojson' : undefined}
                floodPolygon={currentTheater.floodPolygon}
                markers={masterMapMarkers}
                lines={masterMapLines}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Interactive Tour Spotlight Overlay */}
      <TourOverlay
        tourStep={tourStep}
        onNextStep={handleNextTourStep}
        onPrevStep={handlePrevTourStep}
        onSkipTour={handleSkipTour}
      />

      {/* Telemetry Drawer */}
      <TelemetryDrawer
        isOpen={isTelemetryOpen}
        onClose={() => setIsTelemetryOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-[#30363d] bg-[#161b22] py-3 text-center text-xs text-[#8b949e]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>🚨 Lifeline OS: Autonomous Civil Defense &amp; Counterfactual Logistics Compiler</span>
          <div className="flex items-center gap-2 text-[11px]">
            <button
              onClick={() => setIsTelemetryOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 underline font-mono cursor-pointer"
            >
              Engine Telemetry ({currentTheater.nodesCount})
            </button>
            <span>•</span>
            <span>{currentTheater.authorityName}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
