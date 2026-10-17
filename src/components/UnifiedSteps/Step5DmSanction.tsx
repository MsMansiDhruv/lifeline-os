import React, { useState } from 'react';
import {
  FileCheck,
  CheckCircle2,
  Copy,
  Check,
  Printer,
  Download,
  Shield,
  Clock,
  Send,
  Sparkles,
  Building2,
  Construction,
  Activity,
  Radio,
  Anchor,
} from 'lucide-react';
import { TheaterData, InterventionType, INTERVENTION_TOOLS } from '../../data/theaters';

interface Step5DmSanctionProps {
  currentTheater: TheaterData;
  activeInterventions: Record<string, InterventionType>;
  fleetMode?: string;
  panelWidth?: number;
}

export const Step5DmSanction: React.FC<Step5DmSanctionProps> = ({
  currentTheater,
  activeInterventions,
  fleetMode = 'Light Emergency (Ambulance/4x4)',
}) => {
  const [isSanctioned, setIsSanctioned] = useState<boolean>(false);
  const [signedTimestamp, setSignedTimestamp] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const ticketId = 'SDRF/AS/2026/0842-CACHAR';
  const authorityName = currentTheater.authorityName;

  const handleSignTicket = () => {
    setIsSanctioned(true);
    setSignedTimestamp(new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }));
  };

  const handleCopyTicket = () => {
    const text = `GOVERNMENT OF ASSAM • STATE DISASTER MANAGEMENT AUTHORITY\n` +
      `REQUISITION TICKET: ${ticketId}\n` +
      `STATUS: ${isSanctioned ? 'SANCTIONED & EXECUTED' : 'AWAITING DM APPROVAL'}\n` +
      `THEATER: ${currentTheater.name}\n` +
      `DATE: ${signedTimestamp || new Date().toLocaleString()}\n` +
      `ASSETS DEPLOYED:\n` +
      `- 1x Class-40 Modular Bailey Bridge (38m Gap, PWD Mechanical Div)\n` +
      `- 2x Forward Medical Clinic Booths (NHM Assam)\n` +
      `- 4x NDRF Mk-V Rescue Boats (8th Bn NDRF)\n` +
      `- 3x Autonomous Heavy Cargo UAVs (Skye Air)\n` +
      `TOTAL SDRF SANCTION: ₹1.055 Crore\n` +
      `SIGNING AUTHORITY: District Magistrate & SEOC Incident Commander`;

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
            Step 5: District Magistrate Sanction
          </span>
          <span className="text-[9px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded font-bold">
            SDRF FORM-3B
          </span>
        </div>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          Official statutory requisition under Section 34 of the Disaster Management Act, 2005. Authorizes immediate expenditure and engineering mobilization.
        </p>
      </div>

      {/* Official SDRF Form-3B Ticket Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3 font-mono text-xs">
        {/* Ticket Header */}
        <div className="border-b border-slate-800 pb-2.5 flex items-start justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">
              GOVERNMENT OF ASSAM • REVENUE & DISASTER MANAGEMENT
            </span>
            <h3 className="text-sm font-bold text-white tracking-tight mt-0.5">
              STATE DISASTER RESPONSE FUND (SDRF) FORM-3B
            </h3>
            <span className="text-[10px] text-cyan-400">
              Ticket Ref: {ticketId}
            </span>
          </div>

          <div className="text-right">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                isSanctioned
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600 shadow-[0_0_12px_#10b981]'
                  : 'bg-amber-950 text-amber-300 border-amber-600'
              }`}
            >
              {isSanctioned ? 'APPROVED & LOCKED' : 'AWAITING SIGN-OFF'}
            </span>
          </div>
        </div>

        {/* Itemized Asset Deployment Schedule */}
        <div className="space-y-1.5 text-[11px]">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
            Itemized Statutory Resource Requisition:
          </span>

          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Construction className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <div>
                <strong className="text-white">1x Class-40 Bailey Bridge (38m)</strong>
                <p className="text-[9px] text-slate-400">JT Road Washout • Restores 16T Trucks & Ambulances</p>
              </div>
            </div>
            <span className="text-blue-300 font-bold shrink-0">₹72.0 Lakhs</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div>
                <strong className="text-white">2x Mobile Medical Clinic Booths</strong>
                <p className="text-[9px] text-slate-400">NHM Forward Triage at Harinagar & Korkoli Bridgeheads</p>
              </div>
            </div>
            <span className="text-emerald-300 font-bold shrink-0">₹30.0 Lakhs</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Anchor className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <div>
                <strong className="text-white">4x Mk-V Rescue Boat Ferries</strong>
                <p className="text-[9px] text-slate-400">8th Bn NDRF • Sadarghat & Sonabarighat Wharves</p>
              </div>
            </div>
            <span className="text-cyan-300 font-bold shrink-0">₹14.0 Lakhs</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <div>
                <strong className="text-white">3x Autonomous Cargo UAVs (FLIR)</strong>
                <p className="text-[9px] text-slate-400">Night Cold-Chain Insulin & Antivenom Airbridge</p>
              </div>
            </div>
            <span className="text-purple-300 font-bold shrink-0">₹24.0 Lakhs</span>
          </div>
        </div>

        {/* Total Financial Sanction */}
        <div className="p-2.5 rounded-lg bg-slate-950 border border-emerald-900/50 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-[10px] block">Total Statutory SDRF Sanction:</span>
            <span className="text-emerald-400 font-bold text-base">₹1,40,00,000 (₹1.40 Cr)</span>
          </div>
          <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
            Account: SDRF-2026-CACHAR
          </span>
        </div>

        {/* DM Signature Box */}
        {isSanctioned ? (
          <div className="p-3 bg-emerald-950/40 border border-emerald-600/70 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>DIGITALLY SIGNED & SANCTIONED BY DISTRICT MAGISTRATE</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 border-t border-emerald-900/60 pt-2">
              <div>
                <span className="text-slate-400 block">Signatory:</span>
                <span className="font-bold text-white">District Magistrate, Cachar District</span>
              </div>
              <div>
                <span className="text-slate-400 block">Timestamp:</span>
                <span className="font-bold text-emerald-400">{signedTimestamp}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Security Hash:</span>
                <span className="font-mono text-cyan-400">SHA256: 8f2a...c09d</span>
              </div>
              <div>
                <span className="text-slate-400 block">Execution:</span>
                <span className="font-bold text-emerald-300">PWD & NDRF Notified</span>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={handleSignTicket}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_20px_#10b981] transition-all cursor-pointer font-mono flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4 text-slate-950" />
            <span>✍️ Sanction & Lock Official SDRF Requisition</span>
          </button>
        )}

        {/* Action Buttons: Copy, Print */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleCopyTicket}
            className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{isCopied ? 'Copied to Clipboard' : 'Copy Requisition Order'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Print Requisition Ticket"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print</span>
          </button>
        </div>
      </div>
    </div>
  );
};
