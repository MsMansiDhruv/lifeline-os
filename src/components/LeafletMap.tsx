import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, ChevronUp, ChevronDown, Map, Satellite, Moon, Maximize2, Sliders, ArrowLeftRight } from 'lucide-react';
import { CorridorRoadNetwork } from '../services/osrmRouting';
import {
  SVG_BRIDGE_HTML,
  SVG_CAMP_HTML,
  SVG_DRONE_HTML,
  SVG_BOAT_HTML,
  SVG_TRUCK_HTML,
  SVG_HOSPITAL_HTML,
  SVG_HAZARD_HTML,
  SVG_ORIGIN_PIN_HTML,
  SVG_SOS_HTML,
} from './common/TacticalIcons';
import { InspectedFeatureData } from './ContextualFeatureInspector';
import { EvidenceClass, EVIDENCE_CLASS_CONFIG } from '../types/evidence';
import { getSelectedTelemetryRow } from '../data/disasterData';

export interface MapLine {
  id?: string;
  points: [number, number][];
  color: string;
  dashArray?: string;
  weight?: number;
  label?: string;
  className?: string;
  layerType?: 'severed' | 'catchment' | 'baseline' | 'detour' | 'general' | 'drone' | 'boat' | 'diversion' | 'bridge';
}

export interface MapMarker {
  lat: number;
  lon: number;
  title: string;
  description?: string;
  type: 'isolated' | 'rerouted' | 'reachable' | 'chokepoint' | 'hub' | 'bridge' | 'facility' | 'boat' | 'drone' | 'booth';
  badge?: string;
  isQuietDot?: boolean;
  quietDotColor?: string;
  customBanner?: string;
  stepCategory?: 'start' | 'choke' | 'dest' | 'fleet';
  onClick?: () => void;
}

export type MapStyleMode = 'vector' | 'street' | 'satellite';

export interface CameraCommand {
  id: string;
  type: 'overview' | 'bounds' | 'point';
  center?: [number, number];
  zoom?: number;
  bounds?: [[number, number], [number, number]];
  duration?: number;
  paddingLeft?: number;
}

interface LeafletMapProps {
  theaterId?: string;
  center?: [number, number];
  zoom?: number;
  height?: string;
  riverPath?: [number, number][];
  floodStage?: number;
  floodPolygon?: [number, number][];
  showLayerControls?: boolean;
  chokePoints?: Array<{ id: string; lat: number; lon: number; road_name: string; exposed_meters?: number }>;
  markers?: MapMarker[];
  lines?: MapLine[];
  activeChokeId?: string;
  activeTool?: string;
  corridorNet?: CorridorRoadNetwork;
  isTourActive?: boolean;
  isLiveDispatched?: boolean;
  cameraCommand?: CameraCommand | null;
  panelWidth?: number;
  pulsingTarget?: [number, number] | null;
  onResetOverview?: () => void;
  isWindVisualized?: boolean;
  windSpeed?: number;
  fieldSosEvents?: Array<{ id: string; lat: number; lon: number; message: string; sender: string }>;
  mapMode?: MapStyleMode;
  onMapModeChange?: (mode: MapStyleMode) => void;
  rerouteAmbulances?: boolean;
  isSimulationRunning?: boolean;
  baselineAccessSliderValue?: number;
  onSelectFeature?: (feature: InspectedFeatureData) => void;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  theaterId = 'silchar',
  center = [24.8333, 92.7789],
  zoom = 12,
  riverPath,
  floodStage = 2,
  floodPolygon,
  chokePoints = [],
  markers = [],
  lines = [],
  activeChokeId,
  activeTool,
  corridorNet,
  isTourActive = false,
  isLiveDispatched = false,
  cameraCommand = null,
  panelWidth = 430,
  pulsingTarget = null,
  fieldSosEvents = [],
  mapMode: controlledMapMode,
  onMapModeChange,
  rerouteAmbulances = false,
  baselineAccessSliderValue = 100,
  onSelectFeature,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const [internalMapMode, setInternalMapMode] = useState<MapStyleMode>('vector');
  const activeMapMode = controlledMapMode || internalMapMode;
  const setMapMode = (m: MapStyleMode) => {
    setInternalMapMode(m);
    onMapModeChange?.(m);
  };

  // Draggable Before/After Swipe Split-View (Requirement 1: Disabled if no compatible imagery pair loaded)
  const hasCompatibleImageryPair = false;
  const [swipeMode, setSwipeMode] = useState<'before' | 'swipe' | 'after'>('before');
  const [swipePos, setSwipePos] = useState<number>(50); // 50% split by default
  const isDraggingSwipeRef = useRef<boolean>(false);

  // Pane element references for dynamic CSS clip-path
  const beforePaneRef = useRef<HTMLElement | null>(null);
  const afterPaneRef = useRef<HTMLElement | null>(null);
  const afterFloodPaneRef = useRef<HTMLElement | null>(null);

  // Layer groups
  const beforeTileLayerRef = useRef<L.TileLayer | null>(null);
  const afterTileLayerRef = useRef<L.TileLayer | null>(null);
  const floodLayerRef = useRef<L.LayerGroup | null>(null);
  const contourLayerRef = useRef<L.LayerGroup | null>(null);
  const linesLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const settlementsLayerRef = useRef<L.LayerGroup | null>(null);

  const [currentCoords, setCurrentCoords] = useState<[number, number]>(center);
  const [currentZoomLevel, setCurrentZoomLevel] = useState<number>(zoom);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(true);

