import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  Search,
  Loader2,
  MapPin,
  Play,
  ChevronDown,
  Map,
  Satellite,
  Navigation,
  Edit3,
  MoreVertical,
  RotateCcw,
  Network,
  Sun,
  Moon,
  Compass,
  Cloud,
  HelpCircle,
  Activity,
  Layers,
  FolderUp,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { FleetMode } from '../types';
import { TheaterData, InterventionType } from '../data/theaters';
import { geocodingService, GeocodingResult } from '../services/geocodingService';
import { auditService } from '../services/auditService';
import { Button } from './common/UIPrimitives';

export interface HeaderProps {
  onOpenArchitecture?: () => void;
  hideAllPanels?: boolean;
  onToggleHideAllPanels?: () => void;
  currentTheater: TheaterData;
  interventions?: Record<string, InterventionType>;
  fleetMode?: FleetMode;
  onFleetChange?: (mode: FleetMode) => void;
  statusFilter?: string;
  onFilterChange?: (filter: string) => void;
  onOpenTelemetry?: () => void;
  activeTheaterId: string;
  onSelectTheater: (theaterId: string) => void;
  customTheater?: TheaterData | null;
  onLoadCustomTheater?: (theater: TheaterData) => void;
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
  viewMode?: 'map' | 'satellite' | 'street';
  onToggleViewMode?: () => void;
  onSelectViewMode?: (mode: 'map' | 'satellite' | 'street') => void;
  onRunResponseSimulation?: () => void;
  isSimulationRunning?: boolean;
  simulationProgress?: string;
  onResetOverview?: () => void;
  onOpenReportEditor?: () => void;
  onOpenCloudModal?: () => void;
  onOpenWhatWeDontKnow?: () => void;
  pendingReportCount?: number;
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
  onOpenArchitecture,
  onOpenReportEditor,
  onOpenCloudModal,
  onOpenWhatWeDontKnow,
  onOpenTelemetry,
  pendingReportCount = 0,
  hideAllPanels = false,
  onToggleHideAllPanels,
}) => {
  const [cityQuery, setCityQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const [isIncidentMenuOpen, setIsIncidentMenuOpen] = useState<boolean>(false);

  const moreMenuRef = useRef<HTMLDivElement>(null);
  const incidentMenuRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
      if (incidentMenuRef.current && !incidentMenuRef.current.contains(e.target as Node)) {
        setIsIncidentMenuOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
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
    country: string,
    state: string
  ) => {
    setIsSearching(true);
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
        // success or fallback
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

    setIsSearching(true);
    const results = await geocodingService.search(cityQuery);
    setIsSearching(false);

    if (results.length > 0) {
      handleSelectSuggestion(results[0]);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCityQuery(val);
    if (val.length >= 2) {
      setIsSearching(true);
      const results = await geocodingService.search(val);
      setIsSearching(false);
      setSuggestions(results);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onLoadCustomTheater) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const geojson = JSON.parse(event.target?.result as string);
        let center: [number, number] = [24.8333, 92.7789];
        const chokePoints: any[] = [];

        if (geojson.features && Array.isArray(geojson.features)) {
          const firstPoint = geojson.features.find((f: any) => f.geometry?.type === 'Point');
          if (firstPoint) {
            center = [firstPoint.geometry.coordinates[1], firstPoint.geometry.coordinates[0]];
          }
          geojson.features.forEach((f: any, idx: number) => {
            if (f.geometry?.type === 'Point') {
              chokePoints.push({
                id: `custom_choke_${idx}`,
                name: f.properties?.name || `Critical Corridor ${idx + 1}`,
                lat: f.geometry.coordinates[1],
                lon: f.geometry.coordinates[0],
                road_name: f.properties?.road || `Access Link ${idx + 1}`,
                exposed_meters: 60,
                trapped_villages_count: 5,
                rank: idx + 1,
                spans_count: 1,
                baseline_km: 12,
                detour_km: 24,
                priority_tier: 'P1 - Immediate',
                villages: [],
                nearest_hospital_id: 'silchar_smch',
              });
            }
          });
        }

        const customTh: TheaterData = {
          id: 'custom',
          name: file.name.replace('.geojson', '').replace('.json', ''),
          subtitle: 'Tactical Custom Region',
          authorityName: 'State Emergency Operations Center',
          authorityShortName: 'SEOC',
          nodesCount: 'Dynamic',
          totalRoads: chokePoints.length,
          center,
          zoom: 13,
          chokePoints: chokePoints.length > 0 ? chokePoints : currentTheater.chokePoints,
          hospitals: currentTheater.hospitals,
          riverPath: currentTheater.riverPath,
          floodPolygon: currentTheater.floodPolygon,
        };

        onLoadCustomTheater(customTh);
        onSelectTheater('custom');
        setIsIncidentMenuOpen(false);
      } catch (err) {
        alert('Invalid GeoJSON format. Please upload standard FeatureCollection.');
      }
    };
    reader.readAsText(file);
  };

  const getIncidentLabel = () => {
    if (activeTheaterId === 'nepal') return 'Nepal: Roshi Khola (2024)';
    if (activeTheaterId === 'custom' && customTheater) return `Custom: ${customTheater.name}`;
    return 'Assam: Silchar Flood (2022)';
  };

  return (
    <header className="h-14 bg-[#0E1625] border-b border-[#26364B] px-4 flex items-center justify-between gap-3 shrink-0 select-none z-30">
      {/* 1. Logo and Lifeline OS Name */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#182437] border border-[#26364B] flex items-center justify-center text-[#13B8D5] shadow-sm">
          <Shield className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-[#E8EEF7] tracking-tight">
              Lifeline OS
            </span>
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#182437] text-[#13B8D5] border border-[#26364B] font-semibold hidden sm:inline-block">
              SEOC Command
            </span>
          </div>
        </div>
      </div>

      {/* 2. Incident Selector Dropdown */}
      <div className="relative shrink-0" ref={incidentMenuRef}>
        <button
          type="button"
          onClick={() => setIsIncidentMenuOpen((prev) => !prev)}
          className="h-9 px-3 rounded-lg bg-[#121D2D] border border-[#26364B] text-[#E8EEF7] hover:bg-[#182437] hover:border-[#354964] transition-colors flex items-center gap-2 text-xs font-medium cursor-pointer"
          title="Select Active Incident Workspace"
        >
          <span className="text-sm">
            {activeTheaterId === 'nepal' ? '🇳🇵' : '🇮🇳'}
          </span>
          <span className="font-semibold max-w-[150px] md:max-w-[180px] truncate">
            {getIncidentLabel()}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-[#9AAAC0]" />
        </button>

        {isIncidentMenuOpen && (
          <div className="absolute left-0 top-full mt-1.5 w-64 bg-[#0E1625] border border-[#26364B] rounded-lg shadow-xl p-1 z-50 text-xs text-[#E8EEF7] space-y-0.5 animate-in fade-in">
            <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase text-[#74859D] font-bold border-b border-[#1E2B3D]">
              Select Disaster Incident
            </div>
            <button
              type="button"
              onClick={() => {
                onSelectTheater('silchar');
                setIsIncidentMenuOpen(false);
              }}
              className={`w-full px-2.5 py-2 rounded-md flex items-center justify-between transition-colors text-left cursor-pointer ${
                activeTheaterId === 'silchar'
                  ? 'bg-[#182437] text-[#13B8D5] font-semibold'
                  : 'text-[#E8EEF7] hover:bg-[#121D2D]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>🇮🇳</span>
                <div>
                  <div className="font-medium">Assam: Silchar Flood</div>
                  <div className="text-[10px] text-[#9AAAC0]">Historical Replay • June 2022</div>
                </div>
              </div>
              <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-[#121D2D] text-[#9AAAC0] border border-[#26364B]">
                319 Hab
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectTheater('nepal');
                setIsIncidentMenuOpen(false);
              }}
              className={`w-full px-2.5 py-2 rounded-md flex items-center justify-between transition-colors text-left cursor-pointer ${
                activeTheaterId === 'nepal'
                  ? 'bg-[#182437] text-[#13B8D5] font-semibold'
                  : 'text-[#E8EEF7] hover:bg-[#121D2D]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>🇳🇵</span>
                <div>
                  <div className="font-medium">Nepal: BP Highway</div>
                  <div className="text-[10px] text-[#9AAAC0]">Roshi Khola Surge • Oct 2024</div>
                </div>
              </div>
              <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-[#121D2D] text-[#9AAAC0] border border-[#26364B]">
                18 Hamlets
              </span>
            </button>

            <div className="pt-1 border-t border-[#1E2B3D]">
              <label className="w-full px-2.5 py-2 rounded-md flex items-center gap-2 text-[#9AAAC0] hover:text-[#E8EEF7] hover:bg-[#121D2D] transition-colors cursor-pointer">
                <FolderUp className="w-3.5 h-3.5 text-[#13B8D5]" />
                <span className="text-xs">Upload Custom GeoJSON...</span>
                <input
                  type="file"
                  accept=".geojson,.json"
                  onChange={handleCustomFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 3. Global Search with Geocoding */}
      <div className="flex-1 max-w-md relative min-w-[140px]" ref={searchContainerRef}>
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <input
            type="text"
            value={cityQuery}
            onChange={handleInputChange}
            placeholder="Search settlements, hospitals, coordinates..."
            className="w-full h-9 pl-8 pr-8 rounded-lg bg-[#121D2D] border border-[#26364B] text-xs text-[#E8EEF7] placeholder-[#74859D] focus:outline-none focus:border-[#13B8D5] focus:ring-1 focus:ring-[#13B8D5] transition-colors"
          />
          <Search className="w-3.5 h-3.5 text-[#74859D] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          {isSearching && (
            <Loader2 className="w-3.5 h-3.5 text-[#13B8D5] absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin" />
          )}
        </form>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 top-full mt-1.5 w-full bg-[#0E1625] border border-[#26364B] rounded-lg shadow-2xl p-1 z-50 text-xs space-y-0.5 max-h-60 overflow-y-auto">
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full px-3 py-2 rounded-md text-left text-[#E8EEF7] hover:bg-[#182437] transition-colors flex items-center justify-between gap-2 cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-[#13B8D5] shrink-0" />
                  <span className="truncate">{item.displayName}</span>
                </div>
                <span className="text-[10px] font-mono text-[#74859D] shrink-0">
                  {item.coordinates[0].toFixed(2)}, {item.coordinates[1].toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. Basemap Selector (Dark Canvas | Satellite | Street) */}
      <div className="hidden lg:flex items-center bg-[#121D2D] border border-[#26364B] rounded-lg p-0.5 shrink-0">
        <button
          type="button"
          onClick={() => (onSelectViewMode ? onSelectViewMode('map') : onToggleViewMode?.())}
          className={`h-7 px-2.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
            viewMode === 'map'
              ? 'bg-[#182437] text-[#13B8D5] font-semibold'
              : 'text-[#9AAAC0] hover:text-[#E8EEF7]'
          }`}
          title="Tactical Dark Basemap"
        >
          <Map className="w-3.5 h-3.5" />
          <span>Dark</span>
        </button>
        <button
          type="button"
          onClick={() => (onSelectViewMode ? onSelectViewMode('satellite') : onToggleViewMode?.())}
          className={`h-7 px-2.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
            viewMode === 'satellite'
              ? 'bg-[#182437] text-[#13B8D5] font-semibold'
              : 'text-[#9AAAC0] hover:text-[#E8EEF7]'
          }`}
          title="Satellite Imagery"
        >
          <Satellite className="w-3.5 h-3.5" />
          <span>Satellite</span>
        </button>
        <button
          type="button"
          onClick={() => (onSelectViewMode ? onSelectViewMode('street') : onToggleViewMode?.())}
          className={`h-7 px-2.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
            viewMode === 'street'
              ? 'bg-[#182437] text-[#13B8D5] font-semibold'
              : 'text-[#9AAAC0] hover:text-[#E8EEF7]'
          }`}
          title="Street Network Basemap"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Street</span>
        </button>
      </div>

      {/* 5. Primary Simulation Action */}
      {onRunResponseSimulation && (
        <Button
          variant="primary"
          size="md"
          icon={Play}
          isLoading={isSimulationRunning}
          onClick={onRunResponseSimulation}
          className="shrink-0 font-semibold"
          title="Run closure simulation: Disruption -> Consequence -> Decision"
        >
          <span className="hidden sm:inline">
            {isSimulationRunning ? (simulationProgress || 'Simulating...') : 'Run Simulation'}
          </span>
          <span className="sm:hidden">
            {isSimulationRunning ? '...' : 'Run'}
          </span>
        </Button>
      )}

      {/* 6. Overflow Menu */}
      <div className="relative shrink-0" ref={moreMenuRef}>
        <button
          type="button"
          onClick={() => setIsMoreMenuOpen((prev) => !prev)}
          className="h-9 w-9 rounded-lg bg-[#121D2D] border border-[#26364B] text-[#9AAAC0] hover:text-[#E8EEF7] hover:bg-[#182437] transition-colors flex items-center justify-center cursor-pointer"
          title="Secondary Actions & Tools"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {isMoreMenuOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-60 bg-[#0E1625] border border-[#26364B] rounded-lg shadow-2xl p-1 z-50 text-xs text-[#E8EEF7] space-y-0.5 animate-in fade-in">
            <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase text-[#74859D] font-bold border-b border-[#1E2B3D]">
              Workspace Actions &amp; Tools
            </div>

            {/* Draft Report */}
            {onOpenReportEditor && (
              <button
                type="button"
                onClick={() => {
                  onOpenReportEditor();
                  setIsMoreMenuOpen(false);
                }}
                className="w-full px-2.5 py-2 rounded-md flex items-center justify-between text-[#E8EEF7] hover:bg-[#182437] transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Edit3 className="w-3.5 h-3.5 text-[#13B8D5]" />
                  <span>Draft Tactical Report</span>
                </div>
                {pendingReportCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#F0B44D] text-[#080D16]">
                    {pendingReportCount}
                  </span>
                )}
              </button>
            )}

            {/* Architecture & Flow */}
            {onOpenArchitecture && (
              <button
                type="button"
                onClick={() => {
                  onOpenArchitecture();
                  setIsMoreMenuOpen(false);
                }}
                className="w-full px-2.5 py-2 rounded-md flex items-center gap-2 text-[#E8EEF7] hover:bg-[#182437] transition-colors text-left cursor-pointer"
              >
                <Network className="w-3.5 h-3.5 text-[#13B8D5]" />
                <span>Architecture &amp; Process Flow</span>
              </button>
            )}

            {/* Cloud GEE Pipeline */}
            {onOpenCloudModal && (
              <button
                type="button"
                onClick={() => {
                  onOpenCloudModal();
                  setIsMoreMenuOpen(false);
                }}
                className="w-full px-2.5 py-2 rounded-md flex items-center gap-2 text-[#E8EEF7] hover:bg-[#182437] transition-colors text-left cursor-pointer"
              >
                <Cloud className="w-3.5 h-3.5 text-[#13B8D5]" />
                <span>Google Cloud GEE Pipeline</span>
              </button>
            )}

            {/* What We Don't Know */}
            {onOpenWhatWeDontKnow && (
              <button
                type="button"
                onClick={() => {
                  onOpenWhatWeDontKnow();
                  setIsMoreMenuOpen(false);
                }}
                className="w-full px-2.5 py-2 rounded-md flex items-center gap-2 text-[#E8EEF7] hover:bg-[#182437] transition-colors text-left cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#F0B44D]" />
                <span>Epistemic Uncertainty Analysis</span>
              </button>
            )}

            {/* Live Weather & Telemetry */}
            {onOpenTelemetry && (
              <button
                type="button"
                onClick={() => {
                  onOpenTelemetry();
                  setIsMoreMenuOpen(false);
                }}
                className="w-full px-2.5 py-2 rounded-md flex items-center gap-2 text-[#E8EEF7] hover:bg-[#182437] transition-colors text-left cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-[#13B8D5]" />
                <span>Live Weather &amp; Telemetry</span>
              </button>
            )}

            {/* Reset Map Overview */}
            {onResetOverview && (
              <button
                type="button"
                onClick={() => {
                  onResetOverview();
                  setIsMoreMenuOpen(false);
                }}
                className="w-full px-2.5 py-2 rounded-md flex items-center gap-2 text-[#E8EEF7] hover:bg-[#182437] transition-colors text-left cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#74859D]" />
                <span>Reset Map Overview</span>
              </button>
            )}

            {/* Guided Tour */}
            {onStartInteractiveTour && (
              <button
                type="button"
                onClick={() => {
                  onStartInteractiveTour();
                  setIsMoreMenuOpen(false);
                }}
                className="w-full px-2.5 py-2 rounded-md flex items-center gap-2 text-[#E8EEF7] hover:bg-[#182437] transition-colors text-left cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-[#13B8D5]" />
                <span>Interactive Guided Tour</span>
              </button>
            )}

            {/* Day / Night Mode Toggle */}
            {onToggleOpsMode && (
              <button
                type="button"
                onClick={() => {
                  onToggleOpsMode();
                  setIsMoreMenuOpen(false);
                }}
                className="w-full px-2.5 py-2 rounded-md flex items-center justify-between text-[#E8EEF7] hover:bg-[#182437] transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {opsMode === 'day' ? (
                    <Sun className="w-3.5 h-3.5 text-[#F0B44D]" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-[#13B8D5]" />
                  )}
                  <span>Ops Lighting Mode</span>
                </div>
                <span className="text-[10px] font-mono uppercase text-[#74859D]">
                  {opsMode}
                </span>
              </button>
            )}

            {/* Panel Management: Toggle Zen Map View */}
            {onToggleHideAllPanels && (
              <button
                type="button"
                onClick={() => {
                  onToggleHideAllPanels();
                  setIsMoreMenuOpen(false);
                }}
                className="w-full px-2.5 py-2 rounded-md flex items-center justify-between text-[#E8EEF7] hover:bg-[#182437] transition-colors text-left cursor-pointer border-t border-[#1E2B3D] pt-2"
              >
                <div className="flex items-center gap-2">
                  {hideAllPanels ? (
                    <PanelLeftOpen className="w-3.5 h-3.5 text-[#13B8D5]" />
                  ) : (
                    <PanelLeftClose className="w-3.5 h-3.5 text-[#9AAAC0]" />
                  )}
                  <span>{hideAllPanels ? 'Show Sidebar' : 'Hide Sidebar (Zen)'}</span>
                </div>
                <span className="text-[10px] font-mono text-[#74859D]">Key 'H'</span>
              </button>
            )}

            {/* Responsive Basemap Switcher (Available at < lg) */}
            <div className="lg:hidden border-t border-[#1E2B3D] pt-2 px-1">
              <span className="text-[10px] font-mono uppercase text-[#74859D] font-bold block mb-1">
                Basemap Layer
              </span>
              <div className="grid grid-cols-3 gap-1">
                {(['map', 'satellite', 'street'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      if (onSelectViewMode) onSelectViewMode(m);
                      setIsMoreMenuOpen(false);
                    }}
                    className={`py-1 rounded text-[11px] font-medium text-center transition-colors ${
                      viewMode === m
                        ? 'bg-[#182437] text-[#13B8D5] font-semibold border border-[#26364B]'
                        : 'text-[#9AAAC0] hover:text-[#E8EEF7] bg-[#121D2D]'
                    }`}
                  >
                    {m === 'map' ? 'Dark' : m === 'satellite' ? 'Sat' : 'Street'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
