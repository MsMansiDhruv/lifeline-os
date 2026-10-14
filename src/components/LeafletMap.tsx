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
  layerType?: 'severed' | 'catchment' | 'baseline' | 'detour' | 'general';
}

interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  height?: string;
  floodGeoJsonUrl?: string;
  markers?: Array<{
    lat: number;
    lon: number;
    title: string;
    description?: string;
    type: 'isolated' | 'rerouted' | 'reachable' | 'chokepoint' | 'hub' | 'bridge' | 'facility';
    badge?: string;
  }>;
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
  center = [24.83, 92.80],
  zoom = 11,
  height = '500px',
  floodGeoJsonUrl = '/flood_cleaned.geojson',
  markers = [],
  lines = [],
  highlightBridge = null,
  showLayerControls = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [mapMode, setMapMode] = useState<'satellite' | 'dark'>('satellite');

  // Layer Visibility Toggles (Judge inspection controls)
  const [floodActive, setFloodActive] = useState<boolean>(true);
  const [severedActive, setSeveredActive] = useState<boolean>(true);
  const [catchmentActive, setCatchmentActive] = useState<boolean>(true);
  const [routesActive, setRoutesActive] = useState<boolean>(true);

  const floodLayerRef = useRef<L.GeoJSON | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const linesLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const tile = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Esri World Imagery',
          maxZoom: 18,
        }
      ).addTo(map);
      tileLayerRef.current = tile;

      markersLayerRef.current = L.layerGroup().addTo(map);
      linesLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }
  }, []);

  // Update center and zoom when props change
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom, { animate: true });
    }
  }, [center, zoom]);

  // Handle Tile Switching
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
  }, [mapMode]);

  // Load and toggle Flood GeoJSON (Layer 1)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (floodLayerRef.current) {
      mapInstanceRef.current.removeLayer(floodLayerRef.current);
      floodLayerRef.current = null;
    }

    if (floodActive && floodGeoJsonUrl) {
      fetch(floodGeoJsonUrl)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load flood geojson');
          return res.json();
        })
        .then((data) => {
          if (!mapInstanceRef.current) return;
          const geoLayer = L.geoJSON(data, {
            style: {
              color: '#00BFFF',
              weight: 1.2,
              fillColor: '#00BFFF',
              fillOpacity: 0.45,
            },
          });
          geoLayer.addTo(mapInstanceRef.current);
          floodLayerRef.current = geoLayer;
        })
        .catch((err) => {
          console.warn('Could not load flood geojson layer:', err);
        });
    }
  }, [floodActive, floodGeoJsonUrl]);

  // Update Lines & Vectors (Layers 2, 3, 4)
  useEffect(() => {
    if (!linesLayerRef.current) return;
    linesLayerRef.current.clearLayers();

    lines.forEach((line) => {
      // Check filtering by layer type
      if (line.layerType === 'severed' && !severedActive) return;
      if (line.layerType === 'catchment' && !catchmentActive) return;
      if ((line.layerType === 'baseline' || line.layerType === 'detour') && !routesActive) return;

      const poly = L.polyline(line.points, {
        color: line.color,
        weight: line.weight || 3,
        dashArray: line.dashArray,
        opacity: 0.95,
        className: line.className || (line.layerType === 'severed' ? 'severed-span-anim' : ''),
      });

      if (line.label) {
        poly.bindTooltip(line.label, { permanent: false, sticky: true });
      }
      poly.addTo(linesLayerRef.current!);
    });
  }, [lines, severedActive, catchmentActive, routesActive]);

  // Update Markers
  useEffect(() => {
    if (!markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    markers.forEach((m) => {
      let iconHtml = '';
      let className = 'custom-div-icon';

      if (m.type === 'isolated') {
        iconHtml = `<div style="background:#ff4d4d; width:16px; height:16px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px #ff4d4d;" class="pulse-danger"></div>`;
      } else if (m.type === 'reachable') {
        iconHtml = `<div style="background:#00e676; width:16px; height:16px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 12px #00e676;" class="pulse-success"></div>`;
      } else if (m.type === 'rerouted') {
        iconHtml = `<div style="background:#ffaa00; width:14px; height:14px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 8px #ffaa00;" class="pulse-warning"></div>`;
      } else if (m.type === 'chokepoint') {
        const isHardened = m.badge?.includes('HARDENED') || m.title.includes('HARDENED') || m.badge?.includes('OPERATIONAL');
        if (isHardened) {
          iconHtml = `<div style="background:#00e676; color:#0d1117; padding:4px 6px; border-radius:6px; border:2px solid #fff; font-size:10px; font-weight:900; display:flex; align-items:center; gap:3px; box-shadow:0 0 14px #00e676;">🛠️ HARDENED</div>`;
        } else {
          iconHtml = `<div style="background:#ff1100; padding:4px 6px; border-radius:6px; border:2px solid #fff; color:#fff; font-size:10px; font-weight:900; display:flex; align-items:center; gap:3px; box-shadow:0 0 12px #ff1100;">⚡ CHOKE</div>`;
        }
      } else if (m.type === 'hub') {
        iconHtml = `<div style="background:#00e5ff; color:#0d1117; padding:4px 6px; border-radius:6px; border:2px solid #fff; font-size:10px; font-weight:900; display:flex; align-items:center; gap:3px;">⚓ ${m.badge || 'HUB'}</div>`;
      } else if (m.type === 'bridge') {
        iconHtml = `<div style="background:#00e676; color:#0d1117; padding:4px 6px; border-radius:6px; border:2px solid #fff; font-size:10px; font-weight:900;">🌉 BAILEY</div>`;
      } else if (m.type === 'facility') {
        const isSurge = m.badge?.includes('SURGE') || m.badge?.includes('OVERLOAD') || (m.description && m.description.includes('Surge'));
        const isCutOff = m.badge?.includes('ISOLATED') || m.badge?.includes('INACCESSIBLE') || m.badge?.includes('CUT-OFF');
        if (isSurge) {
          iconHtml = `<div style="background:#e11d48; color:#fff; padding:4px 8px; border-radius:8px; border:2px solid #fff; font-size:10px; font-weight:900; box-shadow:0 0 14px #f43f5e; display:flex; align-items:center; gap:3px;">🏥 ${m.badge || 'SURGE >150%'}</div>`;
        } else if (isCutOff) {
          iconHtml = `<div style="background:#374151; color:#f87171; padding:4px 6px; border-radius:8px; border:2px solid #ef4444; font-size:10px; font-weight:bold;">🏥 FLOODED</div>`;
        } else {
          iconHtml = `<div style="background:#238636; color:#fff; padding:3px 5px; border-radius:50%; border:1.5px solid #fff; font-size:12px; font-weight:bold;">🏥</div>`;
        }
      } else {
        iconHtml = `<div style="background:#388bfd; width:12px; height:12px; border-radius:50%; border:1.5px solid #fff;"></div>`;
      }

      const customIcon = L.divIcon({
        html: iconHtml,
        className,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([m.lat, m.lon], { icon: customIcon });

      const popupContent = `
        <div style="font-family:sans-serif; min-width:210px;">
          <div style="font-weight:700; font-size:13px; color:#58a6ff; margin-bottom:4px;">${m.title}</div>
          ${m.description ? `<div style="font-size:12px; color:#c9d1d9; line-height:1.4;">${m.description}</div>` : ''}
          ${m.badge ? `<div style="margin-top:6px; display:inline-block; font-size:10px; background:#21262d; padding:2px 6px; border-radius:4px; color:#ffaa00; border:1px solid #30363d;">${m.badge}</div>` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.bindTooltip(m.title, { sticky: true });
      marker.addTo(markersLayerRef.current!);
    });
  }, [markers]);

  // Handle Highlight Bridge
  useEffect(() => {
    if (!mapInstanceRef.current || !highlightBridge) return;
    const bMarker = L.circleMarker([highlightBridge.lat, highlightBridge.lon], {
      radius: 12,
      color: '#00FF66',
      weight: 3,
      fillColor: '#00e676',
      fillOpacity: 0.8,
    });
    bMarker.bindPopup(`<b>${highlightBridge.title}</b><br>Span: ${highlightBridge.span_m}m | ROI: ${highlightBridge.roi}`);
    bMarker.addTo(markersLayerRef.current!);

    const offset = 0.0015;
    const bLine = L.polyline([
      [highlightBridge.lat - offset, highlightBridge.lon - offset],
      [highlightBridge.lat + offset, highlightBridge.lon + offset],
    ], {
      color: '#00FF66',
      weight: 6,
      opacity: 1,
    });
    bLine.addTo(linesLayerRef.current!);
  }, [highlightBridge]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-[#30363d] shadow-2xl bg-[#0d1117]">
      {/* Top Controls Overlay */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-wrap items-center gap-2 bg-[#161b22]/95 backdrop-blur-md p-1.5 rounded-xl border border-[#30363d] shadow-xl text-xs max-w-[calc(100%-24px)]">
        {/* Basemap Toggle */}
        <button
          onClick={() => setMapMode((prev) => (prev === 'satellite' ? 'dark' : 'satellite'))}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] transition-colors font-medium cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>{mapMode === 'satellite' ? 'Satellite' : 'Dark'}</span>
        </button>

        {/* Layer 1: SAR Flood Mask */}
        <button
          onClick={() => setFloodActive((prev) => !prev)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors font-medium cursor-pointer ${
            floodActive
              ? 'bg-[#1f6feb]/30 text-[#58a6ff] border border-[#1f6feb]'
              : 'bg-[#21262d] text-[#8b949e] border border-transparent opacity-60'
          }`}
          title="Layer 1: Sentinel-1 SAR Flood Inundation Polygon (#00BFFF 45%)"
        >
          <span className="w-2 h-2 rounded-full bg-[#00BFFF] inline-block shadow-[0_0_8px_#00BFFF]" />
          <span>L1: SAR Flood</span>
        </button>

        {showLayerControls && (
          <>
            {/* Layer 2: Flashing Severed Span */}
            <button
              onClick={() => setSeveredActive((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors font-medium cursor-pointer ${
                severedActive
                  ? 'bg-red-950/60 text-red-300 border border-red-500'
                  : 'bg-[#21262d] text-[#8b949e] border border-transparent opacity-60'
              }`}
              title="Layer 2: Exact Flashing Severed Culvert/Bridge Span (#FF1100)"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-ping" />
              <span>L2: Severed Span</span>
            </button>

            {/* Layer 3: Catchment Tree */}
            <button
              onClick={() => setCatchmentActive((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors font-medium cursor-pointer ${
                catchmentActive
                  ? 'bg-amber-950/60 text-amber-300 border border-amber-500'
                  : 'bg-[#21262d] text-[#8b949e] border border-transparent opacity-60'
              }`}
              title="Layer 3: Catchment Tree / Dependent Downstream Habitats (Orange Dashed Lines)"
            >
              <span className="w-2 h-2 rounded-full bg-[#ffaa00] inline-block" />
              <span>L3: Catchment</span>
            </button>

            {/* Layer 4: Routes */}
            <button
              onClick={() => setRoutesActive((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors font-medium cursor-pointer ${
                routesActive
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500'
                  : 'bg-[#21262d] text-[#8b949e] border border-transparent opacity-60'
              }`}
              title="Layer 4: Baseline Route (Green) vs Disaster Detour (Red Dashed)"
            >
              <span className="w-2 h-2 rounded-full bg-[#00e676] inline-block" />
              <span>L4: Routes</span>
            </button>
          </>
        )}
      </div>

      {/* Actual Map Container */}
      <div ref={mapContainerRef} style={{ height, width: '100%' }} className="z-0" />
    </div>
  );
};
