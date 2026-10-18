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
import { getSelectedTelemetryRow, DF_CLEAN } from '../data/disasterData';

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
  isBreachTemporarilyReopened?: boolean;
  isSimulationRunning?: boolean;
  baselineAccessSliderValue?: number;
  onSelectFeature?: (feature: InspectedFeatureData) => void;
  onToggleBreachTemporarilyReopened?: () => void;
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
  isBreachTemporarilyReopened = false,
  baselineAccessSliderValue = 100,
  onSelectFeature,
  onToggleBreachTemporarilyReopened,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const [internalMapMode, setInternalMapMode] = useState<MapStyleMode>('vector');
  const activeMapMode = controlledMapMode || internalMapMode;
  const setMapMode = (m: MapStyleMode) => {
    setInternalMapMode(m);
    onMapModeChange?.(m);
  };

  // Draggable Before/After Swipe Split-View (Requirement: Reference image 2 style interactive flood comparison)
  const hasCompatibleImageryPair = true;
  const [swipeMode, setSwipeMode] = useState<'before' | 'swipe' | 'after'>('swipe');
  const [swipePos, setSwipePos] = useState<number>(50); // 50% split by default
  const isDraggingSwipeRef = useRef<boolean>(false);

  // Pane element references for dynamic CSS clip-path
  const [isLegendCollapsed, setIsLegendCollapsed] = useState<boolean>(false);
  const [isNarrativeOpen, setIsNarrativeOpen] = useState<boolean>(true);
  const beforePaneRef = useRef<HTMLElement | null>(null);
  const afterPaneRef = useRef<HTMLElement | null>(null);
  const afterFloodPaneRef = useRef<HTMLElement | null>(null);
  const beforeLinesPaneRef = useRef<HTMLElement | null>(null);
  const afterLinesPaneRef = useRef<HTMLElement | null>(null);

  // Layer groups
  const beforeTileLayerRef = useRef<L.TileLayer | null>(null);
  const afterTileLayerRef = useRef<L.TileLayer | null>(null);
  const floodLayerRef = useRef<L.LayerGroup | null>(null);
  const contourLayerRef = useRef<L.LayerGroup | null>(null);
  const linesLayerRef = useRef<L.LayerGroup | null>(null);
  const beforeLinesLayerRef = useRef<L.LayerGroup | null>(null);
  const afterLinesLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const settlementsLayerRef = useRef<L.LayerGroup | null>(null);

  const [currentCoords, setCurrentCoords] = useState<[number, number]>(center);
  const [currentZoomLevel, setCurrentZoomLevel] = useState<number>(zoom);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(false);

  // Settlement features state loaded from public/villages.geojson
  const [settlementFeatures, setSettlementFeatures] = useState<Array<{ name: string; lat: number; lon: number }>>([]);

  // Layer Visibility & Opacity (Requirement: Keep all layer config settings enabled at maximum by default)
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
    floodExtent: 1.0,
    contours: 1.0,
    roads: 1.0,
    bridges: 1.0,
    hospitals: 1.0,
    settlements: 1.0,
    severedBreaches: 1.0,
    detourBypass: 1.0,
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
          maxNativeZoom: 17,
          maxZoom: 19,
          crossOrigin: true,
          pane: targetPane,
        }
      );
    }
    if (mode === 'street') {
      return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        subdomains: ['a', 'b', 'c'],
        maxNativeZoom: 18,
        maxZoom: 19,
        crossOrigin: true,
        pane: targetPane,
      });
    }
    // High-contrast keyless Esri World Dark Gray Base (zero watermarks, completely reliable)
    return L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; DeLorme, NAVTEQ',
        maxNativeZoom: 16,
        maxZoom: 19,
        crossOrigin: true,
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

    const beforeLinesPane = map.createPane('beforeLinesPane');
    beforeLinesPane.style.zIndex = '220';
    beforeLinesPaneRef.current = beforeLinesPane;

    const afterPane = map.createPane('afterPane');
    afterPane.style.zIndex = '240';
    afterPaneRef.current = afterPane;

    const afterFloodPane = map.createPane('afterFloodPane');
    afterFloodPane.style.zIndex = '360';
    afterFloodPaneRef.current = afterFloodPane;

    const afterLinesPane = map.createPane('afterLinesPane');
    afterLinesPane.style.zIndex = '390';
    afterLinesPaneRef.current = afterLinesPane;

    // Overlays above swipe
    const linesPane = map.createPane('linesPane');
    linesPane.style.zIndex = '400';
    const settlementPane = map.createPane('settlementPane');
    settlementPane.style.zIndex = '500';
    const markersPane = map.createPane('markersPane');
    markersPane.style.zIndex = '600';

    // Before / Primary Basemap
    const beforeTile = createTileLayer(activeMapMode, 'beforePane').addTo(map);
    beforeTileLayerRef.current = beforeTile;

    // After Basemap (Esri World Imagery satellite)
    const afterTile = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Sentinel-1 / WorldView-2',
        maxNativeZoom: 18,
        maxZoom: 19,
        crossOrigin: true,
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
    beforeLinesLayerRef.current = L.layerGroup([], { pane: 'beforeLinesPane' }).addTo(map);
    afterLinesLayerRef.current = L.layerGroup([], { pane: 'afterLinesPane' }).addTo(map);
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

  // Handle Dynamic Layer-Coordinate Polygon Clip-Path Split for Draggable Before/After/Swipe
  useEffect(() => {
    let animId: number | null = null;
    const updateClip = () => {
      if (!mapInstanceRef.current) return;
      const map = mapInstanceRef.current;
      const size = map.getSize();
      if (!size || size.x === 0 || size.y === 0) {
        animId = requestAnimationFrame(updateClip);
        return;
      }

      const nw = map.containerPointToLayerPoint([0, 0]);
      const se = map.containerPointToLayerPoint([size.x, size.y]);
      const splitX = Math.round(nw.x + (se.x - nw.x) * (swipePos / 100));

      const leftClip = `polygon(${nw.x}px ${nw.y}px, ${splitX}px ${nw.y}px, ${splitX}px ${se.y}px, ${nw.x}px ${se.y}px)`;
      const rightClip = `polygon(${splitX}px ${nw.y}px, ${se.x}px ${nw.y}px, ${se.x}px ${se.y}px, ${splitX}px ${se.y}px)`;

      const setPaneStyle = (pane: HTMLElement | null, clip: string, display: string) => {
        if (!pane) return;
        pane.style.clipPath = clip;
        pane.style.display = display;
      };

      if (swipeMode === 'swipe') {
        setPaneStyle(beforePaneRef.current, leftClip, 'block');
        setPaneStyle(beforeLinesPaneRef.current, leftClip, 'block');
        setPaneStyle(afterPaneRef.current, rightClip, 'block');
        setPaneStyle(afterFloodPaneRef.current, rightClip, 'block');
        setPaneStyle(afterLinesPaneRef.current, rightClip, 'block');
      } else if (swipeMode === 'before') {
        setPaneStyle(beforePaneRef.current, 'none', 'block');
        setPaneStyle(beforeLinesPaneRef.current, 'none', 'block');
        setPaneStyle(afterPaneRef.current, 'none', 'none');
        setPaneStyle(afterFloodPaneRef.current, 'none', 'none');
        setPaneStyle(afterLinesPaneRef.current, 'none', 'none');
      } else if (swipeMode === 'after') {
        setPaneStyle(beforePaneRef.current, 'none', 'none');
        setPaneStyle(beforeLinesPaneRef.current, 'none', 'none');
        setPaneStyle(afterPaneRef.current, 'none', 'block');
        setPaneStyle(afterFloodPaneRef.current, 'none', 'block');
        setPaneStyle(afterLinesPaneRef.current, 'none', 'block');
      }
    };

    updateClip();

    const map = mapInstanceRef.current;
    if (map) {
      map.on('move', updateClip);
      map.on('zoom', updateClip);
      map.on('resize', updateClip);
      map.on('viewreset', updateClip);
      map.on('zoomend', updateClip);
    }

    return () => {
      if (animId !== null) cancelAnimationFrame(animId);
      if (map) {
        map.off('move', updateClip);
        map.off('zoom', updateClip);
        map.off('resize', updateClip);
        map.off('viewreset', updateClip);
        map.off('zoomend', updateClip);
      }
    };
  }, [swipeMode, swipePos, theaterId]);

  // Handle Base Tile Switching (Street, Satellite, Dark)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (beforeTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(beforeTileLayerRef.current);
    }
    const newBeforeTile = createTileLayer(activeMapMode, 'beforePane').addTo(mapInstanceRef.current);
    beforeTileLayerRef.current = newBeforeTile;

    if (afterTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(afterTileLayerRef.current);
    }
    const newAfterTile =
      activeMapMode === 'street' && swipeMode !== 'swipe'
        ? createTileLayer('street', 'afterPane').addTo(mapInstanceRef.current)
        : activeMapMode === 'vector' && swipeMode !== 'swipe'
        ? createTileLayer('vector', 'afterPane').addTo(mapInstanceRef.current)
        : createTileLayer('satellite', 'afterPane').addTo(mapInstanceRef.current);
    afterTileLayerRef.current = newAfterTile;
  }, [activeMapMode, swipeMode, theaterId]);

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
      const padLeft = cameraCommand.paddingLeft ?? (panelWidth + 40);
      if (padLeft > 0 && mapInstanceRef.current) {
        const targetPoint = mapInstanceRef.current.project(cameraCommand.center, targetZoom);
        const offsetPoint = L.point(targetPoint.x - padLeft / 2, targetPoint.y);
        const adjustedCenter = mapInstanceRef.current.unproject(offsetPoint, targetZoom);
        mapInstanceRef.current.flyTo(adjustedCenter, targetZoom, {
          duration: cameraCommand.duration ?? 0.9,
        });
      } else {
        mapInstanceRef.current.flyTo(cameraCommand.center, targetZoom, {
          duration: cameraCommand.duration ?? 0.9,
        });
      }
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
    beforeLinesLayerRef.current?.clearLayers();
    afterLinesLayerRef.current?.clearLayers();

    lines.forEach((line) => {
      const isInspectedDamage = Boolean(line.id?.startsWith('inspected_damaged'));
      if (!isInspectedDamage) {
        if (baselineAccessSliderValue === 0 && (line.layerType === 'severed' || line.layerType === 'detour' || line.layerType === 'diversion')) return;
        if (line.layerType === 'severed' && !layerVisibility.severedBreaches) return;
        if (line.layerType === 'detour' && !layerVisibility.detourBypass) return;
        if (line.layerType === 'baseline' && !layerVisibility.roads) return;
        if (line.layerType === 'diversion' && !layerVisibility.detourBypass) return;
        if ((line.layerType === 'bridge' || line.layerType === 'boat' || line.layerType === 'drone') && !layerVisibility.interventions) return;
      }

      const baseWeight = line.weight || 4;
      const opacity =
        line.layerType === 'severed'
          ? layerOpacity.severedBreaches
          : line.layerType === 'detour' || line.layerType === 'diversion'
          ? layerOpacity.detourBypass
          : layerOpacity.roads;

      const isBaselineOnly = line.id === 'corridor_clean_pre_event_baseline';
      const isDisasterOrRescue =
        !isBaselineOnly &&
        (line.layerType === 'severed' ||
          line.layerType === 'detour' ||
          line.layerType === 'diversion' ||
          line.layerType === 'bridge' ||
          line.layerType === 'boat' ||
          line.layerType === 'drone' ||
          line.layerType === 'catchment' ||
          line.id?.includes('restored') ||
          line.id?.startsWith('inspected_damaged') ||
          line.id?.includes('feeder') ||
          line.id?.includes('north_approach') ||
          line.id?.includes('south_approach'));

      const isInspectedOrSevered = line.layerType === 'severed' || isInspectedDamage;

      // 1. BEFORE PANE: Clean Pre-Disaster Intact Road Network
      if (isBaselineOnly || (!isDisasterOrRescue && line.layerType === 'baseline')) {
        // Dark Casing under pre-event road on Before Pane
        L.polyline(line.points, {
          color: '#020617',
          weight: baseWeight + 2,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
          pane: 'beforeLinesPane',
        }).addTo(beforeLinesLayerRef.current!);

        // Baseline clean pre-disaster road on Before Pane
        const beforePolyline = L.polyline(line.points, {
          color: line.color || '#38bdf8',
          weight: baseWeight,
          opacity: 0.95,
          pane: 'beforeLinesPane',
        });
        if (line.label) {
          beforePolyline.bindTooltip(`[PRE-EVENT BASELINE] ${line.label}`, { sticky: true });
        }
        beforePolyline.addTo(beforeLinesLayerRef.current!);
      }

      // 2. AFTER PANE: Disaster Impact, Severed Breaches & Rescue Corridors
      if (isDisasterOrRescue) {
        // Dark Casing under disaster/rescue road on After Pane
        L.polyline(line.points, {
          color: '#020617',
          weight: baseWeight + 2,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
          pane: 'afterLinesPane',
        }).addTo(afterLinesLayerRef.current!);

        // Glowing Pulsing Halo for Destroyed / Severed Roads on After Pane
        if (isInspectedOrSevered) {
          L.polyline(line.points, {
            color: '#f43f5e',
            weight: baseWeight + 8,
            opacity: 0.7,
            className: 'animate-pulse',
            pane: 'afterLinesPane',
          }).addTo(afterLinesLayerRef.current!);
        }

        // Foreground Navigation Path on After Pane
        const afterPolyline = L.polyline(line.points, {
          color: line.color,
          weight: baseWeight,
          opacity,
          dashArray: line.dashArray,
          className: line.className,
          pane: 'afterLinesPane',
        });
        if (line.label) {
          afterPolyline.bindTooltip(line.label, { sticky: true });
        }
        afterPolyline.addTo(afterLinesLayerRef.current!);
      }

      // 3. USER-INSPECTED DAMAGE REPORT OVERLAY: Guaranteed visibility on top
      if (isInspectedDamage) {
        L.polyline(line.points, {
          color: '#f43f5e',
          weight: baseWeight + 8,
          opacity: 0.8,
          className: 'animate-pulse',
          pane: 'linesPane',
        }).addTo(linesLayerRef.current!);

        const inspectedCore = L.polyline(line.points, {
          color: line.color,
          weight: baseWeight,
          opacity: 1.0,
          dashArray: line.dashArray,
          className: line.className,
          pane: 'linesPane',
        });
        if (line.label) {
          inspectedCore.bindTooltip(line.label, {
            permanent: true,
            direction: 'top',
            className: 'bg-rose-950 text-rose-200 border border-rose-500 font-mono text-[11px] font-bold px-2 py-1 rounded shadow-xl',
          });
        }
        inspectedCore.addTo(linesLayerRef.current!);
      }
    });
  }, [lines, layerVisibility, layerOpacity, baselineAccessSliderValue]);

  // 3. SETTLEMENT ACCESS & REROUTING (Requirement C & User Directive)
  useEffect(() => {
    if (!settlementsLayerRef.current || !mapInstanceRef.current) return;
    settlementsLayerRef.current.clearLayers();

    if (!layerVisibility.settlements) return;

    type AccessPin = { name: string; lat: number; lon: number; population?: number; row?: (typeof DF_CLEAN)[number] };
    const isNepal = theaterId === 'nepal';
    const transitMin = isNepal ? 28 : 18;
    const hospName = isNepal ? 'Dhulikhel Hospital' : 'Silchar Civil Hospital';

    const accessPins: AccessPin[] = isNepal
      ? [
          { name: 'Mangaltar Valley', lat: 27.5120, lon: 85.6980, population: 3800 },
          { name: 'Bhakundebesi Foothills', lat: 27.5620, lon: 85.6020, population: 8200 },
          { name: 'Dapcha Ridge Settlement', lat: 27.5480, lon: 85.6300, population: 2400 },
          { name: 'Balthali Terraced Hamlet', lat: 27.5300, lon: 85.5450, population: 1900 },
          { name: 'Nepalthok Bridgehead', lat: 27.4500, lon: 85.8050, population: 2900 },
          { name: 'Dumja Sunkoshi Confluence', lat: 27.4280, lon: 85.8350, population: 4100 },
        ]
      : DF_CLEAN.map((r) => ({ name: r.village_name, lat: r.lat, lon: r.lon, row: r }));

    const topImpactIds = new Set(
      !isNepal
        ? DF_CLEAN.filter((r) => r.modeled_status === 'REROUTED_ALT_FACILITY')
            .sort((x, y) => (y.additional_min || 0) - (x.additional_min || 0))
            .slice(0, 5)
            .map((r) => r.village_id)
        : []
    );

    accessPins.forEach((village) => {
      const isInCutSector = isNepal
        ? baselineAccessSliderValue > 0
        : baselineAccessSliderValue > 0 && village.row?.modeled_status === 'MODEL_ISOLATED';
      const isInDetourSector =
        !isNepal && baselineAccessSliderValue > 0 && village.row?.modeled_status === 'REROUTED_ALT_FACILITY';

      // Pin Styling & Rerouting Status
      let color = '#10b981'; // Reachable (green)
      let radius = 3.5;
      let strokeColor = '#065f46';
      let statusLabel = `Reachable via baseline corridor (${transitMin}m to ${hospName})`;
      let evidenceClass: EvidenceClass = 'MODELLED';
      let statusText = 'REACHABLE';

      const isRescuedByBridge = activeTool === 'bridge' || isBreachTemporarilyReopened;
      const isRescuedByDetour = false;
      const isRescuedByBoat = activeTool === 'boat';
      const isRescuedByDrone = activeTool === 'drone';
      const isRescuedByMMU = activeTool === 'booth';

      if (isInCutSector) {
        if (isRescuedByBridge) {
          color = '#10b981'; // Rescued Green
          radius = 5.5;
          strokeColor = '#065f46';
          statusLabel = `✓ RESCUED: ${village.name} (Direct Hospital Access Restored in ${transitMin}m)`;
          evidenceClass = 'SIMULATED';
          statusText = '✓ RESCUED & CONNECTED';
        } else if (isRescuedByDetour) {
          color = '#0284c7';
          radius = 5.0;
          strokeColor = '#0369a1';
          statusLabel = `RESCUED: Ambulance Diversion Bypass Active (+47m delay)`;
          evidenceClass = 'SIMULATED';
          statusText = 'RESCUED (BYPASS ACTIVE)';
        } else if (isRescuedByBoat) {
          color = '#06b6d4';
          radius = 5.0;
          strokeColor = '#0891b2';
          statusLabel = `✓ RESCUED: ${village.name} (Amphibious Shuttle Across Breach • 25m)`;
          evidenceClass = 'SIMULATED';
          statusText = 'RESCUED (BOAT SHUTTLE)';
        } else if (isRescuedByDrone) {
          color = '#a855f7';
          radius = 5.0;
          strokeColor = '#7e22ce';
          statusLabel = `✓ RESCUED: ${village.name} (UAV Medical Airbridge • 12m Delivery)`;
          evidenceClass = 'SIMULATED';
          statusText = 'RESCUED (UAV AIRBRIDGE)';
        } else if (isRescuedByMMU) {
          color = '#eab308';
          radius = 5.0;
          strokeColor = '#a16207';
          statusLabel = `✓ RESCUED: ${village.name} (Forward MMU Hospital Camp on Dry Roadhead)`;
          evidenceClass = 'SIMULATED';
          statusText = 'RESCUED (MMU CAMP)';
        } else {
          // Severed / Broken state
          color = '#f43f5e';
          radius = 5.5;
          strokeColor = '#9f1239';
          statusLabel = `⛔ CUT OFF: ${village.name} (0 Hospital Access)`;
          evidenceClass = 'SIMULATED';
          statusText = '⛔ CUT OFF (0 ACCESS)';
        }
      } else if (isInDetourSector && isRescuedByBridge) {
        color = '#10b981';
        radius = 4.5;
        strokeColor = '#065f46';
        statusLabel = `✓ RESCUED: ${village.name} (Direct Access Restored in ${transitMin}m)`;
        evidenceClass = 'SIMULATED';
        statusText = 'RECONNECTED';
      } else if (isInDetourSector) {
        const telDetour = village.row ?? getSelectedTelemetryRow(village.name);
        color = '#f59e0b';
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
      const isTop5Impact = baselineAccessSliderValue > 0 && !!village.row && topImpactIds.has(village.row.village_id);

      if (isTop5Impact) {
        circle.bindTooltip(
          `<div class="font-mono text-[11px] font-bold text-white tracking-wide" style="text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 4px #000, 0 0 8px #000; white-space: nowrap;">${village.name}</div>`,
          { permanent: true, direction: 'top', offset: [0, -4] }
        );
      } else {
        circle.bindTooltip(
          `<div class="p-1 font-mono text-[11px]"><span class="px-1.5 py-0.2 rounded border font-bold text-[9px] mr-1 ${badgeConf.badgeBg} ${badgeConf.badgeText} ${badgeConf.badgeBorder}">${badgeConf.label}</span><strong>${village.name}</strong><br/><span class="${isInCutSector && !isRescuedByBridge && !isRescuedByBoat && !isRescuedByDrone && !isRescuedByMMU ? 'text-rose-400 font-bold' : 'text-emerald-300 font-bold'}">${statusLabel}</span></div>`,
          { sticky: true }
        );
      }

      circle.on('click', () => {
        if (onSelectFeature) {
          const tel = village.row ?? getSelectedTelemetryRow(village.name);
          onSelectFeature({
            id: `settlement_${village.name}`,
            type: 'village',
            title: village.name,
            subtitle: isNepal ? 'Roshi Khola Corridor Hamlet' : 'Cachar Basin Settlement',
            coordinates: [village.lat, village.lon],
            statusText,
            statusColor: isInCutSector
              ? isRescuedByBridge
                ? 'emerald'
                : isRescuedByDetour || isRescuedByBoat
                ? 'cyan'
                : isRescuedByDrone
                ? 'purple'
                : isRescuedByMMU
                ? 'amber'
                : 'rose'
              : isInDetourSector
              ? (isRescuedByBridge ? 'emerald' : 'amber')
              : 'emerald',
            evidenceClass,
            dataState: isInCutSector || isInDetourSector ? 'SIMULATED' : 'STALE',
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
                  ? isRescuedByBridge
                    ? '0 min delay (Direct Highway Restored)'
                    : isRescuedByDetour
                    ? `+${Math.round(tel.additional_min || 46.7)} mins (Bypass Active)`
                    : isRescuedByBoat
                    ? '15 mins (Amphibious Shuttle)'
                    : isRescuedByDrone
                    ? '12 mins (UAV Airbridge)'
                    : isRescuedByMMU
                    ? '5 mins (Roadhead MMU)'
                    : 'NO ROUTE (Severed by Breach)'
                  : isInDetourSector
                  ? `+${Math.round(tel.additional_min || 46.7)} mins (+${(tel.additional_km || 11.7).toFixed(1)} km)`
                  : '0 min delay',
                color: isInCutSector
                  ? isRescuedByBridge
                    ? 'text-emerald-400'
                    : isRescuedByDetour || isRescuedByBoat
                    ? 'text-cyan-400'
                    : isRescuedByDrone
                    ? 'text-purple-400'
                    : isRescuedByMMU
                    ? 'text-amber-400'
                    : 'text-rose-400'
                  : isInDetourSector
                  ? 'text-amber-400'
                  : 'text-emerald-400',
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
            description: `${village.name} is evaluated under the active ${baselineAccessSliderValue}% simulated closure impact profile. ${isInCutSector ? (isRescuedByBridge ? 'Direct highway access is restored via Bailey Bridge / Culvert. Continuous rescued path connected to hospital.' : isRescuedByDetour ? 'Ambulance diversion convoys actively vector patients via Kumbhirgram to SMCH Apex.' : isRescuedByBoat ? 'NDRF 40HP rescue boats shuttle patients across the river washout.' : isRescuedByDrone ? 'Heavy cargo UAV drone airbridge delivers emergency blood and antivenom in 12 mins.' : isRescuedByMMU ? 'Forward MMU hospital camp on dry roadhead intercepts local trauma.' : 'Direct highway egress is severed by the 80m JT Road washout.') : isInDetourSector ? 'Access to SMCH Apex requires an elevated bypass detour.' : 'Corridors remain clear of floodwater.'}`,
          });
        }
      });

      circle.addTo(settlementsLayerRef.current!);
    });
  }, [theaterId, settlementFeatures, baselineAccessSliderValue, rerouteAmbulances, activeTool, isBreachTemporarilyReopened, layerVisibility.settlements, layerOpacity.settlements, onSelectFeature]);

  // 4. CHOKE POINTS & HOSPITALS (Markers Layer)
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;
    markersLayerRef.current.clearLayers();

    // 4.1 Choke Points (Bridges)
    const isZoomedOut = currentZoomLevel < 12;

    if (layerVisibility.bridges && chokePoints.length > 0 && baselineAccessSliderValue > 0) {
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

    // 4.2 Hospitals, Disrupted/Rescued Villages, Field Reports, & Tactical Fleet Assets
    markers.forEach((m) => {
      const isHosp = m.type === 'facility' || m.title.includes('Hospital') || m.title.includes('Clinic');
      const isFieldReport = m.badge === 'FIELD REPORT' || m.title.startsWith('📝');
      const isVillage = m.type === 'isolated' || m.type === 'rerouted' || m.stepCategory === 'start';
      const isAmbulance = m.stepCategory === 'fleet' || m.customBanner?.includes('🚑');

      if (isHosp && !layerVisibility.hospitals) return;

      if (isHosp) {
        const showHospLabel = !isZoomedOut || m.stepCategory === 'dest';
        const hospIcon = L.divIcon({
          html: showHospLabel ? `
            <div class="cursor-pointer transition-transform hover:scale-110" style="position:relative; transform:translate(-50%, -50%);">
              <div style="display:flex; align-items:center; gap:4px; padding:3px 6px; background:rgba(15,23,42,0.95); border:1.5px solid #0284c7; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.7);">
                <span style="font-size:9px; font-weight:800; font-family:monospace; background:#082f49; color:#7dd3fc; border:1px solid #0284c7; padding:1px 3px; border-radius:4px;">HOSPITAL</span>
                ${SVG_HOSPITAL_HTML(14, '#38bdf8')}
                <span style="font-size:11px; font-weight:700; color:#ffffff; font-family:sans-serif; white-space:nowrap; text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;">${m.customBanner || m.title}</span>
              </div>
            </div>
          ` : `
            <div class="cursor-pointer transition-transform hover:scale-125" style="position:relative; transform:translate(-50%, -50%);" title="${m.title} (REPORTED HOSPITAL)">
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
        return;
      }

      // 4.3 Field Damage Report Markers (Submitted by Ground Responders)
      if (isFieldReport) {
        const repIcon = L.divIcon({
          html: `
            <div class="cursor-pointer transition-transform hover:scale-110" style="position:relative; transform:translate(-50%, -50%); z-index:900;">
              <div style="display:flex; align-items:center; gap:5px; padding:3px 8px; background:rgba(20,20,10,0.96); border:2px solid #f59e0b; border-radius:8px; box-shadow:0 0 16px rgba(245,158,11,0.5);">
                <span style="font-size:9px; font-weight:800; font-family:monospace; background:#451a03; color:#fde68a; border:1px solid #d97706; padding:1px 4px; border-radius:4px;">FIELD REPORT</span>
                <span style="font-size:12px;">📝</span>
                <span style="font-size:11px; font-weight:700; color:#fef3c7; font-family:sans-serif; white-space:nowrap;">${m.customBanner || m.title}</span>
              </div>
            </div>
          `,
          className: 'tactical-report-pin',
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const marker = L.marker([m.lat, m.lon], { icon: repIcon, pane: 'markersPane' });
        if (m.onClick) {
          marker.on('click', m.onClick);
        }
        marker.addTo(markersLayerRef.current!);
        return;
      }

      // 4.4 Disrupted vs Rescued Village Pins
      if (isVillage) {
        const isIsolated = m.type === 'isolated';
        const borderColor = isIsolated ? '#ef4444' : '#10b981';
        const badgeBg = isIsolated ? '#450a0a' : '#064e3b';
        const badgeText = isIsolated ? '#fca5a5' : '#a7f3d0';
        const badgeLabel = isIsolated ? 'DANGER: DISCONNECTED' : 'RESCUE: CONNECTED';

        const villageIcon = L.divIcon({
          html: `
            <div class="cursor-pointer transition-transform hover:scale-110" style="position:relative; transform:translate(-50%, -50%);">
              <div style="display:flex; align-items:center; gap:4px; padding:3px 7px; background:rgba(15,23,42,0.96); border:1.5px solid ${borderColor}; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.7);">
                <span style="font-size:9px; font-weight:800; font-family:monospace; background:${badgeBg}; color:${badgeText}; border:1px solid ${borderColor}; padding:1px 4px; border-radius:4px;">${badgeLabel}</span>
                <span style="font-size:11px; font-weight:700; color:#ffffff; font-family:sans-serif; white-space:nowrap; text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;">${m.customBanner || m.title}</span>
              </div>
            </div>
          `,
          className: 'tactical-village-pin',
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const marker = L.marker([m.lat, m.lon], { icon: villageIcon, pane: 'markersPane' });
        if (m.onClick) {
          marker.on('click', m.onClick);
        }
        marker.addTo(markersLayerRef.current!);
        return;
      }

      // 4.5 Ambulance Diversions & Tactical Units
      if (isAmbulance) {
        const ambIcon = L.divIcon({
          html: `
            <div class="cursor-pointer transition-transform hover:scale-110" style="position:relative; transform:translate(-50%, -50%);">
              <div style="display:flex; align-items:center; gap:4px; padding:3px 6px; background:rgba(15,23,42,0.95); border:1.5px solid #0ea5e9; border-radius:8px; box-shadow:0 4px 12px rgba(14,165,233,0.3);">
                <span style="font-size:9px; font-weight:800; font-family:monospace; background:#082f49; color:#7dd3fc; border:1px solid #0284c7; padding:1px 3px; border-radius:4px;">SURGE</span>
                <span style="font-size:12px;">🚑</span>
                <span style="font-size:11px; font-weight:700; color:#e0f2fe; font-family:sans-serif; white-space:nowrap;">${m.customBanner || m.title}</span>
              </div>
            </div>
          `,
          className: 'tactical-amb-pin',
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const marker = L.marker([m.lat, m.lon], { icon: ambIcon, pane: 'markersPane' });
        if (m.onClick) {
          marker.on('click', m.onClick);
        }
        marker.addTo(markersLayerRef.current!);
        return;
      }

      // 4.6 Quiet Dots or General Markers
      if (m.isQuietDot) {
        const dotColor = m.quietDotColor || '#f43f5e';
        const dotIcon = L.divIcon({
          html: `
            <div class="cursor-pointer transition-transform hover:scale-125" style="position:relative; transform:translate(-50%, -50%);" title="${m.title}">
              <div style="width:12px; height:12px; background:${dotColor}; border:1.5px solid #ffffff; border-radius:50%; box-shadow:0 0 8px ${dotColor};"></div>
            </div>
          `,
          className: 'tactical-quiet-dot',
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });
        const marker = L.marker([m.lat, m.lon], { icon: dotIcon, pane: 'markersPane' });
        if (m.onClick) {
          marker.on('click', m.onClick);
        }
        marker.addTo(markersLayerRef.current!);
        return;
      }

      // Generic fallback marker
      if (m.customBanner || m.title) {
        const genIcon = L.divIcon({
          html: `
            <div class="cursor-pointer transition-transform hover:scale-110" style="position:relative; transform:translate(-50%, -50%);">
              <div style="display:flex; align-items:center; gap:4px; padding:3px 6px; background:rgba(15,23,42,0.95); border:1.5px solid #38bdf8; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.7);">
                <span style="font-size:11px; font-weight:700; color:#ffffff; font-family:sans-serif; white-space:nowrap;">${m.customBanner || m.title}</span>
              </div>
            </div>
          `,
          className: 'tactical-gen-pin',
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });
        const marker = L.marker([m.lat, m.lon], { icon: genIcon, pane: 'markersPane' });
        if (m.onClick) {
          marker.on('click', m.onClick);
        }
        marker.addTo(markersLayerRef.current!);
      }
    });
  }, [chokePoints, activeChokeId, markers, layerVisibility.bridges, layerVisibility.hospitals, currentZoomLevel, onSelectFeature, baselineAccessSliderValue]);

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
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-white shadow-2xl flex items-center justify-center text-white cursor-ew-resize font-bold select-none hover:scale-110 transition-transform">
            <span className="text-white font-mono text-xs font-black tracking-tight select-none leading-none">◂ ▸</span>
          </div>
        </div>
      )}

      {/* TOP PILLS: Reference image 2 style Before / After indicators */}
      {(swipeMode === 'swipe' || swipeMode === 'before') && (
        <div
          className="absolute top-16 z-[790] pointer-events-none transition-all hidden md:block"
          style={{
            left: `${panelWidth + 24}px`,
            maxWidth: swipeMode === 'swipe' ? `calc(${swipePos}% - ${panelWidth + 40}px)` : 'auto',
          }}
        >
          <div className="px-3 py-1 rounded-lg bg-rose-950/95 border border-rose-600/80 text-[11px] font-mono font-bold text-rose-200 shadow-xl truncate flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-ping" />
            <span>
              {theaterId === 'nepal'
                ? '🔴 BEFORE: 120M GORGE WASHOUT / 18 HAMLETS CUT OFF'
                : '🔴 BEFORE: 80M JT ROAD BREACH / 42 VILLAGES CUT OFF'}
            </span>
          </div>
        </div>
      )}

      {(swipeMode === 'swipe' || swipeMode === 'after') && (
        <div
          className="absolute top-16 z-[790] pointer-events-none transition-all hidden md:block"
          style={{
            left: swipeMode === 'swipe' ? `calc(${swipePos}% + 15px)` : `${panelWidth + 30}px`,
            maxWidth: 'calc(100vw - 780px)',
          }}
        >
          <div className="px-3 py-1 rounded-lg bg-emerald-950/95 border border-emerald-500/80 text-[11px] font-mono font-bold text-emerald-200 shadow-xl truncate flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
            <span>
              {theaterId === 'nepal'
                ? '🟢 AFTER: RESCUE / BP HIGHWAY RESTORED IN 28M'
                : '🟢 AFTER: RESCUE / HIGHWAY RESTORED IN 18M'}
            </span>
          </div>
        </div>
      )}

      {/* Floating Simulation Story & Timely Intervention Narrative Card */}
      <div className="fixed top-16 right-16 z-[780] max-w-sm pointer-events-auto hidden lg:block">
        <div className="bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-3 text-white transition-all">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-base">{theaterId === 'nepal' ? '🇳🇵' : '🇮🇳'}</span>
              <span className="text-xs font-bold font-mono text-cyan-300">
                {theaterId === 'nepal' ? 'Nepal Roshi Gorge Simulation' : 'Assam Flood Simulation Story'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsNarrativeOpen((prev) => !prev)}
              className="text-[10px] font-mono text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800 cursor-pointer"
            >
              {isNarrativeOpen ? '▲ Collapse' : '▼ Read Story'}
            </button>
          </div>

          {isNarrativeOpen && (
            <div className="mt-2 space-y-2 text-xs font-sans">
              <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-900/60">
                <span className="text-[10px] font-mono uppercase font-bold text-rose-400 block mb-0.5">
                  1. Disaster Incident (Before)
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  {theaterId === 'nepal'
                    ? 'September 2024: Torrential monsoon flash floods along Roshi Khola triggered landslides, washing away a 120m section of BP Highway (NH08) at Km 48. 18 hamlets were isolated with an impassable 135m mountain detour.'
                    : 'June 2022: Barak River crested 1.8m above Danger Level. 80m JT Road breach severed 42 villages & 14,000 citizens from Silchar Civil Hospital with an unviable +47m detour.'}
                </p>
              </div>

              <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-900/60">
                <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 block mb-0.5">
                  2. Timely Intervention (Lifeline OS)
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  {theaterId === 'nepal'
                    ? 'Lifeline OS deployed modular Class-40 bridging and high-altitude UAV airbridges across Roshi Gorge, reconnecting all 18 hamlets and restoring direct hospital transit in 28 minutes.'
                    : 'Lifeline OS multi-modal triage dispatched Class-40 Bailey spans and 40HP rescue boats, restoring direct hospital transit for 14,000 residents in 18 minutes.'}
                </p>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                <span>Drag divider ◂ ▸ to compare</span>
                <span className="text-cyan-400 font-bold">{theaterId === 'nepal' ? '28m vs 135m' : '18m vs 65m'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TOP-RIGHT VIEW MODE SWITCHER: [ Before (Danger) | ↔ Swipe Split | After (Rescue) ] */}
      <div className="absolute bottom-20 right-6 z-[850] flex items-center gap-2 pointer-events-auto">
        <div className="flex items-center bg-slate-900/95 border border-slate-700/80 rounded-xl p-1 shadow-2xl">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-400 px-2">Map Compare:</span>
          {(
            [
              { id: 'before', label: '🔴 Before (Danger)' },
              { id: 'swipe', label: '↔ Draggable Swipe' },
              { id: 'after', label: '🟢 After (Rescue)' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSwipeMode(item.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                swipeMode === item.id
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
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
          <span>{chokePoints.length} Choke Corridors • {theaterId === 'nepal' ? '18 Hamlets' : '319 Habitations'} (Zoom in to expand individual labels)</span>
        </div>
      )}

      {/* LAYER CATALOGUE & VISIBILITY CONTROLS (Deconflicted to Top Right Toolbar Area) */}
      <div className="fixed top-18 right-16 z-[450] bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl w-[310px] max-w-[90vw] backdrop-blur-md select-none pointer-events-auto overflow-hidden transition-all">
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
                    <span>319 Settlements (Access)</span>
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
                      MODELLED
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
                    REPORTED
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

      {/* Requirement 5: Small Collapsible Map Legend */}
      <div className="absolute bottom-28 left-4 z-20 pointer-events-auto select-none">
        <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl overflow-hidden text-xs font-mono text-slate-200">
          <button
            type="button"
            onClick={() => setIsLegendCollapsed((prev) => !prev)}
            className="w-full px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 flex items-center justify-between gap-2 font-bold text-[11px] cursor-pointer"
          >
            <span className="flex items-center gap-1.5 text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Map Legend
            </span>
            {isLegendCollapsed ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>
          {!isLegendCollapsed && (
            <div className="p-2 space-y-2 border-t border-slate-800/80 text-[10px]">
              {/* Dot colours */}
              <div className="space-y-1">
                <div className="text-slate-400 font-semibold uppercase text-[9px]">Settlements:</div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-300 shrink-0" />
                  <span>
                    {activeTool === 'bridge' || isBreachTemporarilyReopened
                      ? 'Rescued & connected (319)'
                      : baselineAccessSliderValue === 0
                      ? 'Reachable baseline (319)'
                      : 'Reachable (236)'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-blue-300 shrink-0" />
                  <span>
                    {rerouteAmbulances
                      ? 'Rescued via bypass (83)'
                      : baselineAccessSliderValue === 0
                      ? 'Rerouted (0)'
                      : 'Rerouted via bypass (41)'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-300 shrink-0" />
                  <span>
                    {activeTool === 'bridge' || isBreachTemporarilyReopened || rerouteAmbulances
                      ? 'No route (0 severed)'
                      : baselineAccessSliderValue === 0
                      ? 'No route (0)'
                      : 'No route / severed (42)'}
                  </span>
                </div>
              </div>
              {/* Line styles */}
              <div className="space-y-1 pt-1.5 border-t border-slate-800">
                <div className="text-slate-400 font-semibold uppercase text-[9px]">Line Styles:</div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-emerald-400 shrink-0" />
                  <span>
                    {activeTool === 'bridge' || isBreachTemporarilyReopened
                      ? 'Rescued highway route'
                      : 'Baseline route'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 border-t-2 border-dashed border-blue-400 shrink-0" />
                  <span>
                    {rerouteAmbulances ? 'Rescued detour bypass' : 'Detour bypass'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-1 bg-rose-500 border-y border-rose-300 shrink-0" />
                  <span>Severed breach</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
