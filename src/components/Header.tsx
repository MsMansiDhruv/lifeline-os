import React, { useState, useRef } from 'react';
import {
  Shield,
  Search,
  Loader2,
  MapPin,
  Play,
  ChevronDown,
  Map,
  Satellite,
  MoreVertical,
  Compass,
  RotateCcw,
} from 'lucide-react';
import { FleetMode } from '../types';
import { TheaterData, InterventionType } from '../data/theaters';
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
  viewMode?: 'map' | 'satellite' | 'street' | '3d';
  onToggleViewMode?: () => void;
  onSelectViewMode?: (mode: 'map' | 'satellite' | 'street' | '3d') => void;
  onRunResponseSimulation?: () => void;
  isSimulationRunning?: boolean;
  simulationProgress?: string;
  onResetOverview?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTheater,
  activeTheaterId,
  onSelectTheater,
  customTheater,
  onLoadCustomTheater,
  onSearchFocus,
  onStartInteractiveTour,
  opsMode = 'day',
  onToggleOpsMode,
  viewMode = 'map',
  onToggleViewMode,
  onSelectViewMode,
  onRunResponseSimulation,
  isSimulationRunning = false,
  simulationProgress = '',
  onResetOverview,
}) => {
  const [cityQuery, setCityQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const compileLocationAndLoad = async (
    lat: number,
    lon: number,
    displayName: string,
    country: string,
    state: string
  ) => {
    setIsSearching(true);
    let overpassHospitals: Array<{ name: string; lat: number; lon: number }> = [];

    try {
      const overpassQuery = `
        [out:json][timeout:10];
        (
          node["amenity"="hospital"](around:20000, ${lat}, ${lon});
          way["amenity"="hospital"](around:20000, ${lat}, ${lon});
        );
        out center 10;
      `;
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
      const resp = await fetch(url);
      if (resp.ok) {
        const json = await resp.json();
        if (json.elements && Array.isArray(json.elements)) {
          json.elements.forEach((el: any) => {
            const elLat = el.lat || el.center?.lat;
            const elLon = el.lon || el.center?.lon;
            const name = el.tags?.name || 'Regional Medical Facility';
            if (elLat && elLon) {
              overpassHospitals.push({ name, lat: elLat, lon: elLon });
            }
          });
        }
      }
    } catch {
      // Continue with fallback
    } finally {
      setIsSearching(false);
      setShowSuggestions(false);
    }

    if (onSearchFocus) {
      onSearchFocus([lat, lon]);
    }

    auditService.recordAction({
      action_type: 'GEOGRAPHIC_SEARCH',
      user_role: 'INCIDENT_COMMANDER',
      user_id: 'Incident Commander',
      rationale: `Resolved query "${displayName}" (${lat.toFixed(4)}, ${lon.toFixed(4)}).`,
      human_authorized: true,
    });
  };

  const handleSelectSuggestion = (item: GeocodingResult) => {
    setCityQuery(item.displayName.split(',')[0]);
    compileLocationAndLoad(
      item.coordinates[0],
      item.coordinates[1],
      item.displayName,
      item.adminHierarchy.country || '',
      item.adminHierarchy.state || ''
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
      {/* 1. Identity & Scenario Selector */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-cyan-400 shadow-md">
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-extrabold text-white tracking-tight hidden sm:inline">Lifeline OS</h1>
            <span className="text-slate-500 font-light hidden sm:inline">/</span>
            <div className="relative flex items-center">
              <select
                value={activeTheaterId}
                onChange={(e) => onSelectTheater(e.target.value)}
                className="bg-slate-900/90 hover:bg-slate-800 text-cyan-300 hover:text-white font-bold text-xs cursor-pointer border border-slate-700 hover:border-cyan-500 rounded-lg pl-2.5 pr-6 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all shadow-inner appearance-none"
                title="Select active disaster incident scenario workspace"
              >
                <option value="silchar" className="bg-slate-950 text-white font-semibold">🇮🇳 Assam: Silchar / Cachar</option>
                <option value="nepal" className="bg-slate-950 text-white font-semibold">🇳🇵 Nepal: Roshi Khola / BP Highway</option>
                <option value="wayanad" className="bg-slate-950 text-white font-semibold">🇮🇳 Wayanad: Meppadi</option>
                {customTheater && <option value="custom" className="bg-slate-950 text-white font-semibold">{customTheater.name}</option>}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-cyan-400 absolute right-2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Full-Width Center Search Box */}
      <div ref={dropdownRef} className="relative flex-1 max-w-xl mx-2">
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

      {/* 3, 4, 5. Map Mode + Single Run Button + More Menu */}
      <div className="flex items-center gap-2 shrink-0">
        {/* 3. Map Mode Switcher (Map / Street / Satellite) */}
        <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl p-0.5 shadow-md">
          <button
            type="button"
            onClick={() => onSelectViewMode ? onSelectViewMode('map') : onToggleViewMode?.()}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
              viewMode === 'map'
                ? 'bg-slate-800 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Tactical Map View"
          >
            <Map className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Map</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectViewMode ? onSelectViewMode('satellite') : onToggleViewMode?.()}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
              viewMode === 'satellite'
                ? 'bg-slate-800 text-emerald-300 border border-emerald-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Satellite View"
          >
            <Satellite className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Satellite</span>
          </button>
        </div>

        {/* 4. Single Run Button: Run closure simulation */}
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
            title="Run closure simulation: Disruption -> Consequence -> Decision"
          >
            <Play className={`w-3.5 h-3.5 ${isSimulationRunning ? 'animate-spin' : 'fill-white'}`} />
            <span>{isSimulationRunning ? (simulationProgress || 'Simulating...') : 'Run closure simulation'}</span>
          </button>
        )}

        {/* 5. More Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMoreMenuOpen((prev) => !prev)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-700/80 hover:bg-slate-800 transition-colors cursor-pointer"
            title="More Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isMoreMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-50 text-xs font-mono text-slate-300 space-y-0.5 animate-in fade-in">
              {onResetOverview && (
                <button
                  type="button"
                  onClick={() => {
                    onResetOverview();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Reset Overview</span>
                </button>
              )}
              {onStartInteractiveTour && (
                <button
                  type="button"
                  onClick={() => {
                    onStartInteractiveTour();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>Interactive Tour</span>
                </button>
              )}
              {onToggleOpsMode && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleOpsMode();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer"
                >
                  <span>{opsMode === 'day' ? '🌙 Night Ops' : '☀️ Day Ops'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
