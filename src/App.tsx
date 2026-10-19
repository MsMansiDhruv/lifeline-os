import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { NavigationRail } from './components/NavigationRail';
import { RightContextualInspector } from './components/RightContextualInspector';
import { TelemetryDrawer } from './components/TelemetryDrawer';
import { InteractiveTourCoach } from './components/InteractiveTourCoach';
import { AutoDemoPlayer } from './components/AutoDemoPlayer';
import { LeafletMap, MapMarker, MapLine, CameraCommand } from './components/LeafletMap';

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
  getSelectedTelemetryRow,
} from './data/disasterData';
import { IncidentDamageReport } from './services/incidentReportService';
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
  getSettlementRoadFeeder,
  CorridorRoadNetwork,
} from './services/osrmRouting';
import { FleetMode } from './types';
import { EvidenceCatalogueModal } from './components/EvidenceCatalogueModal';
import { FieldEvidenceEditorModal } from './components/FieldEvidenceEditorModal';
import { CloudArchitectureModal } from './components/CloudArchitectureModal';
import { WhatWeDontKnowModal } from './components/WhatWeDontKnowModal';
import { SystemArchitectureModal } from './components/SystemArchitectureModal';
import { ASSAM_TELEMETRY_RESULTS } from './data/disasterData';
import { fieldEvidenceEditorService } from './services/fieldEvidenceEditorService';
import { FieldEditRecord } from './types/evidence';
import { playLaunchChime } from './services/audioService';
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
  MapPin,
  Layers,
  Database,
  HelpCircle,
  Cloud,
  Edit3,
  Network,
  Eye,
  EyeOff,
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
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

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

  // Satellite & Street & Dark Map View Mode
  const [viewMode, setViewMode] = useState<'map' | 'satellite' | 'street'>('map');
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(false);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [simulationProgress, setSimulationProgress] = useState<string>('');
  const [showHeroHeadline, setShowHeroHeadline] = useState<boolean>(false);
  const [showLiveDispatchBanner, setShowLiveDispatchBanner] = useState<boolean>(false);
  const [submittedReports, setSubmittedReports] = useState<FieldEditRecord[]>([]);

  // Live 6-Service Keyless Ecosystem Bus & Interoperability Modals
  const [isEcosystemDrawerOpen, setIsEcosystemDrawerOpen] = useState<boolean>(false);
  const [isSanctionModalOpen, setIsSanctionModalOpen] = useState<boolean>(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState<boolean>(false);
  const [isFieldEditorModalOpen, setIsFieldEditorModalOpen] = useState<boolean>(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState<boolean>(false);
  const [ecosystemState, setEcosystemState] = useState<EcosystemBusState>(ecosystemBus.getState());
  const [isSosDismissed, setIsSosDismissed] = useState<boolean>(false);
  const [isWhatWeDontKnowOpen, setIsWhatWeDontKnowOpen] = useState<boolean>(false);
  const [activeRightPopover, setActiveRightPopover] = useState<'layers' | 'evidence' | 'whatwedontknow' | 'cloud' | 'field' | 'architecture' | null>(null);
  const [cameraToast, setCameraToast] = useState<{ title: string; reason: string } | null>(null);

  const showCameraToast = (title: string, reason: string) => {
    setCameraToast({ title, reason });
    setTimeout(() => setCameraToast(null), 3000);
  };

  const handleExecuteDispatch = async () => {
    setIsLiveDispatched(true);
    setShowLiveDispatchBanner(true);
    playLaunchChime();

    const shortRoad = selectedChoke?.road_name ? selectedChoke.road_name.split(' (')[0] : 'Strategic Corridor';
    try {
      const res = await dispatchLivePhoneAlert({
        topic: 'lifeline-os-alert-2026',
        theaterName: currentTheater.name,
        corridorName: shortRoad,
        breachWidth: selectedChoke?.exposed_meters || 80,
        allocationTool: activeSelectedTool !== 'none' ? activeSelectedTool : 'bridge',
        nearestHospital: destHospital?.name || currentTheater.hospitals[0]?.name || 'Referral Hospital',
        detourMins: selectedChoke?.detour_travel_mins || 65,
        dryRoadheadName: `${shortRoad} North Roadhead`,
        humanApproved: true,
        idempotencyKey: `sanction_order_${currentTheater.id}_${selectedChoke?.id || 'primary'}_${activeSelectedTool}`,
      });

      ecosystemBus.broadcastTerminalAction('DISPATCH_BROADCAST', {
        ticketId: `SDRF/AS/2026/0842-${currentTheater.name.toUpperCase().slice(0, 6)}`,
        theater: currentTheater.name,
        corridor: shortRoad,
        tool: activeSelectedTool,
        status: 'SANCTIONED_BROADCAST',
        timestamp: new Date().toISOString(),
      });

      showCameraToast(
        'DISPATCH BROADCAST SANCTIONED',
        `Live Form-3B Statutory Order broadcast to SEOC & field units (${res.success ? 'Delivered via ntfy' : 'Broadcast Confirmed'})`
      );
    } catch {
      showCameraToast('DISPATCH BROADCAST', 'Form-3B Sanction Order broadcast across SEOC channels');
    }
  };

  const handleReportCreated = (edit: FieldEditRecord) => {
    setSubmittedReports((prev) => [edit, ...prev]);
    showCameraToast(edit.title, 'Field report logged and mapped');
    const repCoords: [number, number] = Array.isArray(edit.geometry?.coordinates)
      ? [edit.geometry.coordinates[1], edit.geometry.coordinates[0]]
      : [24.7891, 92.8124];
    setCameraCommand({
      id: `cmd_rep_${edit.id}_${Date.now()}`,
      type: 'point',
      center: repCoords,
      zoom: 15,
      duration: 0.9,
    });
  };

  // Default state: BEFORE / DANGER (breach severed, 42 villages disconnected, +47m detour)
  const [baselineAccessSliderValue, setBaselineAccessSliderValue] = useState<number>(100);
  const [isSimulatedClosureActive, setIsSimulatedClosureActive] = useState<boolean>(true);

  const handleToggleSimulatedClosure = () => {
    setIsSimulatedClosureActive((prev) => {
      const next = !prev;
      setBaselineAccessSliderValue(next ? 100 : 0);
      return next;
    });
  };

  const handleChangeAccessSlider = (val: number) => {
    setBaselineAccessSliderValue(val);
    setIsSimulatedClosureActive(val > 0);
  };

  // Panel width derived from sidebar state
  const panelWidth = isSidebarOpen ? 340 : 60;

  // Strict Map Camera Commands & Pulsing Target
  const [cameraCommand, setCameraCommand] = useState<CameraCommand | null>(null);
  const [pulsingTarget, setPulsingTarget] = useState<[number, number] | null>(null);

  // Active Disaster Theater State
  const [activeTheaterId, setActiveTheaterId] = useState<string>('silchar');
  const [customTheater, setCustomTheater] = useState<TheaterData | null>(null);
  const [inspectedDamageReport, setInspectedDamageReport] = useState<IncidentDamageReport | null>(null);

  const handleInspectDamageReport = (report: IncidentDamageReport) => {
    setInspectedDamageReport(report);
    triggerPointFocus({
      lat: report.coordinates[0],
      lon: report.coordinates[1],
      name: report.featureName,
    });
  };

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

  // Keyboard shortcut: 'H' or 'h' toggles sidebar (Zen mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'h' || e.key === 'H') {
        setIsSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Scenario Switcher with Strict State Isolation (Requirement 1)
  const handleSelectScenario = (id: string) => {
    setActiveTheaterId(id);
    setSelectedChokeIdx(0);
    setInspectedFeature(null);
    setInspectedDamageReport(null);
    setRerouteAmbulances(false);
    setActivateSurgeBeds(false);
    setIsBreachTemporarilyReopened(false);
    setIsLiveDispatched(false);
    setInterventions({});
    setDetourRoutePoints([]);
    setNormalRoutePoints([]);
    setBaselineAccessSliderValue(100);
    setIsSimulatedClosureActive(true);
    setShowLiveDispatchBanner(false);
    setActiveRightPopover(null);

    const nextTheater = THEATERS[id] || THEATERS.silchar;
    const lats = [nextTheater.center[0], ...nextTheater.chokePoints.map((c) => c.lat), ...nextTheater.hospitals.map((h) => h.lat)];
    const lons = [nextTheater.center[1], ...nextTheater.chokePoints.map((c) => c.lon), ...nextTheater.hospitals.map((h) => h.lon)];
    const bounds: [[number, number], [number, number]] = [
      [Math.min(...lats) - 0.03, Math.min(...lons) - 0.03],
      [Math.max(...lats) + 0.03, Math.max(...lons) + 0.03],
    ];
    setCameraCommand({
      id: `cmd_scenario_${id}_${Date.now()}`,
      type: 'bounds',
      bounds,
      duration: 1.0,
    });
    showCameraToast(nextTheater.name, 'Switched scenario workspace');
  };

  // Overview Camera Handler (Zoom 12)
  const handleResetOverview = () => {
    showCameraToast(currentTheater.name, 'Reset regional overview');
    setCameraCommand({
      id: `cmd_overview_${Date.now()}`,
      type: 'overview',
      center: currentTheater.center,
      zoom: 12,
      duration: 0.8,
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
    showCameraToast(cp.road_name.split(' (')[0], 'Strategic disruption corridor');
    setCameraCommand({
      id: `cmd_corridor_${cp.id}_${Date.now()}`,
      type: 'bounds',
      bounds: [
        [minLat, minLon],
        [maxLat, maxLon],
      ],
      paddingLeft: panelWidth + 50,
      zoom: 14,
      duration: 0.8,
    });
  };

  // Zoom in on Specific Hospital or Coordinate
  const triggerPointFocus = (coords: { lat: number; lon: number; name?: string }) => {
    setPulsingTarget([coords.lat, coords.lon]);
    showCameraToast(coords.name || 'Map Point', 'Inspecting map location');
    setCameraCommand({
      id: `cmd_point_${Date.now()}`,
      type: 'point',
      center: [coords.lat, coords.lon],
      zoom: 15,
      paddingLeft: panelWidth + 50,
      duration: 0.8,
    });
  };

  // 10-Second Response Simulation Sequence (Section 1 Brief Requirement: Disruption -> Consequence -> Decision)
  // 10-Second Response Simulation Sequence (Disruption -> Consequence -> Diversion Decision)
  const handleRunResponseSimulation = () => {
    if (isSimulationRunning) return;
    setIsSimulationRunning(true);
    // Running the simulation applies the (simulated) closure, so the map pins switch from BEFORE to AFTER.
    setBaselineAccessSliderValue(100);
    setIsSimulatedClosureActive(true);
    setSimulationStep(1);
    setActiveChapter('protect');
    setSelectedChokeIdx(0);
    setDetourRouteMode('baseline');
    setRerouteAmbulances(false);
    setIsBreachTemporarilyReopened(false);

    const isNepal = currentTheater.id === 'nepal';
    const cp = currentTheater.chokePoints[0] || selectedChoke;
    const dest = currentTheater.hospitals.find((h) => h.id === cp.nearest_hospital_id) || currentTheater.hospitals[0];
    const backupHosp = currentTheater.hospitals.find((h) => h.id !== dest?.id) || dest;
    const shortRoad = cp.id === 'jt_road' ? 'JT Road' : cp.road_name.split(' (')[0].replace(' Corridor', '').replace(' Breach', '');

    if (isNepal) {
      setSimulationProgress('0-3s: Roshi Gorge Washout • 120m Road Bed Swept into River');
      triggerPointFocus({ lat: cp.lat, lon: cp.lon, name: 'Km 48 Roshi Gorge Washout' });
    } else {
      setSimulationProgress(`0-3s: ${shortRoad} 80m Structural Breach Disrupted`);
      triggerPointFocus({ lat: cp.lat, lon: cp.lon, name: `${shortRoad} Breach Head` });
    }

    // Step 2 (3-6s): Reveal consequence (Target hospital cut off, isolated population)
    setTimeout(() => {
      setSimulationStep(2);
      if (isNepal) {
        setSimulationProgress('3-6s: 18 Hamlets Isolated (16.3k Pop) • Dhulikhel Cut Off (0 Road Bypass)');
      } else {
        setSimulationProgress(`3-6s: ${dest?.name?.split(' ')[0] || 'Hospital'} Cut Off • Detour +${cp.detour_travel_mins || 47}m`);
      }
      setDetourRouteMode('both');
      if (dest) {
        triggerPointFocus({ lat: dest.lat, lon: dest.lon, name: `${dest.name} Cut-Off Boundary` });
      }
    }, 3200);

    // Step 3 (6-10s): Demonstrates timely intervention saving lives
    setTimeout(() => {
      setSimulationStep(3);
      if (isNepal) {
        setSimulationProgress('6-10s: Timely Intervention: Deploying 120m Class-40 Modular Bridge');
        setInterventions({ [cp.id]: 'bridge' });
        setActiveChapter('respond');
        triggerPointFocus({ lat: cp.lat, lon: cp.lon, name: 'Nepal Army Modular Bridge Restoring Corridor' });
      } else {
        setSimulationProgress(`6-10s: Timely Intervention: Surge Detour to ${backupHosp?.name?.split(' ')[0] || 'Apex Hospital'} & Bailey Bridge Sanctioned`);
        setRerouteAmbulances(true);
        setInterventions({ [cp.id]: 'bridge' });
        setActiveChapter('respond');
        if (backupHosp) {
          triggerPointFocus({ lat: backupHosp.lat, lon: backupHosp.lon, name: backupHosp.name });
        }
      }
    }, 6400);

    // 10s: Complete simulation and log to immutable audit trail
    setTimeout(() => {
      setIsSimulationRunning(false);
      setSimulationStep(0);
      setSimulationProgress('');
      showCameraToast(
        'TIMELY INTERVENTION DEMONSTRATED',
        isNepal
          ? 'Roshi Gorge modular bridge re-established transit for 18 hamlets (16,300 pop) in 28 mins.'
          : 'Timely Bailey bridge sanction & ambulance diversion restored healthcare for 42 villages.'
      );
      auditService.recordAction({
        action_type: 'SCENARIO_CREATED',
        rationale: `Automated 10s response simulation executed for ${currentTheater.name}: Disruption -> Consequence -> Timely intervention demonstrated.`,
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

      const isVillageRescued =
        isBreachTemporarilyReopened ||
        activeSelectedTool === 'bridge' ||
        rerouteAmbulances ||
        activeSelectedTool === 'boat' ||
        activeSelectedTool === 'drone' ||
        activeSelectedTool === 'booth';

      const bannerText = isVillageRescued
        ? isBreachTemporarilyReopened || activeSelectedTool === 'bridge'
          ? `✓ RESCUED: ${village.name} (Direct Highway Connected)`
          : rerouteAmbulances
          ? `🚑 RESCUED: ${village.name} (Bypass Detour Active)`
          : activeSelectedTool === 'boat'
          ? `⛵ RESCUED: ${village.name} (Boat Shuttle Active)`
          : activeSelectedTool === 'drone'
          ? `🚁 RESCUED: ${village.name} (Drone Airbridge Active)`
          : `🏥 RESCUED: ${village.name} (Forward MMU Camp Active)`
        : `⛔ DISCONNECTED: ${village.name} (${popStr} Pop • 0 Road Corridors)`;

      list.push({
        lat: village.lat,
        lon: village.lon,
        title: village.name,
        type: isVillageRescued ? 'rerouted' : 'isolated',
        customBanner: bannerText,
        stepCategory: 'start',
        onClick: () => {
          setInspectedFeature({
            id: village.id || `v_${vIdx}`,
            type: 'village',
            title: village.name,
            subtitle: isVillageRescued
              ? `Reconnected Habitation • Rescued Road Access Active`
              : `Disconnected Rural Habitation • ${distFromBreachKm} km to Breach`,
            coordinates: [village.lat, village.lon],
            statusText: isVillageRescued ? 'RESCUED & CONNECTED' : 'COMMUNITY DISCONNECTED',
            statusColor: isVillageRescued ? 'emerald' : 'rose',
            evidenceClass: 'MODELLED',
            dataState: 'LIVE',
            metrics: [
              { label: 'Est. Population', value: `${popStr} Citizens`, color: isVillageRescued ? 'text-emerald-400' : 'text-amber-400' },
              {
                label: 'Isolation Status',
                value: isVillageRescued
                  ? isBreachTemporarilyReopened || activeSelectedTool === 'bridge'
                    ? 'Rescued: Bridge Highway Restored'
                    : rerouteAmbulances
                    ? 'Rescued: Detour Bypass Active'
                    : activeSelectedTool === 'boat'
                    ? 'Rescued: River Boat Shuttle'
                    : activeSelectedTool === 'drone'
                    ? 'Rescued: UAV Medical Airbridge'
                    : 'Rescued: Forward MMU Camp'
                  : 'Road Cut Off • Disconnected',
                color: isVillageRescued ? 'text-emerald-400' : 'text-rose-400',
              },
              {
                label: 'Trauma Access',
                value: isVillageRescued
                  ? isBreachTemporarilyReopened || activeSelectedTool === 'bridge'
                    ? '18 mins (Direct Highway Restored)'
                    : rerouteAmbulances
                    ? '65 mins (+47m Detour Bypass)'
                    : activeSelectedTool === 'boat'
                    ? '15 mins (Amphibious Shuttle)'
                    : activeSelectedTool === 'drone'
                    ? '12 mins (UAV Cargo)'
                    : '5 mins (Roadhead MMU)'
                  : 'NO ROUTE (Severed by Breach)',
              },
              { label: 'Distance to Breach', value: `${distFromBreachKm} km` },
            ],
            description: isVillageRescued
              ? `${village.name} has been rescued and reconnected! Emergency transit is established across the corridor.`
              : `Nearby rural population disconnected by the ${selectedChoke.road_name} flood breach. Direct road access to referral trauma care is severed.`,
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
            surgeText = '74% Balanced (260/350 Beds)';
          } else if (rerouteAmbulances) {
            surgeText = '74% Balanced (260/350 Beds)';
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
      const telRow = getSelectedTelemetryRow(selectedChoke?.road_name);
      const destBanner = isDirectRestored
        ? `${hospShort} Hospital (${surgeText.split(' ')[0]}) • ${telRow.baseline_km.toFixed(1)} km / ${Math.round(telRow.baseline_min)}m Direct Highway Restored`
        : `${hospShort} Hospital (${surgeText.split(' ')[0]}) • ${(telRow.scenario_km || 16.8).toFixed(1)} km / ${Math.round(telRow.scenario_min || 65.7)}m Detour (+${Math.round(telRow.additional_min || 46.7)}m Delay)`;

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

    // 5. User-Submitted Field Damage Reports
    submittedReports.forEach((rep) => {
      const repLat = Array.isArray(rep.geometry?.coordinates) ? rep.geometry.coordinates[1] : 24.7891;
      const repLon = Array.isArray(rep.geometry?.coordinates) ? rep.geometry.coordinates[0] : 92.8124;
      list.push({
        lat: repLat,
        lon: repLon,
        title: `📝 ${rep.title}`,
        type: 'chokepoint',
        description: `Field report: ${rep.title}. Reported by ${rep.author}. Condition: ${rep.reportedCondition}`,
        customBanner: `📝 Field Report: ${rep.title} • ${rep.reportedCondition} (${rep.reviewStatus})`,
        badge: 'FIELD REPORT',
        onClick: () => {
          setInspectedFeature({
            id: rep.id,
            type: 'chokepoint',
            title: rep.title,
            subtitle: `Reported by ${rep.author}`,
            coordinates: [repLat, repLon],
            statusText: `CONDITION: ${rep.reportedCondition} (${rep.reviewStatus})`,
            statusColor: 'amber',
            evidenceClass: 'REPORTED',
            dataState: 'LIVE',
            metrics: [
              { label: 'Type', value: rep.type.toUpperCase() },
              { label: 'Status', value: rep.reviewStatus },
              { label: 'Notes', value: rep.notes || 'No field notes' },
            ],
            description: `Field evidence report filed by ${rep.author} under statutory review. Condition: ${rep.reportedCondition}. Notes: ${rep.notes || 'N/A'}`,
          });
        },
      });
    });

    if (inspectedDamageReport) {
      list.push({
        lat: inspectedDamageReport.coordinates[0],
        lon: inspectedDamageReport.coordinates[1],
        title: `⛔ DESTROYED: ${inspectedDamageReport.featureName}`,
        customBanner: `⛔ DESTROYED: ${inspectedDamageReport.featureName}`,
        type: 'chokepoint',
        badge: 'FIELD REPORT',
      });
    }

    return list;
  }, [currentTheater, interventions, validIdx, selectedChoke, activeSelectedTool, destHospital, rerouteAmbulances, isBreachTemporarilyReopened, submittedReports, inspectedDamageReport]);

  // Master Map Lines (Authentic broken road hazard vs restored highway & multi-modal corridors)
  const masterMapLines: MapLine[] = useMemo(() => {
    const list: MapLine[] = [];
    if (!selectedChoke) return list;

    const allNearbyVillages =
      selectedChoke.villages && selectedChoke.villages.length > 0
        ? selectedChoke.villages
        : [
            {
              id: 'v_orig',
              name: `${selectedChoke.road_name.split(' ')[0]} Habitation`,
              lat: selectedChoke.lat + 0.014,
              lon: selectedChoke.lon + 0.012,
              population: Math.round(selectedChoke.trapped_villages_count * 116.66 * 4.8),
            },
          ];

    const targetHospCoords: [number, number] = destHospital
      ? [destHospital.lat, destHospital.lon]
      : [selectedChoke.lat - 0.04, selectedChoke.lon - 0.03];

    const junctionPoint: [number, number] =
      activeCorridorNet.northApproach[0] || [selectedChoke.lat + 0.005, selectedChoke.lon + 0.003];

    const finalizeList = (l: MapLine[]): MapLine[] => {
      if (inspectedDamageReport) {
        const [lat, lon] = inspectedDamageReport.coordinates;
        let damagedSegment: [number, number][];
        if (inspectedDamageReport.id === 'REP-CACHAR-002') {
          // Sonabarighat Culvert authentic road alignment along Sonai-Sonabarighat Road
          damagedSegment = [
            [24.7570, 92.7915],
            [24.7592, 92.7925],
            [24.7612, 92.7935],
            [24.7635, 92.7942],
            [24.7660, 92.7950],
          ];
        } else {
          damagedSegment = [
            [lat - 0.0035, lon - 0.0045],
            [lat - 0.0015, lon - 0.0020],
            [lat, lon],
            [lat + 0.0020, lon + 0.0025],
            [lat + 0.0040, lon + 0.0050],
          ];
        }
        l.push({
          id: `inspected_damaged_halo_${inspectedDamageReport.id}`,
          points: damagedSegment,
          color: '#f43f5e',
          weight: 16,
          className: 'animate-pulse',
          label: `🚨 DESTROYED / OVERTOPPED ROAD: ${inspectedDamageReport.featureName} (${inspectedDamageReport.roadName})`,
          layerType: 'severed',
        });
        l.push({
          id: `inspected_damaged_core_${inspectedDamageReport.id}`,
          points: damagedSegment,
          color: '#ffffff',
          weight: 6,
          dashArray: '8, 6',
          className: 'animate-pulse',
          label: `⛔ ${inspectedDamageReport.reportedCondition}`,
          layerType: 'severed',
        });
      }
      return l;
    };

    // Always provide clean pre-event baseline road network for the LEFT side of the swipe
    const baselinePoints = activeCorridorNet.fullRestored.length > 0
      ? activeCorridorNet.fullRestored
      : [...activeCorridorNet.northApproach, ...activeCorridorNet.breachGap, ...activeCorridorNet.southApproach];
    if (baselinePoints.length > 0) {
      list.push({
        id: 'corridor_clean_pre_event_baseline',
        points: baselinePoints,
        color: '#06b6d4',
        weight: 5,
        label: `[PRE-EVENT BASELINE] Normal Intact Highway (${selectedChoke.baseline_km} km • ${selectedChoke.baseline_travel_mins || 18}m)`,
        layerType: 'baseline',
      });
    }

    // 0. If temporary culvert / breach closure is simulated reopened:
    if (isBreachTemporarilyReopened) {
      allNearbyVillages.forEach((v) => {
        const feeder = getSettlementRoadFeeder(v.id, [v.lat, v.lon], junctionPoint);
        list.push({
          id: `rescued_path_culvert_${v.id}`,
          points: [...feeder, ...activeCorridorNet.fullRestored],
          color: '#10b981',
          weight: 5,
          label: `✓ RESCUED PATH: ${v.name} -> Temporary Culvert Restored -> ${destHospital?.name || 'Hospital'} (${selectedChoke.baseline_km} km • 18m)`,
          layerType: 'bridge',
        });
      });

      list.push({
        id: 'corridor_full_restored_highway',
        points: activeCorridorNet.fullRestored,
        color: '#10b981',
        weight: 6,
        label: `✓ TEMPORARY CULVERT ACTIVE: Direct Baseline Restored (${selectedChoke.baseline_km} km • ${selectedChoke.baseline_travel_mins || 18} mins)`,
        layerType: 'bridge',
      });
      list.push({
        id: 'corridor_steel_truss_span_restored',
        points: activeCorridorNet.breachGap,
        color: '#10b981',
        weight: 8,
        label: `✓ Culvert Restored (${selectedChoke.exposed_meters}m Gap Bridged)`,
        layerType: 'bridge',
      });
      return finalizeList(list);
    }

    // 1. When Bailey Bridge is Built: Green Restored Highway & Truss Span (ALL VILLAGES RESCUED & CONNECTED)
    if (activeSelectedTool === 'bridge') {
      allNearbyVillages.forEach((v) => {
        const feeder = getSettlementRoadFeeder(v.id, [v.lat, v.lon], junctionPoint);
        list.push({
          id: `rescued_path_bridge_${v.id}`,
          points: [...feeder, ...activeCorridorNet.fullRestored],
          color: '#10b981',
          weight: 5,
          label: `✓ RESCUED PATH: ${v.name} -> Bailey Bridge Restored Highway -> ${destHospital?.name || 'Hospital'} (${selectedChoke.baseline_km} km • 14 mins)`,
          layerType: 'bridge',
        });
      });

      list.push({
        id: 'corridor_full_restored_highway',
        points: activeCorridorNet.fullRestored,
        color: '#10b981',
        weight: 6,
        label: `✓ BAILEY BRIDGE ACTIVE: Full Direct Highway Access Restored (${selectedChoke.baseline_km} km • 14 mins)`,
        layerType: 'bridge',
      });

      // Steel truss span highlight across breach
      list.push({
        id: 'corridor_steel_truss_span_restored',
        points: activeCorridorNet.breachGap,
        color: '#10b981',
        weight: 8,
        className: 'animate-pulse',
        label: `✓ Class-40 Steel Modular Span (${selectedChoke.exposed_meters}m Gap Bridged • 16T IRC:6 Ready)`,
        layerType: 'bridge',
      });
      return finalizeList(list);
    }

    // 2. When Ambulance Rerouting (Detour Bypass) is Active: ALL VILLAGES RESCUED VIA DETOUR
    if (rerouteAmbulances) {
      allNearbyVillages.forEach((v) => {
        const feeder = getSettlementRoadFeeder(v.id, [v.lat, v.lon], junctionPoint);
        list.push({
          id: `rescued_path_detour_${v.id}`,
          points: [...feeder, ...activeCorridorNet.detour],
          color: '#0284c7',
          dashArray: '8, 6',
          weight: 5,
          label: `🚑 RESCUED DETOUR: ${v.name} -> Kumbhirgram Bypass -> SMCH Apex Hospital (${selectedChoke.detour_km} km • 65 mins)`,
          layerType: 'detour',
        });
      });

      list.push({
        id: 'emergency_detour_route',
        points: activeCorridorNet.detour,
        color: '#0284c7',
        dashArray: '10, 8',
        weight: 6,
        label: `🚑 ACTIVE AMBULANCE DIVERSION DETOUR: ${selectedChoke.detour_km} km Bypass to SMCH Apex (+${(
          selectedChoke.detour_km - selectedChoke.baseline_km
        ).toFixed(1)} km Bypass • ${selectedChoke.detour_travel_mins || 65} mins)`,
        layerType: 'detour',
      });

      // Specific fleet diversions
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

      // Breach gap remains severed
      list.push({
        id: 'corridor_breach_gap_hazard',
        points: activeCorridorNet.breachGap,
        color: '#ef4444',
        dashArray: '6, 6',
        weight: 6,
        label: `⛔ RIVER GAP SEVERED • ${selectedChoke.exposed_meters}m Water Barrier (Ambulances Rerouted via Bypass)`,
        layerType: 'severed',
      });
      return finalizeList(list);
    }

    // 3. When Hospital Camp (MMU) is Stationed: Yellow Camp Roadhead
    if (activeSelectedTool === 'booth') {
      allNearbyVillages.forEach((v) => {
        const feeder = getSettlementRoadFeeder(v.id, [v.lat, v.lon], junctionPoint);
        list.push({
          id: `rescued_path_mmu_${v.id}`,
          points: [...feeder, ...activeCorridorNet.northApproach],
          color: '#eab308',
          weight: 4,
          label: `🏥 RESCUED ACCESS: ${v.name} -> Forward Hospital Camp MMU`,
          layerType: 'catchment',
        });
      });

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
      return finalizeList(list);
    }

    // 4. When UAV Medical Drone is Deployed: Purple Airbridge
    if (activeSelectedTool === 'drone') {
      allNearbyVillages.forEach((v) => {
        list.push({
          id: `rescued_path_drone_${v.id}`,
          points: [targetHospCoords, [v.lat, v.lon]],
          color: '#a855f7',
          dashArray: '10, 8',
          weight: 4,
          label: `🚁 RESCUED VIA AIRBRIDGE: UAV Medical Delivery to ${v.name} (12 mins)`,
          layerType: 'drone',
        });
      });

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
      return finalizeList(list);
    }

    // 5. When NDRF Rescue Boat is Deployed: Blue Water Crossing
    if (activeSelectedTool === 'boat') {
      allNearbyVillages.forEach((v) => {
        const feeder = getSettlementRoadFeeder(v.id, [v.lat, v.lon], junctionPoint);
        list.push({
          id: `rescued_path_boat_feeder_${v.id}`,
          points: [...feeder, ...activeCorridorNet.northApproach],
          color: '#0284c7',
          weight: 4,
          label: `⛵ RESCUED ACCESS: ${v.name} -> Northern Boat Slipway`,
          layerType: 'boat',
        });
      });

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

      if (activeCorridorNet.southApproach.length > 0) {
        list.push({
          id: 'corridor_boat_hospital_transfer',
          points: [activeCorridorNet.southApproach[activeCorridorNet.southApproach.length - 1], targetHospCoords],
          color: '#0284c7',
          weight: 4,
          label: `Ambulance Transfer: Boat Slipway -> ${destHospital?.name || 'Hospital'} (12 mins)`,
          layerType: 'boat',
        });
      }

      // Breach gap remains severed
      list.push({
        id: 'corridor_breach_gap_hazard',
        points: activeCorridorNet.breachGap,
        color: '#ef4444',
        dashArray: '6, 6',
        weight: 5,
        label: `RIVER GAP SEVERED • ${selectedChoke.exposed_meters}m Flood Barrier`,
        layerType: 'severed',
      });
      return finalizeList(list);
    }

    // 6. When NO Fix Applied (activeSelectedTool === 'none'): Visibly SEVERED broken pathways on actual roads!
    const showBaseline = detourRouteMode === 'both' || detourRouteMode === 'baseline';
    const showDetour = detourRouteMode === 'both' || detourRouteMode === 'detour';

    if (showBaseline) {
      // Feeder connector roads on actual roads for each disconnected habitation
      allNearbyVillages.forEach((v) => {
        const feeder = getSettlementRoadFeeder(v.id, [v.lat, v.lon], junctionPoint);
        list.push({
          id: `corridor_feeder_village_${v.id}`,
          points: feeder,
          color: '#f59e0b',
          weight: 4,
          label: `Actual Road Feeder: ${v.name} -> Highway Approach (Disconnected)`,
          layerType: 'baseline',
        });
      });

      // North Approach highway
      list.push({
        id: 'corridor_north_approach',
        points: activeCorridorNet.northApproach,
        color: '#f59e0b',
        weight: 5,
        label: `Approach Highway: Habitations to Breach (${selectedChoke.trapped_villages_count} Disconnected Settlements)`,
        layerType: 'baseline',
      });

      // Severed Breach Gap (pulsing red hazard gap over submerged deck)
      list.push({
        id: 'corridor_breach_gap_hazard',
        points: activeCorridorNet.breachGap,
        color: '#ef4444',
        dashArray: '6, 6',
        weight: 7,
        label: `⛔ ROAD SEVERED • ${selectedChoke.exposed_meters}m WASHOUT GAP (Bridge Deck Submerged)`,
        layerType: 'severed',
      });

      // South Approach (from water abutment into hospital district)
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

    return finalizeList(list);
  }, [selectedChoke, activeSelectedTool, activeCorridorNet, rerouteAmbulances, detourRouteMode, isBreachTemporarilyReopened, currentTheater, destHospital, inspectedDamageReport]);

  // 5 Operational Command Chapters definition
  const coreSteps = [
    {
      id: 'chapter1_prevent',
      label: 'PREVENT',
      desc: 'Cut-Edges & Road Severance',
      icon: ShieldAlert,
    },
    {
      id: 'chapter2_predict',
      label: 'PREDICT',
      desc: 'Evidence & Data Coverage',
      icon: Waves,
    },
    {
      id: 'chapter3_protect',
      label: 'PROTECT',
      desc: 'Hospital Surge & START Triage',
      icon: Activity,
    },
    {
      id: 'chapter4_respond',
      label: 'RESPOND',
      desc: 'Constrained Allocation & Dispatch',
      icon: Sliders,
    },
    {
      id: 'chapter5_learn',
      label: 'LEARN',
      desc: 'Audit Trail & Benchmarks',
      icon: History,
    },
  ];

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#080D16] text-[#E8EEF7] font-sans select-none">
      {/* 1. COMPACT GLOBAL HEADER (56px) */}
      <Header
        hideAllPanels={!isSidebarOpen}
        onToggleHideAllPanels={() => setIsSidebarOpen((prev) => !prev)}
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
        onOpenArchitecture={() => setActiveRightPopover(prev => prev === 'architecture' ? null : 'architecture')}
        onOpenCloudModal={() => setIsCloudModalOpen(true)}
        onOpenWhatWeDontKnow={() => setIsWhatWeDontKnowOpen(true)}
        activeTheaterId={activeTheaterId}
        onSelectTheater={handleSelectScenario}
        customTheater={customTheater}
        onLoadCustomTheater={(th) => {
          setCustomTheater(th);
          handleSelectScenario('custom');
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
        onSelectViewMode={(mode) => setViewMode(mode)}
        onOpenReportEditor={() => setIsFieldEditorModalOpen(true)}
        pendingReportCount={
          fieldEvidenceEditorService.getEditsByTheater(activeTheaterId).filter((e) => e.reviewStatus === 'SUBMITTED').length + submittedReports.length
        }
        onRunResponseSimulation={handleRunResponseSimulation}
        isSimulationRunning={isSimulationRunning}
        simulationProgress={simulationProgress}
        onResetOverview={handleResetOverview}
      />

      {/* Real Live Dispatch Broadcast Alert Banner */}
      {isLiveDispatched && showLiveDispatchBanner && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[2500] max-w-2xl w-full px-4 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <div className="p-3 rounded-xl bg-[#0E1625]/95 border border-[#22C58B] shadow-2xl backdrop-blur-2xl flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#22C58B]/20 border border-[#22C58B]/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-[#22C58B] animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-[#22C58B] text-[#080D16]">
                    LIVE DISPATCH SANCTIONED
                  </span>
                  <span className="text-[10px] font-mono text-[#22C58B] font-semibold">
                    Form-3B Broadcast Active
                  </span>
                </div>
                <p className="text-xs text-[#9AAAC0] font-sans">
                  Tactical dispatch order transmitted to PWD, Army Engr Regt, NDRF &amp; State Health Command. Units Mobilized.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowLiveDispatchBanner(false)}
              className="p-1 rounded-lg text-[#74859D] hover:text-[#E8EEF7] hover:bg-[#182437] shrink-0 cursor-pointer"
              title="Dismiss dispatch banner"
            >
              <ChevronLeft className="w-4 h-4 rotate-90" />
            </button>
          </div>
        </div>
      )}

      {/* 2. MAIN WORKSPACE FLEX CONTAINER */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Navigation Rail (vertical ~60px) */}
        <NavigationRail
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
            if (!isSidebarOpen) setIsSidebarOpen(true);
          }}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />

        {/* Left Contextual Sidebar (~320px) */}
        {isSidebarOpen && (
          <aside className="w-[320px] lg:w-[340px] shrink-0 h-full bg-[#0E1625] border-r border-[#26364B] flex flex-col overflow-hidden z-10 transition-all duration-200">
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
                handleExecuteDispatch();
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
              onSelectTheater={(tId) => handleSelectScenario(tId)}
              onInspectDamageReport={handleInspectDamageReport}
            />
          </aside>
        )}

        {/* Central Map Canvas (Takes flex-1, resizes smoothly!) */}
        <main className="flex-1 h-full min-w-0 relative bg-[#080D16] overflow-hidden">
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
            panelWidth={isSidebarOpen ? 340 : 60}
            pulsingTarget={pulsingTarget}
            onResetOverview={handleResetOverview}
            isWindVisualized={ecosystemState.weather.wind_speed_10m > 30 || isSimulatedHighWind}
            windSpeed={isSimulatedHighWind ? 52.4 : ecosystemState.weather.wind_speed_10m}
            fieldSosEvents={ecosystemState.activeSosEvents}
            mapMode={viewMode === 'map' ? 'vector' : viewMode}
            onMapModeChange={(mode) => setViewMode(mode === 'vector' ? 'map' : mode)}
            rerouteAmbulances={rerouteAmbulances}
            isBreachTemporarilyReopened={isBreachTemporarilyReopened}
            onToggleBreachTemporarilyReopened={() => setIsBreachTemporarilyReopened((prev) => !prev)}
            isSimulationRunning={isSimulationRunning}
            baselineAccessSliderValue={baselineAccessSliderValue}
            onSelectFeature={(feat) => setInspectedFeature(feat)}
          />
        </main>

        {/* Right Contextual Inspector (REAL layout column!) */}
        {inspectedFeature && (
          <aside className="w-[320px] lg:w-[340px] shrink-0 h-full bg-[#0E1625] border-l border-[#26364B] flex flex-col overflow-hidden z-10 transition-all duration-200">
            <RightContextualInspector
              feature={inspectedFeature}
              onClose={() => setInspectedFeature(null)}
              onFocusCoordinates={(coords) =>
                triggerPointFocus({ lat: coords[0], lon: coords[1], name: inspectedFeature.title })
              }
            />
          </aside>
        )}
      </div>

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

      {/* Inbound Live Field SOS Notification */}
      {ecosystemState.lastInboundSos && !isSosDismissed && (
        <div className="fixed top-20 right-6 z-40 max-w-sm p-3 rounded-xl bg-[#0E1625]/95 border border-[#F06472] text-[#E8EEF7] shadow-2xl backdrop-blur-md animate-in slide-in-from-top-3 select-none">
          <div className="flex items-center justify-between gap-3 border-b border-[#26364B] pb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F06472] animate-ping shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#F06472]">
                Live Distress Beacon
              </span>
              <span className="text-[9px] font-mono bg-[#182437] px-1 py-0.5 rounded text-[#9AAAC0] border border-[#26364B]">
                {ecosystemState.lastInboundSos.sender}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsSosDismissed(true)}
              className="text-[#74859D] hover:text-[#E8EEF7] p-0.5 rounded hover:bg-[#182437] text-xs font-bold cursor-pointer"
              title="Dismiss alert"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-[#9AAAC0] mt-1.5 font-medium leading-relaxed truncate">
            "{ecosystemState.lastInboundSos.message}"
          </p>
          <div className="text-[10px] text-[#13B8D5] font-mono mt-1.5 flex items-center justify-between">
            <span>Beacon Pinned on Tactical Map</span>
            <span className="text-[#74859D]">
              {ecosystemState.lastInboundSos.lat.toFixed(4)}, {ecosystemState.lastInboundSos.lon.toFixed(4)}
            </span>
          </div>
        </div>
      )}

      {/* Ecosystem Service Bus Inspector Drawer */}
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
        onApproveAndDispatch={handleExecuteDispatch}
      />

      {/* Toast notification for camera movement */}
      {cameraToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[3000] bg-[#0E1625]/95 border border-[#13B8D5]/50 shadow-2xl rounded-lg px-4 py-2 flex items-center gap-2 text-xs text-[#E8EEF7] animate-in fade-in slide-in-from-top-2 duration-200">
          <MapPin className="w-3.5 h-3.5 text-[#13B8D5] shrink-0" />
          <span>
            <strong className="text-white">{cameraToast.title}</strong>: {cameraToast.reason}
          </span>
        </div>
      )}

      {/* Evidence Catalogue Modal */}
      <EvidenceCatalogueModal
        isOpen={activeRightPopover === 'evidence' || isEvidenceModalOpen}
        onClose={() => {
          setIsEvidenceModalOpen(false);
          if (activeRightPopover === 'evidence') setActiveRightPopover(null);
        }}
        theaterId={activeTheaterId}
        theaterName={currentTheater.name}
      />

      {/* Field Evidence Editor Modal */}
      <FieldEvidenceEditorModal
        isOpen={activeRightPopover === 'field' || isFieldEditorModalOpen}
        onClose={() => {
          setIsFieldEditorModalOpen(false);
          if (activeRightPopover === 'field') setActiveRightPopover(null);
        }}
        theaterId={activeTheaterId}
        theaterName={currentTheater.name}
        onReportCreated={handleReportCreated}
      />

      {/* Google Cloud Platform & Gemini MCP Architecture Modal */}
      <CloudArchitectureModal
        isOpen={activeRightPopover === 'cloud' || isCloudModalOpen}
        onClose={() => {
          setIsCloudModalOpen(false);
          if (activeRightPopover === 'cloud') setActiveRightPopover(null);
        }}
        activeTheaterName={currentTheater.name}
      />

      {/* Epistemic Uncertainty Modal */}
      <WhatWeDontKnowModal
        isOpen={activeRightPopover === 'whatwedontknow' || isWhatWeDontKnowOpen}
        onClose={() => {
          setIsWhatWeDontKnowOpen(false);
          if (activeRightPopover === 'whatwedontknow') setActiveRightPopover(null);
        }}
      />

      {/* Lifeline OS System Architecture & Interactive Process Flow Modal */}
      {activeRightPopover === 'architecture' && (
        <SystemArchitectureModal
          isOpen={true}
          onClose={() => setActiveRightPopover(null)}
        />
      )}
    </div>
  );
}

export default App;