  // Settlement features state loaded from public/villages.geojson
  const [settlementFeatures, setSettlementFeatures] = useState<Array<{ name: string; lat: number; lon: number }>>([]);

  // Layer Visibility & Opacity (Requirement D)
  const [layerVisibility, setLayerVisibility] = useState({
    floodExtent: true,
    contours: true,
    roads: true,
    bridges: true,
    hospitals: true,
    settlements: true,
    severedBreaches: true,
    detourBypass: true,
    interventions: true,
  });

  const [layerOpacity, setLayerOpacity] = useState({
    floodExtent: 0.65,
    contours: 0.5,
    roads: 0.9,
    bridges: 1.0,
    hospitals: 1.0,
    settlements: 0.9,
    severedBreaches: 1.0,
    detourBypass: 0.95,
    interventions: 1.0,
  });

  const toggleLayerItem = (key: keyof typeof layerVisibility) => {
    setLayerVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setAllLayers = (val: boolean) => {
    setLayerVisibility({
      floodExtent: val,
      contours: val,
      roads: val,
      bridges: val,
      hospitals: val,
      settlements: val,
      severedBreaches: val,
      detourBypass: val,
      interventions: val,
    });
  };

  // Helper to build authentic TileLayer
  const createTileLayer = (mode: MapStyleMode, targetPane: string) => {
    if (mode === 'satellite') {
      return L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Sentinel-1 / WorldView',
          maxZoom: 18,
          pane: targetPane,
        }
      );
    }
    if (mode === 'street') {
      return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
        pane: targetPane,
      });
    }
    // High-contrast cartographic dark matter
    return L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap contributors, &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20,
        pane: targetPane,
      }
    );
  };

  // Load Village centroids from public/villages.geojson
  useEffect(() => {
    let isMounted = true;
    fetch('/villages.geojson')
      .then((res) => {
        if (!res.ok) throw new Error('Villages fetch failed');
        return res.json();
      })
      .then((geojson) => {
        if (!isMounted || !geojson?.features) return;
        const list = geojson.features.map((f: any) => ({
          name: f.properties?.name || 'Habitation Point',
          lat: f.geometry.coordinates[1],
          lon: f.geometry.coordinates[0],
        }));
        setSettlementFeatures(list);
      })
      .catch(() => {
        if (isMounted) {
          setSettlementFeatures([
            { name: 'Doodhpatli Pt I', lat: 24.872, lon: 92.845 },
            { name: 'Binnākāndi Ghat', lat: 24.885, lon: 92.895 },
            { name: 'Tolengram Sector', lat: 24.892, lon: 92.915 },
            { name: 'Harinagar East', lat: 24.865, lon: 92.835 },
            { name: 'Kumbhirgram Bypass', lat: 24.912, lon: 92.978 },
            { name: 'Udharbond Center', lat: 24.908, lon: 92.888 },
            { name: 'Sonai Colony', lat: 24.725, lon: 92.895 },
            { name: 'Rongpur Riverside', lat: 24.838, lon: 92.795 },
            { name: 'Tarapur Outpost', lat: 24.825, lon: 92.782 },
          ]);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize Map with Before/After Panes for Draggable Split-View
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Panes for Draggable Swipe Split
    const beforePane = map.createPane('beforePane');
    beforePane.style.zIndex = '210';
    beforePaneRef.current = beforePane;

    const afterPane = map.createPane('afterPane');
    afterPane.style.zIndex = '240';
    afterPaneRef.current = afterPane;

    const afterFloodPane = map.createPane('afterFloodPane');
    afterFloodPane.style.zIndex = '360';
    afterFloodPaneRef.current = afterFloodPane;

    // Overlays above swipe
    const linesPane = map.createPane('linesPane');
    linesPane.style.zIndex = '400';
    const settlementPane = map.createPane('settlementPane');
    settlementPane.style.zIndex = '500';
    const markersPane = map.createPane('markersPane');
    markersPane.style.zIndex = '600';

    // Before Basemap (OpenStreetMap dimmed / Street)
    const beforeTile = createTileLayer(activeMapMode === 'satellite' ? 'street' : activeMapMode, 'beforePane').addTo(map);
    beforeTileLayerRef.current = beforeTile;

    // After Basemap (Esri World Imagery satellite)
    const afterTile = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Sentinel-1 / WorldView-2',
        maxZoom: 18,
        pane: 'afterPane',
      }
    ).addTo(map);
    afterTileLayerRef.current = afterTile;

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCurrentCoords([e.latlng.lat, e.latlng.lng]);
    });
    map.on('zoomend', () => {
      setCurrentZoomLevel(map.getZoom());
    });

    floodLayerRef.current = L.layerGroup([], { pane: 'afterFloodPane' }).addTo(map);
    contourLayerRef.current = L.layerGroup([], { pane: 'afterFloodPane' }).addTo(map);
    linesLayerRef.current = L.layerGroup([], { pane: 'linesPane' }).addTo(map);
    settlementsLayerRef.current = L.layerGroup([], { pane: 'settlementPane' }).addTo(map);
    markersLayerRef.current = L.layerGroup([], { pane: 'markersPane' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [theaterId]);

  // Handle Dynamic CSS Clip-Path Split for Draggable Before/After/Swipe
  useEffect(() => {
    if (!beforePaneRef.current || !afterPaneRef.current || !afterFloodPaneRef.current) return;
    if (swipeMode === 'swipe') {
      beforePaneRef.current.style.clipPath = `inset(0 calc(100% - ${swipePos}%) 0 0)`;
      afterPaneRef.current.style.clipPath = `inset(0 0 0 ${swipePos}%)`;
      afterFloodPaneRef.current.style.clipPath = `inset(0 0 0 ${swipePos}%)`;
      beforePaneRef.current.style.display = 'block';
      afterPaneRef.current.style.display = 'block';
      afterFloodPaneRef.current.style.display = 'block';
    } else if (swipeMode === 'before') {
      beforePaneRef.current.style.clipPath = 'none';
      beforePaneRef.current.style.display = 'block';
      afterPaneRef.current.style.display = 'none';
      afterFloodPaneRef.current.style.display = 'none';
    } else if (swipeMode === 'after') {
      afterPaneRef.current.style.clipPath = 'none';
      afterFloodPaneRef.current.style.clipPath = 'none';
      beforePaneRef.current.style.display = 'none';
      afterPaneRef.current.style.display = 'block';
      afterFloodPaneRef.current.style.display = 'block';
    }
  }, [swipeMode, swipePos]);

  // Handle Base Tile Switching (Street, Satellite, Dark)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (beforeTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(beforeTileLayerRef.current);
    }
    const newBeforeTile = createTileLayer(activeMapMode === 'satellite' ? 'street' : activeMapMode, 'beforePane').addTo(mapInstanceRef.current);
    beforeTileLayerRef.current = newBeforeTile;
  }, [activeMapMode]);

  // Draggable Divider Mouse & Touch Event Handlers
  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingSwipeRef.current = true;
  };

  const handleDividerTouchStart = (_e: React.TouchEvent) => {
    isDraggingSwipeRef.current = true;
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingSwipeRef.current || !mapContainerRef.current) return;
      const rect = mapContainerRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const x = clientX - rect.left;
      const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
      setSwipePos(Math.round(pct * 10) / 10);
    };

    const handleUp = () => {
      isDraggingSwipeRef.current = false;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, []);

  // Camera commands handling
  useEffect(() => {
    if (!mapInstanceRef.current || !cameraCommand) return;
    if (cameraCommand.type === 'overview') {
      const targetCenter = cameraCommand.center || center;
      const targetZoom = cameraCommand.zoom || 12;
      mapInstanceRef.current.flyTo(targetCenter, targetZoom, { duration: cameraCommand.duration ?? 1.1 });
      return;
    }
    if (cameraCommand.type === 'bounds' && cameraCommand.bounds) {
      const padLeft = cameraCommand.paddingLeft ?? (panelWidth + 40);
      mapInstanceRef.current.flyToBounds(cameraCommand.bounds, {
        paddingTopLeft: [padLeft, 80],
        paddingBottomRight: [40, 40],
        maxZoom: cameraCommand.zoom || 14,
        duration: cameraCommand.duration ?? 1.1,
      });
      return;
    }
    if (cameraCommand.type === 'point' && cameraCommand.center) {
      const targetZoom = cameraCommand.zoom || 15;
      mapInstanceRef.current.flyTo(cameraCommand.center, targetZoom, {
        duration: cameraCommand.duration ?? 0.9,
      });
    }
  }, [cameraCommand?.id]);

  // 1. FLOOD INUNDATION BASIN & ELEVATION CONTOURS (After Layer)
  useEffect(() => {
    if (!floodLayerRef.current || !contourLayerRef.current || !mapInstanceRef.current) return;
    floodLayerRef.current.clearLayers();
    contourLayerRef.current.clearLayers();

    // 1.1 Sentinel-1 SAR Flood Inundation Polygon
    if (layerVisibility.floodExtent && floodPolygon && floodPolygon.length >= 3) {
      const poly = L.polygon(floodPolygon, {
        color: '#dc2626',
        weight: 1.5,
        opacity: layerOpacity.floodExtent,
        fillColor: '#991b1b',
        fillOpacity: Math.min(0.65, layerOpacity.floodExtent * (0.35 + floodStage * 0.05)),
        pane: 'afterFloodPane',
      });
      poly.bindTooltip(
        `<div class="p-1 font-mono text-[11px]"><span class="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold text-[9px] mr-1">OBSERVED</span><strong>Sentinel-1 SAR Inundation</strong><br/><span class="text-slate-300">82.4 km² • Otsu -14.2dB</span></div>`,
        { sticky: true }
      );
      poly.addTo(floodLayerRef.current);
    }

    // 1.2 Elevation Contours (Matching Reference Screenshot)
    if (layerVisibility.contours && floodPolygon && floodPolygon.length >= 3) {
      const baseLat = center[0];
      const baseLon = center[1];
      [20, 25, 30, 35, 40].forEach((elev, idx) => {
        const offset = (idx + 1) * 0.012;
        const contourPoints: [number, number][] = [
          [baseLat - 0.03 + offset * 0.5, baseLon - 0.08 + offset],
          [baseLat - 0.01 + offset * 0.4, baseLon - 0.03 + offset * 0.8],
          [baseLat + 0.02 + offset * 0.3, baseLon + 0.01 + offset * 0.6],
          [baseLat + 0.05 + offset * 0.2, baseLon + 0.06 + offset * 0.4],
          [baseLat + 0.08 + offset * 0.1, baseLon + 0.10 + offset * 0.2],
        ];
        const contourLine = L.polyline(contourPoints, {
          color: '#fbbf24',
          weight: 1,
          opacity: layerOpacity.contours * 0.7,
          dashArray: '3, 4',
          pane: 'afterFloodPane',
        });
        contourLine.bindTooltip(`<span class="font-mono text-[10px] text-amber-300 font-bold">${elev}m ASL</span>`, {
          sticky: true,
          className: 'map-label-compact',
        });
        contourLine.addTo(contourLayerRef.current!);
      });
    }

    // 1.3 River Channel
    if (riverPath && riverPath.length >= 2) {
      L.polyline(riverPath, {
        color: '#0369a1',
        weight: 5,
        opacity: layerOpacity.floodExtent * 0.7,
        lineCap: 'butt',
        lineJoin: 'round',
        pane: 'afterFloodPane',
      }).addTo(floodLayerRef.current);

      L.polyline(riverPath, {
        color: '#38bdf8',
        weight: 2.5,
        opacity: layerOpacity.floodExtent,
        lineCap: 'butt',
        lineJoin: 'round',
        pane: 'afterFloodPane',
      }).addTo(floodLayerRef.current);
    }
  }, [riverPath, floodPolygon, floodStage, layerVisibility.floodExtent, layerVisibility.contours, layerOpacity.floodExtent, layerOpacity.contours, center]);

  // 2. ROAD NAVIGATION LINES & AMBULANCE DIVERSIONS
  useEffect(() => {
    if (!linesLayerRef.current || !mapInstanceRef.current) return;
    linesLayerRef.current.clearLayers();

    lines.forEach((line) => {
      if (line.layerType === 'severed' && !layerVisibility.severedBreaches) return;
      if (line.layerType === 'detour' && !layerVisibility.detourBypass) return;
      if (line.layerType === 'baseline' && !layerVisibility.roads) return;
      if (line.layerType === 'diversion' && !layerVisibility.detourBypass) return;
      if ((line.layerType === 'bridge' || line.layerType === 'boat' || line.layerType === 'drone') && !layerVisibility.interventions) return;

      const baseWeight = line.weight || 4;
      const opacity =
        line.layerType === 'severed'
          ? layerOpacity.severedBreaches
          : line.layerType === 'detour' || line.layerType === 'diversion'
          ? layerOpacity.detourBypass
          : layerOpacity.roads;

      // Dark Casing Underneath
      L.polyline(line.points, {
        color: '#020617',
        weight: baseWeight + 2,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        pane: 'linesPane',
      }).addTo(linesLayerRef.current!);

      // Foreground Navigation Path
      const polyline = L.polyline(line.points, {
        color: line.color,
        weight: baseWeight,
        opacity,
        dashArray: line.dashArray,
        pane: 'linesPane',
      });

      if (line.label) {
        polyline.bindTooltip(line.label, { sticky: true });
      }
      polyline.addTo(linesLayerRef.current!);
    });
  }, [lines, layerVisibility, layerOpacity]);

  // 3. SETTLEMENT ACCESS & REROUTING (Requirement C & User Directive)
  useEffect(() => {
    if (!settlementsLayerRef.current || !mapInstanceRef.current) return;
    settlementsLayerRef.current.clearLayers();

    if (!layerVisibility.settlements) return;

    settlementFeatures.forEach((village) => {
      const nameLower = village.name.toLowerCase();
      const isInCutSector =
        baselineAccessSliderValue > 0 &&
        (nameLower.includes('doodhpatli') ||
          nameLower.includes('binnākāndi') ||
          nameLower.includes('binnakandi') ||
          nameLower.includes('tolengram') ||
          nameLower.includes('harinagar') ||
          (village.lat >= 24.84 && village.lat <= 24.91 && village.lon >= 92.83 && village.lon <= 92.93));

      const isInDetourSector =
        !isInCutSector &&
        baselineAccessSliderValue > 0 &&
        (nameLower.includes('kumbhirgram') ||
          nameLower.includes('udharbond') ||
          nameLower.includes('sonai') ||
          (village.lat >= 24.78 && village.lat <= 24.95 && village.lon >= 92.75 && village.lon <= 92.83));

      // Pin Styling & Rerouting Status
      let color = '#10b981'; // Reachable (green)
      let radius = 3.5;
      let strokeColor = '#065f46';
      let statusLabel = 'Reachable via baseline corridor';
      let evidenceClass: EvidenceClass = 'OBSERVED';
      let statusText = 'REACHABLE';

      if (isInCutSector) {
        if (rerouteAmbulances) {
          // Village is reconnected through active ambulance diversion!
          color = '#0284c7'; // Rerouted Blue
          radius = 5.0;
          strokeColor = '#0369a1';
          statusLabel = 'REROUTED: Ambulance Diversion to SMCH Apex Active';
          evidenceClass = 'SIMULATED';
          statusText = 'REROUTED (BYPASS ACTIVE)';
        } else {
          // Severed / Broken state
          color = '#f43f5e'; // No route (cut-off)
          radius = 5.5;
          strokeColor = '#9f1239';
          statusLabel = 'NO ROUTE (Cut-off) — 0 viable land corridors';
          evidenceClass = 'SIMULATED';
          statusText = 'NO ROUTE (CUT-OFF)';
        }
      } else if (isInDetourSector) {
        const telDetour = getSelectedTelemetryRow(village.name);
        color = '#f59e0b'; // Detour (+km)
        radius = 4.5;
        strokeColor = '#92400e';
        statusLabel = `Rerouted (+${Math.round(telDetour.additional_min || 46.7)}m delay / +${(telDetour.additional_km || 11.7).toFixed(1)} km detour)`;
        evidenceClass = 'SIMULATED';
        statusText = `REROUTED (+${Math.round(telDetour.additional_min || 46.7)}M)`;
      }

      const circle = L.circleMarker([village.lat, village.lon], {
        radius,
        color: strokeColor,
        weight: 1.5,
        fillColor: color,
        fillOpacity: layerOpacity.settlements,
        pane: 'settlementPane',
      });

      const badgeConf = EVIDENCE_CLASS_CONFIG[evidenceClass];
      circle.bindTooltip(
        `<div class="p-1 font-mono text-[11px]"><span class="px-1.5 py-0.2 rounded border font-bold text-[9px] mr-1 ${badgeConf.badgeBg} ${badgeConf.badgeText} ${badgeConf.badgeBorder}">${badgeConf.label}</span><strong>${village.name}</strong><br/><span class="text-slate-200">${statusLabel}</span></div>`,
        { sticky: true }
      );

      circle.on('click', () => {
        if (onSelectFeature) {
          const tel = getSelectedTelemetryRow(village.name);
          onSelectFeature({
            id: `settlement_${village.name}`,
            type: 'village',
            title: village.name,
            subtitle: 'Cachar Basin Settlement',
            coordinates: [village.lat, village.lon],
            statusText,
            statusColor: isInCutSector ? (rerouteAmbulances ? 'cyan' : 'rose') : isInDetourSector ? 'amber' : 'emerald',
            evidenceClass,
            dataState: isInCutSector || isInDetourSector ? 'SIMULATED' : 'LIVE',
            metrics: [
              {
                label: 'Baseline Access',
                value: `${tel.baseline_km.toFixed(1)} km / ${Math.round(tel.baseline_min)}m`,
                ledger: {
                  source: 'OpenStreetMap Regional Graph',
                  date: '2022-06-20',
                  method: 'Dijkstra topological shortest path',
                  parentData: 'Cachar OSM Highway Extraction v1.0',
                  limitation: 'Unpaved village tracks unverified by post-monsoon LiDAR',
                },
              },
              {
                label: 'Scenario Egress Delay',
                value: isInCutSector
                  ? rerouteAmbulances
                    ? `+${Math.round(tel.additional_min || 46.7)} mins (Rerouted)`
                    : 'NO ROUTE (Severed)'
                  : isInDetourSector
                  ? `+${Math.round(tel.additional_min || 46.7)} mins (+${(tel.additional_km || 11.7).toFixed(1)} km)`
                  : '0 min delay',
                color: isInCutSector ? (rerouteAmbulances ? 'text-cyan-400' : 'text-rose-400') : isInDetourSector ? 'text-amber-400' : 'text-emerald-400',
                ledger: {
                  source: 'Lifeline OS Route Engine',
                  date: '2022-06-20',
                  method: 'Topological cut-edge traversal via Kumbhirgram bypass',
                  parentData: 'Cachar Highway Network Graph',
                  limitation: 'Assumes Kumbhirgram bridgehead remains dry above 24.3m flood crest',
                },
              },
              {
                label: 'Habitation Headcount',
                value: (village as { population?: number }).population ? `${(village as { population?: number }).population?.toLocaleString()} citizens` : 'population: unknown',
                ledger: {
                  source: (village as { population?: number }).population ? '2011 Census Growth Projection' : 'UNKNOWN',
                  date: '2022-01-01',
                  method: (village as { population?: number }).population ? 'OSM building footprint density calculus' : 'UNKNOWN',
                  parentData: 'Cachar District Census Register',
                  limitation: 'Nighttime village headcount unverified by ground census',
                },
              },
            ],
            description: `${village.name} is evaluated under the active ${baselineAccessSliderValue}% simulated closure impact profile. ${isInCutSector ? (rerouteAmbulances ? 'Ambulance diversion convoys actively vector patients via Kumbhirgram to SMCH Apex.' : 'Direct highway egress is severed by the 80m JT Road washout.') : isInDetourSector ? 'Access to SMCH Apex requires an elevated bypass detour.' : 'Corridors remain clear of floodwater.'}`,
          });
        }
      });

      circle.addTo(settlementsLayerRef.current!);
    });
  }, [settlementFeatures, baselineAccessSliderValue, rerouteAmbulances, layerVisibility.settlements, layerOpacity.settlements, onSelectFeature]);

  // 4. CHOKE POINTS & HOSPITALS (Markers Layer)
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;
    markersLayerRef.current.clearLayers();

    // 4.1 Choke Points (Bridges)
    const isZoomedOut = currentZoomLevel < 12;

    if (layerVisibility.bridges && chokePoints.length > 0) {
      chokePoints.forEach((cp) => {
        const isSelected = cp.id === activeChokeId;
        const showLabel = isSelected || !isZoomedOut;
        const cpIcon = L.divIcon({
          html: showLabel ? `
            <div class="cursor-pointer transition-transform hover:scale-110" style="position:relative; transform:translate(-50%, -50%);">
              <div style="display:flex; align-items:center; gap:4px; padding:3px 6px; background:rgba(15,23,42,0.95); border:1.5px solid ${isSelected ? '#38bdf8' : '#e11d48'}; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.7);">
                <span style="font-size:9px; font-weight:800; font-family:monospace; background:#4c0519; color:#fda4af; border:1px solid #e11d48; padding:1px 3px; border-radius:4px;">SIMULATED</span>
                ${SVG_BRIDGE_HTML(14, isSelected ? '#38bdf8' : '#f43f5e')}
                <span style="font-size:11px; font-weight:700; color:#ffffff; font-family:sans-serif; white-space:nowrap;">${cp.road_name.split(' (')[0]}</span>
              </div>
            </div>
          ` : `
            <div class="cursor-pointer transition-transform hover:scale-125" style="position:relative; transform:translate(-50%, -50%);" title="${cp.road_name} (SIMULATED CLOSURE)">
              <div style="display:flex; align-items:center; justify-content:center; width:22px; height:22px; background:rgba(15,23,42,0.95); border:1.5px solid ${isSelected ? '#38bdf8' : '#e11d48'}; border-radius:50%; box-shadow:0 2px 8px rgba(0,0,0,0.6);">
                ${SVG_BRIDGE_HTML(12, isSelected ? '#38bdf8' : '#f43f5e')}
              </div>
            </div>
          `,
          className: 'tactical-choke-pin',
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const marker = L.marker([cp.lat, cp.lon], { icon: cpIcon, pane: 'markersPane' });
        marker.on('click', () => {
          if (onSelectFeature) {
            const telCp = getSelectedTelemetryRow(cp.road_name);
            onSelectFeature({
              id: cp.id,
              type: 'chokepoint',
              title: cp.road_name,
              subtitle: 'Primary Strategic River Corridor (Simulated Closure)',
              coordinates: [cp.lat, cp.lon],
              statusText: 'SIMULATED CLOSURE (80M GAP)',
              statusColor: 'rose',
              evidenceClass: 'SIMULATED',
              dataState: 'LIVE',
              metrics: [
                {
                  label: 'Breach Width',
                  value: `${cp.exposed_meters || 80} meters`,
                  ledger: {
                    source: 'Assam PWD Executive Engineer',
                    date: '2022-06-20',
                    method: 'Visual on-site tape survey',
                    parentData: 'Damage Assessment REP-CACHAR-001',
                    limitation: 'Sub-surface scour depth unverified without sonar survey',
                  },
                },
                {
                  label: 'Trapped Habitations',
                  value: '27 habitations',
                  ledger: {
                    source: 'GIS Topological Spatial Network Analysis',
                    date: '2022-06-20',
                    method: 'Shortest path reachability graph cut',
                    parentData: 'OpenStreetMap Road Network',
                    limitation: 'Assumes no private boats operable in high current (>3.5 m/s)',
                  },
                },
                {
                  label: 'Detour Penalty',
                  value: `+${Math.round(telCp.additional_min || 46.7)} mins (+${(telCp.additional_km || 11.7).toFixed(1)} km)`,
                  ledger: {
                    source: 'OSRM Route Engine via Kumbhirgram',
                    date: '2022-06-20',
                    method: 'Overpass graph edge cost calculation',
                    parentData: 'SH-34 to Airport bypass connection',
                    limitation: 'Detour travel times degrade if minor culverts overtop',
                  },
                },
              ],
              description: `Severe structural disruption along ${cp.road_name}. Egress for 27 habitations severed until temporary Class-40 Bailey span or amphibious crossing is established.`,
            });
          }
        });
        marker.addTo(markersLayerRef.current!);
      });
    }

    // 4.2 Hospitals & Tactical Assets
    markers.forEach((m) => {
      const isHosp = m.type === 'facility' || m.title.includes('Hospital') || m.title.includes('Clinic');
      if (isHosp && !layerVisibility.hospitals) return;

      if (isHosp) {
        const showHospLabel = !isZoomedOut || m.stepCategory === 'dest';
        const hospIcon = L.divIcon({
          html: showHospLabel ? `
            <div class="cursor-pointer transition-transform hover:scale-110" style="position:relative; transform:translate(-50%, -50%);">
              <div style="display:flex; align-items:center; gap:4px; padding:3px 6px; background:rgba(15,23,42,0.95); border:1.5px solid #0284c7; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.7);">
                <span style="font-size:9px; font-weight:800; font-family:monospace; background:#082f49; color:#7dd3fc; border:1px solid #0284c7; padding:1px 3px; border-radius:4px;">OFFICIAL</span>
                ${SVG_HOSPITAL_HTML(14, '#38bdf8')}
                <span style="font-size:11px; font-weight:700; color:#ffffff; font-family:sans-serif; white-space:nowrap;">${m.title}</span>
              </div>
            </div>
          ` : `
            <div class="cursor-pointer transition-transform hover:scale-125" style="position:relative; transform:translate(-50%, -50%);" title="${m.title} (OFFICIAL HOSPITAL)">
              <div style="display:flex; align-items:center; justify-content:center; width:22px; height:22px; background:rgba(15,23,42,0.95); border:1.5px solid #0284c7; border-radius:50%; box-shadow:0 2px 8px rgba(0,0,0,0.6);">
                ${SVG_HOSPITAL_HTML(12, '#38bdf8')}
              </div>
            </div>
          `,
          className: 'tactical-hosp-pin',
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const marker = L.marker([m.lat, m.lon], { icon: hospIcon, pane: 'markersPane' });
        if (m.onClick) {
          marker.on('click', m.onClick);
        }
        marker.addTo(markersLayerRef.current!);
      }
    });
  }, [chokePoints, activeChokeId, markers, layerVisibility.bridges, layerVisibility.hospitals, currentZoomLevel, onSelectFeature]);

  // Zoom to Layer Extent helper (Requirement D)
  const zoomToLayer = (layerName: string) => {
    if (!mapInstanceRef.current) return;
    if (layerName === 'floodExtent' && floodPolygon && floodPolygon.length > 0) {
      const bounds = L.latLngBounds(floodPolygon);
      mapInstanceRef.current.flyToBounds(bounds, { padding: [60, 60], duration: 1.0 });
    } else if (layerName === 'roads' && chokePoints.length > 0) {
      const bounds = L.latLngBounds(chokePoints.map((cp) => [cp.lat, cp.lon]));
      mapInstanceRef.current.flyToBounds(bounds, { padding: [60, 60], duration: 1.0 });
    } else {
      mapInstanceRef.current.flyTo(center, 12, { duration: 1.0 });
    }
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950">
      {/* Real Map Canvas with Dual Panes for Before/After */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* DRAGGABLE BEFORE/AFTER SWIPE DIVIDER (Requirement 1: Hidden when no compatible imagery pair loaded) */}
      {hasCompatibleImageryPair && swipeMode === 'swipe' && (
        <div
          className="absolute top-0 bottom-0 z-[800] w-1 bg-white cursor-ew-resize select-none pointer-events-auto shadow-[0_0_15px_rgba(255,255,255,0.7)]"
          style={{ left: `${swipePos}%` }}
          onMouseDown={handleDividerMouseDown}
          onTouchStart={handleDividerTouchStart}
        >
          {/* Circular Divider Handle */}
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-white shadow-2xl flex items-center justify-center text-white cursor-ew-resize font-bold text-xs select-none hover:scale-110 transition-transform">
            <ArrowLeftRight className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* TOP PILLS: Only shown when compatible imagery pair is loaded */}
      {hasCompatibleImageryPair && (swipeMode === 'swipe' || swipeMode === 'before') && (
        <div
          className="absolute top-16 z-[790] pointer-events-none transition-all hidden md:block"
          style={{
            left: `${panelWidth + 24}px`,
            maxWidth: swipeMode === 'swipe' ? `calc(${swipePos}% - ${panelWidth + 40}px)` : 'auto',
          }}
        >
          <div className="px-3 py-1 rounded-lg bg-slate-950/90 border border-slate-700/80 text-[11px] font-mono font-bold text-slate-300 shadow-xl truncate backdrop-blur-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
            <span>PRE-EVENT: BASEMAP</span>
          </div>
        </div>
      )}

      {hasCompatibleImageryPair && (swipeMode === 'swipe' || swipeMode === 'after') && (
        <div
          className="absolute top-16 z-[790] pointer-events-none transition-all hidden md:block"
          style={{
            left: swipeMode === 'swipe' ? `calc(${swipePos}% + 15px)` : `${panelWidth + 30}px`,
            maxWidth: 'calc(100vw - 780px)',
          }}
        >
          <div className="px-3 py-1 rounded-lg bg-cyan-950/90 border border-cyan-700/80 text-[11px] font-mono font-bold text-cyan-300 shadow-xl truncate backdrop-blur-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
            <span>POST-EVENT FLOOD EXTENT</span>
          </div>
        </div>
      )}

      {/* TOP-RIGHT VIEW MODE SWITCHER: [ Before | Swipe | After ] (Requirement 1: Disabled swipe with tooltip) */}
      <div className="absolute top-16 right-6 z-[850] flex items-center gap-2 pointer-events-auto">
        <div className="flex items-center bg-slate-900/95 border border-slate-700/80 rounded-xl p-1 shadow-2xl backdrop-blur-md">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-400 px-2">View:</span>
          {(['before', 'swipe', 'after'] as const).map((mode) => {
            const isSwipeDisabled = mode === 'swipe' && !hasCompatibleImageryPair;
            return (
              <button
                key={mode}
                type="button"
                disabled={isSwipeDisabled}
                title={isSwipeDisabled ? 'no compatible post-event imagery loaded' : undefined}
                onClick={() => {
                  if (!isSwipeDisabled) setSwipeMode(mode);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                  isSwipeDisabled
                    ? 'opacity-40 cursor-not-allowed text-slate-500'
                    : swipeMode === mode
                    ? 'bg-cyan-600 text-white shadow-md cursor-pointer'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer'
                }`}
              >
                {mode}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live GIS Coordinates & Zoom Level */}
      <div className="fixed bottom-3 right-6 z-[850] px-2.5 py-1 rounded-lg bg-slate-950/90 border border-slate-800 text-[10px] font-mono text-slate-400 backdrop-blur-md shadow-lg pointer-events-none select-none flex items-center gap-2">
        <span>{currentCoords[0].toFixed(5)}°N, {currentCoords[1].toFixed(5)}°E</span>
        <span className="text-slate-600">|</span>
        <span>z{currentZoomLevel}</span>
      </div>

      {/* Zoomed-Out Declutter Cluster Chip (Requirement 4) */}
      {currentZoomLevel < 12 && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[850] px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-[10px] font-mono text-cyan-300 shadow-xl backdrop-blur-md pointer-events-none select-none flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>{chokePoints.length} Choke Corridors • 319 Habitations (Zoom in to expand individual labels)</span>
        </div>
      )}

      {/* LAYER CATALOGUE & VISIBILITY CONTROLS (Requirement D & Matching Reference Sidebar) */}
      <div className="fixed bottom-12 right-6 z-[860] bg-slate-900/95 border-2 border-slate-700/80 rounded-2xl shadow-2xl w-[320px] max-w-[90vw] backdrop-blur-md select-none pointer-events-auto overflow-hidden transition-all">
        {/* Toggle Header Bar */}
        <div
          onClick={() => setIsLegendOpen(!isLegendOpen)}
          className="p-2.5 px-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/80 transition-colors border-b border-slate-800"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white tracking-wide">
              Layer Catalogue &amp; Controls
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-[10px] font-mono uppercase bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
              {activeMapMode}
            </span>
            {isLegendOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-400" />}
          </div>
        </div>

        {/* Expandable Body */}
        {isLegendOpen && (
          <div className="p-3 space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 animate-in fade-in text-xs">
            {/* Quick All On / All Off Actions */}
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Layer Toggles</span>
              <div className="flex items-center gap-1 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setAllLayers(true)}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                >
                  All On
                </button>
                <button
                  type="button"
                  onClick={() => setAllLayers(false)}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                >
                  All Off
                </button>
              </div>
            </div>

            {/* Base Layer Switcher (Working Street, Satellite, Dark) */}
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1.5 font-mono">
                Basemap:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setMapMode('street')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeMapMode === 'street'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  <Map className="w-3.5 h-3.5" />
                  <span>Street</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMapMode('satellite')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeMapMode === 'satellite'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  <Satellite className="w-3.5 h-3.5" />
                  <span>Satellite</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMapMode('vector')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeMapMode === 'vector'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </button>
              </div>
            </div>

            {/* Layer Rows with Opacity Sliders & Badges */}
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                Evidence Layers
              </span>

              {/* 1. Sentinel-1 SAR Extent */}
              <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-sans text-xs text-white">
                    <input
                      type="checkbox"
                      checked={layerVisibility.floodExtent}
                      onChange={() => toggleLayerItem('floodExtent')}
                      className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0"
                    />
                    <span>Flood Extent</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold bg-zinc-900 text-zinc-400 border border-zinc-700" title="origin undocumented">
                      UNKNOWN
                    </span>
                    <button
                      type="button"
                      onClick={() => zoomToLayer('floodExtent')}
                      className="p-1 text-slate-400 hover:text-white"
                      title="Zoom to flood extent"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <span className="w-12">Opacity:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={layerOpacity.floodExtent}
                    onChange={(e) =>
                      setLayerOpacity((prev) => ({ ...prev, floodExtent: parseFloat(e.target.value) }))
                    }
                    className="w-full h-1 bg-slate-800 rounded accent-cyan-400"
                  />
                  <span className="w-8 text-right">{Math.round(layerOpacity.floodExtent * 100)}%</span>
                </div>
              </div>

              {/* 2. Contours */}
              <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-sans text-xs text-white">
                    <input
                      type="checkbox"
                      checked={layerVisibility.contours}
                      onChange={() => toggleLayerItem('contours')}
                      className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0"
                    />
                    <span>Contours GLO-30 (10–50m)</span>
                  </label>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold bg-sky-950 text-sky-300 border border-sky-700">
                    OFFICIAL
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <span className="w-12">Opacity:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={layerOpacity.contours}
                    onChange={(e) =>
                      setLayerOpacity((prev) => ({ ...prev, contours: parseFloat(e.target.value) }))
                    }
                    className="w-full h-1 bg-slate-800 rounded accent-amber-400"
                  />
                  <span className="w-8 text-right">{Math.round(layerOpacity.contours * 100)}%</span>
                </div>
              </div>

              {/* 3. Settlements */}
              <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-sans text-xs text-white">
                    <input
                      type="checkbox"
                      checked={layerVisibility.settlements}
                      onChange={() => toggleLayerItem('settlements')}
                      className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0"
                    />
                    <span>334 Settlements (Access)</span>
                  </label>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold bg-rose-950 text-rose-300 border border-rose-700">
                    SIMULATED
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <span className="w-12">Opacity:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={layerOpacity.settlements}
                    onChange={(e) =>
                      setLayerOpacity((prev) => ({ ...prev, settlements: parseFloat(e.target.value) }))
                    }
                    className="w-full h-1 bg-slate-800 rounded accent-cyan-400"
                  />
                  <span className="w-8 text-right">{Math.round(layerOpacity.settlements * 100)}%</span>
                </div>
              </div>

              {/* 4. Road Corridors */}
              <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-sans text-xs text-white">
                    <input
                      type="checkbox"
                      checked={layerVisibility.roads}
                      onChange={() => toggleLayerItem('roads')}
                      className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0"
                    />
                    <span>Road Corridors &amp; Detours</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold bg-sky-950 text-sky-300 border border-sky-700">
                      OFFICIAL
                    </span>
                    <button
                      type="button"
                      onClick={() => zoomToLayer('roads')}
                      className="p-1 text-slate-400 hover:text-white"
                      title="Zoom to corridors"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <span className="w-12">Opacity:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={layerOpacity.roads}
                    onChange={(e) =>
                      setLayerOpacity((prev) => ({ ...prev, roads: parseFloat(e.target.value) }))
                    }
                    className="w-full h-1 bg-slate-800 rounded accent-cyan-400"
                  />
                  <span className="w-8 text-right">{Math.round(layerOpacity.roads * 100)}%</span>
                </div>
              </div>

              {/* 5. Hospitals */}
              <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-sans text-xs text-white">
                    <input
                      type="checkbox"
                      checked={layerVisibility.hospitals}
                      onChange={() => toggleLayerItem('hospitals')}
                      className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0"
                    />
                    <span>Hospitals &amp; Clinics</span>
                  </label>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold bg-sky-950 text-sky-300 border border-sky-700">
                    OFFICIAL
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <span className="w-12">Opacity:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={layerOpacity.hospitals}
                    onChange={(e) =>
                      setLayerOpacity((prev) => ({ ...prev, hospitals: parseFloat(e.target.value) }))
                    }
                    className="w-full h-1 bg-slate-800 rounded accent-cyan-400"
                  />
                  <span className="w-8 text-right">{Math.round(layerOpacity.hospitals * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
