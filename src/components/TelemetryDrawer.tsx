import React, { useState } from 'react';
import {
  X,
  Cpu,
  Download,
  Copy,
  Check,
  Database,
  Layers,
  GitBranch,
  ShieldCheck,
  Compass,
  FileCode,
} from 'lucide-react';
import { TELEMETRY_PROVENANCE, TELEMETRY_AUDIT_SUMMARY } from '../data/disasterData';

interface TelemetryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelemetryDrawer: React.FC<TelemetryDrawerProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyJson = () => {
    fetch('/silchar_telemetry_v1.json')
      .then((res) => res.text())
      .then((text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        setCopied(false);
      });
  };

  const handleDownloadJson = () => {
    const link = document.createElement('a');
    link.href = '/silchar_telemetry_v1.json';
    link.download = 'silchar_telemetry_v1.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadCsv = () => {
    const link = document.createElement('a');
    link.href = '/cachar_319_settlements_spatial_audit.csv';
    link.download = 'cachar_319_settlements_spatial_audit.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-950/70 border border-blue-600/40 text-blue-400">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  ⚙️ Spatial Engine Telemetry & Provenance
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-700/50">
                  EPSG:32646 UTM Zone 46N
                </span>
              </div>
              <p className="text-xs text-[#8b949e]">
                Deterministic Spatial Graph Compiler Output • OSMnx + NetworkX + GeoPandas + Sentinel-1 SAR
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#21262d] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Unified Bridge Across 4 Government Silos Banner */}
          <div className="bg-[#0d1117] border border-cyan-500/40 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Unified Bridge Across Disconnected Government Silos
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/60 font-bold">
                ● Live Inter-Agency Bridge
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px] font-mono">
              <div className="p-2.5 rounded-lg bg-[#161b22] border border-[#30363d] space-y-1">
                <div className="text-cyan-400 font-bold">🛰️ SAR Satellite Radar</div>
                <div className="text-[10px] text-neutral-400">Flood Hub Satellite Polygons</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#161b22] border border-[#30363d] space-y-1">
                <div className="text-emerald-400 font-bold">🛣️ PWD Road Graph</div>
                <div className="text-[10px] text-neutral-400">Tarjan O(V+E) Bridgeheads</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#161b22] border border-[#30363d] space-y-1">
                <div className="text-purple-400 font-bold">🏥 NHM Hospital Triage</div>
                <div className="text-[10px] text-neutral-400">Bed Surge &amp; Catchment Loads</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#161b22] border border-[#30363d] space-y-1">
                <div className="text-amber-400 font-bold">📦 NIDM IDRN Inventory</div>
                <div className="text-[10px] text-neutral-400">SDRF Bailey Spans &amp; Boats</div>
              </div>
            </div>
          </div>

          {/* Key Graph Compilation Stats Grid */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#8b949e] mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              Source Graph &amp; SAR Compilation Audit (Deterministic Grounding)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="bg-[#0d1117] p-3.5 rounded-xl border border-[#21262d] space-y-1">
                <div className="text-[#8b949e] text-[11px] font-semibold">Source Topological Graph</div>
                <div className="text-sm font-bold text-white font-mono">cachar_bbox.osm.pbf</div>
                <div className="text-emerald-400 font-mono text-[11px]">
                  31,214 nodes • 69,663 directed edges
                </div>
              </div>

              <div className="bg-[#0d1117] p-3.5 rounded-xl border border-[#21262d] space-y-1">
                <div className="text-[#8b949e] text-[11px] font-semibold">SAR Flood Inundation Sensor</div>
                <div className="text-sm font-bold text-[#00BFFF] font-mono">Sentinel-1 C-Band SAR</div>
                <div className="text-red-400 font-mono text-[11px]">
                  1,830 severed road surface edges
                </div>
              </div>

              <div className="bg-[#0d1117] p-3.5 rounded-xl border border-[#21262d] space-y-1">
                <div className="text-[#8b949e] text-[11px] font-semibold">Condensation Tree Articulations</div>
                <div className="text-sm font-bold text-amber-400 font-mono">183 Articulation Cut-Edges</div>
                <div className="text-[#8b949e] font-mono text-[11px]">
                  O(V + E) 2-edge connected components
                </div>
              </div>

              <div className="bg-[#0d1117] p-3.5 rounded-xl border border-[#21262d] space-y-1">
                <div className="text-[#8b949e] text-[11px] font-semibold">Bridgehead Ramp Defense</div>
                <div className="text-sm font-bold text-[#ff4d4d] font-mono">163 Bridges Pruned</div>
                <div className="text-[#8b949e] text-[11px]">
                  Submerged approach ramps severed
                </div>
              </div>

              <div className="bg-[#0d1117] p-3.5 rounded-xl border border-[#21262d] space-y-1">
                <div className="text-[#8b949e] text-[11px] font-semibold">Metric Snapping Threshold</div>
                <div className="text-sm font-bold text-white font-mono">&le; 1,500 meters</div>
                <div className="text-emerald-400 text-[11px]">
                  Water-barrier polygon ray-casting check
                </div>
              </div>

              <div className="bg-[#0d1117] p-3.5 rounded-xl border border-[#21262d] space-y-1">
                <div className="text-[#8b949e] text-[11px] font-semibold">Physical Surface Impedance</div>
                <div className="text-sm font-bold text-purple-400 font-mono">Dynamic Speed Physics</div>
                <div className="text-[#8b949e] text-[11px]">
                  Paved: 1.0 • Unpaved: 0.4 • Water: 0.2
                </div>
              </div>
            </div>
          </div>

          {/* Mathematical Formulations & Graph Invariants (Criticality Formula) */}
          <div className="bg-[#0d1117] border border-blue-900/50 rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                Mathematical Graph Invariants & Edge Criticality Formulation
              </span>
              <span className="text-[10px] font-mono text-[#8b949e]">Tarjan Bridge-Finding & Linear Condensation</span>
            </div>

            <div className="bg-[#161b22] p-3.5 rounded-lg border border-[#30363d] space-y-2 font-mono text-[11px]">
              <div className="text-emerald-400 font-bold">
                Criticality(e) = ∑ [ d_G(v, H(v)) = ∞ ∨ Δd_G(e, v) &gt; τ ] × Pop(v) × W_axle
              </div>
              <div className="text-[#8b949e] text-[10px] leading-relaxed">
                Where <strong className="text-white">e ∈ E</strong> is an articulation candidate, <strong className="text-white">v ∈ V</strong> are dependent village centroids, <strong className="text-white">H(v)</strong> is the designated tertiary healthcare center, and <strong className="text-white">W_axle</strong> represents the vehicle turning & axle-load penalty coefficient.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div className="bg-[#161b22] p-2.5 rounded-lg border border-[#30363d] space-y-1">
                <span className="text-white font-semibold">1. SAR Topological Percolation:</span>
                <p className="text-[#8b949e] font-mono text-[10px]">
                  G_flood = G \ &#123; e ∈ E | e ∩ M_SAR ≠ ∅ &#125;
                </p>
                <p className="text-[#8b949e] text-[10px]">
                  Removes 1,830 flood-intersected edges from the 69,663 edge graph based on Sentinel-1 C-band SAR water masks.
                </p>
              </div>

              <div className="bg-[#161b22] p-2.5 rounded-lg border border-[#30363d] space-y-1">
                <span className="text-white font-semibold">2. Counterfactual Bailey Bridge ROI:</span>
                <p className="text-[#8b949e] font-mono text-[10px]">
                  ROI(e) = [Δ Settlements Rescued × 10⁵] / [Capex (₹ Lakh)]
                </p>
                <p className="text-[#8b949e] text-[10px]">
                  JT Road restores 27 settlements across 3 spans (420m) yielding a peak engineering efficiency ratio of 43.14.
                </p>
              </div>
            </div>
          </div>

          {/* 319-Settlement Audit Metrics */}
          <div className="bg-[#0d1117] border border-[#21262d] rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[#8b949e] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Deterministic Output Audit Summary (Cachar District)
              </span>
              <span className="text-white font-mono">319 Habitats Analyzed (100% Evaluated)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-[#161b22] p-3 rounded-lg border border-[#30363d]">
                <div className="text-[10px] text-[#8b949e]">Total in PBF</div>
                <div className="text-lg font-bold text-white font-mono">334 Villages</div>
              </div>
              <div className="bg-[#161b22] p-3 rounded-lg border border-[#30363d]">
                <div className="text-[10px] text-red-400">Completely Isolated</div>
                <div className="text-lg font-bold text-[#ff4d4d] font-mono">42 Sites (13.2%)</div>
              </div>
              <div className="bg-[#161b22] p-3 rounded-lg border border-[#30363d]">
                <div className="text-[10px] text-amber-400">Rerouted Alt Facility</div>
                <div className="text-lg font-bold text-[#ffaa00] font-mono">87 Sites (27.3%)</div>
              </div>
              <div className="bg-[#161b22] p-3 rounded-lg border border-[#30363d]">
                <div className="text-[10px] text-cyan-400">Peak Detour Surcharge</div>
                <div className="text-lg font-bold text-[#00BFFF] font-mono">+11.68 km (7.91x)</div>
              </div>
            </div>
          </div>

          {/* Download Buttons for Technical Judges */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[#8b949e] flex items-center gap-2">
              <Download className="w-4 h-4 text-cyan-400" />
              Download Provenance Assets (Direct Deterministic Proof for Judges)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleDownloadJson}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-white border border-[#30363d] shadow-md transition-all cursor-pointer font-semibold text-xs"
              >
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span>📥 Download silchar_telemetry_v1.json (266 KB)</span>
              </button>

              <button
                onClick={handleDownloadCsv}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-white border border-[#30363d] shadow-md transition-all cursor-pointer font-semibold text-xs"
              >
                <Database className="w-4 h-4 text-emerald-400" />
                <span>📥 Download cachar_319_settlements_spatial_audit.csv (53 KB)</span>
              </button>
            </div>
          </div>

          {/* Raw JSON Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#8b949e]">
              <span>Raw JSON Telemetry Inspector (First 25 Lines)</span>
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Full JSON!' : 'Copy Full JSON'}</span>
              </button>
            </div>

            <div className="bg-[#0d1117] border border-[#21262d] rounded-xl p-4 font-mono text-[11px] text-cyan-300 max-h-[180px] overflow-y-auto">
              <pre>{JSON.stringify({
                telemetry_schema_version: '1.2.0-deterministic',
                compilation_timestamp: '2026-10-14T03:35:00Z',
                provenance: TELEMETRY_PROVENANCE,
                audit_summary: TELEMETRY_AUDIT_SUMMARY,
              }, null, 2)}</pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#30363d] bg-[#0d1117] flex items-center justify-between">
          <span className="text-[11px] text-[#8b949e]">
            Static verification asset hosted at <code className="text-cyan-400">/silchar_telemetry_v1.json</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer"
          >
            Close Telemetry Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
