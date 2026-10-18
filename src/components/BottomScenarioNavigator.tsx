import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Play,
  Sliders,
  Database,
  Calendar,
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  Navigation,
  AlertOctagon,
} from 'lucide-react';
import { SCENARIO_MANIFESTS, ScenarioId, ScenarioManifest } from '../data/scenarios';
import { evidenceCatalogueService } from '../services/evidenceCatalogueService';
import { incidentReportService } from '../services/incidentReportService';
import { getSelectedTelemetryRow, ASSAM_TELEMETRY_RESULTS } from '../data/disasterData';
import { EVIDENCE_CLASS_CONFIG } from '../types/evidence';

interface BottomScenarioNavigatorProps {
  activeScenarioId: ScenarioId;
  onSelectScenario: (id: ScenarioId) => void;
  onRunSimulation?: () => void;
  isSimulationRunning?: boolean;
  simulationProgress?: string;
  sliderValue?: number;
  onChangeSliderValue?: (val: number) => void;
  isSimulatedClosureActive?: boolean;
  onToggleSimulatedClosure?: () => void;
  isRerouted?: boolean;
  onToggleReroute?: () => void;
  reachableCount?: number;
  reroutedCount?: number;
  isolatedCount?: number;
  analysedCount?: number;
  excludedCount?: number;
}

