import React, { useState, useEffect } from 'react';
import {
  Clock,
  Waves,
  AlertTriangle,
  Play,
  Pause,
  ChevronRight,
  TrendingUp,
  MapPin,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import { playRadarPing, playWarningBeep } from '../services/audioService';

export type ForecastHorizon = 'T-48h' | 'T-24h' | 'T-12h' | 'T-00h';

export interface PreemptiveAlertItem {
  id: string;
  horizon: ForecastHorizon;
  corridorIdx: number;
  corridorName: string;
  deckElevation: number;
  waterElevation: number;
  riseRate: string;
  timeToSubmerge: string;
  severity: 'warning' | 'critical' | 'emergency';
  message: string;
}

interface PreemptiveHorizonBarProps {
  currentHorizon: ForecastHorizon;
  onSelectHorizon: (h: ForecastHorizon) => void;
  onFocusCorridor: (corridorIdx: number) => void;
  activeChokeIdx: number;
}

export const PREEMPTIVE_ALERTS: PreemptiveAlertItem[] = [
  {
    id: 'alt_jt',
    horizon: 'T-12h',
    corridorIdx: 0,
    corridorName: 'JT Road Bridge',
    deckElevation: 18.0,
    waterElevation: 18.8,
    riseRate: '+0.4m/hr',
    timeToSubmerge: 'SUBMERGED (-0.8m)',
    severity: 'emergency',
    message: '⚠️ PREEMPTIVE TRIGGER: JT Road Deck (18.0m ASL) underwater (-0.8m) — Click to Auto-Focus & Pre-Stage Bailey Span',
  },
  {
    id: 'alt_korkoli',
    horizon: 'T-24h',
    corridorIdx: 2,
    corridorName: 'Korkoli Causeway',
    deckElevation: 17.2,
    waterElevation: 17.5,
    riseRate: '+0.32m/hr',
    timeToSubmerge: 'SUBMERGED (-0.3m)',
    severity: 'critical',
    message: '⚠️ HYDROLOGICAL ALERT: Barak discharge surge (+340 m³/s at Annapurna Ghat) — Korkoli Causeway overtopping',
  },
  {
    id: 'alt_harinagar',
    horizon: 'T-48h',
    corridorIdx: 1,
    corridorName: 'Harinagar Highway',
    deckElevation: 17.8,
    waterElevation: 16.2,
    riseRate: '+0.15m/hr',
    timeToSubmerge: 'Inundates in 11h',
    severity: 'warning',
    message: '⚠️ PREEMPTIVE ALERT: Harinagar Highway embankment seepage at 16.2m ASL — Pre-positioning Dry Clinic recommended',
  },
  {
    id: 'alt_borkhola',
    horizon: 'T-00h',
    corridorIdx: 3,
    corridorName: 'Borkhola Arterial Link',
    deckElevation: 19.5,
    waterElevation: 20.4,
    riseRate: '+0.45m/hr',
    timeToSubmerge: 'SUBMERGED (-0.9m)',
    severity: 'emergency',
    message: '⚠️ PEAK BASIN ALERT: Valley crest at 20.4m ASL — All 4 arterial bridges severed across 17m–21m ASL terrain',
  },
];

export const PreemptiveHorizonBar: React.FC<PreemptiveHorizonBarProps> = ({
  currentHorizon,
  onSelectHorizon,
  onFocusCorridor,
  activeChokeIdx,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeAlertIdx, setActiveAlertIdx] = useState<number>(0);

  const horizons: Array<{
    id: ForecastHorizon;
    label: string;
    sublabel: string;
    gauge: string;
    status: string;
  }> = [
    {
      id: 'T-48h',
      label: 'T-48h: Rising Gauge',
      sublabel: '16.2m ASL (+0.15m/h)',
      gauge: '980 m³/s',
      status: 'Channel Confined',
    },
    {
      id: 'T-24h',
      label: 'T-24h: Embankment Overtop',
      sublabel: '17.5m ASL (+0.32m/h)',
      gauge: '1,320 m³/s',
      status: 'Lowlands Flooded',
    },
    {
      id: 'T-12h',
      label: 'T-12h: Bridge Submergence',
      sublabel: '18.8m ASL (+0.40m/h)',
      gauge: '1,650 m³/s',
      status: 'Arterials Severed',
    },
    {
      id: 'T-00h',
      label: 'T-00h: Peak Basin Flood',
      sublabel: '20.4m ASL (Peak Crest)',
      gauge: '1,840 m³/s',
      status: 'Valley Inundated',
    },
  ];

  // Auto-play wave simulation scrubber
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const order: ForecastHorizon[] = ['T-48h', 'T-24h', 'T-12h', 'T-00h'];
      const currentIndex = order.indexOf(currentHorizon);
      const nextIndex = (currentIndex + 1) % order.length;
      onSelectHorizon(order[nextIndex]);
      playRadarPing(800 + nextIndex * 150);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPlaying, currentHorizon, onSelectHorizon]);

  // Rotate alert items
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveAlertIdx((prev) => (prev + 1) % PREEMPTIVE_ALERTS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const activeAlert = PREEMPTIVE_ALERTS[activeAlertIdx];

  const handleAlertClick = (alert: PreemptiveAlertItem) => {
    playWarningBeep();
    onSelectHorizon(alert.horizon);
    onFocusCorridor(alert.corridorIdx);
  };

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 max-w-3xl w-[94%] sm:w-auto flex flex-col items-center gap-1.5 pointer-events-auto select-none font-mono">
      {/* 1. Main Horizon Bar */}
      <div className="bg-slate-950/95 border border-slate-700/90 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl flex items-center gap-1 sm:gap-2">
        {/* Play/Pause Auto Simulation */}
        <button
          type="button"
          onClick={() => {
            playRadarPing(900);
            setIsPlaying(!isPlaying);
          }}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
            isPlaying
              ? 'bg-amber-600 text-white shadow-[0_0_12px_#d97706]'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
          }`}
          title={isPlaying ? 'Pause automated wave progression' : 'Play automated wave progression (T-48h to T-00h)'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current text-cyan-400" />}
          <span className="hidden sm:inline text-[10px] uppercase font-bold">
            {isPlaying ? 'Pause' : 'Wave Sim'}
          </span>
        </button>

        <div className="h-5 w-px bg-slate-800 hidden sm:block" />

        {/* 4 Horizon Stages */}
        <div className="grid grid-cols-4 gap-1">
          {horizons.map((h, idx) => {
            const isSelected = currentHorizon === h.id;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => {
                  playRadarPing(950 + idx * 80);
                  onSelectHorizon(h.id);
                }}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl text-left transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="text-[10px] sm:text-[11px] font-bold flex items-center gap-1 truncate">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    idx === 3 ? 'bg-rose-500 animate-ping' : idx === 2 ? 'bg-amber-400' : 'bg-cyan-400'
                  }`} />
                  <span className="truncate">{h.id}</span>
                </div>
                <div className="text-[8px] sm:text-[9px] text-slate-400 truncate hidden md:block">
                  {h.sublabel}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Automated Preemptive Telemetry Alert Ticker (Clickable to Auto-Focus Bridge) */}
      {activeAlert && (
        <button
          type="button"
          onClick={() => handleAlertClick(activeAlert)}
          className="group max-w-xl w-full bg-slate-950/95 border border-amber-600/60 hover:border-cyan-400 rounded-xl px-3 py-1.5 shadow-xl backdrop-blur-md flex items-center justify-between gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] animate-in fade-in slide-in-from-top-1"
          title="Click to auto-focus camera on this bridge and pre-stage assets"
        >
          <div className="flex items-center gap-2 truncate text-left">
            <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700 text-[9px] font-bold shrink-0 animate-pulse">
              🚨 PREEMPTIVE ALERT
            </span>
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-200 truncate group-hover:text-cyan-300">
              {activeAlert.message}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 text-[10px] font-bold text-cyan-400 group-hover:translate-x-0.5 transition-transform">
            <span className="hidden sm:inline">FOCUS MAP</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>
      )}
    </div>
  );
};
