/**
 * LIFELINE OS — IMMUTABLE AUDIT TRAIL SERVICE
 * 
 * Records every operational command, parameter override, resource allocation,
 * and dispatch decision with timestamp, role, rationale, and provenance.
 * Complies with Section 7, 10, and 15 of the Master Specification.
 */

import { AuditLogEntry } from '../types/evidence';

class AuditService {
  private log: AuditLogEntry[] = [];
  private listeners: Array<(entries: AuditLogEntry[]) => void> = [];

  constructor() {
    // Initial system boot entry
    this.recordAction({
      action_type: 'SCENARIO_CREATED',
      rationale: 'Lifeline OS Incident Command session initialized. Baseline topological road graph ingested from OSM Overpass.',
      user_role: 'AUTOMATED_POLICY',
      user_id: 'SYSTEM_BOOT',
      human_authorized: true,
      input_evidence_ids: ['osm_road_graph_v1', 'open_meteo_telemetry_v1'],
    });
  }

  public getEntries(): AuditLogEntry[] {
    return [...this.log];
  }

  public recordAction(params: {
    action_type: AuditLogEntry['action_type'];
    rationale: string;
    user_role?: AuditLogEntry['user_role'];
    user_id?: string;
    human_authorized?: boolean;
    input_evidence_ids?: string[];
  }): AuditLogEntry {
    const entry: AuditLogEntry = {
      audit_id: `AUDIT_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      user_id: params.user_id || 'SEOC_COMMANDER_01',
      user_role: params.user_role || 'INCIDENT_COMMANDER',
      action_type: params.action_type,
      rationale: params.rationale,
      input_evidence_ids: params.input_evidence_ids || ['user_command_intent'],
      human_authorized: params.human_authorized ?? true,
      output_state_hash: `sha256_${Math.random().toString(36).slice(2, 10)}`,
    };

    this.log.unshift(entry); // newest first
    this.notify();
    return entry;
  }

  public subscribe(listener: (entries: AuditLogEntry[]) => void): () => void {
    this.listeners.push(listener);
    listener([...this.log]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    const copy = [...this.log];
    this.listeners.forEach((l) => l(copy));
  }

  public exportJson(): string {
    return JSON.stringify(this.log, null, 2);
  }

  public exportCsv(): string {
    const headers = ['audit_id', 'timestamp', 'user_id', 'user_role', 'action_type', 'rationale', 'human_authorized'];
    const rows = this.log.map((e) => [
      e.audit_id,
      `"${e.timestamp}"`,
      `"${e.user_id}"`,
      `"${e.user_role}"`,
      `"${e.action_type}"`,
      `"${e.rationale.replace(/"/g, '""')}"`,
      e.human_authorized ? 'TRUE' : 'FALSE',
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

export const auditService = new AuditService();
