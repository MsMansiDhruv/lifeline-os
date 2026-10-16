import React, { useState, useEffect } from 'react';
import {
  Camera,
  Activity,
  Waves,
  Eye,
  Radio,
  Clock,
  Maximize2,
  X,
  AlertTriangle,
  Compass,
  Thermometer,
  ShieldAlert,
} from 'lucide-react';
import { TheaterChokePoint } from '../data/theaters';

interface BridgeheadSensorFeedProps {
  chokePoint: TheaterChokePoint;
  forecastHorizon?: 'T-48h' | 'T-24h' | 'T-12h' | 'T-00h';
  opsMode?: 'day' | 'night';
  onClose?: () => void;
  isFloating?: boolean;
}

export const BridgeheadSensorFeed: React.FC<BridgeheadSensorFeedProps> = ({
  chokePoint,
  forecastHorizon = 'T-00h',
  opsMode = 'day',
  onClose,
  isFloating = false,
}) => {
  const [feedMode, setFeedMode] = useState<'optical' | 'thermal' | 'sar'>('optical');
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute live water elevation & submergence based on forecast horizon
  const deckElevation = 18.0; // 18.0m ASL deck
  let waterLevel = 19.8;
  let flowVelocity = 2.9;
  let riverDischarge = 1840;
  let alertLevel = 'CRITICAL OVERTOP';

  if (forecastHorizon === 'T-48h') {
    waterLevel = 16.2;
    flowVelocity = 1.8;
    riverDischarge = 980;
    alertLevel = 'CHANNEL CONFINED';
  } else if (forecastHorizon === 'T-24h') {
    waterLevel = 17.5;
    flowVelocity = 2.3;
    riverDischarge = 1320;
    alertLevel = 'EMBANKMENT WARNING';
  } else if (forecastHorizon === 'T-12h') {
    waterLevel = 18.8;
    flowVelocity = 2.7;
    riverDischarge = 1650;
    alertLevel = 'SUBMERGED (-0.8m)';
  } else {
    waterLevel = 19.8;
    flowVelocity = 2.9;
    riverDischarge = 1840;
    alertLevel = 'SUBMERGED (-1.8m)';
  }

  const submergenceDelta = parseFloat((waterLevel - deckElevation).toFixed(2));
  const isSubmerged = submergenceDelta > 0;

  // Pier water staff gauge percentage (15m to 21m range)
  const staffPct = Math.min(100, Math.max(10, ((waterLevel - 15.0) / 6.0) * 100));
  const deckPct = Math.min(100, Math.max(10, ((deckElevation - 15.0) / 6.0) * 100));

  const camId =
    chokePoint.id === 'jt_road'
      ? 'CAM-BARAK-01 (JT ROAD BRIDGEHEAD)'
      : chokePoint.id === 'harinagar'
      ? 'CAM-BARAK-02 (HARINAGAR CAUSEWAY)'
      : chokePoint.id === 'korkoli_causeway'
      ? 'CAM-BARAK-03 (KORKOLI CULVERT PIER)'
      : 'CAM-BARAK-04 (BORKHOLA HIGHWAY LINK)';

  return (
    <div
      className={`bg-slate-950/95 border border-slate-800 rounded-xl shadow-2xl overflow-hidden font-mono text-xs select-none ${
        isFloating ? 'w-80 sm:w-96 backdrop-blur-xl border-cyan-500/40' : 'w-full'
      }`}
    >
      {/* CCTV Header Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="font-bold text-[10px] tracking-wider text-rose-300">
              LIVE OPTICAL / GAUGE
            </span>
          </div>
          <span className="text-slate-500">|</span>
          <span className="text-[10px] text-slate-300 truncate max-w-[150px] font-bold">
            {camId}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mode switch */}
          <div className="flex items-center bg-slate-950 rounded p-0.5 border border-slate-800 text-[9px]">
            <button
              type="button"
              onClick={() => setFeedMode('optical')}
              className={`px-1.5 py-0.5 rounded ${
                feedMode === 'optical' ? 'bg-cyan-600 text-white' : 'text-slate-400'
              }`}
            >
              VIS
            </button>
            <button
              type="button"
              onClick={() => setFeedMode('thermal')}
              className={`px-1.5 py-0.5 rounded ${
                feedMode === 'thermal' ? 'bg-purple-600 text-white' : 'text-slate-400'
              }`}
            >
              FLIR
            </button>
            <button
              type="button"
              onClick={() => setFeedMode('sar')}
              className={`px-1.5 py-0.5 rounded ${
                feedMode === 'sar' ? 'bg-amber-600 text-white' : 'text-slate-400'
              }`}
            >
              SAR
            </button>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Simulated Live Camera Viewfinder */}
      <div
        className={`relative h-36 w-full overflow-hidden flex flex-col justify-between p-2.5 ${
          feedMode === 'optical'
            ? opsMode === 'night'
              ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-emerald-400'
              : 'bg-gradient-to-b from-sky-950 via-slate-900 to-cyan-950 text-cyan-300'
            : feedMode === 'thermal'
            ? 'bg-gradient-to-b from-purple-950 via-rose-950 to-amber-950 text-amber-300'
            : 'bg-gradient-to-b from-slate-950 via-zinc-900 to-emerald-950 text-emerald-300'
        }`}
      >
        {/* Scanlines Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.6)_50%)] bg-[length:100%_4px]" />

        {/* Viewfinder Reticle / Crosshair */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 border border-cyan-400/30 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-cyan-400/50 rounded-full" />
          </div>
          <div className="absolute w-24 h-px bg-cyan-400/20" />
          <div className="absolute h-24 w-px bg-cyan-400/20" />
        </div>

        {/* Top HUD Row */}
        <div className="relative z-10 flex items-center justify-between text-[9px] font-bold tracking-tight">
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-700/60">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>REC {currentTimeStr} IST</span>
          </div>
          <div className="bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-700/60 text-slate-300">
            PIER SENSOR #03 • LAT {chokePoint.lat.toFixed(4)}°N
          </div>
        </div>

        {/* Graphical Bridge Pier with Water Level Staff Gauge */}
        <div className="relative z-10 flex items-end justify-between px-2">
          {/* Bridge Structural Pier Graphic */}
          <div className="relative w-32 h-20 bg-slate-800/80 border border-slate-700 rounded-t flex flex-col justify-end overflow-hidden shadow-inner">
            {/* Bridge Deck Marker Line */}
            <div
              style={{ bottom: `${deckPct}%` }}
              className="absolute left-0 right-0 h-0.5 bg-amber-400 z-20 flex items-center justify-between px-1"
            >
              <span className="text-[7px] text-amber-200 bg-slate-950/90 px-0.5 font-bold">
                DECK 18.0m
              </span>
            </div>

            {/* Rising Water Body */}
            <div
              style={{ height: `${staffPct}%` }}
              className={`w-full transition-all duration-700 flex items-start justify-center pt-0.5 relative ${
                isSubmerged
                  ? 'bg-gradient-to-t from-blue-700/80 via-blue-600/70 to-rose-600/80 border-t-2 border-rose-400'
                  : 'bg-gradient-to-t from-blue-800/80 to-sky-500/70 border-t border-sky-300'
              }`}
            >
              <span className="text-[8px] font-extrabold text-white bg-slate-950/80 px-1 rounded shadow">
                WATER {waterLevel}m
              </span>
            </div>
          </div>

          {/* Real-Time Sensor Telemetry Stack */}
          <div className="bg-slate-950/90 border border-slate-700/80 rounded p-1.5 text-[9px] space-y-0.5 text-right font-mono">
            <div>
              <span className="text-slate-400">Status: </span>
              <strong className={isSubmerged ? 'text-rose-400' : 'text-emerald-400'}>
                {alertLevel}
              </strong>
            </div>
            <div>
              <span className="text-slate-400">Submergence: </span>
              <strong className={isSubmerged ? 'text-rose-400' : 'text-emerald-400'}>
                {isSubmerged ? `+${submergenceDelta}m DECK OVERTOP` : `${Math.abs(submergenceDelta)}m CLEAR`}
              </strong>
            </div>
            <div>
              <span className="text-slate-400">Manning's v: </span>
              <strong className="text-cyan-300">{flowVelocity} m/s</strong>
            </div>
            <div>
              <span className="text-slate-400">Discharge: </span>
              <strong className="text-cyan-300">{riverDischarge} m³/s</strong>
            </div>
          </div>
        </div>

        {/* Bottom HUD Row */}
        <div className="relative z-10 flex items-center justify-between text-[8px] text-slate-400 border-t border-slate-800/80 pt-1">
          <span>SOURCE: ULTRASONIC WATER LEVEL SENSOR (CWC #AS-18)</span>
          <span className="text-emerald-400">TELEMETRY LINK: 99.8%</span>
        </div>
      </div>

      {/* Sensor Interpretation Note */}
      <div className="p-2.5 bg-slate-900/60 border-t border-slate-800 space-y-1 text-[10px]">
        <div className="flex items-center justify-between text-slate-300">
          <span className="text-slate-400">Hydrological Risk:</span>
          <span className="font-bold text-rose-300">
            {isSubmerged
              ? 'Structural Deck Scour Active • Impassable'
              : 'Flow Approaching Scour Velocity Limit'}
          </span>
        </div>
        <div className="text-[9px] text-slate-400 leading-tight">
          Ultrasonic transponder confirms water depth exceeds 1.5m safe vehicular ford limit. Road approach is fully severed.
        </div>
      </div>
    </div>
  );
};
