import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Search,
  Filter,
  Download,
  Info,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  FileText,
  FileCode,
  Share2,
  Compass,
  Check,
  ChevronRight
} from 'lucide-react';

import {
  ArchitectureNode,
  ArchitectureEdge,
  ArchitectureGroup,
  ARCHITECTURE_GROUPS,
  ARCHITECTURE_NODES,
  ARCHITECTURE_EDGES,
  ComponentStatus,
  EdgeType
} from '../data/systemArchitectureModel';

interface SystemArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemArchitectureModal: React.FC<SystemArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Navigation, Pan & Zoom States
  const [zoom, setZoom] = useState<number>(0.85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 30 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Selection & Inspector
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('comp_network_engine');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState<boolean>(false);

  // Feedback states
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Center view on mount
  useEffect(() => {
    if (isOpen) {
      setPan({ x: 40, y: 20 });
      setZoom(0.85);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (isInspectorOpen && selectedNodeId) {
          setIsInspectorOpen(false);
        } else {
          onClose();
        }
      } else if (e.key === '+' || e.key === '=') {
        setZoom((prev) => Math.min(prev + 0.15, 2.0));
      } else if (e.key === '-' || e.key === '_') {
        setZoom((prev) => Math.max(prev - 0.15, 0.4));
      } else if (e.key === '0') {
        setZoom(0.85);
        setPan({ x: 40, y: 20 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isInspectorOpen, selectedNodeId]);

  // Selected node lookup
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return ARCHITECTURE_NODES.find((n) => n.id === selectedNodeId) || null;
  }, [selectedNodeId]);

  // Active upstream & downstream dependencies for selection highlighting
  const activeDependencySet = useMemo(() => {
    if (!selectedNodeId) return { up: new Set<string>(), down: new Set<string>() };
    const up = new Set<string>();
    const down = new Set<string>();

    const targetNode = ARCHITECTURE_NODES.find((n) => n.id === selectedNodeId);
    if (targetNode) {
      targetNode.upstreamIds.forEach((id) => up.add(id));
      targetNode.downstreamIds.forEach((id) => down.add(id));
    }
    return { up, down };
  }, [selectedNodeId]);

  // Pan interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag when clicking background or canvas
    if ((e.target as HTMLElement).closest('.interactive-node')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.4), 2.2));
  };

  // Node Click Selection
  const handleNodeClick = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setIsInspectorOpen(true);
  };

  // Export handlers
  const handleExportSVG = () => {
    if (!svgRef.current) return;
    const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const svgData = new XMLSerializer().serializeToString(svgClone);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lifeline_os_system_architecture.svg';
    a.click();
    URL.revokeObjectURL(url);
    showNotice('Exported architecture diagram as SVG');
  };

  const handleExportJSON = () => {
    const payload = {
      project: 'Lifeline OS',
      version: '2.4.0',
      type: 'Technical Architecture & Geospatial Data Pipeline',
      standards: ['IRC:6-2017', 'NDMA-DM-Act-2005', 'OpenStreetMap-OSRM', 'Sentinel-1-SAR'],
      groups: ARCHITECTURE_GROUPS,
      nodes: ARCHITECTURE_NODES,
      edges: ARCHITECTURE_EDGES,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lifeline_os_architecture_spec.json';
    a.click();
    URL.revokeObjectURL(url);
    showNotice('Exported JSON architecture specification');
  };

  const handleExportPNG = () => {
    if (!svgRef.current) return;
    const svgElement = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    canvas.width = 3200;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = 'lifeline_os_system_architecture.png';
      a.click();
      showNotice('Exported high-resolution PNG');
    };
    img.src = url;
  };

  const showNotice = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  // Helper for status badge styling
  const renderStatusBadge = (status: ComponentStatus, customLabel?: string) => {
    switch (status) {
      case 'OPERATIONAL':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E6F4EA] text-[#0F766E] border border-[#A3E0C4]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
            {customLabel || 'OPERATIONAL'}
          </span>
        );
      case 'EXTERNAL_API':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EBF3FB] text-[#1677C8] border border-[#B9D9F8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1677C8]" />
            {customLabel || 'EXTERNAL API'}
          </span>
        );
      case 'IMPORTED':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F1F5F9] text-[#475467] border border-[#CBD5E1]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
            {customLabel || 'IMPORTED'}
          </span>
        );
      case 'USER_INPUT':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F5F3FF] text-[#6D28D9] border border-[#DDD6FE]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6D28D9]" />
            {customLabel || 'FIELD INPUT'}
          </span>
        );
      case 'SIMULATED':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FEF3C7] text-[#B7791F] border border-[#FDE68A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B7791F]" />
            {customLabel || 'SIMULATED'}
          </span>
        );
      case 'PLANNED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
            {customLabel || 'PLANNED'}
          </span>
        );
    }
  };

  // Helper for connector color
  const getEdgeStroke = (edge: ArchitectureEdge) => {
    const isEdgeHovered = hoveredEdgeId === edge.id;
    const isConnectedToSelected =
      selectedNodeId && (edge.sourceId === selectedNodeId || edge.targetId === selectedNodeId);

    if (isConnectedToSelected || isEdgeHovered) {
      return '#1677C8';
    }

    switch (edge.edgeType) {
      case 'validated_flow':
        return '#0F766E'; // Restrained Teal
      case 'quarantine_flow':
      case 'failure_flow':
        return '#B42318'; // Muted Red
      case 'warning_flow':
        return '#B7791F'; // Muted Amber
      case 'feedback_loop':
        return '#1677C8'; // Restrained Blue
      case 'audit_flow':
        return '#64748B'; // Muted Slate
      case 'data_flow':
      default:
        return '#94A3B8'; // Neutral Slate
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 md:p-5 select-none">
      {/* ===================================================================== */}
      {/* MAIN CONTAINER (White Engineering Blueprint Style) */}
      {/* ===================================================================== */}
      <div
        ref={containerRef}
        className={`bg-white border border-[#D0D7DE] rounded-xl shadow-2xl flex flex-col overflow-hidden w-full h-full max-w-[98vw] max-h-[96vh] ${
          isFullscreen ? 'fixed inset-0 max-w-none max-h-none rounded-none' : ''
        }`}
      >
        {/* ------------------------------------------------------------------- */}
        {/* TOP ENGINEERING BAR */}
        {/* ------------------------------------------------------------------- */}
        <div className="bg-[#FFFFFF] border-b border-[#D0D7DE] px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
          {/* Left Title & Status */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#D0D7DE] flex items-center justify-center text-[#1677C8]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-[#17212B] tracking-tight">
                  Lifeline OS — Technical Architecture & Data-Flow Pipeline
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F1F5F9] text-[#334155] border border-[#D0D7DE] font-semibold">
                  AUDITED SPECIFICATION
                </span>
              </div>
              <p className="text-[11px] text-[#475467]">
                Empirical remote sensing, geospatial network percolation, deterministic allocation & cryptographic audit
              </p>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            {/* Quick Search */}
            <div className="relative hidden sm:block">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search components, inputs, outputs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-[#F8FAFC] border border-[#D0D7DE] rounded-lg text-xs text-[#17212B] placeholder-[#94A3B8] focus:outline-none focus:border-[#1677C8] w-48 lg:w-64 transition-colors font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#17212B] text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter by Group */}
            <div className="relative">
              <button
                onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                  selectedGroupFilter !== 'all'
                    ? 'bg-[#EBF3FB] border-[#B9D9F8] text-[#1677C8]'
                    : 'bg-[#F8FAFC] border-[#D0D7DE] text-[#475467] hover:bg-[#F1F5F9]'
                }`}
                title="Filter components by subsystem group"
              >
                <Filter className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Filter</span>
              </button>

              {isFilterDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-[#D0D7DE] rounded-lg shadow-xl py-1 z-50 text-xs font-sans divide-y divide-[#F1F5F9]">
                  <button
                    onClick={() => {
                      setSelectedGroupFilter('all');
                      setIsFilterDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-[#F8FAFC] cursor-pointer flex items-center justify-between ${
                      selectedGroupFilter === 'all' ? 'font-bold text-[#1677C8]' : 'text-[#17212B]'
                    }`}
                  >
                    <span>All Subsystems (5 Groups)</span>
                    {selectedGroupFilter === 'all' && <Check className="w-3.5 h-3.5" />}
                  </button>
                  {ARCHITECTURE_GROUPS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => {
                        setSelectedGroupFilter(g.id);
                        setIsFilterDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-[#F8FAFC] cursor-pointer flex items-center justify-between ${
                        selectedGroupFilter === g.id ? 'font-bold text-[#1677C8]' : 'text-[#17212B]'
                      }`}
                    >
                      <span className="truncate">
                        {g.number}. {g.title}
                      </span>
                      {selectedGroupFilter === g.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center bg-[#F8FAFC] border border-[#D0D7DE] rounded-lg p-0.5">
              <button
                onClick={() => setZoom((prev) => Math.min(prev + 0.15, 2.0))}
                className="p-1 hover:bg-white text-[#475467] hover:text-[#17212B] rounded transition-colors"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 text-[10px] font-mono text-[#64748B]">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((prev) => Math.max(prev - 0.15, 0.4))}
                className="p-1 hover:bg-white text-[#475467] hover:text-[#17212B] rounded transition-colors"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setZoom(0.85);
                  setPan({ x: 40, y: 20 });
                }}
                className="p-1 hover:bg-white text-[#475467] hover:text-[#17212B] rounded transition-colors border-l border-[#E2E8F0] ml-0.5"
                title="Reset View (0)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Export Menu */}
            <div className="flex items-center gap-1 border-l border-[#D0D7DE] pl-2">
              <button
                onClick={handleExportSVG}
                className="px-2 py-1 text-xs font-medium rounded-lg border border-[#D0D7DE] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#17212B] transition-colors cursor-pointer"
                title="Export clean standalone vector SVG"
              >
                SVG
              </button>
              <button
                onClick={handleExportPNG}
                className="px-2 py-1 text-xs font-medium rounded-lg border border-[#D0D7DE] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#17212B] transition-colors cursor-pointer"
                title="Export high-resolution PNG image"
              >
                PNG
              </button>
              <button
                onClick={handleExportJSON}
                className="px-2 py-1 text-xs font-medium rounded-lg border border-[#D0D7DE] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#17212B] transition-colors cursor-pointer"
                title="Export machine-readable JSON architecture specification"
              >
                JSON
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="p-1.5 rounded-lg border border-[#D0D7DE] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#475467] hover:text-[#17212B] transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-[#D0D7DE] bg-[#F8FAFC] hover:bg-[#FEE2E2] hover:text-[#B42318] hover:border-[#FCA5A5] text-[#475467] transition-colors cursor-pointer ml-1"
              title="Close Architecture Diagram (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* NOTIFICATION TOAST */}
        {/* ------------------------------------------------------------------- */}
        {copiedNotification && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-[#17212B] text-white text-xs px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 border border-[#475467]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>{copiedNotification}</span>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* WORKSPACE CANVAS + SIDE INSPECTOR */}
        {/* ------------------------------------------------------------------- */}
        <div className="relative flex-1 flex overflow-hidden bg-[#FFFFFF]">
          {/* Main SVG Pan/Zoom Canvas */}
          <div
            className="flex-1 h-full overflow-hidden cursor-grab active:cursor-grabbing bg-[#FFFFFF] relative"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
          >
            <svg
              ref={svgRef}
              className="w-full h-full block"
              style={{ backgroundColor: '#FFFFFF' }}
            >
              {/* SVG Definitions: Clean Arrowhead Markers */}
              <defs>
                {/* Standard Data Flow Arrow (Neutral Slate) */}
                <marker
                  id="arrow-default"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#94A3B8" />
                </marker>

                {/* Validated Flow Arrow (Restrained Teal) */}
                <marker
                  id="arrow-validated"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0F766E" />
                </marker>

                {/* Quarantine / Failure Flow Arrow (Muted Red) */}
                <marker
                  id="arrow-failure"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#B42318" />
                </marker>

                {/* Warning Flow Arrow (Muted Amber) */}
                <marker
                  id="arrow-warning"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#B7791F" />
                </marker>

                {/* Active / Highlighted Flow Arrow (Restrained Blue) */}
                <marker
                  id="arrow-active"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1677C8" />
                </marker>
              </defs>

              {/* Master Scaled and Panned Group */}
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* 1. Group Containers (Subsystem Boundaries) */}
                {ARCHITECTURE_GROUPS.map((grp) => {
                  const isVisible =
                    selectedGroupFilter === 'all' || selectedGroupFilter === grp.id;
                  const opacity = isVisible ? 1 : 0.2;

                  return (
                    <g key={grp.id} opacity={opacity} className="transition-opacity duration-200">
                      {/* Group Background */}
                      <rect
                        x={grp.bounds.x}
                        y={grp.bounds.y}
                        width={grp.bounds.width}
                        height={grp.bounds.height}
                        rx={8}
                        ry={8}
                        fill="#F8FAFC"
                        stroke="#D0D7DE"
                        strokeWidth={1}
                      />
                      {/* Group Header Label */}
                      <rect
                        x={grp.bounds.x}
                        y={grp.bounds.y}
                        width={grp.bounds.width}
                        height={34}
                        rx={8}
                        ry={8}
                        fill="#F1F5F9"
                        stroke="#D0D7DE"
                        strokeWidth={1}
                      />
                      <rect
                        x={grp.bounds.x}
                        y={grp.bounds.y + 26}
                        width={grp.bounds.width}
                        height={8}
                        fill="#F1F5F9"
                      />
                      <text
                        x={grp.bounds.x + 12}
                        y={grp.bounds.y + 22}
                        fill="#17212B"
                        fontSize={12}
                        fontWeight="bold"
                        fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
                      >
                        {grp.number}. {grp.title}
                      </text>
                    </g>
                  );
                })}

                {/* 2. Orthogonal Connectors (Behind Nodes) */}
                {ARCHITECTURE_EDGES.map((edge) => {
                  const strokeColor = getEdgeStroke(edge);
                  const isHighlighted =
                    hoveredEdgeId === edge.id ||
                    (selectedNodeId &&
                      (edge.sourceId === selectedNodeId || edge.targetId === selectedNodeId));
                  const strokeWidth = isHighlighted ? 2.5 : 1.5;
                  const isDashed = edge.edgeType === 'feedback_loop';

                  let markerId = 'arrow-default';
                  if (isHighlighted) markerId = 'arrow-active';
                  else if (edge.edgeType === 'validated_flow') markerId = 'arrow-validated';
                  else if (edge.edgeType === 'quarantine_flow' || edge.edgeType === 'failure_flow')
                    markerId = 'arrow-failure';
                  else if (edge.edgeType === 'warning_flow') markerId = 'arrow-warning';

                  return (
                    <g
                      key={edge.id}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredEdgeId(edge.id)}
                      onMouseLeave={() => setHoveredEdgeId(null)}
                    >
                      {/* Hover hit area */}
                      <path
                        d={edge.path}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={14}
                      />
                      {/* Actual visible path */}
                      <path
                        d={edge.path}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={isDashed ? '5,4' : undefined}
                        markerEnd={`url(#${markerId})`}
                        className="transition-colors duration-150"
                      />
                      {/* Optional edge label */}
                      {edge.label && (
                        <text
                          className="select-none pointer-events-none"
                          fontSize={9}
                          fontFamily="ui-monospace, monospace"
                          fill={isHighlighted ? '#1677C8' : '#64748B'}
                          fontWeight={isHighlighted ? 'bold' : 'normal'}
                        >
                          <textPath href={`#${edge.id}`} startOffset="50%" textAnchor="middle">
                            {edge.label}
                          </textPath>
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* 3. Engineering Nodes (HTML foreignObject for wrap & exact layout) */}
                {ARCHITECTURE_NODES.map((node) => {
                  const isSelected = selectedNodeId === node.id;
                  const isHovered = hoveredNodeId === node.id;
                  const isUpstream = activeDependencySet.up.has(node.id);
                  const isDownstream = activeDependencySet.down.has(node.id);

                  // Search match filter
                  const matchesSearch =
                    !searchQuery ||
                    node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    node.inputDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    node.outputDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    node.sourceFiles.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));

                  // Group filter
                  const matchesGroup =
                    selectedGroupFilter === 'all' || selectedGroupFilter === node.groupId;

                  const opacity = matchesSearch && matchesGroup ? 1 : 0.25;

                  // Border color and highlight calculation
                  let borderColor = '#D0D7DE';
                  let borderWidth = 'border';
                  let ringClass = '';

                  if (node.isDiagnosticPath) {
                    if (node.id === 'out_quarantine' || node.id === 'out_planner_diagnostics') {
                      borderColor = '#B42318'; // Muted Red
                    } else if (node.id === 'out_quality_warnings') {
                      borderColor = '#B7791F'; // Muted Amber
                    }
                  }

                  if (isSelected) {
                    borderColor = '#1677C8';
                    borderWidth = 'border-2';
                    ringClass = 'ring-2 ring-[#1677C8]/20 shadow-md';
                  } else if (isHovered) {
                    borderColor = '#1677C8';
                    ringClass = 'shadow-sm';
                  } else if (isUpstream) {
                    borderColor = '#1677C8';
                    ringClass = 'ring-1 ring-[#1677C8]/40';
                  } else if (isDownstream) {
                    borderColor = '#0F766E';
                    ringClass = 'ring-1 ring-[#0F766E]/40';
                  }

                  return (
                    <foreignObject
                      key={node.id}
                      x={node.x}
                      y={node.y}
                      width={node.width}
                      height={node.height}
                      className="overflow-visible interactive-node"
                      opacity={opacity}
                    >
                      <div
                        onClick={(e) => handleNodeClick(node.id, e)}
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        className={`w-full h-full bg-white rounded-lg p-3 transition-all duration-150 flex flex-col justify-between cursor-pointer select-none text-left ${borderWidth} ${ringClass}`}
                        style={{
                          borderColor: isSelected || isHovered || isUpstream || isDownstream ? undefined : borderColor,
                          borderColor: borderColor,
                        }}
                      >
                        {/* Card Header: Title & Badges */}
                        <div>
                          <div className="flex items-start justify-between gap-1.5 mb-1">
                            <span className="text-xs font-bold text-[#17212B] leading-tight break-words">
                              {node.title}
                            </span>
                            <div className="shrink-0">
                              {renderStatusBadge(node.status, node.statusLabel)}
                            </div>
                          </div>

                          {/* Source or Category Subtitle */}
                          {node.sourceName && (
                            <p className="text-[10px] text-[#475467] leading-tight font-medium mb-1 truncate">
                              Source: {node.sourceName}
                            </p>
                          )}
                        </div>

                        {/* Input & Output Rows (Concise Engineering Specification) */}
                        <div className="mt-auto pt-1 border-t border-[#F1F5F9] space-y-0.5 text-[10px] leading-tight font-sans">
                          <div className="truncate">
                            <span className="text-[#64748B] font-semibold">Input: </span>
                            <span className="text-[#17212B]">{node.inputDescription}</span>
                          </div>
                          <div className="truncate">
                            <span className="text-[#64748B] font-semibold">Output: </span>
                            <span className="text-[#17212B]">{node.outputDescription}</span>
                          </div>
                        </div>

                        {/* Dependency Relationship Pills on Card */}
                        {(isUpstream || isDownstream) && (
                          <div className="mt-1 flex items-center gap-1">
                            {isUpstream && (
                              <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-[#EBF3FB] text-[#1677C8] border border-[#B9D9F8]">
                                Upstream Input
                              </span>
                            )}
                            {isDownstream && (
                              <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-[#E6F4EA] text-[#0F766E] border border-[#A3E0C4]">
                                Downstream Dependent
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </foreignObject>
                  );
                })}
              </g>
            </svg>

            {/* Bottom Floating Legend */}
            <div className="absolute left-4 bottom-4 bg-white/95 backdrop-blur-xs border border-[#D0D7DE] rounded-lg p-2.5 shadow-md text-xs max-w-sm pointer-events-auto">
              <span className="font-bold text-[#17212B] block mb-1 text-[11px] uppercase tracking-wider">
                Engineering Blueprint Legend
              </span>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-[#94A3B8]" />
                  <span className="text-[#475467]">Standard Data Flow</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-[#0F766E]" />
                  <span className="text-[#0F766E] font-medium">Validated Flow</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-[#B7791F]" />
                  <span className="text-[#B7791F] font-medium">Quality Warnings</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-[#B42318]" />
                  <span className="text-[#B42318] font-medium">Quarantine / Failure</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-[#1677C8] border-b border-dashed border-[#1677C8]" />
                  <span className="text-[#1677C8] font-medium">Feedback Loop</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#1677C8]" />
                  <span className="text-[#475467]">Selected Component</span>
                </div>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* RIGHT SIDE INSPECTOR DRAWER */}
          {/* ----------------------------------------------------------------- */}
          {isInspectorOpen && selectedNode && (
            <div className="w-80 md:w-96 border-l border-[#D0D7DE] bg-white flex flex-col shrink-0 shadow-lg z-20 overflow-y-auto">
              {/* Inspector Header */}
              <div className="p-3.5 border-b border-[#D0D7DE] bg-[#F8FAFC] flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-mono uppercase font-bold text-[#64748B]">
                      {selectedNode.groupId.replace('grp_', '').replace('_', ' ')}
                    </span>
                    <span className="text-[#94A3B8]">&bull;</span>
                    {renderStatusBadge(selectedNode.status, selectedNode.statusLabel)}
                  </div>
                  <h3 className="text-sm font-bold text-[#17212B] leading-snug">
                    {selectedNode.title}
                  </h3>
                </div>
                <button
                  onClick={() => setIsInspectorOpen(false)}
                  className="p-1 rounded hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#17212B] transition-colors"
                  title="Close Inspector"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Inspector Body */}
              <div className="p-4 space-y-4 text-xs text-[#17212B] font-sans">
                {/* 1. Purpose */}
                <div>
                  <h4 className="font-bold text-[#475467] uppercase text-[10px] tracking-wider mb-1">
                    System Purpose &amp; Role
                  </h4>
                  <p className="text-[#17212B] leading-relaxed bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                    {selectedNode.purpose}
                  </p>
                </div>

                {/* 2. Concrete Inputs & Outputs */}
                <div className="space-y-2">
                  <div>
                    <h4 className="font-bold text-[#475467] uppercase text-[10px] tracking-wider mb-1">
                      Concrete Inputs
                    </h4>
                    <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] font-mono text-[11px] text-[#334155]">
                      {selectedNode.inputDescription}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-[#475467] uppercase text-[10px] tracking-wider mb-1">
                      Concrete Outputs
                    </h4>
                    <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] font-mono text-[11px] text-[#0F766E]">
                      {selectedNode.outputDescription}
                    </div>
                  </div>
                </div>

                {/* 3. Verified Codebase Source Files */}
                <div>
                  <h4 className="font-bold text-[#475467] uppercase text-[10px] tracking-wider mb-1">
                    Verified Repository Source Files
                  </h4>
                  <div className="space-y-1">
                    {selectedNode.sourceFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 p-1.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] font-mono text-[11px] text-[#1677C8]"
                      >
                        <FileCode className="w-3.5 h-3.5 shrink-0 text-[#64748B]" />
                        <span className="truncate">{file}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Technical Implementation Notes */}
                {selectedNode.technicalNotes && (
                  <div>
                    <h4 className="font-bold text-[#475467] uppercase text-[10px] tracking-wider mb-1">
                      Engineering &amp; Epistemic Notes
                    </h4>
                    <p className="text-[#475467] leading-relaxed bg-[#FFFBEB] p-2.5 rounded-lg border border-[#FDE68A] text-[11px]">
                      {selectedNode.technicalNotes}
                    </p>
                  </div>
                )}

                {/* 5. Data Dependencies (Clickable Tracing) */}
                <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
                  <div>
                    <span className="font-bold text-[#475467] uppercase text-[10px] tracking-wider block mb-1">
                      Upstream Dependencies ({selectedNode.upstreamIds.length})
                    </span>
                    {selectedNode.upstreamIds.length === 0 ? (
                      <span className="text-[11px] text-[#94A3B8] italic">Root external input</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {selectedNode.upstreamIds.map((id) => {
                          const upNode = ARCHITECTURE_NODES.find((n) => n.id === id);
                          if (!upNode) return null;
                          return (
                            <button
                              key={id}
                              onClick={() => setSelectedNodeId(id)}
                              className="px-2 py-0.5 rounded bg-[#EBF3FB] hover:bg-[#D5E8F8] text-[#1677C8] border border-[#B9D9F8] text-[10px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <span className="truncate max-w-[140px]">{upNode.title}</span>
                              <ChevronRight className="w-3 h-3 shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="font-bold text-[#475467] uppercase text-[10px] tracking-wider block mb-1">
                      Downstream Dependents ({selectedNode.downstreamIds.length})
                    </span>
                    {selectedNode.downstreamIds.length === 0 ? (
                      <span className="text-[11px] text-[#94A3B8] italic">Terminal output / audit log</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {selectedNode.downstreamIds.map((id) => {
                          const downNode = ARCHITECTURE_NODES.find((n) => n.id === id);
                          if (!downNode) return null;
                          return (
                            <button
                              key={id}
                              onClick={() => setSelectedNodeId(id)}
                              className="px-2 py-0.5 rounded bg-[#E6F4EA] hover:bg-[#CEEBD9] text-[#0F766E] border border-[#A3E0C4] text-[10px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <span className="truncate max-w-[140px]">{downNode.title}</span>
                              <ChevronRight className="w-3 h-3 shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
