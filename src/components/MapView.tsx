import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Eye, EyeOff } from 'lucide-react';

export interface MapMarkerItem {
  lat: number;
  lon: number;
  title: string;
  popupHtml?: string;
  type?: 'village' | 'baseline_facility' | 'scenario_facility' | 'choke_point' | 'staging_hub' | 'bridge';
  radius?: number;
  color?: string;
  badge?: string;
}

export interface MapPolylineItem {
  coords: [number, number][];
  color: string;
  weight?: number;
  dashArray?: string;
  opacity?: number;
  tooltip?: string;
}

interface MapViewProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarkerItem[];
  polylines?: MapPolylineItem[];
  showFloodMask?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const MapView: React.FC<MapViewProps> = ({
  center,
  zoom = 12,
  markers = [],
  polylines = [],
  showFloodMask = true,
  className = 'w-full h-[500px]',
  style,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const floodLayerRef = useRef<L.GeoJSON | null>(null);
  const itemsLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [activeTileType, setActiveTileType] = useState<'dark' | 'satellite'>('dark');
  const [floodVisible, setFloodVisible] = useState<boolean>(showFloodMask);
  const [floodData, setFloodData] = useState<any>(null);

  // Load flood geojson once
  useEffect(() => {
    fetch('/flood_polygon.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load flood polygon');
        return res.json();
      })
      .then((data) => setFloodData(data))
      .catch((err) => console.warn('Flood polygon load note:', err));
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: false,
      });

      // Layer groups
      baseLayerGroupRef.current = L.layerGroup().addTo(map);
      itemsLayerGroupRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;

      // Invalidate size after mount
      setTimeout(() => map.invalidateSize(), 200);
    } else {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // Update Base Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !baseLayerGroupRef.current) return;

    baseLayerGroupRef.current.clearLayers();

    if (activeTileType === 'dark') {
      const baseDark = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 16 }
      );
      const labelsDark = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 16, opacity: 0.9 }
      );
      baseLayerGroupRef.current.addLayer(baseDark);
      baseLayerGroupRef.current.addLayer(labelsDark);
    } else {
      const satellite = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 17 }
      );
      baseLayerGroupRef.current.addLayer(satellite);
    }
  }, [activeTileType]);

  // Render Flood Polygon
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (floodLayerRef.current) {
      mapInstanceRef.current.removeLayer(floodLayerRef.current);
      floodLayerRef.current = null;
    }

    if (floodVisible && floodData) {
      const geoLayer = L.geoJSON(floodData, {
        style: () => ({
          fillColor: '#00BFFF',
          color: '#00BFFF',
          weight: 0.8,
          fillOpacity: 0.4,
        }),
      });
      geoLayer.addTo(mapInstanceRef.current);
      floodLayerRef.current = geoLayer;
    }
  }, [floodVisible, floodData]);

  // Render Polylines and Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !itemsLayerGroupRef.current) return;

    itemsLayerGroupRef.current.clearLayers();

    // 1. Render Polylines
    polylines.forEach((line) => {
      const poly = L.polyline(line.coords, {
        color: line.color,
        weight: line.weight || 4,
        dashArray: line.dashArray,
        opacity: line.opacity ?? 0.85,
      });

      if (line.tooltip) {
        poly.bindTooltip(line.tooltip, { sticky: true });
      }

      itemsLayerGroupRef.current?.addLayer(poly);
    });

    // 2. Render Markers
    markers.forEach((m) => {
      let iconColor = '#00e676';
      let iconLabel = '📍';

      if (m.type === 'village') {
        iconColor = m.color || '#00e676';
        iconLabel = '🏘️';
      } else if (m.type === 'baseline_facility') {
        iconColor = '#7ee787';
        iconLabel = '🏥';
      } else if (m.type === 'scenario_facility') {
        iconColor = '#ff4d4d';
        iconLabel = '🏥';
      } else if (m.type === 'choke_point') {
        iconColor = '#ff4d4d';
        iconLabel = '⚠️';
      } else if (m.type === 'staging_hub') {
        iconColor = '#00BFFF';
        iconLabel = '⚓';
      } else if (m.type === 'bridge') {
        iconColor = '#00FF66';
        iconLabel = '🌉';
      }

      // Circle marker or custom html icon
      if (m.radius) {
        const circle = L.circleMarker([m.lat, m.lon], {
          radius: m.radius,
          color: m.color || '#ff4d4d',
          fillColor: m.color || '#ff4d4d',
          fillOpacity: 0.75,
          weight: 2,
        });

        if (m.title) circle.bindTooltip(m.title);
        if (m.popupHtml) circle.bindPopup(m.popupHtml);
        itemsLayerGroupRef.current?.addLayer(circle);
      } else {
        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div style="background:${iconColor}22; border: 2px solid ${iconColor}; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 15px; box-shadow: 0 0 10px ${iconColor}88;">
              ${iconLabel}
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -18],
        });

        const marker = L.marker([m.lat, m.lon], { icon: customIcon });
        if (m.title) marker.bindTooltip(m.title);
        if (m.popupHtml) marker.bindPopup(m.popupHtml);
        itemsLayerGroupRef.current?.addLayer(marker);
      }
    });
  }, [markers, polylines]);

  return (
    <div className="relative border border-[#30363d] rounded-lg overflow-hidden shadow-2xl bg-[#090d13]">
      <div ref={mapContainerRef} className={className} style={style} />

      {/* Map Control Bar Overlays */}
      <div className="absolute top-3 right-3 z-[1000] flex gap-2">
        <button
          onClick={() => setActiveTileType(activeTileType === 'dark' ? 'satellite' : 'dark')}
          className="px-2.5 py-1.5 rounded bg-[#161b22]/90 hover:bg-[#21262d] text-[#c9d1d9] border border-[#30363d] text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm transition-colors shadow-md"
          title="Toggle Tile Layer"
        >
          <Layers className="w-3.5 h-3.5 text-[#58a6ff]" />
          {activeTileType === 'dark' ? 'Dark Canvas' : 'Satellite'}
        </button>

        <button
          onClick={() => setFloodVisible(!floodVisible)}
          className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm border transition-colors shadow-md ${
            floodVisible
              ? 'bg-[#00BFFF]/20 text-[#00e5ff] border-[#00BFFF]/50'
              : 'bg-[#161b22]/90 text-[#8b949e] border-[#30363d] hover:bg-[#21262d]'
          }`}
          title="Toggle Sentinel-1 SAR Flood Inundation"
        >
          {floodVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          SAR Flood Mask
        </button>
      </div>

      {/* Legend Footer */}
      <div className="absolute bottom-2 left-2 z-[1000] bg-[#161b22]/90 backdrop-blur-sm border border-[#30363d] px-3 py-1.5 rounded text-[11px] text-[#8b949e] flex items-center gap-3">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00BFFF]/80"></span> SAR Flood
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00e676]"></span> Origin Village
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff4d4d]"></span> Severe / Choke Point
        </span>
      </div>
    </div>
  );
};
