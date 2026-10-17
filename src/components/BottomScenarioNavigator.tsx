import React, { useState } from 'react';
import {
  Compass,
  Layers,
  ChevronUp,
  ChevronDown,
  Play,
  Eye,
  Sliders,
  Database,
  Edit3,
  Sparkles,
  Mountain,
  MapPin,
  Calendar,
  AlertTriangle,
  Info,
  Cloud,
} from 'lucide-react';
import { SCENARIO_MANIFESTS, ScenarioId, ScenarioManifest } from '../data/scenarios';
import { evidenceCatalogueService } from '../services/evidenceCatalogueService';
import { incidentReportService } from '../services/incidentReportService';

interface BottomScenarioNavigatorProps {
  activeScenarioId: ScenarioId;
  onSelectScenario: (id: ScenarioId) => void;
  onRunSimulation?: () => void;
  isSimulationRunning?: boolean;
  simulationProgress?: string;
  onOpenEvidenceCatalogue: () => void;
  onOpenFieldEditor: () => void;
  onOpenCloudArchitecture?: () => void;
  viewMode: 'map' | 'satellite' | '3d';
  onSelectViewMode: (mode: 'map' | 'satellite' | '3d') => void;
  swipeMode?: 'off' | 'swipe' | 'before' | 'after';
  onToggleSwipeMode?: () => void;
}

export const BottomScenarioNavigator: React.FC<BottomScenarioNavigatorProps> = ({
  activeScenarioId,
  onSelectScenario,
  onRunSimulation,
  isSimulationRunning = false,
  simulationProgress = '',
  onOpenEvidenceCatalogue,
  onOpenFieldEditor,
  onOpenCloudArchitecture,
  viewMode,
  onSelectViewMode,
  swipeMode = 'off',
  onToggleSwipeMode,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const scenario: ScenarioManifest = SCENARIO_MANIFESTS[activeScenarioId] || SCENARIO_MANIFESTS.silchar;

  const datasetCounts = evidenceCatalogueService.getDatasetCountByState(activeScenarioId);
  const damageReports = incidentReportService.getReportsByTheater(activeScenarioId);

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-4xl w-[96vw] sm:w-[92vw] transition-all duration-300">
      <div className="bg-slate-950/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl shadow-2xl p-2.5 sm:p-3 text-white">
        {/* Top Control Bar: Scenario Workspaces Switcher + Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Two Scenarios Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => onSelectScenario('silchar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeScenarioId === 'silchar'
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
                activeScenarioId === 'nepal'
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

          {/* Center Tactical Actions */}
          <div className="flex items-center gap-1.5">
            {/* Run Simulation */}
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
                title="Run response simulation"
              >
                <Play className={`w-3.5 h-3.5 ${isSimulationRunning ? 'animate-spin' : 'fill-white'}`} />
                <span>
                  {isSimulationRunning
                    ? simulationProgress || 'Simulating...'
                    : activeScenarioId === 'silchar'
                    ? 'Run Surge Simulation'
                    : 'Run Roshi Simulation'}
                </span>
              </button>
            )}

            {/* Before/After Swipe Toggle */}
            {onToggleSwipeMode && (
              <button
                type="button"
                onClick={onToggleSwipeMode}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  swipeMode === 'swipe'
                    ? 'bg-cyan-900/60 border-cyan-400 text-cyan-200'
                    : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-white'
                }`}
                title="Toggle Before/After satellite swipe comparison"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Swipe</span>
              </button>
            )}

            {/* 3D Terrain Switcher */}
            <button
              type="button"
              onClick={() => onSelectViewMode(viewMode === '3d' ? 'map' : '3d')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === '3d'
                  ? 'bg-teal-900/60 border-teal-400 text-teal-200 shadow-[0_0_12px_rgba(20,184,166,0.3)]'
                  : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-white'
              }`}
              title="Toggle 3D Elevation Terrain Model"
            >
              <Mountain className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">3D</span>
            </button>

            {/* Evidence Catalogue Modal Button */}
            <button
              type="button"
              onClick={onOpenEvidenceCatalogue}
              className="px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-500 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Open Unified Evidence Registry (19 Datasets)"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Evidence</span>
            </button>

            {/* Field Editor Modal Button */}
            <button
              type="button"
              onClick={onOpenFieldEditor}
              className="px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-500 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Record Field Observation & Damage Report"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Field Edit</span>
            </button>

            {/* Google Cloud Architecture Modal Button */}
            {onOpenCloudArchitecture && (
              <button
                type="button"
                onClick={onOpenCloudArchitecture}
                className="px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium bg-slate-900 border border-blue-500/50 text-blue-300 hover:text-white hover:bg-blue-950/60 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Open 4-Tier Google Cloud Architecture & Gemini MCP Stack"
              >
                <Cloud className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden md:inline">GCP Cloud</span>
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
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
            {/* Column 1: Core Scenario Question & Context */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/40">
                  {scenario.country} • {scenario.region}
                </span>
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" /> {scenario.eventDate}
                </span>
              </div>
              <p className="text-slate-200 text-xs font-medium leading-relaxed line-clamp-2">
                {scenario.headline}
              </p>
              <p className="text-[11px] text-slate-400 italic line-clamp-1">
                "{scenario.coreQuestion}"
              </p>
            </div>

            {/* Column 2: Key Infrastructure & Failure Evidence */}
            <div className="flex flex-col gap-1 justify-center bg-slate-900/60 rounded-xl p-2 border border-slate-800/60 font-mono">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400" /> Primary Breach:
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
                <span className="text-rose-400 font-bold">
                  +{scenario.corridors[0]?.detourPenaltyMinutes}m delay ({scenario.corridors[0]?.detourKm} km)
                </span>
              </div>
            </div>

            {/* Column 3: Data Provenance & Verified Numbers */}
            <div className="flex flex-col gap-1 justify-center bg-slate-900/60 rounded-xl p-2 border border-slate-800/60 font-mono">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1">
                  <Database className="w-3 h-3 text-teal-400" /> Flood Inundation:
                </span>
                <span className="text-teal-300 font-bold">
                  {scenario.floodExtent.areaSqKm} km² (Sentinel-1)
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Isolated Population:</span>
                <span className="text-amber-400 font-bold">
                  {scenario.metrics.isolatedPopulationTotal.toLocaleString()} citizens
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Evidence State:</span>
                <span className="text-emerald-400 font-bold">
                  {datasetCounts.OBSERVED} Observed • {datasetCounts.OFFICIAL} Official • {damageReports.length} Reports
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
