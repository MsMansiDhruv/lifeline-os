import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Eye, EyeOff, ShieldAlert } from 'lucide-react';

export interface MapLine {
  id?: string;
  points: [number, number][];
  color: string;
  dashArray?: string;
  weight?: number;
  label?: string;
  className?: string;
  layerType?: 'severed' | 'catchment' | 'baseline' | 'detour' | 'general' | 'drone' | 'boat';
}

export interface MapMarker {
  lat: number;
  lon: number;
  title: string;
  description?: string;
  type: 'isolated' | 'rerouted' | 'reachable' | 'chokepoint' | 'hub' | 'bridge' | 'facility' | 'boat' | 'drone' | 'booth';
  badge?: string;
}

interface LeafletMapProps {
  theaterId?: string;
  center?: [number, number];
  zoom?: number;
  height?: string;
  floodGeoJsonUrl?: string;
  floodPolygon?: [number, number][];
  riverPath?: [number, number][];
  markers?: MapMarker[];
  lines?: MapLine[];
  highlightBridge?: {
    lat: number;
    lon: number;
    title: string;
    span_m: number;
    roi: number;
  } | null;
  showLayerControls?: boolean;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  theaterId = 'silchar',
  center = [24.8333, 92.7789],
  zoom = 12,
  height = '100%',
  floodGeoJsonUrl = '/flood_cleaned.geojson',
  floodPolygon,
  riverPath,
  markers = [],
  lines = [],
  highlightBridge = null,
  showLayerControls = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [mapMode, setMapMode] = useState<'satellite' | 'dark'>('satellite');

  // Layer Visibility Toggles
  const [floodActive, setFloodActive] = useState<boolean>(true);
  const [severedActive, setSeveredActive] = useState<boolean>(true);
  const [catchmentActive, setCatchmentActive] = useState<boolean>(true);
  const [routesActive, setRoutesActive] = useState<boolean>(true);

