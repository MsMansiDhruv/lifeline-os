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
    title: 'Step 1: Choke Points & Cut-Edge Crisis',
    instruction:
      'The map isolates single-point bridge washouts using Tarjan cut-edge graph math. At JT Road, 27 villages are completely severed (74 across theater), and trauma transit is delayed to ❌ 65 Mins (Critical Delay).',
    actionHint: 'Step 1 active: Review JT Road Cut & 74 Trapped Villages on map',
  },
  {
    taskNum: 2,
    title: 'Bailey Bridge Snapping (48m Gap Restored)',
    instruction:
      'Deploy the Class-40 Bailey Bridge across the 48m Barak River gap. The solid green route connects from Binnākāndi all the way to Valley Hospital, updating Golden Hour to ✅ 22 Mins and reconnecting 27 villages!',
    actionHint: 'Click [Bailey Bridge] on Card #1 (JT Road)',
  },
  {
    taskNum: 3,
    title: 'Step 2: Hospital Surge & Emergency Stabilization',
    instruction:
      'With the JT Road arterial reconnected, patient influx diversions cease: Valley Hospital ICU overload drops from 148% (Critical) down to 82% (Stable Green), with 73% surge relieved.',
    actionHint: 'Step 2 active: Inspect Valley Hospital dropping to safe green zone',
  },
  {
    taskNum: 4,
    title: 'Step 3: Relief Camps & Vulnerable Cohorts',
    instruction:
      'Prioritizes 14 critical dialysis patients and 31 high-risk maternal cases across severed hamlets, mobilizing 18.5 Tons/Day FCI ration demand across 4 dry Government School Relief Camps (41m–45m ASL).',
    actionHint: 'Step 3 active: Review high-ground relief camps & patient cohorts',
  },
  {
    taskNum: 5,
    title: 'Step 4 & 5: ₹ Lakh ROI Proof & Official DM Sanction',
    instruction:
      'Open-Meteo & SRTM verify dry village ridges (41m ASL) vs flooded culverts (18m ASL). Click "Sign & Sanction Order" to affix District Magistrate approval on the official SDRF Form-3B Requisition Ticket.',
    actionHint: 'Step 5 active: Sign SDRF Form-3B Requisition Ticket to execute',
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

  const isCompleted = currentTask > 5;
  const taskInfo = !isCompleted ? INTERACTIVE_TASKS[currentTask - 1] : null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-[calc(100%-3rem)] bg-slate-950/95 border-2 border-emerald-400 rounded-2xl p-4 shadow-[0_0_40px_rgba(16,185,129,0.35)] backdrop-blur-md text-white select-none pointer-events-auto transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-emerald-950 border border-emerald-500/60 text-emerald-400">
            <Target className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
              {isCompleted ? 'COACHING COMPLETE' : `TOUR STOP ${currentTask} OF 5 • SEOC BRIEFING`}
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
        {[1, 2, 3, 4, 5].map((t) => (
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
