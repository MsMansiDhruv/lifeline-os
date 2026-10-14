import React, { useState } from 'react';
import { Header } from './components/Header';
import { CommandOverview } from './components/CommandOverview';
import { TelemetryDrawer } from './components/TelemetryDrawer';
import { PercolationTab } from './components/Tabs/PercolationTab';
import { PrepositioningTab } from './components/Tabs/PrepositioningTab';
import { BridgeRoiTab } from './components/Tabs/BridgeRoiTab';
import { TestcasesTab } from './components/Tabs/TestcasesTab';
import { AnalyticsTab } from './components/Tabs/AnalyticsTab';
import { MatrixTab } from './components/Tabs/MatrixTab';
import { CopilotTab } from './components/Tabs/CopilotTab';
import {
  SETTLEMENTS_LIGHT,
  SETTLEMENTS_HEAVY,
  getDiagnostics,
} from './data/disasterData';
import { FleetMode } from './types';
import {
  ShieldAlert,
  Anchor,
  Wrench,
  FlaskConical,
  BarChart3,
  MapPin,
  Bot,
} from 'lucide-react';

export function App() {
  const [fleetMode, setFleetMode] = useState<FleetMode>('Light Emergency (Ambulance/4x4)');
  const [statusFilter, setStatusFilter] = useState<string>('All Critical');
  const [activeTab, setActiveTab] = useState<string>('percolation');
  const [isTelemetryOpen, setIsTelemetryOpen] = useState<boolean>(false);

  const baseSettlements = fleetMode === 'Light Emergency (Ambulance/4x4)' ? SETTLEMENTS_LIGHT : SETTLEMENTS_HEAVY;

  // Apply Filter
  const filteredSettlements = baseSettlements.filter((s) => {
    if (statusFilter === 'Isolated Only') return s.modeled_status === 'MODEL_ISOLATED';
    if (statusFilter === 'Severe Detour (>10km)') {
      return s.modeled_status === 'REROUTED_ALT_FACILITY' && (s.additional_km || 0) > 10.0;
    }
    return s.modeled_status === 'MODEL_ISOLATED' || s.modeled_status === 'REROUTED_ALT_FACILITY';
  });

  const diagnostics = getDiagnostics(fleetMode, baseSettlements);

  const tabs = [
    {
      id: 'percolation',
      label: '🔬 Vulnerability Profiler',
      sublabel: 'Cut-Edge Percolation',
      icon: ShieldAlert,
    },
    {
      id: 'prepositioning',
      label: '⚓ Pre-Positioning Hubs',
      sublabel: 'k-Medoids Optimization',
      icon: Anchor,
    },
    {
      id: 'bridge_roi',
      label: '🌉 Micro-Intervention ROI',
      sublabel: 'The Engineering Fix',
      icon: Wrench,
    },
    {
      id: 'testcases',
      label: '🧪 Validation & Flowchart',
      sublabel: 'Ground-Truth Benchmarks',
      icon: FlaskConical,
    },
    {
      id: 'analytics',
      label: '📈 Network Analytics',
      sublabel: 'Access Divergence',
      icon: BarChart3,
    },
    {
      id: 'matrix',
      label: `📍 Vulnerability Matrix (${baseSettlements.length})`,
      sublabel: 'Complete Habitat Registry',
      icon: MapPin,
    },
    {
      id: 'copilot',
      label: '🤖 AI Policy Copilot',
      sublabel: 'Gemini 3.8 Flash Directives',
      icon: Bot,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex flex-col font-sans">
      {/* Top Navigation & Controls */}
      <Header
        fleetMode={fleetMode}
        onFleetChange={setFleetMode}
        statusFilter={statusFilter}
        onFilterChange={setStatusFilter}
        onOpenTelemetry={() => setIsTelemetryOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Operational Overview & Metrics */}
        <CommandOverview diag={diagnostics} settlements={baseSettlements} />

        {/* Tab Navigation */}
        <div className="border-b border-[#30363d] overflow-x-auto scrollbar-none">
          <nav className="flex space-x-2 pb-1" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border-b-2 ${
                    isActive
                      ? 'bg-[#161b22] text-white border-blue-500 shadow-md'
                      : 'text-[#8b949e] border-transparent hover:text-[#c9d1d9] hover:bg-[#161b22]/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-gray-500'}`} />
                  <div className="text-left">
                    <span className="block font-bold">{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content Display */}
        <div className="pt-2">
          {activeTab === 'percolation' && <PercolationTab fleetMode={fleetMode} />}
          {activeTab === 'prepositioning' && <PrepositioningTab />}
          {activeTab === 'bridge_roi' && <BridgeRoiTab />}
          {activeTab === 'testcases' && <TestcasesTab />}
          {activeTab === 'analytics' && <AnalyticsTab settlements={baseSettlements} />}
          {activeTab === 'matrix' && <MatrixTab settlements={baseSettlements} />}
          {activeTab === 'copilot' && <CopilotTab settlements={baseSettlements} fleetMode={fleetMode} />}
        </div>
      </main>

      {/* Telemetry & Provenance Modal Drawer */}
      <TelemetryDrawer
        isOpen={isTelemetryOpen}
        onClose={() => setIsTelemetryOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-[#30363d] bg-[#161b22] py-4 text-center text-xs text-[#8b949e]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>🚨 Lifeline OS: Predictive Disaster Routing & Logistics Platform</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsTelemetryOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 underline font-mono cursor-pointer"
            >
              Provenance Telemetry (319 Habitats / 183 Bridges)
            </button>
            <span>•</span>
            <span>Sentinel-1 SAR Footprint & OSM Topological Road Network • Silchar, Cachar</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
