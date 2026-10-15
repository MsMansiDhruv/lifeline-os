import React, { useEffect, useState, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  Radio,
} from 'lucide-react';

export interface DemoScene {
  id: number;
  timeRange: string;
  durationSeconds: number;
  title: string;
  script: string;
}

export const AUTO_DEMO_SCENES: DemoScene[] = [
  {
    id: 1,
    timeRange: 'Scene 1 • 0:00 - 0:14',
    durationSeconds: 14,
    title: 'Step 1: Diagnose Breaches & Tarjan Cut-Edges',
    script:
      'Standard flood maps only show static blue water. Lifeline OS isolates single-point-of-failure bridges using Tarjan cut-edge graph math. At JT Road here, a 38-meter breach leaves 27 villages trapped with a critical 65-minute trauma delay.',
  },
  {
    id: 2,
    timeRange: 'Scene 2 • 0:14 - 0:28',
    durationSeconds: 14,
    title: 'Step 2: Hospital ICU Surge & Vulnerable Cohorts',
    script:
      'Road cuts forcibly divert casualties into un-flooded facilities. Valley Hospital suffers 191% critical ICU overload. 14 renal dialysis patients and 38 high-risk maternal cases are stranded, while PHC cold-chain batteries have only 3.5 hours remaining.',
  },
  {
    id: 3,
    timeRange: 'Scene 3 • 0:28 - 0:44',
    durationSeconds: 16,
    title: 'Step 3: Physical Counterfactuals & 60m Rule',
    script:
      'Civil engineering physics are enforced: a 310m causeway cannot build a Bailey bridge! But at JT Road, deploying a ₹72 Lakh Class-40 Bailey bridge across the 38-meter gap anchors between dry abutments, restoring Golden Hour to 22 minutes and dropping hospital overload to safe green.',
  },
  {
    id: 4,
    timeRange: 'Scene 4 • 0:44 - 1:00',
    durationSeconds: 16,
    title: 'Step 4: Gemini 2.5 Flash MCP Work-Orders & DM Sanction',
    script:
      'Finally, Gemini 2.5 Flash executes deterministic Model Context Protocol tool calls with zero coordinate hallucination. The District Magistrate digitally signs SDRF Form-3B, locking engineering, marine, and drone assets directly into motion.',
  },
];

interface AutoDemoPlayerProps {
  currentSceneIdx: number; // 0..5
  onSceneChange: (sceneIdx: number) => void;
  onClose: () => void;
}

export const AutoDemoPlayer: React.FC<AutoDemoPlayerProps> = ({
  currentSceneIdx,
  onSceneChange,
  onClose,
}) => {
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const scene = AUTO_DEMO_SCENES[currentSceneIdx] || AUTO_DEMO_SCENES[0];
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Speech Synthesis
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    if (voiceEnabled && !isPaused && scene) {
      const utterance = new SpeechSynthesisUtterance(scene.script);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      // Pick high quality voice if available
      const voices = window.speechSynthesis.getVoices();
      const engVoice = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha'))
      );
      if (engVoice) utterance.voice = engVoice;

      window.speechSynthesis.speak(utterance);
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentSceneIdx, voiceEnabled, isPaused]);

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
          // Advance to next scene
          if (currentSceneIdx < AUTO_DEMO_SCENES.length - 1) {
            onSceneChange(currentSceneIdx + 1);
            return 0;
          } else {
            // Reached end of presentation
            setIsPaused(true);
            return scene.durationSeconds;
          }
        }
        return prev + 0.1;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentSceneIdx, isPaused, scene.durationSeconds, onSceneChange]);

  const progressPct = Math.min(100, (elapsedSeconds / scene.durationSeconds) * 100);

  const handlePrev = () => {
    if (currentSceneIdx > 0) {
      onSceneChange(currentSceneIdx - 1);
    }
  };

  const handleNext = () => {
    if (currentSceneIdx < AUTO_DEMO_SCENES.length - 1) {
      onSceneChange(currentSceneIdx + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed top-16 right-4 z-40 w-[420px] max-w-[calc(100vw-32px)] bg-slate-950/95 border-2 border-cyan-400 rounded-2xl p-4 shadow-[0_0_50px_rgba(34,211,238,0.35)] backdrop-blur-md text-white select-none pointer-events-auto animate-in fade-in slide-in-from-top-3">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-cyan-950 text-cyan-400 border border-cyan-700/60 flex items-center gap-1 font-mono text-[10px] font-bold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            AUTONOMOUS PRESENTATION DOCK
          </span>
          <span className="text-[11px] font-mono font-bold text-white uppercase tracking-tight">
            Scene {scene.id} of 6: {scene.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-cyan-900 font-bold">
            {scene.timeRange}
          </span>
          <button
            onClick={() => {
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Exit Presentation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Visual Scene Progress Bar */}
      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mb-3 border border-slate-800">
        <div
          className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(34,211,238,0.8)]"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Large Presenter Teleprompter Text (Readable directly to judges!) */}
      <div className="min-h-[64px] flex items-center px-1 mb-3">
        <p className="text-sm md:text-base font-medium text-white leading-relaxed font-sans">
          "{scene.script}"
        </p>
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={currentSceneIdx === 0}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1 border transition-all cursor-pointer ${
              currentSceneIdx === 0
                ? 'opacity-40 cursor-not-allowed bg-slate-900 text-slate-500 border-slate-800'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
            }`}
          >
            <SkipBack className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all cursor-pointer"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          <button
            onClick={handleNext}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
          >
            <span>{currentSceneIdx === AUTO_DEMO_SCENES.length - 1 ? 'Finish' : 'Next'}</span>
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Voice Narration & Exit */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (voiceEnabled && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
              setVoiceEnabled(!voiceEnabled);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              voiceEnabled
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
            title="Toggle Voice Over Synthesis"
          >
            {voiceEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>AI Voice: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                <span>AI Voice: OFF</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              onClose();
            }}
            className="text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Exit Demo
          </button>
        </div>
      </div>
    </div>
  );
};
