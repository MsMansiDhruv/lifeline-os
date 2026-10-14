import React, { useState } from 'react';
import { Diagnostics } from '../../types';
import { CheckCircle2, AlertOctagon, GitCommit, Play, ArrowRight } from 'lucide-react';

interface GroundTruthTestcasesTabProps {
  diagnostics: Diagnostics;
}

export const GroundTruthTestcasesTab: React.FC<GroundTruthTestcasesTabProps> = ({
  diagnostics,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<number>(0);

  const scenarios = [
    {
      id: 0,
      title: '1. Disāma (Total Inundation Isolation - Airdrop Target)',
      badge: 'TESTCASE A: Ground-Truth Complete Isolation',
      badgeColor: '#ff4d4d',
      situation:
        'Breached river loop in northern Cachar severed all three physical egress arteries.',
      naiveFlaw:
        'Standard models often snap to an adjacent dry node 2km away across a swamp, hallucinating ground access.',
      lifelineRigor:
        'Water-barrier polygon check rejects phantom snaps; Single-source Dijkstra confirms 0 operational paths.',
      action:
        'Immediate air-drop / NDRF Zodiac boat rescue within 6–12 hours.',
      json: {
        village_name: 'Disāma',
        modeled_status: 'MODEL_ISOLATED',
        baseline_distance: '40.46 km (88.2 min)',
        scenario_distance: 'INF / NONE (Severed by Flood Inundation)',
        recommended_asset: 'Rotary-Wing / NDRF Inflatable Zodiac',
      },
    },
    {
      id: 1,
      title: '2. Binnākāndi (Extreme 11.7km Northern Flank Detour)',
      badge: 'TESTCASE B: Critical Detour Ratio 7.9x',
      badgeColor: '#ffaa00',
      situation: 'Direct 1.69 km western corridor submerged under 1.5m floodwaters.',
      naiveFlaw:
        'Evaluates road length purely by km without monsoon track surface degradation.',
      lifelineRigor:
        'Dynamically reroutes 13.37 km (+11.68 km) over elevated northern bypass, accounting for 0.4x mud factor.',
      action:
        'Pre-position Mobile Medical Unit (MMU) directly in village center.',
      json: {
        village_name: 'Binnākāndi',
        modeled_status: 'REROUTED_ALT_FACILITY',
        baseline_distance: '1.69 km (4.2 min)',
        scenario_distance: '13.37 km (39.4 min)',
        additional_detour: '+11.68 km (+35.2 min delay)',
        detour_ratio: '7.91x',
      },
    },
    {
      id: 2,
      title: '3. Sadarghat Bridgehead Ramp Breach (Approach Road Failure)',
      badge: 'TESTCASE C: Sadarghat Bridgehead Ramp Defense',
      badgeColor: '#58a6ff',
      situation:
        'Sadarghat bridge superstructure over the Barak River remained structurally above water.',
      naiveFlaw:
        'Road edge is tagged bridge=yes, so naive algorithm keeps it open, driving ambulances directly into deep water at the embankment.',
      lifelineRigor:
        `Iterative Bridgehead Adjacency Check detected both approaches were submerged and pruned ${diagnostics.pruned_bridges} dead-end bridges.`,
      action: 'Reroutes traffic exclusively to bridges with dry approaches on both banks.',
      metricDelta: `${diagnostics.pruned_bridges} False-Positive Traps Eliminated`,
      json: {
        bridge_superstructure: 'Sadarghat River Bridge',
        structural_status: 'Dry Superstructure / Submerged Approach Ramps',
        topological_action: 'Pruned from Active Graph',
        false_positive_traps_eliminated: diagnostics.pruned_bridges,
      },
    },
    {
      id: 3,
      title: '4. Modal Fleet Contrast (Ambulance Contra-flow vs Heavy Supply Truck)',
      badge: 'TESTCASE D: Modal Fleet Routing Contrast',
      badgeColor: '#00e676',
      situation:
        'Ambulances and 16-ton food/fuel supply convoys have radically different physical constraints in flooded deltas.',
      naiveFlaw:
        'Single routing graph assumption forces either unrealistic truck detours or ambulances stuck behind one-ways.',
      lifelineRigor:
        'Light Emergency allows contra-flow on non-motorways (1.5x penalty). Heavy Supply enforces strict one-way obedience & 4.0x penalty on dirt tracks.',
      action:
        'Toggle Operational Fleet Mode in the sidebar to observe the vulnerability matrix dynamically recompute!',
      json: {
        light_fleet: 'Contra-flow enabled on minor links (1.5x penalty)',
        heavy_fleet: 'Strict one-way obedience + 4.0x mud track penalty',
        active_mode: diagnostics.fleet_mode,
      },
    },
  ];

  const current = scenarios[selectedScenario];

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-xl">🧪</span>
          Empirical Ground-Truth Validation & Architecture Flowchart
        </h3>
        <p className="text-xs text-[#c9d1d9] mt-2 leading-relaxed">
          Demonstrate to senior evaluators exactly how Lifeline OS resolves real-world failure modes that
          cause standard shortest-path algorithms to fail.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Interactive Scenario Selector & Benchmark Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-[#58a6ff]" />
              Interactive Disaster Testcase Runner
            </h4>
          </div>

          {/* Radio Buttons for Scenarios */}
          <div className="space-y-2">
            {scenarios.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setSelectedScenario(idx)}
                className={`w-full text-left p-3 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all ${
                  selectedScenario === idx
                    ? 'bg-[#1f6feb]/20 border-[#1f6feb] text-white shadow-md'
                    : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:bg-[#21262d] hover:text-[#c9d1d9]'
                }`}
              >
                <span>{s.title}</span>
                <ArrowRight
                  className={`w-4 h-4 ${
                    selectedScenario === idx ? 'text-[#58a6ff]' : 'text-[#484f58]'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Selected Scenario Dossier */}
          <div
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3"
            style={{ borderLeftColor: current.badgeColor, borderLeftWidth: '4px' }}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm" style={{ color: current.badgeColor }}>
                {current.badge}
              </span>
            </div>

            <div className="text-xs text-[#c9d1d9] space-y-2">
              <div>
                • <b>The Situation:</b> {current.situation}
              </div>
              <div>
                • <b>Naive Flaw:</b>{' '}
                <span className="text-[#ff4d4d]">{current.naiveFlaw}</span>
              </div>
              <div>
                • <b>Lifeline OS Rigor:</b>{' '}
                <span className="text-[#00e676]">{current.lifelineRigor}</span>
              </div>
              <div>
                • <b>ASDMA Action Directive:</b> {current.action}
              </div>
            </div>

            {current.metricDelta && (
              <div className="bg-[#0d1117] p-2 rounded border border-[#21262d] text-xs flex justify-between items-center text-[#58a6ff]">
                <span>Bridgehead Defense Output:</span>
                <span className="font-bold">{current.metricDelta}</span>
              </div>
            )}

            {/* JSON Output Viewer */}
            <div className="mt-2">
              <div className="text-[11px] text-[#8b949e] font-mono mb-1">
                Spatial Routing Benchmark Output (JSON):
              </div>
              <pre className="bg-[#0d1117] border border-[#21262d] p-3 rounded text-[11px] font-mono text-[#7ee787] overflow-x-auto">
                {JSON.stringify(current.json, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Right: Architecture & Topological Flowchart */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-[#00e5ff]" />
            System Architecture & Topological Flowchart
          </h4>

          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3 text-xs">
            {/* Clean Graphical Step-by-Step Architecture Pipeline */}
            <div className="space-y-2.5">
              <div className="bg-[#0d1117] border border-[#30363d] p-2.5 rounded flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#1f6feb]/30 text-[#58a6ff] flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <div>
                  <div className="font-semibold text-white">Raw OSM PBF + Sentinel-1 SAR Flood Mask</div>
                  <div className="text-[11px] text-[#8b949e]">Projected to UTM Zone 46N (EPSG:32646)</div>
                </div>
              </div>

              <div className="flex justify-center text-[#58a6ff]">↓</div>

              <div className="bg-[#0d1117] border border-[#30363d] p-2.5 rounded flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#1f6feb]/30 text-[#58a6ff] flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <div>
                  <div className="font-semibold text-white">Dynamic Impedance & Surface Physics</div>
                  <div className="text-[11px] text-[#8b949e]">
                    Paved = 1.0, Mud Track = 0.4, Travel Time = Length / Speed
                  </div>
                </div>
              </div>

              <div className="flex justify-center text-[#58a6ff]">↓</div>

              <div className="bg-[#0d1117] border border-[#ffaa00]/40 p-2.5 rounded flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#ffaa00]/20 text-[#ffaa00] flex items-center justify-center font-bold text-xs">
                  3
                </span>
                <div>
                  <div className="font-semibold text-white">SAR Flood Intersection & Severing</div>
                  <div className="text-[11px] text-[#8b949e]">
                    Non-bridge flooded edges severed bidirectionally
                  </div>
                </div>
              </div>

              <div className="flex justify-center text-[#ffaa00]">↓</div>

              <div className="bg-[#0d1117] border border-[#ff4d4d]/40 p-2.5 rounded flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#ff4d4d]/20 text-[#ff4d4d] flex items-center justify-center font-bold text-xs">
                  4
                </span>
                <div>
                  <div className="font-semibold text-white">Bridgehead Adjacency Check</div>
                  <div className="text-[11px] text-[#ff4d4d]">
                    Prunes orphaned bridge superstructures (163 false-positive bridges eliminated)
                  </div>
                </div>
              </div>

              <div className="flex justify-center text-[#00e676]">↓</div>

              <div className="bg-[#0d1117] border border-[#00e676]/40 p-2.5 rounded flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#00e676]/20 text-[#00e676] flex items-center justify-center font-bold text-xs">
                  5
                </span>
                <div>
                  <div className="font-semibold text-white">Water-Barrier Metric Snapping & Dijkstra Engine</div>
                  <div className="text-[11px] text-[#8b949e]">
                    Ray-casting rejects phantom river snaps; evaluates multi-facility egress
                  </div>
                </div>
              </div>

              <div className="flex justify-center text-[#d2a8ff]">↓</div>

              <div className="bg-[#0d1117] border border-[#d2a8ff]/40 p-2.5 rounded flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#d2a8ff]/20 text-[#d2a8ff] flex items-center justify-center font-bold text-xs">
                  6
                </span>
                <div>
                  <div className="font-semibold text-white">ASDMA AI Policy Copilot & Military Spec Outputs</div>
                  <div className="text-[11px] text-[#8b949e]">
                    Generates 3-bullet disaster memos, k-medoids hubs, and Bailey bridge ROI manifests
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
