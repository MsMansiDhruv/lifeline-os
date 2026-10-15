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
    <header className="fixed top-0 left-0 right-0 h-16 min-h-16 max-h-16 z-30 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between gap-2.5 shadow-xl select-none overflow-x-auto scrollbar-none flex-nowrap">
      {/* Left Section: Logo, Title, Theater Switcher & Search Bar */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Logo & Title */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center shadow-md text-cyan-400 shrink-0">
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5 leading-none">
              Lifeline OS
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-950 text-blue-400 border border-blue-800 uppercase">
                Defense GIS
              </span>
            </h1>
            <p className="text-[9px] text-slate-400 truncate max-w-[150px] font-mono leading-tight mt-0.5">
              {currentTheater.authorityShortName || 'Civil Defense'}
            </p>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-800 hidden md:block" />

        {/* Theater Dropdown (No Cartoon Emojis) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Globe className="w-3.5 h-3.5 text-blue-400" />
          <select
            value={activeTheaterId}
            onChange={(e) => onSelectTheater(e.target.value)}
            className="bg-slate-900 text-white border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-semibold cursor-pointer focus:outline-none focus:border-blue-500"
          >
            <option value="silchar">Silchar, Assam (Barak River)</option>
            <option value="nepal">Gorkha, Nepal (Budhi Gandaki)</option>
            <option value="wayanad">Wayanad, Kerala (Chaliyar Basin)</option>
            {customTheater && <option value="custom">{customTheater.name}</option>}
          </select>
        </div>

        {/* Real-Time Location Search with Autocomplete */}
        <div ref={dropdownRef} className="relative hidden xl:block min-w-[170px] max-w-xs">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1">
            <div className="relative flex-1">
              <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                placeholder="Search city/river..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
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

      {/* Middle & Right Section: Compact KPI Pills & Interactive Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* KPI Pill 1: Bottlenecks (Dynamic Critical / Total) */}
        <div className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 shadow-sm shrink-0">
          <ShieldAlert className={`w-3.5 h-3.5 ${dynamicBottlenecksCritical > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
          <span className="text-slate-400 hidden sm:inline">Bottlenecks:</span>
          <strong className={dynamicBottlenecksCritical > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
            {dynamicBottlenecksCritical} Critical
          </strong>
          <span className="text-slate-500 text-[10px]">/ {baseTotalRoads} {isHeavy ? '(+63 Axle)' : 'Total'}</span>
        </div>

        {/* KPI Pill 2: Villages Trapped & Saved across ALL corridors */}
        <div className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 shadow-sm shrink-0">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 hidden sm:inline">Trapped:</span>
          <strong className={dynamicTrappedLeft === 0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
            {dynamicTrappedLeft === 0 ? '0 Left' : `${dynamicTrappedLeft} Left`}
          </strong>
          {totalSavedVillages > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-300 font-bold bg-emerald-950/90 px-1.5 py-0.2 rounded border border-emerald-600 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              {totalSavedVillages} Reconnected
            </span>
          )}
        </div>

        {/* KPI Pill 3: Influx (Hospital Overload >130% Capacity) */}
        <div className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-xs font-mono hidden md:flex items-center gap-1.5 shadow-sm shrink-0">
          <Activity className={`w-3.5 h-3.5 ${overloadedHospitalsCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
          <span className="text-slate-400">Influx:</span>
          <strong className={overloadedHospitalsCount === 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
            {overloadedHospitalsCount > 0 ? `${overloadedHospitalsCount} Critical` : '0 Critical'}
          </strong>
          {relievedClinics > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-700">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              {relievedClinics} Relieved
            </span>
          )}
        </div>

        {/* KPI Pill 4: Golden Hour Trauma / Heavy Supply Access (NDMA Standard) */}
        <div className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-xs font-mono hidden lg:flex items-center gap-1.5 shadow-sm shrink-0">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Access:</span>
          {dynamicTrappedLeft > 0 ? (
            <span className="text-rose-400 font-bold flex items-center gap-1 text-[11px]">
              ❌ {isHeavy ? '95 Mins (IRC Detour)' : '65 Mins (Trauma Delay)'}
            </span>
          ) : (
            <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
              ✅ {isHeavy ? '35 Mins (16T Restored)' : '22 Mins (Golden Hour)'}
            </span>
          )}
        </div>

        {/* Day / Night Disaster Ops Mode Toggle */}
        {onToggleOpsMode && (
          <button
            onClick={onToggleOpsMode}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer border shrink-0 ${
              opsMode === 'night'
                ? 'bg-indigo-950 text-indigo-300 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                : 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border-amber-600/70'
            }`}
            title={
              opsMode === 'night'
                ? 'Night Operations: Boat Ferries Grounded due to zero river visibility; FLIR Thermal Drones & 24x7 Health Booths active'
                : 'Day Operations: All surface routes, boat ferries, and air assets authorized'
            }
          >
            {opsMode === 'night' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">🌙 Night</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">☀️ Day</span>
              </>
            )}
          </button>
        )}

        {/* Fleet Mode Selector Toggle (4x4 Ambulance vs 16T Truck) */}
        <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs font-mono shrink-0">
          <button
            onClick={() => onFleetChange('Light Emergency (Ambulance/4x4)')}
            className={`px-2 py-0.5 rounded font-semibold text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
              !isHeavy
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Light Vehicle Axle (Ambulance/4x4) — 183 Total Roads, 4 Critical"
          >
            <Truck className="w-3 h-3" />
            <span>4x4</span>
          </button>
          <div className="relative">
            <button
              onClick={() => onFleetChange('Heavy Supply (Truck/Bus)')}
              className={`px-2 py-0.5 rounded font-semibold text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                isHeavy
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              } ${
                interactiveTourTask === 2
                  ? 'ring-4 ring-emerald-400 shadow-[0_0_20px_#10b981] animate-pulse bg-emerald-950 text-emerald-300'
                  : ''
              }`}
              title="16T Heavy Truck Axle (IRC:6 Weight Limit) — 246 Total Roads, 6 Critical"
            >
              <Truck className="w-3 h-3" />
              <span>16T</span>
            </button>
            {interactiveTourTask === 2 && (
              <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 z-50 bg-emerald-400 text-slate-950 font-mono font-bold text-[9px] px-2 py-0.5 rounded-full shadow-[0_0_12px_#10b981] whitespace-nowrap animate-bounce flex items-center gap-1">
                <span>👆 CLICK 16T TRUCK</span>
              </div>
            )}
          </div>
        </div>

        {/* Button A: [ 🎯 Interactive Tour ] */}
        {(onStartInteractiveTour || onStartTour) && (
          <button
            onClick={onStartInteractiveTour || onStartTour}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer border shrink-0 ${
              isInteractiveTourActive
                ? 'bg-emerald-600 text-slate-950 border-emerald-400 shadow-[0_0_15px_#10b981]'
                : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-600/80 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
            }`}
            title="Hands-on interactive coaching where you click highlighted buttons"
          >
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Interactive Tour</span>
            <span className="sm:hidden">Tour</span>
          </button>
        )}

        {/* Button B: [ ▶️ Run Auto-Demo ] */}
        {onStartAutoDemo && (
          <button
            onClick={onStartAutoDemo}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer border shrink-0 ${
              isAutoDemoActive
                ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_15px_#06b6d4]'
                : 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border-cyan-600/80 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
            }`}
            title="100% hands-free self-playing presentation with Teleprompter & Voice"
          >
            <Play className="w-3.5 h-3.5 fill-current text-cyan-400" />
            <span className="hidden sm:inline">Run Auto-Demo</span>
            <span className="sm:hidden">Demo</span>
          </button>
        )}

        {/* Telemetry Button */}
        <button
          onClick={onOpenTelemetry}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[11px] cursor-pointer font-mono shrink-0"
          title="Spatial Graph Telemetry (EPSG:32646)"
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
        </button>
      </div>
    </header>
  );
};
