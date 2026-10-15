import React from 'react';
import { Target, X, CheckCircle2, ArrowRight, ChevronRight, Zap } from 'lucide-react';

export interface InteractiveTask {
  taskNum: number;
  title: string;
  instruction: string;
  actionHint: string;
}

export const INTERACTIVE_TASKS: InteractiveTask[] = [
  {
    taskNum: 1,
    title: 'Step 1: Diagnose Road Breaches & Cut-Edges',
    instruction:
      'Cloud Run executes Tarjan O(V+E) cut-edge math to isolate single-point severed corridors. At JT Road, 27 villages are cut off, and trauma transit is delayed to ❌ 65 Mins (Critical Delay).',
    actionHint: 'Step 1: Review SRTM elevation & breach diagnoses on the map',
  },
  {
    taskNum: 2,
    title: 'Step 2: Assess Hospital ICU Surge & Cohort Triage',
    instruction:
      'Road cuts forcibly divert casualties into un-flooded urban facilities: Valley Hospital suffers 191% critical ICU overload, 14 dialysis and 38 maternal cases are trapped, and cold-chain batteries have only 3.5h left.',
    actionHint: 'Step 2: Review clinical overload & vulnerable cohort requirements',
  },
  {
    taskNum: 3,
    title: 'Step 3: Counterfactual Sandbox & Physical Fixes',
    instruction:
      'Civil engineering rules apply: 310m causeways exceed 60m Bailey bridge limits! Deploy the Class-40 Bailey Bridge across JT Road (38m gap) to reconnect 27 villages, dropping Valley Hospital surge to 108% safe green!',
    actionHint: 'Step 3: Test Bailey Bridge, Dry Clinic, Ferry, and Drone assets',
  },
  {
    taskNum: 4,
    title: 'Step 4: Gemini 2.5 Flash MCP Work-Orders & DM Sanction',
    instruction:
      'Gemini 2.5 Flash MCP converts verified graph outputs into deterministic engineering dispatch orders. Review exact GPS coordinates and click "Digitally Sign & Lock" to execute the SDRF Form-3B order.',
    actionHint: 'Step 4: Sign & Lock the official SDRF Form-3B Sanction Order',
  },
];

interface InteractiveTourCoachProps {
  currentTask: number; // 1..5, or 6 for completed
  onClose: () => void;
  onNextTask?: () => void;
}

export const InteractiveTourCoach: React.FC<InteractiveTourCoachProps> = ({
  currentTask,
  onClose,
  onNextTask,
}) => {
  if (currentTask <= 0) return null;

  const isCompleted = currentTask > 4;
  const taskInfo = !isCompleted ? INTERACTIVE_TASKS[currentTask - 1] : null;

  return (
    <div className="fixed top-16 right-4 z-40 w-[420px] max-w-[calc(100vw-32px)] bg-slate-950/95 border-2 border-emerald-400 rounded-2xl p-4 shadow-[0_0_40px_rgba(16,185,129,0.35)] backdrop-blur-md text-white select-none pointer-events-auto transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-emerald-950 border border-emerald-500/60 text-emerald-400">
            <Target className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
              {isCompleted ? 'COACHING COMPLETE' : `TOUR STOP ${currentTask} OF 4 • SEOC BRIEFING`}
            </span>
            <h3 className="text-xs font-bold text-white tracking-tight">
              {isCompleted ? 'Command Readiness Verified' : taskInfo?.title}
            </h3>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          title="Exit Interactive Tour"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center gap-1.5 mb-3">
        {[1, 2, 3, 4].map((t) => (
          <div
            key={t}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              t === currentTask
                ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                : t < currentTask || isCompleted
                ? 'bg-emerald-600'
                : 'bg-slate-800'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      {isCompleted ? (
        <div className="space-y-3">
          <div className="p-3 bg-emerald-950/60 border border-emerald-600/60 rounded-xl flex items-center gap-2.5 text-xs text-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-white">🎉 Tour Complete!</p>
              <p className="text-[11px] text-emerald-300 mt-0.5">
                You have mastered corridor bottlenecks, vehicle axle physics, counterfactual fixes, hospital triage, vulnerable cohorts, SRTM ground truth, and official DM sanction orders.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-colors cursor-pointer font-mono"
          >
            Enter Command Mode
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <p className="text-xs text-slate-200 leading-relaxed font-sans">
            {taskInfo?.instruction}
          </p>

          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 text-[11px] font-mono text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="truncate">{taskInfo?.actionHint}</span>
          </div>

          <div className="flex items-center justify-between pt-1 gap-2">
            <button
              onClick={onClose}
              className="text-[11px] text-slate-400 hover:text-slate-200 font-mono transition-colors cursor-pointer py-1.5 px-2 rounded hover:bg-slate-900"
            >
              Exit Tour
            </button>

            {onNextTask && (
              <button
                onClick={onNextTask}
                className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer font-mono flex items-center gap-1.5"
              >
                <span>Next: Explain Next Section</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
