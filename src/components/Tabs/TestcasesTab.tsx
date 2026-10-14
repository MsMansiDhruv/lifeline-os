import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Zap, CheckCircle2, AlertOctagon } from 'lucide-react';

export const TestcasesTab: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<number>(1);

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-xl shadow-md">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-purple-950/60 text-purple-400 border border-purple-800/50 mt-0.5">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Empirical Ground-Truth Validation & Architecture Flowchart
            </h3>
            <p className="text-xs text-[#8b949e] mt-1 leading-relaxed">
              Demonstrate to evaluators and disaster management authorities exactly how Lifeline OS resolves real-world failure modes
              that cause standard shortest-path algorithms to fail during catastrophic inundations.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Interactive Scenario Runner */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Interactive Disaster Testcase Runner
          </h4>

          {/* Testcase Selector Buttons */}
          <div className="grid grid-cols-1 gap-2">
            {[
              { id: 1, label: '1. Disāma (Total Inundation Isolation - Airdrop Target)', color: 'text-red-400' },
              { id: 2, label: '2. Binnākāndi (Extreme 11.7km Northern Flank Detour, 7.91x)', color: 'text-amber-400' },
              { id: 3, label: '3. Sadarghat Bridgehead Ramp Breach (Approach Road Failure)', color: 'text-blue-400' },
              { id: 4, label: '4. Modal Fleet Contrast (Ambulance Contra-flow vs Heavy Supply Truck)', color: 'text-emerald-400' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveScenario(item.id)}
                className={`p-3 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                  activeScenario === item.id
                    ? 'bg-[#1c2128] border-blue-500 text-white shadow-md'
                    : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:text-[#c9d1d9]'
                }`}
              >
                <span className={item.color}>{item.label}</span>
                <ArrowRight className={`w-3.5 h-3.5 ${activeScenario === item.id ? 'text-blue-400' : 'text-gray-600'}`} />
              </button>
            ))}
          </div>

          {/* Scenario Details */}
          {activeScenario === 1 && (
            <div className="space-y-3">
              <div className="bg-[#161b22] border-l-4 border-l-red-500 border-y border-r border-[#30363d] p-4 rounded-r-xl space-y-2 text-xs">
                <div className="font-bold text-[#ff4d4d] text-sm flex items-center gap-2">
                  <span className="pulse-danger" />
                  TESTCASE A: Disāma (Ground-Truth Complete Isolation)
                </div>
                <div className="text-[#c9d1d9] space-y-1.5 leading-relaxed">
                  <div>
                    • <strong>The Situation:</strong> Breached river loop in northern Cachar severed all three physical egress arteries.
                  </div>
                  <div>
                    • <strong>Naive Flaw:</strong> Standard models snap to an adjacent dry node 2km away across a swamp, hallucinating ground access.
                  </div>
                  <div>
                    • <strong>Lifeline OS Rigor:</strong> Water-barrier polygon check rejects phantom snaps; Single-source Dijkstra confirms{' '}
                    <strong className="text-red-400">0 operational paths</strong>.
                  </div>
                  <div>
                    • <strong>ASDMA Action Directive:</strong> Immediate air-drop / NDRF Zodiac boat rescue within 6–12 hours.
                  </div>
                </div>
              </div>

              <div className="bg-[#0d1117] border border-[#21262d] rounded-xl p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                <pre>{JSON.stringify({
                  village_name: 'Disāma',
                  modeled_status: 'MODEL_ISOLATED',
                  baseline_distance: '3.42 km (12.3 min to BPHC, Udharbond)',
                  scenario_distance: 'INF / NONE (Severed by Flood Inundation)',
                  recommended_asset: 'Rotary-Wing / NDRF Inflatable Zodiac (Base #1)',
                }, null, 2)}</pre>
              </div>
            </div>
          )}

          {activeScenario === 2 && (
            <div className="space-y-3">
              <div className="bg-[#161b22] border-l-4 border-l-amber-500 border-y border-r border-[#30363d] p-4 rounded-r-xl space-y-2 text-xs">
                <div className="font-bold text-[#ffaa00] text-sm flex items-center gap-2">
                  <span className="pulse-warning" />
                  TESTCASE B: Binnākāndi (Critical Detour Ratio 7.91x)
                </div>
                <div className="text-[#c9d1d9] space-y-1.5 leading-relaxed">
                  <div>
                    • <strong>The Situation:</strong> Direct 1.69 km western corridor submerged under 1.5m floodwaters.
                  </div>
                  <div>
                    • <strong>Naive Flaw:</strong> Evaluates road length purely by km without monsoon track surface degradation.
                  </div>
                  <div>
                    • <strong>Lifeline OS Rigor:</strong> Dynamically reroutes 13.37 km (+11.68 km) over elevated northern bypass, accounting for 0.4x mud factor.
                  </div>
                  <div>
                    • <strong>ASDMA Action Directive:</strong> Pre-position Mobile Medical Unit (MMU) directly in village center.
                  </div>
                </div>
              </div>

              <div className="bg-[#0d1117] border border-[#21262d] rounded-xl p-3 font-mono text-[11px] text-amber-400 overflow-x-auto">
                <pre>{JSON.stringify({
                  village_name: 'Binnākāndi',
                  modeled_status: 'REROUTED_ALT_FACILITY',
                  baseline_distance: '1.69 km (5.8 min to Emanuel Hospital)',
                  scenario_distance: '13.37 km (48.2 min to Valley Hospital, Silchar)',
                  additional_detour: '+11.68 km (+42.4 min delay)',
                  detour_ratio: '7.91x',
                }, null, 2)}</pre>
              </div>
            </div>
          )}

          {activeScenario === 3 && (
            <div className="space-y-3">
              <div className="bg-[#161b22] border-l-4 border-l-blue-500 border-y border-r border-[#30363d] p-4 rounded-r-xl space-y-2 text-xs">
                <div className="font-bold text-blue-400 text-sm flex items-center gap-2">
                  🛡️ TESTCASE C: Sadarghat Bridgehead Ramp Defense
                </div>
                <div className="text-[#c9d1d9] space-y-1.5 leading-relaxed">
                  <div>
                    • <strong>The Situation:</strong> Sadarghat bridge superstructure over the Barak River remained structurally above water.
                  </div>
                  <div>
                    • <strong>Naive Flaw:</strong> Road edge is tagged bridge=yes, so naive algorithm keeps it open, driving ambulances directly into deep water at the approach embankment.
                  </div>
                  <div>
                    • <strong>Lifeline OS Rigor:</strong> Iterative Bridgehead Adjacency Check detected both approaches were submerged and{' '}
                    <strong className="text-white">pruned 163 dead-end bridges</strong>.
                  </div>
                  <div>
                    • <strong>Outcome:</strong> Reroutes traffic exclusively to bridges with dry approaches on both riverbanks.
                  </div>
                </div>
              </div>

              <div className="bg-[#0d1117] border border-[#21262d] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#8b949e]">Total Approach-Severed Bridges Pruned</div>
                  <div className="text-2xl font-bold text-white mt-0.5">163 Bridges</div>
                </div>
                <div className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-950/60 text-blue-400 border border-blue-800/40">
                  False-Positive Traps Eliminated
                </div>
              </div>
            </div>
          )}

          {activeScenario === 4 && (
            <div className="space-y-3">
              <div className="bg-[#161b22] border-l-4 border-l-emerald-500 border-y border-r border-[#30363d] p-4 rounded-r-xl space-y-2 text-xs">
                <div className="font-bold text-[#00e676] text-sm flex items-center gap-2">
                  🚒 TESTCASE D: Modal Fleet Routing Contrast
                </div>
                <div className="text-[#c9d1d9] space-y-1.5 leading-relaxed">
                  <div>
                    • <strong>Light Emergency (Ambulance/4x4):</strong> Ambulances bypass traffic via contra-flow on non-motorway one-ways (1.5x penalty) and can negotiate mud tracks (1.0x - 0.4x).
                  </div>
                  <div>
                    • <strong>Heavy Supply (16-ton Truck/Bus):</strong> Strictly obeys one-ways and faces heavy 4.0x impedance on rural unpaved dirt tracks. Rural bridges with weight restrictions are auto-pruned.
                  </div>
                  <div>
                    • <strong>Live Toggle:</strong> Use the fleet toggle in the top bar to observe the entire vulnerability matrix dynamically recalculate!
                  </div>
                </div>
              </div>

              <div className="bg-[#0d1117] border border-[#21262d] rounded-xl p-3 font-mono text-[11px] text-cyan-400 overflow-x-auto">
                <pre>{JSON.stringify({
                  light_fleet: 'Contra-flow enabled on urban secondary roads (1.5x cost), dirt tracks accessible (0.4x factor)',
                  heavy_fleet: 'Strict one-way adherence, track penalty 4.0x, Lakhipur rural bridge weight pruned (MODEL_ISOLATED)',
                }, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Architectural Flowchart */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            📐 System Architecture & Topological Flowchart
          </h4>

          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 shadow-lg space-y-4">
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0d1117] border border-[#21262d]">
                <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/50 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div>
                  <strong className="text-white block">Raw OSM PBF + SAR Flood Mask</strong>
                  <span className="text-[#8b949e]">Projected to EPSG:32646 UTM Zone 46N metric space</span>
                </div>
              </div>

              <div className="flex justify-center text-gray-500">↓</div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0d1117] border border-[#21262d]">
                <div className="w-6 h-6 rounded-full bg-cyan-600/30 text-cyan-400 border border-cyan-500/50 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div>
                  <strong className="text-white block">Dynamic Impedance Engine</strong>
                  <span className="text-[#8b949e]">Cost = Length / (Base Speed × Surface Degradation Factor: paved 1.0, unpaved 0.4)</span>
                </div>
              </div>

              <div className="flex justify-center text-gray-500">↓</div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0d1117] border border-[#21262d]">
                <div className="w-6 h-6 rounded-full bg-amber-600/30 text-amber-400 border border-amber-500/50 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <div>
                  <strong className="text-white block">Spatial Intersection & Bridgehead Ramp Defense</strong>
                  <span className="text-[#8b949e]">Bidirectional edge severing + iterative pruning of 163 orphaned bridgeheads</span>
                </div>
              </div>

              <div className="flex justify-center text-gray-500">↓</div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0d1117] border border-[#21262d]">
                <div className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-400 border border-purple-500/50 flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <div>
                  <strong className="text-white block">Water-Barrier Snapping Defense</strong>
                  <span className="text-[#8b949e]">Rejects settlement snapping vectors that cross water bodies (&le;1500m limit)</span>
                </div>
              </div>

              <div className="flex justify-center text-gray-500">↓</div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0d1117] border border-[#21262d]">
                <div className="w-6 h-6 rounded-full bg-emerald-600/30 text-emerald-400 border border-emerald-500/50 flex items-center justify-center font-bold text-xs">
                  5
                </div>
                <div>
                  <strong className="text-white block">Single-Source Dijkstra & Preventative Optimization</strong>
                  <span className="text-[#8b949e]">Vulnerability Profiling • k-Medoids Supply Staging • Bailey Bridge ROI Engine</span>
                </div>
              </div>

              <div className="flex justify-center text-gray-500">↓</div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0d1117] border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.15)]">
                <div className="w-6 h-6 rounded-full bg-red-600/30 text-red-400 border border-red-500/50 flex items-center justify-center font-bold text-xs">
                  6
                </div>
                <div>
                  <strong className="text-white block">Autonomous Gemini Policy Agent</strong>
                  <span className="text-[#8b949e]">Military-grade 3-bullet logistics directives for ASDMA commanders</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
