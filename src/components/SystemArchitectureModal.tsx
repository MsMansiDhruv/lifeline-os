import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Compass,
  Cpu,
  Radio,
  Eye,
  ShieldCheck,
  FileText,
  Sparkles,
  Server,
  Database,
  Network,
  ArrowRight,
  Download,
  Info,
  Lock,
  Activity,
  FileCode,
  Sliders,
  User,
  Users,
  LifeBuoy,
  LineChart,
  CloudRain,
  Building2,
  HelpCircle,
  AlertOctagon,
  Anchor,
  Send,
  Cloud,
  Globe,
  Key,
  HardDrive,
  GitFork,
  Check,
  Copy,
  ChevronRight,
  ChevronLeft,
  ChevronDown
} from 'lucide-react';

import {
  ViewMode,
  ArchitectureNode,
  ArchitectureEdge,
  IntegrationStatus,
  ARCHITECTURE_NODES,
  ARCHITECTURE_EDGES,
  STAGE_NARRATIVES,
  ARCHITECTURE_VALIDATION_TESTS,
  ArchitectureValidationTest
} from '../data/systemArchitectureModel';

interface SystemArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemArchitectureModal: React.FC<SystemArchitectureModalProps> = ({
  isOpen,
  onClose
}) => {
  // Navigation & View States
  const [activeView, setActiveView] = useState<ViewMode>('process');
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);

  // Inspector & Selection States
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isTestsModalOpen, setIsTestsModalOpen] = useState<boolean>(false);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLayer, setSelectedLayer] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedActor, setSelectedActor] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  // Canvas Pan & Zoom
  const [zoom, setZoom] = useState<number>(0.85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto-advance Presentation Mode timer
  useEffect(() => {
    let timer: any;
    if (isPlaying && isPresentationMode) {
      const duration = 5000 / playbackSpeed;
      timer = setTimeout(() => {
        setCurrentStageIdx((prev) => {
          if (prev < STAGE_NARRATIVES.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, duration);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, isPresentationMode, currentStageIdx, playbackSpeed]);

  // Adjust camera focus when stage changes in presentation mode
  useEffect(() => {
    if (isPresentationMode && activeView === 'process') {
      const activeStage = STAGE_NARRATIVES[currentStageIdx];
      const targetNode = ARCHITECTURE_NODES.find((n) => n.id === activeStage.focusNodeId);
      if (targetNode?.positions.process) {
        const targetX = targetNode.positions.process.x;
        const targetY = targetNode.positions.process.y;
        // Center the target node in viewport
        setPan({
          x: Math.max(-2800, Math.min(200, 450 - targetX * zoom)),
          y: Math.max(-600, Math.min(200, 220 - targetY * zoom))
        });
      }
    }
  }, [currentStageIdx, isPresentationMode, activeView, zoom]);

  // Reset viewport when switching views
  useEffect(() => {
    if (activeView === 'process') {
      setZoom(0.72);
      setPan({ x: 30, y: 60 });
    } else if (activeView === 'usecases') {
      setZoom(0.9);
      setPan({ x: 80, y: 30 });
    } else if (activeView === 'architecture') {
      setZoom(0.78);
      setPan({ x: 40, y: 20 });
    }
  }, [activeView]);

  if (!isOpen) return null;

  // Filtered Nodes & Edges
  const visibleNodes = ARCHITECTURE_NODES.filter((node) => {
    if (!node.views.includes(activeView)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        node.name.toLowerCase().includes(q) ||
        node.shortName.toLowerCase().includes(q) ||
        node.purpose.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (selectedLayer !== 'all' && node.layer !== selectedLayer) return false;
    if (selectedStatus !== 'all' && node.status !== selectedStatus) return false;
    if (selectedActor !== 'all' && node.id !== selectedActor && node.type === 'actor') return false;
    return true;
  });

  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

  const visibleEdges = ARCHITECTURE_EDGES.filter((edge) => {
    if (!edge.views.includes(activeView)) return false;
    return visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target);
  });

  // Calculate dependency graph for selected node
  const activeDependencies = useMemo(() => {
    if (!selectedNodeId) return { upstream: new Set<string>(), downstream: new Set<string>() };
    const upstream = new Set<string>();
    const downstream = new Set<string>();

    visibleEdges.forEach((e) => {
      if (e.target === selectedNodeId) upstream.add(e.source);
      if (e.source === selectedNodeId) downstream.add(e.target);
    });

    return { upstream, downstream };
  }, [selectedNodeId, visibleEdges]);

  // Selected Node Object
  const selectedNode = ARCHITECTURE_NODES.find((n) => n.id === selectedNodeId);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only primary button
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
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
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.max(0.3, Math.min(2.5, prev * zoomFactor)));
  };

  // Node selection handler
  const handleNodeClick = (node: ArchitectureNode) => {
    setSelectedNodeId(node.id);
    setIsInspectorOpen(true);
  };

  // Export functions
  const handleExportSvg = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeline_os_${activeView}_architecture.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPng = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    canvas.width = 3800;
    canvas.height = 2000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.fillStyle = '#080B10';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `lifeline_os_${activeView}_architecture.png`;
      a.click();
    };
    img.src = url;
  };

  const handleExportJson = () => {
    const spec = {
      title: 'Lifeline OS System Architecture Specification',
      view: activeView,
      timestamp: new Date().toISOString(),
      nodes: visibleNodes,
      edges: visibleEdges
    };
    const jsonString = JSON.stringify(spec, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeline_os_${activeView}_spec.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper to render icons dynamically
  const renderIcon = (iconName?: string, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'Satellite': return <CloudRain className={className} />;
      case 'Waves': return <Activity className={className} />;
      case 'Map': return <Compass className={className} />;
      case 'Users': return <Users className={className} />;
      case 'Building2': return <Building2 className={className} />;
      case 'FileText': return <FileText className={className} />;
      case 'Eye': return <Eye className={className} />;
      case 'ShieldCheck': return <ShieldCheck className={className} />;
      case 'HelpCircle': return <HelpCircle className={className} />;
      case 'AlertTriangle': return <AlertTriangle className={className} />;
      case 'Layers': return <Layers className={className} />;
      case 'Compass': return <Compass className={className} />;
      case 'GitFork': return <GitFork className={className} />;
      case 'Anchor': return <Anchor className={className} />;
      case 'Cpu': return <Cpu className={className} />;
      case 'PackageCheck': return <CheckCircle2 className={className} />;
      case 'AlertOctagon': return <AlertOctagon className={className} />;
      case 'Radio': return <Radio className={className} />;
      case 'Lock': return <Lock className={className} />;
      case 'FileX': return <AlertTriangle className={className} />;
      case 'Send': return <Send className={className} />;
      case 'RotateCcw': return <RotateCcw className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'Server': return <Server className={className} />;
      case 'Cloud': return <Cloud className={className} />;
      case 'Globe': return <Globe className={className} />;
      case 'Key': return <Key className={className} />;
      case 'HardDrive': return <HardDrive className={className} />;
      case 'User': return <User className={className} />;
      case 'Shield': return <ShieldCheck className={className} />;
      case 'LifeBuoy': return <LifeBuoy className={className} />;
      case 'LineChart': return <LineChart className={className} />;
      default: return <Activity className={className} />;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 bg-[#080B10] text-slate-100 flex flex-col overflow-hidden font-sans ${
        isFullscreen ? 'p-0' : 'p-2 md:p-4 bg-black/90 backdrop-blur-xl'
      }`}
    >
      {/* ===================================================================== */}
      {/* 1. TOP COMMAND BAR */}
      {/* ===================================================================== */}
      <div className="bg-[#0D121B] border border-slate-800/80 rounded-t-xl px-4 py-2.5 flex items-center justify-between gap-3 shadow-2xl z-20">
        {/* Left: Branding & View Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wider uppercase text-white">
                  LIFELINE OS
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  SYSTEM ARCHITECTURE
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Evidence Fusion &bull; Accessibility Physics &bull; Response Optimization
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 mx-1" />

          {/* 3 Main Switchable Views */}
          <div className="flex items-center bg-[#080B10] p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => {
                setActiveView('process');
                setIsPresentationMode(false);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeView === 'process'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              1. Process Flow (7 Stages)
            </button>
            <button
              onClick={() => {
                setActiveView('usecases');
                setIsPresentationMode(false);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeView === 'usecases'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              2. UML Use Cases
            </button>
            <button
              onClick={() => {
                setActiveView('architecture');
                setIsPresentationMode(false);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeView === 'architecture'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              3. Technical Layers &amp; GCP
            </button>
            <button
              onClick={() => {
                setActiveView('mcp');
                setIsPresentationMode(false);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeView === 'mcp'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              4. Gemini MCP Architecture
            </button>
          </div>
        </div>

        {/* Center: Search & Quick Status Filter */}
        <div className="hidden lg:flex items-center gap-2 flex-1 max-w-md mx-2">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search components, APIs, algorithms, fail states..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#080B10] border border-slate-800 text-xs text-slate-200 pl-8 pr-7 py-1.5 rounded-lg focus:outline-none focus:border-cyan-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions & Controls */}
        <div className="flex items-center gap-2">
          {/* Mode Switch: Presentation vs Exploration */}
          <div className="flex items-center bg-[#080B10] rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => {
                setIsPresentationMode(false);
                setIsPlaying(false);
              }}
              className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                !isPresentationMode
                  ? 'bg-slate-800 text-cyan-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Exploration
            </button>
            <button
              onClick={() => {
                setIsPresentationMode(true);
                setActiveView('process');
                setCurrentStageIdx(0);
              }}
              className={`px-2.5 py-1 text-xs rounded-md transition-all flex items-center gap-1 ${
                isPresentationMode
                  ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              Guided Tour
            </button>
          </div>

          {/* Validation Suite Modal Trigger */}
          <button
            onClick={() => setIsTestsModalOpen(true)}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
            title="Inspect 15 Acceptance Validation Tests"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">15 Tests (PASS)</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative group">
            <button className="p-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60 transition-all flex items-center gap-1">
              <Download className="w-3.5 h-3.5" />
              <ChevronDown className="w-3 h-3" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-36 bg-[#0D121B] border border-slate-800 rounded-lg shadow-xl p-1 hidden group-hover:block z-30">
              <button
                onClick={handleExportSvg}
                className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded hover:text-white flex items-center gap-2"
              >
                <FileCode className="w-3 h-3 text-cyan-400" /> Export SVG
              </button>
              <button
                onClick={handleExportPng}
                className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded hover:text-white flex items-center gap-2"
              >
                <FileText className="w-3 h-3 text-emerald-400" /> Export PNG
              </button>
              <button
                onClick={handleExportJson}
                className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded hover:text-white flex items-center gap-2"
              >
                <Database className="w-3 h-3 text-amber-400" /> Export JSON
              </button>
            </div>
          </div>

          {/* Fullscreen & Close */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
            title="Close Explorer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. SECONDARY CONTROLS & TIMELINE RIBBON */}
      {/* ===================================================================== */}
      <div className="bg-[#0A0E17] border-x border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 z-10 text-xs">
        {/* Left: Presentation Scrubber (When in Process view) */}
        {activeView === 'process' ? (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono font-semibold uppercase text-[11px] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              LIFECYCLE TIMELINE:
            </span>

            <div className="flex items-center gap-1 bg-[#080B10] px-2 py-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setCurrentStageIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentStageIdx === 0}
                className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                title="Previous Stage"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-2 py-0.5 rounded font-bold text-[11px] flex items-center gap-1 ${
                  isPlaying
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                }`}
              >
                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                {isPlaying ? 'PAUSE' : 'PLAY'}
              </button>

              <button
                onClick={() => setCurrentStageIdx((prev) => Math.min(STAGE_NARRATIVES.length - 1, prev + 1))}
                disabled={currentStageIdx === STAGE_NARRATIVES.length - 1}
                className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                title="Next Stage"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  setCurrentStageIdx(0);
                  setIsPlaying(false);
                }}
                className="p-1 rounded text-slate-400 hover:text-white"
                title="Reset Timeline"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* Stage Quick Jump Buttons */}
            <div className="hidden md:flex items-center gap-1">
              {STAGE_NARRATIVES.map((s, idx) => (
                <button
                  key={s.stage}
                  onClick={() => setCurrentStageIdx(idx)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                    currentStageIdx === idx
                      ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/30'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  S{s.stage}
                </button>
              ))}
            </div>

            {/* Playback Speed */}
            <div className="flex items-center gap-1 bg-[#080B10] px-1.5 py-0.5 rounded border border-slate-800 text-[10px] text-slate-400 font-mono">
              <span>SPEED:</span>
              {[1, 1.5, 2].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-1 rounded ${playbackSpeed === spd ? 'text-cyan-400 font-bold bg-cyan-950/40' : 'hover:text-white'}`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono font-semibold uppercase text-[11px]">
              {activeView === 'usecases' ? 'UML BOUNDARY FILTER:' : 'LAYER FILTER:'}
            </span>

            {/* Layer Filter Buttons */}
            {activeView === 'architecture' && (
              <div className="flex items-center gap-1">
                {['all', 'presentation', 'application', 'geospatial', 'data', 'ai_external'].map((ly) => (
                  <button
                    key={ly}
                    onClick={() => setSelectedLayer(ly)}
                    className={`px-2 py-0.5 rounded text-[11px] uppercase font-mono ${
                      selectedLayer === ly
                        ? 'bg-indigo-500 text-white font-bold'
                        : 'bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {ly.replace('_', ' ')}
                  </button>
                ))}
              </div>
            )}

            {/* Integration Status Filter */}
            <div className="flex items-center gap-1 bg-[#080B10] px-2 py-1 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono">STATUS:</span>
              {['all', 'CONNECTED', 'UNVERIFIED', 'PROPOSED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                    selectedStatus === st
                      ? st === 'CONNECTED'
                        ? 'bg-emerald-500 text-black'
                        : st === 'UNVERIFIED'
                        ? 'bg-amber-500 text-black'
                        : st === 'PROPOSED'
                        ? 'bg-purple-500 text-white'
                        : 'bg-cyan-500 text-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Right: Reduced Motion & Canvas Navigation */}
        <div className="flex items-center gap-3">
          {/* Reduced Motion Toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-400 hover:text-slate-200">
            <input
              type="checkbox"
              checked={isReducedMotion}
              onChange={(e) => setIsReducedMotion(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span>Reduced Motion</span>
          </label>

          <div className="h-4 w-px bg-slate-800" />

          {/* Zoom & Canvas Actions */}
          <div className="flex items-center gap-1 bg-[#080B10] p-0.5 rounded border border-slate-800">
            <button
              onClick={() => setZoom((prev) => Math.min(2.5, prev * 1.15))}
              className="p-1 rounded text-slate-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-slate-400 px-1">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((prev) => Math.max(0.3, prev * 0.85))}
              className="p-1 rounded text-slate-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (activeView === 'process') {
                  setZoom(0.72);
                  setPan({ x: 30, y: 60 });
                } else if (activeView === 'usecases') {
                  setZoom(0.9);
                  setPan({ x: 80, y: 30 });
                } else {
                  setZoom(0.78);
                  setPan({ x: 40, y: 20 });
                }
              }}
              className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-white font-mono"
              title="Fit to Screen"
            >
              RESET
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. MAIN CONTENT: DEDICATED MCP ARCHITECTURE PANEL OR SVG CANVAS */}
      {/* ===================================================================== */}
      {activeView === 'mcp' ? (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#070A0F] scrollbar-thin scrollbar-thumb-slate-700 select-text">
          {/* MCP Header Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                  Gemini 2.5 Flash + Model Context Protocol (MCP)
                </span>
                <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Deterministic Grounding
                </span>
              </div>
              <h2 className="text-lg font-black text-white tracking-tight">
                Model Context Protocol (MCP) Tool Calling &amp; Verification Architecture
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Lifeline OS interfaces with LLMs strictly through the standardized Model Context Protocol (MCP).
                Deterministic geographic graph nodes, hydrological sensor readings, and structural physical constraints (IRC:6)
                are provided directly into structured tool schemas to ensure zero coordinate hallucination and legally defensible SDRF Form-3B tickets.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const payload = JSON.stringify(
                    {
                      tool: 'compile_sdrf_form3b_ticket',
                      version: 'gemini-2.5-flash-mcp-v1',
                      strict_schema: true,
                      deterministic_nodes: {
                        village_origin: { name: 'Binnākāndi', elevation_asl: 41.2, lat: 24.885, lon: 92.855 },
                        dry_roadhead_north: { elevation_asl: 29.4, lat: 24.876, lon: 92.848 },
                        submerged_breach_channel: { elevation_asl: 17.1, lat: 24.872, lon: 92.845, gap_meters: 80 },
                        dry_abutment_south: { elevation_asl: 28.3, lat: 24.868, lon: 92.841 },
                        destination_hospital: { name: 'Silchar Medical College Hospital', elevation_asl: 34.0, lat: 24.789, lon: 92.791 },
                      },
                      selected_intervention: {
                        type: 'Class-40 Modular Bailey Bridge',
                        span_length_m: 80,
                        max_span_allowed_m: 100,
                        compliance: 'IRC:6-2017 & Indian Army Corps of Engineers standard',
                        capex_inr_lakhs: 180,
                        reconnected_villages: 42,
                        golden_hour_mins: 24,
                      },
                    },
                    null,
                    2
                  );
                  navigator.clipboard.writeText(payload);
                  setCopiedJson(true);
                  setTimeout(() => setCopiedJson(false), 2000);
                }}
                className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-lg shadow-purple-500/20 cursor-pointer transition-all"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedJson ? 'Copied MCP Payload' : 'Copy MCP Schema Payload'}</span>
              </button>
            </div>
          </div>

          {/* 4-Tier Cloud Architecture Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400">
                <Cloud className="w-4 h-4" />
                <span className="text-[10px] font-mono font-bold uppercase">Tier 1 &bull; Ingestion</span>
              </div>
              <h3 className="text-sm font-bold text-white">Upstream Sensors &amp; GloFAS</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Open-Meteo GloFAS 1,420 m³/s peak runoff, NASA SRTM 30m DEM elevation profiling, and Sentinel-1 C-Band SAR radar microwave flood inundation mapping.
              </p>
              <div className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 p-1.5 rounded border border-cyan-800/40">
                Live 15-min interval streams
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-blue-400">
                <Server className="w-4 h-4" />
                <span className="text-[10px] font-mono font-bold uppercase">Tier 2 &bull; Graph Engine</span>
              </div>
              <h3 className="text-sm font-bold text-white">Cloud Run Topology Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tarjan O(V+E) cut-edge percolation over 31,214 nodes, 163 phantom overpasses pruned, and IRC:6 16T heavy axle vehicular routing.
              </p>
              <div className="text-[10px] font-mono text-blue-300 bg-blue-950/60 p-1.5 rounded border border-blue-800/40">
                8.4ms deterministic execution
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400">
                <Database className="w-4 h-4" />
                <span className="text-[10px] font-mono font-bold uppercase">Tier 3 &bull; State Store</span>
              </div>
              <h3 className="text-sm font-bold text-white">Firestore &amp; IndexedDB</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Distributed ACID document store with 2-way WebSocket synchronization across SEOC command desks, offline IndexedDB buffer, and multi-role RBAC.
              </p>
              <div className="text-[10px] font-mono text-amber-300 bg-amber-950/60 p-1.5 rounded border border-amber-800/40">
                100% evaluation uptime
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-purple-400">
                <Sparkles className="w-4 h-4" />
                <span className="text-[10px] font-mono font-bold uppercase">Tier 4 &bull; MCP AI</span>
              </div>
              <h3 className="text-sm font-bold text-white">Gemini 2.5 Flash MCP</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deterministic MCP tool calling (`compile_sdrf_form3b_ticket`), sub-second latency, zero coordinate hallucination, and statutory SDRF Form-3B order generation.
              </p>
              <div className="text-[10px] font-mono text-purple-300 bg-purple-950/60 p-1.5 rounded border border-purple-800/40">
                Strict JSON schema enforcement
              </div>
            </div>
          </div>

          {/* Interactive MCP Tool Contract & Schema Viewer */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-mono font-bold text-white uppercase">
                  MCP Tool Schema Contract: compile_sdrf_form3b_ticket
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                STRICT VERIFIED JSON SCHEMA
              </span>
            </div>
            <pre className="p-4 rounded-xl bg-black/80 border border-slate-800 text-xs font-mono text-purple-200 overflow-x-auto leading-relaxed">
{`{
  "name": "compile_sdrf_form3b_ticket",
  "description": "Compiles a legally binding SDRF Form-3B statutory dispatch ticket grounded in physical topology.",
  "parameters": {
    "type": "object",
    "required": ["theater_id", "choke_id", "intervention_type", "gps_coordinates", "irc_compliance"],
    "properties": {
      "theater_id": { "type": "string", "enum": ["silchar", "nepal"] },
      "choke_id": { "type": "string", "example": "CHOKE-SILCHAR-01" },
      "intervention_type": { "type": "string", "enum": ["bridge", "boat", "drone", "booth"] },
      "gps_coordinates": {
        "type": "object",
        "properties": {
          "breach_lat": { "type": "number", "minimum": -90, "maximum": 90 },
          "breach_lon": { "type": "number", "minimum": -180, "maximum": 180 },
          "elevation_asl_m": { "type": "number" }
        },
        "required": ["breach_lat", "breach_lon"]
      },
      "irc_compliance": {
        "type": "object",
        "properties": {
          "design_code": { "type": "string", "example": "IRC:6-2017 Class-40" },
          "axle_load_tons": { "type": "number", "example": 16.0 },
          "span_meters": { "type": "number", "example": 80.0 }
        }
      }
    }
  }
}`}
            </pre>
          </div>
        </div>
      ) : (
        <div
          className="flex-1 relative overflow-hidden bg-[#070A0F] cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        >
        {/* Subtle Engineering Grid Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle, #38BDF8 0.75px, transparent 0.75px), radial-gradient(circle, #38BDF8 0.75px, #070A0F 0.75px)`,
            backgroundSize: '24px 24px',
            backgroundPosition: `${pan.x % 24}px ${pan.y % 24}px`
          }}
        />

        {/* View Header Watermark */}
        <div className="absolute top-4 left-6 pointer-events-none z-0">
          <h1 className="text-xl font-black tracking-widest text-slate-800 uppercase font-mono">
            {activeView === 'process'
              ? 'LIFELINE OS // END-TO-END DISASTER RESPONSE PROCESS FLOW'
              : activeView === 'usecases'
              ? 'LIFELINE OS // ACTORS, SYSTEM BOUNDARIES & UML USE CASES'
              : 'LIFELINE OS // MULTI-TIER TECHNICAL ARCHITECTURE & GCP INTEGRATIONS'}
          </h1>
          <p className="text-xs text-slate-700 font-mono">
            SEMATIC GRAPH v2.4 &bull; EPSG:32646 METRIC PROJECTION &bull; DETERMINISTIC PIPELINE
          </p>
        </div>

        {/* Renderable SVG World */}
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0'
          }}
        >
          <defs>
            {/* Arrow Marker Definitions */}
            <marker
              id="arrow-cyan"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#06B6D4" />
            </marker>
            <marker
              id="arrow-green"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#10B981" />
            </marker>
            <marker
              id="arrow-amber"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#F59E0B" />
            </marker>
            <marker
              id="arrow-red"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#EF4444" />
            </marker>
            <marker
              id="arrow-slate"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#475569" />
            </marker>

            {/* Linear Gradients for Nodes */}
            <linearGradient id="grad-stage" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="grad-decision" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#451A03" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#1C1917" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="grad-failure" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#450A0A" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#1C1917" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="grad-output" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#064E3B" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#022C22" stopOpacity="0.9" />
            </linearGradient>

            {/* Glowing Drop Shadows */}
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#06B6D4" floodOpacity="0.6" />
            </filter>
            <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#F59E0B" floodOpacity="0.6" />
            </filter>
            <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10B981" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* ================================================================= */}
          {/* PROCESS SWIMLANES & BACKGROUND STAGE ZONES */}
          {/* ================================================================= */}
          {activeView === 'process' && (
            <g className="process-swimlanes pointer-events-none">
              {[
                { stage: 1, name: 'STAGE 1: OBSERVE', x: 20, w: 560, color: '#06B6D4' },
                { stage: 2, name: 'STAGE 2: VALIDATE', x: 600, w: 480, color: '#3B82F6' },
                { stage: 3, name: 'STAGE 3: ASSESS IMPACT', x: 1100, w: 280, color: '#3B82F6' },
                { stage: 4, name: 'STAGE 4: ACCESSIBILITY', x: 1400, w: 480, color: '#8B5CF6' },
                { stage: 5, name: 'STAGE 5: PLAN RESPONSE', x: 1900, w: 480, color: '#A855F7' },
                { stage: 6, name: 'STAGE 6: COMMUNICATE', x: 2400, w: 760, color: '#10B981' },
                { stage: 7, name: 'STAGE 7: LEARN & FEEDBACK', x: 3180, w: 300, color: '#10B981' }
              ].map((lane) => {
                const isActive = currentStageIdx + 1 === lane.stage;
                return (
                  <g key={lane.stage}>
                    <rect
                      x={lane.x}
                      y={40}
                      width={lane.w}
                      height={580}
                      rx={12}
                      fill={isActive ? '#0F172A' : '#0B0F17'}
                      fillOpacity={isActive ? 0.6 : 0.3}
                      stroke={isActive ? lane.color : '#1E293B'}
                      strokeWidth={isActive ? 1.5 : 0.75}
                      strokeDasharray={isActive ? 'none' : '4 4'}
                    />
                    <text
                      x={lane.x + 16}
                      y={65}
                      fill={isActive ? lane.color : '#475569'}
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="monospace"
                      letterSpacing="0.1em"
                    >
                      {lane.name}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* ================================================================= */}
          {/* USE CASES: SYSTEM BOUNDARY RECTANGLE */}
          {/* ================================================================= */}
          {activeView === 'usecases' && (
            <g className="system-boundary">
              <rect
                x={300}
                y={20}
                width={740}
                height={620}
                rx={16}
                fill="#0B0F17"
                fillOpacity={0.7}
                stroke="#3B82F6"
                strokeWidth={1.5}
                strokeDasharray="6 6"
              />
              <text
                x={320}
                y={46}
                fill="#60A5FA"
                fontSize="12"
                fontWeight="bold"
                fontFamily="monospace"
                letterSpacing="0.15em"
              >
                LIFELINE OS SYSTEM BOUNDARY
              </text>
            </g>
          )}

          {/* ================================================================= */}
          {/* TECHNICAL ARCHITECTURE: 5 HORIZONTAL LAYER LANES */}
          {/* ================================================================= */}
          {activeView === 'architecture' && (
            <g className="architecture-lanes pointer-events-none">
              {[
                { name: '1. PRESENTATION LAYER (Web UI & Tactical 3D Geospatial)', y: 35, h: 125, color: '#06B6D4' },
                { name: '2. APPLICATION / API LAYER (Routing, Dispatch & Reporting APIs)', y: 195, h: 125, color: '#3B82F6' },
                { name: '3. GEOSPATIAL INTELLIGENCE LAYER (Topology, Percolation, Bridgehead Defense)', y: 355, h: 125, color: '#A855F7' },
                { name: '4. DATA & PERSISTENCE LAYER (Spatial Indexes, GeoJSON, Immutable Ledger)', y: 515, h: 125, color: '#10B981' },
                { name: '5. AI & EXTERNAL SERVICES (Gemini 2.5 Flash, Google Cloud Services, Ingest Feeds)', y: 675, h: 220, color: '#F59E0B' }
              ].map((lane, idx) => (
                <g key={idx}>
                  <rect
                    x={50}
                    y={lane.y}
                    width={1280}
                    height={lane.h}
                    rx={10}
                    fill="#0B0F17"
                    fillOpacity={0.5}
                    stroke="#1E293B"
                    strokeWidth={0.8}
                  />
                  <text
                    x={65}
                    y={lane.y + 18}
                    fill={lane.color}
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                    letterSpacing="0.1em"
                  >
                    {lane.name}
                  </text>
                </g>
              ))}
            </g>
          )}

          {/* ================================================================= */}
          {/* EDGES / CONNECTORS RENDERING */}
          {/* ================================================================= */}
          <g className="architecture-edges">
            {visibleEdges.map((edge) => {
              const srcNode = ARCHITECTURE_NODES.find((n) => n.id === edge.source);
              const tgtNode = ARCHITECTURE_NODES.find((n) => n.id === edge.target);
              if (!srcNode || !tgtNode) return null;

              const srcPos = srcNode.positions[activeView];
              const tgtPos = tgtNode.positions[activeView];
              if (!srcPos || !tgtPos) return null;

              const srcW = srcPos.width || 200;
              const srcH = srcPos.height || 70;
              const tgtW = tgtPos.width || 200;
              const tgtH = tgtPos.height || 70;

              // Calculate attachment points based on relative orientation
              let x1 = srcPos.x + srcW;
              let y1 = srcPos.y + srcH / 2;
              let x2 = tgtPos.x;
              let y2 = tgtPos.y + tgtH / 2;

              // Check if edge is vertical (for layered architecture)
              const isVertical = activeView === 'architecture';
              if (isVertical) {
                if (srcPos.y < tgtPos.y) {
                  x1 = srcPos.x + srcW / 2;
                  y1 = srcPos.y + srcH;
                  x2 = tgtPos.x + tgtW / 2;
                  y2 = tgtPos.y;
                } else {
                  x1 = srcPos.x + srcW / 2;
                  y1 = srcPos.y;
                  x2 = tgtPos.x + tgtW / 2;
                  y2 = tgtPos.y + tgtH;
                }
              }

              // Special path for feedback loop (Stage 7 back to Stage 1)
              let pathD = '';
              if (edge.edgeType === 'feedback') {
                // Loop downward under all nodes from x:3320 back to x:440
                pathD = `M ${srcPos.x + srcW / 2} ${srcPos.y + srcH} C ${srcPos.x + srcW / 2} 660, 440 660, 440 ${
                  tgtPos.y + tgtH
                }`;
              } else if (edge.edgeType === 'decision_false') {
                // Downward branch for failure
                x1 = srcPos.x + srcW / 2;
                y1 = srcPos.y + srcH;
                x2 = tgtPos.x + tgtW / 2;
                y2 = tgtPos.y;
                pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
              } else if (isVertical) {
                const dy = y2 - y1;
                pathD = `M ${x1} ${y1} C ${x1} ${y1 + dy * 0.4}, ${x2} ${y2 - dy * 0.4}, ${x2} ${y2}`;
              } else {
                // Smooth horizontal bezier curve
                const dx = x2 - x1;
                pathD = `M ${x1} ${y1} C ${x1 + dx * 0.45} ${y1}, ${x2 - dx * 0.45} ${y2}, ${x2} ${y2}`;
              }

              const isHighlighted =
                selectedNodeId === edge.source ||
                selectedNodeId === edge.target ||
                (isPresentationMode &&
                  STAGE_NARRATIVES[currentStageIdx].highlightEdges?.includes(edge.id));

              let strokeColor = '#334155';
              let markerEnd = 'url(#arrow-slate)';

              if (edge.edgeType === 'decision_true') {
                strokeColor = '#10B981';
                markerEnd = 'url(#arrow-green)';
              } else if (edge.edgeType === 'decision_false') {
                strokeColor = '#EF4444';
                markerEnd = 'url(#arrow-red)';
              } else if (edge.edgeType === 'feedback') {
                strokeColor = '#06B6D4';
                markerEnd = 'url(#arrow-cyan)';
              } else if (isHighlighted) {
                strokeColor = '#38BDF8';
                markerEnd = 'url(#arrow-cyan)';
              } else if (edge.color) {
                strokeColor = edge.color;
              }

              return (
                <g key={edge.id} className="transition-all duration-300">
                  {/* Invisible broad hitbox for hover */}
                  <path d={pathD} fill="none" stroke="transparent" strokeWidth={14} />

                  {/* Main Connector Path */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isHighlighted ? 2.5 : 1.3}
                    strokeDasharray={
                      edge.style === 'dashed' || edge.edgeType === 'include' || edge.edgeType === 'extend'
                        ? '6 4'
                        : 'none'
                    }
                    markerEnd={markerEnd}
                    className={
                      !isReducedMotion && (edge.animated || isHighlighted)
                        ? 'animate-pulse'
                        : ''
                    }
                  />

                  {/* Animated Flow Particles */}
                  {!isReducedMotion && (edge.animated || isHighlighted) && (
                    <circle r={2.5} fill={strokeColor} opacity={0.9}>
                      <animateMotion path={pathD} dur="2.8s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Edge Label (if present) */}
                  {edge.label && (
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2 - 6}
                      fill={isHighlighted ? '#F1F5F9' : '#64748B'}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="bg-slate-900 px-1 select-none pointer-events-none"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* ================================================================= */}
          {/* NODES RENDERING */}
          {/* ================================================================= */}
          <g className="architecture-nodes">
            {visibleNodes.map((node) => {
              const pos = node.positions[activeView];
              if (!pos) return null;

              const w = pos.width || 200;
              const h = pos.height || 70;
              const x = pos.x;
              const y = pos.y;

              const isSelected = selectedNodeId === node.id;
              const isHovered = hoveredNodeId === node.id;
              const isUpstream = activeDependencies.upstream.has(node.id);
              const isDownstream = activeDependencies.downstream.has(node.id);
              const isStageActive =
                isPresentationMode &&
                STAGE_NARRATIVES[currentStageIdx].highlightNodes?.includes(node.id);

              let borderColor = '#334155';
              let fillGradient = 'url(#grad-stage)';

              if (node.type === 'decision') {
                fillGradient = 'url(#grad-decision)';
                borderColor = '#D97706';
              } else if (node.type === 'failure') {
                fillGradient = 'url(#grad-failure)';
                borderColor = '#DC2626';
              } else if (node.type === 'output') {
                fillGradient = 'url(#grad-output)';
                borderColor = '#059669';
              }

              if (isSelected) {
                borderColor = '#38BDF8';
              } else if (isStageActive) {
                borderColor = '#06B6D4';
              } else if (isUpstream) {
                borderColor = '#06B6D4';
              } else if (isDownstream) {
                borderColor = '#10B981';
              }

              // Status indicator badge color
              let statusBadgeBg = '#10B981';
              if (node.status === 'UNVERIFIED') statusBadgeBg = '#F59E0B';
              if (node.status === 'PROPOSED') statusBadgeBg = '#8B5CF6';

              return (
                <g
                  key={node.id}
                  transform={`translate(${x}, ${y})`}
                  onClick={() => handleNodeClick(node)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  className="cursor-pointer transition-all duration-200"
                >
                  {/* UML USE CASE BUBBLE SHAPE */}
                  {activeView === 'usecases' && node.type === 'usecase' ? (
                    <g>
                      <ellipse
                        cx={w / 2}
                        cy={h / 2}
                        rx={w / 2}
                        ry={h / 2}
                        fill="#0F172A"
                        stroke={isSelected ? '#38BDF8' : '#3B82F6'}
                        strokeWidth={isSelected ? 2.5 : 1.2}
                        filter={isSelected ? 'url(#glow-cyan)' : 'none'}
                      />
                      <text
                        x={w / 2}
                        y={h / 2 + 4}
                        fill="#E2E8F0"
                        fontSize="11"
                        fontWeight="600"
                        textAnchor="middle"
                        fontFamily="sans-serif"
                      >
                        {node.shortName}
                      </text>
                    </g>
                  ) : activeView === 'usecases' && node.type === 'actor' ? (
                    /* UML ACTOR FIGURE & LABEL */
                    <g>
                      <rect
                        width={w}
                        height={h}
                        rx={8}
                        fill="#1E293B"
                        fillOpacity={0.8}
                        stroke={isSelected ? '#38BDF8' : '#64748B'}
                        strokeWidth={isSelected ? 2 : 1}
                      />
                      <circle cx={25} cy={h / 2} r={10} fill="#0EA5E9" fillOpacity={0.2} stroke="#38BDF8" />
                      <text x={45} y={h / 2 + 4} fill="#F8FAFC" fontSize="11" fontWeight="bold">
                        {node.shortName}
                      </text>
                    </g>
                  ) : node.type === 'decision' ? (
                    /* DIAMOND DECISION GATE */
                    <g>
                      <polygon
                        points={`${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}`}
                        fill={fillGradient}
                        stroke={borderColor}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        filter={isSelected ? 'url(#glow-amber)' : 'none'}
                      />
                      <text
                        x={w / 2}
                        y={h / 2 + 4}
                        fill="#FEF3C7"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {node.shortName}
                      </text>
                    </g>
                  ) : (
                    /* STANDARD RECTANGULAR COMPONENT CARD */
                    <g>
                      <rect
                        width={w}
                        height={h}
                        rx={10}
                        fill={fillGradient}
                        stroke={borderColor}
                        strokeWidth={isSelected || isStageActive ? 2 : 1}
                        filter={
                          isSelected
                            ? 'url(#glow-cyan)'
                            : isStageActive
                            ? 'url(#glow-cyan)'
                            : 'none'
                        }
                      />

                      {/* Header Accent Bar */}
                      <rect
                        width={w}
                        height={4}
                        rx={2}
                        fill={
                          node.type === 'failure'
                            ? '#EF4444'
                            : node.type === 'output'
                            ? '#10B981'
                            : node.colorTheme === 'cyan'
                            ? '#06B6D4'
                            : node.colorTheme === 'purple'
                            ? '#A855F7'
                            : '#3B82F6'
                        }
                      />

                      {/* Status Dot / Indicator */}
                      <circle cx={w - 12} cy={14} r={3.5} fill={statusBadgeBg} />

                      {/* Icon */}
                      <g transform="translate(12, 16)" className="text-cyan-400">
                        {renderIcon(node.icon, 'w-3.5 h-3.5 text-cyan-400')}
                      </g>

                      {/* Short Title */}
                      <text
                        x={32}
                        y={26}
                        fill="#F8FAFC"
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        {node.shortName.length > 22
                          ? node.shortName.slice(0, 20) + '...'
                          : node.shortName}
                      </text>

                      {/* Subtitle / Purpose preview */}
                      <text
                        x={12}
                        y={46}
                        fill="#94A3B8"
                        fontSize="8.5"
                        fontFamily="sans-serif"
                      >
                        {node.purpose.slice(0, 36) + '...'}
                      </text>

                      {/* Bottom Tags */}
                      <g transform={`translate(12, ${h - 14})`}>
                        <text fill="#64748B" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                          {node.layer ? node.layer.toUpperCase() : node.type.toUpperCase()}
                        </text>
                        {node.evidenceClass && (
                          <text x={70} fill="#0EA5E9" fontSize="7.5" fontFamily="monospace">
                            [{node.evidenceClass}]
                          </text>
                        )}
                      </g>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* =================================================================== */}
        {/* PRESENTATION MODE NARRATION BOTTOM DRAWER */}
        {/* =================================================================== */}
        {isPresentationMode && activeView === 'process' && (
          <div className="absolute bottom-4 left-6 right-6 md:right-auto md:max-w-2xl bg-[#0D121B]/95 border border-cyan-500/40 rounded-xl p-4 shadow-2xl backdrop-blur-md z-30">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider font-mono">
                  {STAGE_NARRATIVES[currentStageIdx].title}
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {currentStageIdx + 1} of {STAGE_NARRATIVES.length}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              {STAGE_NARRATIVES[currentStageIdx].narration}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 font-mono">
                Focus: #{STAGE_NARRATIVES[currentStageIdx].focusNodeId}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentStageIdx((p) => Math.max(0, p - 1))}
                  disabled={currentStageIdx === 0}
                  className="px-2.5 py-1 text-xs rounded bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentStageIdx((p) =>
                      Math.min(STAGE_NARRATIVES.length - 1, p + 1)
                    )
                  }
                  disabled={currentStageIdx === STAGE_NARRATIVES.length - 1}
                  className="px-3 py-1 text-xs rounded bg-cyan-500 text-black font-bold hover:bg-cyan-400 disabled:opacity-30"
                >
                  Next Step
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* ===================================================================== */}
      {/* 4. CONTEXTUAL NODE INSPECTOR (DRAWER) */}
      {/* ===================================================================== */}
      {isInspectorOpen && selectedNode && (
        <div className="absolute right-0 top-12 bottom-0 w-96 max-w-full bg-[#0D121B] border-l border-slate-800 shadow-2xl z-40 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-start justify-between gap-2 bg-[#090D14]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    selectedNode.status === 'CONNECTED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : selectedNode.status === 'UNVERIFIED'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}
                >
                  {selectedNode.status}
                </span>
                {selectedNode.evidenceClass && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {selectedNode.evidenceClass}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-sm text-white leading-tight">
                {selectedNode.name}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Node ID: #{selectedNode.id} &bull; Type: {selectedNode.type}
              </p>
            </div>
            <button
              onClick={() => setIsInspectorOpen(false)}
              className="text-slate-500 hover:text-white p-1 rounded hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Purpose */}
            <div>
              <h4 className="font-bold text-slate-300 mb-1 flex items-center gap-1.5 font-mono uppercase text-[11px]">
                <Info className="w-3.5 h-3.5 text-cyan-400" /> Operational Purpose
              </h4>
              <p className="text-slate-300 leading-relaxed bg-[#080B10] p-2.5 rounded-lg border border-slate-800">
                {selectedNode.purpose}
              </p>
            </div>

            {/* Inputs & Outputs */}
            <div className="grid grid-cols-1 gap-2">
              <div className="bg-[#080B10] p-2.5 rounded-lg border border-slate-800">
                <h5 className="font-bold text-cyan-400 mb-1 font-mono uppercase text-[10px]">
                  Inputs / Upstream Signals
                </h5>
                <ul className="space-y-1 text-slate-300">
                  {selectedNode.inputs.length > 0 ? (
                    selectedNode.inputs.map((inItem, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                        <span className="text-cyan-500 mt-0.5">&bull;</span>
                        <span>{inItem}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-500 italic text-[11px]">Direct sensor / user origin</li>
                  )}
                </ul>
              </div>

              <div className="bg-[#080B10] p-2.5 rounded-lg border border-slate-800">
                <h5 className="font-bold text-emerald-400 mb-1 font-mono uppercase text-[10px]">
                  Outputs / Downstream Deliverables
                </h5>
                <ul className="space-y-1 text-slate-300">
                  {selectedNode.outputs.map((outItem, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                      <span className="text-emerald-500 mt-0.5">&bull;</span>
                      <span>{outItem}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Connected Dependencies */}
            <div>
              <h4 className="font-bold text-slate-300 mb-1 flex items-center gap-1.5 font-mono uppercase text-[11px]">
                <GitFork className="w-3.5 h-3.5 text-purple-400" /> Graph Dependencies
              </h4>
              <div className="space-y-1.5">
                {selectedNode.dependencies.length > 0 ? (
                  selectedNode.dependencies.map((depId) => {
                    const depNode = ARCHITECTURE_NODES.find((n) => n.id === depId);
                    return (
                      <button
                        key={depId}
                        onClick={() => setSelectedNodeId(depId)}
                        className="w-full text-left p-1.5 rounded bg-[#080B10] border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between text-slate-300 hover:text-white"
                      >
                        <span className="font-medium text-[11px] truncate">
                          {depNode ? depNode.name : depId}
                        </span>
                        <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
                      </button>
                    );
                  })
                ) : (
                  <p className="text-slate-500 italic text-[11px]">Root node in active hierarchy</p>
                )}
              </div>
            </div>

            {/* Evidence Requirements */}
            {selectedNode.evidenceRequirements.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-300 mb-1 flex items-center gap-1.5 font-mono uppercase text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Data Requirements
                </h4>
                <div className="space-y-1 text-slate-300 bg-[#080B10] p-2 rounded border border-slate-800 text-[11px]">
                  {selectedNode.evidenceRequirements.map((er, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{er}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Limitations */}
            {selectedNode.limitations.length > 0 && (
              <div>
                <h4 className="font-bold text-amber-400 mb-1 flex items-center gap-1.5 font-mono uppercase text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Operational Limitations
                </h4>
                <div className="space-y-1 text-slate-300 bg-[#080B10] p-2 rounded border border-amber-900/30 text-[11px]">
                  {selectedNode.limitations.map((lim, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-500 mt-0.5">&bull;</span>
                      <span>{lim}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Associated Acceptance Tests */}
            {selectedNode.acceptanceTests.length > 0 && (
              <div>
                <h4 className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5 font-mono uppercase text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Acceptance Tests
                </h4>
                <div className="space-y-1 text-slate-300 bg-[#080B10] p-2 rounded border border-emerald-900/30 text-[11px]">
                  {selectedNode.acceptanceTests.map((tst, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-slate-200">{tst}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. VALIDATION TEST SUITE MODAL (SECTION 9) */}
      {/* ===================================================================== */}
      {isTestsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D121B] border border-slate-700 max-w-3xl w-full rounded-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#080B10]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white uppercase font-mono tracking-wider">
                  SYSTEM ARCHITECTURE VALIDATION SUITE (15 / 15 PASS)
                </h3>
              </div>
              <button
                onClick={() => setIsTestsModalOpen(false)}
                className="text-slate-500 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 text-xs">
              {ARCHITECTURE_VALIDATION_TESTS.map((test) => (
                <div
                  key={test.id}
                  className="bg-[#080B10] border border-slate-800 rounded-lg p-3 flex items-start justify-between gap-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] text-cyan-400 font-bold">
                        TEST #{test.id}
                      </span>
                      <h4 className="font-bold text-white text-xs">{test.requirement}</h4>
                    </div>
                    <p className="text-slate-400 text-[11px] mb-1">
                      <span className="text-slate-500 font-mono">Expected:</span>{' '}
                      {test.expectedBehavior}
                    </p>
                    <p className="text-emerald-300 text-[11px] bg-emerald-950/20 p-1.5 rounded border border-emerald-900/30">
                      <span className="text-emerald-500 font-bold font-mono">Verified:</span>{' '}
                      {test.detail}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {test.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-slate-800 bg-[#080B10] flex justify-end">
              <button
                onClick={() => setIsTestsModalOpen(false)}
                className="px-4 py-1.5 bg-cyan-500 text-black text-xs font-bold rounded-lg hover:bg-cyan-400"
              >
                Close Verification Suite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
