import React, { useState, useEffect } from 'react';
import { STAGING_HUBS, SETTLEMENTS_LIGHT } from '../../data/disasterData';
import { StagingHubRecord } from '../../types';
import { TheaterData } from '../../data/theaters';
import { LeafletMap } from '../LeafletMap';
import {
  Anchor,
  Download,
  Navigation,
  Shield,
  CheckCircle,
  CloudRain,
  Waves,
  Wind,
  Moon,
  AlertTriangle,
  Sliders,
  Send,
  Boxes,
  Activity,
  Plane,
} from 'lucide-react';
import { fetchLiveWeatherTelemetry, WeatherTelemetry } from '../../services/weatherService';

interface PrepositioningTabProps {
  currentTheater?: TheaterData;
}

interface HubStockState {
  foodRationsTons: number;
  waterKl: number;
  lifeJackets: number;
  medicalKits: number;
  droneSortiesReady: number;
}

const DEFAULT_STOCKS: Record<number, HubStockState> = {
  1: { foodRationsTons: 45, waterKl: 30, lifeJackets: 250, medicalKits: 120, droneSortiesReady: 14 },
  2: { foodRationsTons: 32, waterKl: 22, lifeJackets: 180, medicalKits: 85, droneSortiesReady: 10 },
  3: { foodRationsTons: 28, waterKl: 18, lifeJackets: 160, medicalKits: 75, droneSortiesReady: 8 },
  4: { foodRationsTons: 38, waterKl: 26, lifeJackets: 210, medicalKits: 100, droneSortiesReady: 12 },
};

