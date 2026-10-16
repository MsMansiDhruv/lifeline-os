import React from 'react';
import { Target, X, ChevronRight, ChevronLeft, CheckCircle2, Sparkles } from 'lucide-react';
import { playClickSound } from '../services/audioService';

export interface InteractiveTask {
  taskNum: number;
  title: string;
  stepId: string;
  targetDescription: string;
  instruction: string;
  actionPrompt: string;
}

export const INTERACTIVE_TASKS: InteractiveTask[] = [
  {
    taskNum: 1,
    stepId: 'step1_what_broke',
    title: 'Phase 1: Diagnose Road Cut-Offs & 16T Truck Block',
    targetDescription: 'Step 1: Operational Fleet Mode',
    instruction:
      'Notice how JT Road is severed by a 38m water gap. Click the "16-Ton Supply Truck" button to test heavy axle restrictions across rural bypasses.',
    actionPrompt: '👉 Click "16-Ton Supply Truck" or select the JT Road card to advance',
  },
  {
    taskNum: 2,
    stepId: 'step2_who_is_at_risk',
    title: 'Phase 2: Relieve Valley Hospital ICU Surge',
    targetDescription: 'Step 2: Valley Hospital Card',
    instruction:
      'Washed-out roads force ambulances onto a 65-min detour, overloading Valley Hospital to 191% ICU capacity. Click "Reroute Ambulances to Backup Hospital" to drop the surge to 145%.',
    actionPrompt: '👉 Click "Reroute Ambulances" toggle button to balance the clinical load',
  },
  {
    taskNum: 3,
    stepId: 'step3_test_fixes',
    title: 'Phase 3: Allocate Constrained Warehouse Stock',
    targetDescription: 'Step 3: Warehouse Inventory Bar',
    instruction:
      'District warehouse stock is strictly capped (only 1 Bailey Bridge, ₹130L budget). Click "✨ Auto-Recommend Best Mix" to assign optimal assets across all corridors.',
    actionPrompt: '👉 Click "✨ Auto-Recommend Best Mix Within Stock"',
  },
  {
    taskNum: 4,
    stepId: 'step4_edit_launch',
    title: 'Phase 4: Sign Sanction Order & Dispatch Live Fleet',
    targetDescription: 'Step 4: Statutory Dispatch Order',
    instruction:
      'Review the itemized SDRF Form-3B departmental orders for PWD, NHM, and NDRF. Click "Sign Sanction Order" to dispatch the live GPS fleet along real street coordinates on the map.',
    actionPrompt: '👉 Click "✍️ Sign Sanction Order & Dispatch Fleet on Map"',
  },
];

interface InteractiveTourCoachProps {
  currentTask: number; // 1..4, or 5 for completed
  onClose: () => void;
  onNextTask: () => void;
  onPrevTask: () => void;
  anchorY?: number;
  anchorX?: number;
}

export const InteractiveTourCoach: React.FC<InteractiveTourCoachProps> = ({
  currentTask,
  onClose,
  onNextTask,
  onPrevTask,
  anchorY = 180,
  anchorX = 460,
}) => {
  if (currentTask <= 0) return null;

  const isCompleted = currentTask > 4;
  const task = !isCompleted ? INTERACTIVE_TASKS[currentTask - 1] : null;

  return (
    <div
      style={{
        top: isCompleted ? '100px' : `${Math.max(80, Math.min(window.innerHeight - 340, anchorY))}px`,
        left: isCompleted ? '50%' : `${anchorX}px`,
        transform: isCompleted ? 'translateX(-50%)' : 'none',
      }}
      className="fixed z-50 w-[420px] max-w-[calc(100vw-32px)] bg-slate-900/95 border-2 border-emerald-400 rounded-2xl p-4 shadow-[0_0_40px_rgba(16,185,129,0.35)] backdrop-blur-xl text-white select-none pointer-events-auto transition-all duration-300"
    >
      {/* Arrow Pointer pointing back toward the Left Command Panel */}
      {!isCompleted && (
        <div className="hidden sm:block absolute -left-3 top-8 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-emerald-400" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-500 text-emerald-400">
            <Target className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-400 block">
              {isCompleted ? 'GUIDED TOUR COMPLETE' : `GUIDED TOUR • STEP ${currentTask} OF 4`}
            </span>
            <h3 className="text-base font-bold text-white tracking-tight">
              {isCompleted ? 'Mission Ready' : task?.title}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            playClickSound();
            onClose();
          }}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          title="Exit Tour"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      {isCompleted ? (
        <div className="space-y-3">
          <div className="p-3 bg-emerald-950/80 border border-emerald-600 rounded-xl flex items-center gap-3 text-sm text-emerald-200">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-white text-base">All 4 Phases Certified</p>
              <p className="text-sm text-emerald-300 mt-0.5 leading-relaxed">
                You experienced Road Cut-Offs, Hospital Surge balancing, constrained Warehouse Allocation, and official SDRF Form-3B Dispatch.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base rounded-xl shadow-lg transition-colors cursor-pointer"
          >
            Enter Incident Commander Console
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-200 leading-relaxed">
            {task?.instruction}
          </p>

          {/* Action Prompt */}
          <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-600/70 flex items-center gap-2 text-sm text-emerald-300 font-semibold">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{task?.actionPrompt}</span>
          </div>

          {/* Working [ ◀ Prev ] [ Skip / Next ▶ ] [ ✕ Exit ] Controls */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800">
            <button
              type="button"
              disabled={currentTask <= 1}
              onClick={() => {
                playClickSound();
                onPrevTask();
              }}
              className={`py-1.5 px-3 rounded-lg text-sm font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                currentTask <= 1
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Exit Tour
            </button>

            <button
              type="button"
              onClick={() => {
                playClickSound();
                onNextTask();
              }}
              className="py-1.5 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center gap-1 shadow-md transition-colors cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
