import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Search,
  Loader2,
  MapPin,
  Globe,
  Sun,
  Moon,
  Wind,
  Target,
  Play,
  Layers,
  ChevronDown,
  Activity,
  AlertTriangle,
  Map,
  Satellite,
  Mountain,
  Cloud,
  HelpCircle,
  Sliders,
} from 'lucide-react';
import { FleetMode } from '../types';
import { THEATERS, TheaterData, createCustomTheater, InterventionType } from '../data/theaters';
import { geocodingService, GeocodingResult } from '../services/geocodingService';
import { auditService } from '../services/auditService';

interface HeaderProps {
  currentTheater: TheaterData;
  interventions: Record<string, InterventionType>;
  fleetMode: FleetMode;
  onFleetChange: (mode: FleetMode) => void;
  statusFilter?: string;
  onFilterChange?: (filter: string) => void;
  onOpenTelemetry: () => void;
  activeTheaterId: string;
  onSelectTheater: (theaterId: string) => void;
  customTheater: TheaterData | null;
  onLoadCustomTheater: (theater: TheaterData) => void;
  onSearchFocus?: (coords: [number, number]) => void;
  onNavigateStep?: (step: string) => void;
  onStartInteractiveTour?: () => void;
  onStartAutoDemo?: () => void;
  isInteractiveTourActive?: boolean;
  isAutoDemoActive?: boolean;
  opsMode?: 'day' | 'night';
  onToggleOpsMode?: () => void;
  onOpenEcosystemBus?: () => void;
  liveWindSpeed?: number;
  isSimulatedHighWind?: boolean;
  viewMode?: 'map' | 'satellite' | '3d';
  onToggleViewMode?: () => void;
  onSelectViewMode?: (mode: 'map' | 'satellite' | '3d') => void;
  onRunResponseSimulation?: () => void;
  isSimulationRunning?: boolean;
  simulationProgress?: string;
  onOpenCloudArchitecture?: () => void;
  onOpenWhatWeDontKnow?: () => void;
  onToggleAccessView?: () => void;
  isAccessViewOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTheater,
  interventions,
  fleetMode,
  onFleetChange,
  onOpenTelemetry,
  activeTheaterId,
  onSelectTheater,
  customTheater,
  onLoadCustomTheater,
  onSearchFocus,
  onNavigateStep,
  onStartInteractiveTour,
  onStartAutoDemo,
  isInteractiveTourActive = false,
  isAutoDemoActive = false,
  opsMode = 'day',
  onToggleOpsMode,
  onOpenEcosystemBus,
  liveWindSpeed = 14.2,
  isSimulatedHighWind = false,
  viewMode = 'map',
  onToggleViewMode,
  onSelectViewMode,
  onRunResponseSimulation,
  isSimulationRunning = false,
  simulationProgress = '',
  onOpenCloudArchitecture,
  onOpenWhatWeDontKnow,
  onToggleAccessView,
  isAccessViewOpen = false,
}) => {
  const [cityQuery, setCityQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [showIncidentSummary, setShowIncidentSummary] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Compute concise status metrics
  let fixedCount = 0;
  let totalSavedVillages = 0;
  currentTheater.chokePoints.forEach((cp) => {
    const tool = interventions[cp.id] || 'none';
    if (tool !== 'none') {
      fixedCount++;
      totalSavedVillages += cp.trapped_villages_count;
    }
  });
  const criticalChokesRemaining = Math.max(0, currentTheater.chokePoints.length - fixedCount);
  const totalVillages = currentTheater.chokePoints.reduce((acc, cp) => acc + (cp.trapped_villages_count || 0), 0);
  const villagesLeft = Math.max(0, totalVillages - totalSavedVillages);

  // Debounced search with geocodingService
  useEffect(() => {
    const trimmed = cityQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await geocodingService.search(trimmed);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (err) {
        console.warn('Autocomplete fetch failed:', err);
      }
    }, 280);

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

    // Canonical built-in theater fast-path: preserve 100% verified clinical, OSM, and flood data
    const queryLower = displayName.toLowerCase();
    if (
      queryLower.includes('silchar') ||
      queryLower.includes('cachar') ||
      queryLower.includes('barak') ||
      Math.hypot(lat - 24.8333, lon - 92.7789) < 0.2
    ) {
      onSelectTheater('silchar');
      onSearchFocus?.([24.8333, 92.7789]);
      setIsSearching(false);
      onNavigateStep?.('chapter2_predict');
      return;
    }
    if (
      queryLower.includes('nepal') ||
      queryLower.includes('gorkha') ||
      queryLower.includes('kathmandu') ||
      Math.hypot(lat - 28.0, lon - 84.6) < 0.4
    ) {
      onSelectTheater('nepal');
      onSearchFocus?.([28.0, 84.6]);
      setIsSearching(false);
      onNavigateStep?.('chapter2_predict');
      return;
    }
    if (
      queryLower.includes('wayanad') ||
      queryLower.includes('meppadi') ||
      queryLower.includes('kerala') ||
      Math.hypot(lat - 11.55, lon - 76.13) < 0.4
    ) {
      onSelectTheater('wayanad');
      onSearchFocus?.([11.55, 76.13]);
      setIsSearching(false);
      onNavigateStep?.('chapter2_predict');
      return;
    }

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
    setIsSearching(false);
    onNavigateStep?.('chapter2_predict');

    auditService.recordAction({
      action_type: 'GEOGRAPHIC_SEARCH',
      user_role: 'INCIDENT_COMMANDER',
      user_id: 'Incident Commander',
      rationale: `Resolved query "${displayName}" (${lat.toFixed(4)}, ${lon.toFixed(4)}) with ${overpassHospitals.length} hospitals and ${overpassBridges.length} bridges found.`,
      human_authorized: true,
    });
  };

  const handleSelectSuggestion = (item: GeocodingResult) => {
    setCityQuery(item.displayName.split(',')[0]);
    compileLocationAndLoad(
      item.coordinates[0],
      item.coordinates[1],
      item.displayName,
      item.adminHierarchy.country,
      item.adminHierarchy.state
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
    try {
      const results = await geocodingService.search(cityQuery.trim());
      if (results && results.length > 0) {
        handleSelectSuggestion(results[0]);
      }
    } catch {
      setIsSearching(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 min-h-14 max-h-14 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 px-3 sm:px-4 flex items-center justify-between gap-3 shadow-xl select-none">
      {/* Left Zone: Product Identity + Current Incident */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-cyan-400 shadow-md">
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-extrabold text-white tracking-tight">Lifeline OS</h1>
            <span className="text-slate-500 font-light">/</span>
            <div className="relative flex items-center">
              <select
                value={activeTheaterId}
                onChange={(e) => onSelectTheater(e.target.value)}
                className="bg-slate-900/90 hover:bg-slate-800 text-cyan-300 hover:text-white font-bold text-xs cursor-pointer border border-slate-700 hover:border-cyan-500 rounded-lg pl-2.5 pr-6 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all shadow-inner appearance-none"
                title="Select active disaster incident scenario workspace"
              >
                <option value="silchar" className="bg-slate-950 text-white font-semibold">🇮🇳 Assam: Silchar / Cachar (Flood & Healthcare Access)</option>
                <option value="nepal" className="bg-slate-950 text-white font-semibold">🇳🇵 Nepal: Roshi Khola / BP Highway (Terrain & Damage)</option>
                <option value="wayanad" className="bg-slate-950 text-white font-semibold">🇮🇳 Wayanad: Meppadi (Landslide Debris Flow)</option>
                {customTheater && <option value="custom" className="bg-slate-950 text-white font-semibold">{customTheater.name}</option>}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-cyan-400 absolute right-2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Center Zone: Search Any Place Input */}
      <div ref={dropdownRef} className="relative flex-1 max-w-md hidden sm:block">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={cityQuery}
            onChange={(e) => setCityQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            placeholder="Search place, district, or coordinates (lat, lon)..."
            className="w-full bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
          />
          {isSearching && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
          )}
        </form>

        {/* Suggestions Popover */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800 max-h-56 overflow-y-auto">
            {suggestions.map((item, index) => (
              <button
                key={item.id || index}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full px-3 py-2 text-left hover:bg-slate-800 transition-colors flex items-center justify-between gap-2 text-xs text-slate-200 cursor-pointer"
              >
                <div className="truncate flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="font-semibold text-white truncate text-xs font-mono">
                    {item.displayName.split(',')[0]}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">
                    {item.displayName.split(',').slice(1, 3).join(',')}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-cyan-400 shrink-0 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                  {item.coordinates[0].toFixed(2)}, {item.coordinates[1].toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Zone: Simulation Button + 2D/3D Toggle + Mode Pill + Concise Status */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Prominent Run Response Simulation Action (Section 1 Brief Requirement) */}
        {onRunResponseSimulation && (
          <button
            type="button"
            onClick={onRunResponseSimulation}
            disabled={isSimulationRunning}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
              isSimulationRunning
                ? 'bg-amber-950/80 border-amber-600 text-amber-300 animate-pulse'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
            }`}
            title="Run 10-second response simulation: Disruption -> Consequence -> Decision"
          >
            <Play className={`w-3.5 h-3.5 ${isSimulationRunning ? 'animate-spin' : 'fill-white'}`} />
            <span>{isSimulationRunning ? (simulationProgress || 'Simulating...') : 'Run Simulation'}</span>
          </button>
        )}

        {/* 3-Way Tactical View Switcher: Map, Satellite, 3D Terrain */}
        <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl p-0.5 shadow-md">
          <button
            type="button"
            onClick={() => onSelectViewMode ? onSelectViewMode('map') : onToggleViewMode?.()}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'map'
                ? 'bg-slate-800 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Tactical Dark Map View (High-contrast vector roads & flood overlays)"
          >
            <Map className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Map</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectViewMode ? onSelectViewMode('satellite') : onToggleViewMode?.()}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'satellite'
                ? 'bg-slate-800 text-emerald-300 border border-emerald-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Satellite View (Esri World Imagery + verified flood overlays)"
          >
            <Satellite className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Satellite</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectViewMode ? onSelectViewMode('3d') : onToggleViewMode?.()}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === '3d'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="3D Terrain Replay (NASA SRTM 30m Elevation Topography)"
          >
            <Mountain className="w-3.5 h-3.5 text-cyan-400" />
            <span>3D</span>
          </button>
        </div>

        {/* Mode Pill Badge */}
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 tracking-wider uppercase">
          SIMULATION
        </span>

        {/* One Concise Evidence / Status Indicator */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowIncidentSummary(!showIncidentSummary)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              criticalChokesRemaining > 0
                ? 'bg-rose-950/70 border-rose-700 text-rose-300 hover:bg-rose-900/80'
                : 'bg-emerald-950/70 border-emerald-700 text-emerald-300 hover:bg-emerald-900/80'
            }`}
            title="Click to view concise incident status summary"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${criticalChokesRemaining > 0 ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`} />
            <span>
              {criticalChokesRemaining > 0 ? `${criticalChokesRemaining} Severed` : 'All Reconnected'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Expanded Concise Summary Popover */}
          {showIncidentSummary && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl z-50 text-xs space-y-2 animate-in fade-in select-none">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-bold text-white">Incident Status</span>
                <span className="text-[10px] font-mono text-slate-400">{currentTheater.name}</span>
              </div>
              <div className="space-y-1 text-slate-300 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span>Severed Corridors:</span>
                  <strong className={criticalChokesRemaining > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                    {criticalChokesRemaining} / {currentTheater.chokePoints.length}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Trapped Habitations:</span>
                  <strong className={villagesLeft > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                    {villagesLeft} Villages
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Fleet Axle Limit:</span>
                  <strong className="text-white">{fleetMode.includes('16T') ? '16T (Heavy)' : '4x4 (Light)'}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onFleetChange(fleetMode.includes('16T') ? 'Light Emergency (Ambulance/4x4)' : 'Heavy Supply (Truck/Bus)');
                  setShowIncidentSummary(false);
                }}
                className="w-full py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-[10px] text-center cursor-pointer border border-slate-700 transition-colors"
              >
                Switch to {fleetMode.includes('16T') ? '4x4 Mode' : '16T Mode'}
              </button>
            </div>
          )}
        </div>

        {/* Compact Weather Pill (Opens Full Telemetry on Demand) */}
        <button
          type="button"
          onClick={onOpenTelemetry}
          className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-colors"
          title="Open live meteorological & telemetry details"
        >
          <Wind className="w-3.5 h-3.5 text-cyan-400" />
          <span>{isSimulatedHighWind ? '52 km/h' : `${liveWindSpeed.toFixed(0)} km/h`}</span>
        </button>

        {/* Day / Night Mode */}
        {onToggleOpsMode && (
          <button
            type="button"
            onClick={onToggleOpsMode}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs cursor-pointer transition-colors"
            title={opsMode === 'night' ? 'Night Ops (Marine boats restricted)' : 'Day Ops (Full visibility)'}
          >
            {opsMode === 'night' ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
          </button>
        )}

        {/* GCP Cloud Architecture Inspector */}
        {onOpenCloudArchitecture && (
          <button
            type="button"
            onClick={onOpenCloudArchitecture}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-blue-500/50 text-blue-400 hover:text-white text-xs cursor-pointer transition-colors shadow-sm"
            title="Inspect Google Cloud & Gemini MCP Architecture"
          >
            <Cloud className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Baseline vs Scenario Access Slider Toggle */}
        {onToggleAccessView && (
          <button
            type="button"
            onClick={onToggleAccessView}
            className={`px-2 py-1 rounded-lg border text-xs font-mono font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
              isAccessViewOpen
                ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-300'
            }`}
            title="Toggle Baseline vs Simulated Closure access view (319 settlements slider)"
          >
            <Sliders className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden xl:inline">319 Access</span>
          </button>
        )}

        {/* What We Don't Know (Epistemic Disclosures) */}
        {onOpenWhatWeDontKnow && (
          <button
            type="button"
            onClick={onOpenWhatWeDontKnow}
            className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-600/60 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            title="What We Don't Know • Honest identification of telemetry gaps and assumptions"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">Unknowns</span>
          </button>
        )}

        {/* Tour / Demo Shortcut */}
        {onStartInteractiveTour && (
          <button
            type="button"
            onClick={onStartInteractiveTour}
            className={`p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border text-xs cursor-pointer transition-colors flex items-center gap-1 ${
              isInteractiveTourActive ? 'border-emerald-500 text-emerald-400' : 'border-slate-700/80 text-slate-300'
            }`}
            title="Start Interactive Guided Tour"
          >
            <Target className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
};
