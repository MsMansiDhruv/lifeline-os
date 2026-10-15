import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { TelemetryDrawer } from './components/TelemetryDrawer';
import { InteractiveTourCoach } from './components/InteractiveTourCoach';
import { AutoDemoPlayer } from './components/AutoDemoPlayer';
import { LeafletMap, MapMarker, MapLine } from './components/LeafletMap';

// 5 Clean Operational Steps (No confusing Dives sub-bar)
import { Step1Bottlenecks } from './components/UnifiedSteps/Step1Bottlenecks';
import { Step2HospitalSurge } from './components/UnifiedSteps/Step2HospitalSurge';
import { Step3ReliefCohorts, DRY_RELIEF_CAMPS } from './components/UnifiedSteps/Step3ReliefCohorts';
import { Step4RoiGroundTruth } from './components/UnifiedSteps/Step4RoiGroundTruth';
import { Step5DmSanction } from './components/UnifiedSteps/Step5DmSanction';

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
import { getOsrmRoute } from './services/osrmRouting';
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
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  CheckCircle2,
  RotateCcw,
  Users,
  FileCheck,
} from 'lucide-react';

export function App() {
  const [fleetMode, setFleetMode] = useState<FleetMode>('Light Emergency (Ambulance/4x4)');
  const [statusFilter, setStatusFilter] = useState<string>('All Critical');
  const [activeStep, setActiveStep] = useState<string>('step1_bottlenecks');
  const [isTelemetryOpen, setIsTelemetryOpen] = useState<boolean>(false);
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState<boolean>(false);

  // Active Disaster Theater State
  const [activeTheaterId, setActiveTheaterId] = useState<string>('silchar');
  const [customTheater, setCustomTheater] = useState<TheaterData | null>(null);

  // Multi-Tool Sandbox Interventions: chokePointId -> tool
  const [interventions, setInterventions] = useState<Record<string, InterventionType>>({});

  // Focused corridor index for zooming and trapped village display
  const [selectedChokeIdx, setSelectedChokeIdx] = useState<number>(0);

  // Real OSRM driving routes state
  const [normalRoutePoints, setNormalRoutePoints] = useState<[number, number][]>([]);
  const [detourRoutePoints, setDetourRoutePoints] = useState<[number, number][]>([]);

  // Tour & Presentation States
  const [tourMode, setTourMode] = useState<'none' | 'interactive' | 'autodemo'>('none');
  const [interactiveTask, setInteractiveTask] = useState<number>(1);
  const [autoDemoSceneIdx, setAutoDemoSceneIdx] = useState<number>(0);
  const [opsMode, setOpsMode] = useState<'day' | 'night'>('day');

  const handleStartInteractiveTour = () => {
    setTourMode('interactive');
    setInteractiveTask(1);
    setActiveStep('step1_bottlenecks');
    setIsDrawerCollapsed(false);
    setInterventions({});
    setFleetMode('Light Emergency (Ambulance/4x4)');
    setSelectedChokeIdx(0);
  };

  const handleStartAutoDemo = () => {
    setTourMode('autodemo');
    setAutoDemoSceneIdx(0);
    setActiveStep('step1_bottlenecks');
    setIsDrawerCollapsed(false);
  };

  const handleNextInteractiveTask = () => {
    if (interactiveTask === 1) {
      // Tour Stop 1 -> 2: Highlights Bailey Bridge on Card #1 (JT Road)
      setActiveStep('step1_bottlenecks');
      setSelectedChokeIdx(0);
      setInteractiveTask(2);
    } else if (interactiveTask === 2) {
      // Tour Stop 2 -> 3: Deploys Bailey Bridge ₹72L on JT Road, connects road to Valley Hospital
      setActiveStep('step1_bottlenecks');
      setSelectedChokeIdx(0);
      setInterventions({ jt_road: 'bridge' });
      setInteractiveTask(3);
    } else if (interactiveTask === 3) {
      // Tour Stop 3 -> 4: Step 2: Hospital Surge & Emergency Stabilization
      setActiveStep('step2_surge');
      setInteractiveTask(4);
    } else if (interactiveTask === 4) {
      // Tour Stop 4 -> 5: Step 3: Relief Camps & Vulnerable Cohorts
      setActiveStep('step3_relief');
      setInteractiveTask(5);
    } else if (interactiveTask === 5) {
      // Tour Stop 5 -> 6: Step 5 DM Sanction
      setActiveStep('step5_sanction');
      setInteractiveTask(6);
    }
  };

  // Automated scene actions for hands-free Auto-Demo (5 core scenes per NDMA Commander standard)
  useEffect(() => {
    if (tourMode !== 'autodemo') return;

    if (autoDemoSceneIdx === 0) {
      // Scene 1: The Cut-Edge Crisis: JT Road Breach
      setInterventions({});
      setFleetMode('Light Emergency (Ambulance/4x4)');
      setActiveStep('step1_bottlenecks');
      setSelectedChokeIdx(0); // JT Road
      setActiveTheaterId('silchar');
    } else if (autoDemoSceneIdx === 1) {
      // Scene 2: 16T Heavy Truck Breakdown
      setFleetMode('Heavy Supply (Truck/Bus)');
      setActiveStep('step1_bottlenecks');
      setSelectedChokeIdx(2); // Korkoli mud chokes
    } else if (autoDemoSceneIdx === 2) {
      // Scene 3: Deploy ₹72L PWD Bailey Bridge
      setActiveStep('step1_bottlenecks');
      setSelectedChokeIdx(0); // JT Road
      setInterventions({ jt_road: 'bridge' });
    } else if (autoDemoSceneIdx === 3) {
      // Scene 4: Deploy Mobile Medical Health Booth & Check Hospital Surge
      setActiveStep('step2_surge');
      setSelectedChokeIdx(1); // Harinagar
      setInterventions({ jt_road: 'bridge', harinagar: 'booth' });
    } else if (autoDemoSceneIdx === 4) {
      // Scene 5: Relief Camps & Cohorts
      setActiveStep('step3_relief');
    } else if (autoDemoSceneIdx === 5) {
      // Scene 6: Full DM Sanction Order
      setActiveStep('step5_sanction');
    }
  }, [tourMode, autoDemoSceneIdx]);

  const currentTheater =
    activeTheaterId === 'custom' && customTheater
      ? customTheater
      : THEATERS[activeTheaterId] || THEATERS.silchar;

  const isHeavy = fleetMode.includes('Heavy') || fleetMode.includes('16T');

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

  const handleFleetChange = (mode: FleetMode) => {
    setFleetMode(mode);
    if (tourMode === 'interactive' && interactiveTask === 2) {
      setInteractiveTask(3);
    }
  };

  const handleSelectChokeIdx = (idx: number) => {
    setSelectedChokeIdx(idx);
    if (tourMode === 'interactive' && interactiveTask === 1 && idx === 0) {
      setInteractiveTask(2);
    }
  };

  const handleSetIntervention = (chokePointId: string, tool: InterventionType) => {
    setInterventions((prev) => ({
      ...prev,
      [chokePointId]: tool,
    }));
    if (tourMode === 'interactive' && interactiveTask === 2 && tool === 'bridge') {
      setTimeout(() => setInteractiveTask(3), 600);
    }
  };

  const handleResetInterventions = () => {
    setInterventions({});
  };

  // Selected choke point object
  const validIdx = Math.min(selectedChokeIdx, Math.max(0, currentTheater.chokePoints.length - 1));
  const selectedChoke: TheaterChokePoint = currentTheater.chokePoints[validIdx] || currentTheater.chokePoints[0];
  const activeSelectedTool = interventions[selectedChoke?.id || ''] || 'none';

  // REQUIREMENT 4: Real driving route geometry from OSRM (NO STRAIGHT LINES MERGING IN MID-AIR)
  // Specific destination hospital for the active corridor
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
    if (selectedChoke.id === 'borkhola_link') {
      return currentTheater.hospitals.find((h) => h.id === 'smch') || currentTheater.hospitals[0];
    }
    return currentTheater.hospitals[0];
  }, [selectedChoke, currentTheater.hospitals]);

  // REQUIREMENT 4: Dynamic 1-sentence Plain Story Explanation
  const currentStoryText = useMemo(() => {
    if (!selectedChoke) return '';
    const destName = destHospital?.name || 'Hospital';
    const villagesName =
      selectedChoke.villages?.[0]?.name || `${selectedChoke.road_name.split(' ')[0]} Villages`;
    const roadName = selectedChoke.road_name;
    const villagesCount = selectedChoke.trapped_villages_count;
    const baseKm = selectedChoke.baseline_km;
    const detourKm = selectedChoke.detour_km;
    const detourTimeMin = Math.round(detourKm * 3.0);
    const baseTimeMin = Math.round(baseKm * 1.7);

    if (activeSelectedTool === 'none') {
      return `🔴 3-STEP FLOOD IMPACT: 📍 ${villagesName} (${villagesCount} Villages Trapped) ➔ ❌ STOPPED AT: ${roadName} (Underwater) ➔ 🚗 FORCED TO DETOUR: ${detourKm} km Mud Track (+${detourTimeMin} min) to ${destName}`;
    }
    if (activeSelectedTool === 'bridge') {
      return `🟢 3-STEP CORRIDOR RESTORED: 📍 ${villagesName} ➔ 🛠️ BAILEY BRIDGE INSTALLED ➔ 🚑 DIRECT ACCESS RESTORED: ${baseKm} km (${baseTimeMin} min) straight to ${destName}!`;
    }
    if (activeSelectedTool === 'booth') {
      return `🟡 LOCAL TRIAGE ACTIVE: 📍 ${villagesName} ➔ ⛺ 6-HOUR TENT CLINIC DEPLOYED ➔ 🩺 75% Patients treated locally without taking ${detourKm} km Detour!`;
    }
    if (activeSelectedTool === 'drone') {
      return `🟣 SKY CORRIDOR ACTIVE: 📍 ${villagesName} ➔ 🚁 UAV AIRBRIDGE ➔ 📦 12-Min Blood & Antivenom delivery bypassing flood water!`;
    }
    if (activeSelectedTool === 'boat') {
      return `🔵 WATER BRIDGE ACTIVE: 📍 ${villagesName} ➔ 🚤 TACTICAL BOAT FERRY ➔ ⚓ Evacuating critical patients across flooded gap to waiting ambulances!`;
    }
    return '';
  }, [selectedChoke, activeSelectedTool, destHospital]);

  // REQUIREMENT 3: Real driving route geometry from OSRM & Pre-Cached Vectors
  useEffect(() => {
    if (!selectedChoke) return;

    const originVillage = selectedChoke.villages?.[0] || {
      id: 'v_orig',
      name: `${selectedChoke.road_name} Habitation`,
      lat: selectedChoke.lat + 0.014,
      lon: selectedChoke.lon + 0.012,
    };

    const brokenBridge: [number, number] = [selectedChoke.lat, selectedChoke.lon];
    const isSilchar = currentTheater.id === 'silchar';
    const isAhmed = currentTheater.id.includes('ahmed');

    const baselineCacheId =
      isSilchar && selectedChoke.id === 'jt_road'
        ? 'silchar_jt_road_baseline'
        : isSilchar && selectedChoke.id === 'harinagar'
        ? 'silchar_harinagar_baseline'
        : isSilchar && selectedChoke.id === 'korkoli_causeway'
        ? 'silchar_korkoli_causeway_baseline'
        : isSilchar && selectedChoke.id === 'borkhola_link'
        ? 'silchar_borkhola_link_baseline'
        : isAhmed && selectedChoke.id.includes('ellis')
        ? 'ahmedabad_ellis_baseline'
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
        : isAhmed && selectedChoke.id.includes('ellis')
        ? 'ahmedabad_ellis_detour'
        : undefined;

    // 1. Normal route: Village through Broken Bridge all the way to Target Hospital (Requirement 3)
    const targetHospCoords: [number, number] = destHospital
      ? [destHospital.lat, destHospital.lon]
      : brokenBridge;

    getOsrmRoute([originVillage.lat, originVillage.lon], targetHospCoords, {
      cacheId: baselineCacheId,
      detourCurvature: 0.003,
    }).then((pts) => {
      setNormalRoutePoints(pts);
    });

    // 2. Emergency Detour route: Village around floodwaters to Destination Hospital
    if (destHospital) {
      getOsrmRoute([originVillage.lat, originVillage.lon], [destHospital.lat, destHospital.lon], {
        cacheId: detourCacheId,
        detourCurvature: 0.012,
      }).then((pts) => {
        setDetourRoutePoints(pts);
      });
    }
  }, [selectedChoke?.id, currentTheater.id, destHospital]);

  // Master Map Center & Zoom: Focus on selected choke point or theater center
  const mapCenter: [number, number] = useMemo(() => {
    if (selectedChoke && activeStep === 'step1_bottlenecks') {
      return [selectedChoke.lat, selectedChoke.lon];
    }
    if (activeStep === 'step2_surge' && currentTheater.hospitals.length > 0) {
      return [currentTheater.hospitals[0].lat, currentTheater.hospitals[0].lon];
    }
    return currentTheater.center;
  }, [selectedChoke, activeStep, currentTheater.center, currentTheater.hospitals]);

  const mapZoom = useMemo(() => {
    if (activeStep === 'step1_bottlenecks' && selectedChoke) {
      return 13;
    }
    if (activeStep === 'step2_surge') {
      return 12;
    }
    return currentTheater.zoom;
  }, [activeStep, selectedChoke, currentTheater.zoom]);

  // REQUIREMENT 3: "ONE STORY AT A TIME" Master Map Markers Computation
  const masterMapMarkers: MapMarker[] = useMemo(() => {
    const list: MapMarker[] = [];
    if (!selectedChoke) return list;

    // 1. Choke points: Dim unselected choke points to 10px quiet dots!
    currentTheater.chokePoints.forEach((cp, idx) => {
      const isSelected = idx === validIdx && activeStep === 'step1_bottlenecks';
      const tool = interventions[cp.id] || 'none';

      if (!isSelected) {
        // Quiet 10px dot for other 3 bridges (NO floating text box)
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

      // ACTIVE CHOKE POINT: STEP B BROKEN BRIDGE / FIX PIN (Requirement 2 & 4)
      let markerType: MapMarker['type'] = 'chokepoint';
      const shortRoad = cp.id === 'jt_road' ? 'JT Road' : cp.road_name.split(' (')[0].replace(' Corridor', '').replace(' Breach', '');
      let bannerText = `❌ BREACH: ${shortRoad} Cut`;
      let badge = `${cp.trapped_villages_count} CUT`;

      if (activeSelectedTool === 'bridge') {
        markerType = 'bridge';
        bannerText = `🛠️ FIX: ${shortRoad} Bailey Bridge`;
        badge = '16T CAPABLE';
      } else if (activeSelectedTool === 'booth') {
        markerType = 'booth';
        bannerText = `⛺ CLINIC: ${shortRoad} Booth`;
        badge = 'FORWARD CLINIC';
      } else if (activeSelectedTool === 'drone') {
        markerType = 'drone';
        bannerText = `🚁 DRONE: ${shortRoad} Airbridge`;
        badge = 'AIRBRIDGE';
      } else if (activeSelectedTool === 'boat') {
        markerType = 'boat';
        bannerText = `🚤 FERRY: ${shortRoad} Boat`;
        badge = 'WATER SHUTTLE';
      }

      list.push({
        lat: cp.lat,
        lon: cp.lon,
        title: cp.road_name,
        description: `${cp.exposed_meters}m breach • Baseline ${cp.baseline_km}km vs Detour ${cp.detour_km}km`,
        type: markerType,
        badge,
        customBanner: bannerText,
        stepCategory: 'choke',
      });
    });

    // 2. ACTIVE CORRIDOR'S TRAPPED VILLAGE CLUSTER (STEP A - Requirement 2 & 4)
    const originVillage = selectedChoke.villages?.[0] || {
      id: 'v_orig',
      name: `${selectedChoke.road_name.split(' ')[0]} Villages`,
      lat: selectedChoke.lat + 0.014,
      lon: selectedChoke.lon + 0.012,
      population: 3800,
    };

    const isCorridorFixed = activeSelectedTool === 'bridge' || activeSelectedTool === 'booth';
    const villageShortName = originVillage.name.split(' ')[0];
    const villageBanner = `🟠 START: ${villageShortName} (${selectedChoke.trapped_villages_count} Villages Cut)`;

    list.push({
      lat: originVillage.lat,
      lon: originVillage.lon,
      title: originVillage.name,
      description: `Population: ${originVillage.population?.toLocaleString() || '3,800'} • Dependent on ${selectedChoke.road_name}`,
      type: isCorridorFixed ? 'reachable' : 'isolated',
      badge: isCorridorFixed ? 'RECONNECTED' : 'TRAPPED',
      customBanner: villageBanner,
      stepCategory: 'start',
    });

    // 3. BRIDGE ABUTMENT GEOMETRY (Requirement 4: North and South Dry Abutments)
    const northAbutment = [selectedChoke.lat + 0.0022, selectedChoke.lon + 0.0022] as [number, number];
    const southAbutment = [selectedChoke.lat - 0.0022, selectedChoke.lon - 0.0022] as [number, number];

    list.push({
      lat: northAbutment[0],
      lon: northAbutment[1],
      title: 'North Dry Abutment',
      description: 'Elevation: 41m ASL • PWD Structural Anchorage Pad',
      type: 'chokepoint',
      badge: '41m ASL',
      customBanner: '📐 North Abutment (41m ASL)',
      stepCategory: 'choke',
    });

    list.push({
      lat: southAbutment[0],
      lon: southAbutment[1],
      title: 'South Dry Abutment',
      description: 'Elevation: 40m ASL • PWD Structural Anchorage Pad',
      type: 'chokepoint',
      badge: '40m ASL',
      customBanner: '📐 South Abutment (40m ASL)',
      stepCategory: 'choke',
    });

    // 4. HOSPITALS: Show ONLY 1 TARGET HOSPITAL banner; dim all other 3 hospitals (Requirement 2)
    currentTheater.hospitals.forEach((hosp) => {
      const isDest = hosp.id === destHospital?.id;

      if (!isDest) {
        // ALWAYS dim unselected hospitals to quiet 8px dots with NO floating text box
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

      // Active Single Destination Hospital: STEP C (Clean label under 5 words - Requirement 2 & 4)
      const isRelieved = activeSelectedTool === 'bridge' || activeSelectedTool === 'booth';
      const hospShortName = hosp.name.split(' ')[0];
      const destBanner = `🏥 TARGET: ${hospShortName} Hospital`;
      const badgeText = isRelieved ? 'STABLE' : 'CRITICAL DELAY';

      list.push({
        lat: hosp.lat,
        lon: hosp.lon,
        title: hosp.name,
        description: `${hosp.beds} beds • Intake status: ${isRelieved ? '100% Stable' : '+191% ER Overload'}`,
        type: 'facility',
        badge: badgeText,
        customBanner: destBanner,
        stepCategory: 'dest',
      });
    });

    // 5. Dry Government School Relief Camps (Plotted when in Step 3 Relief & Cohorts)
    if (activeStep === 'step3_relief') {
      DRY_RELIEF_CAMPS.forEach((camp) => {
        list.push({
          lat: camp.lat,
          lon: camp.lon,
          title: camp.name,
          description: `Elevation: ${camp.elevation_asl}m ASL (100% Dry Ground) • Capacity: ${camp.capacity} • Potable Water: ${camp.potable_water_liters.toLocaleString()} L`,
          type: 'hub',
          badge: `${camp.elevation_asl}m ASL DRY`,
          customBanner: `🏫 CAMP: ${camp.name.split(' ')[0]} HS`,
        });
      });
    }

    return list;
  }, [currentTheater, interventions, validIdx, selectedChoke, activeSelectedTool, activeStep, destHospital]);

  // Master Map Lines & Corridors Computation
  const masterMapLines: MapLine[] = useMemo(() => {
    const list: MapLine[] = [];
    if (!selectedChoke) return list;

    const spanHalfLen = 0.0018;

    // 1. Normal Pre-Flood Primary Route (Solid Emerald: Village ➔ Abutment ➔ Target Hospital)
    if (normalRoutePoints.length > 1) {
      list.push({
        id: 'baseline_normal_route',
        points: normalRoutePoints,
        color: '#10b981',
        weight: activeSelectedTool === 'bridge' ? 6 : 4,
        label:
          activeSelectedTool === 'bridge'
            ? `BAILEY BRIDGE ACTIVE: Full Highway & 16T Truck Access Restored (${selectedChoke.baseline_km} km direct)`
            : `Baseline Primary Road Route: ${selectedChoke.baseline_km} km (Blocked at Breach)`,
        layerType: 'baseline',
      });
    }

    // 2. Emergency Detour Route (Dashed Amber/Red)
    // When Bailey Bridge is active, turns the dashed red detour OFF!
    if (detourRoutePoints.length > 1 && activeSelectedTool !== 'bridge') {
      list.push({
        id: 'forced_detour_route',
        points: detourRoutePoints,
        color: '#f43f5e',
        dashArray: '7, 8',
        weight: 4,
        label: `Emergency Flood Detour Route: ${selectedChoke.detour_km} km to Backup Hospital (+${(
          selectedChoke.detour_km - selectedChoke.baseline_km
        ).toFixed(1)} km Surcharge)`,
        layerType: 'detour',
      });
    }

    // 3. Requirement 5: IRC:6 Weight Limit Line when 16T Truck is selected
    if (isHeavy) {
      list.push({
        id: 'irc_weight_restricted_span',
        points: [
          [selectedChoke.lat - 0.015, selectedChoke.lon - 0.018],
          [selectedChoke.lat - 0.008, selectedChoke.lon - 0.012],
          [selectedChoke.lat, selectedChoke.lon - 0.005],
        ],
        color: '#f59e0b',
        dashArray: '6, 6',
        weight: 4,
        label: '⚠️ IRC:6 Weight Limit (<5T): Blocked for 16T Ration Trucks',
        layerType: 'detour',
      });
    }

    // 3. Deployed Tool Action on the Bridge Breach Gap
    if (activeSelectedTool === 'bridge') {
      list.push({
        id: 'bailey_hardened_span',
        points: [
          [selectedChoke.lat - spanHalfLen, selectedChoke.lon - spanHalfLen],
          [selectedChoke.lat + spanHalfLen, selectedChoke.lon + spanHalfLen],
        ],
        color: '#10b981',
        weight: 8,
        label: `BAILEY BRIDGE ACTIVE: Full Highway & 16T Truck Access Restored`,
        layerType: 'baseline',
      });
    } else if (activeSelectedTool === 'booth') {
      list.push({
        id: 'field_clinic_roadhead',
        points: [
          [selectedChoke.lat - spanHalfLen * 1.5, selectedChoke.lon - spanHalfLen * 1.5],
          [selectedChoke.lat - spanHalfLen * 0.2, selectedChoke.lon - spanHalfLen * 0.2],
        ],
        color: '#059669',
        weight: 6,
        label: `MOBILE FIELD CLINIC: Intercepting Local Patients (-80% City ER Surge)`,
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
        dashArray: '4, 4',
        weight: 5,
        label: `MARINE FERRY SHUTTLE: Critical Patient Water Transfer Active`,
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
          dashArray: '5, 5',
          label: `UAV AIRBRIDGE: 12-Min Emergency Medical Supply Line`,
          layerType: 'drone',
        });
      }
    } else {
      // Severed breach span gap
      list.push({
        id: 'severed_breach_span',
        points: [
          [selectedChoke.lat - spanHalfLen, selectedChoke.lon - spanHalfLen],
          [selectedChoke.lat + spanHalfLen, selectedChoke.lon + spanHalfLen],
        ],
        color: '#f43f5e',
        weight: 7,
        label: `Severed River Breach: ${selectedChoke.road_name} (${selectedChoke.exposed_meters}m Exposed Gap)`,
        className: 'severed-span-anim',
        layerType: 'severed',
      });
    }

    return list;
  }, [selectedChoke, activeSelectedTool, normalRoutePoints, detourRoutePoints, currentTheater.hospitals]);

  // Core 4 Steps definition
  // 5 Clean Self-Explanatory Operational Steps (Requirement 3: Merged from confusing Dives)
  const coreSteps = [
    {
      id: 'step1_bottlenecks',
      stepNum: '1',
      label: '1. Choke Points',
      icon: ShieldAlert,
    },
    {
      id: 'step2_surge',
      stepNum: '2',
      label: '2. Hospitals',
      icon: Activity,
    },
    {
      id: 'step3_relief',
      stepNum: '3',
      label: '3. Relief & Cohorts',
      icon: Users,
    },
    {
      id: 'step4_roi',
      stepNum: '4',
      label: '4. ROI & Elevation',
      icon: TrendingUp,
    },
    {
      id: 'step5_sanction',
      stepNum: '5',
      label: '5. DM Sanction',
      icon: FileCheck,
    },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      {/* 1. 100% FULL-SCREEN MAP OCCUPYING ENTIRE VIEWPORT (GOOGLE EARTH / UBER STYLE) */}
      <div className="fixed inset-0 w-screen h-screen z-0">
        <LeafletMap
          theaterId={currentTheater.id}
          center={mapCenter}
          zoom={mapZoom}
          height="100%"
          riverPath={currentTheater.riverPath}
          chokePoints={currentTheater.chokePoints}
          markers={masterMapMarkers}
          lines={masterMapLines}
          activeChokeId={selectedChoke?.id}
          showLayerControls={true}
          onResetOverview={() => {
            setSelectedChokeIdx(0);
            setActiveStep('step1_bottlenecks');
          }}
        />
      </div>

      {/* 2. COMPACT SLEEK FLOATING TOP BAR (fixed top-0 left-0 right-0 h-16 z-30) */}
      <Header
        currentTheater={currentTheater}
        interventions={interventions}
        fleetMode={fleetMode}
        onFleetChange={handleFleetChange}
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
        onStartInteractiveTour={handleStartInteractiveTour}
        onStartAutoDemo={handleStartAutoDemo}
        isInteractiveTourActive={tourMode === 'interactive'}
        isAutoDemoActive={tourMode === 'autodemo'}
        interactiveTourTask={tourMode === 'interactive' ? interactiveTask : 0}
        opsMode={opsMode}
        onToggleOpsMode={() => setOpsMode((prev) => (prev === 'day' ? 'night' : 'day'))}
      />

      {/* 4. SIMPLE "WHAT AM I LOOKING AT?" STORY BOX AT TOP-CENTER OF MAP (Requirement 4) */}
      {selectedChoke && (
        <div className="fixed top-20 right-4 lg:left-[452px] lg:right-auto max-w-xl z-20 bg-slate-950/95 border border-slate-700/80 rounded-xl px-4 py-2.5 shadow-2xl backdrop-blur-md text-center pointer-events-auto select-none hidden sm:block">
          {/* Breadcrumb Steps Header */}
          <div className="flex items-center justify-center gap-2 mb-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Step A: Start ({selectedChoke.villages?.[0]?.name || 'Villages'})
            </span>
            <span className="text-slate-600 font-bold">➔</span>
            <span
              className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded border ${
                activeSelectedTool === 'bridge'
                  ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/50'
                  : 'text-rose-400 bg-rose-950/60 border-rose-800/50'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  activeSelectedTool === 'bridge' ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'
                }`}
              />
              Step B:{' '}
              {activeSelectedTool === 'bridge'
                ? 'Bailey Bridge Built'
                : `${selectedChoke.road_name.split(' ')[0]} Washed Out`}
            </span>
            <span className="text-slate-600 font-bold">➔</span>
            <span className="flex items-center gap-1 text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              Step C: {destHospital?.name.split(' ')[0] || 'Hospital'}
            </span>
          </div>

          {/* Plain 1-Sentence Dynamic Explanation */}
          <div className="font-mono text-xs font-semibold text-slate-100 leading-relaxed">
            {currentStoryText}
          </div>
        </div>
      )}

      {/* 3. FLOATING COLLAPSIBLE 5-STEP WIZARD DRAWER ON THE LEFT (fixed top-20 left-4 bottom-4 w-[420px] z-20) */}
      {!isDrawerCollapsed ? (
        <aside className="fixed top-20 left-4 bottom-4 w-[420px] max-w-[calc(100vw-32px)] z-20 bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300">
          {/* Drawer Header: 5 Clean Operational Steps */}
          <div className="p-3 bg-slate-900/90 border-b border-slate-800 shrink-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                SEOC Operational Command Steps (1–5)
              </span>

              <button
                onClick={() => setIsDrawerCollapsed(true)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer text-xs flex items-center gap-1"
                title="Collapse drawer to view full map"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono">Hide</span>
              </button>
            </div>

            {/* Step Pills [ 1. Choke Points ] ➔ [ 2. Hospitals ] ➔ [ 3. Relief ] ➔ [ 4. ROI ] ➔ [ 5. DM Sanction ] */}
            <div className="grid grid-cols-5 gap-1">
              {coreSteps.map((s) => {
                const isActive = activeStep === s.id;
                const isTask3Target = tourMode === 'interactive' && interactiveTask === 3 && s.id === 'step2_surge';
                const isTask4Target = tourMode === 'interactive' && interactiveTask === 4 && s.id === 'step3_relief';
                const isTask5Target = tourMode === 'interactive' && interactiveTask === 5 && s.id === 'step5_sanction';

                return (
                  <div key={s.id} className="relative">
                    <button
                      onClick={() => {
                        setActiveStep(s.id);
                        if (isTask3Target) setInteractiveTask(4);
                        if (isTask4Target) setInteractiveTask(5);
                        if (isTask5Target) setInteractiveTask(6);
                      }}
                      className={`w-full py-1.5 px-0.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer text-center truncate ${
                        isTask3Target || isTask4Target || isTask5Target
                          ? 'ring-4 ring-emerald-400 shadow-[0_0_15px_#10b981] animate-pulse bg-emerald-950 text-emerald-300'
                          : isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 ring-1 ring-blue-400'
                          : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                      }`}
                      title={s.label}
                    >
                      <span className="block truncate">{s.label}</span>
                    </button>
                    {isTask3Target && (
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-400 text-slate-950 font-mono font-bold text-[7px] px-1.5 py-0.2 rounded-full shadow-[0_0_10px_#10b981] whitespace-nowrap animate-bounce">
                        👇 STEP 2
                      </div>
                    )}
                    {isTask4Target && (
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-400 text-slate-950 font-mono font-bold text-[7px] px-1.5 py-0.2 rounded-full shadow-[0_0_10px_#10b981] whitespace-nowrap animate-bounce">
                        👇 STEP 3
                      </div>
                    )}
                    {isTask5Target && (
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-400 text-slate-950 font-mono font-bold text-[7px] px-1.5 py-0.2 rounded-full shadow-[0_0_10px_#10b981] whitespace-nowrap animate-bounce">
                        👇 STEP 5
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Drawer Body: Scrollable Active Step Content */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-700">
            {activeStep === 'step1_bottlenecks' && (
              <Step1Bottlenecks
                currentTheater={currentTheater}
                interventions={interventions}
                onSetIntervention={handleSetIntervention}
                onResetInterventions={handleResetInterventions}
                selectedChokeIdx={validIdx}
                onSelectChokeIdx={handleSelectChokeIdx}
                fleetMode={fleetMode}
                interactiveTourTask={tourMode === 'interactive' ? interactiveTask : 0}
                opsMode={opsMode}
              />
            )}

            {activeStep === 'step2_surge' && (
              <Step2HospitalSurge
                currentTheater={currentTheater}
                interventions={interventions}
                onGoToStep1={() => setActiveStep('step1_bottlenecks')}
              />
            )}

            {activeStep === 'step3_relief' && (
              <Step3ReliefCohorts
                currentTheater={currentTheater}
                onAdvanceToStep4={() => setActiveStep('step4_roi')}
              />
            )}

            {activeStep === 'step4_roi' && (
              <Step4RoiGroundTruth
                currentTheater={currentTheater}
                onAdvanceToStep5={() => setActiveStep('step5_sanction')}
              />
            )}

            {activeStep === 'step5_sanction' && (
              <Step5DmSanction
                currentTheater={currentTheater}
                activeInterventions={interventions}
                fleetMode={fleetMode}
              />
            )}
          </div>
        </aside>
      ) : (
        /* Collapsed Floating Drawer Trigger */
        <button
          onClick={() => setIsDrawerCollapsed(false)}
          className="fixed top-20 left-4 z-20 px-3 py-2 rounded-xl bg-slate-950/95 backdrop-blur-md border border-slate-800 text-slate-100 shadow-2xl flex items-center gap-2 text-xs font-bold font-mono hover:bg-slate-900 transition-all cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Open Steps (1–5)</span>
        </button>
      )}

      {/* Mode 1: Zero-Blur Hands-On Interactive Tour Coach */}
      {tourMode === 'interactive' && (
        <InteractiveTourCoach
          currentTask={interactiveTask}
          onClose={() => setTourMode('none')}
          onNextTask={handleNextInteractiveTask}
        />
      )}

      {/* Mode 2: Hands-Free Auto-Demo Teleprompter Dock */}
      {tourMode === 'autodemo' && (
        <AutoDemoPlayer
          currentSceneIdx={autoDemoSceneIdx}
          onSceneChange={setAutoDemoSceneIdx}
          onClose={() => setTourMode('none')}
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
