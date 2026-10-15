import React, { useState } from 'react';
import { TheaterData, INTERVENTION_TOOLS, InterventionType } from '../../data/theaters';
import {
  HeartPulse,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Download,
  Hospital,
  ArrowRight,
  Shield,
  Sparkles,
} from 'lucide-react';

interface Step2HospitalSurgeProps {
  currentTheater: TheaterData;
  interventions: Record<string, InterventionType>;
  onGoToStep1: () => void;
  onFocusHospital?: (hospital: { lat: number; lon: number; name: string }) => void;
  panelWidth?: number;
}

export const Step2HospitalSurge: React.FC<Step2HospitalSurgeProps> = ({
  currentTheater,
  interventions,
  onGoToStep1,
  onFocusHospital,
  panelWidth = 430,
}) => {
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(
    currentTheater.hospitals[0]?.id || ''
  );

  const authorityName = currentTheater.authorityName;
  const hospitals = currentTheater.hospitals;

  // Active interventions impact calculation
  const topChoke = currentTheater.chokePoints[0];
  const topChokeTool = topChoke ? interventions[topChoke.id] || 'none' : 'none';
  const jtTool = interventions['jt_road'] || 'none';
  const hariTool = interventions['harinagar'] || 'none';
  const korTool = interventions['korkoli_causeway'] || 'none';
  const borTool = interventions['borkhola_link'] || 'none';

  // Compute live hospital capacity and status for each clinic
  const computedHospitals = hospitals.map((hosp) => {
    let surge = hosp.baseline_surge;
    let status = hosp.type;
    let reliefBadge = '';
    const dailyIntake = Math.round(hosp.beds * 0.45);

    // 1. Valley Hospital (Linked to JT Road and Harinagar)
    if (hosp.id === 'valley' || hosp.name.toLowerCase().includes('valley')) {
      if (jtTool !== 'none' && hariTool !== 'none') {
        surge = 100; // Both fixed: 100% fully stable
        status = 'referral';
        reliefBadge = 'Fully Relieved: Both JT Road & Harinagar Corridors Secured';
      } else if (jtTool !== 'none') {
        surge = 135; // JT Road cuts detour influx by half to 135% Amber
        status = 'overloaded';
        reliefBadge = '56% Surge Relieved by JT Road Counterfactual (Detour Diverted)';
      } else if (hariTool !== 'none') {
        surge = 145; // Harinagar relieves direct detour
        status = 'overloaded';
        reliefBadge = '46% Surge Relieved by Harinagar Counterfactual';
      }
    }

    // 2. Nightingale Hospital (Starved / Cut-Off by JT Road)
    if (hosp.id === 'nightingale' || hosp.name.toLowerCase().includes('nightingale')) {
      if (jtTool === 'bridge') {
        surge = 100;
        status = 'referral';
        reliefBadge = 'Arterial Reopened: Full 16T Access & Ambulance Intake Restored';
      } else if (jtTool === 'boat') {
        surge = 65;
        status = 'referral';
        reliefBadge = 'Water Pier Reconnected: Critical Casualty Water Transfer';
      } else if (jtTool === 'drone') {
        surge = 40;
        reliefBadge = 'Airbridge Active: Emergency Pharmacy & Blood Supply Restored';
      } else if (jtTool === 'booth') {
        surge = 50;
        reliefBadge = 'Local Booth Active: Forward Triage Operating';
      }
    }

    // 3. South City Hospital (Linked to Korkoli River Causeway)
    if (hosp.id === 'south_city' || hosp.name.toLowerCase().includes('south city')) {
      if (korTool !== 'none') {
        surge = 100;
        status = 'referral';
        reliefBadge = `100% Stable: Relieved by Korkoli Causeway ${INTERVENTION_TOOLS[korTool]?.name || 'Intervention'}`;
      }
    }

    // 4. Silchar Medical College (SMCH - Linked to Borkhola Feeder Cut-Off)
    if (hosp.id === 'smch' || hosp.name.toLowerCase().includes('medical college')) {
      if (borTool !== 'none') {
        surge = 100;
        status = 'referral';
        reliefBadge = `100% Stable: Relieved by Borkhola Feeder ${INTERVENTION_TOOLS[borTool]?.name || 'Intervention'}`;
      }
    }

    const isOverloaded = surge > 120;
    const isStable = surge <= 120 && surge > 0;
    const isCutOff = hosp.type === 'starved' && jtTool === 'none';

    return {
      ...hosp,
      liveSurge: surge,
      isOverloaded,
      isStable,
      isCutOff,
      reliefBadge,
      dailyIntake,
    };
  });

  const selectedHospital =
    computedHospitals.find((h) => h.id === selectedHospitalId) || computedHospitals[0];

  const handleExportCsv = () => {
    const headers = ['Hospital Name', 'Type', 'Bed Capacity', 'Live Catchment Surge', 'Active Relief Directive'];
    const rows = computedHospitals.map((h) => [
      h.name,
      h.type,
      h.beds,
      `${h.liveSurge > 0 ? '+' : ''}${h.liveSurge}%`,
      h.reliefBadge || 'Standard Baseline Inundation Catchment',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${currentTheater.id}_hospital_surge_audit.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-[#161b22] border border-[#30363d] p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-600/40 text-cyan-400">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">
              Step 2: Hospital Surge &amp; Triage Cascade (Linked to Step 1)
            </h3>
            <p className="text-[11px] text-[#8b949e]">
              Road cut-offs forcibly divert casualties into un-flooded hospitals. Deploying Booths or Bridges in Step 1 immediately stabilizes them!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-neutral-300 hover:text-white font-semibold cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Cross-Module Linked Notice */}
      {topChokeTool !== 'none' ? (
        <div className="bg-emerald-950/70 border border-emerald-500/80 p-3 rounded-xl text-xs text-emerald-200 flex items-center justify-between gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Cross-Module Relief Operational:</strong>{' '}
              {(INTERVENTION_TOOLS as any)[topChokeTool]?.name || 'Counterfactual'} on{' '}
              {topChoke?.road_name || 'Corridor'} is actively intercepting and rerouting patients!
            </span>
          </div>
          <button
            onClick={onGoToStep1}
            className="text-[10px] font-mono text-cyan-300 underline shrink-0 hover:text-white cursor-pointer"
          >
            Adjust Step 1 Fix &rarr;
          </button>
        </div>
      ) : (
        <div className="bg-rose-950/60 border border-rose-500/70 p-3 rounded-xl text-xs text-rose-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>All Choke Points Unfixed:</strong> Destination hospitals are suffering critical patient surge (+191%). Test deploying a Health Booth or Bailey Bridge in Step 1 to relieve them!
            </span>
          </div>
          <button
            onClick={onGoToStep1}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-[11px] shrink-0 cursor-pointer shadow-md"
          >
            Go to Step 1 &rarr;
          </button>
        </div>
      )}

      {/* Hospital Cards Grid */}
      <div className="space-y-3">
        <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block px-1">
          Regional Clinical Catchment Status ({computedHospitals.length} Clinics)
        </span>

        {computedHospitals.map((hosp) => {
          const isSelected = hosp.id === selectedHospitalId;
          const percentage = hosp.liveSurge;
          const isGreen = hosp.isStable || percentage <= 120;

          return (
            <div
              key={hosp.id}
              onClick={() => {
                setSelectedHospitalId(hosp.id);
                onFocusHospital?.({ lat: hosp.lat, lon: hosp.lon, name: hosp.name });
              }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#1c2128] border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                  : 'bg-[#161b22] border-[#30363d] hover:border-neutral-500'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                      hosp.isCutOff
                        ? 'bg-neutral-800 text-rose-400 border border-rose-800'
                        : isGreen
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                        : 'bg-rose-950 text-rose-300 border border-rose-600 animate-pulse'
                    }`}
                  >
                    <HeartPulse className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs flex items-center gap-2">
                      {hosp.name}
                      {isSelected && (
                        <span className="text-[9px] font-mono bg-cyan-950 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-800">
                          Active Focus
                        </span>
                      )}
                    </h4>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {hosp.beds} Certified Beds • Catchment Intake: {hosp.dailyIntake} patients/day
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                      hosp.isCutOff
                        ? 'bg-neutral-900 text-rose-400 border-rose-800'
                        : isGreen
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500 font-extrabold'
                        : 'bg-rose-950 text-rose-300 border-rose-700'
                    }`}
                  >
                    {hosp.isCutOff
                      ? '15% BLOCKED'
                      : isGreen
                      ? `${percentage}% STABLE GREEN`
                      : `+${percentage}% CRITICAL SURGE`}
                  </span>
                </div>
              </div>

              {/* Live Capacity Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] mb-1 font-mono">
                  <span className="text-neutral-400">ICU &amp; Emergency Surge Level:</span>
                  <span className={isGreen ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {hosp.isCutOff ? '15% Intake (Wards Starved)' : `${percentage}% Capacity`}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-[#0d1117] rounded-full overflow-hidden border border-[#21262d]">
                  <div
                    className={`h-full transition-all duration-500 ${
                      hosp.isCutOff
                        ? 'bg-neutral-600 w-[15%]'
                        : isGreen
                        ? 'bg-gradient-to-r from-emerald-500 to-green-400 shadow-[0_0_10px_#10b981]'
                        : 'bg-gradient-to-r from-amber-500 via-rose-500 to-red-600'
                    }`}
                    style={{
                      width: hosp.isCutOff ? '15%' : `${Math.min(100, (percentage / 200) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Dynamic Relief Green Badge */}
              {hosp.reliefBadge && (
                <div className="mt-2.5 p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-[11px] text-emerald-300 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{hosp.reliefBadge}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Hospital Action Protocol */}
      {selectedHospital && (
        <div className="bg-[#161b22] border border-[#30363d] p-3.5 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-[#21262d] pb-2">
            <span className="font-bold text-white text-xs flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              {authorityName} Clinical Triage Protocol:
            </span>
            <span className="text-[10px] font-mono text-cyan-400">
              {selectedHospital.name}
            </span>
          </div>

          <p className="text-[#c9d1d9] leading-relaxed text-[11px]">
            {selectedHospital.isStable
              ? `Catchment overflow successfully intercepted! Deploying on-site health booth or modular bridging diverted incoming patient surges. Normal clinical intake resumed under ${authorityName} tactical protocols.`
              : `Critical clinical overload active (+${selectedHospital.liveSurge}%). Diverted casualties from severed roadheads are overwhelming ICU resuscitation and hemodialysis units. Priority recommendation: Pre-position Mobile Medical Booths at inbound arterial feeder corridors to filter 75% of casualties on-site.`}
          </p>
        </div>
      )}
    </div>
  );
};
