import React from 'react';
import { TheaterData, INTERVENTION_TOOLS, InterventionType, TheaterChokePoint } from '../../data/theaters';
import {
  Sliders,
  Sparkles,
  RotateCcw,
  Package,
  Coins,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Wind,
  Moon,
  AlertTriangle,
} from 'lucide-react';
import { playClickSound, playWarningBeep, playSonarPulse } from '../../services/audioService';

interface Step3TestFixesProps {
  currentTheater: TheaterData;
  interventions: Record<string, InterventionType>;
  onSetIntervention: (chokePointId: string, tool: InterventionType) => void;
  onResetInterventions: () => void;
  selectedChokeIdx: number;
  onSelectChokeIdx: (idx: number) => void;
  fleetMode: string;
  panelWidth?: number;
  interactiveTourTask?: number;
  opsMode?: 'day' | 'night';
  liveWindSpeed?: number;
  riverCurrentVelocity?: number;
  onAdvanceToStep4?: () => void;
}

export const Step3TestFixes: React.FC<Step3TestFixesProps> = ({
  currentTheater,
  interventions,
  onSetIntervention,
  onResetInterventions,
  selectedChokeIdx,
  onSelectChokeIdx,
  fleetMode,
  interactiveTourTask = 0,
  opsMode = 'day',
  liveWindSpeed = 14.2,
  riverCurrentVelocity = 2.8,
  onAdvanceToStep4,
}) => {
  const chokePoints = currentTheater.chokePoints;
  const validIdx = Math.min(selectedChokeIdx, Math.max(0, chokePoints.length - 1));

  // REQUIREMENT 1: REAL-WORLD NDMA / BRO PROCUREMENT COSTS & STOCK CAPS
  // Bailey Bridge: ₹1.8 Cr (180L) | MMU: ₹25L | Heavy Drone: ₹12L | Zodiac Boat: ₹6.5L
  const TOTAL_BRIDGES = 1;
  const TOTAL_CLINICS = 2;
  const TOTAL_DRONES = 2;
  const TOTAL_BOATS = 2;
  const BUDGET_CAP_LAKHS = 250; // ₹2.5 Cr SDRF Emergency Cap

  // Count allocated items
  let usedBridges = 0;
  let usedClinics = 0;
  let usedDrones = 0;
  let usedBoats = 0;
  let usedBudget = 0;

  Object.entries(interventions).forEach(([_, tool]) => {
    if (tool === 'bridge') {
      usedBridges++;
      usedBudget += 180;
    } else if (tool === 'booth') {
      usedClinics++;
      usedBudget += 25;
    } else if (tool === 'drone') {
      usedDrones++;
      usedBudget += 12;
    } else if (tool === 'boat') {
      usedBoats++;
      usedBudget += 6.5;
    }
  });

  const remainingBridges = Math.max(0, TOTAL_BRIDGES - usedBridges);
  const remainingClinics = Math.max(0, TOTAL_CLINICS - usedClinics);
  const remainingDrones = Math.max(0, TOTAL_DRONES - usedDrones);
  const remainingBoats = Math.max(0, TOTAL_BOATS - usedBoats);
  const remainingBudget = Math.max(0, BUDGET_CAP_LAKHS - usedBudget);

  const whichCorridorHasBridge = Object.entries(interventions).find(([_, t]) => t === 'bridge')?.[0];
  const bridgeCorridorName =
    chokePoints.find((cp) => cp.id === whichCorridorHasBridge)?.road_name.split(' ')[0] || 'JT Road';

  // Physical constraints checking
  const isDroneGroundedByWind = liveWindSpeed > 45;
  const isBoatGrounded = opsMode === 'night' || riverCurrentVelocity > 3.5;

  // 1-Click Best Mix within Real Stock Cap
  const handleAutoRecommend = () => {
    playClickSound();
    onSetIntervention('jt_road', 'bridge'); // ₹1.8 Cr
    onSetIntervention('harinagar', 'booth'); // ₹25L
    onSetIntervention('korkoli_causeway', 'boat'); // ₹6.5L
    onSetIntervention('borkhola_link', 'drone'); // ₹12L
    // Total = 180 + 25 + 6.5 + 12 = 223.5 Lakhs (₹2.24 Cr <= ₹2.5 Cr cap!)
  };

  const handleToolClick = (cp: TheaterChokePoint, tool: InterventionType, isLocked: boolean) => {
    if (isLocked) {
      playWarningBeep();
      return;
    }

    if (tool === 'drone' || tool === 'boat') {
      playSonarPulse();
    } else {
      playClickSound();
    }

    const current = interventions[cp.id] || 'none';
    onSetIntervention(cp.id, current === tool ? 'none' : tool);
  };

  return (
    <div className="space-y-4 select-none text-sm text-slate-200">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-600/50 text-emerald-400 shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                3. Resource Allocation
              </h3>
              <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full font-semibold">
                NDMA Procurement Physics
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed">
              Deploy physical SDRF / BRO engineering assets under statutory ₹2.5 Cr budget caps and live environmental physics.
            </p>
          </div>
        </div>

        {Object.keys(interventions).length > 0 && (
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onResetInterventions();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-semibold border border-slate-700 shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* STICKY DISTRICT WAREHOUSE INVENTORY & BUDGET REMAINING BAR */}
      <div className="sticky top-0 z-10 bg-slate-900/95 border-2 border-cyan-500/60 p-3.5 rounded-xl shadow-2xl backdrop-blur-md space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">
              📦 District Warehouse Inventory (₹2.5 Cr SDRF Cap)
            </span>
          </div>
          <span className="text-sm font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-lg">
            ₹{(remainingBudget / 100).toFixed(2)} Cr Left
          </span>
        </div>

        {/* Inventory Stock Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm font-medium">
          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">🛠️ Bailey:</span>
            <strong className={remainingBridges === 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
              {remainingBridges} / {TOTAL_BRIDGES}
            </strong>
          </div>

          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">⛺ MMU:</span>
            <strong className="text-emerald-400 font-bold">
              {remainingClinics} / {TOTAL_CLINICS}
            </strong>
          </div>

          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">🚁 Drone:</span>
            <strong className={isDroneGroundedByWind ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
              {isDroneGroundedByWind ? 'WIND LOCKED' : `${remainingDrones} / ${TOTAL_DRONES}`}
            </strong>
          </div>

          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">🚤 Boat:</span>
            <strong className={isBoatGrounded ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
              {isBoatGrounded ? 'NIGHT LOCKED' : `${remainingBoats} / ${TOTAL_BOATS}`}
            </strong>
          </div>
        </div>

        {/* Auto-Recommend Button */}
        <button
          type="button"
          onClick={handleAutoRecommend}
          className="w-full py-2.5 px-3 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/80 text-emerald-300 hover:text-white text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>✨ Auto-Recommend Best Mix (₹2.24 Cr • Max Life-Safety ROI)</span>
        </button>
      </div>

      {/* Environmental Warning Callout if constraints triggered */}
      {isDroneGroundedByWind && (
        <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 text-xs flex items-center gap-2 font-medium">
          <Wind className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
          <span>
            <strong>GALE WIND SHEAR ALERT ({liveWindSpeed.toFixed(1)} km/h &gt; 45 km/h):</strong> Heavy Med-Drones automatically grounded to prevent airframe loss.
          </span>
        </div>
      )}

      {/* Corridors with Tool Selectors */}
      <div className="space-y-3">
        <span className="text-sm font-semibold text-white px-1 block">
          Assign Tactical Asset by Corridor:
        </span>

        {chokePoints.map((cp, idx) => {
          const isSelected = idx === validIdx;
          const currentTool = interventions[cp.id] || 'none';
          const isBridgeActiveOnThis = currentTool === 'bridge';
          const isClinicActiveOnThis = currentTool === 'booth';
          const isDroneActiveOnThis = currentTool === 'drone';
          const isBoatActiveOnThis = currentTool === 'boat';

          // Physical & Economic Constraints
          const isGapTooWideForBridge = (cp.exposed_meters || 0) > 60;
          const isBridgeOutOfStock = remainingBridges === 0 && !isBridgeActiveOnThis;
          const wouldBridgeExceedBudget = remainingBudget < 180 && !isBridgeActiveOnThis;

          const isClinicOutOfStock = remainingClinics === 0 && !isClinicActiveOnThis;
          const wouldClinicExceedBudget = remainingBudget < 25 && !isClinicActiveOnThis;

          const isDroneLocked = isDroneGroundedByWind || (remainingDrones === 0 && !isDroneActiveOnThis) || (remainingBudget < 12 && !isDroneActiveOnThis);
          const isBoatLocked = isBoatGrounded || (remainingBoats === 0 && !isBoatActiveOnThis) || (remainingBudget < 6.5 && !isBoatActiveOnThis);

          return (
            <div
              key={cp.id}
              onClick={() => onSelectChokeIdx(idx)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-slate-900 border-blue-500 shadow-xl ring-2 ring-blue-500/50'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div>
                  <h4 className="font-semibold text-white text-base">
                    {cp.road_name}
                  </h4>
                  <span className="text-xs text-slate-400">
                    {cp.exposed_meters}m breach • {cp.trapped_villages_count} cut villages
                  </span>
                </div>

                <div className="text-right">
                  {currentTool !== 'none' ? (
                    <span className="text-xs font-bold text-emerald-300 bg-emerald-950 border border-emerald-700 px-2.5 py-1 rounded-lg">
                      {INTERVENTION_TOOLS[currentTool]?.name} Active
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-rose-300 bg-rose-950/80 border border-rose-800 px-2 py-0.5 rounded-lg">
                      Unmitigated
                    </span>
                  )}
                </div>
              </div>

              {/* Tool Option Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {/* 1. Bailey Bridge: ₹1.8 Cr • 72h • 16T Crane Required */}
                <button
                  type="button"
                  disabled={isGapTooWideForBridge || isBridgeOutOfStock || wouldBridgeExceedBudget}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToolClick(cp, 'bridge', isGapTooWideForBridge || isBridgeOutOfStock || wouldBridgeExceedBudget);
                  }}
                  className={`p-2.5 rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                    isBridgeActiveOnThis
                      ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-400'
                      : isGapTooWideForBridge || isBridgeOutOfStock || wouldBridgeExceedBudget
                      ? 'bg-slate-950 text-slate-500 border border-slate-800 opacity-60 cursor-not-allowed'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                  title={
                    isGapTooWideForBridge
                      ? '🚫 Gap >60m (Too Wide for Modular Bridge)'
                      : isBridgeOutOfStock
                      ? `🔒 0 Left in Stock (Assigned to ${bridgeCorridorName})`
                      : wouldBridgeExceedBudget
                      ? '🔒 Exceeds ₹2.5 Cr SDRF Budget'
                      : 'Deploy Class-40 Bailey Bridge (₹1.8 Cr, 72h)'
                  }
                >
                  <span className="font-bold text-sm">🛠️ Bridge</span>
                  <span className="text-xs opacity-90">₹1.8 Cr • 72h</span>
                  {isGapTooWideForBridge && (
                    <span className="text-[11px] text-rose-400 font-medium mt-0.5">🚫 Gap &gt;60m</span>
                  )}
                  {isBridgeOutOfStock && !isGapTooWideForBridge && (
                    <span className="text-[11px] text-amber-400 font-medium mt-0.5">🔒 0 Left</span>
                  )}
                </button>

                {/* 2. Mobile Medical Unit (MMU): ₹25L • 6h */}
                <button
                  type="button"
                  disabled={isClinicOutOfStock || wouldClinicExceedBudget}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToolClick(cp, 'booth', isClinicOutOfStock || wouldClinicExceedBudget);
                  }}
                  className={`p-2.5 rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                    isClinicActiveOnThis
                      ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-400'
                      : isClinicOutOfStock || wouldClinicExceedBudget
                      ? 'bg-slate-950 text-slate-500 border border-slate-800 opacity-60 cursor-not-allowed'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                  title={
                    isClinicOutOfStock
                      ? '🔒 0 Left in Stock'
                      : wouldClinicExceedBudget
                      ? '🔒 Exceeds Budget'
                      : 'Deploy Mobile Medical Unit (₹25L, 6h)'
                  }
                >
                  <span className="font-bold text-sm">⛺ MMU</span>
                  <span className="text-xs opacity-90">₹25L • 6h</span>
                  {isClinicOutOfStock && (
                    <span className="text-[11px] text-amber-400 font-medium mt-0.5">🔒 0 Left</span>
                  )}
                </button>

                {/* 3. Heavy Med-Drone: ₹12L • 45m • Grounded if wind > 45 km/h */}
                <button
                  type="button"
                  disabled={isDroneLocked}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToolClick(cp, 'drone', isDroneLocked);
                  }}
                  className={`p-2.5 rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                    isDroneActiveOnThis
                      ? 'bg-purple-600 text-white shadow-lg ring-2 ring-purple-400'
                      : isDroneGroundedByWind
                      ? 'bg-rose-950/80 text-rose-300 border border-rose-600 opacity-80 cursor-not-allowed'
                      : isDroneLocked
                      ? 'bg-slate-950 text-slate-500 border border-slate-800 opacity-60 cursor-not-allowed'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                  title={
                    isDroneGroundedByWind
                      ? `🚫 Grounded by Wind (${liveWindSpeed.toFixed(1)} km/h > 45 km/h)`
                      : isDroneOutOfStock
                      ? '🔒 0 Left in Stock'
                      : 'Deploy Heavy Med-Drone Airbridge (₹12L, 45m)'
                  }
                >
                  <span className="font-bold text-sm">🚁 Drone</span>
                  <span className="text-xs opacity-90">₹12L • 45m</span>
                  {isDroneGroundedByWind && (
                    <span className="text-[11px] text-rose-400 font-bold mt-0.5">🚫 High Wind</span>
                  )}
                  {isDroneOutOfStock && !isDroneGroundedByWind && (
                    <span className="text-[11px] text-amber-400 font-medium mt-0.5">🔒 0 Left</span>
                  )}
                </button>

                {/* 4. NDRF Zodiac: ₹6.5L • 3h • Grounded in night/high current */}
                <button
                  type="button"
                  disabled={isBoatLocked}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToolClick(cp, 'boat', isBoatLocked);
                  }}
                  className={`p-2.5 rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                    isBoatActiveOnThis
                      ? 'bg-cyan-600 text-white shadow-lg ring-2 ring-cyan-400'
                      : isBoatGrounded
                      ? 'bg-rose-950/80 text-rose-300 border border-rose-600 opacity-80 cursor-not-allowed'
                      : isBoatLocked
                      ? 'bg-slate-950 text-slate-500 border border-slate-800 opacity-60 cursor-not-allowed'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                  title={
                    opsMode === 'night'
                      ? '🚫 Grounded in Night Operations'
                      : riverCurrentVelocity > 3.5
                      ? '🚫 Grounded: Current > 3.5 m/s'
                      : isBoatOutOfStock
                      ? '🔒 0 Left in Stock'
                      : 'Deploy NDRF 40HP Zodiac Boat (₹6.5L, 3h)'
                  }
                >
                  <span className="font-bold text-sm">🚤 Zodiac</span>
                  <span className="text-xs opacity-90">₹6.5L • 3h</span>
                  {isBoatGrounded && (
                    <span className="text-[11px] text-rose-400 font-bold mt-0.5">🚫 Grounded</span>
                  )}
                  {isBoatOutOfStock && !isBoatGrounded && (
                    <span className="text-[11px] text-amber-400 font-medium mt-0.5">🔒 0 Left</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Button: Step 3 -> Step 4 */}
      {onAdvanceToStep4 && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onAdvanceToStep4();
            }}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer hover:shadow-blue-600/30"
          >
            <span>Next: Sign Sanction &amp; Track Live Fleet (Step 4)</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
