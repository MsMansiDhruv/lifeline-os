import React from 'react';
import { FleetMode, SettlementFilter } from '../types';
import { Shield, Truck, Filter, Info, Radio } from 'lucide-react';

interface SidebarProps {
  fleetMode: FleetMode;
  onFleetModeChange: (mode: FleetMode) => void;
  filter: SettlementFilter;
  onFilterChange: (filter: SettlementFilter) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  fleetMode,
  onFleetModeChange,
  filter,
  onFilterChange,
}) => {
  return (
    <aside className="w-full md:w-72 bg-[#161b22] border-b md:border-b-0 md:border-r border-[#30363d] p-4 flex flex-col gap-6 shrink-0">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🚨</span>
          <span className="font-bold text-lg text-white">Lifeline OS</span>
        </div>
        <p className="text-xs text-[#8b949e]">
          Disaster Accessibility Engine<br />
          <span className="text-[#58a6ff]">June 2022 Silchar, Assam Floods</span>
        </p>
      </div>

      <div className="h-px bg-[#30363d]"></div>

      {/* Operational Fleet Mode Selection */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] flex items-center gap-1.5 mb-2.5">
          <Truck className="w-3.5 h-3.5 text-[#58a6ff]" />
          Operational Fleet Mode
        </label>
        <div className="flex flex-col gap-2">
          {(['Light Emergency (Ambulance/4x4)', 'Heavy Supply (Truck/Bus)'] as FleetMode[]).map((mode) => (
            <label
              key={mode}
              className={`flex items-start gap-2.5 p-2.5 rounded-md cursor-pointer border text-xs transition-all ${
                fleetMode === mode
                  ? 'bg-[#1f6feb]/15 border-[#1f6feb] text-white'
                  : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:border-[#484f58]'
              }`}
            >
              <input
                type="radio"
                name="fleetMode"
                value={mode}
                checked={fleetMode === mode}
                onChange={() => onFleetModeChange(mode)}
                className="mt-0.5 accent-[#58a6ff]"
              />
              <div>
                <div className="font-semibold">{mode}</div>
                <div className="text-[11px] text-[#8b949e] mt-1 leading-normal">
                  {mode.includes('Light')
                    ? 'Allows contra-flow on non-motorway one-ways (1.5x penalty). Rapid agile traversal.'
                    : 'Strictly obeys one-ways; 4.0x impedance on rural unpaved tracks/living streets.'}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px bg-[#30363d]"></div>

      {/* Settlement Filter Selection */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] flex items-center gap-1.5 mb-2">
          <Filter className="w-3.5 h-3.5 text-[#ffaa00]" />
          Settlement Filter
        </label>
        <select
          value={filter}
          onChange={(e) => onFilterChange(e.target.value as SettlementFilter)}
          className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-[#58a6ff]"
        >
          <option value="All Critical">All Critical</option>
          <option value="Isolated Only">Isolated Only</option>
          <option value="Severe Detour (>10km)">Severe Detour (&gt;10km)</option>
        </select>
        <p className="text-[11px] text-[#8b949e] mt-1.5">
          Filters matrix and testcase explorer by modelled disaster severity.
        </p>
      </div>

      <div className="h-px bg-[#30363d]"></div>

      {/* Mission Dossier & Specs */}
      <div className="bg-[#0d1117] p-3 rounded border border-[#30363d] text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-[#c9d1d9] mb-1.5">
          <Shield className="w-3.5 h-3.5 text-[#00e676]" />
          Deterministic Rigor
        </div>
        <ul className="text-[11px] text-[#8b949e] space-y-1 leading-relaxed">
          <li>• <b>SAR Inundation:</b> Sentinel-1 verified polygon footprint.</li>
          <li>• <b>Bridgehead Defense:</b> Iterative pruning of 163 submerged approach ramps.</li>
          <li>• <b>Dynamic Impedance:</b> Monsoon mud degradation physical penalties.</li>
          <li>• <b>Target Authority:</b> Assam State Disaster Management Authority (ASDMA).</li>
        </ul>
      </div>

      <div className="mt-auto text-[11px] text-[#484f58] font-mono">
        Lifeline OS v2.4-PROD (React)
      </div>
    </aside>
  );
};
