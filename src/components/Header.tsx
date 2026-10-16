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
  onSearchFocus?: (coords: [number, number]) => void;
  tourStep?: number;
  onStartTour?: () => void;
  onStartInteractiveTour?: () => void;
  onStartAutoDemo?: () => void;
  isInteractiveTourActive?: boolean;
  isAutoDemoActive?: boolean;
  interactiveTourTask?: number;
  opsMode?: 'day' | 'night';
  onToggleOpsMode?: () => void;
  onPreemptiveAlertClick?: () => void;
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
  onSearchFocus,
  tourStep = 0,
  onStartTour,
  onStartInteractiveTour,
  onStartAutoDemo,
  isInteractiveTourActive = false,
  isAutoDemoActive = false,
  interactiveTourTask = 0,
  opsMode = 'day',
  onToggleOpsMode,
  onPreemptiveAlertClick,
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
    onSearchFocus?.([lat, lon]);
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
        {/* Live Preemptive Alert Pill */}
        <button
          type="button"
          onClick={onPreemptiveAlertClick}
          className="text-xs px-2.5 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-600/80 hover:border-cyan-400 whitespace-nowrap font-medium flex items-center gap-2 text-amber-200 cursor-pointer transition-all shadow-sm group"
          title="⚠️ PREEMPTIVE TRIGGER: JT Road Deck (18.0m ASL) will submerge in 6h at current +0.4m/hr rise — Click to Auto-Focus & Pre-Stage"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
          <span className="font-bold text-xs text-amber-300">🚨 PREEMPTIVE ALERT:</span>
          <span className="text-slate-200 truncate max-w-[200px] text-xs group-hover:text-cyan-300">
            JT Road Deck -0.8m Submerging
          </span>
          <span className="text-xs text-cyan-400 font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-cyan-800 hidden 2xl:inline">
            FOCUS
          </span>
        </button>

        {/* 1. Chokes */}
        <div className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 whitespace-nowrap flex items-center gap-1.5 text-slate-300">
          <span>🌉</span>
          <span className="text-slate-400">Chokes:</span>
          <strong className={dynamicBottlenecksCritical > 0 ? 'text-rose-400 font-bold text-sm' : 'text-emerald-400 font-bold text-sm'}>
            {dynamicBottlenecksCritical}
          </strong>
        </div>

        {/* 2. Trapped & Reconnected */}
        <div className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 whitespace-nowrap flex items-center gap-1.5 text-slate-300">
          <span>🏘️</span>
          <span className="text-slate-400">Trapped:</span>
          <strong className={dynamicTrappedLeft === 0 ? 'text-emerald-400 font-bold text-sm' : 'text-amber-400 font-bold text-sm'}>
            {dynamicTrappedLeft}
          </strong>
          <span className="text-emerald-400 font-semibold text-xs">
            (✅ {totalSavedVillages})
          </span>
        </div>

        {/* 3. ER Surge & Golden Hour */}
        <div className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 whitespace-nowrap flex items-center gap-1.5 text-slate-300">
          <span>🏥</span>
          <span className="text-slate-400">ER Surge:</span>
          <strong className={overloadedHospitalsCount > 0 ? 'text-rose-400 font-bold text-sm' : 'text-emerald-400 font-bold text-sm'}>
            {overloadedHospitalsCount} Critical
          </strong>
          <span className="text-slate-600">|</span>
          <span>⏱️</span>
          <span className={dynamicTrappedLeft > 0 ? 'text-rose-400 font-bold text-sm' : 'text-emerald-400 font-bold text-sm'}>
            {dynamicTrappedLeft > 0 ? (isHeavy ? '95m' : '65m') : (isHeavy ? '35m' : '22m')}
          </span>
        </div>
      </div>

      {/* Right Zone (shrink-0 flex items-center gap-1.5 — NEVER HIDDEN OR PUSHED OFF-SCREEN!) */}
      <div className="shrink-0 flex items-center gap-1.5">
        {/* 1. Vehicle Toggle: [ 4x4 Light Response | 16T Heavy Supply ] */}
        <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs font-mono shrink-0">
          <button
            onClick={() => onFleetChange('Light Emergency (Ambulance/4x4)')}
            className={`px-2 py-1 rounded font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
              !isHeavy
                ? 'bg-cyan-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="4x4 Light Response Mode (Ambulances / 4x4 SUVs — 183 Roads, 4 Critical)"
          >
            {/* 4x4 Light Response SVG */}
            <svg
              className={`w-3.5 h-3.5 shrink-0 ${!isHeavy ? 'text-white' : 'text-cyan-400'}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <path d="M9 17h6" />
              <circle cx="17" cy="17" r="2" />
              <path d="M7 11h4" />
              <path d="M9 9v4" />
            </svg>
            <span>4x4</span>
            <span className="text-[9px] text-cyan-200 hidden 2xl:inline font-normal">(3.2T)</span>
          </button>
          <div className="relative">
            <button
              onClick={() => onFleetChange('Heavy Supply (Truck/Bus)')}
              className={`px-2 py-1 rounded font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                isHeavy
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              } ${
                interactiveTourTask === 2
                  ? 'ring-2 ring-emerald-400 shadow-[0_0_15px_#10b981] animate-pulse bg-emerald-950 text-emerald-300'
                  : ''
              }`}
              title="16T Heavy Supply Mode (6-Wheel Articulated Freight Truck — IRC:6 Axle Limit: 246 Roads, 6 Critical)"
            >
              {/* 16T Heavy Freight Truck SVG */}
              <svg
                className={`w-3.5 h-3.5 shrink-0 ${isHeavy ? 'text-white' : 'text-amber-400'}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                <path d="M15 18H9" />
                <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62L19.4 9.6a1 1 0 0 0-.78-.4H14v8.8" />
                <circle cx="7" cy="18" r="2" />
                <circle cx="17" cy="18" r="2" />
                <circle cx="12" cy="18" r="1.5" />
              </svg>
              <span>16T</span>
              <span className="text-[9px] text-amber-200 hidden 2xl:inline font-normal">(IRC:6)</span>
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
            className={`bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-2.5 py-1.5 rounded-lg text-xs shadow-lg shrink-0 flex items-center gap-1.5 cursor-pointer transition-all ${
              isInteractiveTourActive ? 'ring-2 ring-white shadow-[0_0_15px_#10b981]' : ''
            }`}
            title="Hands-on interactive guided tour walking through all command phases"
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
            className={`bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-2.5 py-1.5 rounded-lg text-xs shadow-lg shrink-0 flex items-center gap-1.5 cursor-pointer transition-all ${
              isAutoDemoActive ? 'ring-2 ring-white shadow-[0_0_15px_#06b6d4]' : ''
            }`}
            title="Hands-free autonomous command presentation with voice briefing"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline font-mono">Auto-Demo</span>
            <span className="sm:hidden font-mono">Demo</span>
          </button>
        )}

        {/* 4. Day / Night Ops Mode Toggle */}
        {onToggleOpsMode && (
          <button
            onClick={onToggleOpsMode}
            className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border shrink-0 flex items-center gap-1.5 ${
              opsMode === 'night'
                ? 'bg-indigo-950 text-indigo-300 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                : 'bg-amber-950/70 hover:bg-amber-900 text-amber-300 border-amber-600/70'
            }`}
            title={
              opsMode === 'night'
                ? 'Night Operations Active: Marine Boats GROUNDED due to night current hazards'
                : 'Day Operations Active: Daylight visibility for all air, marine, and ground units'
            }
          >
            {opsMode === 'night' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden md:inline text-[10px]">Night Ops</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline text-[10px]">Day Ops</span>
              </>
            )}
          </button>
        )}

        {/* 5. Cloud Stack Icon Button */}
        {onOpenCloudArchitecture && (
          <button
            onClick={onOpenCloudArchitecture}
            className="bg-blue-950/80 hover:bg-blue-900 text-cyan-300 border border-cyan-500/60 px-2 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-all shadow-sm"
            title="Inspect 4-Tier Cloud Run, Firestore, and Gemini MCP Architecture"
          >
            <Cloud className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Stack</span>
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
