import React, { useState, useEffect } from 'react';
import {
  Rocket,
  X,
  Radio,
  Anchor,
  Activity,
  Truck,
  CheckCircle2,
  Clock,
  HeartPulse,
  Download,
  ShieldCheck,
  Volume2,
  Sparkles,
} from 'lucide-react';
import {
  playRadarPing,
  playSonarPulse,
  playVictoryChord,
  speakTacticalNarration,
} from '../services/audioService';
import { BridgeIcon, CampIcon, DroneIcon, BoatIcon } from './common/TacticalIcons';

export interface MissionTelemetryLog {
  timeStr: string;
  phase: number;
  text: string;
  type: 'airbridge' | 'marine' | 'clinic' | 'bridge' | 'success';
}

interface LiveMissionLaunchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onMissionUpdate?: (phase: number, progressPct: number) => void;
}

export const LiveMissionLaunchOverlay: React.FC<LiveMissionLaunchOverlayProps> = ({
  isOpen,
  onClose,
  onMissionUpdate,
}) => {
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [currentPhase, setCurrentPhase] = useState<number>(1);
  const [logs, setLogs] = useState<MissionTelemetryLog[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [hospitalSurge, setHospitalSurge] = useState<number>(191);

  // 25-second accelerated rescue timeline
  // Total mission time spans from T+00:00 to T+06:00 Hours
  useEffect(() => {
    if (!isOpen) {
      setElapsedSec(0);
      setCurrentPhase(1);
      setLogs([]);
      setIsCompleted(false);
      setHospitalSurge(191);
      return;
    }

    // Voice announcement for launch
    speakTacticalNarration('District Sanction Signed. Inter-agency tactical rescue operation initiated. All engineering, marine and airbridge units dispatched.');

    const interval = setInterval(() => {
      setElapsedSec((prev) => {
        const next = prev + 1;

        // Phase 1: T+00:00 to T+00:45 (0 - 6s) Airbridge Ignition
        if (next === 2) {
          playSonarPulse();
          setLogs((l) => [
            ...l,
            {
              timeStr: 'T+00h 11m',
              phase: 1,
              type: 'airbridge',
              text: 'UAV-ALPHA AIRBRIDGE LAUNCHED: Cruising 85 km/h across Barak flood basin with 40 vials Anti-Snake Venom.',
            },
          ]);
        }
        if (next === 5) {
          playRadarPing(1400);
          setLogs((l) => [
            ...l,
            {
              timeStr: 'T+00h 38m',
              phase: 1,
              type: 'airbridge',
              text: 'PAYLOAD DELIVERED: 40 vials Anti-Snake Venom & Cold-Chain Insulin landed at 41m ASL Dry Drop-Zone (3h 48m before thermal spoilage!).',
            },
          ]);
        }

        // Phase 2: T+00:45 to T+02:30 (6 - 12s) Marine Extraction
        if (next === 7) {
          setCurrentPhase(2);
          playSonarPulse();
          setLogs((l) => [
            ...l,
            {
              timeStr: 'T+01h 05m',
              phase: 2,
              type: 'marine',
              text: 'NDRF RESCUE BOAT-04 DISPATCHED: Deploying water shuttle between North Launch Ramp & South Dry Pier.',
            },
          ]);
        }
        if (next === 11) {
          playRadarPing(1200);
          setLogs((l) => [
            ...l,
            {
              timeStr: 'T+01h 50m',
              phase: 2,
              type: 'marine',
              text: 'EXTRACTION COMPLETE: 14 Renal Dialysis & 9 High-Risk Maternal patients ferried across submerged channel within Golden Hour.',
            },
          ]);
        }

        // Phase 3: T+02:30 to T+04:30 (12 - 18s) Field Clinic Interception
        if (next === 13) {
          setCurrentPhase(3);
          playRadarPing(900);
          setLogs((l) => [
            ...l,
            {
              timeStr: 'T+02h 45m',
              phase: 3,
              type: 'clinic',
              text: 'MOBILE FIELD CLINIC OPERATIONAL: Perimeter secured at Harinagar Dry Roadhead (29m ASL). Intercepting local casualties on-site.',
            },
          ]);
        }
        if (next >= 13 && next <= 17) {
          // Animate hospital ICU overload down from 191% to 108%
          setHospitalSurge((curr) => Math.max(108, curr - 17));
        }
        if (next === 17) {
          playRadarPing(1300);
          setLogs((l) => [
            ...l,
            {
              timeStr: 'T+04h 10m',
              phase: 3,
              type: 'clinic',
              text: 'VALLEY HOSPITAL STABILIZED: 184 triage casualties filtered on dry ground! ICU load dropped from 191% Red to 108% Green.',
            },
          ]);
        }

        // Phase 4: T+04:30 to T+06:00 (18 - 24s) Bailey Bridge Lock & 16T Convoy
        if (next === 19) {
          setCurrentPhase(4);
          playSonarPulse();
          setLogs((l) => [
            ...l,
            {
              timeStr: 'T+04h 45m',
              phase: 4,
              type: 'bridge',
              text: 'CLASS-40 BAILEY BRIDGE LOCKED: 38-meter steel span pinned between North and South Dry Abutments on JT Road.',
            },
          ]);
        }
        if (next === 22) {
          playRadarPing(1600);
          setLogs((l) => [
            ...l,
            {
              timeStr: 'T+05h 30m',
              phase: 4,
              type: 'bridge',
              text: '16-TON CONVOY CROSSING: 18.5 MT FCI grain and bottled water delivered directly to 27 cut villages via reopened green corridor!',
            },
          ]);
        }

        // Mission Complete at 24s
        if (next >= 24) {
          setIsCompleted(true);
          playVictoryChord();
          speakTacticalNarration('Mission Accomplished. One hundred and forty-eight critical lives saved. Seventy-four villages reconnected. All district hospitals stabilized.');
          clearInterval(interval);
          return 24;
        }

        onMissionUpdate?.(currentPhase, Math.round((next / 24) * 100));
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  // Compute accelerated Mission Clock
  const missionMinutesTotal = Math.round((elapsedSec / 24) * 360); // 0 to 360 mins (6h)
  const clockH = Math.floor(missionMinutesTotal / 60);
  const clockM = missionMinutesTotal % 60;
  const clockSec = Math.round((elapsedSec * 15) % 60);
  const missionClockStr = `T+${clockH.toString().padStart(2, '0')}:${clockM
    .toString()
    .padStart(2, '0')}:${clockSec.toString().padStart(2, '0')}`;

  const handleDownloadDossier = () => {
    const data = {
      mission: 'SEOC_SDRF_TACTICAL_DISPATCH_OPERATION_ALPHA',
      theater: 'Cachar / Barak River Basin',
      status: 'ACCOMPLISHED',
      criticalLivesSaved: 148,
      citizensReconnected: 39420,
      villagesSecured: 74,
      coldChainPreservedPct: 100,
      totalCostLakhs: 113.5,
      timelineLogs: logs,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SEOC_SDRF_MISSION_DOSSIER_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-between p-4 select-none">
      {/* Top Center: Mission Control Telemetry HUD */}
      <div className="self-center max-w-2xl w-full bg-slate-950/95 border-2 border-cyan-500 rounded-2xl p-3.5 shadow-[0_0_50px_rgba(6,182,212,0.4)] backdrop-blur-xl pointer-events-auto flex flex-col gap-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <h3 className="font-mono font-extrabold text-white text-xs tracking-wider flex items-center gap-1.5 uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>SEOC STATE INCIDENT COMMAND • LIVE DISPATCH TELEMETRY</span>
            </h3>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <span className="text-[10px] text-slate-400">MISSION CLOCK:</span>
            <span className="text-sm font-extrabold text-cyan-400 bg-slate-900 border border-cyan-800/80 px-2 py-0.5 rounded shadow-[0_0_10px_#06b6d4]">
              {missionClockStr}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Accelerated Operation Phases Bar */}
        <div className="grid grid-cols-4 gap-1.5 font-mono text-[9px]">
          {[
            { num: 1, title: 'Airbridge Ignition', icon: DroneIcon, sub: '0h-45m', color: 'text-purple-400', activeBg: 'bg-purple-950 border-purple-500' },
            { num: 2, title: 'Marine Shuttle', icon: BoatIcon, sub: '45m-2h30m', color: 'text-cyan-400', activeBg: 'bg-cyan-950 border-cyan-500' },
            { num: 3, title: 'Clinic Triage', icon: CampIcon, sub: '2h30m-4h30m', color: 'text-emerald-400', activeBg: 'bg-emerald-950 border-emerald-500' },
            { num: 4, title: 'Bridge & 16T Convoy', icon: BridgeIcon, sub: '4h30m-6h', color: 'text-amber-400', activeBg: 'bg-amber-950 border-amber-500' },
          ].map((p) => {
            const isPhaseActive = currentPhase === p.num;
            const isPhasePassed = currentPhase > p.num || isCompleted;

            return (
              <div
                key={p.num}
                className={`p-1.5 rounded-lg border transition-all text-center ${
                  isPhaseActive
                    ? `${p.activeBg} ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-pulse`
                    : isPhasePassed
                    ? 'bg-slate-900/90 border-emerald-600/80 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-center gap-1 font-bold">
                  <p.icon className={`w-3 h-3 ${p.color}`} />
                  <span className="truncate">{p.title}</span>
                </div>
                <span className="text-[8px] text-slate-400">{p.sub}</span>
              </div>
            );
          })}
        </div>

        {/* Live Hospital Surge Dropping Metric */}
        <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-rose-400 animate-pulse" />
            <span className="text-slate-300 font-bold">Valley Hospital ICU Surge:</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`font-extrabold text-sm transition-all duration-700 ${
                hospitalSurge <= 115 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {hospitalSurge}% {hospitalSurge <= 115 ? '✅ STABILIZED GREEN' : '⚠️ OVERLOAD'}
            </span>
          </div>
        </div>
      </div>

      {/* CLIMAX: Mission Accomplished Executive Summary Dossier */}
      {isCompleted && (
        <div className="self-center max-w-2xl w-full bg-slate-950/95 border-2 border-emerald-400 rounded-3xl p-5 shadow-[0_0_80px_rgba(16,185,129,0.5)] backdrop-blur-2xl pointer-events-auto font-mono text-center space-y-4 animate-in zoom-in-95 duration-500">
          <div className="flex items-center justify-center gap-2 text-emerald-400">
            <Sparkles className="w-5 h-5 animate-spin" />
            <span className="text-xs uppercase font-extrabold tracking-widest">
              MISSION ACCOMPLISHED • GOLDEN HOUR RESCUE COMPLETE
            </span>
            <Sparkles className="w-5 h-5 animate-spin" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            148 CRITICAL LIVES SAVED TODAY
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[9px] text-slate-400 block">Citizens Reconnected</span>
              <strong className="text-sm font-extrabold text-cyan-400">39,420</strong>
              <span className="text-[8px] text-emerald-400 block">74/74 Villages Secured</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[9px] text-slate-400 block">Cold-Chain Preserved</span>
              <strong className="text-sm font-extrabold text-emerald-400">100%</strong>
              <span className="text-[8px] text-slate-400 block">0 Spoilage Detected</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[9px] text-slate-400 block">ICU Load Stabilized</span>
              <strong className="text-sm font-extrabold text-emerald-400">&lt;115%</strong>
              <span className="text-[8px] text-slate-400 block">4 of 4 Clinics Safe</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[9px] text-slate-400 block">Sanctioned SDRF Budget</span>
              <strong className="text-sm font-extrabold text-amber-300">₹1.13 Cr</strong>
              <span className="text-[8px] text-emerald-400 block">Saved ₹1.75 Cr vs All-Bridge</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleDownloadDossier}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Mission Dossier (JSON)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer border border-slate-700"
            >
              Close Mission Control
            </button>
          </div>
        </div>
      )}

      {/* Bottom: Telemetry Feed Waveform Bar */}
      <div className="self-center max-w-2xl w-full bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 shadow-2xl backdrop-blur-xl pointer-events-auto font-mono text-[10px]">
        <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1 mb-1.5 font-bold">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            LIVE TELEMETRY STREAM
          </span>
          <span className="text-slate-500">SEOC INCIDENT COMMAND TELEMETRY LINK 100% OK</span>
        </div>

        <div className="space-y-1 max-h-24 overflow-y-auto scrollbar-none">
          {logs.slice(-3).map((log, i) => (
            <div key={i} className="flex items-start gap-1.5 text-slate-200 animate-in fade-in">
              <span className="text-cyan-400 font-bold shrink-0">[{log.timeStr}]</span>
              <span className="shrink-0 mt-0.5">
                {log.type === 'airbridge' ? (
                  <DroneIcon size={12} color="#c084fc" />
                ) : log.type === 'marine' ? (
                  <BoatIcon size={12} color="#38bdf8" />
                ) : log.type === 'clinic' ? (
                  <CampIcon size={12} color="#facc15" />
                ) : (
                  <BridgeIcon size={12} color="#f59e0b" />
                )}
              </span>
              <span>{log.text}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-slate-500 italic">Initializing satellite transponder link...</div>
          )}
        </div>
      </div>
    </div>
  );
};