export const BottomScenarioNavigator: React.FC<BottomScenarioNavigatorProps> = ({
  activeScenarioId,
  onSelectScenario,
  onRunSimulation,
  isSimulationRunning = false,
  simulationProgress = '',
  sliderValue = 100,
  onChangeSliderValue,
  isSimulatedClosureActive = true,
  onToggleSimulatedClosure,
  isRerouted = false,
  onToggleReroute,
  reachableCount = ASSAM_TELEMETRY_RESULTS.reachableCount,
  reroutedCount = ASSAM_TELEMETRY_RESULTS.reroutedCount,
  isolatedCount = ASSAM_TELEMETRY_RESULTS.noRouteCount,
  analysedCount = ASSAM_TELEMETRY_RESULTS.analysedCount,
  excludedCount = ASSAM_TELEMETRY_RESULTS.excludedCount,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const scenario: ScenarioManifest = SCENARIO_MANIFESTS[activeScenarioId] || SCENARIO_MANIFESTS.silchar;
  const isNepal = activeScenarioId === 'nepal';
  const selectedTelemetry = getSelectedTelemetryRow(scenario.corridors[0]?.name);

  const datasetCounts = evidenceCatalogueService.getDatasetCountByState(activeScenarioId);
  const damageReports = incidentReportService.getReportsByTheater(activeScenarioId);
  const simBadge = EVIDENCE_CLASS_CONFIG.SIMULATED;

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-4xl w-[96vw] sm:w-[92vw] transition-all duration-300">
      <div className="bg-slate-950/95 backdrop-blur-xl border border-slate-800/90 rounded-2xl shadow-2xl p-2.5 sm:p-3 text-white">
        {/* Top Control Bar: Scenario Workspaces Switcher + Single Run Button + Collapse */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Two Scenarios Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => onSelectScenario('silchar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                !isNepal
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span className="text-sm">🇮🇳</span>
              <span className="font-semibold">Assam</span>
              <span className="text-[10px] text-cyan-400/80 font-normal hidden sm:inline">
                (Silchar June 2022)
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectScenario('nepal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isNepal
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span className="text-sm">🇳🇵</span>
              <span className="font-semibold">Nepal</span>
              <span className="text-[10px] text-amber-400/80 font-normal hidden sm:inline">
                (Roshi Gorge Sep 2024)
              </span>
            </button>
          </div>

          {/* Unified Result & Transition Controls */}
          <div className="flex items-center gap-2">
            {!isNepal && onToggleSimulatedClosure && (
              <button
                type="button"
                onClick={onToggleSimulatedClosure}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSimulatedClosureActive
                    ? 'bg-rose-950/70 border-rose-600 text-rose-300'
                    : 'bg-emerald-950/70 border-emerald-600 text-emerald-300'
                }`}
                title="Toggle between Baseline Normal Access and Simulated Closure Impact"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>{isSimulatedClosureActive ? 'After (Closure Active)' : 'Before (Baseline Normal)'}</span>
              </button>
            )}

            {!isNepal && onToggleReroute && (
              <button
                type="button"
                onClick={onToggleReroute}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                  isRerouted
                    ? 'bg-blue-950 border-blue-500 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title="Toggle detour routing via elevated bypass"
              >
                <span>🚑 {isRerouted ? 'Bypass Engaged' : 'Reroute Habitations'}</span>
              </button>
            )}

            {/* Single Simulation Entry Point: Run closure simulation */}
            {onRunSimulation && (
              <button
                type="button"
                onClick={onRunSimulation}
                disabled={isSimulationRunning}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                  isSimulationRunning
                    ? 'bg-amber-950/80 border-amber-500 text-amber-300 animate-pulse'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                }`}
                title="Run closure simulation: Disruption -> Consequence -> Decision"
              >
                <Play className={`w-3.5 h-3.5 ${isSimulationRunning ? 'animate-spin' : 'fill-white'}`} />
                <span>{isSimulationRunning ? (simulationProgress || 'Simulating...') : 'Run closure simulation'}</span>
              </button>
            )}

            {/* Collapse / Expand Toggle */}
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title={isExpanded ? 'Collapse scenario bar' : 'Expand scenario bar'}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expandable Detail Section */}
        {isExpanded && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-2 text-xs">
            {/* Merged Access Slider (Assam Only) */}
            {!isNepal && onChangeSliderValue && (
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span className={sliderValue === 0 ? 'text-emerald-400 font-bold' : ''}>
                    Before: 0% Disruption (Baseline)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-rose-800 bg-rose-950/70 text-rose-300 font-bold">
                    SIMULATED CLOSURE, not a confirmed event ({sliderValue}% Impact)
                  </span>
                  <span className={sliderValue === 100 ? 'text-rose-400 font-bold' : ''}>
                    After: 100% Closure
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={sliderValue}
                  onChange={(e) => onChangeSliderValue(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 hover:accent-rose-400 transition-all"
                />
              </div>
            )}

            {/* 3 Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {/* Column 1: Context & Core Problem */}
              <div className="flex flex-col gap-1 justify-center">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/40">
                    {scenario.country} • {scenario.region}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" /> {scenario.eventDate}
                  </span>
                </div>
                <p className="text-slate-200 text-xs font-medium leading-snug line-clamp-2">
                  {scenario.headline}
                </p>
                <p className="text-[10px] text-slate-400 italic line-clamp-1">
                  "{scenario.coreQuestion}"
                </p>
              </div>

              {/* Column 2: Corridor & Surcharge */}
              <div className="flex flex-col gap-1 justify-center bg-slate-900/60 rounded-xl p-2 border border-slate-800/60 font-mono">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" /> Primary Disruption:
                  </span>
                  <span className="text-amber-300 font-bold truncate max-w-[150px]">
                    {scenario.corridors[0]?.name.split('(')[0]}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-300">
                  <span>Failure Mode:</span>
                  <span className="text-slate-200 truncate max-w-[170px]">
                    {scenario.corridors[0]?.failureType}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Detour Surcharge:</span>
                  {isNepal ? (
                    <span className="text-rose-400 font-bold italic">
                      Mountain corridor severed (no road bypass)
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold">
                      +{selectedTelemetry.additional_min ? Math.round(selectedTelemetry.additional_min) : 0}m delay ({(selectedTelemetry.scenario_km || 0).toFixed(1)} km)
                    </span>
                  )}
                </div>
              </div>

              {/* Column 3: Result Set / Access Numbers (Strictly Scenario-Isolated) */}
              <div className="flex flex-col gap-1 justify-center bg-slate-900/60 rounded-xl p-2 border border-slate-800/60 font-mono">
                {isNepal ? (
                  <>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Database className="w-3 h-3 text-teal-400" /> Flood &amp; Debris:
                      </span>
                      <span className="text-teal-300 font-bold">
                        Sentinel-2 Debris Swath
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Access Telemetry:</span>
                      <span className="text-amber-400 font-bold italic">
                        Not available for this corridor
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Evidence State:</span>
                      <span className="text-emerald-400 font-bold">
                        {datasetCounts.OBSERVED} Observed • {damageReports.length} Field Reports
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Database className="w-3 h-3 text-teal-400" /> Result Set:
                      </span>
                      <span className="text-emerald-300 font-bold">
                        {sliderValue === 0 ? analysedCount : reachableCount} Reachable (Same Facility)
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Impact Breakdown:</span>
                      <span className="text-amber-400 font-bold">
                        {sliderValue === 0 ? 0 : reroutedCount} rerouted / {sliderValue === 0 ? 0 : isolatedCount} no route
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Topology Snapping:</span>
                      <span className="text-slate-300 font-bold">
                        {analysedCount} analysed; {excludedCount} excluded (not snapped)
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
