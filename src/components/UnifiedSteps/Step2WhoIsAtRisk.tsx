import React, { useState } from 'react';
import { TheaterData, InterventionType } from '../../data/theaters';
import {
  HeartPulse,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Ambulance,
  Bed,
  Layers,
  Baby,
  Users,
  Wheat,
} from 'lucide-react';
import { playRadarPing, playClickSound } from '../../services/audioService';

interface Step2WhoIsAtRiskProps {
  currentTheater: TheaterData;
  interventions: Record<string, InterventionType>;
  rerouteAmbulances: boolean;
  onToggleRerouteAmbulances: () => void;
  activateSurgeBeds: boolean;
  onToggleActivateSurgeBeds: () => void;
  onFocusHospital?: (hospital: { lat: number; lon: number; name: string }) => void;
  panelWidth?: number;
  isTourActive?: boolean;
  interactiveTourTask?: number;
  onNextStep?: () => void;
}

export const Step2WhoIsAtRisk: React.FC<Step2WhoIsAtRiskProps> = ({
  currentTheater,
  interventions,
  rerouteAmbulances,
  onToggleRerouteAmbulances,
  activateSurgeBeds,
  onToggleActivateSurgeBeds,
  onFocusHospital,
  interactiveTourTask = 0,
  onNextStep,
}) => {
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(
    currentTheater.hospitals[0]?.id || ''
  );

  const jtTool = interventions['jt_road'] || 'none';
  const hariTool = interventions['harinagar'] || 'none';

  // Compute Valley Hospital live surge based on actions and upstream interventions
  // Baseline: 191%
  // Reroute Ambulances: drops to 145%
  // Surge Beds (+15): drops to 124%
  // Upstream JT Road bridge or booth: drops to 104% (Safe)
  let valleySurge = 191;
  if (rerouteAmbulances && activateSurgeBeds) {
    valleySurge = 124;
  } else if (rerouteAmbulances) {
    valleySurge = 145;
  } else if (activateSurgeBeds) {
    valleySurge = 168;
  }

  if (jtTool === 'bridge' || jtTool === 'booth') {
    valleySurge = Math.min(valleySurge, 104);
  }

  const handleHospitalClick = (hosp: { lat: number; lon: number; name: string; id: string }) => {
    playRadarPing(1100);
    setSelectedHospitalId(hosp.id);
    onFocusHospital?.(hosp);
  };

  return (
    <div className="space-y-4 select-none text-sm text-slate-200">
      {/* Step Header */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-600/50 text-rose-400 shrink-0">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                2. Hospital Surge &amp; START Triage
              </h3>
              <span className="text-xs bg-rose-950 text-rose-300 border border-rose-800 px-2.5 py-0.5 rounded-full font-semibold">
                NDMA START Matrix
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed">
              When roads submerge, detour ambulances congest urban trauma ICUs. Balance clinical intake and classify isolated populations under the 4-tier NDMA START protocol.
            </p>
          </div>
        </div>
      </div>

      {/* REQUIREMENT 3: 4-TIER NDMA 'START' MEDICAL RISK MATRIX */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span className="text-base font-bold text-white">
              Official NDMA 'START' Clinical Triage Matrix
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            41,520 Trapped Citizens
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* 🔴 RED: Immediate <1h */}
          <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-600/80 text-rose-200 space-y-1 shadow-md">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                🔴 RED: Immediate (&lt;1h)
              </span>
              <span className="text-xs font-mono font-bold bg-rose-900 px-2 py-0.5 rounded text-white">
                747 Patients
              </span>
            </div>
            <p className="text-xs text-rose-300 font-medium">
              Active Trauma, Snakebite, PPH Hemorrhage
            </p>
            <span className="text-[11px] text-rose-400/90 block pt-1 border-t border-rose-800/60">
              ⚡ Action: Requires Immediate Drone or Bridge Access
            </span>
          </div>

          {/* 🟠 AMBER: Urgent <24h */}
          <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-600/80 text-amber-200 space-y-1 shadow-md">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                🟠 AMBER: Urgent (&lt;24h)
              </span>
              <span className="text-xs font-mono font-bold bg-amber-900 px-2 py-0.5 rounded text-white">
                2,574 Patients
              </span>
            </div>
            <p className="text-xs text-amber-300 font-medium">
              Renal Dialysis, Insulin-dependent, Severe COPD
            </p>
            <span className="text-[11px] text-amber-400/90 block pt-1 border-t border-amber-800/60">
              ⚡ Action: Requires Boat Ferry or Dry MMU Clinic within 24h
            </span>
          </div>

          {/* 🟡 YELLOW: Vulnerable */}
          <div className="p-3 rounded-xl bg-yellow-950/50 border border-yellow-600/70 text-yellow-200 space-y-1 shadow-md">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                🟡 YELLOW: Vulnerable
              </span>
              <span className="text-xs font-mono font-bold bg-yellow-900 px-2 py-0.5 rounded text-white">
                11,833 Citizens
              </span>
            </div>
            <p className="text-xs text-yellow-300 font-medium">
              Elderly &gt;65 yrs, Infants &lt;2 yrs, High-Risk Maternal
            </p>
            <span className="text-[11px] text-yellow-400/90 block pt-1 border-t border-yellow-800/60">
              ⚡ Action: Forward pediatric rehydration &amp; shelter medical care
            </span>
          </div>

          {/* 🟢 GREEN: Displaced */}
          <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-600/70 text-emerald-200 space-y-1 shadow-md">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                🟢 GREEN: Displaced
              </span>
              <span className="text-xs font-mono font-bold bg-emerald-900 px-2 py-0.5 rounded text-white">
                26,366 Citizens
              </span>
            </div>
            <p className="text-xs text-emerald-300 font-medium">
              Ambulatory Displaced Rural Population
            </p>
            <span className="text-[11px] text-emerald-400/90 block pt-1 border-t border-emerald-800/60">
              ⚡ Action: Requires WASH potable water &amp; FCI Rations (5.5kg/person)
            </span>
          </div>
        </div>
      </div>

      {/* Critical Overloaded Hospital Card: Valley Hospital */}
      <div className="bg-slate-900 border-2 border-rose-600/60 p-4 rounded-xl shadow-xl space-y-3.5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white">
                🏥 Valley Hospital
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                {valleySurge <= 110 ? 'Safe Load' : 'Critical Overload'}
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-0.5">
              Receives forced flood detour ambulances from JT Road and Harinagar
            </p>
          </div>

          <div className="text-right">
            <span className="text-2xl font-bold tracking-tight text-rose-400 block">
              {valleySurge}%
            </span>
            <span className="text-xs text-slate-400">
              {valleySurge > 120 ? '46 patients / 24 beds' : '25 patients / 24 beds'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              valleySurge <= 110 ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
            style={{ width: `${Math.min(100, (valleySurge / 200) * 100)}%` }}
          />
        </div>

        {/* Interactive Hospital Surge Actions */}
        <div className="pt-2 border-t border-slate-800 space-y-2.5">
          <span className="text-xs uppercase font-semibold tracking-wider text-slate-400 block">
            Immediate Clinical Load-Balancing Tools:
          </span>

          {/* Action 1: Reroute Ambulances */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <Ambulance className="w-5 h-5 text-sky-400 shrink-0" />
              <div>
                <span className="font-semibold text-white block">
                  Reroute Ambulances to Backup Hospital
                </span>
                <span className="text-xs text-slate-400">
                  Diverts detour ambulances to SMCH Regional (68% load) • -46% surge
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playClickSound();
                onToggleRerouteAmbulances();
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                rerouteAmbulances
                  ? 'bg-sky-600 text-white shadow-md ring-2 ring-sky-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {rerouteAmbulances ? 'Active (145%)' : 'Reroute'}
            </button>
          </div>

          {/* Action 2: Activate Disaster Beds */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <Bed className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold text-white block">
                  Activate +15 Disaster Surge ICU Beds
                </span>
                <span className="text-xs text-slate-400">
                  Mobilizes reserve ventilators &amp; oxygen manifolds • -21% surge
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playClickSound();
                onToggleActivateSurgeBeds();
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activateSurgeBeds
                  ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {activateSurgeBeds ? 'Active (124%)' : '+15 Beds'}
            </button>
          </div>

          {/* Clear Diagnosis Callout */}
          <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-sm text-amber-200 leading-relaxed">
            <span className="font-semibold text-amber-300 block mb-1">
              ⚠️ Upstream Bottleneck Diagnosis:
            </span>
            "Remaining +24% ICU overload and 65-min Golden Hour violation can only be solved upstream in Step 3 by placing a Mobile Medical Unit (MMU) at the roadhead or reopening the bridge."
          </div>
        </div>
      </div>

      {/* Regional Backup Hospital: SMCH */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white">
                🏥 SMCH Regional Medical College
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                Safe Capacity
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-0.5">
              18 free ICU beds • Designated regional trauma overflow center
            </p>
          </div>

          <div className="text-right">
            <span className="text-2xl font-bold tracking-tight text-emerald-400 block">
              {rerouteAmbulances ? '82%' : '68%'}
            </span>
            <span className="text-xs text-slate-400">Capacity Safe</span>
          </div>
        </div>

        {rerouteAmbulances && (
          <div className="text-xs text-sky-300 bg-sky-950/60 border border-sky-800/60 p-2 rounded-lg flex items-center gap-1.5">
            <Ambulance className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Blue ambulance diversion corridor active on map to SMCH Regional</span>
          </div>
        )}
      </div>

      {/* Action Button: Step 2 -> Step 3 */}
      {onNextStep && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onNextStep();
            }}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer hover:shadow-blue-600/30"
          >
            <span>Next: Allocate Warehouse Resources (Step 3)</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
