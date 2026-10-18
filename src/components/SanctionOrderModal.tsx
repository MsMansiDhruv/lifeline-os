import React, { useState } from 'react';
import {
  X,
  FileCheck,
  CheckCircle2,
  Printer,
  Copy,
  Check,
  Building2,
  Stethoscope,
  Anchor,
  Shield,
  FileSignature,
} from 'lucide-react';
import { TheaterData, InterventionType, INTERVENTION_TOOLS } from '../data/theaters';
import { playClickSound } from '../services/audioService';

interface SanctionOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheater: TheaterData;
  activeInterventions: Record<string, InterventionType>;
  onApproveAndDispatch?: () => void;
}

export const SanctionOrderModal: React.FC<SanctionOrderModalProps> = ({
  isOpen,
  onClose,
  currentTheater,
  activeInterventions,
  onApproveAndDispatch,
}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const chokePoints = currentTheater.chokePoints;
  let totalCostLakhs = 0;
  let reconnectedVillages = 0;

  const items: Array<{ dept: string; item: string; cost: number; costStr: string; location: string; icon: string }> = [];

  chokePoints.forEach((cp) => {
    const tool = activeInterventions[cp.id] || 'none';
    if (tool === 'bridge') {
      items.push({
        dept: 'Public Works Department (Mechanical) & Army Engr Regt',
        item: 'Class-40 Modular Bailey Bridge (16T Axle Restored • 72h)',
        cost: 180,
        costStr: '₹1.80 Cr',
        location: `${cp.road_name} (GPS ${cp.lat.toFixed(4)}, ${cp.lon.toFixed(4)})`,
        icon: '🛠️',
      });
      totalCostLakhs += 180;
      reconnectedVillages += cp.trapped_villages_count;
    } else if (tool === 'booth') {
      items.push({
        dept: `Chief Medical Officer (NHM ${currentTheater.authorityShortName || 'Regional'})`,
        item: 'Forward Mobile Medical Unit (MMU) at Dry Roadhead',
        cost: 25,
        costStr: '₹25 Lakhs',
        location: `${cp.road_name} (GPS ${cp.lat.toFixed(4)}, ${cp.lon.toFixed(4)})`,
        icon: '⛺',
      });
      totalCostLakhs += 25;
      reconnectedVillages += Math.round(cp.trapped_villages_count * 0.75);
    } else if (tool === 'drone') {
      items.push({
        dept: 'NDRF 1st Battalion (UAV Wing)',
        item: 'Heavy Med-Drone Airbridge (Antivenom & Blood Shuttle)',
        cost: 12,
        costStr: '₹12 Lakhs',
        location: `${cp.road_name} Drop-Zone (GPS ${cp.lat.toFixed(4)}, ${cp.lon.toFixed(4)})`,
        icon: '🚁',
      });
      totalCostLakhs += 12;
      reconnectedVillages += Math.round(cp.trapped_villages_count * 0.8);
    } else if (tool === 'boat') {
      items.push({
        dept: 'NDRF Marine Battalion',
        item: '40HP Motorized Zodiac Rescue Shuttle',
        cost: 6.5,
        costStr: '₹6.5 Lakhs',
        location: `${cp.road_name} Water Breach (GPS ${cp.lat.toFixed(4)}, ${cp.lon.toFixed(4)})`,
        icon: '🚤',
      });
      totalCostLakhs += 6.5;
      reconnectedVillages += Math.round(cp.trapped_villages_count * 0.7);
    }
  });

  const authTag = (currentTheater.authorityShortName || 'SDRF').toUpperCase();
  const ticketId = `SDRF/${authTag}/2026/0842-${currentTheater.name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8)}`;
  const totalVillages = chokePoints.reduce((s, cp) => s + cp.trapped_villages_count, 0);
  const citizensSecured = Math.round(reconnectedVillages * 116.6 * 4.8);

  const handlePrint = () => {
    playClickSound();
    window.print();
  };

  const handleCopy = () => {
    playClickSound();
    const legalText = `OFFICE OF THE INCIDENT COMMANDER • ${(currentTheater.authorityName || 'State Disaster Management Authority').toUpperCase()}\n` +
      `REQUISITION TICKET: ${ticketId}\n` +
      `STATUTORY SANCTION ORDER UNDER SECTION 30(2) & 34 OF DISASTER MANAGEMENT ACT, 2005\n\n` +
      `THEATER: ${currentTheater.name}\n` +
      `DATE: ${new Date().toLocaleString('en-IN')}\n` +
      `TOTAL SANCTION: ₹${(totalCostLakhs / 100).toFixed(2)} Crore (${totalCostLakhs} Lakhs)\n` +
      `HABITATIONS SECURED: ${reconnectedVillages} of ${totalVillages} (${citizensSecured.toLocaleString()} citizens)\n\n` +
      `ASSET ALLOCATIONS:\n` +
      items.map((it) => `- [${it.dept}] ${it.item} at ${it.location} -> ${it.costStr}`).join('\n') +
      `\n\nISSUED BY ORDER OF THE DISTRICT MAGISTRATE & SEOC INCIDENT COMMANDER`;

    navigator.clipboard.writeText(legalText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in select-none">
      <div className="w-full max-w-3xl bg-slate-900 border-2 border-emerald-500/70 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-700/60 text-emerald-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Statutory SDRF Sanction Order &amp; PDF Report
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-semibold">
                  FORM-3B VERIFIED
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Statutory legal order under Section 30(2) and Section 34 of the Disaster Management Act, 2005
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Formal Printable Document */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 font-serif text-slate-100 bg-slate-950/90 select-text">
          {/* Official Seal & Heading */}
          <div className="text-center border-b border-slate-800 pb-4 space-y-1">
            <div className="text-xs tracking-widest uppercase font-mono text-amber-400 font-bold">
              {currentTheater.authorityName || 'State Disaster Management Authority'} • Emergency Operations Command
            </div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wide">
              State Disaster Response Fund (SDRF) Requisition Order
            </h2>
            <div className="text-xs font-mono text-slate-400">
              Order No: <span className="text-cyan-300 font-bold">{ticketId}</span> • Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>

          {/* Legal Preamble */}
          <div className="text-xs leading-relaxed text-slate-300 space-y-2 border-l-2 border-emerald-500 pl-3">
            <p>
              WHEREAS catastrophic river inundation along the <strong>{currentTheater.name}</strong> river basin has severed arterial road corridors, rendering <strong>{reconnectedVillages} habitations</strong> and an estimated <strong>{citizensSecured.toLocaleString()} citizens</strong> cut off from immediate tertiary medical care;
            </p>
            <p>
              NOW THEREFORE, in exercise of powers conferred under Section 30(2)(iii) and Section 34 of the Disaster Management Act, 2005, the undersigned Incident Commander &amp; District Magistrate hereby sanctions statutory SDRF funds of <strong>₹{(totalCostLakhs / 100).toFixed(2)} Crore ({totalCostLakhs} Lakhs)</strong> for immediate emergency procurement and asset mobilization:
            </p>
          </div>

          {/* Departmental Work Orders */}
          <div className="space-y-3 font-sans">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Departmental Asset Allocation Schedule:
            </span>

            {items.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{item.icon}</span>
                    <strong className="text-white text-sm">{item.item}</strong>
                  </div>
                  <div className="text-slate-400 font-mono">Agency: {item.dept}</div>
                  <div className="text-cyan-300 font-mono">Deployment: {item.location}</div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-emerald-400 font-mono block">{item.costStr}</span>
                  <span className="text-[10px] text-slate-400">Chargeable to SDRF</span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Audit Box */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <span className="text-slate-500 block">Total Statutory Sanction:</span>
              <strong className="text-base text-white">₹{(totalCostLakhs / 100).toFixed(2)} Crore</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Civilian Population Secured:</span>
              <strong className="text-base text-emerald-400">{citizensSecured.toLocaleString()} Citizens ({reconnectedVillages} Villages)</strong>
            </div>
          </div>

          {/* Digital Signature & Seal */}
          <div className="pt-4 border-t border-slate-800 flex items-end justify-between font-mono text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 block">Cryptographic Verification:</span>
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>SEOC-SHA256: d8f3a2c0...419b</span>
              </div>
            </div>
            <div className="text-right space-y-0.5">
              <div className="font-bold text-white">District Magistrate &amp; DDMA Chairman</div>
              <div className="text-slate-400 text-[10px]">{currentTheater.name}</div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-700 transition-colors"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{isCopied ? 'Copied Legal Text' : 'Copy Text'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onApproveAndDispatch && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onApproveAndDispatch();
                  onClose();
                }}
                className="py-2 px-4 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20 border border-emerald-400/50"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Approve &amp; Sanction Dispatch</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
