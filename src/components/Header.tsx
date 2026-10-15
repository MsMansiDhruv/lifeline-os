import React, { useState, useEffect, useRef } from 'react';
import { Truck, Shield, Filter, Cpu, Globe, Search, Loader2, MapPin, Sparkles, AlertTriangle } from 'lucide-react';
import { FleetMode } from '../types';
import { THEATERS, TheaterData, createCustomTheater, InterventionType } from '../data/theaters';

interface HeaderProps {
  currentTheater: TheaterData;
  interventions: Record<string, InterventionType>;
  fleetMode: FleetMode;
  onFleetChange: (mode: FleetMode) => void;
  statusFilter: string;
  onFilterChange: (filter: string) => void;
  onOpenTelemetry: () => void;
  activeTheaterId: string;
  onSelectTheater: (theaterId: string) => void;
  customTheater: TheaterData | null;
  onLoadCustomTheater: (theater: TheaterData) => void;
  tourStep?: number;
  onStartTour?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTheater,
  interventions,
  fleetMode,
  onFleetChange,
  statusFilter,
  onFilterChange,
  onOpenTelemetry,
  activeTheaterId,
  onSelectTheater,
  customTheater,
  onLoadCustomTheater,
  tourStep = 0,
  onStartTour,
}) => {
  const [cityQuery, setCityQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Live Location Autocomplete Suggestions
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isHeavy = fleetMode.includes('Heavy') || fleetMode.includes('16T');

  // Compute Live KPI numbers
  const totalRoads = currentTheater.totalRoads || 183;
  const worstChoke = currentTheater.chokePoints[0];
  const rawWorstCut = worstChoke ? worstChoke.trapped_villages_count : 27;
  const worstTool = worstChoke ? interventions[worstChoke.id] || 'none' : 'none';

  let dynamicWorstCut = rawWorstCut;
  if (worstTool === 'bridge') dynamicWorstCut = 0;
  else if (worstTool === 'booth') dynamicWorstCut = 5;
  else if (worstTool === 'drone') dynamicWorstCut = 7;
  else if (worstTool === 'boat') dynamicWorstCut = 9;

  const savedVillages = rawWorstCut - dynamicWorstCut;

  const baseOverloadedCount = currentTheater.hospitals.filter((h) => h.type === 'overloaded').length;
  let dynamicOverloadedCount = baseOverloadedCount;
  if (worstTool === 'booth' || worstTool === 'bridge') {
    dynamicOverloadedCount = 0;
  } else if (worstTool === 'drone' || worstTool === 'boat') {
    dynamicOverloadedCount = Math.max(0, baseOverloadedCount - 1);
  }
  const relievedClinics = baseOverloadedCount - dynamicOverloadedCount;

  // Debounced 300ms Nominatim suggestions fetch as user types
  useEffect(() => {
    const trimmed = cityQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(
            trimmed
          )}`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setSuggestions(data);
            setShowSuggestions(data.length > 0);
          }
        }
      } catch (err) {
        console.warn('Debounced autocomplete fetch failed:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [cityQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const compileLocationAndLoad = async (
    lat: number,
    lon: number,
    displayName: string,
    country?: string,
    state?: string
  ) => {
    setIsSearching(true);
    setShowSuggestions(false);
    setStatusMessage('Compiling OSM Overpass graph...');

    let overpassHospitals: Array<{ name: string; lat: number; lon: number }> = [];
    let overpassBridges: Array<{ name: string; lat: number; lon: number }> = [];
    let overpassRiverPath: Array<[number, number]> = [];

    try {
      const bbox = `${lat - 0.08},${lon - 0.08},${lat + 0.08},${lon + 0.08}`;
      const overpassQuery = `[out:json][timeout:3];(node["amenity"="hospital"](${bbox});way["amenity"="hospital"](${bbox});way["bridge"="yes"](${bbox});way["waterway"="river"](${bbox}););out center 25;`;

      const overpassRes = await Promise.race([
        fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error('Overpass timeout')), 3500)
        ),
      ]);

      if (overpassRes.ok) {
        const overpassData = await overpassRes.json();
        if (overpassData && overpassData.elements) {
          overpassData.elements.forEach((el: any) => {
            const elLat = el.lat || el.center?.lat;
            const elLon = el.lon || el.center?.lon;
            const name = el.tags?.name;
            if (elLat && elLon) {
              if (el.tags?.amenity === 'hospital' && name) {
                overpassHospitals.push({ name, lat: elLat, lon: elLon });
              } else if (el.tags?.bridge === 'yes' && name) {
                overpassBridges.push({ name, lat: elLat, lon: elLon });
              } else if (el.tags?.waterway === 'river') {
                overpassRiverPath.push([elLat, elLon]);
              }
            }
          });
        }
      }
    } catch {
      // Deterministic synthetic fallback
    }

    const newTheater = createCustomTheater(
      displayName,
      lat,
      lon,
      country,
      state,
      overpassHospitals,
      overpassBridges,
      overpassRiverPath.length > 2 ? overpassRiverPath : undefined
    );

    onLoadCustomTheater(newTheater);
    onSelectTheater('custom');
    setStatusMessage(null);
    setIsSearching(false);
  };

  const handleSelectSuggestion = (item: any) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    setCityQuery(item.display_name.split(',')[0]);
    compileLocationAndLoad(
      lat,
      lon,
      item.display_name,
      item.address?.country,
      item.address?.state
    );
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityQuery.trim()) return;

    if (suggestions.length > 0) {
      handleSelectSuggestion(suggestions[0]);
      return;
    }

    setIsSearching(true);
    setStatusMessage('Searching city geocode...');

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
          cityQuery.trim()
        )}`
      );
      if (!res.ok) throw new Error('Geocoding search failed');
      const data = await res.json();
      if (!data || data.length === 0) {
        throw new Error('City or river not found');
      }

      const first = data[0];
      const lat = parseFloat(first.lat);
      const lon = parseFloat(first.lon);

      await compileLocationAndLoad(
        lat,
        lon,
        first.display_name,
        first.address?.country,
        first.address?.state
      );
    } catch (err: any) {
      setStatusMessage('Location not found. Try Ahmedabad, Silchar...');
      setTimeout(() => setStatusMessage(null), 3000);
      setIsSearching(false);
    }
  };

  return (
    <header className="fixed top-3 left-3 right-3 z-30 pointer-events-none">
      <div className="bg-[#161b22]/95 backdrop-blur-xl border border-[#30363d] rounded-2xl p-2.5 shadow-2xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 pointer-events-auto">
        {/* Left Section: Logo, Title, Theater Switcher & Search Bar */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          {/* Logo & Title */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-rose-600 flex items-center justify-center shadow-md text-white font-black text-base shrink-0">
              🚨
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5 leading-none">
                Lifeline OS
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-950 text-blue-400 border border-blue-800">
                  Command
                </span>
              </h1>
              <p className="text-[9px] text-[#8b949e] truncate max-w-[150px] font-medium leading-tight mt-0.5">
                {currentTheater.authorityShortName || 'Civil Defense'}
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-[#30363d] hidden sm:block" />

          {/* Theater Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <select
              value={activeTheaterId}
              onChange={(e) => onSelectTheater(e.target.value)}
              className="bg-[#0d1117] text-white border border-[#30363d] rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer focus:outline-none focus:border-blue-500"
            >
              <option value="silchar">🌊 Silchar, Assam (Barak River)</option>
              <option value="nepal">🏔️ Gorkha, Nepal (Budhi Gandaki)</option>
              <option value="wayanad">⛰️ Wayanad, Kerala (Chaliyar Basin)</option>
              {customTheater && <option value="custom">📍 {customTheater.name}</option>}
            </select>
          </div>

          {/* Real-Time Location Search with Autocomplete */}
          <div ref={dropdownRef} className="relative flex-1 min-w-[200px] max-w-xs">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-1">
              <div className="relative flex-1">
                <Search className="w-3 h-3 text-neutral-400 absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={cityQuery}
                  onChange={(e) => setCityQuery(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  placeholder="🔍 Search city/river..."
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-7 pr-2 py-1 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
              {isSearching && (
                <div className="text-[10px] text-cyan-400 flex items-center gap-1 font-mono shrink-0">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="hidden sm:inline">{statusMessage || 'Loading...'}</span>
                </div>
              )}
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-[#21262d] max-h-52 overflow-y-auto">
                {suggestions.map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full px-2.5 py-1.5 text-left hover:bg-[#21262d] transition-colors flex items-center justify-between gap-1.5 text-xs text-[#c9d1d9] cursor-pointer"
                  >
                    <div className="truncate flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="font-bold text-white truncate text-[11px]">
                        {item.display_name.split(',')[0]}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-cyan-400 shrink-0 bg-cyan-950/60 px-1 py-0.2 rounded border border-cyan-800/40">
                      {parseFloat(item.lat).toFixed(2)}, {parseFloat(item.lon).toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Compact KPI Pills & Interactive Controls (Requirement 1) */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* KPI Pill 1: Bottlenecks */}
          <div className="bg-[#0d1117] border border-[#30363d] px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5">
            <span className="text-neutral-400">🌉 Bottlenecks:</span>
            <strong className="text-white font-bold">{totalRoads}</strong>
          </div>

          {/* KPI Pill 2: Villages Trapped & Saved (Positive badges, no negatives!) */}
          <div className="bg-[#0d1117] border border-[#30363d] px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5">
            <span className="text-neutral-400">🏘️ Trapped:</span>
            <strong className={dynamicWorstCut === 0 ? 'text-emerald-400' : 'text-amber-400'}>
              {dynamicWorstCut}
            </strong>
            {savedVillages > 0 && (
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-700">
                ✅ {savedVillages} Saved
              </span>
            )}
          </div>

          {/* KPI Pill 3: Overloaded Clinics & Relieved */}
          <div className="bg-[#0d1117] border border-[#30363d] px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5">
            <span className="text-neutral-400">🏥 Influx:</span>
            <strong className={dynamicOverloadedCount === 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {dynamicOverloadedCount}
            </strong>
            {relievedClinics > 0 && (
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-700">
                ✅ {relievedClinics} Relieved
              </span>
            )}
          </div>

          {/* Fleet Mode Selector Toggle */}
          <div className="flex items-center bg-[#0d1117] p-0.5 rounded-lg border border-[#30363d] text-xs font-mono">
            <button
              onClick={() => onFleetChange('Light Emergency (Ambulance/4x4)')}
              className={`px-2 py-0.5 rounded-md font-bold text-[11px] transition-all cursor-pointer ${
                !isHeavy
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Light Vehicle Axle (Ambulance/4x4)"
            >
              🚑 4x4
            </button>
            <button
              onClick={() => onFleetChange('Heavy Supply (Truck/Bus)')}
              className={`px-2 py-0.5 rounded-md font-bold text-[11px] transition-all cursor-pointer ${
                isHeavy
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="16T Heavy Truck Axle"
            >
              🚛 16T
            </button>
          </div>

          {/* Interactive Walkthrough Tour CTA */}
          {onStartTour && (
            <button
              onClick={onStartTour}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/80 font-bold text-[11px] shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all cursor-pointer font-mono"
            >
              <span>🎯 Tour</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          )}

          {/* Telemetry Button */}
          <button
            onClick={onOpenTelemetry}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900 text-blue-300 border border-blue-600/40 text-[11px] cursor-pointer font-mono"
            title="Spatial Graph Telemetry"
          >
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>⚙️</span>
          </button>
        </div>
      </div>
    </header>
  );
};
