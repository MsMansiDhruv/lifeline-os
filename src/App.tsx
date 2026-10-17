import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { TelemetryDrawer } from './components/TelemetryDrawer';
import { InteractiveTourCoach } from './components/InteractiveTourCoach';
import { AutoDemoPlayer } from './components/AutoDemoPlayer';
import { LeafletMap, MapMarker, MapLine, CameraCommand } from './components/LeafletMap';

// 5 Operational Incident Command Chapters
import { Step1WhatBroke } from './components/UnifiedSteps/Step1WhatBroke';
import { Chapter2Predict } from './components/UnifiedSteps/Chapter2Predict';
import { Step2WhoIsAtRisk } from './components/UnifiedSteps/Step2WhoIsAtRisk';
import { Step3TestFixes } from './components/UnifiedSteps/Step3TestFixes';
import { Step4EditLaunchRescue } from './components/UnifiedSteps/Step4EditLaunchRescue';
import { Chapter5Learn } from './components/UnifiedSteps/Chapter5Learn';
import { CommandPanel, IncidentChapter } from './components/CommandPanel';
import { ContextualFeatureInspector, InspectedFeatureData } from './components/ContextualFeatureInspector';
import { LiveMeteoTelemetryPanel } from './components/LiveMeteoTelemetryPanel';
import { EcosystemBusDrawer } from './components/EcosystemBusDrawer';
import { SanctionOrderModal } from './components/SanctionOrderModal';
import { dispatchLivePhoneAlert } from './services/emergencyBroadcastService';
import { calculateAmbulanceSurgeAllocation } from './services/ambulanceAllocationService';
import { ecosystemBus, EcosystemBusState } from './services/ecosystemServiceBus';
import { playRadarPing } from './services/audioService';
import { auditService } from './services/auditService';

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
import {
  getOsrmRoute,
  getCorridorRoadNetwork,
  generateDenseRoadCurve,
  CorridorRoadNetwork,
} from './services/osrmRouting';
import { FleetMode } from './types';
import { Terrain3DViewer } from './components/Terrain3DViewer';
import { BottomScenarioNavigator } from './components/BottomScenarioNavigator';
import { EvidenceCatalogueModal } from './components/EvidenceCatalogueModal';
import { FieldEvidenceEditorModal } from './components/FieldEvidenceEditorModal';
import {
  ShieldAlert,
  Activity,
  Sliders,
  FileCheck,
  ChevronLeft,
  Maximize2,
  CheckCircle2,
  Sparkles,
  Waves,
  History,
  Play,
} from 'lucide-react';

