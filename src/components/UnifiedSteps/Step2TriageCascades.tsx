import React, { useState } from 'react';
import {
  HeartPulse,
  Activity,
  AlertTriangle,
  Clock,
  BatteryCharging,
  Users,
  Baby,
  Droplets,
  PackageCheck,
  ArrowRight,
  ShieldAlert,
  Hospital,
  ChevronRight,
  School,
} from 'lucide-react';
import { TheaterData } from '../../data/theaters';
import { DRY_RELIEF_CAMPS } from './Step3ReliefCohorts';

interface Step2TriageCascadesProps {
  currentTheater: TheaterData;
  onAdvanceToStep3: () => void;
  onBackToStep1?: () => void;
}

export const Step2TriageCascades: React.FC<Step2TriageCascadesProps> = ({
  currentTheater,
  onAdvanceToStep3,
  onBackToStep1,
}) => {
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(
    currentTheater.hospitals[0]?.id || ''
  );

  const hospitals = currentTheater.hospitals;

  // Medical cohorts across cut-off settlements
  const vulnerableCohorts = [
    {
      category: 'End-Stage Renal Dialysis',
      count: 14,
      unit: 'Patients',
      window: '48h Critical Window',
      severity: 'CRITICAL',
      color: 'text-rose-400 bg-rose-950/70 border-rose-800',
      action: 'Requires Valley Hospital Nephrology Unit or Immediate Field Shunt Triage',
    },
    {
      category: 'High-Risk Maternal & Ob/Gyn',
      count: 38,
      unit: 'Expectant Mothers',
      window: '72h Term Window',
      severity: 'HIGH PRIORITY',
      color: 'text-amber-400 bg-amber-950/70 border-amber-800',
      action: 'Blocked from SMCH Maternity Ward — Requires Drone Blood Delivery or Bridge Access',
    },
    {
      category: 'PHC Cold-Chain Vaccine & Antivenom',
      count: 6,
      unit: 'Sub-Centers',
      window: '3.5 Hours Battery Backup Remaining',
      severity: 'RAPID EXPIRY',
      color: 'text-purple-400 bg-purple-950/70 border-purple-800',
      action: 'Insulin & Snake Antivenom spoiling in 210 mins without fuel truck access',
    },
    {
      category: 'Daily Caloric & Potable Water Load',
      count: 18.5,
      unit: 'Metric Tons / Day',
      window: 'FCI Grain + Reverse Osmosis',
      severity: 'LOGISTICS',
      color: 'text-cyan-400 bg-cyan-950/70 border-cyan-800',
      action: 'Exceeds 4x4 ambulance capacity; requires 16T heavy truck corridor or 4 boat sorties',
    },
  ];

  return (
    <div className="space-y-3.5 select-none font-sans">
      {/* Step Header */}
      <div className="bg-slate-900/95 border border-slate-800 p-3.5 rounded-xl flex items-start justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-600/40 text-cyan-400 shrink-0">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono font-bold text-white text-xs uppercase tracking-wide">
                Step 2: Clinical Triage &amp; Human Vulnerability Cascade
              </h3>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold uppercase">
                Human Cost Audit
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans mt-0.5 leading-relaxed">
              Quantifying the cascading human and clinical cost while breaches remain unfixed.
              ICU saturation, expiring cold-chain batteries, and trapped chronic patients.
            </p>
          </div>
        </div>
      </div>

      {/* Critical Status Badges */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/80 space-y-1">
          <div className="flex items-center justify-between text-rose-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Golden Hour Access
            </span>
            <span className="text-rose-400 animate-pulse font-extrabold">VIOLATED</span>
          </div>
          <div className="text-xs font-extrabold text-white">65 Mins Average Transit</div>
          <div className="text-[10px] text-rose-300 font-sans">
            Exceeds 60-minute trauma survival threshold by +5 minutes for 74 rural villages.
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-800/80 space-y-1">
          <div className="flex items-center justify-between text-purple-300 font-bold">
            <span className="flex items-center gap-1.5">
              <BatteryCharging className="w-3.5 h-3.5" />
              Cold-Chain Battery
            </span>
            <span className="text-purple-300 font-bold">3.5h LEFT</span>
          </div>
          <div className="text-xs font-extrabold text-white">4 PHC Freezers Critical</div>
          <div className="text-[10px] text-purple-200 font-sans">
            Insulin, anti-rabies, and Viper antivenom will spoil unless power/airbridge connects.
          </div>
        </div>
      </div>

      {/* Section 1: Hospital Catchment Surge Bars */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
          <span className="font-semibold uppercase tracking-wider text-[10px]">
            Destination Hospital Overload Trajectory ({hospitals.length} Clinics)
          </span>
          <span className="text-[11px] text-rose-400 font-bold">Peak ER Diverted Influx</span>
        </div>

        <div className="space-y-2">
          {hospitals.map((hosp) => {
            const isSelected = hosp.id === selectedHospitalId;
            const isStarved = hosp.type === 'starved';
            const surgePct = isStarved ? 15 : hosp.baseline_surge;
            const isCritical = !isStarved && surgePct > 130;

            return (
              <div
                key={hosp.id}
                onClick={() => setSelectedHospitalId(hosp.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isStarved
                          ? 'bg-neutral-800 text-rose-400 border border-rose-800'
                          : isCritical
                          ? 'bg-rose-950 text-rose-300 border border-rose-600 animate-pulse'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                      }`}
                    >
                      <Hospital className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs flex items-center gap-2">
                        {hosp.name}
                        {isSelected && (
                          <span className="text-[9px] font-mono bg-cyan-950 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-800">
                            Focused
                          </span>
                        )}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {hosp.beds} Certified Beds • Baseline Intake: {Math.round(hosp.beds * 0.45)} casualties/day
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                        isStarved
                          ? 'bg-neutral-900 text-rose-400 border-rose-800'
                          : isCritical
                          ? 'bg-rose-950 text-rose-300 border-rose-700 font-extrabold'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-600'
                      }`}
                    >
                      {isStarved ? '15% (CUT OFF)' : `+${surgePct}% CRITICAL SURGE`}
                    </span>
                  </div>
                </div>

                {/* Surge Bar */}
                <div className="mt-2.5">
                  <div className="flex items-center justify-between text-[10px] mb-1 font-mono">
                    <span className="text-slate-400">Emergency &amp; ICU Occupancy:</span>
                    <span className={isCritical ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                      {isStarved ? 'Starved (No Surface Intake)' : `${surgePct}% of Capacity`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isStarved
                          ? 'bg-neutral-600 w-[15%]'
                          : 'bg-gradient-to-r from-amber-500 via-rose-500 to-red-600'
                      }`}
                      style={{ width: isStarved ? '15%' : `${Math.min(100, (surgePct / 200) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Vulnerable Cohort Registry */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
          <span className="font-semibold uppercase tracking-wider text-[10px]">
            Vulnerable Cohort Emergency Registry
          </span>
          <span className="text-[11px] text-amber-400 font-semibold">Priority Triage</span>
        </div>

        <div className="space-y-2">
          {vulnerableCohorts.map((cohort, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-start justify-between gap-3 font-mono text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">{cohort.category}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${cohort.color}`}>
                    {cohort.severity}
                  </span>
                </div>
                <div className="text-[11px] text-cyan-300 font-sans leading-tight">{cohort.action}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">⏱️ {cohort.window}</div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-base font-extrabold text-white block">{cohort.count}</span>
                <span className="text-[9px] text-slate-400 uppercase">{cohort.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA to Step 3 */}
      <div className="pt-2">
        <button
          onClick={onAdvanceToStep3}
          className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-mono font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] border border-emerald-400/50"
        >
          <span>Next: Open Counterfactual Solution Sandbox (Step 3)</span>
          <ArrowRight className="w-4 h-4 text-slate-950" />
        </button>
      </div>
    </div>
  );
};
