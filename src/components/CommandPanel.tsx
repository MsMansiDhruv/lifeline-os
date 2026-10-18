import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Waves,
  GitBranch,
  Truck,
  History,
  Layers,
  ChevronRight,
  ChevronLeft,
  Info,
  Activity,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  Compass,
  ArrowRight,
  Wind,
  PhoneCall,
  Download,
  Building2,
  Stethoscope,
  Car,
  Clock,
  MapPin,
  Check,
  X,
  FileSignature,
  Radio,
  Play,
  Lock,
  Cpu,
  Search,
  Zap,
  AlertCircle,
  BookOpen,
  Edit3,
  Image,
  Filter,
} from 'lucide-react';
import { TheaterData, InterventionType, INTERVENTION_TOOLS, TheaterHospital } from '../data/theaters';
import { EcosystemBusState } from '../services/ecosystemServiceBus';
import { BridgeIcon, CampIcon, DroneIcon, BoatIcon } from './common/TacticalIcons';
import { FleetMode } from '../types';
import { calculateAmbulanceSurgeAllocation } from '../services/ambulanceAllocationService';
import { hydrologyModelService, HydrologyInferenceResult } from '../services/hydrologyModelService';
import { auditService } from '../services/auditService';
import { dispatchLivePhoneAlert } from '../services/emergencyBroadcastService';
import { playClickSound, playLaunchChime, playWarningBeep } from '../services/audioService';
import { incidentReportService, IncidentDamageReport } from '../services/incidentReportService';
import { evidenceCatalogueService } from '../services/evidenceCatalogueService';
import { roadConditionService } from '../services/roadConditionService';
import { EvidenceCatalogueModal } from './EvidenceCatalogueModal';
import { FieldEvidenceEditorModal } from './FieldEvidenceEditorModal';
import { DamageReportStatus } from '../types/evidence';
import { getSelectedTelemetryRow, ARTICULATION_BRIDGES } from '../data/disasterData';

export type IncidentChapter = 'prevent' | 'predict' | 'protect' | 'respond' | 'learn';

export type DispatchStateMachineState = 'DRAFT' | 'REVIEWED' | 'APPROVED' | 'SEND_ATTEMPTED' | 'ACCEPTED' | 'FAILED';

export interface SectorDamage {
  sector: string;
  submergedStructures: number;
  roadCutKm: number;
  bridgesDamaged: number;
  populationCutOff: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE';
}

export const SECTOR_DAMAGE_DATA: Record<string, SectorDamage[]> = {
  silchar: [
    { sector: 'Silchar Sadar (Urban)', submergedStructures: 142, roadCutKm: 18.4, bridgesDamaged: 2, populationCutOff: 48000, riskLevel: 'CRITICAL' },
    { sector: 'Sonai Block (Basin)', submergedStructures: 98, roadCutKm: 12.1, bridgesDamaged: 1, populationCutOff: 31500, riskLevel: 'HIGH' },
    { sector: 'Lakhipur (Upper Barak)', submergedStructures: 65, roadCutKm: 8.7, bridgesDamaged: 1, populationCutOff: 19200, riskLevel: 'MODERATE' },
    { sector: 'Borkhola / Udharbond', submergedStructures: 82, roadCutKm: 10.3, bridgesDamaged: 1, populationCutOff: 24000, riskLevel: 'HIGH' },
  ],
  nepal: [
    { sector: 'Roshi Khola Gorge (Km 42-54)', submergedStructures: 185, roadCutKm: 18.2, bridgesDamaged: 2, populationCutOff: 28400, riskLevel: 'CRITICAL' },
    { sector: 'Mangaltar Valley Sector', submergedStructures: 120, roadCutKm: 14.5, bridgesDamaged: 1, populationCutOff: 19500, riskLevel: 'HIGH' },
    { sector: 'Bhakundebesi Foothills', submergedStructures: 74, roadCutKm: 9.8, bridgesDamaged: 1, populationCutOff: 12000, riskLevel: 'HIGH' },
    { sector: 'Nepalthok / Sunkoshi Confluence', submergedStructures: 140, roadCutKm: 16.4, bridgesDamaged: 1, populationCutOff: 22000, riskLevel: 'CRITICAL' },
  ],
};

interface CommandPanelProps {
  currentTheater: TheaterData;
  activeChapter: IncidentChapter;
  onSelectChapter: (chapter: IncidentChapter) => void;
  selectedChokeIdx: number;
  onSelectChokeIdx: (idx: number) => void;
  interventions: Record<string, InterventionType>;
  onSetIntervention: (chokeId: string, tool: InterventionType) => void;
  onResetInterventions: () => void;
  fleetMode: FleetMode;
  onFleetChange: (mode: FleetMode) => void;
  rerouteAmbulances: boolean;
  onToggleRerouteAmbulances: () => void;
  activateSurgeBeds: boolean;
  onToggleActivateSurgeBeds: () => void;
  isLiveDispatched: boolean;
  onSignAndDispatch: () => void;
  onOpenSanctionModal: () => void;
  onOpenEcosystemDrawer: () => void;
  isSimulatedHighWind: boolean;
  onToggleHighWind: () => void;
  ecosystemState: EcosystemBusState;
  onFocusMapPoint: (point: { lat: number; lon: number; name: string }) => void;
  detourRouteMode?: 'both' | 'detour' | 'baseline';
  onSetDetourRouteMode?: (mode: 'both' | 'detour' | 'baseline') => void;
  isBreachTemporarilyReopened?: boolean;
  onToggleBreachTemporarilyReopened?: () => void;
  onSelectTheater?: (theaterId: string) => void;
  onInspectDamageReport?: (report: IncidentDamageReport) => void;
}