export function App() {
  const [fleetMode, setFleetMode] = useState<FleetMode>('Light Emergency (Ambulance/4x4)');
  const [statusFilter, setStatusFilter] = useState<string>('All Critical');
  const [activeChapter, setActiveChapter] = useState<IncidentChapter>('protect');
  const [activeStep, setActiveStep] = useState<string>('chapter3_protect');
  const [inspectedFeature, setInspectedFeature] = useState<InspectedFeatureData | null>(null);
  const [respondSubTab, setRespondSubTab] = useState<'allocate' | 'dispatch'>('allocate');
  const [isTelemetryOpen, setIsTelemetryOpen] = useState<boolean>(false);
  const [isWeatherPanelOpen, setIsWeatherPanelOpen] = useState<boolean>(false);
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState<boolean>(false);
  const [liveWindSpeed, setLiveWindSpeed] = useState<number>(14.2);
  const [isSimulatedHighWind, setIsSimulatedHighWind] = useState<boolean>(false);

  const handleToggleSimulateHighWind = () => {
    setIsSimulatedHighWind((prev) => {
      const next = !prev;
      ecosystemBus.setWindOverride(next ? 52.4 : null);
      if (next) {
        setInterventions((current) => {
          const updated = { ...current };
          let changed = false;
          Object.entries(updated).forEach(([cpId, tool]) => {
            if (tool === 'drone') {
              updated[cpId] = 'none';
              changed = true;
            }
          });
          return changed ? updated : current;
        });
      }
      return next;
    });
  };

  // River Flood Level (1: +1.5m Warning, 2: +3.0m Bank Overtop, 3: +4.5m Severe Basin Surge)
  const [floodStage, setFloodStage] = useState<number>(2);

  // Step 2 Hospital Surge Actions
  const [rerouteAmbulances, setRerouteAmbulances] = useState<boolean>(false);
  const [activateSurgeBeds, setActivateSurgeBeds] = useState<boolean>(false);
  const [detourRouteMode, setDetourRouteMode] = useState<'both' | 'detour' | 'baseline'>('both');
  const [isBreachTemporarilyReopened, setIsBreachTemporarilyReopened] = useState<boolean>(false);

  // Step 4 Official Live Dispatch State
  const [isLiveDispatched, setIsLiveDispatched] = useState<boolean>(false);

  // 3D Terrain & Satellite & Map View Mode (Section 1 & 2 Brief Requirements)
  const [viewMode, setViewMode] = useState<'map' | 'satellite' | '3d'>('map');
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(false);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [simulationProgress, setSimulationProgress] = useState<string>('');
  const [showHeroHeadline, setShowHeroHeadline] = useState<boolean>(true);

  // Live 6-Service Keyless Ecosystem Bus & Interoperability Modals
  const [isEcosystemDrawerOpen, setIsEcosystemDrawerOpen] = useState<boolean>(false);
  const [isSanctionModalOpen, setIsSanctionModalOpen] = useState<boolean>(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState<boolean>(false);
  const [isFieldEditorModalOpen, setIsFieldEditorModalOpen] = useState<boolean>(false);
  const [ecosystemState, setEcosystemState] = useState<EcosystemBusState>(ecosystemBus.getState());
  const [isSosDismissed, setIsSosDismissed] = useState<boolean>(false);

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

  // Connect Centralized Ecosystem Service Bus & Real-Time Sync across tabs
  useEffect(() => {
    ecosystemBus.fetchLiveWeather(currentTheater.center[0], currentTheater.center[1]);
    ecosystemBus.fetchLiveHydrology(currentTheater.center[0], currentTheater.center[1]);
    ecosystemBus.fetchLiveOverpassCounts(currentTheater.center[0], currentTheater.center[1]);

    const unsubBus = ecosystemBus.subscribe((newState) => {
      setEcosystemState({ ...newState });
    });

    const unsubSync = ecosystemBus.onInterventionSync((chokeId, tool) => {
      setInterventions((prev) => ({
        ...prev,
        [chokeId]: tool as InterventionType,
      }));
    });

    return () => {
      unsubBus();
      unsubSync();
    };
  }, [currentTheater]);

  // Handle incoming live field SOS messages from ntfy.sh SSE stream
  useEffect(() => {
    if (ecosystemState.lastInboundSos) {
      setIsSosDismissed(false);
      playRadarPing(1500);
      setPulsingTarget([ecosystemState.lastInboundSos.lat, ecosystemState.lastInboundSos.lon]);
      setCameraCommand({
        id: `cmd_sos_${ecosystemState.lastInboundSos.id}_${Date.now()}`,
        type: 'point',
        center: [ecosystemState.lastInboundSos.lat, ecosystemState.lastInboundSos.lon],
        zoom: 15,
        duration: 1.2,
      });
      // Auto-collapse banner after 8s so tactical map is not blocked
      const timer = setTimeout(() => {
        setIsSosDismissed(true);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [ecosystemState.lastInboundSos]);

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

  // 10-Second Response Simulation Sequence (Section 1 Brief Requirement: Disruption -> Consequence -> Decision)
  // 10-Second Response Simulation Sequence (Disruption -> Consequence -> Diversion Decision)
  const handleRunResponseSimulation = () => {
    if (isSimulationRunning) return;
    setIsSimulationRunning(true);
    setSimulationStep(1);
    setActiveChapter('protect');
    setSelectedChokeIdx(0);
    setDetourRouteMode('baseline');
    setRerouteAmbulances(false);
    setIsBreachTemporarilyReopened(false);

    const cp = currentTheater.chokePoints[0] || selectedChoke;
    const dest = currentTheater.hospitals.find((h) => h.id === cp.nearest_hospital_id) || currentTheater.hospitals[0];
    const backupHosp = currentTheater.hospitals.find((h) => h.id !== dest?.id) || dest;
    const shortRoad = cp.id === 'jt_road' ? 'JT Road' : cp.road_name.split(' (')[0].replace(' Corridor', '').replace(' Breach', '');

    setSimulationProgress(`0-3s: ${shortRoad} Disrupted`);
    triggerPointFocus({ lat: cp.lat, lon: cp.lon, name: `${shortRoad} Breach Head` });

    // Step 2 (3-6s): Reveal consequence (Target hospital cut off, detour delay)
    setTimeout(() => {
      setSimulationStep(2);
      setSimulationProgress(`3-6s: ${dest?.name?.split(' ')[0] || 'Hospital'} Cut Off • Detour +${cp.detour_travel_mins || 47}m`);
      setDetourRouteMode('both');
      if (dest) {
        triggerPointFocus({ lat: dest.lat, lon: dest.lon, name: `${dest.name} Saturation` });
      }
    }, 3200);

    // Step 3 (6-10s): Demonstrates decision (diverts ambulances & balances clinical surge to backup trauma hub)
    setTimeout(() => {
      setSimulationStep(3);
      setSimulationProgress(`6-10s: Surge Rebalance to ${backupHosp?.name?.split(' ')[0] || 'Triage Hub'}`);
      setRerouteAmbulances(true);
      setActiveChapter('respond');
      if (backupHosp) {
        triggerPointFocus({ lat: backupHosp.lat, lon: backupHosp.lon, name: backupHosp.name });
      }
    }, 6400);

    // 10s: Complete simulation and log to immutable audit trail
    setTimeout(() => {
      setIsSimulationRunning(false);
      setSimulationStep(0);
      setSimulationProgress('');
      auditService.recordAction({
        action_type: 'SCENARIO_CREATED',
        rationale: `Automated 10s response simulation executed for ${currentTheater.name}: Disruption -> Consequence -> Diversion decision demonstrated.`,
        user_id: `INCIDENT_COMMANDER_${currentTheater.id.toUpperCase()}`,
        user_role: 'INCIDENT_COMMANDER',
        human_authorized: true,
      });
    }, 10000);
  };

  // Guided Tour handlers
  const handleStartInteractiveTour = () => {
    setTourMode('interactive');
    setInteractiveTask(1);
    setActiveStep('chapter1_prevent');
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
    setActiveStep('chapter1_prevent');
    setIsDrawerCollapsed(false);
    setInterventions({});
    setRerouteAmbulances(false);
    setActivateSurgeBeds(false);
    setIsLiveDispatched(false);
  };

  const handleNextInteractiveTask = () => {
    if (interactiveTask === 1) {
      setActiveChapter('predict');
      setActiveStep('chapter2_predict');
      setInteractiveTask(2);
    } else if (interactiveTask === 2) {
      setActiveChapter('protect');
      setActiveStep('chapter3_protect');
      setInteractiveTask(3);
    } else if (interactiveTask === 3) {
      setRerouteAmbulances(true);
      setActiveChapter('respond');
      setActiveStep('chapter4_respond');
      setRespondSubTab('allocate');
      setInteractiveTask(4);
    } else if (interactiveTask === 4) {
      const cps = currentTheater.chokePoints;
      const autoInterventions: Record<string, InterventionType> = {};
      if (cps[0]) autoInterventions[cps[0].id] = 'bridge';
      if (cps[1]) autoInterventions[cps[1].id] = 'booth';
      if (cps[2]) autoInterventions[cps[2].id] = 'boat';
      if (cps[3]) autoInterventions[cps[3].id] = 'drone';
      setInterventions(autoInterventions);
      setIsLiveDispatched(true);
      setActiveChapter('learn');
      setActiveStep('chapter5_learn');
      setInteractiveTask(5);
    } else if (interactiveTask === 5) {
      setInteractiveTask(6);
    }
  };

  const handlePrevInteractiveTask = () => {
    if (interactiveTask === 2) {
      setActiveChapter('prevent');
      setActiveStep('chapter1_prevent');
      setInteractiveTask(1);
    } else if (interactiveTask === 3) {
      setActiveChapter('predict');
      setActiveStep('chapter2_predict');
      setInteractiveTask(2);
    } else if (interactiveTask === 4) {
      setActiveChapter('protect');
      setActiveStep('chapter3_protect');
      setInteractiveTask(3);
    } else if (interactiveTask === 5) {
      setActiveChapter('respond');
      setActiveStep('chapter4_respond');
      setInteractiveTask(4);
    }
  };

  // Auto-Demo Automated Timeline Choreography
  useEffect(() => {
    if (tourMode !== 'autodemo') return;

    if (autoDemoSceneIdx === 0) {
      // Scene 1: Chapter 1 Prevent
      setActiveStep('chapter1_prevent');
      setFleetMode('Heavy Supply (Truck/Bus)');
      triggerCorridorFocus(0);
    } else if (autoDemoSceneIdx === 1) {
      // Scene 2: Chapter 2 Predict
      setActiveStep('chapter2_predict');
    } else if (autoDemoSceneIdx === 2) {
      // Scene 3: Chapter 3 Protect
      setActiveStep('chapter3_protect');
      setRerouteAmbulances(true);
      setActivateSurgeBeds(true);
    } else if (autoDemoSceneIdx === 3) {
      // Scene 4: Chapter 4 Respond (Allocation & Dispatch)
      setActiveStep('chapter4_respond');
      setRespondSubTab('dispatch');
      const cps = currentTheater.chokePoints;
      const autoInterventions: Record<string, InterventionType> = {};
      if (cps[0]) autoInterventions[cps[0].id] = 'bridge';
      if (cps[1]) autoInterventions[cps[1].id] = 'booth';
      if (cps[2]) autoInterventions[cps[2].id] = 'boat';
      if (cps[3]) autoInterventions[cps[3].id] = 'drone';
      setInterventions(autoInterventions);
      setIsLiveDispatched(true);
      handleResetOverview();
    }
  }, [tourMode, autoDemoSceneIdx]);

  // Selected choke point object
  const validIdx = Math.min(selectedChokeIdx, Math.max(0, currentTheater.chokePoints.length - 1));
  const selectedChoke: TheaterChokePoint = currentTheater.chokePoints[validIdx] || currentTheater.chokePoints[0];
  const activeSelectedTool = interventions[selectedChoke?.id || ''] || 'none';

  // Target Destination Hospital for selected corridor (closest hospital by direct vector)
  const destHospital = useMemo(() => {
    if (!selectedChoke) return currentTheater.hospitals[0];
    const match = currentTheater.hospitals.find((h) => h.id === selectedChoke.nearest_hospital_id);
    if (match) return match;
    if (selectedChoke.id === 'jt_road' || selectedChoke.id === 'harinagar' || selectedChoke.id === 'korkoli_causeway') {
      return currentTheater.hospitals.find((h) => h.id === 'valley') || currentTheater.hospitals[0];
    }
    if (selectedChoke.id === 'borkhola_link') {
      return currentTheater.hospitals.find((h) => h.id === 'smch') || currentTheater.hospitals[0];
    }
    return currentTheater.hospitals[0];
  }, [selectedChoke, currentTheater.hospitals]);

  // Active segmented GIS corridor network (approaches, breach, bridge, airbridge, ferry, clinic)
  const activeCorridorNet: CorridorRoadNetwork = useMemo(() => {
    return getCorridorRoadNetwork(selectedChoke?.id || 'jt_road', selectedChoke, destHospital);
  }, [selectedChoke, destHospital]);

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
      chokeId: selectedChoke.id,
      isDetour: false,
    }).then((pts) => {
      setNormalRoutePoints(pts);
    });

    // 2. Emergency Detour route: Village around flood basin
    if (destHospital) {
      getOsrmRoute([originVillage.lat, originVillage.lon], [destHospital.lat, destHospital.lon], {
        chokeId: selectedChoke.id,
        isDetour: true,
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
        const quietColor =
          tool === 'bridge'
            ? '#b45309'
            : tool === 'booth'
            ? '#eab308'
            : tool === 'drone'
            ? '#a855f7'
            : tool === 'boat'
            ? '#0284c7'
            : '#f43f5e';

        const handleInspect = () => {
          setSelectedChokeIdx(idx);
          triggerCorridorFocus(idx);
          setInspectedFeature({
            id: cp.id,
            type: 'chokepoint',
            title: cp.road_name,
            subtitle: `${cp.trapped_villages_count} Isolated Habitations`,
            coordinates: [cp.lat, cp.lon],
            statusText: tool !== 'none' ? `INTERVENTION: ${tool.toUpperCase()}` : 'SEVERED BRIDGEHEAD',
            statusColor: tool !== 'none' ? 'cyan' : 'rose',
            evidenceClass: 'OBSERVED',
            dataState: 'LIVE',
            metrics: [
              { label: 'Breach Gap', value: `${cp.exposed_meters} meters` },
              { label: 'Trapped Villages', value: `${cp.trapped_villages_count} Villages`, color: 'text-amber-400' },
              { label: 'Detour Transit', value: `+${cp.detour_travel_mins || Math.round(cp.detour_km * 2.5)} mins`, color: 'text-rose-400' },
              { label: 'Active Asset', value: tool.toUpperCase(), color: 'text-cyan-400' },
            ],
            description: `Alluvial river flood crest has severed bridgehead abutments. ${cp.trapped_villages_count} habitations are cut off from direct trauma care.`,
            actionButton: {
              label: 'Inspect in Protect',
              onClick: () => {
                setSelectedChokeIdx(idx);
                setActiveChapter('protect');
              },
            },
          });
        };

        list.push({
          lat: cp.lat,
          lon: cp.lon,
          title: `#${cp.rank}: ${cp.road_name} (${cp.trapped_villages_count} Villages)`,
          type: 'chokepoint',
          isQuietDot: true,
          quietDotColor: quietColor,
          onClick: handleInspect,
        });
        return;
      }

      // 1 SELECTED CORRIDOR: Pin ! (Road Breach / Fix Pill)
      const shortRoad = cp.id === 'jt_road' ? 'JT Road' : cp.road_name.split(' (')[0].replace(' Corridor', '').replace(' Breach', '');
      let bannerText = `${shortRoad} Bridge Submerged • ${cp.exposed_meters}m Gap`;

      if (tool === 'bridge') {
        bannerText = `${shortRoad}: Bailey Bridge Active (16T Ready)`;
      } else if (tool === 'booth') {
        bannerText = `${shortRoad}: Hospital Camp Active at Roadhead`;
      } else if (tool === 'drone') {
        bannerText = `${shortRoad}: UAV Medical Drone Active`;
      } else if (tool === 'boat') {
        bannerText = `${shortRoad}: Rescue Boat Active`;
      }

      list.push({
        lat: cp.lat,
        lon: cp.lon,
        title: cp.road_name,
        type: tool !== 'none' ? tool : 'chokepoint',
        customBanner: bannerText,
        stepCategory: 'choke',
        onClick: () => {
          setInspectedFeature({
            id: cp.id,
            type: 'chokepoint',
            title: cp.road_name,
            subtitle: `${cp.trapped_villages_count} Isolated Habitations`,
            coordinates: [cp.lat, cp.lon],
            statusText: tool !== 'none' ? `INTERVENTION: ${tool.toUpperCase()}` : 'SEVERED BRIDGE ABUTMENT',
            statusColor: tool !== 'none' ? 'cyan' : 'rose',
            evidenceClass: 'OBSERVED',
            dataState: 'LIVE',
            metrics: [
              { label: 'Breach Width', value: `${cp.exposed_meters} meters` },
              { label: 'Trapped Villages', value: `${cp.trapped_villages_count} Villages`, color: 'text-amber-400' },
              { label: 'Detour Delay', value: `+${cp.detour_travel_mins || Math.round(cp.detour_km * 2.5)} mins`, color: 'text-rose-400' },
              { label: 'Deployed Asset', value: tool.toUpperCase(), color: 'text-cyan-400' },
            ],
            description: `Critical infrastructure breach. Alluvial inundation disconnects direct arterial traffic to referral trauma center.`,
          });
        },
      });
    });

    // 2. DISCONNECTED NEARBY VILLAGES FOR SELECTED CORRIDOR
    const allNearbyVillages =
      selectedChoke.villages && selectedChoke.villages.length > 0
        ? selectedChoke.villages
        : [
            {
              id: 'v_orig',
              name: `${selectedChoke.road_name.split(' ')[0]} Villages`,
              lat: selectedChoke.lat + 0.014,
              lon: selectedChoke.lon + 0.012,
              population: Math.round(selectedChoke.trapped_villages_count * 116.66 * 4.8),
            },
          ];

    allNearbyVillages.forEach((village, vIdx) => {
      const popStr = (village.population || Math.round(selectedChoke.trapped_villages_count * 116.66 * 4.8)).toLocaleString();
      const distFromBreachKm = (
        Math.hypot(village.lat - selectedChoke.lat, village.lon - selectedChoke.lon) * 111
      ).toFixed(1);

      list.push({
        lat: village.lat,
        lon: village.lon,
        title: village.name,
        type: 'isolated',
        customBanner: `DISCONNECTED: ${village.name} (${popStr} Pop)`,
        stepCategory: 'start',
        onClick: () => {
          setInspectedFeature({
            id: village.id || `v_${vIdx}`,
            type: 'village',
            title: village.name,
            subtitle: `Disconnected Rural Habitation • ${distFromBreachKm} km to Breach`,
            coordinates: [village.lat, village.lon],
            statusText: 'COMMUNITY DISCONNECTED',
            statusColor: 'amber',
            evidenceClass: 'MODELLED',
            dataState: 'LIVE',
            metrics: [
              { label: 'Est. Population', value: `${popStr} Citizens`, color: 'text-amber-400' },
              {
                label: 'Isolation Status',
                value: activeSelectedTool === 'bridge' ? 'Bridge Access Restored' : 'Road Cut Off • Disconnected',
                color: activeSelectedTool === 'bridge' ? 'text-emerald-400' : 'text-rose-400',
              },
              {
                label: 'Trauma Access',
                value: activeSelectedTool === 'bridge' ? '18 mins (Direct Highway)' : '65 mins (Detour Bypass)',
              },
              { label: 'Distance to Breach', value: `${distFromBreachKm} km` },
            ],
            description: `Nearby rural population disconnected by the ${selectedChoke.road_name} flood breach. Direct road access to referral trauma care is severed.`,
            actionButton: {
              label: 'Inspect in Protect',
              onClick: () => setActiveChapter('protect'),
            },
          });
        },
      });
    });

    // 3. ALL HOSPITALS: Permanent high-contrast labeled badges directly readable on screen
    currentTheater.hospitals.forEach((hosp) => {
      const isDest = hosp.id === destHospital?.id;
      const hospShort = hosp.name.split(' ')[0];
      const isSilchar = currentTheater.id === 'silchar';
      let surgeText = `${hosp.baseline_surge}%`;

      if (isSilchar) {
        if (hosp.id === 'valley') {
          const jtTool = interventions['jt_road'] || 'none';
          if (jtTool === 'bridge' || jtTool === 'booth' || isBreachTemporarilyReopened) {
            surgeText = '74% Stabilized (260/350 Beds)';
          } else if (rerouteAmbulances) {
            surgeText = '74% Stabilized (260/350 Beds)';
          } else {
            surgeText = '100% Saturated (350/350 Beds)';
          }
        } else if (hosp.id === 'smch') {
          surgeText = rerouteAmbulances ? '95% (807/850 Beds • Surge Absorbed)' : '92% (785/850 Beds • 65 Avail)';
        } else if (hosp.id === 'civil') {
          surgeText = rerouteAmbulances ? '94% (188/200 Beds • Surge Absorbed)' : '88% (176/200 Beds • 24 Avail)';
        } else if (hosp.id === 'nightingale') {
          surgeText = '81% (178/220 Beds • 42 Avail)';
        } else if (hosp.id === 'south_city') {
          surgeText = '96% (268/280 Beds • 12 Avail)';
        }
      } else {
        const primaryTool = interventions[currentTheater.chokePoints[0]?.id || ''] || 'none';
        const reduction = (primaryTool === 'bridge' || primaryTool === 'booth') ? 20 : 0;
        const currentSurge = Math.max(65, hosp.baseline_surge - reduction);
        surgeText = currentSurge <= 95 ? `${currentSurge}% Capacity` : `${currentSurge}% Saturated`;
      }

      const isSafe = surgeText.includes('Stabilized') || surgeText.includes('Avail') || surgeText.includes('Capacity');

      const handleInspectHosp = () => {
        triggerPointFocus({ lat: hosp.lat, lon: hosp.lon, name: hosp.name });
        setInspectedFeature({
          id: hosp.id,
          type: 'facility',
          title: hosp.name,
          subtitle: hosp.id === 'civil' ? 'District Civil Hospital (OSM: node/441289102)' : 'Designated Regional Referral Center',
          coordinates: [hosp.lat, hosp.lon],
          statusText: isSafe ? 'CAPACITY VIABLE' : 'CAPACITY SATURATED',
          statusColor: isSafe ? 'emerald' : 'rose',
          evidenceClass: 'OFFICIAL',
          dataState: 'LIVE',
          metrics: [
            { label: 'Bed Capacity', value: `${hosp.availableBeds || 0} Avail / ${hosp.totalBeds || 200} Total`, color: isSafe ? 'text-emerald-400' : 'text-rose-400' },
            { label: 'ICU Beds', value: `${hosp.icuBeds || 12} Dedicated ICU` },
            { label: 'Surge Status', value: surgeText },
            { label: 'Network Route', value: rerouteAmbulances ? 'Diversion Detour Active' : 'Direct Highway Corridor' },
          ],
          description: hosp.selectionReason || `Regional healthcare facility. Emergency clinical surge is balanced via deterministic START triage diversion protocols.`,
          actionButton: {
            label: 'Review in Protect',
            onClick: () => setActiveChapter('protect'),
          },
        });
      };

      if (!isDest) {
        list.push({
          lat: hosp.lat,
          lon: hosp.lon,
          title: `${hospShort} Hospital (${surgeText.split(' ')[0]})`,
          type: 'facility',
          isQuietDot: true,
          quietDotColor: '#38bdf8',
          onClick: handleInspectHosp,
        });
        return;
      }

      const isDirectRestored = activeSelectedTool === 'bridge' || isBreachTemporarilyReopened;
      const destBanner = isDirectRestored
        ? `${hospShort} Hospital (${surgeText.split(' ')[0]}) • 14.2 km / 18m Direct Highway Restored`
        : `${hospShort} Hospital (${surgeText.split(' ')[0]}) • 24.5 km / 65m Detour (+47m Delay)`;

      list.push({
        lat: hosp.lat,
        lon: hosp.lon,
        title: hosp.name,
        type: 'facility',
        customBanner: destBanner,
        stepCategory: 'dest',
        onClick: handleInspectHosp,
      });
    });

    // 4. Ambulance Surge Balancing Fleet Markers (when engaged in Chapter 3: PROTECT)
    if (rerouteAmbulances) {
      const surgePlan = calculateAmbulanceSurgeAllocation(selectedChoke, currentTheater.hospitals);
      surgePlan.assignments.forEach((assignment, aIdx) => {
        const offsetLat = aIdx === 0 ? 0.006 : aIdx === 1 ? -0.005 : 0.008;
        const offsetLon = aIdx === 0 ? 0.005 : aIdx === 1 ? -0.007 : -0.004;
        list.push({
          lat: assignment.originCoords[0] + offsetLat,
          lon: assignment.originCoords[1] + offsetLon,
          title: `${assignment.ambulanceId} (${assignment.callsign.split(' ')[0]})`,
          type: 'rerouted',
          customBanner: `🚑 ${assignment.ambulanceId} • Diverting ${assignment.patientsCarried} Patients to ${assignment.destHospitalName} (${assignment.estimatedTransitMins}m)`,
          stepCategory: 'choke',
        });
      });
    }

    return list;
  }, [currentTheater, interventions, validIdx, selectedChoke, activeSelectedTool, destHospital, rerouteAmbulances, isBreachTemporarilyReopened]);

  // Master Map Lines (Authentic broken road hazard vs restored highway & multi-modal corridors)
  const masterMapLines: MapLine[] = useMemo(() => {
    const list: MapLine[] = [];
    if (!selectedChoke) return list;

    // 0. If temporary culvert / breach closure is simulated reopened:
    if (isBreachTemporarilyReopened) {
      list.push({
        id: 'corridor_full_restored_highway',
        points: activeCorridorNet.fullRestored,
        color: '#10b981',
        weight: 6,
        label: `TEMPORARY CULVERT ACTIVE: Direct Baseline Restored (${selectedChoke.baseline_km} km • ${selectedChoke.baseline_travel_mins || 18} mins)`,
        layerType: 'baseline',
      });
      return list;
    }

    // 1. When NO Bridge Built (tool === 'none'): Visibly SEVERED broken pathway!
    if (activeSelectedTool === 'none') {
      const showBaseline = detourRouteMode === 'both' || detourRouteMode === 'baseline';
      const showDetour = detourRouteMode === 'both' || detourRouteMode === 'detour';

      if (showBaseline) {
        // 1.1 North Approach (from isolated village down to breach head)
        list.push({
          id: 'corridor_north_approach',
          points: activeCorridorNet.northApproach,
          color: '#f59e0b',
          weight: 5,
          label: `Approach Road: Habitations to Breach (${selectedChoke.trapped_villages_count} Villages)`,
          layerType: 'baseline',
        });

        // 1.1b Feeder Connector Roads linking all nearby disconnected habitations to the approach highway
        const allNearbyVillages =
          selectedChoke.villages && selectedChoke.villages.length > 0
            ? selectedChoke.villages
            : [];

        allNearbyVillages.slice(1).forEach((v, idx) => {
          list.push({
            id: `corridor_feeder_village_${v.id || idx}`,
            points: [
              [v.lat, v.lon],
              activeCorridorNet.northApproach[0] || [selectedChoke.lat + 0.005, selectedChoke.lon + 0.003],
            ],
            color: '#f59e0b',
            dashArray: '5, 5',
            weight: 3,
            label: `Feeder Link: ${v.name} -> Approach Highway`,
            layerType: 'baseline',
          });
        });

        // 1.2 Severed Breach Gap (pulsing red hazard gap over submerged deck)
        list.push({
          id: 'corridor_breach_gap_hazard',
          points: activeCorridorNet.breachGap,
          color: '#ef4444',
          dashArray: '6, 6',
          weight: 7,
          label: `⛔ ROAD SEVERED • ${selectedChoke.exposed_meters}m WASHOUT GAP (Bridge Deck Submerged)`,
          layerType: 'severed',
        });

        // 1.3 South Approach (from water abutment into hospital district)
        list.push({
          id: 'corridor_south_approach',
          points: activeCorridorNet.southApproach,
          color: '#64748b',
          weight: 4,
          label: 'Disconnected South Highway (Cut Off by Flood)',
          layerType: 'baseline',
        });
      }

      if (showDetour) {
        // 1.4 Active Emergency Flood Detour Bypass
        list.push({
          id: 'emergency_detour_route',
          points: activeCorridorNet.detour,
          color: '#f59e0b',
          dashArray: '10, 8',
          weight: 5,
          label: `⚠️ FLOOD BASIN DETOUR: ${selectedChoke.detour_km} km to Backup Hospital (+${(
            selectedChoke.detour_km - selectedChoke.baseline_km
          ).toFixed(1)} km Bypass • ${selectedChoke.detour_travel_mins || 65} mins)`,
          layerType: 'detour',
        });
      }
    }

    // 2. When Bailey Bridge is Built: Brown Highway & Truss Span
    if (activeSelectedTool === 'bridge') {
      list.push({
        id: 'corridor_full_restored_highway',
        points: activeCorridorNet.fullRestored,
        color: '#b45309',
        weight: 6,
        label: `BAILEY BRIDGE ACTIVE: Full Direct Highway Access Restored (${selectedChoke.baseline_km} km • 14 mins)`,
        layerType: 'baseline',
      });

      // Steel truss span highlight across breach
      list.push({
        id: 'corridor_steel_truss_span',
        points: activeCorridorNet.breachGap,
        color: '#92400e',
        weight: 8,
        label: `Class-40 Steel Modular Span (${selectedChoke.exposed_meters}m Gap Bridged • 16T IRC:6 Ready)`,
        layerType: 'baseline',
      });
    }

    // 3. When Hospital Camp (MMU) is Stationed: Yellow Camp Roadhead
    if (activeSelectedTool === 'booth') {
      list.push({
        id: 'corridor_mmu_north_approach',
        points: activeCorridorNet.northApproach,
        color: '#eab308',
        weight: 5,
        label: 'FORWARD HOSPITAL CAMP ACCESS: Patient Intake Corridor to Dry Roadhead MMU',
        layerType: 'catchment',
      });

      // Breach gap remains severed
      list.push({
        id: 'corridor_breach_gap_hazard',
        points: activeCorridorNet.breachGap,
        color: '#ef4444',
        dashArray: '6, 6',
        weight: 6,
        label: `RIVER GAP SEVERED • ${selectedChoke.exposed_meters}m Water Barrier`,
        layerType: 'severed',
      });

      // Bypass for hospital surgical cases
      list.push({
        id: 'emergency_detour_route',
        points: activeCorridorNet.detour,
        color: '#f59e0b',
        dashArray: '10, 8',
        weight: 4,
        label: `Detour Bypass for Surgical Referrals (${selectedChoke.detour_km} km)`,
        layerType: 'detour',
      });
    }

    // 4. When UAV Medical Drone is Deployed: Purple Airbridge
    if (activeSelectedTool === 'drone') {
      list.push({
        id: 'drone_flight_airbridge',
        points: activeCorridorNet.droneAirbridge,
        color: '#a855f7',
        dashArray: '10, 8',
        weight: 5,
        label: 'UAV MEDICAL AIRBRIDGE: 85 km/h Direct Flight (12-Min Antivenom & Blood Cargo)',
        layerType: 'drone',
      });

      // Road on ground remains severed
      list.push({
        id: 'corridor_breach_gap_hazard',
        points: activeCorridorNet.breachGap,
        color: '#ef4444',
        dashArray: '6, 6',
        weight: 5,
        label: `GROUND ROAD SEVERED • ${selectedChoke.exposed_meters}m Gap`,
        layerType: 'severed',
      });
    }

    // 5. When NDRF Rescue Boat is Deployed: Blue Water Crossing
    if (activeSelectedTool === 'boat') {
      list.push({
        id: 'rescue_boat_ferry_line',
        points: activeCorridorNet.ferryShuttle,
        color: '#0284c7',
        dashArray: '8, 8',
        weight: 6,
        label: 'NDRF RESCUE BOAT: 3-Min Water Patient Shuttle Active',
        layerType: 'boat',
      });

      list.push({
        id: 'corridor_north_approach',
        points: activeCorridorNet.northApproach,
        color: '#0284c7',
        weight: 5,
        label: 'Approach to Northern Rescue Boat Embarkation Slip',
        layerType: 'baseline',
      });

      list.push({
        id: 'corridor_south_approach',
        points: activeCorridorNet.southApproach,
        color: '#0284c7',
        weight: 4,
        label: 'Approach from Southern Disembarkation Abutment',
        layerType: 'baseline',
      });
    }

    // 6. Ambulance Diversion Route (when toggled in Chapter 3: PROTECT)
    if (rerouteAmbulances) {
      const surgePlan = calculateAmbulanceSurgeAllocation(selectedChoke, currentTheater.hospitals);
      surgePlan.assignments.forEach((assignment, aIdx) => {
        list.push({
          id: `ambulance_diversion_${assignment.ambulanceId}`,
          points: assignment.routePoints,
          color: aIdx === 0 ? '#0284c7' : '#0ea5e9',
          dashArray: '6, 6',
          weight: 4,
          label: `🚑 ${assignment.ambulanceId} DIVERSION: ${assignment.patientsCarried} Patients to ${assignment.destHospitalName} (${assignment.estimatedTransitMins}m via bypass)`,
          layerType: 'diversion',
        });
      });
    }

    return list;
  }, [selectedChoke, activeSelectedTool, activeCorridorNet, rerouteAmbulances, detourRouteMode, isBreachTemporarilyReopened, currentTheater]);

  // 5 Operational Command Chapters definition
  const coreSteps = [
    {
      id: 'chapter1_prevent',
      label: '01. PREVENT',
      desc: 'Cut-Edges & Road Severance',
      icon: ShieldAlert,
    },
    {
      id: 'chapter2_predict',
      label: '02. PREDICT',
      desc: 'Evidence & Data Coverage',
      icon: Waves,
    },
    {
      id: 'chapter3_protect',
      label: '03. PROTECT',
      desc: 'Hospital Surge & START Triage',
      icon: Activity,
    },
    {
      id: 'chapter4_respond',
      label: '04. RESPOND',
      desc: 'Constrained Allocation & Dispatch',
      icon: Sliders,
    },
    {
      id: 'chapter5_learn',
      label: '05. LEARN',
      desc: 'Audit Trail & Benchmarks',
      icon: History,
    },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      {/* 1. 100% FULL-SCREEN MAP OCCUPYING ENTIRE VIEWPORT (3D TERRAIN OR 2D LEAFLET) */}
      <div className="fixed inset-0 w-screen h-screen">
        {viewMode === '3d' ? (
          <Terrain3DViewer
            currentTheater={currentTheater}
            selectedChoke={selectedChoke}
            destHospital={destHospital}
            activeTool={activeSelectedTool}
            rerouteAmbulances={rerouteAmbulances}
            isBreachTemporarilyReopened={isBreachTemporarilyReopened}
            isSimulationRunning={isSimulationRunning}
            simulationStep={simulationStep}
            onSelectChoke={(chokeId) => {
              const idx = currentTheater.chokePoints.findIndex((cp) => cp.id === chokeId);
              if (idx !== -1) triggerCorridorFocus(idx);
            }}
            onSelectHospital={(hospId) => {
              const hosp = currentTheater.hospitals.find((h) => h.id === hospId);
              if (hosp) triggerPointFocus({ lat: hosp.lat, lon: hosp.lon, name: hosp.name });
            }}
            onClose3D={() => setViewMode('map')}
          />
        ) : (
          <LeafletMap
            theaterId={currentTheater.id}
            center={mapCenter}
            zoom={mapZoom}
            riverPath={currentTheater.riverPath}
            floodStage={floodStage}
            floodPolygon={currentTheater.floodPolygon}
            chokePoints={currentTheater.chokePoints}
            markers={masterMapMarkers}
            lines={masterMapLines}
            activeChokeId={selectedChoke?.id}
            activeTool={activeSelectedTool}
            corridorNet={activeCorridorNet}
            isTourActive={tourMode !== 'none'}
            isLiveDispatched={isLiveDispatched}
            cameraCommand={cameraCommand}
            panelWidth={panelWidth}
            pulsingTarget={pulsingTarget}
            onResetOverview={handleResetOverview}
            isWindVisualized={ecosystemState.weather.wind_speed_10m > 30 || isSimulatedHighWind}
            windSpeed={isSimulatedHighWind ? 52.4 : ecosystemState.weather.wind_speed_10m}
            fieldSosEvents={ecosystemState.activeSosEvents}
            mapMode={viewMode === 'satellite' ? 'satellite' : 'vector'}
            onMapModeChange={(mode) => setViewMode(mode === 'satellite' ? 'satellite' : 'map')}
            rerouteAmbulances={rerouteAmbulances}
            isSimulationRunning={isSimulationRunning}
          />
        )}
      </div>

      {/* FIRST 10 SECONDS HERO BANNER (Section 1 Brief Requirement) */}
      {showHeroHeadline && (
        <div
          className="fixed top-16 z-30 transition-all duration-300 pointer-events-auto"
          style={{
            left: `calc(${isDrawerCollapsed ? 60 : panelWidth}px + 20px)`,
            right: '24px',
          }}
        >
          <div className="max-w-4xl mx-auto p-3.5 rounded-2xl bg-slate-900/95 border border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.25)] backdrop-blur-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-white">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 uppercase tracking-wider">
                  Cachar/Silchar Flood Replay
                </span>
                <span className="text-[10px] font-mono text-slate-300">
                  📅 June 20, 2022
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.2 rounded border border-emerald-800">
                  ● OBSERVED REPLAY
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  🛰️ Sentinel-1 SAR + NASA SRTM 30m
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>See how one flood disruption affects emergency access.</span>
              </h1>
              <p className="text-xs text-slate-300 font-sans max-w-2xl leading-relaxed">
                When floods disrupt roads, Lifeline OS helps responders identify which healthcare services may lose access, compare feasible alternatives, and test a response before acting.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRunResponseSimulation}
                disabled={isSimulationRunning}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xl ${
                  isSimulationRunning
                    ? 'bg-amber-950/90 border-2 border-amber-500 text-amber-200 animate-pulse'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-emerald-400'
                }`}
                title="Run 10-second response simulation: Disruption -> Consequence -> Decision"
              >
                <Play className={`w-4 h-4 ${isSimulationRunning ? 'animate-spin' : 'fill-white'}`} />
                <span>{isSimulationRunning ? (simulationProgress || 'Simulating...') : 'Run response simulation'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowHeroHeadline(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 cursor-pointer text-xs transition-colors"
                title="Dismiss headline"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

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
        onOpenTelemetry={() => setIsWeatherPanelOpen((prev) => !prev)}
        onOpenEcosystemBus={() => setIsEcosystemDrawerOpen(true)}
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
        onNavigateStep={(step) => {
          setActiveStep(step);
          if (step.includes('prevent') || step.includes('step1')) setActiveChapter('prevent');
          else if (step.includes('predict')) setActiveChapter('predict');
          else if (step.includes('protect') || step.includes('step2')) setActiveChapter('protect');
          else if (step.includes('respond') || step.includes('step3') || step.includes('step4')) setActiveChapter('respond');
          else if (step.includes('learn') || step.includes('step5')) setActiveChapter('learn');
        }}
        onStartInteractiveTour={handleStartInteractiveTour}
        onStartAutoDemo={handleStartAutoDemo}
        isInteractiveTourActive={tourMode === 'interactive'}
        isAutoDemoActive={tourMode === 'autodemo'}
        opsMode={opsMode}
        onToggleOpsMode={() => setOpsMode((prev) => (prev === 'day' ? 'night' : 'day'))}
        liveWindSpeed={isSimulatedHighWind ? 52.4 : liveWindSpeed}
        isSimulatedHighWind={isSimulatedHighWind}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode((prev) => (prev === '3d' ? 'map' : '3d'))}
        onSelectViewMode={(mode) => setViewMode(mode)}
        onRunResponseSimulation={handleRunResponseSimulation}
        isSimulationRunning={isSimulationRunning}
        simulationProgress={simulationProgress}
      />

      {/* 3. EDITORIAL 5-CHAPTER INCIDENT COMMAND PANEL DOCKED ON LEFT */}
      <CommandPanel
        currentTheater={currentTheater}
        activeChapter={activeChapter}
        onSelectChapter={(chapter) => {
          setActiveChapter(chapter);
          const stepMap: Record<IncidentChapter, string> = {
            prevent: 'chapter1_prevent',
            predict: 'chapter2_predict',
            protect: 'chapter3_protect',
            respond: 'chapter4_respond',
            learn: 'chapter5_learn',
          };
          setActiveStep(stepMap[chapter]);
        }}
        selectedChokeIdx={validIdx}
        onSelectChokeIdx={(idx) => triggerCorridorFocus(idx)}
        interventions={interventions}
        onSetIntervention={(chokeId, tool) => {
          setInterventions((prev) => ({ ...prev, [chokeId]: tool }));
          ecosystemBus.broadcastInterventionChange(chokeId, tool);
          if (tourMode === 'interactive' && interactiveTask === 3) {
            handleNextInteractiveTask();
          }
        }}
        onResetInterventions={() => {
          setInterventions({});
          currentTheater.chokePoints.forEach((cp) =>
            ecosystemBus.broadcastInterventionChange(cp.id, 'none')
          );
        }}
        fleetMode={fleetMode}
        onFleetChange={(mode) => setFleetMode(mode)}
        rerouteAmbulances={rerouteAmbulances}
        onToggleRerouteAmbulances={() => setRerouteAmbulances((prev) => !prev)}
        activateSurgeBeds={activateSurgeBeds}
        onToggleActivateSurgeBeds={() => setActivateSurgeBeds((prev) => !prev)}
        isLiveDispatched={isLiveDispatched}
        onSignAndDispatch={() => {
          setIsLiveDispatched(true);
          if (tourMode === 'interactive' && interactiveTask === 4) {
            setInteractiveTask(5);
          }
        }}
        onOpenSanctionModal={() => setIsSanctionModalOpen(true)}
        onOpenEcosystemDrawer={() => setIsEcosystemDrawerOpen(true)}
        isSimulatedHighWind={isSimulatedHighWind}
        onToggleHighWind={handleToggleSimulateHighWind}
        ecosystemState={ecosystemState}
        onFocusMapPoint={triggerPointFocus}
        detourRouteMode={detourRouteMode}
        onSetDetourRouteMode={(mode) => setDetourRouteMode(mode)}
        isBreachTemporarilyReopened={isBreachTemporarilyReopened}
        onToggleBreachTemporarilyReopened={() => setIsBreachTemporarilyReopened((prev) => !prev)}
        onSelectTheater={(tId) => setActiveTheaterId(tId)}
      />

      {/* 4. CONTEXTUAL FEATURE INSPECTOR (OPENS DYNAMICALLY ON MAP PIN CLICK) */}
      <ContextualFeatureInspector
        feature={inspectedFeature}
        onClose={() => setInspectedFeature(null)}
      />

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
            const primaryChoke = currentTheater.chokePoints[0];
            const primaryTool = (primaryChoke ? interventions[primaryChoke.id] : 'bridge') || 'bridge';
            dispatchLivePhoneAlert({
              topic: (() => {
                try {
                  return localStorage.getItem('lifeline_alert_topic') || 'lifeline-os-alert-2026';
                } catch {
                  return 'lifeline-os-alert-2026';
                }
              })(),
              phone: (() => {
                try {
                  return localStorage.getItem('lifeline_phone_number') || '+91 98765 43210';
                } catch {
                  return '+91 98765 43210';
                }
              })(),
              theaterName: currentTheater.name,
              corridorName: primaryChoke?.road_name.split('(')[0].trim() || 'JT Road',
              breachWidth: primaryChoke?.exposed_meters || 38,
              allocationTool: primaryTool,
              nearestHospital: currentTheater.hospitals[0]?.name || 'Valley Hospital',
              detourMins: 65,
              dryRoadheadName: `${primaryChoke?.road_name.split('(')[0].trim() || 'JT'} North Roadhead`,
            });
          }}
        />
      )}

      {/* Live GEE & Open-Meteo Telemetry Panel (Contextual On-Demand) */}
      <LiveMeteoTelemetryPanel
        lat={mapCenter[0]}
        lon={mapCenter[1]}
        theaterName={currentTheater.name}
        onWindSpeedChange={setLiveWindSpeed}
        isSimulatedHighWind={isSimulatedHighWind}
        onToggleSimulateHighWind={handleToggleSimulateHighWind}
        isOpen={isWeatherPanelOpen}
        onClose={() => setIsWeatherPanelOpen(false)}
      />

      {/* Telemetry Drawer Modal */}
      <TelemetryDrawer
        isOpen={isTelemetryOpen}
        onClose={() => setIsTelemetryOpen(false)}
      />

      {/* Inbound Live Field SOS Notification (Compact, Non-Intrusive Tactical Pill with Close Button) */}
      {ecosystemState.lastInboundSos && !isSosDismissed && (
        <div className="fixed top-20 right-6 z-40 max-w-sm p-3 rounded-xl bg-slate-900/95 border-2 border-fuchsia-500 text-white shadow-[0_0_25px_rgba(217,70,239,0.5)] backdrop-blur-md animate-in slide-in-from-top-3 select-none">
          <div className="flex items-center justify-between gap-3 border-b border-fuchsia-800/60 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-400 animate-ping shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-fuchsia-300">
                🚨 Live Distress Beacon
              </span>
              <span className="text-[9px] font-mono bg-fuchsia-950 px-1 py-0.2 rounded text-fuchsia-300 border border-fuchsia-800">
                {ecosystemState.lastInboundSos.sender}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsSosDismissed(true)}
              className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 text-xs font-bold cursor-pointer"
              title="Dismiss alert"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-slate-200 mt-1.5 font-medium leading-relaxed truncate">
            "{ecosystemState.lastInboundSos.message}"
          </p>
          <div className="text-[10px] text-fuchsia-300 font-mono mt-1.5 flex items-center justify-between">
            <span>Beacon Pinned on Tactical Map</span>
            <span className="text-slate-400">
              {ecosystemState.lastInboundSos.lat.toFixed(4)}, {ecosystemState.lastInboundSos.lon.toFixed(4)}
            </span>
          </div>
        </div>
      )}

      {/* Ecosystem Service Bus Inspector Drawer (6/6 Live External Services) */}
      <EcosystemBusDrawer
        isOpen={isEcosystemDrawerOpen}
        onClose={() => setIsEcosystemDrawerOpen(false)}
        activeTopic="lifeline-os-alert-2026"
        onOpenSplitView={() => window.open(window.location.href, '_blank')}
      />

      {/* Statutory SDRF Form-3B Printable Sanction Order Modal */}
      <SanctionOrderModal
        isOpen={isSanctionModalOpen}
        onClose={() => setIsSanctionModalOpen(false)}
        currentTheater={currentTheater}
        activeInterventions={interventions}
      />

      {/* Bottom Floating Scenario Navigator & Investigation Workspace Dock */}
      <BottomScenarioNavigator
        activeScenarioId={(activeTheaterId === 'nepal' ? 'nepal' : 'silchar')}
        onSelectScenario={(id) => {
          setActiveTheaterId(id);
          setSelectedChokeIdx(0);
          const targetCoords = id === 'nepal' ? [27.525, 85.69] : [24.8333, 92.7789];
          setCameraCommand({
            id: `cmd_scenario_${id}_${Date.now()}`,
            type: 'point',
            center: targetCoords as [number, number],
            zoom: 12,
            duration: 1.2,
          });
        }}
        onRunSimulation={handleRunResponseSimulation}
        isSimulationRunning={isSimulationRunning}
        simulationProgress={simulationProgress}
        onOpenEvidenceCatalogue={() => setIsEvidenceModalOpen(true)}
        onOpenFieldEditor={() => setIsFieldEditorModalOpen(true)}
        viewMode={viewMode}
        onSelectViewMode={(mode) => setViewMode(mode)}
      />

      {/* Evidence Catalogue Modal */}
      <EvidenceCatalogueModal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        theaterId={activeTheaterId}
        theaterName={currentTheater.name}
      />

      {/* Field Evidence Editor Modal */}
      <FieldEvidenceEditorModal
        isOpen={isFieldEditorModalOpen}
        onClose={() => setIsFieldEditorModalOpen(false)}
        theaterId={activeTheaterId}
        theaterName={currentTheater.name}
      />
    </div>
  );
}

export default App;