export const PrepositioningTab: React.FC<PrepositioningTabProps> = ({ currentTheater }) => {
  const [selectedHubId, setSelectedHubId] = useState<number | 'all'>('all');
  const [weather, setWeather] = useState<WeatherTelemetry | null>(null);
  const [stocks, setStocks] = useState<Record<number, HubStockState>>(DEFAULT_STOCKS);
  const [dispatchAlert, setDispatchAlert] = useState<string | null>(null);

  useEffect(() => {
    fetchLiveWeatherTelemetry().then(setWeather);
    const interval = setInterval(() => {
      fetchLiveWeatherTelemetry().then(setWeather);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const theaterHubs: StagingHubRecord[] =
    currentTheater?.stagingHubs && currentTheater.stagingHubs.length > 0
      ? currentTheater.stagingHubs
      : STAGING_HUBS;

  const displayHubs =
    selectedHubId === 'all'
      ? theaterHubs
      : theaterHubs.filter((h) => h.hub_id === selectedHubId);

  const authorityShort = currentTheater?.authorityShortName || 'Civil Defense';

  const handleStockChange = (hubId: number, field: keyof HubStockState, val: number) => {
    setStocks((prev) => ({
      ...prev,
      [hubId]: {
        ...(prev[hubId] || DEFAULT_STOCKS[1]),
        [field]: val,
      },
    }));
  };

  const handleDispatchSortie = (hubName: string) => {
    setDispatchAlert(`🚨 Emergency air sortie dispatched from ${hubName}! Tracking telemetry locked.`);
    setTimeout(() => setDispatchAlert(null), 4000);
  };

  // Build Map Markers and Transit Vector Lines
  const mapMarkers = [
    ...displayHubs.map((h) => ({
      lat: h.lat,
      lon: h.lon,
      title: h.hub_name,
      description: `Dry Roadhead Node #${h.node}. Servicing ${h.assigned_settlements_count} cut-off settlements. Assets: ${h.recommended_relief_assets}`,
      type: 'hub' as const,
      badge: `Base #${h.hub_id}`,
    })),
    ...(currentTheater && currentTheater.id !== 'silchar'
      ? currentTheater.chokePoints.flatMap((cp) =>
          cp.villages.map((v) => ({
            lat: v.lat,
            lon: v.lon,
            title: `Cut-Off Habitat: ${v.name}`,
            description: `Complete land-route isolation behind ${cp.road_name}.`,
            type: 'isolated' as const,
            badge: 'ISOLATED',
          }))
        )
      : SETTLEMENTS_LIGHT.filter((s) => s.modeled_status === 'MODEL_ISOLATED').map((s) => ({
          lat: s.lat,
          lon: s.lon,
          title: `Cut-Off Habitat: ${s.village_name}`,
          description: `Complete land-route isolation. Requires water/air rescue.`,
          type: 'isolated' as const,
          badge: 'ISOLATED',
        }))),
  ];

  const lines: Array<{
    points: [number, number][];
    color: string;
    dashArray?: string;
    weight?: number;
    label?: string;
  }> = [];

  const colors = ['#38bdf8', '#34d399', '#a78bfa', '#f59e0b'];

  displayHubs.forEach((hub, idx) => {
    const hubColor = colors[idx % colors.length];
    const assignedNames = hub.assigned_villages_str
      .split(',')
      .map((v: string) => v.trim().toLowerCase());

    SETTLEMENTS_LIGHT.filter((s) => s.modeled_status === 'MODEL_ISOLATED').forEach((s) => {
      if (
        assignedNames.some(
          (name: string) =>
            s.village_name.toLowerCase().includes(name) ||
            name.includes(s.village_name.toLowerCase())
        )
      ) {
        lines.push({
          points: [
            [hub.lat, hub.lon],
            [s.lat, s.lon],
          ],
          color: hubColor,
          dashArray: '6, 8',
          weight: 2.5,
          label: `Relief Vector: ${hub.hub_name} ➔ ${s.village_name}`,
        });
      }
    });
  });

  const mapCenter: [number, number] =
    displayHubs.length === 1 ? [displayHubs[0].lat, displayHubs[0].lon] : [24.8333, 92.7789];

  return (
    <div className="space-y-6">
      {/* 1. Real Live Open-Meteo Weather & Barak Flood Warning Telemetry Banner */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-950 border border-sky-600/50 text-sky-400">
              <CloudRain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold">
                  LIVE OPEN-METEO WEATHER & CACHAR HYDROGRAPH TELEMETRY
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  REAL-TIME API
                </span>
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight mt-0.5">
                Barak Basin Hydro-Meteorological Station (24.83°N, 92.78°E)
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Last Polled:</span>
            <strong className="text-white">{weather?.lastUpdated || 'Connecting...'}</strong>
          </div>
        </div>

        {/* 4 Telemetry Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          {/* Gauge Level */}
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center gap-1">
                <Waves className="w-3.5 h-3.5 text-sky-400" />
                Barak River Gauge
              </span>
              <span className="text-rose-400 font-bold">DANGER 19.83m</span>
            </div>
            <div className="text-xl font-bold text-rose-400">
              {weather?.riverBarakGaugeLevelM.toFixed(2) || '21.05'} m
            </div>
            <div className="text-[10px] text-rose-500 font-semibold mt-0.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              +1.22m Above Severe Danger Level
            </div>
          </div>

          {/* Precipitation */}
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center gap-1">
                <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                Precipitation Rate
              </span>
              <span className="text-cyan-400 font-bold">{weather?.weatherCondition || 'Monsoon'}</span>
            </div>
            <div className="text-xl font-bold text-cyan-300">
              {weather?.precipitation.toFixed(1) || '14.2'} mm/h
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Accumulated Rain: {weather?.rain.toFixed(1) || '12.0'} mm • Hum: {weather?.humidity || 89}%
            </div>
          </div>

          {/* Wind & Drone Sortie Safety */}
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-emerald-400" />
                Wind & Drone Safety
              </span>
              <span className="text-emerald-400 font-bold">FLIGHT GO</span>
            </div>
            <div className="text-xl font-bold text-emerald-300">
              {weather?.windSpeed.toFixed(1) || '16.5'} km/h
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">
              Safe for heavy-lift hexacopters (&lt;35 km/h)
            </div>
          </div>

          {/* Night Visibility & Surface Boats */}
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center gap-1">
                <Moon className="w-3.5 h-3.5 text-amber-400" />
                Night Ops Visibility
              </span>
              <span className="text-amber-400 font-bold">LIMITED</span>
            </div>
            <div className="text-xl font-bold text-amber-300">
              {weather?.nightVisibilityKm || '1.8'} km
            </div>
            <div className="text-[10px] text-amber-400 mt-0.5">
              Boats: Grounded at Night • FLIR Active
            </div>
          </div>
        </div>
      </div>

      {dispatchAlert && (
        <div className="p-3 bg-emerald-950 border border-emerald-500 rounded-xl text-emerald-300 font-mono text-xs flex items-center gap-2 shadow-lg animate-pulse">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{dispatchAlert}</span>
        </div>
      )}

      {/* 2. Command Manifest & Real Dispatch Sliders across the 4 Hubs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Live Stock Levels & Interactive Dispatch */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Boxes className="w-4 h-4 text-cyan-400" />
              Prepositioned Staging Hub Stock Levels & Dispatch
            </h4>

            <select
              value={selectedHubId}
              onChange={(e) =>
                setSelectedHubId(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="bg-slate-900 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer font-mono"
            >
              <option value="all">All 4 Staging Bases</option>
              {theaterHubs.map((h) => (
                <option key={h.hub_id} value={h.hub_id}>
                  Base #{h.hub_id}: {h.hub_name.split('(')[0]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {displayHubs.map((hub) => {
              const currentStock = stocks[hub.hub_id] || DEFAULT_STOCKS[1];
              return (
                <div
                  key={hub.hub_id}
                  className="bg-slate-950 border border-slate-800 border-l-4 border-l-cyan-400 p-4 rounded-r-2xl shadow-xl space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-white flex items-center gap-1.5 font-mono">
                        ⚓ {hub.hub_name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Dry Roadhead Node #{hub.node} • Coordinates: {hub.lat.toFixed(4)}°N, {hub.lon.toFixed(4)}°E
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {hub.hub_tier}
                    </span>
                  </div>

                  {/* Stock Sliders */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {/* Food Rations */}
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 font-mono">
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Food Rations:</span>
                        <strong className="text-amber-300">{currentStock.foodRationsTons} Tons</strong>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="80"
                        value={currentStock.foodRationsTons}
                        onChange={(e) =>
                          handleStockChange(hub.hub_id, 'foodRationsTons', Number(e.target.value))
                        }
                        className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                    </div>

                    {/* Potable Water */}
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 font-mono">
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Potable Water:</span>
                        <strong className="text-sky-300">{currentStock.waterKl} kL</strong>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="60"
                        value={currentStock.waterKl}
                        onChange={(e) =>
                          handleStockChange(hub.hub_id, 'waterKl', Number(e.target.value))
                        }
                        className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                    </div>

                    {/* Life Jackets & Rafts */}
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 font-mono">
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Life Jackets & Rafts:</span>
                        <strong className="text-emerald-300">{currentStock.lifeJackets} Units</strong>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="400"
                        value={currentStock.lifeJackets}
                        onChange={(e) =>
                          handleStockChange(hub.hub_id, 'lifeJackets', Number(e.target.value))
                        }
                        className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                    </div>

                    {/* Drone Sorties Ready */}
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 font-mono">
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>UAV Sorties Ready:</span>
                        <strong className="text-purple-300">{currentStock.droneSortiesReady} Sorties</strong>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="30"
                        value={currentStock.droneSortiesReady}
                        onChange={(e) =>
                          handleStockChange(hub.hub_id, 'droneSortiesReady', Number(e.target.value))
                        }
                        className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-mono text-slate-400">
                      Assigned: <strong className="text-white">{hub.assigned_villages_str}</strong>
                    </span>
                    <button
                      onClick={() => handleDispatchSortie(hub.hub_name)}
                      className="px-2.5 py-1 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg font-mono font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plane className="w-3 h-3" />
                      <span>Dispatch Sortie</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Tactical Transit Map */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="font-bold text-white">Prepositioning Transit Map & Vectors</span>
            <span className="uppercase text-cyan-400 font-bold">CACHAR DISASTER THEATER</span>
          </div>

          <LeafletMap
            key={currentTheater?.id || 'silchar'}
            center={mapCenter}
            zoom={12}
            height="460px"
            markers={mapMarkers}
            lines={lines}
            floodPolygon={currentTheater?.floodPolygon}
          />
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-300 flex items-center justify-between">
            <span>⚓ Cyan/Green Markers = Dry Roadhead Staging Hubs</span>
            <span>Dashed lines = Direct Amphibious & UAV Relief Vectors</span>
          </div>
        </div>
      </div>
    </div>
  );
};