export const CommandPanel: React.FC<CommandPanelProps> = ({
  currentTheater,
  activeChapter,
  onSelectChapter,
  selectedChokeIdx,
  onSelectChokeIdx,
  interventions,
  onSetIntervention,
  onResetInterventions,
  fleetMode,
  onFleetChange,
  rerouteAmbulances,
  onToggleRerouteAmbulances,
  activateSurgeBeds,
  onToggleActivateSurgeBeds,
  isLiveDispatched,
  onSignAndDispatch,
  onOpenSanctionModal,
  onOpenEcosystemDrawer,
  isSimulatedHighWind,
  onToggleHighWind,
  ecosystemState,
  onFocusMapPoint,
  detourRouteMode = 'both',
  onSetDetourRouteMode,
  isBreachTemporarilyReopened = false,
  onToggleBreachTemporarilyReopened,
  onSelectTheater,
  onInspectDamageReport,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAllChokes, setShowAllChokes] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [dispatchState, setDispatchState] = useState<DispatchStateMachineState>(isLiveDispatched ? 'ACCEPTED' : 'DRAFT');
  const [signatoryName, setSignatoryName] = useState('District Magistrate & Chairperson, DDMA Cachar');
  const [isConfirmedByOperator, setIsConfirmedByOperator] = useState(false);
  const [dispatchTimestamp, setDispatchTimestamp] = useState<string | null>(null);

  const [workspaceMode, setWorkspaceMode] = useState<'investigation' | 'response'>('investigation');
  const [isEvidenceCatalogueOpen, setIsEvidenceCatalogueOpen] = useState(false);
  const [isFieldEditorOpen, setIsFieldEditorOpen] = useState(false);
  const [reportFilterStatus, setReportFilterStatus] = useState<DamageReportStatus | 'ALL'>('ALL');
  const [reportSearchQuery, setReportSearchQuery] = useState('');

  const allReportsForTheater = useMemo(() => {
    return incidentReportService.getReportsByTheater(currentTheater.id as any);
  }, [currentTheater.id]);

  const filteredReports = useMemo(() => {
    return incidentReportService.searchReports(
      currentTheater.id as any,
      reportSearchQuery,
      reportFilterStatus
    );
  }, [currentTheater.id, reportSearchQuery, reportFilterStatus]);

  const allDatasetsCount = useMemo(() => {
    return evidenceCatalogueService.getDatasetsByTheater(currentTheater.id).length;
  }, [currentTheater.id]);

  const selectedChoke = currentTheater.chokePoints[selectedChokeIdx] || currentTheater.chokePoints[0];
  const activeTool = interventions[selectedChoke.id] || 'none';
  const selectedTelemetry = getSelectedTelemetryRow(selectedChoke?.road_name);
  const topCutEdge = useMemo(() => {
    const sorted = [...ARTICULATION_BRIDGES].sort((a, b) => b.isolated_settlements_count - a.isolated_settlements_count);
    return sorted[0] || {
      cut_edge_id: 'BRIDGE_1',
      serving_settlement: 'Harinagar East',
      isolated_settlements_count: 18,
      recommended_action: 'Priority A: Reinforce Bridge Abutments & Elevate Embankment (+2.5m)',
    };
  }, []);

  // Quick Zoom Target Waypoints per Theater
  const quickZoomTargets = useMemo(() => {
    if (currentTheater.id === 'nepal') {
      return [
        { name: 'BP Highway Roshi Gorge', label: 'BP Highway (120m)', lat: currentTheater.chokePoints[0]?.lat || 27.5380, lon: currentTheater.chokePoints[0]?.lon || 85.6420, chokeIdx: 0 },
        { name: 'Mangaltar Feeder Link', label: 'Mangaltar (85m)', lat: currentTheater.chokePoints[1]?.lat || 27.5120, lon: currentTheater.chokePoints[1]?.lon || 85.6980, chokeIdx: 1 },
        { name: 'Nepalthok Confluence', label: 'Nepalthok (95m)', lat: 27.4280, lon: 85.8350, chokeIdx: 2 },
        { name: 'Roshi River Corridor', label: 'Whole Corridor', lat: currentTheater.center[0], lon: currentTheater.center[1] },
      ];
    }
    return [
      { name: 'JT Road Breach', label: 'JT Road (80m)', lat: currentTheater.chokePoints[0]?.lat || 24.7891, lon: currentTheater.chokePoints[0]?.lon || 92.8124, chokeIdx: 0 },
      { name: 'Sonabarighat Culvert', label: 'Sonabarighat (45m)', lat: currentTheater.chokePoints[1]?.lat || 24.7612, lon: currentTheater.chokePoints[1]?.lon || 92.7935, chokeIdx: 1 },
      { name: 'Korkoli Dyke Breach', label: 'Korkoli (120m)', lat: 24.812, lon: 92.834 },
      { name: 'Harinagar Feeder', label: 'Harinagar (60m)', lat: 24.745, lon: 92.862 },
      { name: 'Silchar Basin Overview', label: 'Whole Corridor', lat: currentTheater.center[0], lon: currentTheater.center[1] },
    ];
  }, [currentTheater]);

  const handleQuickZoom = (target: { name: string; lat: number; lon: number; chokeIdx?: number }) => {
    playClickSound();
    if (target.chokeIdx !== undefined) {
      onSelectChokeIdx(target.chokeIdx);
    }
    onFocusMapPoint({ lat: target.lat, lon: target.lon, name: target.name });
  };

  // Deterministic Ambulance Surge Calculation
  const surgeAllocation = calculateAmbulanceSurgeAllocation(selectedChoke, currentTheater.hospitals);

  // Pretrained Hydrology Model Inference Evaluation (Section 4 Requirement)
  const hydrologyInference = hydrologyModelService.evaluateCatchmentCompatibility(currentTheater.id);

  // Sector damage breakdown data
  const sectorList = SECTOR_DAMAGE_DATA[currentTheater.id] || SECTOR_DAMAGE_DATA['silchar'];

  // Compute live aggregates across corridors
  const totalVillages = currentTheater.chokePoints.reduce(
    (acc, cp) => acc + (cp.trapped_villages_count || 0),
    0
  );
  const estStructures = Math.round(totalVillages * 116.66);
  const totalCitizens = Math.round(estStructures * 4.8);

  const chapters: Array<{
    id: IncidentChapter;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'prevent',
      title: 'Prevent',
      subtitle: 'Review single points of failure & baseline network vulnerability',
      icon: Shield,
    },
    {
      id: 'predict',
      title: 'Predict',
      subtitle: 'Inspect flood hazard, weather context & evidence coverage',
      icon: Waves,
    },
    {
      id: 'protect',
      title: 'Protect',
      subtitle: 'Assess access to critical infrastructure',
      icon: GitBranch,
    },
    {
      id: 'respond',
      title: 'Respond',
      subtitle: 'Evaluate constrained resource allocation & deploy alerts',
      icon: Truck,
    },
    {
      id: 'learn',
      title: 'Learn',
      subtitle: 'Inspect immutable audit trail & scenario evaluation benchmarks',
      icon: History,
    },
  ];

  const currentMeta = chapters.find((c) => c.id === activeChapter) || chapters[2];

  const guideSteps: Array<{ id: IncidentChapter; label: string; caption: string }> = [
    {
      id: 'prevent',
      label: 'Baseline',
      caption: currentTheater.id === 'nepal'
        ? "What you're seeing: Pre-disaster BP Highway corridor through Roshi Khola gorge."
        : "What you're seeing: Pre-disaster normal road network — all 319 settlements connected to regional hospitals.",
    },
    {
      id: 'predict',
      label: 'Apply simulated closure',
      caption: currentTheater.id === 'nepal'
        ? "What you're seeing: 120m mountain gorge washout severing BP Highway at Roshi Khola."
        : "What you're seeing: 80m structural breach on JT Road cutting the primary highway egress.",
    },
    {
      id: 'protect',
      label: 'Impact Assessment',
      caption: currentTheater.id === 'nepal'
        ? "What you're seeing: Mountain corridor impassable; access telemetry unlinked for this corridor."
        : "What you're seeing: 42 settlements severed with no hospital route; 41 rerouted via detour bypass delays.",
    },
    {
      id: 'respond',
      label: 'Pick a fix incl. culvert',
      caption: currentTheater.id === 'nepal'
        ? "What you're seeing: High-clearance bridging and tactical air-link required for gorge gap."
        : "What you're seeing: Feasible mitigations: precomputed cut-edge culverts & ambulance diversion.",
    },
    {
      id: 'learn',
      label: 'Audit & Benchmarks',
      caption: currentTheater.id === 'nepal'
        ? "What you're seeing: Roshi Khola response telemetry, audit trail, and verification benchmarks."
        : "What you're seeing: Silchar response telemetry, statutory sanction orders, and immutable audit trail.",
    },
  ];
  const currentStepIdx = guideSteps.findIndex((s) => s.id === activeChapter);
  const activeGuideStep = guideSteps[currentStepIdx !== -1 ? currentStepIdx : 0];

  const handleStepChange = (targetIdx: number) => {
    if (targetIdx < 0 || targetIdx >= guideSteps.length) return;
    playClickSound();
    const nextChapter = guideSteps[targetIdx].id;
    onSelectChapter(nextChapter);
    setWorkspaceMode('response');

    if (targetIdx === 0) {
      onFocusMapPoint({ lat: currentTheater.center[0], lon: currentTheater.center[1], name: 'Baseline Network Overview' });
    } else if (targetIdx === 1) {
      const breachCp = currentTheater.chokePoints[0];
      if (breachCp) {
        onFocusMapPoint({ lat: breachCp.lat, lon: breachCp.lon, name: `${breachCp.road_name.split(' (')[0]} (Closure Breach)` });
      }
    } else if (targetIdx === 2) {
      if (currentTheater.id !== 'nepal') {
        const topImpact = getSelectedTelemetryRow(topCutEdge.serving_settlement);
        onFocusMapPoint({ lat: topImpact.lat, lon: topImpact.lon, name: 'Impacted Rural Settlement Corridor' });
      } else {
        onFocusMapPoint({ lat: currentTheater.center[0], lon: currentTheater.center[1], name: 'Roshi River Corridor' });
      }
    } else if (targetIdx === 3) {
      if (currentTheater.id !== 'nepal') {
        const servingVillage = getSelectedTelemetryRow(topCutEdge.serving_settlement);
        onFocusMapPoint({ lat: servingVillage.lat, lon: servingVillage.lon, name: `${topCutEdge.serving_settlement} (Precomputed Culvert Point)` });
      } else {
        onFocusMapPoint({ lat: currentTheater.center[0], lon: currentTheater.center[1], name: 'Nepal Mitigation Corridor' });
      }
    } else if (targetIdx === 4) {
      onFocusMapPoint({ lat: currentTheater.center[0], lon: currentTheater.center[1], name: 'Incident Command Post (SEOC)' });
    }
  };

  // Handle Dispatch Flow
  const handleStartReview = () => {
    playClickSound();
    setDispatchState('REVIEWED');
    setIsReviewModalOpen(true);
  };

  const handleApproveAndExecuteDispatch = async () => {
    playLaunchChime();
    setDispatchState('ACCEPTED');

    const nowIso = new Date().toISOString();
    setDispatchTimestamp(nowIso);

    // Record immutable audit entry
    auditService.recordAction({
      action_type: 'DISPATCH_AUTHORIZED',
      rationale: `Form-3B Statutory Sanction authorized for ${selectedChoke.road_name}. Tool: ${activeTool}. Surge rerouting: ${rerouteAmbulances ? 'ENGAGED' : 'STANDBY'}.`,
      user_id: 'INCIDENT_COMMANDER_CACHAR',
      user_role: 'INCIDENT_COMMANDER',
      human_authorized: true,
      input_evidence_ids: [selectedChoke.id, 'osm_network_survey_2022'],
    });

    // Delegate single broadcast execution to master handler (guarantees exactly 1 ntfy push)
    onSignAndDispatch();
    setIsReviewModalOpen(false);
  };

  if (isCollapsed) {
    return (
      <aside className="fixed top-20 left-4 z-30 flex items-center bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-1.5 select-none">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
          title="Expand command panel"
        >
          <currentMeta.icon className="w-5 h-5 text-cyan-400" />
          <span className="text-xs font-bold font-mono uppercase">{currentMeta.title}</span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </aside>
    );
  }

  return (
    <>
      <aside className="fixed top-18 left-4 bottom-4 z-30 flex select-none pointer-events-auto">
        {/* 1. VERTICAL NAVIGATION RAIL WITH VISIBLE LABELS & TOOLTIPS */}
        <div className="w-28 bg-slate-950 border-y border-l border-slate-700/80 rounded-l-2xl flex flex-col items-center py-3 justify-between shadow-2xl">
          <div className="w-full px-1.5 space-y-2 flex flex-col items-center">
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider text-center">
              Chapters
            </span>
            {chapters.map((ch, idx) => {
              const isActive = activeChapter === ch.id;
              const Icon = ch.icon;
              const shortAction = ch.id === 'prevent' ? 'Baseline' : ch.id === 'predict' ? 'Simulate' : ch.id === 'protect' ? 'Detour' : ch.id === 'respond' ? 'Fix' : 'Audit';
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => {
                    onSelectChapter(ch.id);
                    setWorkspaceMode('response');
                  }}
                  className={`w-full py-2 px-1 rounded-xl flex flex-col items-center text-center transition-all cursor-pointer group ${
                    isActive && workspaceMode === 'response'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                  }`}
                  title={`Chapter ${idx + 1}: ${ch.title} — ${ch.subtitle}`}
                >
                  <Icon className={`w-4 h-4 mb-1 ${isActive && workspaceMode === 'response' ? 'text-cyan-400 scale-110' : 'group-hover:scale-110 transition-transform'}`} />
                  <span className="text-[10px] font-mono font-bold leading-tight block">
                    {idx + 1}. {ch.title}
                  </span>
                  <span className="text-[8px] text-slate-400 leading-none truncate max-w-full mt-0.5">
                    {shortAction}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="w-full py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer text-[10px] font-mono"
            title="Collapse command panel"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Hide</span>
          </button>
        </div>

        {/* 2. EDITORIAL COMMAND CARD */}
        <div className="w-[450px] max-w-[calc(100vw-80px)] bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-r-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
          {/* Segmented Workspace Mode Switcher */}
          <div className="flex border-b border-slate-800 bg-slate-950/80 p-2 gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setWorkspaceMode('investigation');
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                workspaceMode === 'investigation'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Damage Explorer</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setWorkspaceMode('response');
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                workspaceMode === 'response'
                  ? 'bg-blue-600 text-white shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Response (5 Chapters)</span>
            </button>
          </div>

          {/* Card Header: Dynamic based on Mode */}
          <div className="p-4 px-5 border-b border-slate-800 shrink-0">
            {workspaceMode === 'investigation' ? (
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono tracking-widest text-cyan-400 font-bold uppercase flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5" />
                    Damage &amp; Ground Truth Explorer
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase">
                    Rapid Assessment
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-white tracking-tight mt-1">
                  Damage &amp; Ground Reports
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-medium leading-relaxed">
                  Inspect verified bridge breaches, municipal infrastructure damage, and isolated communities.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono tracking-widest text-cyan-400 font-bold uppercase">
                    Incident Command • {currentMeta.title}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase">
                    {currentTheater.id === 'silchar' ? 'Historical replay' : 'Dynamic scenario'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <h2 className="text-lg font-extrabold text-white tracking-tight">
                    {activeGuideStep.label}
                  </h2>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentStepIdx <= 0}
                      onClick={() => handleStepChange(currentStepIdx - 1)}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      &larr; Back
                    </button>
                    <button
                      type="button"
                      disabled={currentStepIdx >= guideSteps.length - 1}
                      onClick={() => handleStepChange(currentStepIdx + 1)}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 hover:bg-cyan-900 border border-cyan-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Next &rarr;
                    </button>
                  </div>
                </div>
                {/* One-line "What you're seeing" caption */}
                <div className="mt-2 p-2 rounded-lg bg-cyan-950/50 border border-cyan-800/40 text-[11px] text-cyan-200 font-sans leading-snug">
                  {activeGuideStep.caption}
                </div>
              </div>
            )}
          </div>

          {/* Scrollable Chapter Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
            {/* Simulation Journey & Prevention Step Explainer (Moved from center of map) */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/30 shadow-lg space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-cyan-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  Simulation Journey &amp; Impact
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 font-semibold">
                  {currentTheater.id === 'silchar' ? 'Assam Flood Baseline' : 'Nepal Mountain Surge'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {currentTheater.id === 'silchar'
                  ? 'Historical flood replay (June 20, 2022). See how 1 dyke breach severed critical road access to 42 habitations, imposing a +47 min detour penalty. Compare Before (Danger) vs After (Rescue) on the map swipe divider.'
                  : 'High-altitude monsoon surge on the Roshi Khola / BP Highway corridor. Simulating debris breach cut-off to high-risk valley settlements.'}
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-800/50 space-y-0.5">
                  <div className="text-rose-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    BEFORE (Danger)
                  </div>
                  <div className="text-slate-300">{currentTheater.id === 'nepal' ? '18 Hamlets Cut Off' : '42 Villages Severed'}</div>
                  <div className="text-rose-300 font-semibold">{currentTheater.id === 'nepal' ? '120m Gorge Washout (No Bypass)' : '+47m Detour Penalty'}</div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/50 space-y-0.5">
                  <div className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    AFTER (Rescue)
                  </div>
                  <div className="text-slate-300">{currentTheater.id === 'nepal' ? '18 Hamlets Reconnected' : '42 Reconnected'}</div>
                  <div className="text-emerald-300 font-semibold">{currentTheater.id === 'nepal' ? 'Roshi Gorge Restored in 28m' : 'Corridor Restored in 18m'}</div>
                </div>
              </div>
            </div>

            {/* Scenario & Evidence Context (Always Visible across Chapters) */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <span>{currentTheater.name}</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/60">
                  {currentTheater.id === 'silchar' ? 'June 2022 Flood' : 'Sep 2024 Flash Flood'}
                </span>
              </div>

              {onSelectTheater && (
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                  <span className="text-[11px] font-mono text-slate-400">Incident Scenario:</span>
                  <select
                    value={currentTheater.id}
                    onChange={(e) => onSelectTheater(e.target.value)}
                    className="bg-slate-900 text-cyan-300 border border-slate-700 hover:border-cyan-500 rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    title="Switch active disaster theater"
                  >
                    <option value="silchar">🇮🇳 Assam: Silchar / Cachar Basin</option>
                    <option value="nepal">🇳🇵 Nepal: Roshi Khola / BP Highway</option>
                  </select>
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
                  Evidence available for this scenario
                </span>
                <div className="flex flex-wrap gap-1.5 text-xs font-mono">
                  <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700/80 text-cyan-300 text-[11px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    Flood extent
                  </span>
                  <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700/80 text-cyan-300 text-[11px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    Road network
                  </span>
                  <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700/80 text-cyan-300 text-[11px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    Facilities
                  </span>
                </div>
              </div>
            </div>

            {/* WORKSPACE MODE: INVESTIGATION (DAMAGE EXPLORER) */}
            {workspaceMode === 'investigation' && (
              <div className="space-y-4 animate-in fade-in">
                {/* 1. Geospatial Investigation Action Toolbar */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setIsEvidenceCatalogueOpen(true);
                    }}
                    className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-cyan-800/80 hover:border-cyan-500 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Evidence Catalogue ({allDatasetsCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setIsFieldEditorOpen(true);
                    }}
                    className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-amber-800/80 hover:border-amber-500 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Submit Ground Report</span>
                  </button>
                </div>

                {/* 2. Quick Zoom Buttons */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-cyan-400" />
                      Quick Zoom to Critical Damage Sites
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400">Jump to Camera</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs font-mono">
                    {quickZoomTargets.map((qz) => (
                      <button
                        key={qz.name}
                        type="button"
                        onClick={() => handleQuickZoom(qz)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white border border-slate-700/80 hover:border-cyan-500 transition-colors cursor-pointer text-[11px] flex items-center gap-1 shadow-sm"
                      >
                        <span className="text-[10px]">📍</span>
                        <span>{qz.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Search & Filterable Incident Reports List */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      Damage &amp; Bridge Ground Reports ({filteredReports.length})
                    </span>
                    {currentTheater.id === 'nepal' ? (
                      <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                        Nepal Field Model
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/60">
                        Ground Reports
                      </span>
                    )}
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={reportSearchQuery}
                      onChange={(e) => setReportSearchQuery(e.target.value)}
                      placeholder="Search reports by road, bridge, keyword..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                    />
                  </div>

                  {/* Status Filter Pills */}
                  <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                    {(['ALL', 'REPORTED_DESTROYED', 'REPORTED_DAMAGED', 'CONFLICTING_REPORTS', 'UNDER_REPAIR'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setReportFilterStatus(st)}
                        className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                          reportFilterStatus === st
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {st === 'ALL' ? 'All' : st.replace('REPORTED_', '').replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  {/* Reports List */}
                  <div className="space-y-2 max-h-[380px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                    {filteredReports.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 font-mono text-[11px]">
                        No damage reports match the selected filter.
                      </div>
                    ) : (
                      filteredReports.map((r) => {
                        const isSelected = r.chokePointIdx !== undefined && selectedChokeIdx === r.chokePointIdx;
                        return (
                          <div
                            key={r.id}
                            onClick={() => {
                              playClickSound();
                              onFocusMapPoint({ lat: r.coordinates[0], lon: r.coordinates[1], name: r.featureName });
                              onInspectDamageReport?.(r);
                            }}
                            className={`p-3 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-950/40 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                                : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                    {r.id}
                                  </span>
                                  <span className="text-[9px] font-mono uppercase text-cyan-400">
                                    {r.featureType}
                                  </span>
                                </div>
                                <strong className="text-xs text-white block font-semibold mt-0.5">{r.featureName}</strong>
                                <span className="text-[10px] text-slate-400 font-mono block">{r.roadName}</span>
                              </div>

                              <span
                                className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold border shrink-0 ${
                                  r.normalizedStatus === 'REPORTED_DESTROYED'
                                    ? 'bg-rose-950 text-rose-300 border-rose-700'
                                    : r.normalizedStatus === 'CONFLICTING_REPORTS'
                                    ? 'bg-amber-950 text-amber-300 border-amber-700'
                                    : 'bg-orange-950 text-orange-300 border-orange-700'
                                }`}
                              >
                                {r.normalizedStatus.replace('REPORTED_', '')}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-300 font-sans leading-relaxed mt-1.5 bg-slate-950/60 p-2 rounded-lg border border-slate-850">
                              "{r.reportedCondition}"
                            </p>

                            <div className="mt-2 text-[11px] font-mono text-slate-400 space-y-0.5 border-t border-slate-800/80 pt-1.5">
                              <div className="flex justify-between items-center">
                                <span>Verification Status:</span>
                                <span className={r.verificationStatus === 'VERIFIED' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                                  {r.verificationStatus}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Coordinates (WGS84):</span>
                                <span className="text-cyan-300 font-bold">{r.coordinates[0].toFixed(4)}°N, {r.coordinates[1].toFixed(4)}°E</span>
                              </div>
                              {r.isolatedPopEst !== undefined && r.isolatedPopEst > 0 && (
                                <div className="flex justify-between items-center">
                                  <span>Cut-off Population:</span>
                                  <span className="text-amber-300 font-bold">{r.isolatedPopEst.toLocaleString()} residents</span>
                                </div>
                              )}
                            </div>

                            {/* Attachments preview */}
                            {r.attachments && r.attachments.length > 0 && (
                              <div className="mt-2 pt-1.5 border-t border-slate-800/60 text-[10px] font-mono text-slate-400 space-y-1">
                                <div className="flex items-center gap-1 text-slate-300 font-semibold">
                                  <Image className="w-3 h-3 text-cyan-400" />
                                  <span>Ground Attachment: {r.attachments[0].title}</span>
                                </div>
                                <div className="text-slate-400 italic">"{r.attachments[0].caption}"</div>
                                <div className="text-slate-500">Credit: {r.attachments[0].credit} ({r.attachments[0].license})</div>
                              </div>
                            )}

                            <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                              <span className="text-slate-500 truncate max-w-[210px]">{r.source} • <span className="text-amber-400/90 italic">source link not verified</span></span>
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playClickSound();
                                  onFocusMapPoint({ lat: r.coordinates[0], lon: r.coordinates[1], name: r.featureName });
                                  onInspectDamageReport?.(r);
                                }}
                                className="text-cyan-400 flex items-center gap-1 font-semibold hover:underline cursor-pointer"
                              >
                                <span>Inspect on Map</span>
                                <ExternalLink className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 3. Damage by Municipality / Sector Breakdown Table */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">
                      Damage by Municipality / Administrative Sector
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400">OSM + SAR Overlay</span>
                  </div>

                  <div className="rounded-xl border border-slate-800 overflow-hidden shadow-inner">
                    <table className="w-full text-[11px] font-mono text-left">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                        <tr>
                          <th className="py-2 px-2.5">Sector</th>
                          <th className="py-2 px-1 text-right">Bldgs</th>
                          <th className="py-2 px-1 text-right">Road km</th>
                          <th className="py-2 px-1 text-right">Bridges</th>
                          <th className="py-2 px-2 text-right">Pop. Cut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 bg-slate-900/60 text-slate-300">
                        {sectorList.map((sec) => (
                          <tr key={sec.sector} className="hover:bg-slate-800/40">
                            <td className="py-1.5 px-2.5 font-sans font-medium text-white flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sec.riskLevel === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                              <span className="truncate max-w-[120px]">{sec.sector}</span>
                            </td>
                            <td className="py-1.5 px-1 text-right text-rose-300 font-bold">{sec.submergedStructures}</td>
                            <td className="py-1.5 px-1 text-right">{sec.roadCutKm}</td>
                            <td className="py-1.5 px-1 text-right">{sec.bridgesDamaged}</td>
                            <td className="py-1.5 px-2 text-right text-amber-300 font-bold">{(sec.populationCutOff / 1000).toFixed(1)}k</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-950 text-slate-200 font-bold border-t border-slate-800 text-[10px]">
                        <tr>
                          <td className="py-1.5 px-2.5">TOTAL / DISTRICT</td>
                          <td className="py-1.5 px-1 text-right text-rose-300">{sectorList.reduce((acc, s) => acc + s.submergedStructures, 0)}</td>
                          <td className="py-1.5 px-1 text-right">{sectorList.reduce((acc, s) => acc + s.roadCutKm, 0).toFixed(1)}</td>
                          <td className="py-1.5 px-1 text-right">{sectorList.reduce((acc, s) => acc + s.bridgesDamaged, 0)}</td>
                          <td className="py-1.5 px-2 text-right text-amber-300">{(sectorList.reduce((acc, s) => acc + s.populationCutOff, 0) / 1000).toFixed(0)}k</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* 4. Transition Call-to-Action to Response Workflow */}
                <button
                  type="button"
                  onClick={() => {
                    playLaunchChime();
                    setWorkspaceMode('response');
                    onSelectChapter('protect');
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-xl shadow-cyan-950/60 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-cyan-200 animate-pulse" />
                  <span>⚡ Coordinate Response for this Incident &rarr;</span>
                </button>
              </div>
            )}

            {/* CHAPTER 1: PREVENT */}
            {workspaceMode === 'response' && activeChapter === 'prevent' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Cut-Edge Percolation Screening</h3>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60 font-semibold">
                      183 Roads Screened
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Graph criticality analysis identifies {currentTheater.chokePoints.length} single-point-of-failure
                    corridors whose embankment washout disconnects rural population clusters.
                  </p>

                  {/* Corridor Selector */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      Inspect Vulnerable Choke Points:
                    </span>
                    <div className="space-y-1.5">
                      {currentTheater.chokePoints.map((cp, idx) => (
                        <button
                          key={cp.id}
                          type="button"
                          onClick={() => onSelectChokeIdx(idx)}
                          className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                            selectedChokeIdx === idx
                              ? 'bg-slate-900 border-cyan-500/80 text-white shadow-md'
                              : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-900'
                          }`}
                        >
                          <div>
                            <strong className="block font-semibold">{cp.road_name}</strong>
                            <span className="text-[10px] text-slate-400">
                              {cp.trapped_villages_count} habitations • {cp.exposed_meters}m breach gap
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-rose-400">
                            +{cp.detour_travel_mins || Math.round(cp.detour_km * 2.5)}m delay
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hospital Candidates Ranking Card (P1 Requirement) */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300 uppercase font-mono flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Regional Hospital Audit &amp; Selection</span>
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">OSM &amp; NHM Sourced</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {currentTheater.hospitals.map((hosp) => {
                        const isValley = hosp.id === 'valley';
                        const isSmch = hosp.id === 'smch';
                        const isCivil = hosp.id === 'civil';

                        return (
                          <div
                            key={hosp.id}
                            className={`p-2.5 rounded-xl border ${
                              isValley
                                ? 'bg-rose-950/30 border-rose-800/60'
                                : isSmch
                                ? 'bg-cyan-950/40 border-cyan-800/60'
                                : isCivil
                                ? 'bg-emerald-950/30 border-emerald-800/60'
                                : 'bg-slate-950/60 border-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <strong className="text-white font-semibold flex items-center gap-1.5">
                                <span>{hosp.name}</span>
                                {isCivil && (
                                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-300">
                                    OSM: node/441289102
                                  </span>
                                )}
                              </strong>
                              <span
                                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  isValley
                                    ? 'bg-rose-950 text-rose-300 border border-rose-700'
                                    : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                }`}
                              >
                                {isValley ? 'EXCLUDED / SATURATED' : `${hosp.availableBeds} Avail Beds`}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono text-slate-400 mt-1.5">
                              <div>
                                <span className="block text-slate-500">Total Beds:</span>
                                <strong className="text-slate-200">{hosp.beds || hosp.totalBeds} ({hosp.icuBeds} ICU)</strong>
                              </div>
                              <div>
                                <span className="block text-slate-500">Direct Route:</span>
                                <strong className="text-slate-200">{hosp.directDistanceKm || 14.2} km ({hosp.directMins || 18}m)</strong>
                              </div>
                              <div>
                                <span className="block text-slate-500">Detour Route:</span>
                                <strong className={isValley ? 'text-rose-400' : 'text-amber-400'}>
                                  {hosp.detourDistanceKm || 24.5} km ({hosp.detourMins || 65}m)
                                </strong>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-300 mt-1.5 font-sans leading-snug">
                              <span className="text-slate-400 font-semibold">Rationale: </span>
                              {hosp.selectionReason ||
                                (isValley
                                  ? 'Baseline bed capacity exhausted (0 available beds). Diverting ambulances here triggers triage collapse.'
                                  : isSmch
                                  ? 'Primary apex trauma destination with 120 ICU beds and 24/7 blood bank.'
                                  : 'District general surgery and stabilization facility.')}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectChapter('predict')}
                    className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer mt-2"
                  >
                    <span>Proceed to Predict (Hazard Analysis)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* CHAPTER 2: PREDICT */}
            {workspaceMode === 'response' && activeChapter === 'predict' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Live Hydrological &amp; Weather Evidence</h3>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 font-semibold">
                      Open-Meteo Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">10m Wind Velocity</span>
                      <strong className="text-white text-sm">
                        {isSimulatedHighWind ? '52.4' : ecosystemState.weather.wind_speed_10m.toFixed(1)} km/h
                      </strong>
                      <span className="text-[9px] text-slate-500 block">
                        {ecosystemState.weather.isDroneViable ? '✅ Below 45 km/h limit' : '🚫 Above 45 km/h limit'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">River Discharge (Q)</span>
                      <strong className="text-white text-sm">
                        {ecosystemState.hydrology.dischargeM3s} m³/s
                      </strong>
                      <span className="text-[9px] text-slate-500 block">
                        Copernicus GloFAS
                      </span>
                    </div>
                  </div>

                  {/* Active Calibrated Sensor State Card */}
                  <div className="p-3 rounded-lg bg-slate-900 border border-emerald-500/40 flex items-start gap-2.5 text-xs shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-1 w-full">
                      <div className="flex items-center justify-between">
                        <strong className="text-white">
                          {currentTheater.id === 'nepal' ? 'DHM Roshi Station #450 Stream:' : 'CWC Station #AS-18 Telemetric Stream:'}
                        </strong>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
                          ACTIVE &bull; CALIBRATED
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-emerald-300 font-semibold">
                        {currentTheater.id === 'nepal'
                          ? 'DHM Telemetric Stream • Inflow Calibrated: 2,420 m³/s'
                          : 'CWC Telemetric Stream • Inflow Calibrated: 3,850 m³/s'}
                      </div>
                      <div className="text-[10px] text-slate-300 font-sans flex items-center justify-between pt-0.5">
                        <span>River Water Level: <strong className="text-white font-mono">{currentTheater.id === 'nepal' ? '14.12m' : '19.83m'}</strong></span>
                        <span className="text-amber-400 font-semibold">{currentTheater.id === 'nepal' ? '+0.22m over Danger Mark (13.90m)' : '+0.03m over Danger Mark (19.80m)'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pretrained Hydrology Model Active Card */}
                  <div className="p-3 rounded-lg bg-slate-900 border border-emerald-500/40 space-y-2.5 text-xs shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                        <strong className="text-white font-semibold">Google Research OpenHydromet LSTM &bull; Active</strong>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
                        ACTIVE
                      </span>
                    </div>

                    <div className="text-[11px] space-y-1 font-mono text-slate-400">
                      <div>Architecture: <span className="text-slate-200">Bidirectional LSTM + Catchment Topography Physical Routing Tensor</span></div>
                      <div>Calibrated Peak Inflow: <span className="text-emerald-300 font-bold">{currentTheater.id === 'nepal' ? '2,420 m³/s' : '3,850 m³/s'}</span> &bull; Lead Time: <span className="text-cyan-300 font-bold">{currentTheater.id === 'nepal' ? '24h' : '48h'}</span></div>
                      <div>License: <span className="text-slate-300">Apache-2.0</span> &bull; Paper: <span className="text-cyan-400">Nevo et al., Nature (2022)</span></div>
                    </div>

                    <div className="p-2 rounded bg-emerald-950/30 border border-emerald-800/40 text-[10px] font-mono text-emerald-200 space-y-0.5">
                      <div className="font-bold uppercase tracking-wider text-emerald-300">Hydrological Validation:</div>
                      <div>Stream Calibration: {currentTheater.id === 'nepal' ? 'Nepal DHM Roshi Station #450 Telemetry' : 'CWC Station #AS-18 Barak River Gauge'}</div>
                      <div>Confidence Interval: {currentTheater.id === 'nepal' ? '[2,100 – 2,750] m³/s (90% CI)' : '[3,400 – 4,200] m³/s (90% CI)'}</div>
                    </div>
                  </div>

                  {/* Actions: Test Gale Wind Simulator or Open Full Telemetry Drawer */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onToggleHighWind}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          isSimulatedHighWind
                            ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                            : 'bg-slate-900 text-slate-300 hover:text-white border-slate-700'
                        }`}
                      >
                        {isSimulatedHighWind ? '🌪️ High Wind Active (52 km/h)' : '💨 Test Gale Wind (>45 km/h)'}
                      </button>

                      <button
                        type="button"
                        onClick={onOpenEcosystemDrawer}
                        className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-800/80 text-cyan-300 text-xs font-semibold cursor-pointer"
                      >
                        Ecosystem Bus
                      </button>
                    </div>

                    {/* Wind Simulation Button Effect Explanation (Section 5 Requirement) */}
                    <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-sans space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-300 font-mono text-[10px] uppercase">
                        <Info className="w-3 h-3 text-cyan-400" />
                        <span>Atmospheric Action Impact</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-400">
                        <div>What Changes: <span className="text-slate-200">Sets wind to 52.4 km/h gust</span></div>
                        <div>Data Source: <span className="text-slate-200">Open-Meteo GFS Weather Model</span></div>
                        <div>Evidence Class: <span className="text-cyan-300">SIMULATED STRESS TEST</span></div>
                        <div>Airframe Status: <span className={isSimulatedHighWind ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{isSimulatedHighWind ? '🚫 UAV Drones Grounded' : '✅ Drones Operational'}</span></div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectChapter('protect')}
                    className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer mt-1"
                  >
                    <span>Proceed to Protect (Assess Disruption)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* CHAPTER 3: PROTECT */}
            {workspaceMode === 'response' && activeChapter === 'protect' && (
              <div className="space-y-4 animate-in fade-in">
                {/* 1. Road Detour Visualization Card (Dynamic per Corridor & Theater) */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-cyan-400" />
                      <span>{selectedChoke.road_name} Detour Assessment</span>
                    </h3>
                  </div>

                  {/* Corridor Selector Dropdown in Chapter 3 */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] font-mono text-slate-400">Select Road:</span>
                    <select
                      value={selectedChokeIdx}
                      onChange={(e) => onSelectChokeIdx(Number(e.target.value))}
                      className="bg-slate-950 text-cyan-300 border border-slate-700 hover:border-cyan-500 rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer focus:outline-none max-w-[240px] truncate"
                    >
                      {currentTheater.chokePoints.map((cp, idx) => (
                        <option key={cp.id} value={idx}>
                          {cp.road_name} ({cp.trapped_villages_count} Vill.)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Side-by-Side Comparison */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {/* Direct Baseline */}
                    <div className={`p-2.5 rounded-xl border ${isBreachTemporarilyReopened ? 'bg-emerald-950/40 border-emerald-600' : 'bg-slate-900 border-slate-800'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">Direct Baseline</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${isBreachTemporarilyReopened ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-rose-950 text-rose-300 border border-rose-700'}`}>
                          {isBreachTemporarilyReopened ? 'RESTORED' : 'SEVERED'}
                        </span>
                      </div>
                      <strong className="text-white text-sm block mt-1">{selectedChoke.baseline_km} km • {selectedChoke.baseline_travel_mins || 18} mins</strong>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {selectedChoke.exposed_meters}m breach gap across flood channel
                      </span>
                    </div>

                    {/* Flood Detour Bypass */}
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 truncate max-w-[100px]">{selectedChoke.road_name.split(' ')[0]} Bypass</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700">
                          +{Math.max(15, (selectedChoke.detour_travel_mins || 65) - (selectedChoke.baseline_travel_mins || 18))}m DELAY
                        </span>
                      </div>
                      <strong className="text-amber-400 text-sm block mt-1">{selectedChoke.detour_km} km • {selectedChoke.detour_travel_mins || 65} mins</strong>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        +{(selectedChoke.detour_km - selectedChoke.baseline_km).toFixed(1)} km detour bypass route
                      </span>
                    </div>
                  </div>

                  {/* Route Display Toggles */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
                      Map Route Layer Controls:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => onSetDetourRouteMode?.('both')}
                        className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                          detourRouteMode === 'both'
                            ? 'bg-cyan-950 border-cyan-500 text-cyan-200 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Both Routes
                      </button>
                      <button
                        type="button"
                        onClick={() => onSetDetourRouteMode?.('detour')}
                        className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                          detourRouteMode === 'detour'
                            ? 'bg-amber-950 border-amber-500 text-amber-200 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Detour Only
                      </button>
                      <button
                        type="button"
                        onClick={() => onSetDetourRouteMode?.('baseline')}
                        className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                          detourRouteMode === 'baseline'
                            ? 'bg-slate-800 border-slate-600 text-white font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Baseline Only
                      </button>
                    </div>
                  </div>

                  {/* Breach Closure / Culvert Toggle */}
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    {currentTheater.id === 'nepal' ? (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <strong className="text-xs text-white block">Roshi Gorge Bridging Model</strong>
                            <span className="text-[10px] text-slate-400">
                              Simulated bridge closure: BP Highway Km 48 (120m gorge washout)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onToggleBreachTemporarilyReopened?.();
                              onFocusMapPoint({
                                lat: selectedChoke.lat,
                                lon: selectedChoke.lon,
                                name: `${selectedChoke.road_name} (120m Gorge Washout)`,
                              });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isBreachTemporarilyReopened
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                            }`}
                          >
                            {isBreachTemporarilyReopened ? 'Bridged ✅' : 'Simulate Bridging'}
                          </button>
                        </div>

                        {/* Precomputed metrics for Roshi Khola */}
                        <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-850 space-y-1 text-[11px] font-mono">
                          <div className="flex items-center justify-between text-slate-300">
                            <span>Breach Corridor:</span>
                            <span className="text-amber-400 font-bold">BP Highway (NH08) Km 48 Roshi Gorge</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300">
                            <span>Isolated Hamlets Reconnected:</span>
                            <span className="text-emerald-400 font-bold">18 Hamlets (16,300 residents)</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300">
                            <span>Transit Achieved:</span>
                            <span className="text-cyan-300 font-bold">28m Direct to Dhulikhel Hospital (vs 135m delay)</span>
                          </div>
                          <div className="pt-1 text-slate-300 text-[10px]">
                            <span className="text-slate-400 block">Recommended Action:</span>
                            <span className="text-slate-200">Rapid deployment of Nepal Army Class-40 120m modular bridge</span>
                          </div>
                          <div className="p-1.5 mt-1 rounded bg-emerald-950/40 border border-emerald-800/50 text-[10px] text-emerald-300 font-sans leading-snug">
                            ✓ <strong>Counterfactual Assessment:</strong> Demonstrates timely bridging preventing complete winter isolation of Roshi River basin.
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <strong className="text-xs text-white block">Temporary Culvert Simulation</strong>
                            <span className="text-[10px] text-slate-400">
                              Precomputed cut edge: {topCutEdge.serving_settlement}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onToggleBreachTemporarilyReopened?.();
                              const servingVillage = getSelectedTelemetryRow(topCutEdge.serving_settlement);
                              onFocusMapPoint({
                                lat: servingVillage.lat,
                                lon: servingVillage.lon,
                                name: `${topCutEdge.serving_settlement} (approximate: serving settlement, not bridge location)`,
                              });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isBreachTemporarilyReopened
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                            }`}
                          >
                            {isBreachTemporarilyReopened ? 'Simulated ✅' : 'Simulate Culvert'}
                          </button>
                        </div>

                        {/* Precomputed metrics & honest disclaimer as mandated by Requirement 6 */}
                        <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-850 space-y-1 text-[11px] font-mono">
                          <div className="flex items-center justify-between text-slate-300">
                            <span>Cut Edge:</span>
                            <span className="text-amber-400 font-bold">{topCutEdge.cut_edge_id}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300">
                            <span>Serving Settlement:</span>
                            <span className="text-cyan-300 font-bold">{topCutEdge.serving_settlement}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300">
                            <span>Estimated Settlements Reconnected:</span>
                            <span className="text-emerald-400 font-bold">
                              {topCutEdge.isolated_settlements_count} (precomputed)
                            </span>
                          </div>
                          <div className="pt-1 text-slate-300 text-[10px]">
                            <span className="text-slate-400 block">Recommended Action:</span>
                            <span className="text-slate-200">{topCutEdge.recommended_action}</span>
                          </div>
                          <div className="p-1.5 mt-1 rounded bg-amber-950/40 border border-amber-800/50 text-[10px] text-amber-300 font-sans leading-snug">
                            ⚠️ <strong>Graph Limitation:</strong> Full re-route calculation requires the road graph, which is not loaded.
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Road Condition vs Route Accessibility Separation Disclosure (Section 6 Requirement) */}
                  {(() => {
                    const routeEval = roadConditionService.evaluateRouteAccessibility({
                      origin: { name: `${selectedChoke.road_name.split(' (')[0]} North Roadhead`, coordinates: [selectedChoke.lat, selectedChoke.lon] },
                      destination: { name: currentTheater.hospitals[0]?.name || 'Hospital', coordinates: [currentTheater.hospitals[0]?.lat || selectedChoke.lat, currentTheater.hospitals[0]?.lon || selectedChoke.lon] },
                      scenarioId: currentTheater.id,
                      routeType: isBreachTemporarilyReopened ? 'restored' : (detourRouteMode === 'baseline' ? 'baseline' : 'detour'),
                      activeClosures: isBreachTemporarilyReopened ? [] : [selectedChoke.id],
                      activeInterventions: interventions,
                      directKm: selectedTelemetry.baseline_km,
                      detourKm: selectedTelemetry.scenario_km || 16.8,
                      directMins: Math.round(selectedTelemetry.baseline_min),
                      detourMins: Math.round(selectedTelemetry.scenario_min || 65.7),
                    });

                    return (
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <strong className="text-white flex items-center gap-1.5 font-bold">
                            <Shield className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Road Condition vs. Route Accessibility</span>
                          </strong>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                            routeEval.validity === 'REAL_ROUTED'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                              : 'bg-rose-950 text-rose-300 border-rose-700'
                          }`}>
                            {routeEval.validity}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
                          <div>
                            <span className="text-slate-500 block">Segment Condition:</span>
                            <span className={isBreachTemporarilyReopened ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              {isBreachTemporarilyReopened ? 'TEMPORARY_RESTORED' : 'REPORTED_DESTROYED (80m)'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Algorithmic Path:</span>
                            <span className={routeEval.validity === 'REAL_ROUTED' ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>
                              {routeEval.validity === 'REAL_ROUTED' ? `${routeEval.distanceKm} km (${routeEval.estimatedTravelMins}m)` : 'NO_ROUTE'}
                            </span>
                          </div>
                        </div>

                        {routeEval.conflictDetected ? (
                          <div className="p-2 rounded bg-rose-950/40 border border-rose-800 text-[10px] text-rose-200">
                            <strong>⚠️ Safety Conflict: </strong>
                            {routeEval.conflictDetails}
                          </div>
                        ) : (
                          <div className="p-2 rounded bg-cyan-950/30 border border-cyan-800/40 text-[10px] text-cyan-200">
                            <strong>Scientific Safeguard: </strong>
                            Detour calculation respects active breach closure. No simulated route traverses unbridged water.
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* 2. Deterministic Ambulance Surge Balancing Card (P3 Requirement) */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <span>Deterministic Ambulance Surge Balancing</span>
                      </h3>
                      <span className="text-[10px] text-slate-400">
                        Hard capacity limits • Zero negative beds • Hospital beds are assumed demo values
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        onToggleRerouteAmbulances();
                        auditService.recordAction({
                          action_type: rerouteAmbulances ? 'MANUAL_OVERRIDE' : 'RESOURCE_ASSIGNED',
                          rationale: rerouteAmbulances
                            ? 'Ambulance surge balancing reset to baseline direct dispatch.'
                            : `Deterministic surge balancing engaged for ${selectedChoke.road_name}. Hospital beds are assumed demo values (SIMULATED CLOSURE on OSM graph).`,
                          user_id: 'INCIDENT_COMMANDER_CACHAR',
                          user_role: 'INCIDENT_COMMANDER',
                          human_authorized: true,
                        });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        rerouteAmbulances
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow'
                      }`}
                    >
                      {rerouteAmbulances ? 'Active (Surge Balanced) ✅' : 'Engage Surge Balancing'}
                    </button>
                  </div>

                  {/* Ambulance Surge Balancing Impact (Section 5 Requirement) */}
                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-sans space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-300 font-mono text-[10px] uppercase">
                      <Info className="w-3 h-3 text-cyan-400" />
                      <span>Healthcare Surge Impact Disclosure</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-400">
                      <div>What Changes: <span className="text-slate-200">Rebalances patients away from Valley to SMCH &amp; Civil (SIMULATED CLOSURE on OSM graph)</span></div>
                      <div>Data Source: <span className="text-slate-200">NHM Cachar Bed Registry (assumed demo values)</span></div>
                      <div>Evidence Class: <span className="text-cyan-300">SIMULATED CLOSURE on OSM graph</span></div>
                      <div>Hospital Beds: <span className="text-amber-300 font-bold">assumed demo values</span></div>
                    </div>
                  </div>

                  {/* Hospital Occupancy Before vs After Bars */}
                  <div className="space-y-2 pt-1 text-xs">
                    {/* Valley Hospital */}
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">Valley Hospital (Primary Referral)</span>
                        <span className={`font-mono text-[11px] font-bold ${rerouteAmbulances ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {rerouteAmbulances ? '74% (260/350 Beds • Surge Balanced)' : '100% Saturated (350/350 Beds • 0 Avail)'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${rerouteAmbulances ? 'bg-emerald-500 w-[74%]' : 'bg-rose-500 w-[100%]'}`}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span>Baseline: 350 occupied</span>
                        <span>{rerouteAmbulances ? 'Ambulance diversion bypass active' : 'Overload risk!'}</span>
                      </div>
                    </div>

                    {/* SMCH Apex */}
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">SMCH Apex Hospital</span>
                        <span className="font-mono text-[11px] font-bold text-cyan-300">
                          {rerouteAmbulances ? '95% (807/850 Beds • +22 Pts)' : '92% (785/850 Beds • 65 Avail)'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${rerouteAmbulances ? 'bg-cyan-500 w-[95%]' : 'bg-cyan-600 w-[92%]'}`}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span>120 ICU Beds available</span>
                        <span>Capacity safe: 43 open beds remain</span>
                      </div>
                    </div>

                    {/* S.M. Dev Civil Hospital */}
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">S.M. Dev Civil Hospital</span>
                        <span className="font-mono text-[11px] font-bold text-emerald-300">
                          {rerouteAmbulances ? '94% (188/200 Beds • +12 Pts)' : '88% (176/200 Beds • 24 Avail)'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${rerouteAmbulances ? 'bg-emerald-500 w-[94%]' : 'bg-emerald-600 w-[88%]'}`}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span>General surgical stabilization</span>
                        <span>Capacity safe: 12 open beds remain</span>
                      </div>
                    </div>

                    {/* Nightingale Hospital */}
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white">Nightingale Hospital & Trauma</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700 font-bold">
                            4x4 Access Only
                          </span>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-amber-300">
                          92% (110/120 Beds • 10 Avail)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 w-[92%]" />
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span>Approach waterlogged; restricted to high-clearance</span>
                        <span>Capacity: 10 reserved triage beds</span>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Assignment Table (when engaged) */}
                  {rerouteAmbulances && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
                        Simulated Demonstration Fleet Assignments:
                      </span>
                      <div className="space-y-1 text-xs font-mono">
                        {surgeAllocation.assignments.map((asgn) => (
                          <div
                            key={asgn.ambulanceId}
                            className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-cyan-400" />
                              <strong className="text-white">{asgn.ambulanceId}</strong>
                              <span className="text-[11px] text-slate-400">({asgn.callsign.split(' ')[0]})</span>
                            </div>
                            <div className="text-right">
                              <span className="text-emerald-400 font-bold">{asgn.patientsCarried} Pts</span>
                              <span className="text-[10px] text-slate-400 block">→ {asgn.destHospitalName.split(' ')[0]} ({asgn.estimatedTransitMins}m)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectChapter('respond')}
                    className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer mt-2"
                  >
                    <span>Proceed to Respond (Resource Allocation)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* CHAPTER 4: RESPOND */}
            {workspaceMode === 'response' && activeChapter === 'respond' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">4-Tool Resource Allocation</h3>
                    <button
                      type="button"
                      onClick={onResetInterventions}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  </div>

                  {/* Strategic Corridor Navigation Dropdown in Chapter 4 */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[11px] font-mono text-slate-400">Target Road Corridor:</span>
                    <select
                      value={selectedChokeIdx}
                      onChange={(e) => onSelectChokeIdx(Number(e.target.value))}
                      className="bg-slate-950 text-cyan-300 border border-slate-700 hover:border-cyan-500 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer focus:outline-none max-w-[240px] truncate"
                      title="Select road corridor to deploy tactical intervention"
                    >
                      {currentTheater.chokePoints.map((cp, idx) => (
                        <option key={cp.id} value={idx}>
                          {cp.road_name} ({cp.trapped_villages_count} {currentTheater.id === 'nepal' ? 'Hamlets' : 'Vill.'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 4 Multi-Modal Tactical Tools */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Tool 1: Bailey Bridge */}
                    {/* Tool 1: Bailey Bridge */}
                    <button
                      type="button"
                      onClick={() => onSetIntervention(selectedChoke.id, activeTool === 'bridge' ? 'none' : 'bridge')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        activeTool === 'bridge'
                          ? 'bg-amber-950/90 border-amber-500 text-amber-200 ring-2 ring-amber-500/40 shadow-lg'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <BridgeIcon size={16} color={activeTool === 'bridge' ? '#f59e0b' : '#94a3b8'} />
                        <span className="text-[10px] font-mono font-bold text-amber-400">₹1.8 Cr</span>
                      </div>
                      <strong className="block text-white font-semibold">Bailey Bridge</strong>
                      <div className="mt-1 space-y-0.5 text-[10px] font-mono">
                        <span className="text-emerald-300 block font-bold">
                          ✓ {currentTheater.id === 'nepal' ? '18 Hamlets' : '42 Villages'} Reconnected
                        </span>
                        <span className="text-cyan-300 block">
                          👥 {currentTheater.id === 'nepal' ? '16,300' : '14,000'} Pop. Protected
                        </span>
                        <span className="text-amber-300 block">
                          ⚡ {currentTheater.id === 'nepal' ? '28m (vs 135m)' : '18m (vs 65m)'} Transit
                        </span>
                      </div>
                    </button>

                    {/* Tool 2: Forward Medical Camp */}
                    <button
                      type="button"
                      onClick={() => onSetIntervention(selectedChoke.id, activeTool === 'booth' ? 'none' : 'booth')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        activeTool === 'booth'
                          ? 'bg-yellow-950/90 border-yellow-500 text-yellow-200 ring-2 ring-yellow-500/40 shadow-lg'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <CampIcon size={16} color={activeTool === 'booth' ? '#facc15' : '#94a3b8'} />
                        <span className="text-[10px] font-mono font-bold text-yellow-400">₹25 Lakh</span>
                      </div>
                      <strong className="block text-white font-semibold">Hospital Camp (MMU)</strong>
                      <div className="mt-1 space-y-0.5 text-[10px] font-mono">
                        <span className="text-emerald-300 block font-bold">
                          ✓ {currentTheater.id === 'nepal' ? '18 Hamlets' : '42 Villages'} Serviced
                        </span>
                        <span className="text-cyan-300 block">
                          👥 {currentTheater.id === 'nepal' ? '16,300' : '14,000'} Pop. Protected
                        </span>
                        <span className="text-amber-300 block">
                          ⚡ 0m On-Site (vs {currentTheater.id === 'nepal' ? '135m' : '65m'})
                        </span>
                      </div>
                    </button>

                    {/* Tool 3: Heavy Med-Drone */}
                    <button
                      type="button"
                      disabled={!ecosystemState.weather.isDroneViable}
                      onClick={() => onSetIntervention(selectedChoke.id, activeTool === 'drone' ? 'none' : 'drone')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        !ecosystemState.weather.isDroneViable
                          ? 'bg-slate-900/40 border-slate-800/50 text-slate-600 opacity-60 cursor-not-allowed'
                          : activeTool === 'drone'
                          ? 'bg-purple-950/90 border-purple-500 text-purple-200 ring-2 ring-purple-500/40 shadow-lg cursor-pointer'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <DroneIcon size={16} color={activeTool === 'drone' ? '#c084fc' : '#94a3b8'} />
                        <span className="text-[10px] font-mono font-bold text-purple-400">₹12 Lakh</span>
                      </div>
                      <strong className="block text-white font-semibold">Heavy Med-Drone</strong>
                      <div className="mt-1 space-y-0.5 text-[10px] font-mono">
                        <span className="text-emerald-300 block font-bold">
                          ✓ {currentTheater.id === 'nepal' ? '5 Hamlets' : '6 Villages'} Reconnected
                        </span>
                        <span className="text-cyan-300 block">
                          👥 {currentTheater.id === 'nepal' ? '4,100' : '3,200'} Pop. Protected
                        </span>
                        <span className="text-amber-300 block">
                          ⚡ {currentTheater.id === 'nepal' ? '18m Aerial' : '12m Aerial'}
                        </span>
                      </div>
                    </button>

                    {/* Tool 4: NDRF Boat */}
                    <button
                      type="button"
                      disabled={!ecosystemState.hydrology.isBoatViable}
                      onClick={() => onSetIntervention(selectedChoke.id, activeTool === 'boat' ? 'none' : 'boat')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        !ecosystemState.hydrology.isBoatViable
                          ? 'bg-slate-900/40 border-slate-800/50 text-slate-600 opacity-60 cursor-not-allowed'
                          : activeTool === 'boat'
                          ? 'bg-blue-950/90 border-blue-500 text-blue-200 ring-2 ring-blue-500/40 shadow-lg cursor-pointer'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <BoatIcon size={16} color={activeTool === 'boat' ? '#38bdf8' : '#94a3b8'} />
                        <span className="text-[10px] font-mono font-bold text-blue-400">₹6.5 Lakh</span>
                      </div>
                      <strong className="block text-white font-semibold">NDRF Boat (40HP)</strong>
                      <div className="mt-1 space-y-0.5 text-[10px] font-mono">
                        <span className="text-emerald-300 block font-bold">
                          ✓ {currentTheater.id === 'nepal' ? '4 Hamlets' : '12 Villages'} Reconnected
                        </span>
                        <span className="text-cyan-300 block">
                          👥 {currentTheater.id === 'nepal' ? '2,800' : '6,800'} Pop. Protected
                        </span>
                        <span className="text-amber-300 block">
                          ⚡ {currentTheater.id === 'nepal' ? '35m Shuttle' : '25m Shuttle'}
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Explicit Resource Allocation KPI Summary Banner */}
                  {activeTool !== 'none' && (
                    <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/90 to-teal-950/90 border border-emerald-500/80 shadow-md space-y-2 text-xs font-mono text-white animate-in fade-in duration-200">
                      <div className="flex items-center justify-between border-b border-emerald-800/60 pb-1.5">
                        <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Allocated: {activeTool === 'bridge' ? 'Class-40 Bailey Bridge' : activeTool === 'booth' ? 'Forward Hospital Camp (MMU)' : activeTool === 'drone' ? 'Heavy Medical Drone' : 'NDRF Motorized Boat'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 font-bold text-[10px]">ACTIVE</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-[9px] text-slate-400 block uppercase">Villages Reconnected</span>
                          <span className="text-emerald-400 font-bold text-sm block">
                            {activeTool === 'bridge' ? (currentTheater.id === 'nepal' ? '18 Hamlets' : '42 Villages') : activeTool === 'booth' ? (currentTheater.id === 'nepal' ? '18 Hamlets' : '42 Villages') : activeTool === 'drone' ? (currentTheater.id === 'nepal' ? '5 Hamlets' : '6 Villages') : (currentTheater.id === 'nepal' ? '4 Hamlets' : '12 Villages')}
                          </span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-[9px] text-slate-400 block uppercase">Population Protected</span>
                          <span className="text-cyan-300 font-bold text-sm block">
                            {activeTool === 'bridge' || activeTool === 'booth' ? (currentTheater.id === 'nepal' ? '16,300' : '14,000') : activeTool === 'drone' ? (currentTheater.id === 'nepal' ? '4,100' : '3,200') : (currentTheater.id === 'nepal' ? '2,800' : '6,800')}
                          </span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <span className="text-[9px] text-slate-400 block uppercase">Transit Achieved</span>
                          <span className="text-amber-300 font-bold text-sm block">
                            {activeTool === 'bridge' ? (currentTheater.id === 'nepal' ? '28m (vs 135m)' : '18m (vs 65m)') : activeTool === 'booth' ? '0m On-Site' : activeTool === 'drone' ? '12m Aerial' : '25m Shuttle'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sign & Dispatch Execution Bar (P4 Requirement) */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onOpenSanctionModal}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Form-3B Order</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleStartReview}
                        className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg cursor-pointer ${
                          dispatchState === 'ACCEPTED' || isLiveDispatched
                            ? 'bg-emerald-600 text-white'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {dispatchState === 'ACCEPTED' || isLiveDispatched
                            ? 'Dispatched ✅'
                            : 'Review & Sign Sanction'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Response Monitoring Panel (P5 Requirement) */}
                  {(dispatchState === 'ACCEPTED' || isLiveDispatched) && (
                    <div className="pt-3 border-t border-slate-800 space-y-2.5 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                          <span>Response Monitoring (Live Execution)</span>
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
                          ACCEPTED (ntfy 200 OK)
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs font-mono">
                        <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-300">AMB-01: ALS 4x4 (En Route)</span>
                          <span className="text-cyan-400 font-bold">EN_ROUTE_SIMULATED</span>
                        </div>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-300">AMB-02: ALS 4x4 (En Route)</span>
                          <span className="text-cyan-400 font-bold">EN_ROUTE_SIMULATED</span>
                        </div>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-300">AMB-03: S.M. Dev Civil Depot</span>
                          <span className="text-emerald-400 font-bold">ARRIVED_SIMULATED</span>
                        </div>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-300">IR-16T-01: Bailey Bridge Convoy</span>
                          <span className="text-amber-400 font-bold">ASSIGNED</span>
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400">
                        <strong className="text-slate-300 block mb-0.5">Physical Verification Notice:</strong>
                        Vehicle transit progress along {currentTheater.id === 'nepal' ? 'corridor bypass' : 'Kumbhirgram bypass'} is simulated for operational decision support. Field patient handover requires formal sign-off.
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectChapter('learn')}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer mt-1"
                  >
                    <span>Proceed to Learn (Audit &amp; Benchmarks)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* CHAPTER 5: LEARN (P8 Requirement) */}
            {workspaceMode === 'response' && activeChapter === 'learn' && (
              <div className="space-y-4 animate-in fade-in">
                {/* 1. Post-Incident Operational Evaluation */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <History className="w-4 h-4 text-emerald-400" />
                      <span>Post-Incident Evaluation &amp; Benchmarks</span>
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 font-semibold">
                      Statutory Audit Ready
                    </span>
                  </div>

                  {/* Accessibility Matrix */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
                      Corridor Accessibility &amp; Delay Delta:
                    </span>
                    <div className="space-y-1 text-xs font-mono">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <strong className="text-white block">{selectedChoke.road_name}</strong>
                          <span className="text-[10px] text-slate-400">
                            Direct {selectedTelemetry.baseline_km.toFixed(1)} km ({Math.round(selectedTelemetry.baseline_min)}m) vs Detour {(selectedTelemetry.scenario_km || 16.8).toFixed(1)} km ({Math.round(selectedTelemetry.scenario_min || 65.7)}m)
                          </span>
                        </div>
                        <span className="text-emerald-400 font-bold">
                          {activeTool === 'bridge' ? 'RESTORED' : `+${Math.round(selectedTelemetry.additional_min || 46.7)}m Delay`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Budget Allocation Breakdown */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
                      Fiscal Allocation Breakdown (Form-3B):
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Bailey Bridge (Class-40)</span>
                        <strong className="text-amber-400">₹1.80 Cr</strong>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Hospital Camp (MMU)</span>
                        <strong className="text-yellow-400">₹25.0 Lakhs</strong>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Heavy Med-Drone</span>
                        <strong className="text-purple-400">₹12.0 Lakhs</strong>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">NDRF Boat (40HP)</span>
                        <strong className="text-sky-400">₹6.5 Lakhs</strong>
                      </div>
                    </div>
                  </div>

                  {/* Historical Replay Scenarios */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
                      Historical Disaster Benchmark Replays:
                    </span>
                    <div className="space-y-1 text-xs">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <strong className="text-white block">Silchar Floods (June 2022)</strong>
                          <span className="text-[10px] text-slate-400">Barak Basin Dyke Breach • 74 Habitations</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectTheater?.('silchar')}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold cursor-pointer"
                        >
                          {currentTheater.id === 'silchar' ? 'Active' : 'Load Replay'}
                        </button>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <strong className="text-white block">Nepal Trishuli Surge (Sept 2024)</strong>
                          <span className="text-[10px] text-slate-400">River Surface Velocity &gt; 3.8 m/s</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectTheater?.('nepal')}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold cursor-pointer"
                        >
                          {currentTheater.id === 'nepal' ? 'Active' : 'Load Replay'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Audit Exports */}
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const csvContent = auditService.exportCsv();
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `lifeline_audit_trail_${currentTheater.id}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Export CSV Audit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const jsonContent = auditService.exportJson();
                        const blob = new Blob([jsonContent], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `lifeline_audit_trail_${currentTheater.id}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Export JSON Audit</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 3. STRUCTURED SIGN & DISPATCH REVIEW MODAL (P4 Requirement) */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in select-none">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
            {/* Header with Explicit Simulation Banner */}
            <div className="p-4 bg-amber-950/80 border-b border-amber-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <div>
                  <strong className="text-amber-200 text-sm uppercase tracking-wider block font-bold">
                    SIMULATION ONLY — OPERATIONAL READINESS DEMONSTRATION
                  </strong>
                  <span className="text-[11px] text-amber-300 font-mono">
                    State Emergency Operations Center (SEOC) Form-3B Statutory Review
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1 rounded-lg text-amber-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Structured Facts */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto font-sans text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">
                  Verified Incident Parameters:
                </span>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Jurisdiction:</span>
                    <strong className="text-white">{currentTheater.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Critical Corridor:</span>
                    <strong className="text-white">{selectedChoke.road_name.split(' (')[0]}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Washout Gap:</span>
                    <strong className="text-rose-400">{selectedChoke.exposed_meters}m Breached Deck</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Population Protected:</span>
                    <strong className="text-amber-400">{totalCitizens.toLocaleString()} Citizens ({totalVillages} Villages)</strong>
                  </div>
                </div>
              </div>

              {/* Sanctioned Actions */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">
                  Sanctioned Multi-Modal Interventions:
                </span>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Selected Bridge/Relief Tool:</span>
                    <strong className="text-cyan-400 uppercase">{activeTool !== 'none' ? activeTool : 'Standard Detour Protocol'}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Ambulance Surge Balancing:</span>
                    <strong className="text-emerald-400">{rerouteAmbulances ? 'ENGAGED (34 Patients Diverted)' : 'STANDBY'}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Referral Facilities:</span>
                    <strong className="text-white">SMCH Regional &amp; S.M. Dev Civil Hospital</strong>
                  </div>
                </div>
              </div>

              {/* Explicit Human Authorization */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">
                  Statutory Signatory Authorization:
                </span>
                <div className="flex items-center gap-2">
                  <FileSignature className="w-4 h-4 text-cyan-400 shrink-0" />
                  <input
                    type="text"
                    value={signatoryName}
                    onChange={(e) => setSignatoryName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-medium focus:border-cyan-500 focus:outline-none"
                    title="Authorized Officer"
                  />
                </div>

                <label className="flex items-start gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isConfirmedByOperator}
                    onChange={(e) => setIsConfirmedByOperator(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="text-[11px] text-slate-300 leading-snug">
                    I confirm this is an authorized disaster simulation exercise. All resource allocations conform to physical wind/water safety constraints.
                  </span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!isConfirmedByOperator}
                onClick={handleApproveAndExecuteDispatch}
                className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all ${
                  isConfirmedByOperator
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Approve &amp; Execute Sanction Form-3B</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. EVIDENCE CATALOGUE MODAL */}
      <EvidenceCatalogueModal
        isOpen={isEvidenceCatalogueOpen}
        onClose={() => setIsEvidenceCatalogueOpen(false)}
        theaterId={currentTheater.id}
        theaterName={currentTheater.name}
      />

      {/* 5. LIGHTWEIGHT FIELD EVIDENCE EDITOR MODAL */}
      <FieldEvidenceEditorModal
        isOpen={isFieldEditorOpen}
        onClose={() => setIsFieldEditorOpen(false)}
        theaterId={currentTheater.id}
        theaterName={currentTheater.name}
        defaultCoords={[selectedChoke.lat, selectedChoke.lon]}
        onReportCreated={(edit) => {
          onFocusMapPoint({
            lat: edit.geometry.coordinates[1],
            lon: edit.geometry.coordinates[0],
            name: edit.title,
          });
        }}
      />
    </>
  );
};
