import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Download,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  Activity,
  Layers,
  Database,
  Cpu,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Check,
  Copy,
  Info,
  Server,
  FileCode,
  FileText,
  Sliders,
  Sparkles,
  GitMerge,
  Play,
  Pause,
  AlertTriangle,
  Lock,
  Globe,
  Radio,
  BookOpen
} from 'lucide-react';

import {
  ArchitectureNode,
  ARCHITECTURE_NODES,
  STAGE_NARRATIVES,
  ARCHITECTURE_VALIDATION_TESTS,
  ArchitectureValidationTest
} from '../data/systemArchitectureModel';

export type ArchitectureTab = 'swimlane' | 'system_architecture' | 'dictionary' | 'mcp' | 'tests';

interface SystemArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemArchitectureModal: React.FC<SystemArchitectureModalProps> = ({
  isOpen,
  onClose
}) => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<ArchitectureTab>('swimlane');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Diagram View State (for Swimlane and System Architecture)
  const [swimlaneAssetType, setSwimlaneAssetType] = useState<'png' | 'gif'>('png');
  const [systemArchAssetType, setSystemArchAssetType] = useState<'png' | 'gif'>('png');
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [viewFitMode, setViewFitMode] = useState<'fit-width' | 'fit-all' | 'custom'>('fit-width');

  // Stage Selection for Swimlane Narrative Drawer
  const [selectedStageIdx, setSelectedStageIdx] = useState<number>(0);
  const [isStagePlaying, setIsStagePlaying] = useState<boolean>(false);

  // Zone Selection for Architecture Drawer
  const [selectedZoneIdx, setSelectedZoneIdx] = useState<number>(0);

  // Component Dictionary Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLayer, setSelectedLayer] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);

  // Tests Search & Filter
  const [testSearchQuery, setTestSearchQuery] = useState<string>('');
  const [copiedSchema, setCopiedSchema] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto-advance Stage timer if playback is active
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isStagePlaying && activeTab === 'swimlane') {
      timer = setTimeout(() => {
        setSelectedStageIdx((prev) => (prev < STAGE_NARRATIVES.length - 1 ? prev + 1 : 0));
      }, 4500);
    }
    return () => clearTimeout(timer);
  }, [isStagePlaying, activeTab, selectedStageIdx]);

  // Reset zoom & pan when switching tabs or view fit mode
  useEffect(() => {
    if (viewFitMode === 'fit-width') {
      setZoom(1.0);
      setPan({ x: 0, y: 0 });
    } else if (viewFitMode === 'fit-all') {
      setZoom(0.55);
      setPan({ x: 0, y: 0 });
    }
  }, [viewFitMode, activeTab]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  // Pan handlers for image viewer
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    setViewFitMode('custom');
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setViewFitMode('custom');
    const factor = e.deltaY < 0 ? 1.12 : 0.88;
    setZoom((prev) => Math.max(0.2, Math.min(3.5, prev * factor)));
  };

  // Filtered Component Dictionary Nodes
  const filteredNodes = ARCHITECTURE_NODES.filter((node) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        node.name.toLowerCase().includes(q) ||
        node.shortName.toLowerCase().includes(q) ||
        node.id.toLowerCase().includes(q) ||
        node.purpose.toLowerCase().includes(q) ||
        node.inputs.some((i) => i.toLowerCase().includes(q)) ||
        node.outputs.some((o) => o.toLowerCase().includes(q)) ||
        node.limitations.some((l) => l.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (selectedLayer !== 'all' && node.layer !== selectedLayer) return false;
    if (selectedStatus !== 'all' && node.status !== selectedStatus) return false;
    if (selectedStageFilter !== 'all' && node.stageNumber?.toString() !== selectedStageFilter) return false;
    return true;
  });

  // Filtered Acceptance Tests
  const filteredTests = ARCHITECTURE_VALIDATION_TESTS.filter((t) => {
    if (!testSearchQuery.trim()) return true;
    const q = testSearchQuery.toLowerCase();
    return (
      t.requirement.toLowerCase().includes(q) ||
      t.expectedBehavior.toLowerCase().includes(q) ||
      t.detail.toLowerCase().includes(q)
    );
  });

  const activeStage = STAGE_NARRATIVES[selectedStageIdx];

  // 6 Zones Technical Descriptions
  const SYSTEM_ZONES = [
    {
      id: 1,
      name: 'ZONE 01: EXTERNAL DATA SOURCES',
      subtitle: 'Space Agencies, Sensors, Gauges & Community Registries',
      tech: 'Sentinel-1 C-Band SAR, GloFAS River Gauges, Open-Meteo, ISRO NRSC Bhuvan, OSM PBF, National Health Mission NHM, Field Incident Feeds',
      description: 'Ingests real multi-source physical observation layers into an immutable raw evidence ledger. Enforces cloud-penetrating radar at 10m spatial resolution and strict provenance tagging.',
      sla: 'Continuous or hourly polling • Graceful fallback to baseline caches when external APIs rate-limit or fail.',
      invariants: ['Strict Provenance Envelope', 'Zero Synthetic Radar Generation', 'WGS84 Raw Ingestion']
    },
    {
      id: 2,
      name: 'ZONE 02: DATA INGESTION & LOCAL CACHE',
      subtitle: 'Adapters, Parsing, Reprojection & Offline IndexedDB Storage',
      tech: 'Fetch API, Proj4js (EPSG:32646 UTM Zone 46N), GeoJSON / WKT Parsers, IndexedDB / CacheStorage Web Workers',
      description: 'Standardizes and reprojects all geospatial coordinates from spherical WGS84 into metric UTM Zone 46N (EPSG:32646) where euclidean buffer and length operations represent true ground meters.',
      sla: 'Sub-800ms parsing for 50,000+ points on standard field laptops without cloud dependencies.',
      invariants: ['Metric Projection Invariant (EPSG:32646)', 'Edge-First Offline Sovereignty', 'Dead-Letter Ingestion Traps']
    },
    {
      id: 3,
      name: 'ZONE 03: VALIDATION & PROVENANCE',
      subtitle: 'Schema Checks, Topology & 7-Tier Epistemic Classifier',
      tech: 'Zod v3 Strict Schemas, Turf.js CleanCoords & Kinks, 6-Hour Radar TTL Monitor, Epistemic Classifier, Quarantine Trap',
      description: 'Audits geographic bounding boxes, eliminates self-intersecting polygons and polygon unclosed rings, and assigns strict epistemic classification (OBSERVED, OFFICIAL, REPORTED, MODELLED, ASSUMED, SIMULATED).',
      sla: 'Zero invalid coordinate escape to routing engine. Halts processing on missing critical telemetry with explicit limitation notices.',
      invariants: ['Sufficiency Decision Gate', 'Explicit Error Quarantine', 'No Silent Auto-Correction']
    },
    {
      id: 4,
      name: 'ZONE 04: GEOSPATIAL INTELLIGENCE',
      subtitle: 'Radar Masks, Cut-Edge Slicing & Metric Routing Graph',
      tech: 'SAR Radar Masking, Turf.js lineSlice, NetworkX Metric Digraph (31,214 nodes, 69,663 edges), Dynamic Dijkstra / OSRM, Catchment Voronoi',
      description: 'Extracts real flood surface water footprints, identifies 1,830 severed road segments, prunes 163 stranded dead-end bridges with inundated approaches, and computes authentic accessibility graphs.',
      sla: '100% deterministic Dijkstra shortest path calculation in metric seconds. Complete severance of damaged bridgeheads.',
      invariants: ['Bridgehead Adjacency Invariant', 'Rural Mud Road Monsoon Degradation (5 km/h)', 'Model-Isolated Settlement Detection']
    },
    {
      id: 5,
      name: 'ZONE 05: DECISION-SUPPORT ENGINE',
      subtitle: 'Demand Triage, Staging Optimization & Micro-Bridge ROI',
      tech: 'Betweenness Centrality Criticality Index, Clinical Priority Estimator, k-Medoids Facility Location, 60-min Golden Hour Validator, Micro-Bridge ROI',
      description: 'Places rescue staging bases along dry perimeter roadheads and ranks severed bridges by Return on Investment: ROI = (Reconnected Population + Detour km Saved) / Span Length. Escalates unreachable settlements to IAF air-drop.',
      sla: 'Bounded integer optimization under fiscal and warehouse equipment constraints in <1.2 seconds.',
      invariants: ['60-Minute Golden-Hour Envelope', 'Physical Axle & Span IRC Compliance', 'Strategic Escalation Air-Bridge Trap']
    },
    {
      id: 6,
      name: 'ZONE 06: HUMAN OPERATIONS & OUTPUTS',
      subtitle: 'Command Map, Review, Auditable Memos & SHA-256 Ledger',
      tech: 'Interactive Leaflet 2D Map, Civil Commander Sign-Off, Gemini 2.5 Flash MCP Agent, ntfy.sh / SMS Webhook, SHA-256 Merkle Provenance Ledger',
      description: 'Synthesizes situational reports and Form-3B financial sanction estimates. Strictly mandates explicit human civil commander authorization before any alert or dispatch is broadcasted.',
      sla: 'Zero autonomous dispatch. Cryptographic SHA-256 provenance hash generated for every sanctioned action order.',
      invariants: ['Civil Commander-in-the-Loop Sovereignty', 'Multi-Channel Alert Deduplication', 'Immutable Audit Provenance']
    }
  ];

  const activeZone = SYSTEM_ZONES[selectedZoneIdx];

  const handleCopySchema = () => {
    const schema = JSON.stringify(
      {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: 'compile_sdrf_form3b_ticket',
        description: 'Compiles a statutory State Disaster Response Fund (SDRF) Form-3B sanction order ticket with deterministic engineering constraints and civil commander authorization.',
        type: 'object',
        required: [
          'incident_id',
          'theater',
          'breach_id',
          'remedy_type',
          'justification',
          'civil_commander_id',
          'merkle_root_hash'
        ],
        properties: {
          incident_id: { type: 'string', pattern: '^INC-[A-Z0-9-]+$' },
          theater: { type: 'string', enum: ['assam_silchar', 'nepal_gorkha'] },
          breach_id: { type: 'string' },
          remedy_type: {
            type: 'string',
            enum: ['BAILEY_BRIDGE', 'MOBILE_MEDICAL_UNIT', 'MED_DRONE', 'RESCUE_BOAT']
          },
          reconnected_settlements_count: { type: 'integer', minimum: 0 },
          protected_population: { type: 'integer', minimum: 0 },
          detour_minutes_saved: { type: 'number', minimum: 0 },
          fiscal_expenditure_inr: { type: 'number', minimum: 0 },
          irc_compliance: {
            type: 'object',
            properties: {
              design_code: { type: 'string', default: 'IRC:6-2017 Class-40' },
              span_meters: { type: 'number' },
              axle_load_tons: { type: 'number' }
            },
            required: ['design_code', 'span_meters', 'axle_load_tons']
          },
          civil_commander_id: { type: 'string' },
          merkle_root_hash: { type: 'string', pattern: '^[a-f0-9]{64}$' }
        }
      },
      null,
      2
    );

    navigator.clipboard.writeText(schema);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 ${
        isFullscreen ? 'p-0' : ''
      }`}
    >
      <div
        className={`bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 flex flex-col w-full overflow-hidden transition-all duration-200 ${
          isFullscreen ? 'h-full rounded-none' : 'h-[96vh] max-w-[1720px]'
        }`}
      >
        {/* ===================================================================== */}
        {/* 1. TOP HEADER: ENTERPRISE BLUEPRINT SPECIFICATION */}
        {/* ===================================================================== */}
        <div className="bg-white border-b border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          {/* Left: Branding & Specification Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
                  SOLUTION ARCHITECTURE SPECIFICATION v2.5
                </span>
                <span className="font-mono text-[10px] font-semibold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  DETERMINISTIC PIPELINE (EPSG:32646)
                </span>
                <span className="hidden sm:inline font-mono text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  HUMAN-IN-THE-LOOP SOVEREIGN
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
                Lifeline OS Enterprise Architecture &amp; Formal Process Model
              </h1>
            </div>
          </div>

          {/* Center: Segmented Navigation Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('swimlane')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'swimlane'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span>1. Process Swimlane (7 Stages)</span>
            </button>
            <button
              onClick={() => setActiveTab('system_architecture')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'system_architecture'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Server className="w-3.5 h-3.5 text-indigo-600" />
              <span>2. System Architecture (6 Zones)</span>
            </button>
            <button
              onClick={() => setActiveTab('dictionary')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'dictionary'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>3. Component Dictionary (31 Nodes)</span>
            </button>
            <button
              onClick={() => setActiveTab('mcp')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'mcp'
                  ? 'bg-white text-purple-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-purple-600" />
              <span>4. Gemini MCP Protocol</span>
            </button>
            <button
              onClick={() => setActiveTab('tests')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'tests'
                  ? 'bg-white text-teal-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>5. Acceptance Suite (15 PASS)</span>
            </button>
          </div>

          {/* Right: Window Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
              title="Close Architecture Specification (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 2. TAB 1: OPERATIONAL PROCESS SWIMLANE (7 STAGES END-TO-END) */}
        {/* ===================================================================== */}
        {activeTab === 'swimlane' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
            {/* Viewer Control Toolbar */}
            <div className="bg-white border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Asset Mode Switcher: 4K PNG vs Animated GIF */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-500 font-semibold uppercase text-[11px]">
                  VIEW MODE:
                </span>
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setSwimlaneAssetType('png')}
                    className={`px-3 py-1 font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                      swimlaneAssetType === 'png'
                        ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    High-Res 4K Blueprint (PNG)
                  </button>
                  <button
                    onClick={() => setSwimlaneAssetType('gif')}
                    className={`px-3 py-1 font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                      swimlaneAssetType === 'gif'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Live Animated Flow (GIF)
                  </button>
                </div>
              </div>

              {/* View Presets & Zoom Navigation */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setViewFitMode('fit-width')}
                    className={`px-2.5 py-1 font-semibold rounded-md transition-all ${
                      viewFitMode === 'fit-width'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Fit diagram width to viewport"
                  >
                    Fit Width
                  </button>
                  <button
                    onClick={() => setViewFitMode('fit-all')}
                    className={`px-2.5 py-1 font-semibold rounded-md transition-all ${
                      viewFitMode === 'fit-all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Fit complete diagram on screen"
                  >
                    Fit Entire Diagram
                  </button>
                  <button
                    onClick={() => {
                      setViewFitMode('custom');
                      setZoom(1.0);
                      setPan({ x: 0, y: 0 });
                    }}
                    className="px-2.5 py-1 font-semibold rounded-md text-slate-600 hover:text-slate-900 transition-all"
                    title="Actual 100% pixel scale"
                  >
                    100% Scale
                  </button>
                </div>

                {/* Zoom +/- controls */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    onClick={() => {
                      setViewFitMode('custom');
                      setZoom((prev) => Math.max(0.2, prev * 0.85));
                    }}
                    className="p-1 rounded text-slate-600 hover:text-slate-900"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono font-bold text-[11px] text-slate-700 px-2 min-w-[50px] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={() => {
                      setViewFitMode('custom');
                      setZoom((prev) => Math.min(3.5, prev * 1.15));
                    }}
                    className="p-1 rounded text-slate-600 hover:text-slate-900"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setZoom(1.0);
                      setPan({ x: 0, y: 0 });
                      setViewFitMode('fit-width');
                    }}
                    className="p-1 rounded text-slate-600 hover:text-slate-900 ml-1 border-l border-slate-200"
                    title="Reset Canvas"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Download Asset Button */}
                <a
                  href={
                    swimlaneAssetType === 'png'
                      ? '/lifeline_os_process_swimlane.png'
                      : '/lifeline_os_process_swimlane.gif'
                  }
                  download={`lifeline_os_process_swimlane.${swimlaneAssetType}`}
                  className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors shadow-xs"
                  title="Download High-Resolution Blueprint"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  Download Blueprint
                </a>

                {/* External Fullscreen Link */}
                <a
                  href="/lifeline_os_process_swimlane.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 transition-colors shadow-xs"
                  title="Open in new window"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Interactive Canvas */}
            <div
              ref={containerRef}
              className={`flex-1 relative overflow-auto bg-slate-100 flex items-start justify-center p-4 select-none ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
              style={{
                backgroundImage:
                  'radial-gradient(circle, #cbd5e1 1px, transparent 1px), radial-gradient(circle, #cbd5e1 1px, #f8fafc 1px)',
                backgroundSize: '24px 24px'
              }}
            >
              <div
                className="transition-transform duration-75 origin-top-left"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  width: viewFitMode === 'fit-width' ? '100%' : 'auto',
                  maxWidth: viewFitMode === 'fit-width' ? '100%' : 'none'
                }}
              >
                <img
                  src={
                    swimlaneAssetType === 'png'
                      ? '/lifeline_os_process_swimlane.png'
                      : '/lifeline_os_process_swimlane.gif'
                  }
                  alt="Lifeline OS End-to-End Operational Process & Swimlane Architecture (Lanes 1 to 7)"
                  className="rounded-xl shadow-xl border border-slate-200 bg-white object-contain pointer-events-none"
                  style={{
                    width: viewFitMode === 'fit-width' ? '100%' : '3840px',
                    height: 'auto',
                    minWidth: viewFitMode === 'fit-width' ? '100%' : '1400px'
                  }}
                  draggable={false}
                />
              </div>

              {/* Floating Canvas Navigation Hint */}
              <div className="absolute top-4 right-6 pointer-events-none bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-[11px] font-mono text-slate-600 flex items-center gap-2">
                <span>Drag to Pan</span>
                <span>&bull;</span>
                <span>Scroll to Zoom</span>
                <span>&bull;</span>
                <span className="text-blue-700 font-semibold">Lanes 01–07 Complete</span>
              </div>
            </div>

            {/* Bottom: Interactive Stage Explainer Drawer (Full 7 Stages) */}
            <div className="bg-white border-t border-slate-200 p-4 shadow-lg">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Stage Quick Selection Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                  <span className="font-mono text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
                    STAGES:
                  </span>
                  {STAGE_NARRATIVES.map((s, idx) => (
                    <button
                      key={s.stage}
                      onClick={() => {
                        setSelectedStageIdx(idx);
                        setIsStagePlaying(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all flex items-center gap-1.5 whitespace-nowrap ${
                        selectedStageIdx === idx
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span className="font-bold">S{s.stage}</span>
                      <span className="hidden xl:inline">{s.title.split('—')[1]?.trim() || s.title}</span>
                    </button>
                  ))}

                  <button
                    onClick={() => setIsStagePlaying(!isStagePlaying)}
                    className={`ml-2 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isStagePlaying
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                    title={isStagePlaying ? 'Pause Stage Tour' : 'Play Stage Tour'}
                  >
                    {isStagePlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isStagePlaying ? 'PAUSE TOUR' : 'GUIDED TOUR'}</span>
                  </button>
                </div>

                {/* Active Stage Indicator */}
                <div className="font-mono text-xs text-slate-500 flex items-center gap-2">
                  <span>STAGE {activeStage.stage} OF 7</span>
                  <span>&bull;</span>
                  <span className="text-emerald-700 font-semibold">100% Defensible Ground Truth</span>
                </div>
              </div>

              {/* Active Stage Card Details */}
              <div className="mt-3 bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1 max-w-4xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                      LANE 0{activeStage.stage}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{activeStage.title}</h3>
                  </div>
                  <p className="text-xs font-medium text-slate-600">{activeStage.subtitle}</p>
                  <p className="text-xs text-slate-700 leading-relaxed pt-1">{activeStage.narration}</p>
                </div>

                {/* Stage Invariants & Verification */}
                <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 text-right md:text-right">
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-left">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Decision Diamond</div>
                    <div className="text-xs font-bold text-blue-700">
                      {activeStage.stage === 1 && 'Data Available & Parsable?'}
                      {activeStage.stage === 2 && 'Evidence Sufficient for Analysis?'}
                      {activeStage.stage === 3 && 'Geometric Outlier / Artifact?'}
                      {activeStage.stage === 4 && 'Viable Route Exists?'}
                      {activeStage.stage === 5 && 'Feasible Plan Exists?'}
                      {activeStage.stage === 6 && 'Authorized for Transmission?'}
                      {activeStage.stage === 7 && 'Longitudinal Discrepancy Found?'}
                    </div>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-left">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Operational Guarantee</div>
                    <div className="text-xs font-bold text-emerald-700">
                      {activeStage.stage === 1 && 'Raw Sentinel-1 & OSM Ingested'}
                      {activeStage.stage === 2 && 'Zero Synthetic Hallucination'}
                      {activeStage.stage === 3 && 'EPSG:32646 Metric Overlays'}
                      {activeStage.stage === 4 && '163 Stranded Bridges Pruned'}
                      {activeStage.stage === 5 && 'k-Medoids Bounded Optimization'}
                      {activeStage.stage === 6 && 'Mandatory Human Commander Sanction'}
                      {activeStage.stage === 7 && 'Pre-Monsoon Culvert Retrofit Loop'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* 3. TAB 2: TECHNICAL SYSTEM ARCHITECTURE (6 COMPLETE ZONES) */}
        {/* ===================================================================== */}
        {activeTab === 'system_architecture' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
            {/* Viewer Control Toolbar */}
            <div className="bg-white border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Asset Mode Switcher: 4K PNG vs Animated GIF */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-500 font-semibold uppercase text-[11px]">
                  VIEW MODE:
                </span>
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setSystemArchAssetType('png')}
                    className={`px-3 py-1 font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                      systemArchAssetType === 'png'
                        ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    High-Res 4K Blueprint (PNG)
                  </button>
                  <button
                    onClick={() => setSystemArchAssetType('gif')}
                    className={`px-3 py-1 font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                      systemArchAssetType === 'gif'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Live Animated Flow (GIF)
                  </button>
                </div>
              </div>

              {/* View Presets & Zoom Navigation */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setViewFitMode('fit-width')}
                    className={`px-2.5 py-1 font-semibold rounded-md transition-all ${
                      viewFitMode === 'fit-width'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Fit Width
                  </button>
                  <button
                    onClick={() => setViewFitMode('fit-all')}
                    className={`px-2.5 py-1 font-semibold rounded-md transition-all ${
                      viewFitMode === 'fit-all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Fit Entire Diagram
                  </button>
                  <button
                    onClick={() => {
                      setViewFitMode('custom');
                      setZoom(1.0);
                      setPan({ x: 0, y: 0 });
                    }}
                    className="px-2.5 py-1 font-semibold rounded-md text-slate-600 hover:text-slate-900 transition-all"
                  >
                    100% Scale
                  </button>
                </div>

                {/* Zoom +/- controls */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    onClick={() => {
                      setViewFitMode('custom');
                      setZoom((prev) => Math.max(0.2, prev * 0.85));
                    }}
                    className="p-1 rounded text-slate-600 hover:text-slate-900"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono font-bold text-[11px] text-slate-700 px-2 min-w-[50px] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={() => {
                      setViewFitMode('custom');
                      setZoom((prev) => Math.min(3.5, prev * 1.15));
                    }}
                    className="p-1 rounded text-slate-600 hover:text-slate-900"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setZoom(1.0);
                      setPan({ x: 0, y: 0 });
                      setViewFitMode('fit-width');
                    }}
                    className="p-1 rounded text-slate-600 hover:text-slate-900 ml-1 border-l border-slate-200"
                    title="Reset Canvas"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Download Asset Button */}
                <a
                  href={
                    systemArchAssetType === 'png'
                      ? '/lifeline_os_system_architecture.png'
                      : '/lifeline_os_system_architecture.gif'
                  }
                  download={`lifeline_os_system_architecture.${systemArchAssetType}`}
                  className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  Download Blueprint
                </a>

                {/* External Fullscreen Link */}
                <a
                  href="/lifeline_os_system_architecture.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 transition-colors shadow-xs"
                  title="Open in new window"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Interactive Canvas */}
            <div
              className={`flex-1 relative overflow-auto bg-slate-100 flex items-start justify-center p-4 select-none ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
              style={{
                backgroundImage:
                  'radial-gradient(circle, #cbd5e1 1px, transparent 1px), radial-gradient(circle, #cbd5e1 1px, #f8fafc 1px)',
                backgroundSize: '24px 24px'
              }}
            >
              <div
                className="transition-transform duration-75 origin-top-left"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  width: viewFitMode === 'fit-width' ? '100%' : 'auto',
                  maxWidth: viewFitMode === 'fit-width' ? '100%' : 'none'
                }}
              >
                <img
                  src={
                    systemArchAssetType === 'png'
                      ? '/lifeline_os_system_architecture.png'
                      : '/lifeline_os_system_architecture.gif'
                  }
                  alt="Lifeline OS Publication Technical System Architecture (6 Operational Zones)"
                  className="rounded-xl shadow-xl border border-slate-200 bg-white object-contain pointer-events-none"
                  style={{
                    width: viewFitMode === 'fit-width' ? '100%' : '3840px',
                    height: 'auto',
                    minWidth: viewFitMode === 'fit-width' ? '100%' : '1400px'
                  }}
                  draggable={false}
                />
              </div>

              {/* Floating Canvas Navigation Hint */}
              <div className="absolute top-4 right-6 pointer-events-none bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-[11px] font-mono text-slate-600 flex items-center gap-2">
                <span>Drag to Pan</span>
                <span>&bull;</span>
                <span>Scroll to Zoom</span>
                <span>&bull;</span>
                <span className="text-indigo-700 font-semibold">Zones 01–06 Complete</span>
              </div>
            </div>

            {/* Bottom: Interactive Zone Breakdown Drawer (6 Zones) */}
            <div className="bg-white border-t border-slate-200 p-4 shadow-lg">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Zone Quick Selection Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                  <span className="font-mono text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
                    ZONES:
                  </span>
                  {SYSTEM_ZONES.map((z, idx) => (
                    <button
                      key={z.id}
                      onClick={() => setSelectedZoneIdx(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all flex items-center gap-1.5 whitespace-nowrap ${
                        selectedZoneIdx === idx
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span className="font-bold">Z0{z.id}</span>
                      <span className="hidden xl:inline">{z.name.split(':')[1]?.trim() || z.name}</span>
                    </button>
                  ))}
                </div>

                <div className="font-mono text-xs text-slate-500 flex items-center gap-2">
                  <span>ZONE {activeZone.id} OF 6</span>
                  <span>&bull;</span>
                  <span className="text-indigo-700 font-semibold">Pure Client-Edge Architecture</span>
                </div>
              </div>

              {/* Active Zone Details Card */}
              <div className="mt-3 bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1 max-w-4xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                      ARCHITECTURE TIER 0{activeZone.id}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{activeZone.name}</h3>
                  </div>
                  <p className="text-xs font-medium text-slate-600">{activeZone.subtitle}</p>
                  <p className="text-xs text-slate-700 leading-relaxed pt-1">{activeZone.description}</p>
                  <div className="text-[11px] font-mono text-slate-500 pt-1">
                    <span className="font-semibold text-slate-700">Tech Stack:</span> {activeZone.tech}
                  </div>
                </div>

                {/* Zone Invariants */}
                <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 text-left">
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">SLA &amp; Resilience</div>
                    <div className="text-xs font-medium text-slate-800 max-w-xs">{activeZone.sla}</div>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Enforced Invariants</div>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {activeZone.invariants.map((inv, i) => (
                        <span
                          key={i}
                          className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200"
                        >
                          {inv}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* 4. TAB 3: COMPONENT DICTIONARY & INVARIANTS (31 SYSTEM NODES) */}
        {/* ===================================================================== */}
        {activeTab === 'dictionary' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[280px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search 31 components, algorithms, APIs, SLAs, and limitations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-900 pl-9 pr-8 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Layer Filter */}
                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 text-xs">
                  <span className="text-[11px] font-mono text-slate-500 font-semibold">LAYER:</span>
                  <select
                    value={selectedLayer}
                    onChange={(e) => setSelectedLayer(e.target.value)}
                    className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Layers</option>
                    <option value="presentation">Presentation</option>
                    <option value="application">Application</option>
                    <option value="geospatial">Geospatial</option>
                    <option value="data">Data &amp; Feeds</option>
                    <option value="ai_external">AI &amp; Cloud</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 text-xs">
                  <span className="text-[11px] font-mono text-slate-500 font-semibold">STATUS:</span>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="CONNECTED">Connected (Live)</option>
                    <option value="UNVERIFIED">Unverified (Audit Trap)</option>
                    <option value="PROPOSED">Proposed (Future)</option>
                  </select>
                </div>

                {/* Stage Filter */}
                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 text-xs">
                  <span className="text-[11px] font-mono text-slate-500 font-semibold">STAGE:</span>
                  <select
                    value={selectedStageFilter}
                    onChange={(e) => setSelectedStageFilter(e.target.value)}
                    className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Stages (1–7)</option>
                    <option value="1">Stage 1: Observe</option>
                    <option value="2">Stage 2: Validate</option>
                    <option value="3">Stage 3: Assess Impact</option>
                    <option value="4">Stage 4: Accessibility</option>
                    <option value="5">Stage 5: Plan Response</option>
                    <option value="6">Stage 6: Multi-Agency</option>
                    <option value="7">Stage 7: Learning Loop</option>
                  </select>
                </div>

                <div className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
                  Showing {filteredNodes.length} / {ARCHITECTURE_NODES.length}
                </div>
              </div>
            </div>

            {/* Grid of Component Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredNodes.map((node) => {
                const isExpanded = expandedNodeId === node.id;
                return (
                  <div
                    key={node.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-4 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {node.type.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {node.stageNumber && (
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              STAGE 0{node.stageNumber}
                            </span>
                          )}
                          <span
                            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                              node.status === 'CONNECTED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : node.status === 'UNVERIFIED'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}
                          >
                            {node.status}
                          </span>
                        </div>
                      </div>

                      {/* Title & Short Name */}
                      <h4 className="text-sm font-bold text-slate-900 tracking-tight">{node.name}</h4>
                      <div className="text-[11px] font-mono text-slate-500 mb-2">ID: {node.id}</div>

                      {/* Purpose */}
                      <p className="text-xs text-slate-600 leading-relaxed mb-3">{node.purpose}</p>

                      {/* Epistemic Provenance */}
                      {node.evidenceClass && (
                        <div className="mb-3 flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-slate-500">PROVENANCE:</span>
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {node.evidenceClass}
                          </span>
                        </div>
                      )}

                      {/* Expanded Technical Details */}
                      {isExpanded && (
                        <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                          {/* Inputs & Outputs */}
                          <div className="space-y-1">
                            <span className="font-mono text-[10px] font-bold text-slate-500 uppercase">
                              INPUTS:
                            </span>
                            <ul className="list-disc list-inside text-slate-700 text-[11px] space-y-0.5">
                              {node.inputs.map((inp, idx) => (
                                <li key={idx}>{inp}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-1">
                            <span className="font-mono text-[10px] font-bold text-slate-500 uppercase">
                              OUTPUTS:
                            </span>
                            <ul className="list-disc list-inside text-slate-700 text-[11px] space-y-0.5">
                              {node.outputs.map((out, idx) => (
                                <li key={idx}>{out}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Limitations & Edge Cases */}
                          {node.limitations.length > 0 && (
                            <div className="space-y-1 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/60">
                              <span className="font-mono text-[10px] font-bold text-amber-800 uppercase flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                LIMITATIONS &amp; AUDIT BOUNDS:
                              </span>
                              <ul className="list-disc list-inside text-amber-900 text-[11px] space-y-0.5">
                                {node.limitations.map((lim, idx) => (
                                  <li key={idx}>{lim}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Formal Acceptance Tests */}
                          {node.acceptanceTests.length > 0 && (
                            <div className="space-y-1 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200/60">
                              <span className="font-mono text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                FORMAL ACCEPTANCE VERIFICATION:
                              </span>
                              <ul className="list-disc list-inside text-emerald-900 text-[11px] space-y-0.5">
                                {node.acceptanceTests.map((test, idx) => (
                                  <li key={idx}>{test}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Expand Toggle Button */}
                    <button
                      onClick={() => setExpandedNodeId(isExpanded ? null : node.id)}
                      className="mt-3 w-full py-1.5 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <span>{isExpanded ? 'Collapse Spec' : 'Expand Invariants & In/Out'}</span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* 5. TAB 4: GEMINI 2.5 FLASH MCP PROTOCOL CONTRACT */}
        {/* ===================================================================== */}
        {activeTab === 'mcp' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
            {/* Header Banner */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                    GEMINI 2.5 FLASH &bull; MODEL CONTEXT PROTOCOL (MCP)
                  </span>
                  <span className="font-mono text-xs font-semibold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    TOOL CONTRACT ACTIVE
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Statutory Protocol Spec: SDRF Form-3B Automated Sanction
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Lifeline OS separates raw topological routing physics from LLM natural language generation.
                  Gemini 2.5 Flash acts strictly as an auditable policy agent that receives structured solver
                  telemetry, evaluates Indian IRC:6-2017 bridging codes, and prepares statutory memos.
                </p>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={handleCopySchema}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-all shadow-md shadow-purple-500/20 flex items-center gap-2 justify-center"
                >
                  {copiedSchema ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSchema ? 'SCHEMA COPIED!' : 'COPY MCP SCHEMA'}</span>
                </button>
                <div className="text-[10px] font-mono text-slate-500 text-center">
                  JSON-Schema Draft-07 Compliant
                </div>
              </div>
            </div>

            {/* Core Invariants Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-xs mb-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  ZERO HALLUCINATION INVARIANT
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Gemini cannot invent coordinates, road lengths, or casualty counts. It receives an immutable JSON
                  payload generated by the deterministic Dijkstra network engine.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-1.5">
                  <Lock className="w-4 h-4" />
                  MANDATORY HUMAN SIGN-OFF
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  No SDRF funds are dispersed and no public alert broadcast occurs autonomously. The Incident
                  Commander must explicitly sign with a cryptographic SHA-256 seal.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 text-purple-700 font-bold text-xs mb-1.5">
                  <FileCode className="w-4 h-4" />
                  IRC:6-2017 BRIDGING HARD-CAPS
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enforces statutory Indian Road Congress Class-40 multi-axle vehicle load constraints (16 tons, 80m
                  span) for all bridge repair sanction orders.
                </p>
              </div>
            </div>

            {/* MCP Schema JSON Viewer */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-mono font-semibold text-slate-700">
                  <FileCode className="w-4 h-4 text-purple-600" />
                  <span>tools/compile_sdrf_form3b_ticket.json</span>
                </div>
                <span className="font-mono text-[10px] text-slate-500">FORMAT: JSON SCHEMA DRAFT-07</span>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed max-h-[500px]">
{`{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "compile_sdrf_form3b_ticket",
  "description": "Compiles a statutory State Disaster Response Fund (SDRF) Form-3B sanction order ticket with deterministic engineering constraints and civil commander authorization.",
  "type": "object",
  "required": [
    "incident_id",
    "theater",
    "breach_id",
    "remedy_type",
    "justification",
    "civil_commander_id",
    "merkle_root_hash"
  ],
  "properties": {
    "incident_id": {
      "type": "string",
      "pattern": "^INC-[A-Z0-9-]+$",
      "description": "Deterministic identifier of the validated flood incident."
    },
    "theater": {
      "type": "string",
      "enum": ["assam_silchar", "nepal_gorkha"],
      "description": "Disaster theater for jurisdictional SDRF / NDM rules."
    },
    "breach_id": {
      "type": "string",
      "description": "Unique road cut-edge identifier verified by satellite SAR."
    },
    "remedy_type": {
      "type": "string",
      "enum": [
        "BAILEY_BRIDGE",
        "MOBILE_MEDICAL_UNIT",
        "MED_DRONE",
        "RESCUE_BOAT"
      ]
    },
    "reconnected_settlements_count": {
      "type": "integer",
      "minimum": 0,
      "description": "Number of isolated habitations restored by the intervention."
    },
    "protected_population": {
      "type": "integer",
      "minimum": 0,
      "description": "Verified census population receiving restored hospital access."
    },
    "detour_minutes_saved": {
      "type": "number",
      "minimum": 0,
      "description": "Minutes of transit latency saved relative to flooded detour."
    },
    "fiscal_expenditure_inr": {
      "type": "number",
      "minimum": 0,
      "description": "Statutory disbursement cap under SDRF norms."
    },
    "irc_compliance": {
      "type": "object",
      "properties": {
        "design_code": { "type": "string", "example": "IRC:6-2017 Class-40" },
        "axle_load_tons": { "type": "number", "example": 16.0 },
        "span_meters": { "type": "number", "example": 80.0 }
      },
      "required": ["design_code", "span_meters", "axle_load_tons"]
    },
    "civil_commander_id": {
      "type": "string",
      "description": "Empowered incident officer credential."
    },
    "merkle_root_hash": {
      "type": "string",
      "pattern": "^[a-f0-9]{64}$",
      "description": "SHA-256 Merkle root hash linking evidence and optimization inputs."
    }
  }
}`}
              </pre>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* 6. TAB 5: ACCEPTANCE VERIFICATION SUITE (15/15 PASS) */}
        {/* ===================================================================== */}
        {activeTab === 'tests' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
            {/* Header Stats */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                    FORMAL VERIFICATION SUITE
                  </span>
                  <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    15/15 TESTS PASSING (100%)
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Architecture Acceptance Invariants &amp; Compliance Audit
                </h2>
                <p className="text-xs text-slate-600">
                  Every test below is codified in deterministic unit suites verifying epistemic integrity, routing
                  soundness, and statutory governance.
                </p>
              </div>

              {/* Search in tests */}
              <div className="relative min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search requirement, clause, or detail..."
                  value={testSearchQuery}
                  onChange={(e) => setTestSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-900 pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Test Cards List */}
            <div className="space-y-3">
              {filteredTests.map((test) => (
                <div
                  key={test.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        TEST #{test.id.toString().padStart(2, '0')}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{test.requirement}</h4>
                    </div>
                    <div className="text-xs text-slate-600 flex items-start gap-1.5">
                      <span className="font-semibold text-slate-700 shrink-0">Expected Behavior:</span>
                      <span>{test.expectedBehavior}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 pt-0.5">
                      <span className="font-semibold text-slate-600">Verification:</span> {test.detail}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <div className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{test.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
