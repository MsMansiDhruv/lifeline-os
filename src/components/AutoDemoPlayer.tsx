import React, { useEffect, useState, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Eye,
  Radio,
  Sparkles,
} from 'lucide-react';
import { playClickSound, playRadarPing } from '../services/audioService';

export interface DemoScene {
  id: number;
  timeRange: string;
  durationSeconds: number;
  title: string;
  script: string;
  judgeFocus: string;
}

export const AUTO_DEMO_SCENES: DemoScene[] = [
  {
    id: 1,
    timeRange: 'Scene 1 of 4 • Step 1',
    durationSeconds: 11,
    title: '1. Road Cut-Offs & Flood Swell',
    script:
      'Watch the river flood swell along the natural river meanders. Switching from 4x4 Ambulance to 16-Ton Supply Truck exposes narrow rural bridge weight limits, blocking 27 villages.',
    judgeFocus: '👁️ JUDGE FOCUS: Notice how 16T mode restricts bypass roads in amber and marks JT Road breach on map',
  },
  {
    id: 2,
    timeRange: 'Scene 2 of 4 • Step 2',
    durationSeconds: 11,
    title: '2. Hospital Surge Balancing',
    script:
      'Because primary roads are cut (SIMULATED CLOSURE on OSM graph), ambulances surge towards nearest facilities. We activate ambulance rerouting to SMCH Regional to stabilize capacity (assumed demo values).',
    judgeFocus: '👁️ JUDGE FOCUS: Observe the blue ambulance-diversion line to SMCH Regional and Valley Hospital load drop',
  },
  {
    id: 3,
    timeRange: 'Scene 3 of 4 • Step 3',
    durationSeconds: 12,
    title: '3. Constrained Warehouse Stock Allocation',
    script:
      'District warehouse inventory has hard caps: only 1 Bailey Bridge and ₹130L budget. Auto-recommend assigns the bridge to JT Road and field clinics at causeways for maximum life-safety ROI.',
    judgeFocus: '👁️ JUDGE FOCUS: Bailey bridge button locks across other corridors because stock is 0/1; budget stays under ₹130L',
  },
  {
    id: 4,
    timeRange: 'Scene 4 of 4 • Step 4',
    durationSeconds: 12,
    title: '4. SDRF Form-3B Sign-Off & Live Road Dispatch',
    script:
      'The District Magistrate digitally signs the statutory SDRF Form-3B order. Real-time GPS fleet markers move smoothly along the street coordinates on the map with zero popups.',
    judgeFocus: '👁️ JUDGE FOCUS: Watch live Uber-style fleet convoys moving along winding streets with bottom status bar',
  },
];

interface AutoDemoPlayerProps {
  currentSceneIdx: number; // 0..3
  onSceneChange: (sceneIdx: number) => void;
  onClose: () => void;
  onDispatchFleet?: () => void;
}

export const AutoDemoPlayer: React.FC<AutoDemoPlayerProps> = ({
  currentSceneIdx,
  onSceneChange,
  onClose,
  onDispatchFleet,
}) => {
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const scene = AUTO_DEMO_SCENES[currentSceneIdx] || AUTO_DEMO_SCENES[0];
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Scene Timer Loop
  useEffect(() => {
    setElapsedSeconds(0);
  }, [currentSceneIdx]);

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        if (prev + 0.1 >= scene.durationSeconds) {
          if (currentSceneIdx < AUTO_DEMO_SCENES.length - 1) {
            playRadarPing(1100 + currentSceneIdx * 100);
            onSceneChange(currentSceneIdx + 1);
            return 0;
          } else {
            setIsPaused(true);
            onDispatchFleet?.();
            return scene.durationSeconds;
          }
        }
        return prev + 0.1;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentSceneIdx, isPaused, scene.durationSeconds, onSceneChange, onDispatchFleet]);

  const progressPct = Math.min(100, (elapsedSeconds / scene.durationSeconds) * 100);

  const handlePrev = () => {
    playClickSound();
    if (currentSceneIdx > 0) {
      onSceneChange(currentSceneIdx - 1);
    }
  };

  const handleNext = () => {
    playClickSound();
    if (currentSceneIdx < AUTO_DEMO_SCENES.length - 1) {
      onSceneChange(currentSceneIdx + 1);
    } else {
      onDispatchFleet?.();
    }
  };

  return (
    <div className="fixed top-20 right-4 z-40 w-[460px] max-w-[calc(100vw-32px)] bg-slate-900/95 border-2 border-cyan-400 rounded-2xl p-4 shadow-[0_0_50px_rgba(34,211,238,0.35)] backdrop-blur-md text-white select-none pointer-events-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-cyan-950 text-cyan-400 border border-cyan-700/60 flex items-center gap-1 text-xs font-bold font-mono">
            <Radio className="w-4 h-4 animate-pulse text-cyan-400" />
            JUDGE AUTO-DEMO
          </span>
          <span className="text-sm font-bold text-white uppercase tracking-tight">
            {scene.timeRange}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            playClickSound();
            onClose();
          }}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          title="Exit Auto-Demo"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mb-3 border border-slate-800">
        <div
          className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(34,211,238,0.8)]"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Scene Title & Narration */}
      <div className="space-y-2 mb-3">
        <h4 className="text-base font-bold text-white">
          {scene.title}
        </h4>
        <p className="text-sm text-slate-200 leading-relaxed font-normal">
          {scene.script}
        </p>

        {/* BRIGHT ANIMATED JUDGE FOCUS CALLOUT */}
        <div className="p-3 rounded-xl bg-cyan-950/80 border-2 border-cyan-400 flex items-start gap-2.5 text-sm text-cyan-200 font-medium shadow-[0_0_20px_rgba(6,182,212,0.25)]">
          <Eye className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
          <span className="leading-relaxed">{scene.judgeFocus}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentSceneIdx === 0}
            onClick={handlePrev}
            className={`p-2 rounded-lg border text-sm transition-colors cursor-pointer ${
              currentSceneIdx === 0
                ? 'border-slate-800 text-slate-600 cursor-not-allowed'
                : 'border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Previous Scene"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition-all shadow-md cursor-pointer"
            title={isPaused ? 'Resume Auto-Play' : 'Pause'}
          >
            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
          </button>

          <button
            type="button"
            disabled={currentSceneIdx === AUTO_DEMO_SCENES.length - 1}
            onClick={handleNext}
            className={`p-2 rounded-lg border text-sm transition-colors cursor-pointer ${
              currentSceneIdx === AUTO_DEMO_SCENES.length - 1
                ? 'border-slate-800 text-slate-600 cursor-not-allowed'
                : 'border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Next Scene"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-white cursor-pointer px-2 py-1"
        >
          Exit Demo
        </button>
      </div>
    </div>
  );
};
