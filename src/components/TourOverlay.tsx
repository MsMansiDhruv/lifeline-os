import React from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Compass,
  CheckCircle2,
  Shield,
  Activity,
  Bot,
} from 'lucide-react';

export interface TourStepInfo {
  step: number;
  title: string;
  badge: string;
  description: string;
  actionNote: string;
  targetId: string;
}

export const TOUR_STEPS: TourStepInfo[] = [
  {
    step: 1,
    title: 'Multi-Region & Zero-Download Search',
    badge: 'Step 1 of 5 • Global Ingest',
    description:
      'Welcome to Lifeline OS. Unlike single-city studies, you can switch between our verified Silchar (Assam) benchmark, the Oct 2026 Nepal Flash Floods, or type ANY city on Earth to fetch live OpenStreetMap bridges & hospitals on the fly.',
    actionNote: 'Next will center the map on Choke Point #1 and inspect the breach.',
    targetId: 'tour-step-1-theater-bar',
  },
  {
    step: 2,
    title: 'Pinpointing Single-Point Road Bottlenecks',
    badge: 'Step 2 of 5 • Graph Percolation',
    description:
      'Standard maps just show blue floodwater. Our Tarjan O(V+E) cut-edge engine discovers "Articulation Bridges"—single road spans where a washout leaves 0 backup routes, trapping 27 villages at once.',
    actionNote: 'Next will open the 4-Tool Sandbox and simulate instant multi-modal fixes.',
    targetId: 'tour-step-2-chokepoint-card',
  },
  {
    step: 3,
    title: 'Simulate Multi-Modal Interventions',
    badge: 'Step 3 of 5 • 4-Tool Sandbox',
    description:
      'Test fixes before spending budget! Pick a Modular Bailey Bridge (₹72L, 48h) to reopen 16T truck routes, a Med-Drone (₹8L, 45m) to air-drop blood over water, a Rescue Boat (₹3.5L, 3h) for water transit, or a Mobile Health Booth (₹15L, 6h) to treat casualties on-site.',
    actionNote: 'Next will deploy a Bailey Bridge & Med-Drone, flipping pins green and stepping down cut vulnerability!',
    targetId: 'tour-step-3-sandbox-scorecard',
  },
  {
    step: 4,
    title: 'The Hospital Domino Effect (Cross-Module Relief)',
    badge: 'Step 4 of 5 • Healthcare Cascade',
    description:
      'Roads and hospitals are intimately linked. Deploying a Health Booth or Bridge in Step 1 drops primary ICU patient surge from +191% down to +114% (-77% relief) and reconnected starved hospital clinics!',
    actionNote: 'Next will inspect the Automated Resource Optimizer.',
    targetId: 'tour-step-4-hospital-surge',
  },
  {
    step: 5,
    title: 'SDRF Requisition & District Magistrate Sanction',
    badge: 'Step 5 of 5 • DM Sanction Order',
    description:
      'Synthesizes multi-agency field layers: SAR satellite radar extents, PWD road graphs, NHM triage intake, and IDRN inventory. Generates official SDRF Requisition Tickets (#REQ-SDRF-2026) split into departmental work orders, sanctioned with District Magistrate sign-off.',
    actionNote: 'You are ready to command Lifeline OS freely!',
    targetId: 'tour-step-5-copilot-dispatch',
  },
];

interface TourOverlayProps {
  tourStep: number;
  onNextStep: () => void;
  onPrevStep: () => void;
  onSkipTour: () => void;
}

export const TourOverlay: React.FC<TourOverlayProps> = ({
  tourStep,
  onNextStep,
  onPrevStep,
  onSkipTour,
}) => {
  if (tourStep <= 0 || tourStep > 5) return null;

  const currentStepInfo = TOUR_STEPS[tourStep - 1];

  return (
    <>
      {/* Dim backdrop to accentuate spotlighted components */}
      <div className="fixed inset-0 bg-black/45 backdrop-blur-[1px] z-40 pointer-events-none transition-all duration-300" />

      {/* Floating Tour Controller Card (Fixed Bottom-Right) */}
      <aside 
        aria-label="In-App Guided Tour"
        className="fixed bottom-5 right-4 sm:right-6 md:right-8 z-50 max-w-lg w-[calc(100%-2rem)] sm:w-[480px] bg-[#161b22]/95 border-2 border-emerald-500/80 backdrop-blur-xl rounded-2xl p-5 shadow-[0_0_40px_rgba(16,185,129,0.35)] animate-fadeIn text-white space-y-3.5"
      >
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3 border-b border-[#30363d] pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                {currentStepInfo.badge}
              </span>
              <h2 className="text-sm font-bold text-white tracking-tight">
                {currentStepInfo.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onSkipTour}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-[#21262d] transition-colors cursor-pointer"
            title="Skip Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Bar (5 Pills) */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                s === tourStep
                  ? 'bg-emerald-400 shadow-[0_0_8px_#00e676]'
                  : s < tourStep
                  ? 'bg-emerald-700'
                  : 'bg-[#21262d]'
              }`}
            />
          ))}
        </div>

        {/* Plain-English Walkthrough Text */}
        <p className="text-xs text-[#c9d1d9] leading-relaxed">
          {currentStepInfo.description}
        </p>

        {/* Next Action Indicator */}
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-[11px] text-cyan-300 font-medium font-mono">
          <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px]">Action:</span>
          <span className="font-sans">{currentStepInfo.actionNote}</span>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            onClick={onSkipTour}
            className="text-xs text-slate-400 hover:text-white font-medium cursor-pointer font-mono"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {tourStep > 1 && (
              <button
                onClick={onPrevStep}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all cursor-pointer flex items-center gap-1 border border-slate-700 font-mono"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
            )}

            <button
              onClick={onNextStep}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer flex items-center gap-1.5 font-mono"
            >
              <span>{tourStep === 5 ? 'Complete Tour & Enter Command Mode' : 'Next Step'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
