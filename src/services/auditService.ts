/**
 * LIFELINE OS — IMMUTABLE AUDIT TRAIL SERVICE
 * 
 * Records every operational command, parameter override, resource allocation,
 * and dispatch decision with timestamp, role, rationale, and provenance.
 * Complies with Section 7, 10, and 15 of the Master Specification.
 */

import { AuditLogEntry } from '../types/evidence';

function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const maxWord = Math.pow(2, 32);
  let i = 0;
  let result = '';
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, boolean> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (Math.pow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  ascii += '\x80';
  while ((ascii.length % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words.push((asciiBitLength / maxWord) | 0);
  words.push(asciiBitLength);
  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = [...hash];
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] = i < 16 ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      const s1_ = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1_ + ch + k[i] + w[i]) | 0;
      const s0_ = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0_ + maj) | 0;
      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }
    for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
  }
  for (i = 0; i < 8; i++) {
    for (let j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

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
      human_authorized: false,
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
    const audit_id = `AUDIT_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const user_id = params.user_id || 'SEOC_COMMANDER_01';
    const user_role = params.user_role || 'INCIDENT_COMMANDER';
    const human_authorized = params.human_authorized ?? false;
    const input_evidence_ids = params.input_evidence_ids || ['user_command_intent'];

    const canonicalString = JSON.stringify({
      audit_id,
      timestamp,
      user_id,
      user_role,
      action_type: params.action_type,
      rationale: params.rationale,
      input_evidence_ids,
      human_authorized,
    });

    const entry: AuditLogEntry = {
      audit_id,
      timestamp,
      user_id,
      user_role,
      action_type: params.action_type,
      rationale: params.rationale,
      input_evidence_ids,
      human_authorized,
      output_state_hash: sha256(canonicalString),
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
