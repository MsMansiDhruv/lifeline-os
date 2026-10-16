import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { TelemetryDrawer } from './components/TelemetryDrawer';
import { InteractiveTourCoach } from './components/InteractiveTourCoach';
import { AutoDemoPlayer } from './components/AutoDemoPlayer';
import { LeafletMap, MapMarker, MapLine, CameraCommand } from './components/LeafletMap';

// 4 Distinct SEOC Operational Steps
import { Step1WhatBroke } from './components/UnifiedSteps/Step1WhatBroke';
import { Step2WhoIsAtRisk } from './components/UnifiedSteps/Step2WhoIsAtRisk';
import { Step3TestFixes } from './components/UnifiedSteps/Step3TestFixes';
import { Step4EditLaunchRescue } from './components/UnifiedSteps/Step4EditLaunchRescue';

import {
  SETTLEMENTS_LIGHT,
  SETTLEMENTS_HEAVY,
} from './data/disasterData';
import {
  THEATERS,
  TheaterData,
  InterventionType,
  INTERVENTION_TOOLS,
  TheaterChokePoint,
} from './data/theaters';
import { getOsrmRoute } from './services/osrmRouting';
import { FleetMode } from './types';
import {
  ShieldAlert,
  Activity,
  Sliders,
  FileCheck,
  ChevronLeft,
  Maximize2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export function App() {
  const [fleetMode, setFleetMode] = useState<FleetMode>('Light Emergency (Ambulance/4x4)');
  const [statusFilter, setStatusFilter] = useState<string>('All Critical');
  const [activeStep, setActiveStep] = useState<string>('step1_what_broke');
  const [isTelemetryOpen, setIsTelemetryOpen] = useState<boolean>(false);
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState<boolean>(false);

  // River Flood Level (1: +1.5m Warning, 2: +3.0m Bank Overtop, 3: +4.5m Severe Basin Surge)
  const [floodStage, setFloodStage] = useState<number>(2);

  // Step 2 Hospital Surge Actions
  const [rerouteAmbulances, setRerouteAmbulances] = useState<boolean>(false);
  const [activateSurgeBeds, setActivateSurgeBeds] = useState<boolean>(false);

  // Step 4 Official Live Dispatch State
  const [isLiveDispatched, setIsLiveDispatched] = useState<boolean>(false);

  // Left SEOC Drawer Dynamic Width & Drag State (380px to 640px)
  const [panelWidth, setPanelWidth] = useState<number>(440);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Strict Map Camera Commands & Pulsing Target
  const [cameraCommand, setCameraCommand] = useState<CameraCommand | null>(null);
  const [pulsingTarget, setPulsingTarget] = useState<[number, number] | null>(null);

  // Active Disaster Theater State
  const [activeTheaterId, setActiveTheaterId] = useState<string>('silchar');
  const [customTheater, setCustomTheater] = useState<TheaterData | null>(null);

  // Multi-Tool Sandbox Interventions: chokePointId -> tool
  const [interventions, setInterventions] = useState<Record<string, InterventionType>>({});

  // Focused corridor index for zooming and route display
  const [selectedChokeIdx, setSelectedChokeIdx] = useState<number>(0);

  // Real OSRM driving routes state
  const [normalRoutePoints, setNormalRoutePoints] = useState<[number, number][]>([]);
  const [detourRoutePoints, setDetourRoutePoints] = useState<[number, number][]>([]);

  // Tour & Presentation States
  const [tourMode, setTourMode] = useState<'none' | 'interactive' | 'autodemo'>('none');
  const [interactiveTask, setInteractiveTask] = useState<number>(1);
  const [autoDemoSceneIdx, setAutoDemoSceneIdx] = useState<number>(0);
  const [opsMode, setOpsMode] = useState<'day' | 'night'>('day');

  // Drag-to-Resize Mouse Events Handler (380px to 640px)
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(380, Math.min(640, e.clientX - 16));
      setPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const currentTheater =
    activeTheaterId === 'custom' && customTheater
      ? customTheater
      : THEATERS[activeTheaterId] || THEATERS.silchar;

  const isHeavy = fleetMode.includes('Heavy') || fleetMode.includes('16T');

  // Master Map Center & Zoom
  const mapCenter: [number, number] = useMemo(() => {
    return currentTheater.center;
  }, [currentTheater.center]);

  const mapZoom = useMemo(() => {
    return currentTheater.zoom;
  }, [currentTheater.zoom]);

  // Overview Camera Handler (Zoom 12)
  const handleResetOverview = () => {
    setCameraCommand({
      id: `cmd_overview_${Date.now()}`,
      type: 'overview',
      center: currentTheater.center,
      zoom: 12,
      duration: 1.1,
    });
  };

  // Zoom In when Clicking a Corridor Card (frames origin village, breach, and target hospital)
  const triggerCorridorFocus = (idx: number) => {
    setSelectedChokeIdx(idx);
    const cp = currentTheater.chokePoints[idx];
    if (!cp) return;

    const originVillage = cp.villages?.[0] || {
      lat: cp.lat + 0.014,
      lon: cp.lon + 0.012,
    };
    const nearestHosp =
      currentTheater.hospitals.find((h) => h.id === cp.nearest_hospital_id) ||
      currentTheater.hospitals[0];

    const lats = [originVillage.lat, cp.lat, nearestHosp ? nearestHosp.lat : cp.lat];
    const lons = [originVillage.lon, cp.lon, nearestHosp ? nearestHosp.lon : cp.lon];

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    setPulsingTarget([cp.lat, cp.lon]);
    setCameraCommand({
      id: `cmd_corridor_${cp.id}_${Date.now()}`,
      type: 'bounds',
      bounds: [
        [minLat, minLon],
        [maxLat, maxLon],
      ],
      paddingLeft: panelWidth + 50,
      zoom: 14,
      duration: 1.1,
    });
  };

  // Zoom in on Specific Hospital or Coordinate
  const triggerPointFocus = (coords: { lat: number; lon: number; name?: string }) => {
    setPulsingTarget([coords.lat, coords.lon]);
    setCameraCommand({
      id: `cmd_point_${Date.now()}`,
      type: 'point',
      center: [coords.lat, coords.lon],
      zoom: 15,
      paddingLeft: panelWidth + 50,
      duration: 0.9,
    });
  };

  // Guided Tour handlers
  const handleStartInteractiveTour = () => {
    setTourMode('interactive');
    setInteractiveTask(1);
    setActiveStep('step1_what_broke');
    setIsDrawerCollapsed(false);
    setInterventions({});
    setRerouteAmbulances(false);
    setActivateSurgeBeds(false);
    setIsLiveDispatched(false);
    setFleetMode('Light Emergency (Ambulance/4x4)');
    triggerCorridorFocus(0);
  };

  const handleStartAutoDemo = () => {
    setTourMode('autodemo');
    setAutoDemoSceneIdx(0);
    setActiveStep('step1_what_broke');
    setIsDrawerCollapsed(false);
    setInterventions({});
    setRerouteAmbulances(false);
    setActivateSurgeBeds(false);
    setIsLiveDispatched(false);
  };

  const handleNextInteractiveTask = () => {
    if (interactiveTask === 1) {
      setActiveStep('step2_who_is_at_risk');
      setInteractiveTask(2);
    } else if (interactiveTask === 2) {
      setActiveStep('step3_test_fixes');
      setRerouteAmbulances(true);
      setInteractiveTask(3);
    } else if (interactiveTask === 3) {
      setActiveStep('step4_edit_launch');
      setInterventions({ jt_road: 'bridge', harinagar: 'booth', korkoli_causeway: 'boat', borkhola_link: 'drone' });
      setInteractiveTask(4);
    } else if (interactiveTask === 4) {
      setIsLiveDispatched(true);
      setInteractiveTask(5);
    }
  };

  const handlePrevInteractiveTask = () => {
    if (interactiveTask === 2) {
      setActiveStep('step1_what_broke');
      setInteractiveTask(1);
    } else if (interactiveTask === 3) {
      setActiveStep('step2_who_is_at_risk');
      setInteractiveTask(2);
    } else if (interactiveTask === 4) {
      setActiveStep('step3_test_fixes');
      setInteractiveTask(3);
    }
  };

  // Auto-Demo Automated Timeline Choreography
  useEffect(() => {
    if (tourMode !== 'autodemo') return;

    if (autoDemoSceneIdx === 0) {
      // Scene 1: Step 1
      setActiveStep('step1_what_broke');
      setFleetMode('Heavy Supply (Truck/Bus)');
      triggerCorridorFocus(0);
    } else if (autoDemoSceneIdx === 1) {
      // Scene 2: Step 2
      setActiveStep('step2_who_is_at_risk');
      setRerouteAmbulances(true);
      setActivateSurgeBeds(true);
    } else if (autoDemoSceneIdx === 2) {
      // Scene 3: Step 3
      setActiveStep('step3_test_fixes');
      setInterventions({ jt_road: 'bridge', harinagar: 'booth', korkoli_causeway: 'boat', borkhola_link: 'drone' });
      triggerCorridorFocus(0);
    } else if (autoDemoSceneIdx === 3) {
      // Scene 4: Step 4
      setActiveStep('step4_edit_launch');
      setIsLiveDispatched(true);
      handleResetOverview();
    }
  }, [tourMode, autoDemoSceneIdx]);

  // Selected choke point object
  const validIdx = Math.min(selectedChokeIdx, Math.max(0, currentTheater.chokePoints.length - 1));
  const selectedChoke: TheaterChokePoint = currentTheater.chokePoints[validIdx] || currentTheater.chokePoints[0];
  const activeSelectedTool = interventions[selectedChoke?.id || ''] || 'none';

  // Target Destination Hospital for selected corridor
  const destHospital = useMemo(() => {
    if (!selectedChoke) return currentTheater.hospitals[0];
    const match = currentTheater.hospitals.find((h) => h.id === selectedChoke.nearest_hospital_id);
    if (match) return match;
    if (selectedChoke.id === 'jt_road' || selectedChoke.id === 'harinagar') {
      return currentTheater.hospitals.find((h) => h.id === 'valley') || currentTheater.hospitals[1];
    }
    if (selectedChoke.id === 'korkoli_causeway') {
      return currentTheater.hospitals.find((h) => h.id === 'south_city') || currentTheater.hospitals[3];
    }
    return currentTheater.hospitals[0];
  }, [selectedChoke, currentTheater.hospitals]);

  // Real driving routes from OSRM & Pre-Cached Vectors
  useEffect(() => {
    if (!selectedChoke) return;

    const originVillage = selectedChoke.villages?.[0] || {
      id: 'v_orig',
      name: `${selectedChoke.road_name} Habitation`,
      lat: selectedChoke.lat + 0.014,
      lon: selectedChoke.lon + 0.012,
    };

    const targetHospCoords: [number, number] = destHospital
      ? [destHospital.lat, destHospital.lon]
      : [selectedChoke.lat, selectedChoke.lon];

    const isSilchar = currentTheater.id === 'silchar';

    const baselineCacheId =
      isSilchar && selectedChoke.id === 'jt_road'
        ? 'silchar_jt_road_baseline'
        : isSilchar && selectedChoke.id === 'harinagar'
        ? 'silchar_harinagar_baseline'
        : isSilchar && selectedChoke.id === 'korkoli_causeway'
        ? 'silchar_korkoli_causeway_baseline'
        : isSilchar && selectedChoke.id === 'borkhola_link'
        ? 'silchar_borkhola_link_baseline'
        : undefined;

    const detourCacheId =
      isSilchar && selectedChoke.id === 'jt_road'
        ? 'silchar_jt_road_detour'
        : isSilchar && selectedChoke.id === 'harinagar'
        ? 'silchar_harinagar_detour'
        : isSilchar && selectedChoke.id === 'korkoli_causeway'
        ? 'silchar_korkoli_causeway_detour'
        : isSilchar && selectedChoke.id === 'borkhola_link'
        ? 'silchar_borkhola_link_detour'
        : undefined;

    // 1. Normal route: Village through bridge all the way to target hospital
    getOsrmRoute([originVillage.lat, originVillage.lon], targetHospCoords, {
      cacheId: baselineCacheId,
      detourCurvature: 0.004,
    }).then((pts) => {
      setNormalRoutePoints(pts);
    });

    // 2. Emergency Detour route: Village around flood basin
    if (destHospital) {
      getOsrmRoute([originVillage.lat, originVillage.lon], [destHospital.lat, destHospital.lon], {
        cacheId: detourCacheId,
        detourCurvature: 0.014,
      }).then((pts) => {
        setDetourRoutePoints(pts);
      });
    }
  }, [selectedChoke?.id, currentTheater.id, destHospital]);

  // REQUIREMENT 2.3: CLEAN UBER / GOOGLE MAPS PIN CALLOUTS (SHOW ONLY FOR 1 SELECTED CORRIDOR!)
  const masterMapMarkers: MapMarker[] = useMemo(() => {
    const list: MapMarker[] = [];
    if (!selectedChoke) return list;

    // 1. Choke points: Unselected corridors are clean quiet dots!
    currentTheater.chokePoints.forEach((cp, idx) => {
      const isSelected = idx === validIdx;
      const tool = interventions[cp.id] || 'none';

      if (!isSelected) {
        list.push({
          lat: cp.lat,
          lon: cp.lon,
          title: `#${cp.rank}: ${cp.road_name} (${cp.trapped_villages_count} Villages)`,
          type: 'chokepoint',
          isQuietDot: true,
          quietDotColor: tool !== 'none' ? '#10b981' : '#f43f5e',
          onClick: () => setSelectedChokeIdx(idx),
        });
        return;
      }

      // 1 SELECTED CORRIDOR: Pin ! (Road Breach / Fix Pill)
      const shortRoad = cp.id === 'jt_road' ? 'JT Road' : cp.road_name.split(' (')[0].replace(' Corridor', '').replace(' Breach', '');
      let bannerText = `⛔ ${shortRoad} Bridge Submerged • ${cp.exposed_meters}m Gap`;

      if (tool === 'bridge') {
        bannerText = `🛠️ ${shortRoad}: Bailey Bridge Active (16T Ready)`;
      } else if (tool === 'booth') {
        bannerText = `⛺ ${shortRoad}: Field Clinic Active at Roadhead`;
      } else if (tool === 'drone') {
        bannerText = `🚁 ${shortRoad}: UAV Medical Airbridge Active`;
      } else if (tool === 'boat') {
        bannerText = `🚤 ${shortRoad}: Tactical Zodiac Ferry Active`;
      }

      list.push({
        lat: cp.lat,
        lon: cp.lon,
        title: cp.road_name,
        type: tool !== 'none' ? tool : 'chokepoint',
        customBanner: bannerText,
        stepCategory: 'choke',
      });
    });

    // 2. 1 SELECTED CORRIDOR: Pin A (Origin Village)
    const originVillage = selectedChoke.villages?.[0] || {
      id: 'v_orig',
      name: `${selectedChoke.road_name.split(' ')[0]} Villages`,
      lat: selectedChoke.lat + 0.014,
      lon: selectedChoke.lon + 0.012,
    };
    const villageShortName = originVillage.name.split(' ')[0];

    list.push({
      lat: originVillage.lat,
      lon: originVillage.lon,
      title: originVillage.name,
      type: 'isolated',
      customBanner: `● Origin: ${villageShortName} (${selectedChoke.trapped_villages_count} Villages)`,
      stepCategory: 'start',
    });

    // 3. 1 SELECTED CORRIDOR: Pin B (Destination Hospital)
    currentTheater.hospitals.forEach((hosp) => {
      const isDest = hosp.id === destHospital?.id;
      if (!isDest) {
        list.push({
          lat: hosp.lat,
          lon: hosp.lon,
          title: hosp.name,
          type: 'facility',
          isQuietDot: true,
          quietDotColor: '#38bdf8',
        });
        return;
      }

      const isDirectRestored = activeSelectedTool === 'bridge';
      const hospShortName = hosp.name.split(' ')[0];
      const destBanner = isDirectRestored
        ? `🏥 ${hospShortName} Hospital • 14 min Direct Route Restored`
        : `🏥 ${hospShortName} Hospital • 65 min Detour (vs 14 min Direct)`;

      list.push({
        lat: hosp.lat,
        lon: hosp.lon,
        title: hosp.name,
        type: 'facility',
        customBanner: destBanner,
        stepCategory: 'dest',
      });
    });

    return list;
  }, [currentTheater, interventions, validIdx, selectedChoke, activeSelectedTool, destHospital]);

  // Master Map Lines (Winding Roads with Dark Casing underneath)
  const masterMapLines: MapLine[] = useMemo(() => {
    const list: MapLine[] = [];
    if (!selectedChoke) return list;

    // 1. Primary Route (Village to Hospital)
    // Colored Solid Emerald (#10b981) up to breach, turning Solid Red (#ef4444) across submerged bridge.
    // When bridge is allocated, entire winding road turns Solid Emerald (#10b981)!
    if (normalRoutePoints.length > 1) {
      list.push({
        id: 'primary_navigation_route',
        points: normalRoutePoints,
        color: activeSelectedTool === 'bridge' ? '#10b981' : '#10b981',
        weight: 5,
        label:
          activeSelectedTool === 'bridge'
            ? `BAILEY BRIDGE ACTIVE: Full Highway Access Restored (${selectedChoke.baseline_km} km direct)`
            : `Primary Road Route: ${selectedChoke.baseline_km} km (Blocked at Bridge Breach)`,
        layerType: 'baseline',
      });
    }

    // 2. Emergency Detour Route (Amber/Red #f59e0b, dashArray: '10, 8')
    if (detourRoutePoints.length > 1 && activeSelectedTool !== 'bridge') {
      list.push({
        id: 'emergency_detour_route',
        points: detourRoutePoints,
        color: '#f59e0b',
        dashArray: '10, 8',
        weight: 5,
        label: `Emergency Flood Detour: ${selectedChoke.detour_km} km to Backup Hospital (+${(
          selectedChoke.detour_km - selectedChoke.baseline_km
        ).toFixed(1)} km Surcharge)`,
        layerType: 'detour',
      });
    }

    // 3. Ambulance Diversion Route to SMCH Regional (when toggled in Step 2)
    if (rerouteAmbulances) {
      list.push({
        id: 'ambulance_diversion_corridor',
        points: [
          [24.812, 92.791], // Valley Hospital
          [24.804, 92.792],
          [24.792, 92.794],
          [24.776, 92.795], // SMCH Regional
        ],
        color: '#0284c7',
        dashArray: '6, 6',
        weight: 5,
        label: '🚑 AMBULANCE DIVERSION ROUTE: Transferring Overload to SMCH Regional (68% Safe)',
        layerType: 'diversion',
      });
    }

    return list;
  }, [selectedChoke, activeSelectedTool, normalRoutePoints, detourRoutePoints, rerouteAmbulances]);

  // 4 Distinct Operational Steps definition
  const coreSteps = [
    {
      id: 'step1_what_broke',
      label: '1. Road Cut-Offs',
      desc: 'Diagnose Network & Flood Level',
      icon: ShieldAlert,
    },
    {
      id: 'step2_who_is_at_risk',
      label: '2. Hospital Surge',
      desc: 'Clinical Load Balancing',
      icon: Activity,
    },
    {
      id: 'step3_test_fixes',
      label: '3. Resource Allocation',
      desc: 'Warehouse Stock Caps',
      icon: Sliders,
    },
    {
      id: 'step4_edit_launch',
      label: '4. Official Dispatch',
      desc: 'SDRF Sign-Off & Fleet',
      icon: FileCheck,
    },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      {/* 1. 100% FULL-SCREEN MAP OCCUPYING ENTIRE VIEWPORT */}
      <div className="fixed inset-0 w-screen h-screen z-0">
        <LeafletMap
          theaterId={currentTheater.id}
          center={mapCenter}
          zoom={mapZoom}
          riverPath={currentTheater.riverPath}
          floodStage={floodStage}
          chokePoints={currentTheater.chokePoints}
          markers={masterMapMarkers}
          lines={masterMapLines}
          activeChokeId={selectedChoke?.id}
          isTourActive={tourMode !== 'none'}
          isLiveDispatched={isLiveDispatched}
          cameraCommand={cameraCommand}
          panelWidth={panelWidth}
          pulsingTarget={pulsingTarget}
          onResetOverview={handleResetOverview}
        />
      </div>

      {/* 2. COMPACT SLEEK FLOATING TOP BAR */}
      <Header
        currentTheater={currentTheater}
        interventions={interventions}
        fleetMode={fleetMode}
        onFleetChange={(mode) => {
          setFleetMode(mode);
          if (tourMode === 'interactive' && interactiveTask === 1) {
            handleNextInteractiveTask();
          }
        }}
        statusFilter={statusFilter}
        onFilterChange={setStatusFilter}
        onOpenTelemetry={() => setIsTelemetryOpen(true)}
        activeTheaterId={activeTheaterId}
        onSelectTheater={(id) => {
          setActiveTheaterId(id);
          setInterventions({});
          setSelectedChokeIdx(0);
          setIsLiveDispatched(false);
        }}
        customTheater={customTheater}
        onLoadCustomTheater={(th) => {
          setCustomTheater(th);
          setActiveTheaterId('custom');
          setInterventions({});
          setSelectedChokeIdx(0);
          setIsLiveDispatched(false);
        }}
        onSearchFocus={(coords) =>
          triggerPointFocus({ lat: coords[0], lon: coords[1], name: 'Search Location' })
        }
        onPreemptiveAlertClick={() => triggerCorridorFocus(0)}
        onStartInteractiveTour={handleStartInteractiveTour}
        onStartAutoDemo={handleStartAutoDemo}
        isInteractiveTourActive={tourMode === 'interactive'}
        isAutoDemoActive={tourMode === 'autodemo'}
        interactiveTourTask={tourMode === 'interactive' ? interactiveTask : 0}
        opsMode={opsMode}
        onToggleOpsMode={() => setOpsMode((prev) => (prev === 'day' ? 'night' : 'day'))}
      />

      {/* 3. ALWAYS-VISIBLE FLOATING ZOOM OUT BUTTON */}
      <div className="fixed top-18 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <button
          type="button"
          onClick={handleResetOverview}
          className="px-4 py-2 rounded-full bg-slate-900/95 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-sm font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 select-none"
          title="Reset map camera to whole district flood overview (Zoom 12)"
        >
          <span>🌐</span>
          <span>Zoom Out: District Overview</span>
        </button>
      </div>

      {/* 4. SLEEK SINGLE-LINE BOTTOM OPERATIONAL STATUS BAR (WHEN DISPATCHED IN STEP 4) */}
      {isLiveDispatched && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 border border-emerald-500/80 px-5 py-2.5 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.3)] backdrop-blur-md flex items-center gap-3 text-sm font-semibold text-emerald-200 pointer-events-auto animate-in fade-in slide-in-from-bottom-3 select-none">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold text-white">All 74 Villages Served</span>
          <span className="text-slate-600">•</span>
          <span>Valley Hospital ICU Stabilized at 104% (Safe)</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400">Golden Hour Restored (18 mins)</span>
        </div>
      )}

      {/* FULLSCREEN DRAG OVERLAY */}
      {isDragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize select-none pointer-events-auto" />
      )}

      {/* 5. FLOATING COLLAPSIBLE RESIZABLE 4-STEP COMMAND PANEL ON LEFT (380px to 640px) */}
      {!isDrawerCollapsed ? (
        <aside
          style={{ width: `${panelWidth}px`, maxWidth: 'calc(100vw - 32px)' }}
          className="fixed top-18 left-4 bottom-4 z-30 flex bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden select-none"
        >
          {/* Main scrollable content column */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Drawer Header: Presets [ S | M | L | Hide ] + 4 Distinct Step Tabs */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 shrink-0 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  Incident Command Steps (1–4)
                </span>

                {/* Quick-Size Presets & Hide */}
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setPanelWidth(380)}
                    className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                      panelWidth <= 400
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                    title="Small width 380px"
                  >
                    S
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanelWidth(480)}
                    className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                      panelWidth > 400 && panelWidth <= 540
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                    title="Medium width 480px"
                  >
                    M
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanelWidth(620)}
                    className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                      panelWidth > 540
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                    title="Large width 620px"
                  >
                    L
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDrawerCollapsed(true)}
                    className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Collapse panel"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Hide</span>
                  </button>
                </div>
              </div>

              {/* 4 Step Tabs (Readable 14px Text, No Micro-Fonts!) */}
              <div className="grid grid-cols-4 gap-1.5">
                {coreSteps.map((s, idx) => {
                  const isActive = activeStep === s.id;
                  const isTaskTarget =
                    tourMode === 'interactive' &&
                    ((interactiveTask === 1 && idx === 0) ||
                      (interactiveTask === 2 && idx === 1) ||
                      (interactiveTask === 3 && idx === 2) ||
                      (interactiveTask === 4 && idx === 3));

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActiveStep(s.id)}
                      className={`py-2 px-1 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center truncate ${
                        isTaskTarget
                          ? 'ring-4 ring-emerald-400 bg-emerald-950 text-emerald-200 shadow-[0_0_15px_#10b981]'
                          : isActive
                          ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400'
                          : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
                      }`}
                      title={s.desc}
                    >
                      <span className="block truncate">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Body: Scrollable Active Step Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
              {activeStep === 'step1_what_broke' && (
                <Step1WhatBroke
                  currentTheater={currentTheater}
                  selectedChokeIdx={validIdx}
                  onSelectChokeIdx={(idx) => {
                    triggerCorridorFocus(idx);
                    if (tourMode === 'interactive' && interactiveTask === 1) {
                      handleNextInteractiveTask();
                    }
                  }}
                  fleetMode={fleetMode}
                  onFleetChange={(mode) => {
                    setFleetMode(mode);
                    if (tourMode === 'interactive' && interactiveTask === 1) {
                      handleNextInteractiveTask();
                    }
                  }}
                  floodStage={floodStage}
                  onFloodStageChange={setFloodStage}
                  panelWidth={panelWidth}
                  interactiveTourTask={tourMode === 'interactive' ? interactiveTask : 0}
                  isTourActive={tourMode !== 'none'}
                  onNextStep={() => setActiveStep('step2_who_is_at_risk')}
                />
              )}

              {activeStep === 'step2_who_is_at_risk' && (
                <Step2WhoIsAtRisk
                  currentTheater={currentTheater}
                  interventions={interventions}
                  rerouteAmbulances={rerouteAmbulances}
                  onToggleRerouteAmbulances={() => {
                    setRerouteAmbulances((prev) => !prev);
                    if (tourMode === 'interactive' && interactiveTask === 2) {
                      handleNextInteractiveTask();
                    }
                  }}
                  activateSurgeBeds={activateSurgeBeds}
                  onToggleActivateSurgeBeds={() => setActivateSurgeBeds((prev) => !prev)}
                  onFocusHospital={triggerPointFocus}
                  panelWidth={panelWidth}
                  isTourActive={tourMode !== 'none'}
                  interactiveTourTask={tourMode === 'interactive' ? interactiveTask : 0}
                  onNextStep={() => setActiveStep('step3_test_fixes')}
                />
              )}

              {activeStep === 'step3_test_fixes' && (
                <Step3TestFixes
                  currentTheater={currentTheater}
                  interventions={interventions}
                  onSetIntervention={(cpId, tool) => {
                    setInterventions((prev) => ({ ...prev, [cpId]: tool }));
                    if (tourMode === 'interactive' && interactiveTask === 3) {
                      handleNextInteractiveTask();
                    }
                  }}
                  onResetInterventions={() => setInterventions({})}
                  selectedChokeIdx={validIdx}
                  onSelectChokeIdx={triggerCorridorFocus}
                  fleetMode={fleetMode}
                  panelWidth={panelWidth}
                  interactiveTourTask={tourMode === 'interactive' ? interactiveTask : 0}
                  opsMode={opsMode}
                  onAdvanceToStep4={() => setActiveStep('step4_edit_launch')}
                />
              )}

              {activeStep === 'step4_edit_launch' && (
                <Step4EditLaunchRescue
                  currentTheater={currentTheater}
                  activeInterventions={interventions}
                  onNavigateToStep3={() => setActiveStep('step3_test_fixes')}
                  onSignAndDispatch={() => {
                    setIsLiveDispatched(true);
                    if (tourMode === 'interactive' && interactiveTask === 4) {
                      setInteractiveTask(5);
                    }
                  }}
                  isLiveDispatched={isLiveDispatched}
                />
              )}
            </div>
          </div>

          {/* Tactile Drag Grip Handle on Right Edge */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            className="w-3.5 cursor-col-resize bg-slate-900 hover:bg-cyan-500/30 border-l border-slate-800 flex flex-col items-center justify-center gap-1.5 group select-none shrink-0 transition-colors"
            title="Drag left/right to resize (380px - 640px)"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-cyan-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-cyan-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-cyan-400" />
          </div>
        </aside>
      ) : (
        /* Collapsed Floating Drawer Trigger */
        <button
          onClick={() => setIsDrawerCollapsed(false)}
          className="fixed top-18 left-4 z-30 px-4 py-2.5 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-800 text-slate-100 shadow-2xl flex items-center gap-2 text-sm font-bold hover:bg-slate-800 transition-all cursor-pointer"
        >
          <Maximize2 className="w-4 h-4 text-cyan-400" />
          <span>Open Steps (1–4)</span>
        </button>
      )}

      {/* Guided Tour Tooltip Anchored next to the active element */}
      {tourMode === 'interactive' && (
        <InteractiveTourCoach
          currentTask={interactiveTask}
          onClose={() => setTourMode('none')}
          onNextTask={handleNextInteractiveTask}
          onPrevTask={handlePrevInteractiveTask}
          anchorX={panelWidth + 30}
          anchorY={160}
        />
      )}

      {/* Auto-Demo Player */}
      {tourMode === 'autodemo' && (
        <AutoDemoPlayer
          currentSceneIdx={autoDemoSceneIdx}
          onSceneChange={setAutoDemoSceneIdx}
          onClose={() => setTourMode('none')}
          onDispatchFleet={() => {
            setIsLiveDispatched(true);
            setActiveStep('step4_edit_launch');
          }}
        />
      )}

      {/* Telemetry Drawer Modal */}
      <TelemetryDrawer
        isOpen={isTelemetryOpen}
        onClose={() => setIsTelemetryOpen(false)}
      />
    </div>
  );
}

export default App;
