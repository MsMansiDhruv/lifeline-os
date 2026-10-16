import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers } from 'lucide-react';

export interface MapLine {
  id?: string;
  points: [number, number][];
  color: string;
  dashArray?: string;
  weight?: number;
  label?: string;
  className?: string;
  layerType?: 'severed' | 'catchment' | 'baseline' | 'detour' | 'general' | 'drone' | 'boat' | 'diversion';
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
  isTourActive?: boolean;
  isLiveDispatched?: boolean;
  cameraCommand?: CameraCommand | null;
  panelWidth?: number;
  pulsingTarget?: [number, number] | null;
  onResetOverview?: () => void;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  theaterId = 'silchar',
  center = [24.8333, 92.7789],
  zoom = 12,
  riverPath,
  floodStage = 2,
  chokePoints = [],
  markers = [],
  lines = [],
  activeChokeId,
  isTourActive = false,
  isLiveDispatched = false,
  cameraCommand = null,
  panelWidth = 430,
  pulsingTarget = null,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [mapMode, setMapMode] = useState<MapStyleMode>('vector');

  const floodLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const linesLayerRef = useRef<L.LayerGroup | null>(null);
  const fleetLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);
  const roadsLayerRef = useRef<L.TileLayer | null>(null);

  const createTileLayer = (mode: MapStyleMode) => {
    if (mode === 'vector') {
      return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        className: 'tactical-dark-osm-tiles',
      });
    }
    if (mode === 'street') {
      return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      });
    }
    // Satellite
    return L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USDA, USGS, GeoEye',
        maxZoom: 18,
      }
    );
  };

  // Initialize Map
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

    const tile = createTileLayer(mapMode).addTo(map);
    tileLayerRef.current = tile;

    const labels = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 18, opacity: 0.95 }
    );
    labelsLayerRef.current = labels;

    const roads = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 18, opacity: 0.85 }
    );
    roadsLayerRef.current = roads;

    if (mapMode === 'satellite') {
      labels.addTo(map);
      roads.addTo(map);
    }

    floodLayerRef.current = L.layerGroup().addTo(map);
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

  // Pulse effect when a target is highlighted
  useEffect(() => {
    if (!mapInstanceRef.current || !pulsingTarget || !markersLayerRef.current) return;
    const pulseMarker = L.circleMarker([pulsingTarget[0], pulsingTarget[1]], {
      radius: 18,
      color: '#38bdf8',
      weight: 3,
      fillColor: '#0ea5e9',
      fillOpacity: 0.35,
    });
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

    const newTile = createTileLayer(mapMode).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;

    if (labelsLayerRef.current) {
      mapInstanceRef.current.removeLayer(labelsLayerRef.current);
    }
    if (roadsLayerRef.current) {
      mapInstanceRef.current.removeLayer(roadsLayerRef.current);
    }

    if (mapMode === 'satellite') {
      if (labelsLayerRef.current) {
        labelsLayerRef.current.addTo(mapInstanceRef.current);
        labelsLayerRef.current.bringToFront();
      }
      if (roadsLayerRef.current) {
        roadsLayerRef.current.addTo(mapInstanceRef.current);
        roadsLayerRef.current.bringToFront();
      }
    }
  }, [mapMode]);

  // 1. REQUIREMENT 2.1: NATURAL CURVED RIVER FLOOD SWELL (NO SHARP TRIANGLES!)
  // 3 concentric, soft-edged curved river-swell layers expanding along river meanders
  useEffect(() => {
    if (!floodLayerRef.current || !mapInstanceRef.current) return;
    floodLayerRef.current.clearLayers();

    if (!riverPath || riverPath.length < 2) return;

    // Layer 3: Outer Inundation Reach (weight 80 + floodStage * 40, opacity 0.18)
    const outerWeight = 80 + floodStage * 40;
    L.polyline(riverPath, {
      color: '#38bdf8',
      weight: outerWeight,
      opacity: 0.18,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(floodLayerRef.current);

    // Layer 2: Mid Floodplain Swell (weight 48 + floodStage * 22, opacity 0.35)
    const midWeight = 48 + floodStage * 22;
    L.polyline(riverPath, {
      color: '#0ea5e9',
      weight: midWeight,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(floodLayerRef.current);

    // Layer 1: Inner River Channel (weight 18, color #0284c7, opacity 0.6)
    L.polyline(riverPath, {
      color: '#0284c7',
      weight: 18,
      opacity: 0.6,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(floodLayerRef.current);
  }, [riverPath, floodStage]);

  // 2. REQUIREMENT 2.2: GOOGLE MAPS / UBER WINDING ROAD NAVIGATION
  // Underneath: Dark Road Casing (weight 9, color '#090d16')
  // On top: Bright Navigation Path (weight 5)
  useEffect(() => {
    if (!linesLayerRef.current || !mapInstanceRef.current) return;
    linesLayerRef.current.clearLayers();

    lines.forEach((line) => {
      // 1. Dark Road Casing underneath
      L.polyline(line.points, {
        color: '#090d16',
        weight: (line.weight || 5) + 4,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(linesLayerRef.current!);

      // 2. Bright Navigation Path on top
      const navPath = L.polyline(line.points, {
        color: line.color,
        weight: line.weight || 5,
        dashArray: line.dashArray,
        opacity: 1.0,
        lineCap: 'round',
        lineJoin: 'round',
        className: line.className,
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
  }, [lines]);

  // 3. REQUIREMENT 2.3: CLEAN UBER / GOOGLE MAPS PIN CALLOUTS (SHOW ONLY FOR 1 SELECTED CORRIDOR!)
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;
    markersLayerRef.current.clearLayers();

    markers.forEach((m) => {
      // Unselected items: Clean small quiet status dots
      if (m.isQuietDot) {
        const dotColor = m.quietDotColor || '#f43f5e';
        const dotHtml = `
          <div style="width:12px; height:12px; border-radius:50%; background:${dotColor}; border:2.5px solid #090d16; box-shadow:0 0 10px ${dotColor}; opacity:0.9; cursor:pointer;" title="${m.title}"></div>
        `;
        const dotIcon = L.divIcon({
          html: dotHtml,
          className: 'quiet-dot-marker',
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });
        const marker = L.marker([m.lat, m.lon], { icon: dotIcon });
        marker.bindTooltip(m.title, {
          direction: 'top',
          className:
            'bg-slate-900/95 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg shadow-xl text-sm font-medium',
        });
        if (m.onClick) {
          marker.on('click', m.onClick);
        }
        marker.addTo(markersLayerRef.current!);
        return;
      }

      // Selected Corridor: Crisp Google Maps style floating route pills
      let pillBg = 'rgba(15, 23, 42, 0.95)';
      let pillText = '#ffffff';
      let pillBorder = '#475569';
      let iconEmoji = '📍';

      if (m.stepCategory === 'start') {
        pillBg = 'rgba(15, 23, 42, 0.95)';
        pillText = '#ffffff';
        pillBorder = '#64748b';
        iconEmoji = '●';
      } else if (m.stepCategory === 'choke') {
        if (m.type === 'bridge' || m.type === 'booth') {
          pillBg = 'rgba(6, 78, 59, 0.95)';
          pillText = '#a7f3d0';
          pillBorder = '#059669';
          iconEmoji = m.type === 'bridge' ? '🛠️' : '⛺';
        } else if (m.type === 'drone') {
          pillBg = 'rgba(88, 28, 135, 0.95)';
          pillText = '#e9d5ff';
          pillBorder = '#7e22ce';
          iconEmoji = '🚁';
        } else if (m.type === 'boat') {
          pillBg = 'rgba(22, 78, 99, 0.95)';
          pillText = '#a5f3fc';
          pillBorder = '#0891b2';
          iconEmoji = '🚤';
        } else {
          pillBg = 'rgba(136, 19, 55, 0.95)';
          pillText = '#fecdd3';
          pillBorder = '#e11d48';
          iconEmoji = '⛔';
        }
      } else if (m.stepCategory === 'dest') {
        pillBg = 'rgba(15, 23, 42, 0.95)';
        pillText = '#38bdf8';
        pillBorder = '#0284c7';
        iconEmoji = '🏥';
      }

      const displayText = m.customBanner || m.title;

      const pillHtml = `
        <div style="position:relative; transform: translate(-50%, -100%); margin-top:-10px; cursor:pointer; pointer-events:auto; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.6));">
          <div style="display:flex; items-center; gap:8px; background:${pillBg}; color:${pillText}; border:1.5px solid ${pillBorder}; border-radius:9999px; padding:6px 14px; font-size:14px; font-weight:500; font-family:ui-sans-serif, system-ui, sans-serif; white-space:nowrap; box-shadow:0 10px 25px -5px rgba(0,0,0,0.7);">
            <span style="font-size:14px;">${iconEmoji}</span>
            <span>${displayText}</span>
          </div>
          <div style="position:absolute; left:50%; bottom:-6px; transform:translateX(-50%); width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:7px solid ${pillBorder};"></div>
          <div style="position:absolute; left:50%; bottom:-12px; transform:translateX(-50%); width:8px; height:8px; border-radius:50%; background:${pillBorder}; box-shadow:0 0 10px ${pillBorder}; border:2px solid #090d16;"></div>
        </div>
      `;

      const pillIcon = L.divIcon({
        html: pillHtml,
        className: 'route-pill-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([m.lat, m.lon], { icon: pillIcon });
      if (m.onClick) {
        marker.on('click', m.onClick);
      }
      marker.addTo(markersLayerRef.current!);
    });
  }, [markers]);

  // 4. REQUIREMENT 4: LIVE GPS FLEET ANIMATION (WHEN MISSION IS SANCTIONED IN STEP 4)
  useEffect(() => {
    if (!fleetLayerRef.current || !mapInstanceRef.current) return;
    fleetLayerRef.current.clearLayers();

    if (!isLiveDispatched) return;

    // Dispatch Fleet Markers along real routes
    const fleetUnits = [
      {
        id: 'truck_1',
        title: '🚛 16T-CONVOY-01 • En Route on JT Road • ETA 8m',
        lat: 24.876,
        lon: 92.848,
        bg: 'rgba(217, 119, 6, 0.95)',
        border: '#f59e0b',
        color: '#fffbeb',
      },
      {
        id: 'drone_1',
        title: '🚁 UAV-MED-01 • Delivering Antivenom • ETA 4m',
        lat: 24.845,
        lon: 92.825,
        bg: 'rgba(109, 40, 217, 0.95)',
        border: '#a855f7',
        color: '#faf5ff',
      },
      {
        id: 'clinic_1',
        title: '⛺ CLINIC-01 • Active at Harinagar Dry Roadhead',
        lat: 24.897,
        lon: 92.869,
        bg: 'rgba(5, 150, 105, 0.95)',
        border: '#10b981',
        color: '#ecfdf5',
      },
    ];

    fleetUnits.forEach((unit) => {
      const fleetHtml = `
        <div style="position:relative; transform: translate(-50%, -100%); margin-top:-8px; cursor:pointer; pointer-events:auto; filter:drop-shadow(0 8px 16px rgba(0,0,0,0.7));">
          <div style="display:flex; align-items:center; gap:6px; background:${unit.bg}; color:${unit.color}; border:1.5px solid ${unit.border}; border-radius:9999px; padding:5px 12px; font-size:13px; font-weight:600; font-family:ui-sans-serif, system-ui, sans-serif; white-space:nowrap; animation: pulse 2s infinite;">
            <span>${unit.title}</span>
          </div>
          <div style="position:absolute; left:50%; bottom:-6px; transform:translateX(-50%); width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid ${unit.border};"></div>
          <div style="position:absolute; left:50%; bottom:-11px; transform:translateX(-50%); width:7px; height:7px; border-radius:50%; background:${unit.border}; box-shadow:0 0 8px ${unit.border}; border:1.5px solid #090d16;"></div>
        </div>
      `;

      const fleetIcon = L.divIcon({
        html: fleetHtml,
        className: 'fleet-gps-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([unit.lat, unit.lon], { icon: fleetIcon }).addTo(fleetLayerRef.current!);
    });
  }, [isLiveDispatched]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '100%', height: '100%' }} />

      {/* REQUIREMENT 3: PROMINENT SATELLITE / STREET / DARK MAP SWITCHER + LEGEND (BOTTOM-RIGHT) */}
      <div className="fixed bottom-5 right-5 z-30 bg-slate-900/95 border border-slate-700 rounded-xl p-3.5 shadow-2xl w-[290px] backdrop-blur-md select-none pointer-events-auto">
        {/* 3 Large, Readable Map Mode Buttons */}
        <div className="border-b border-slate-800 pb-2.5 mb-2.5">
          <div className="text-sm font-semibold text-white tracking-wide mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Map View</span>
            </span>
            <span className="text-xs text-slate-400 font-normal">Layer Mode</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setMapMode('street')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all text-center cursor-pointer ${
                mapMode === 'street'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
              }`}
            >
              🗺️ Street
            </button>
            <button
              type="button"
              onClick={() => setMapMode('satellite')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all text-center cursor-pointer ${
                mapMode === 'satellite'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
              }`}
            >
              🛰️ Satellite
            </button>
            <button
              type="button"
              onClick={() => setMapMode('vector')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all text-center cursor-pointer ${
                mapMode === 'vector'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
              }`}
            >
              🌑 Dark
            </button>
          </div>
        </div>

        {/* Clear 5-Item Legend */}
        <div className="space-y-1.5 text-xs text-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-slate-200">━━ Green Road: Primary Fast Route (14–22 mins)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-0 border-t-2 border-dashed border-amber-400 shrink-0" />
            <span className="text-slate-200">┅┅ Amber/Red Road: Forced Flood Detour (55–75 mins)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-3.5 rounded bg-sky-500/40 border border-sky-400 shrink-0" />
            <span className="text-slate-200">██ Blue River Swell: Flood Inundation Zone</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm shrink-0">● ➔ 🏥</span>
            <span className="text-slate-200">Pin A ➔ Pin B: Trapped Village to Hospital</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80 text-xs text-slate-400">
            <span>🛠️ Bridge • ⛺ Clinic • 🚁 Drone • 🚤 Ferry</span>
          </div>
        </div>
      </div>
    </div>
  );
};