  const floodLayerRef = useRef<L.Layer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const linesLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);
  const roadsLayerRef = useRef<L.TileLayer | null>(null);

  // Labels Toggle (default true so user immediately sees street & neighborhood names!)
  const [labelsActive, setLabelsActive] = useState<boolean>(true);

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

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // 1. Base Satellite Imagery Tile Layer
    const tileUrl =
      mapMode === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';

    const tile = L.tileLayer(tileUrl, {
      attribution: 'Esri World Imagery',
      maxZoom: 18,
    }).addTo(map);
    tileLayerRef.current = tile;

    // 2. REQUIREMENT 2: ALWAYS render Transparent Reference Place / Boundaries Labels
    const labels = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 18, opacity: 0.95 }
    ).addTo(map);
    labelsLayerRef.current = labels;

    // 3. REQUIREMENT 2: ALWAYS render Road Network & Highway Labels Overlay
    const roads = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 18, opacity: 0.85 }
    ).addTo(map);
    roadsLayerRef.current = roads;

    markersLayerRef.current = L.layerGroup().addTo(map);
    linesLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [theaterId]);

  // Smooth camera fly
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(center, zoom, { duration: 1.5 });
    }
  }, [center[0], center[1], zoom]);

  // Handle Base Tile Switching
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    if (mapMode === 'satellite') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Esri World Imagery', maxZoom: 18 }
      ).addTo(mapInstanceRef.current);
    } else {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Esri Dark Gray Canvas', maxZoom: 18 }
      ).addTo(mapInstanceRef.current);
    }

    // Ensure labels and roads stay on top
    if (labelsLayerRef.current) labelsLayerRef.current.bringToFront();
    if (roadsLayerRef.current) roadsLayerRef.current.bringToFront();
  }, [mapMode]);

  // REQUIREMENT 3: Render Real River Flood Water Polylines (NO FAKE 4-POINT BLUE TRAPEZOIDS!)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (floodLayerRef.current) {
      mapInstanceRef.current.removeLayer(floodLayerRef.current);
      floodLayerRef.current = null;
    }

    if (!floodActive) return;

    const floodGroup = L.layerGroup().addTo(mapInstanceRef.current);

    if (riverPath && riverPath.length > 1) {
      // 1. Wide river flood surge buffer (outer envelope)
      L.polyline(riverPath, {
        color: '#0284c7',
        weight: 65,
        opacity: 0.28,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(floodGroup);

      // 2. Active river channel flood water (inner core)
      L.polyline(riverPath, {
        color: '#00BFFF',
        weight: 42,
        opacity: 0.52,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(floodGroup);

      // 3. Central fast-flowing water spine
      L.polyline(riverPath, {
        color: '#7dd3fc',
        weight: 12,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(floodGroup);

      floodLayerRef.current = floodGroup;
    } else if (floodPolygon && floodPolygon.length > 5) {
      // Only render polygon if it has real winding geometry (>5 points)
      const poly = L.polygon(floodPolygon, {
        color: '#00BFFF',
        weight: 2,
        fillColor: '#00BFFF',
        fillOpacity: 0.45,
      }).addTo(floodGroup);
      floodLayerRef.current = floodGroup;
    }
  }, [floodActive, riverPath, floodPolygon]);

  // Render Map Lines (Normal Route, Emergency Detour, Bridgehead Spans, Drone Flightpaths)
  useEffect(() => {
    if (!linesLayerRef.current || !mapInstanceRef.current) return;
    linesLayerRef.current.clearLayers();

    lines.forEach((line) => {
      // Layer filtering
      if (line.layerType === 'severed' && !severedActive) return;
      if (line.layerType === 'catchment' && !catchmentActive) return;
      if ((line.layerType === 'baseline' || line.layerType === 'detour') && !routesActive) return;

      const polyline = L.polyline(line.points, {
        color: line.color,
        weight: line.weight || 3.5,
        dashArray: line.dashArray,
        lineCap: 'round',
        lineJoin: 'round',
        className: line.className,
      });

      if (line.label && labelsActive) {
        polyline.bindTooltip(line.label, {
          permanent: false,
          sticky: true,
          direction: 'top',
          className: 'bg-[#161b22] text-[#c9d1d9] border border-[#30363d] px-2 py-1 rounded shadow-lg text-[10px] font-mono',
        });
      }

      polyline.addTo(linesLayerRef.current!);
    });
  }, [lines, severedActive, catchmentActive, routesActive, labelsActive]);

  // REQUIREMENT 3 & 5: Render Map Markers with Real Names (Never Generic "CHOKE" or "SURGE")
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;
    markersLayerRef.current.clearLayers();

    markers.forEach((m) => {
      let iconHtml = '';
      let className = 'custom-leaflet-marker';

      const shortTitle = m.title.replace('Corridor', '').replace('Bridgehead', '').trim();

      if (m.type === 'hub') {
        iconHtml = `<div style="background:#1f6feb; color:#fff; padding:3px 7px; border-radius:6px; border:1.5px solid #fff; font-size:10px; font-weight:800; box-shadow:0 0 10px #388bfd; display:flex; align-items:center; gap:3px;">⚓ ${shortTitle}</div>`;
      } else if (m.type === 'chokepoint') {
        iconHtml = `<div class="anim-sonar-pulse" style="background:#dc2626; color:#fff; padding:4px 9px; border-radius:6px; border:2px solid #f87171; font-size:10px; font-weight:900; box-shadow:0 0 18px #ef4444; display:flex; align-items:center; gap:4px; white-space:nowrap;"><span>⚡</span><span>${shortTitle} (BREACH)</span></div>`;
      } else if (m.type === 'bridge') {
        iconHtml = `<div class="anim-span-emerald" style="background:#059669; color:#fff; padding:4px 9px; border-radius:6px; border:2px solid #34d399; font-size:10px; font-weight:900; box-shadow:0 0 18px #10b981; display:flex; align-items:center; gap:4px; white-space:nowrap;"><span>🛠️</span><span>${shortTitle} (BAILEY BRIDGE)</span></div>`;
      } else if (m.type === 'boat') {
        iconHtml = `<div class="anim-boat-bob" style="background:#0891b2; color:#fff; padding:4px 9px; border-radius:6px; border:2px solid #67e8f9; font-size:10px; font-weight:900; box-shadow:0 0 18px #06b6d4; display:flex; align-items:center; gap:4px; white-space:nowrap;"><span>🚤</span><span>${shortTitle} (RESCUE FERRY)</span></div>`;
      } else if (m.type === 'drone') {
        iconHtml = `<div class="anim-drone-hover" style="background:#7e22ce; color:#fff; padding:4px 9px; border-radius:6px; border:2px solid #d8b4fe; font-size:10px; font-weight:900; box-shadow:0 0 20px #a855f7; display:flex; align-items:center; gap:4px; white-space:nowrap;"><span>🚁</span><span>${shortTitle} (MED-DRONE HUB)</span></div>`;
      } else if (m.type === 'booth') {
        iconHtml = `<div class="anim-booth-glow" style="background:#047857; color:#fff; padding:4px 9px; border-radius:6px; border:2px solid #6ee7b7; font-size:10px; font-weight:900; box-shadow:0 0 18px #10b981; display:flex; align-items:center; gap:4px; white-space:nowrap;"><span>⛺</span><span>${shortTitle} (HEALTH BOOTH)</span></div>`;
      } else if (m.type === 'facility') {
        const isSurge = m.badge?.includes('SURGE') || m.badge?.includes('OVERLOAD') || (m.description && m.description.includes('Surge'));
        const isCutOff = m.badge?.includes('ISOLATED') || m.badge?.includes('BLOCKED');

        if (isSurge) {
          iconHtml = `<div style="background:#e11d48; color:#fff; padding:3px 8px; border-radius:6px; border:1.5px solid #fff; font-size:10px; font-weight:800; box-shadow:0 0 14px #f43f5e; display:flex; align-items:center; gap:3px; white-space:nowrap;">🏥 ${shortTitle} (${m.badge || 'SURGE'})</div>`;
        } else if (isCutOff) {
          iconHtml = `<div style="background:#374151; color:#f87171; padding:3px 7px; border-radius:6px; border:1.5px solid #ef4444; font-size:10px; font-weight:bold; white-space:nowrap;">🏥 ${shortTitle} (CUT-OFF)</div>`;
        } else {
          iconHtml = `<div style="background:#059669; color:#fff; padding:3px 7px; border-radius:6px; border:1.5px solid #fff; font-size:10px; font-weight:bold; white-space:nowrap;">🏥 ${shortTitle}</div>`;
        }
      } else if (m.type === 'reachable') {
        // Village that is served/reconnected
        iconHtml = `<div style="background:#059669; color:#fff; padding:3px 7px; border-radius:6px; border:1.5px solid #34d399; font-size:10px; font-weight:bold; box-shadow:0 0 12px #10b981; display:flex; align-items:center; gap:3px; white-space:nowrap;">🏠 ${shortTitle} <span style="font-size:9px; color:#a7f3d0;">(✅ Saved)</span></div>`;
      } else if (m.type === 'isolated') {
        // Trapped village
        iconHtml = `<div style="background:#ea580c; color:#fff; padding:3px 7px; border-radius:6px; border:1.5px solid #fdba74; font-size:10px; font-weight:bold; box-shadow:0 0 12px #f97316; display:flex; align-items:center; gap:3px; white-space:nowrap;">🏠 ${shortTitle} <span style="font-size:9px; color:#fed7aa;">(Trapped)</span></div>`;
      } else {
        iconHtml = `<div style="background:#ef4444; width:13px; height:13px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px #ef4444;"></div>`;
      }

      const customIcon = L.divIcon({
        html: iconHtml,
        className,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([m.lat, m.lon], { icon: customIcon });

      const popupContent = `
        <div style="font-family:sans-serif; min-width:220px;">
          <div style="font-weight:700; font-size:13px; color:#58a6ff; margin-bottom:4px;">${m.title}</div>
          ${m.description ? `<div style="font-size:12px; color:#c9d1d9; line-height:1.4;">${m.description}</div>` : ''}
          ${m.badge ? `<div style="margin-top:6px; display:inline-block; font-size:10px; background:#21262d; padding:2px 6px; border-radius:4px; color:#ffaa00; border:1px solid #30363d;">${m.badge}</div>` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);

      const labelText = m.badge ? `${m.title} • ${m.badge}` : m.title;
      marker.bindTooltip(labelText, {
        permanent: labelsActive,
        direction: 'top',
        offset: [0, -14],
        className: 'bg-[#161b22] text-white border border-[#30363d] px-2 py-0.5 rounded shadow text-[10px] font-mono font-bold',
      });

      marker.addTo(markersLayerRef.current!);
    });
  }, [markers, labelsActive]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0d1117]">
      {/* Map Element */}
      <div
        key={theaterId}
        ref={mapContainerRef}
        style={{ height, width: '100%' }}
        className="h-full w-full z-0"
      />

      {/* Floating Map Layer Controls (Top-Right) */}
      <div className="absolute top-20 right-4 z-20 flex flex-col items-end gap-2 pointer-events-none">
        <div className="pointer-events-auto bg-[#161b22]/95 backdrop-blur-md border border-[#30363d] rounded-xl p-2 shadow-2xl flex flex-col gap-1.5 text-[11px] font-mono">
          <div className="flex items-center justify-between gap-3 text-[#8b949e] px-1 text-[10px] uppercase font-bold border-b border-[#30363d] pb-1">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" />
              Satellite Layers
            </span>
            <span className="text-emerald-400">Hybrid On</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setFloodActive((p) => !p)}
              className={`px-2 py-1 rounded transition-all cursor-pointer font-bold text-[10px] flex-1 ${
                floodActive
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-300 bg-[#0d1117]'
              }`}
            >
              🌊 River Flood Buffer
            </button>
            <button
              onClick={() => setRoutesActive((p) => !p)}
              className={`px-2 py-1 rounded transition-all cursor-pointer font-bold text-[10px] flex-1 ${
                routesActive
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-300 bg-[#0d1117]'
              }`}
            >
              🛣️ Road Paths
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setLabelsActive((p) => !p)}
              className={`px-2 py-1 rounded transition-all cursor-pointer font-bold text-[10px] flex-1 ${
                labelsActive
                  ? 'bg-blue-950 text-blue-300 border border-blue-700/80 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-300 bg-[#0d1117]'
              }`}
            >
              🏷️ Labels: {labelsActive ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => setMapMode((p) => (p === 'satellite' ? 'dark' : 'satellite'))}
              className="px-2 py-1 rounded bg-[#0d1117] text-neutral-300 hover:text-white border border-[#30363d] font-bold text-[10px] cursor-pointer flex-1"
            >
              🗺️ {mapMode === 'satellite' ? 'Satellite' : 'Dark Canvas'}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Legend Pill Bar at Bottom of Map */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none max-w-4xl w-[calc(100%-2rem)]">
        <div className="pointer-events-auto bg-[#161b22]/95 backdrop-blur-md border border-[#30363d] rounded-xl px-3.5 py-2 shadow-2xl flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono text-neutral-300">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-[#00FF66] rounded-full inline-block" />
            <span className="text-white font-medium">Normal Pre-Flood Route (Stops at Breach)</span>
          </div>
          <span className="text-neutral-600">•</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 border-b-2 border-dashed border-[#ff3300] inline-block" />
            <span className="text-rose-400 font-medium">Emergency Detour (To Backup Hospital)</span>
          </div>
          <span className="text-neutral-600">•</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 bg-[#00BFFF]/60 rounded-sm inline-block" />
            <span className="text-cyan-300 font-medium">Winding River Flood Buffer</span>
          </div>
        </div>
      </div>
    </div>
  );
};
