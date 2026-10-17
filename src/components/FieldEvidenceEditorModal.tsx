import React, { useState } from 'react';
import { X, Edit3, Send, CheckCircle2, AlertCircle, Download, FileText, Check, ShieldAlert } from 'lucide-react';
import { fieldEvidenceEditorService } from '../services/fieldEvidenceEditorService';
import { FieldEditType, DamageReportStatus, FieldEditRecord } from '../types/evidence';
import { playClickSound, playLaunchChime, playWarningBeep } from '../services/audioService';

interface FieldEvidenceEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  theaterId: string;
  theaterName: string;
  defaultCoords?: [number, number];
  onReportCreated?: (edit: FieldEditRecord) => void;
}

export const FieldEvidenceEditorModal: React.FC<FieldEvidenceEditorModalProps> = ({
  isOpen,
  onClose,
  theaterId,
  theaterName,
  defaultCoords = [24.7891, 92.8124],
  onReportCreated,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'review'>('create');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<FieldEditType>('road');
  const [condition, setCondition] = useState<DamageReportStatus>('REPORTED_DAMAGED');
  const [lat, setLat] = useState<number>(defaultCoords[0]);
  const [lon, setLon] = useState<number>(defaultCoords[1]);
  const [author, setAuthor] = useState('Field Officer #14 (Cachar DDMA)');
  const [notes, setNotes] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Review state
  const [editsList, setEditsList] = useState<FieldEditRecord[]>(() =>
    fieldEvidenceEditorService.getEditsByTheater(theaterId)
  );

  if (!isOpen) return null;

  const handleRefreshList = () => {
    setEditsList(fieldEvidenceEditorService.getEditsByTheater(theaterId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    const result = fieldEvidenceEditorService.createEdit({
      theaterId,
      type,
      title,
      lat: Number(lat),
      lon: Number(lon),
      reportedCondition: condition,
      author,
      notes,
      attachmentUrl,
    });

    if (!result.success || !result.edit) {
      playWarningBeep();
      setFormError(result.error || 'Validation failed. Check coordinates and inputs.');
      return;
    }

    playLaunchChime();
    setSuccessMsg(`Report ${result.edit.id} submitted for statutory review.`);
    setTitle('');
    setNotes('');
    setAttachmentUrl('');
    handleRefreshList();
    if (onReportCreated) {
      onReportCreated(result.edit);
    }
  };

  const handleReviewAction = (editId: string, status: 'ACCEPTED' | 'REJECTED') => {
    playClickSound();
    fieldEvidenceEditorService.updateReviewStatus(
      editId,
      status,
      'DISTRICT_MAGISTRATE_DESK',
      `Reviewed and ${status.toLowerCase()} by Incident Commander.`
    );
    handleRefreshList();
  };

  const handleExportGeoJson = () => {
    const geoJsonStr = fieldEvidenceEditorService.exportGeoJson(theaterId);
    const blob = new Blob([geoJsonStr], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeline_field_edits_${theaterId}_rfc7946.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-700/60 flex items-center justify-center text-amber-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Lightweight Field Evidence Editor</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 font-bold uppercase">
                  Demonstration Sandbox
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Submit and review ground truth observations without overwriting authoritative datasets.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2 gap-2 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`py-2 px-3 border-b-2 font-bold transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            1. Draft New Report
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('review')}
            className={`py-2 px-3 border-b-2 font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'review'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span>2. Demonstration Review Queue</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-white">
              {editsList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={handleExportGeoJson}
            className="ml-auto mb-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer border border-slate-700"
          >
            <Download className="w-3 h-3 text-cyan-400" />
            <span>Export RFC 7946 GeoJSON</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700 text-xs">
          {activeTab === 'create' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Notice */}
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 flex items-start gap-2.5 text-[11px] text-amber-200">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Provenance Protection:</strong> Field edits enter a <code>DRAFT → SUBMITTED</code> state and are flagged as <code>USER_SUBMITTED</code>. Authoritative government datasets (ASDMA/PWD) remain immutable.
                </p>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Form Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-400">Feature Type:</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as FieldEditType)}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="road">Road Breach / Washout</option>
                    <option value="bridge">Bridge / Culvert Structural Failure</option>
                    <option value="flood_boundary">Observed Flood Boundary</option>
                    <option value="blocked_access">Blocked Access Point</option>
                    <option value="facility">Healthcare / Relief Facility</option>
                    <option value="community_observation">Community Ground Observation</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-400">Reported Condition:</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as DamageReportStatus)}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="REPORTED_DESTROYED">REPORTED_DESTROYED (Severed / Impassable)</option>
                    <option value="REPORTED_DAMAGED">REPORTED_DAMAGED (Partial / 4x4 Only)</option>
                    <option value="UNDER_REPAIR">UNDER_REPAIR (Machinery Active)</option>
                    <option value="REPORTED_RESTORED">REPORTED_RESTORED (Reopened)</option>
                    <option value="CONFLICTING_REPORTS">CONFLICTING_REPORTS (Unverified)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Feature Name / Corridor Title:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sonai Feeder Culvert Km 3.4 Washout"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Latitude (WGS84, °N):</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value))}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Longitude (WGS84, °E):</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lon}
                    onChange={(e) => setLon(parseFloat(e.target.value))}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Author Identifier &amp; Affiliation:</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Your Name / Unit Callsign"
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Field Notes / Observations:</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe observed physical failure, flood depth, or vehicle restrictions..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 resize-none font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Photo / Attachment Reference URL (Optional):</label>
                <input
                  type="url"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit for Review</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  {editsList.length} submissions in local demonstration storage:
                </span>
                <button
                  type="button"
                  onClick={handleExportGeoJson}
                  className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Export GeoJSON FeatureCollection</span>
                </button>
              </div>

              {editsList.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-mono">
                  No field edits recorded yet. Use the Draft tab to submit one.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {editsList.map((edit) => (
                    <div
                      key={edit.id}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <strong className="text-white block font-semibold">{edit.title}</strong>
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                            Author: {edit.author} ({edit.authorRole}) • Submitted: {new Date(edit.submittedAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold border ${
                            edit.reviewStatus === 'ACCEPTED'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                              : edit.reviewStatus === 'REJECTED'
                              ? 'bg-rose-950 text-rose-300 border-rose-700'
                              : 'bg-amber-950 text-amber-300 border-amber-700'
                          }`}
                        >
                          {edit.reviewStatus}
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-slate-300 space-y-0.5">
                        <div>Condition: <span className="text-amber-300 font-bold">{edit.reportedCondition}</span></div>
                        <div>Coords (WGS84): <span className="text-cyan-300">{edit.geometry.coordinates[1]}°N, {edit.geometry.coordinates[0]}°E</span></div>
                        <div>Notes: <span className="text-slate-400 font-sans">{edit.notes}</span></div>
                        {edit.reviewNotes && (
                          <div className="text-cyan-400 font-sans pt-1">Officer Note: {edit.reviewNotes}</div>
                        )}
                      </div>

                      {/* Review Actions */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-500">ID: {edit.id}</span>
                        {edit.reviewStatus === 'SUBMITTED' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleReviewAction(edit.id, 'ACCEPTED')}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              <span>Accept</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReviewAction(edit.id, 'REJECTED')}
                              className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 px-6 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Demonstration Mode • WGS84 EPSG:4326 RFC 7946 Standard</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
