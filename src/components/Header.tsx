import React, { useState, useEffect, useRef } from 'react';
import {
  Truck,
  Shield,
  Search,
  Loader2,
  MapPin,
  Cpu,
  Globe,
  ShieldAlert,
  Users,
  CheckCircle2,
  Activity,
  Compass,
  Target,
  Play,
  Clock,
  Sun,
  Moon,
  Cloud,
} from 'lucide-react';
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
  onOpenCloudArchitecture?: () => void;
  activeTheaterId: string;
  onSelectTheater: (theaterId: string) => void;
  customTheater: TheaterData | null;
  onLoadCustomTheater: (theater: TheaterData) => void;
  tourStep?: number;
  onStartTour?: () => void;
  onStartInteractiveTour?: () => void;
  onStartAutoDemo?: () => void;
  isInteractiveTourActive?: boolean;
  isAutoDemoActive?: boolean;
  interactiveTourTask?: number;
  opsMode?: 'day' | 'night';
  onToggleOpsMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTheater,
  interventions,
  fleetMode,
  onFleetChange,
  statusFilter,
  onFilterChange,
  onOpenTelemetry,
  onOpenCloudArchitecture,
  activeTheaterId,
  onSelectTheater,
  customTheater,
  onLoadCustomTheater,
  tourStep = 0,
  onStartTour,
  onStartInteractiveTour,
  onStartAutoDemo,
  isInteractiveTourActive = false,
  isAutoDemoActive = false,
  interactiveTourTask = 0,
  opsMode = 'day',
  onToggleOpsMode,
}) => {
  const [cityQuery, setCityQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Live Location Autocomplete Suggestions
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isHeavy = fleetMode.includes('Heavy') || fleetMode.includes('16T');

  // Compute Live KPI numbers across ALL corridors (Requirements 2 & 5):
  // 1. Bottlenecks: Starts at 4 in 4x4, jumps to 6 in 16T mode (+63 axle-restricted paths, 183 -> 246)
  const baseTotalRoads = isHeavy ? 246 : (currentTheater.totalRoads || 183);
  const baseCriticalChokes = isHeavy ? 6 : (currentTheater.chokePoints.length || 4);

  let fixedCorridorsCount = 0;
  let totalSavedVillages = 0;

  currentTheater.chokePoints.forEach((cp) => {
    const tool = interventions[cp.id] || 'none';
    if (tool !== 'none') {
      fixedCorridorsCount++;
      totalSavedVillages += cp.trapped_villages_count;
    }
  });

  const dynamicBottlenecksCritical = Math.max(0, baseCriticalChokes - fixedCorridorsCount);

  // 2. Trapped villages: 74 initially in 4x4 -> jumps to 92 in 16T mode (+18 villages)
  const rawTrapped = currentTheater.chokePoints.reduce(
    (acc, cp) => acc + (cp.trapped_villages_count || 0),
    0
  );
  const baseTrappedVillages = isHeavy ? rawTrapped + 18 : rawTrapped;
  const dynamicTrappedLeft = Math.max(0, baseTrappedVillages - totalSavedVillages);

  // 3. Influx (Hospital Overload): Count of hospitals >130% capacity (4 Critical initially -> drops to 2 -> 0)
  const isSilchar = currentTheater.id === 'silchar';
  const jtTool = interventions['jt_road'] || 'none';
  const hariTool = interventions['harinagar'] || 'none';
  const korTool = interventions['korkoli_causeway'] || 'none';
  const borTool = interventions['borkhola_link'] || 'none';

  let overloadedHospitalsCount = 0;
  let relievedClinics = 0;

  if (isSilchar) {
    let valleySurge = 191;
    if (jtTool !== 'none' && hariTool !== 'none') {
      valleySurge = 100;
    } else if (jtTool !== 'none') {
      valleySurge = 135;
    } else if (hariTool !== 'none') {
      valleySurge = 125;
    }

    const nightingaleSurge = jtTool !== 'none' ? 100 : 142;
    const southCitySurge = korTool !== 'none' ? 100 : 181;
    const smchSurge = borTool !== 'none' ? 100 : 165;

    if (valleySurge > 130) overloadedHospitalsCount++;
    if (nightingaleSurge > 130) overloadedHospitalsCount++;
    if (southCitySurge > 130) overloadedHospitalsCount++;
    if (smchSurge > 130) overloadedHospitalsCount++;

    relievedClinics = 4 - overloadedHospitalsCount;
  } else {
    overloadedHospitalsCount = Math.max(0, 4 - fixedCorridorsCount);
    relievedClinics = fixedCorridorsCount;
  }

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
    <header className="fixed top-0 left-0 right-0 h-14 min-h-14 max-h-14 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 px-3 flex items-center justify-between gap-2 shadow-xl select-none flex-nowrap">
      {/* Left Zone (shrink-0 flex items-center gap-2): Logo + Theater Dropdown + Live Search */}
      <div className="shrink-0 flex items-center gap-2">
        {/* App Logo */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center shadow-md text-cyan-400 shrink-0">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="flex items-center gap-1">
            <h1 className="text-xs sm:text-sm font-extrabold text-white tracking-tight flex items-center gap-1 leading-none">
              Lifeline OS
            </h1>
            <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-blue-950 text-blue-400 border border-blue-800 uppercase hidden sm:inline">
              Defense GIS
            </span>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-800 hidden md:block" />

        {/* Compact Theater Dropdown (w-48 truncate) */}
        <div className="flex items-center gap-1 shrink-0">
          <Globe className="w-3 h-3 text-blue-400 shrink-0" />
          <select
            value={activeTheaterId}
            onChange={(e) => onSelectTheater(e.target.value)}
            className="w-40 sm:w-48 truncate bg-slate-900 text-white border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-semibold cursor-pointer focus:outline-none focus:border-cyan-500"
            title="Switch Operational Disaster Theater"
          >
            <option value="silchar">Silchar, Assam (Barak)</option>
            <option value="nepal">Gorkha, Nepal (Budhi Gandaki)</option>
            <option value="wayanad">Wayanad, Kerala (Chaliyar)</option>
            {customTheater && <option value="custom">{customTheater.name}</option>}
          </select>
        </div>

        {/* Compact Live City Search Input (w-44) */}
        <div ref={dropdownRef} className="relative hidden lg:block w-36 sm:w-44">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1">
            <div className="relative w-full">
              <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                placeholder="Search city/river..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-6 pr-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            {isSearching && (
              <div className="text-[10px] text-cyan-400 flex items-center gap-1 font-mono shrink-0">
                <Loader2 className="w-3 h-3 animate-spin" />
              </div>
            )}
          </form>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800 max-h-52 overflow-y-auto">
              {suggestions.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="w-full px-2.5 py-1.5 text-left hover:bg-slate-800 transition-colors flex items-center justify-between gap-1.5 text-xs text-slate-200 cursor-pointer"
                >
                  <div className="truncate flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="font-semibold text-white truncate text-[11px] font-mono">
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

      {/* Center Zone: Compact Unified Telemetry Strip (hidden xl:flex items-center gap-1.5) */}
      <div className="hidden xl:flex items-center gap-1.5 shrink-0">
        {/* 1. Chokes */}
        <div className="text-[11px] px-2 py-1 rounded bg-slate-900 border border-slate-800 whitespace-nowrap font-mono flex items-center gap-1 text-slate-300">
          <span>🌉</span>
          <span className="text-slate-400">Chokes:</span>
          <strong className={dynamicBottlenecksCritical > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
            {dynamicBottlenecksCritical}
          </strong>
        </div>

        {/* 2. Trapped & Reconnected */}
        <div className="text-[11px] px-2 py-1 rounded bg-slate-900 border border-slate-800 whitespace-nowrap font-mono flex items-center gap-1 text-slate-300">
          <span>🏘️</span>
          <span className="text-slate-400">Trapped:</span>
          <strong className={dynamicTrappedLeft === 0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
            {dynamicTrappedLeft}
          </strong>
          <span className="text-emerald-400 font-semibold text-[10px]">
            (✅ {totalSavedVillages})
          </span>
        </div>

        {/* 3. ER Surge & Golden Hour */}
        <div className="text-[11px] px-2 py-1 rounded bg-slate-900 border border-slate-800 whitespace-nowrap font-mono flex items-center gap-1 text-slate-300">
          <span>🏥</span>
          <span className="text-slate-400">ER Surge:</span>
          <strong className={overloadedHospitalsCount > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
            {overloadedHospitalsCount} Critical
          </strong>
          <span className="text-slate-600">|</span>
          <span>⏱️</span>
          <span className={dynamicTrappedLeft > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
            {dynamicTrappedLeft > 0 ? (isHeavy ? '95m' : '65m') : (isHeavy ? '35m' : '22m')}
          </span>
        </div>
      </div>

      {/* Right Zone (shrink-0 flex items-center gap-1.5 — NEVER HIDDEN OR PUSHED OFF-SCREEN!) */}
      <div className="shrink-0 flex items-center gap-1.5">
        {/* 1. Vehicle Toggle: [ 🚑 4x4 | 🚛 16T ] */}
        <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs font-mono shrink-0">
          <button
            onClick={() => onFleetChange('Light Emergency (Ambulance/4x4)')}
            className={`px-2 py-1 rounded font-semibold text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
              !isHeavy
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="4x4 Ambulance Mode (183 Roads, 4 Critical)"
          >
            <span>🚑 4x4</span>
          </button>
          <div className="relative">
            <button
              onClick={() => onFleetChange('Heavy Supply (Truck/Bus)')}
              className={`px-2 py-1 rounded font-semibold text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                isHeavy
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              } ${
                interactiveTourTask === 2
                  ? 'ring-2 ring-emerald-400 shadow-[0_0_15px_#10b981] animate-pulse bg-emerald-950 text-emerald-300'
                  : ''
              }`}
              title="16T Heavy Truck Mode (IRC:6 Weight Limit — 246 Roads, 6 Critical)"
            >
              <span>🚛 16T</span>
            </button>
            {interactiveTourTask === 2 && (
              <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 z-50 bg-emerald-400 text-slate-950 font-mono font-bold text-[9px] px-2 py-0.5 rounded-full shadow-[0_0_12px_#10b981] whitespace-nowrap animate-bounce flex items-center gap-1">
                <span>👆 CLICK 16T</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Prominent Emerald Button: [ 🎯 Guided Tour ] */}
        {(onStartInteractiveTour || onStartTour) && (
          <button
            onClick={onStartInteractiveTour || onStartTour}
            className={`bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs shadow-lg shrink-0 flex items-center gap-1.5 cursor-pointer transition-all ${
              isInteractiveTourActive ? 'ring-2 ring-white shadow-[0_0_15px_#10b981]' : ''
            }`}
            title="Hands-on interactive guided tour walking through all 5 steps"
          >
            <Target className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-mono">Guided Tour</span>
            <span className="sm:hidden font-mono">Tour</span>
          </button>
        )}

        {/* 3. Prominent Cyan Button: [ ▶️ Auto-Demo ] */}
        {onStartAutoDemo && (
          <button
            onClick={onStartAutoDemo}
            className={`bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs shadow-lg shrink-0 flex items-center gap-1.5 cursor-pointer transition-all ${
              isAutoDemoActive ? 'ring-2 ring-white shadow-[0_0_15px_#06b6d4]' : ''
            }`}
            title="100% hands-free autonomous presentation with speech narration"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline font-mono">Auto-Demo</span>
            <span className="sm:hidden font-mono">Demo</span>
          </button>
        )}

        {/* 4. Cloud Stack Icon Button: [ ☁️ Stack ] */}
        {onOpenCloudArchitecture && (
          <button
            onClick={onOpenCloudArchitecture}
            className="bg-blue-950/80 hover:bg-blue-900 text-cyan-300 border border-cyan-500/60 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-all shadow-sm"
            title="Inspect 4-Tier Cloud Run, Firestore, and Gemini MCP Architecture"
          >
            <Cloud className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Stack</span>
          </button>
        )}

        {/* Day / Night Ops Mode Toggle */}
        {onToggleOpsMode && (
          <button
            onClick={onToggleOpsMode}
            className={`p-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border shrink-0 ${
              opsMode === 'night'
                ? 'bg-indigo-950 text-indigo-300 border-indigo-500'
                : 'bg-amber-950/60 hover:bg-amber-900 text-amber-300 border-amber-600/70'
            }`}
            title={opsMode === 'night' ? 'Night Operations Active' : 'Day Operations Active'}
          >
            {opsMode === 'night' ? (
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>
        )}

        {/* Telemetry Button */}
        <button
          onClick={onOpenTelemetry}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs cursor-pointer font-mono shrink-0"
          title="Spatial Graph Telemetry"
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
        </button>
      </div>
    </header>
  );
};
