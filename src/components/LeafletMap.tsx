import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, ChevronUp, ChevronDown, Map, Satellite, Moon } from 'lucide-react';
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
  BridgeIcon,
  CampIcon,
  DroneIcon,
  BoatIcon,
  BreachHazardIcon,
  FreightTruckIcon,
} from './common/TacticalIcons';

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
  floodStage?: number; // 1: +1.5m Warning, 2: +3.0m Bank Overtop, 3: +4.5m Severe Basin Surge
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
}

function interpolateAlongPath(pts: [number, number][], progress: number): [number, number] {
  if (!pts || pts.length === 0) return [24.872, 92.845];
  if (pts.length === 1) return pts[0];

  const totalSegments = pts.length - 1;
  const target = Math.max(0, Math.min(progress, 1)) * totalSegments;
  const idx = Math.min(Math.floor(target), totalSegments - 1);
  const frac = target - idx;

  const p1 = pts[idx];
  const p2 = pts[idx + 1];

  const lat = p1[0] + (p2[0] - p1[0]) * frac;
  const lon = p1[1] + (p2[1] - p1[1]) * frac;
  return [Number(lat.toFixed(5)), Number(lon.toFixed(5))];
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
  isWindVisualized = false,
  windSpeed = 14.2,
  fieldSosEvents = [],
  mapMode: controlledMapMode,
  onMapModeChange,
  rerouteAmbulances = false,
  isSimulationRunning = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [internalMapMode, setInternalMapMode] = useState<MapStyleMode>('vector');
  const activeMapMode = controlledMapMode || internalMapMode;
  const setMapMode = (m: MapStyleMode) => {
    setInternalMapMode(m);
    onMapModeChange?.(m);
  };
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(true);

  // Before / After / Swipe split-view state (Exactly like Nepal Flood reference)
  const [swipeMode, setSwipeMode] = useState<'before' | 'swipe' | 'after'>('swipe');
  const [swipePos, setSwipePos] = useState<number>(50); // 50% split by default
  const isDraggingSwipeRef = useRef<boolean>(false);
  const beforePaneRef = useRef<HTMLElement | null>(null);
  const afterPaneRef = useRef<HTMLElement | null>(null);

  // Real-time mouse coordinate and zoom telemetry
  const [currentCoords, setCurrentCoords] = useState<[number, number]>(center);
  const [currentZoomLevel, setCurrentZoomLevel] = useState<number>(zoom);

  // Categorized Layer Catalogue Visibility (Nepal / HOT Reference Specification)
  const [layerVisibility, setLayerVisibility] = useState({
    bridges: true,
    roads: true,
    hospitals: true,
    villages: true,
    floodExtent: true,
    severedBreaches: true,
    detourBypass: true,
    interventions: true,
    buildings: true,
  });

  const toggleLayerItem = (key: keyof typeof layerVisibility) => {
    setLayerVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setAllLayers = (val: boolean) => {
    setLayerVisibility({
      bridges: val,
      roads: val,
      hospitals: val,
      villages: val,
      floodExtent: val,
      severedBreaches: val,
      detourBypass: val,
      interventions: val,
      buildings: val,
    });
  };

  const floodLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const linesLayerRef = useRef<L.LayerGroup | null>(null);
  const fleetLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);
  const roadsLayerRef = useRef<L.TileLayer | null>(null);

  const createTileLayer = (mode: MapStyleMode, pane?: string) => {
    if (mode === 'vector') {
      return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        className: 'tactical-dark-osm-tiles',
        pane: pane || 'tilePane',
      });
    }
    if (mode === 'street') {
      return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        className: 'muted-street-osm-tiles',
        pane: pane || 'tilePane',
      });
    }
    // Satellite
    return L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USDA, USGS, GeoEye',
        maxZoom: 18,
        className: 'muted-satellite-tiles',
        pane: pane || 'tilePane',
      }
    );
  };

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

    // Create custom Before / After Panes for Split-View
    const beforePane = map.createPane('beforePane');
    beforePane.style.zIndex = '410';
    beforePaneRef.current = beforePane;

    const afterPane = map.createPane('afterPane');
    afterPane.style.zIndex = '460';
    afterPaneRef.current = afterPane;

    // Before Basemap (OpenStreetMap dimmed baseline)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
      className: 'tactical-dark-osm-tiles',
      pane: 'beforePane',
    }).addTo(map);

    // After Basemap (Esri World Imagery satellite)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Sentinel-1 / WorldView-2',
        maxZoom: 18,
        className: 'muted-satellite-tiles',
        pane: 'afterPane',
      }
    ).addTo(map);

    // Real-time mouse and zoom listeners
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCurrentCoords([e.latlng.lat, e.latlng.lng]);
    });
    map.on('zoomend', () => {
      setCurrentZoomLevel(map.getZoom());
    });

    floodLayerRef.current = L.layerGroup([], { pane: 'afterPane' }).addTo(map);
    linesLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    fleetLayerRef.current = L.layerGroup().addTo(map);

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
    if (!beforePaneRef.current || !afterPaneRef.current) return;
    if (swipeMode === 'swipe') {
      beforePaneRef.current.style.clipPath = `inset(0 calc(100% - ${swipePos}%) 0 0)`;
      afterPaneRef.current.style.clipPath = `inset(0 0 0 ${swipePos}%)`;
      beforePaneRef.current.style.display = 'block';
      afterPaneRef.current.style.display = 'block';
    } else if (swipeMode === 'before') {
      beforePaneRef.current.style.clipPath = 'none';
      beforePaneRef.current.style.display = 'block';
      afterPaneRef.current.style.display = 'none';
    } else if (swipeMode === 'after') {
      afterPaneRef.current.style.clipPath = 'none';
      afterPaneRef.current.style.display = 'block';
      beforePaneRef.current.style.display = 'none';
    }
  }, [swipeMode, swipePos]);

  // Drag listeners for interactive swipe divider
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
      const rawX = clientX - rect.left;
      const pct = Math.max(5, Math.min(95, (rawX / rect.width) * 100));
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

  // Keyboard navigation for Swipe Divider (Left / Right Arrow, Home, End)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (swipeMode !== 'swipe') return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSwipePos((prev) => Math.max(5, Math.min(95, prev - 5)));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSwipePos((prev) => Math.max(5, Math.min(95, prev + 5)));
      } else if (e.key === 'Home') {
        setSwipePos(5);
      } else if (e.key === 'End') {
        setSwipePos(95);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [swipeMode]);

  // Initial Camera Fly when Theater changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [theaterId]);

  // Camera commands handling
  useEffect(() => {
    if (!mapInstanceRef.current || !cameraCommand) return;

    if (cameraCommand.type === 'overview') {
      const targetCenter = cameraCommand.center || center;
      const targetZoom = cameraCommand.zoom || 12;
      mapInstanceRef.current.flyTo(targetCenter, targetZoom, {
        duration: cameraCommand.duration ?? 1.1,
      });
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
      const pt = mapInstanceRef.current.project(cameraCommand.center, targetZoom);
      const shiftedPt = pt.subtract([(padLeft - 40) / 2, 0]);
      const shiftedCenter = mapInstanceRef.current.unproject(shiftedPt, targetZoom);
      mapInstanceRef.current.flyTo(shiftedCenter, targetZoom, {
        duration: cameraCommand.duration ?? 0.9,
      });
    }
  }, [cameraCommand?.id]);

  // Clean targeting reticle when a target is highlighted (No circular blobs)
  useEffect(() => {
    if (!mapInstanceRef.current || !pulsingTarget || !markersLayerRef.current) return;
    const pulseHtml = `
      <div style="position:relative; width:22px; height:22px; transform:translate(-50%, -50%); pointer-events:none;">
        <div style="position:absolute; inset:0; border:1.5px solid #38bdf8; border-radius:3px; opacity:0.85; animation:ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position:absolute; inset:5px; border:1.5px solid #0284c7; border-radius:2px; background:rgba(2,132,199,0.2);"></div>
      </div>
    `;
    const pulseIcon = L.divIcon({
      html: pulseHtml,
      className: 'target-reticle-marker',
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
    const pulseMarker = L.marker([pulsingTarget[0], pulsingTarget[1]], { icon: pulseIcon });
    pulseMarker.addTo(markersLayerRef.current);
    const timer = setTimeout(() => {
      if (markersLayerRef.current && markersLayerRef.current.hasLayer(pulseMarker)) {
        markersLayerRef.current.removeLayer(pulseMarker);
      }
    }, 2800);
    return () => {
      clearTimeout(timer);
      if (markersLayerRef.current && markersLayerRef.current.hasLayer(pulseMarker)) {
        markersLayerRef.current.removeLayer(pulseMarker);
      }
    };
  }, [pulsingTarget?.[0], pulsingTarget?.[1]]);

  // Handle Base Tile Switching
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const newTile = createTileLayer(activeMapMode).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;

    if (labelsLayerRef.current) {
      mapInstanceRef.current.removeLayer(labelsLayerRef.current);
    }
    if (roadsLayerRef.current) {
      mapInstanceRef.current.removeLayer(roadsLayerRef.current);
    }

    if (activeMapMode === 'satellite') {
      if (labelsLayerRef.current) {
        labelsLayerRef.current.addTo(mapInstanceRef.current);
        labelsLayerRef.current.bringToFront();
      }
      if (roadsLayerRef.current) {
        roadsLayerRef.current.addTo(mapInstanceRef.current);
        roadsLayerRef.current.bringToFront();
      }
    }
  }, [activeMapMode]);

  // 1. AUTHENTIC GIS FLOOD INUNDATION BASIN & RIVER CHANNEL (Respects Layer Catalogue)
  useEffect(() => {
    if (!floodLayerRef.current || !mapInstanceRef.current) return;
    floodLayerRef.current.clearLayers();

    // 1.1 Authentic Flood Inundation Polygon
    if (layerVisibility.floodExtent && floodPolygon && floodPolygon.length >= 3) {
      L.polygon(floodPolygon, {
        color: '#0284c7',
        weight: 1.5,
        opacity: 0.55,
        fillColor: '#0369a1',
        fillOpacity: 0.22 + Math.min(0.08, floodStage * 0.03),
        className: 'flood-basin-overlay',
        pane: 'afterPane',
      }).addTo(floodLayerRef.current);
    }

    if (riverPath && riverPath.length >= 2) {
      // 1.2 Natural River Bank Casing
      L.polyline(riverPath, {
        color: '#0369a1',
        weight: 4,
        opacity: 0.45,
        lineCap: 'butt',
        lineJoin: 'round',
        pane: 'afterPane',
      }).addTo(floodLayerRef.current);

      // 1.3 Natural Deep River Water Channel
      L.polyline(riverPath, {
        color: '#38bdf8',
        weight: 2,
        opacity: 0.85,
        lineCap: 'butt',
        lineJoin: 'round',
        pane: 'afterPane',
      }).addTo(floodLayerRef.current);
    }
  }, [riverPath, floodPolygon, floodStage, layerVisibility.floodExtent]);

  // 2. GOOGLE MAPS / UBER WINDING ROAD NAVIGATION (Respects Layer Catalogue & Panes)
  useEffect(() => {
    if (!linesLayerRef.current || !mapInstanceRef.current) return;
    linesLayerRef.current.clearLayers();

    lines.forEach((line) => {
      // Filter by Layer Catalogue
      if (line.layerType === 'severed' && !layerVisibility.severedBreaches) return;
      if (line.layerType === 'detour' && !layerVisibility.detourBypass) return;
      if (line.layerType === 'baseline' && !layerVisibility.roads) return;
      if ((line.layerType === 'bridge' || line.layerType === 'boat' || line.layerType === 'drone') && !layerVisibility.interventions) return;

      const isPostDisasterLine =
        line.layerType === 'severed' ||
        line.layerType === 'detour' ||
        line.layerType === 'boat' ||
        line.layerType === 'drone';

      const targetPane = isPostDisasterLine ? 'afterPane' : 'beforePane';

      // 1. Dark Road Casing underneath
      L.polyline(line.points, {
        color: '#020617',
        weight: (line.weight || 4) + 2,
        opacity: 0.95,
        lineCap: 'butt',
        lineJoin: 'round',
        pane: targetPane,
      }).addTo(linesLayerRef.current!);

      // 2. Bright Navigation Path on top
      let customClass = line.className || '';
      if (line.layerType === 'drone') {
        customClass = 'drone-airbridge-path active-drone-airbridge';
      } else if (line.layerType === 'boat') {
        customClass = 'boat-ferry-path active-boat-shuttle';
      } else if (line.layerType === 'severed') {
        customClass = 'breach-hazard-pulsing active-breach-hazard';
      } else if (line.layerType === 'detour') {
        customClass = 'active-flood-detour';
      } else if (line.layerType === 'catchment') {
        customClass = 'active-camp-roadhead';
      } else if (line.layerType === 'baseline' || line.layerType === 'bridge') {
        customClass = 'active-restored-highway';
      }

      const navPath = L.polyline(line.points, {
        color: line.color,
        weight: line.weight || 4,
        dashArray: line.dashArray,
        opacity: 1.0,
        lineCap: 'butt',
        lineJoin: 'round',
        className: customClass,
        pane: targetPane,
      }).addTo(linesLayerRef.current!);

      if (line.label) {
        navPath.bindTooltip(line.label, {
          permanent: false,
          sticky: true,
          direction: 'top',
          className:
            'bg-slate-900/95 text-slate-100 border border-slate-700 px-3 py-1.5 rounded-lg shadow-xl text-sm font-medium',
        });
      }
    });
  }, [lines, layerVisibility]);

  // 3. REQUIREMENT 2.3: CLEAN UBER / GOOGLE MAPS PIN CALLOUTS (SHOW ONLY FOR 1 SELECTED CORRIDOR!)
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;
    markersLayerRef.current.clearLayers();

    markers.forEach((m) => {
      // Filter by Layer Catalogue
      const isHosp = m.type === 'facility' || m.title.includes('Hospital') || m.title.includes('Clinic');
      const isVillage = m.type === 'isolated' || m.stepCategory === 'start';
      const isChoke = m.stepCategory === 'choke' || m.type === 'chokepoint';
      const isAmbulance = m.type === 'boat' || m.type === 'drone' || m.title.includes('Ambulance');

      if (isHosp && !layerVisibility.hospitals) return;
      if (isVillage && !layerVisibility.villages) return;
      if (isChoke && !layerVisibility.bridges) return;

      // Unselected items: Clean compact restrained symbol badge (Hospital cross, Hazard oct, Village pin)
      if (m.isQuietDot) {

        let iconSvg = isHosp
          ? SVG_HOSPITAL_HTML(12, '#38bdf8')
          : isVillage
          ? SVG_ORIGIN_PIN_HTML(12, '#34d399')
          : isAmbulance
          ? SVG_TRUCK_HTML(12, '#0284c7')
          : SVG_HAZARD_HTML(12, '#f87171');

        let badgeBg = isHosp
          ? '#082f49'
          : isVillage
          ? '#064e3b'
          : isAmbulance
          ? '#0c4a6e'
          : '#450a0a';

        let badgeBorder = isHosp
          ? '#0284c7'
          : isVillage
          ? '#059669'
          : isAmbulance
          ? '#0284c7'
          : '#dc2626';

        const dotHtml = `
          <div class="quiet-map-marker" style="position:relative; transform:translate(-50%, -50%); cursor:pointer; pointer-events:auto;" title="${m.title}">
            <div style="display:flex; align-items:center; justify-content:center; width:22px; height:22px; background:${badgeBg}; border:1.5px solid ${badgeBorder}; border-radius:6px; box-shadow:0 2px 6px rgba(0,0,0,0.6);">
              ${iconSvg}
            </div>
          </div>
        `;
        const dotIcon = L.divIcon({
          html: dotHtml,
          className: 'restrained-map-pin',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        const marker = L.marker([m.lat, m.lon], { icon: dotIcon });
        marker.bindTooltip(m.title, { permanent: false, sticky: true, direction: 'top', className: 'map-label-compact' });
        if (m.onClick) {
          marker.on('click', m.onClick);
        }
        marker.addTo(markersLayerRef.current!);
        return;
      }

      // Selected Corridor & Key Callouts: Restrained, compact callout
      let pillBg = 'rgba(15, 23, 42, 0.95)';
      let pillText = '#ffffff';
      let pillBorder = '#475569';
      let iconSvg = SVG_ORIGIN_PIN_HTML(13, '#ffffff');

      if (m.type === ('sos' as any) || m.title.includes('SOS')) {
        pillBg = 'rgba(112, 26, 117, 0.95)';
        pillText = '#f5d0fe';
        pillBorder = '#d946ef';
        iconSvg = SVG_SOS_HTML(13, '#f5d0fe');
      } else if (m.stepCategory === 'start') {
        pillBg = 'rgba(6, 78, 59, 0.95)';
        pillText = '#a7f3d0';
        pillBorder = '#10b981';
        iconSvg = SVG_ORIGIN_PIN_HTML(13, '#a7f3d0');
      } else if (m.stepCategory === 'choke') {
        if (m.type === 'bridge') {
          pillBg = 'rgba(69, 26, 3, 0.95)';
          pillText = '#fef3c7';
          pillBorder = '#b45309';
          iconSvg = SVG_BRIDGE_HTML(13, '#fef3c7');
        } else if (m.type === 'booth') {
          pillBg = 'rgba(113, 63, 18, 0.95)';
          pillText = '#fef08a';
          pillBorder = '#eab308';
          iconSvg = SVG_CAMP_HTML(13, '#fef08a');
        } else if (m.type === 'drone') {
          pillBg = 'rgba(88, 28, 135, 0.95)';
          pillText = '#f3e8ff';
          pillBorder = '#c084fc';
          iconSvg = SVG_DRONE_HTML(13, '#f3e8ff');
        } else if (m.type === 'boat') {
          pillBg = 'rgba(12, 74, 110, 0.95)';
          pillText = '#e0f2fe';
          pillBorder = '#0284c7';
          iconSvg = SVG_BOAT_HTML(13, '#e0f2fe');
        } else {
          pillBg = 'rgba(136, 19, 55, 0.95)';
          pillText = '#fecdd3';
          pillBorder = '#ef4444';
          iconSvg = SVG_HAZARD_HTML(13, '#fecdd3');
        }
      } else if (m.stepCategory === 'dest') {
        pillBg = 'rgba(12, 74, 110, 0.95)';
        pillText = '#bae6fd';
        pillBorder = '#0284c7';
        iconSvg = SVG_HOSPITAL_HTML(13, '#bae6fd');
      }

      const displayText = m.customBanner || m.title;

      const badgeHtml = `
        <div style="position:relative; transform:translate(-50%, -50%); cursor:pointer; pointer-events:auto; filter:drop-shadow(0 2px 8px rgba(0,0,0,0.8));">
          <div style="display:inline-flex; align-items:center; gap:5px; background:rgba(15, 23, 42, 0.96); color:${pillText}; border:1.5px solid ${pillBorder}; border-radius:4px; padding:3px 7px; font-size:10px; font-weight:800; font-family:ui-monospace, monospace; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.6);">
            <div style="display:flex; align-items:center; justify-content:center;">${iconSvg}</div>
            <span>${displayText}</span>
          </div>
        </div>
      `;

      const badgeIcon = L.divIcon({
        html: badgeHtml,
        className: 'route-badge-marker',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([m.lat, m.lon], { icon: badgeIcon });
      if (m.onClick) {
        marker.on('click', m.onClick);
      }
      marker.addTo(markersLayerRef.current!);
    });

    // Inbound Handset SOS Telemetry Markers
    fieldSosEvents.forEach((sos) => {
      const sosHtml = `
        <div style="position:relative; transform:translate(-50%, -50%); cursor:pointer; pointer-events:auto; filter:drop-shadow(0 2px 8px rgba(217,70,239,0.8));">
          <div style="display:inline-flex; align-items:center; gap:5px; background:rgba(112, 26, 117, 0.96); color:#f5d0fe; border:1.5px solid #d946ef; border-radius:4px; padding:3px 7px; font-size:10px; font-weight:800; font-family:ui-monospace, monospace; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.6);">
            ${SVG_SOS_HTML(13, '#f5d0fe')}
            <span>SOS: ${sos.sender}</span>
          </div>
        </div>
      `;
      const sosIcon = L.divIcon({
        html: sosHtml,
        className: 'sos-field-marker',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      const sosMarker = L.marker([sos.lat, sos.lon], { icon: sosIcon });
      sosMarker.bindTooltip(sos.message, { permanent: false, sticky: true, direction: 'top', className: 'map-label-compact' });
      sosMarker.addTo(markersLayerRef.current!);
    });
  }, [markers, fieldSosEvents]);

  // 4. Physical Asset Allocation & Moving Animation on Map (Restrained Tactical Fleet)
  const [animProgress, setAnimProgress] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimProgress((prev) => (prev + 0.008) % 1.0);
    }, 60);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!fleetLayerRef.current || !mapInstanceRef.current) return;
    fleetLayerRef.current.clearLayers();

    if (!corridorNet) return;

    // 4.1 When Bailey Bridge is deployed:
    // A. FIXED STATIONARY CLASS-40 BAILEY TRUSS SPAN (Firmly installed across the river breach - NEVER moves!)
    // B. VILLAGE EVACUATION CONVOY (The villagers/ambulances are what moves across the bridge to the hospital!)
    if (activeTool === 'bridge' || (isLiveDispatched && !activeTool)) {
      const bridgeCoords =
        corridorNet.breachGap && corridorNet.breachGap.length > 0
          ? corridorNet.breachGap[Math.floor(corridorNet.breachGap.length / 2)]
          : corridorNet.truckStartCoords;

      // Fixed stationary Bailey truss structure marker
      const bridgeSpanHtml = `
        <div style="position:relative; transform:translate(-50%, -50%); pointer-events:auto; filter:drop-shadow(0 2px 6px rgba(0,0,0,0.8));">
          <div style="display:inline-flex; align-items:center; gap:5px; background:#451a03; color:#fef3c7; border:1.5px solid #b45309; border-radius:4px; padding:3px 7px; font-size:10px; font-weight:800; font-family:ui-monospace, monospace; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.6);">
            <span>🌉</span>
            <span>CLASS-40 BAILEY TRUSS (STATIC SPAN • RESTORED)</span>
          </div>
        </div>
      `;
      const bridgeSpanIcon = L.divIcon({
        html: bridgeSpanHtml,
        className: 'stationary-bridge-span',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      L.marker([bridgeCoords[0], bridgeCoords[1]], { icon: bridgeSpanIcon }).addTo(fleetLayerRef.current);

      // Village Evacuation Convoy driving from cut-off village, across the stationary bridge, to the hospital
      const convoyPos = interpolateAlongPath(corridorNet.fullRestored, animProgress);
      const convoyHtml = `
        <div style="position:relative; transform:translate(-50%, -50%); cursor:pointer; pointer-events:auto; filter:drop-shadow(0 2px 6px rgba(0,0,0,0.7));">
          <div style="display:inline-flex; align-items:center; gap:5px; background:#064e3b; color:#a7f3d0; border:1.5px solid #10b981; border-radius:4px; padding:3px 7px; font-size:10px; font-weight:800; font-family:ui-monospace, monospace; white-space:nowrap;">
            <span style="font-size:12px;">🚑</span>
            <span>Village Evacuation Convoy • Crossing Bailey Bridge to Hospital (18m Direct)</span>
          </div>
        </div>
      `;
      const convoyIcon = L.divIcon({
        html: convoyHtml,
        className: 'animated-convoy-marker',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      L.marker([convoyPos[0], convoyPos[1]], { icon: convoyIcon }).addTo(fleetLayerRef.current);
    }

    // 4.2 When Heavy Drone is deployed: UAV flies along the aerial airbridge
    if (activeTool === 'drone') {
      const droneProgress = (Math.sin(animProgress * Math.PI * 2) + 1) / 2;
      const dronePos = interpolateAlongPath(corridorNet.droneAirbridge, droneProgress);
      const droneHtml = `
        <div style="position:relative; transform:translate(-50%, -50%); cursor:pointer; pointer-events:auto; filter:drop-shadow(0 2px 6px rgba(0,0,0,0.7));">
          <div style="display:inline-flex; align-items:center; gap:5px; background:#581c87; color:#faf5ff; border:1.5px solid #c084fc; border-radius:4px; padding:3px 7px; font-size:10px; font-weight:800; font-family:ui-monospace, monospace; white-space:nowrap;">
            ${SVG_DRONE_HTML(13, '#faf5ff')}
            <span>UAV-MED-01 • Airbridge Flight (85 km/h)</span>
          </div>
        </div>
      `;
      const droneIcon = L.divIcon({ html: droneHtml, className: 'animated-drone-marker', iconSize: [0, 0], iconAnchor: [0, 0] });
      L.marker([dronePos[0], dronePos[1]], { icon: droneIcon }).addTo(fleetLayerRef.current);
    }

    // 4.3 When Rescue Boat is deployed: Boat shuttles across the water gap
    if (activeTool === 'boat') {
      const boatProgress = (Math.sin(animProgress * Math.PI * 2) + 1) / 2;
      const boatPos = interpolateAlongPath(corridorNet.ferryShuttle, boatProgress);
      const boatHtml = `
        <div style="position:relative; transform:translate(-50%, -50%); cursor:pointer; pointer-events:auto; filter:drop-shadow(0 2px 6px rgba(0,0,0,0.7));">
          <div style="display:inline-flex; align-items:center; gap:5px; background:#0c4a6e; color:#f0f9ff; border:1.5px solid #0284c7; border-radius:4px; padding:3px 7px; font-size:10px; font-weight:800; font-family:ui-monospace, monospace; white-space:nowrap;">
            ${SVG_BOAT_HTML(13, '#f0f9ff')}
            <span>NDRF Boat-01 (40HP) • River Ferry Shuttle</span>
          </div>
        </div>
      `;
      const boatIcon = L.divIcon({ html: boatHtml, className: 'animated-boat-marker', iconSize: [0, 0], iconAnchor: [0, 0] });
      L.marker([boatPos[0], boatPos[1]], { icon: boatIcon }).addTo(fleetLayerRef.current);
    }

    // 4.4 When Hospital Camp (MMU) is deployed: Stationed on the Dry Roadhead
    if (activeTool === 'booth') {
      const mmuPos = corridorNet.mmuStationCoords;
      const mmuHtml = `
        <div style="position:relative; transform:translate(-50%, -50%); cursor:pointer; pointer-events:auto; filter:drop-shadow(0 2px 6px rgba(0,0,0,0.7));">
          <div style="display:inline-flex; align-items:center; gap:5px; background:#854d0e; color:#fef9c3; border:1.5px solid #eab308; border-radius:4px; padding:3px 7px; font-size:10px; font-weight:800; font-family:ui-monospace, monospace; white-space:nowrap;">
            ${SVG_CAMP_HTML(13, '#fef9c3')}
            <span>NHM Hospital Camp (MMU-01) • Stationed on Dry Roadhead</span>
          </div>
        </div>
      `;
      const mmuIcon = L.divIcon({ html: mmuHtml, className: 'mmu-station-marker', iconSize: [0, 0], iconAnchor: [0, 0] });
      L.marker([mmuPos[0], mmuPos[1]], { icon: mmuIcon }).addTo(fleetLayerRef.current);
    }

    // 4.5 When road is severed and Emergency Detour is active or simulation running: Village Convoy traverses detour!
    if (activeTool !== 'bridge' && (rerouteAmbulances || isSimulationRunning)) {
      if (corridorNet.detour && corridorNet.detour.length > 1) {
        const ambPos = interpolateAlongPath(corridorNet.detour, animProgress);
        const ambHtml = `
          <div style="position:relative; transform:translate(-50%, -50%); cursor:pointer; pointer-events:auto; filter:drop-shadow(0 2px 6px rgba(0,0,0,0.7));">
            <div style="display:inline-flex; align-items:center; gap:5px; background:#78350f; color:#fef3c7; border:1.5px solid #f59e0b; border-radius:4px; padding:3px 7px; font-size:10px; font-weight:800; font-family:ui-monospace, monospace; white-space:nowrap;">
              <span style="font-size:12px;">🚑</span>
              <span>Village Evacuation Convoy • Flood Basin Detour (+47m Delay • 65m)</span>
            </div>
          </div>
        `;
        const ambIcon = L.divIcon({ html: ambHtml, className: 'animated-amb-marker', iconSize: [0, 0], iconAnchor: [0, 0] });
        L.marker([ambPos[0], ambPos[1]], { icon: ambIcon }).addTo(fleetLayerRef.current);
      }
    }
  }, [activeTool, isLiveDispatched, animProgress, corridorNet, rerouteAmbulances, isSimulationRunning]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '100%', height: '100%' }} />

      {/* 1. INTERACTIVE DRAGGABLE SPLIT DIVIDER (BEFORE / AFTER / SWIPE) */}
      {swipeMode === 'swipe' && (
        <div
          className="absolute top-0 bottom-0 z-[1000] w-1 bg-cyan-400 cursor-ew-resize select-none pointer-events-auto shadow-[0_0_14px_rgba(6,182,212,0.95)]"
          style={{ left: `${swipePos}%` }}
          onMouseDown={handleDividerMouseDown}
          onTouchStart={handleDividerTouchStart}
        >
          <div
            tabIndex={0}
            title="Swipe divider (Drag or use Left/Right Arrow keys to slide)"
            aria-label="Swipe divider (use arrow keys to move)"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-cyan-400 text-cyan-300 flex items-center justify-center text-xs shadow-2xl font-bold cursor-ew-resize hover:scale-110 active:scale-95 focus:ring-2 focus:ring-cyan-400 transition-transform"
          >
            ⬌
          </div>
        </div>
      )}

      {/* 2. TOP DUAL BANNERS (LIKE NEPAL REFERENCE SCREENSHOT) */}
      {(swipeMode === 'swipe' || swipeMode === 'before') && (
        <div
          className="absolute top-16 z-[990] pointer-events-none transition-all hidden md:block"
          style={{
            left: `${panelWidth + 30}px`,
            maxWidth: swipeMode === 'swipe' ? `calc(${swipePos}% - ${panelWidth + 40}px)` : 'auto',
          }}
        >
          <div className="px-3 py-1 rounded-lg bg-slate-950/90 border border-slate-700/80 text-[11px] font-mono font-bold text-slate-300 shadow-xl truncate backdrop-blur-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
            <span>PRE-DISASTER BASELINE (Sentinel-2 10m True Colour • ESA CC-BY 4.0)</span>
          </div>
        </div>
      )}

      {(swipeMode === 'swipe' || swipeMode === 'after') && (
        <div
          className="absolute top-16 z-[990] pointer-events-none transition-all hidden md:block"
          style={{
            left: swipeMode === 'swipe' ? `calc(${swipePos}% + 15px)` : `${panelWidth + 30}px`,
            maxWidth: 'calc(100vw - 780px)',
          }}
        >
          <div className="px-3 py-1 rounded-lg bg-cyan-950/90 border border-cyan-700/80 text-[11px] font-mono font-bold text-cyan-300 shadow-xl truncate backdrop-blur-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
            <span>POST-DISASTER: SENTINEL-1 SAR FLOOD &amp; BREACH (10m Otsu -14.2dB • Copernicus)</span>
          </div>
        </div>
      )}

      {/* 3. TOP-RIGHT: VIEW MODE SWITCHER (BEFORE | SWIPE | AFTER) */}
      <div className="absolute top-16 right-6 z-[1000] flex items-center gap-2 pointer-events-auto">
        <div className="flex items-center bg-slate-900/95 border border-slate-700/80 rounded-xl p-1 shadow-2xl backdrop-blur-md">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-400 px-2">View:</span>
          {(['before', 'swipe', 'after'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setSwipeMode(mode)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                swipeMode === mode
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* 4. BOTTOM-RIGHT: LIVE GIS COORDINATES & ZOOM LEVEL */}
      <div className="fixed bottom-3 right-6 z-[1000] px-2.5 py-1 rounded-lg bg-slate-950/90 border border-slate-800 text-[10px] font-mono text-slate-400 backdrop-blur-md shadow-lg pointer-events-none select-none flex items-center gap-2">
        <span>{currentCoords[0].toFixed(5)}°N, {currentCoords[1].toFixed(5)}°E</span>
        <span className="text-slate-600">|</span>
        <span>z{currentZoomLevel}</span>
      </div>

      {/* 5. RIGHT PANEL: AUTHENTIC LAYER CATALOGUE & VISIBILITY CONTROLS */}
      <div className="fixed bottom-12 right-6 z-[1001] bg-slate-900/95 border-2 border-slate-700/80 rounded-2xl shadow-2xl w-[320px] backdrop-blur-md select-none pointer-events-auto overflow-hidden transition-all">
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

            {/* Base Layer Switcher */}
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1.5">
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

            {/* Group 1: Mapped Infrastructure Features */}
            <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                Infrastructure Features
              </span>
              <div className="space-y-1 font-mono text-[11px]">
                <label className="flex items-center justify-between cursor-pointer hover:bg-slate-800/50 p-1 rounded">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={layerVisibility.bridges}
                      onChange={() => toggleLayerItem('bridges')}
                      className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0"
                    />
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                    <span>Bridge Choke Points</span>
                  </span>
                  <span className="text-[10px] text-slate-400">{chokePoints.length}</span>
                </label>

                <label className="flex items-center justify-between cursor-pointer hover:bg-slate-800/50 p-1 rounded">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={layerVisibility.roads}
                      onChange={() => toggleLayerItem('roads')}
                      className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0"
                    />
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                    <span>Road Corridors</span>
                  </span>
                  <span className="text-[10px] text-slate-400">42</span>
                </label>

                <label className="flex items-center justify-between cursor-pointer hover:bg-slate-800/50 p-1 rounded">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={layerVisibility.hospitals}
                      onChange={() => toggleLayerItem('hospitals')}
                      className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0"
                    />
                    <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
                    <span>Hospitals &amp; Clinics</span>
                  </span>
                  <span className="text-[10px] text-slate-400">4+</span>
                </label>

                <label className="flex items-center justify-between cursor-pointer hover:bg-slate-800/50 p-1 rounded">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={layerVisibility.villages}
                      onChange={() => toggleLayerItem('villages')}
                      className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0"
                    />
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                    <span>Disconnected Villages</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Active</span>
                </label>
              </div>
            </div>

            {/* Group 2: Flood Evidence & Damage Reports */}
            <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                Flood Evidence &amp; Hazards
              </span>
              <div className="space-y-1 font-mono text-[11px]">
                <label className="flex items-center justify-between cursor-pointer hover:bg-slate-800/50 p-1 rounded">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={layerVisibility.floodExtent}
                      onChange={() => toggleLayerItem('floodExtent')}
                      className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0"
                    />
                    <span className="w-2.5 h-2.5 rounded bg-sky-500/60 border border-sky-400" />
                    <span>Sentinel-1 SAR Extent</span>
                  </span>
                  <span className="text-[10px] text-cyan-400">82.4 km²</span>
                </label>

                <label className="flex items-center justify-between cursor-pointer hover:bg-slate-800/50 p-1 rounded">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={layerVisibility.severedBreaches}
                      onChange={() => toggleLayerItem('severedBreaches')}
                      className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0"
                    />
                    <span className="w-2.5 h-1 border-t-2 border-dashed border-rose-500" />
                    <span>Severed Road Breaches</span>
                  </span>
                  <span className="text-[10px] text-rose-400">Pulsing</span>
                </label>

                <label className="flex items-center justify-between cursor-pointer hover:bg-slate-800/50 p-1 rounded">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={layerVisibility.detourBypass}
                      onChange={() => toggleLayerItem('detourBypass')}
                      className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0"
                    />
                    <span className="w-2.5 h-1 border-t-2 border-dashed border-amber-400" />
                    <span>Emergency Detour Route</span>
                  </span>
                  <span className="text-[10px] text-amber-400">Active</span>
                </label>
              </div>
            </div>

            {/* Group 3: Physical Response Operations */}
            <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                Response Fleet Operations
              </span>
              <div className="space-y-1 font-mono text-[11px]">
                <label className="flex items-center justify-between cursor-pointer hover:bg-slate-800/50 p-1 rounded">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={layerVisibility.interventions}
                      onChange={() => toggleLayerItem('interventions')}
                      className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0"
                    />
                    <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
                    <span>Tactical Assets (Bridge/MMU/UAV)</span>
                  </span>
                  <span className="text-[10px] text-purple-400">Ready</span>
                </label>
              </div>
            </div>

            {/* Color & Symbol Legend Guide */}
            <div className="space-y-1 text-xs text-slate-300 border-t border-slate-800/80 pt-2 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-4 h-1 bg-amber-700 shrink-0 rounded" />
                <span className="text-[10px] text-amber-300 flex items-center gap-1">
                  <span>━━ Bailey Bridge Restored Span</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-1 bg-rose-500 shrink-0 rounded" />
                <span className="text-[10px] text-rose-300">━━ Severed Road Breach (Washout)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-0 border-t border-dashed border-amber-400 shrink-0" />
                <span className="text-[10px] text-amber-300">┅┅ Emergency Flood Basin Detour</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
