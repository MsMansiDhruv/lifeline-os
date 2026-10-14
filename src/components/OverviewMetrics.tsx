import React from 'react';
import { SettlementRecord } from '../types';

interface OverviewMetricsProps {
  records: SettlementRecord[];
}

export const OverviewMetrics: React.FC<OverviewMetricsProps> = ({ records }) => {
  const totalScanned = records.length;
  const isolatedCount = records.filter((r) => r.modeled_status === 'MODEL_ISOLATED').length;
  const reroutedCount = records.filter((r) => r.modeled_status === 'REROUTED_ALT_FACILITY').length;

  const validAdditional = records
    .map((r) => r.additional_km)
    .filter((k): k is number => k !== null && !isNaN(k));
  const maxDetour = validAdditional.length > 0 ? Math.max(...validAdditional) : null;
  const maxDetourStr = maxDetour !== null ? `+${maxDetour.toFixed(2)} km` : 'N/A';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {/* 1. Total Scanned */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 shadow-lg hover:border-[#484f58] transition-colors">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8b949e]">
          Total Scanned
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-white mt-1">
          {totalScanned}
        </div>
        <div className="text-[11px] text-[#8b949e] mt-1">
          Habitations in Cachar GIS Grid
        </div>
      </div>

      {/* 2. Completely Isolated */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 shadow-lg hover:border-[#ff4d4d]/50 transition-colors">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8b949e] flex items-center gap-1.5">
          <span className="pulse-danger"></span>
          Completely Isolated
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-[#ff4d4d] mt-1">
          {isolatedCount}
        </div>
        <div className="text-[11px] text-[#ff4d4d]/80 mt-1">
          100% Egress Lost (Boat/Airdrop Only)
        </div>
      </div>

      {/* 3. Rerouted Facilities */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 shadow-lg hover:border-[#ffaa00]/50 transition-colors">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8b949e] flex items-center gap-1.5">
          <span className="pulse-warning"></span>
          Rerouted Facilities
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-[#ffaa00] mt-1">
          {reroutedCount}
        </div>
        <div className="text-[11px] text-[#ffaa00]/80 mt-1">
          Active Detour to Alternate Center
        </div>
      </div>

      {/* 4. Max Detour Detected */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 shadow-lg hover:border-[#00BFFF]/50 transition-colors">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8b949e] flex items-center gap-1.5">
          <span className="pulse-success"></span>
          Max Detour Detected
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-[#00BFFF] mt-1">
          {maxDetourStr}
        </div>
        <div className="text-[11px] text-[#00BFFF]/80 mt-1">
          Binnākāndi Sector Peak Bypass
        </div>
      </div>
    </div>
  );
};
