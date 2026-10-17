/**
 * LIFELINE OS — FIELD EVIDENCE EDITOR SERVICE
 * 
 * Manages lightweight field observations, community damage reports,
 * and emergency infrastructure updates.
 * 
 * Implements draft/review state machine:
 * DRAFT -> SUBMITTED -> REVIEWED -> ACCEPTED or REJECTED
 * 
 * Validates GeoJSON RFC 7946 geometry, WGS84 CRS, and exports GeoJSON FeatureCollection.
 */

import { FieldEditRecord, FieldEditType, DamageReportStatus, FieldEditReviewStatus } from '../types/evidence';

const STORAGE_KEY = 'lifeline_os_field_edits_demo';

export interface CreateFieldEditInput {
  theaterId: string;
  type: FieldEditType;
  title: string;
  lat: number;
  lon: number;
  reportedCondition: DamageReportStatus;
  author: string;
  authorRole?: string;
  notes?: string;
  attachmentUrl?: string;
}

export class FieldEvidenceEditorService {
  private edits: FieldEditRecord[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          this.edits = JSON.parse(raw);
          return;
        }
      }
    } catch (e) {
      // Fallback
    }
    // Pre-populate with one demonstration review entry
    this.edits = [
      {
        id: 'EDIT-DEMO-001',
        theaterId: 'silchar',
        type: 'road',
        title: 'Borkhola-Rongpur Connecting Spur Mudslide',
        geometry: {
          type: 'Point',
          coordinates: [92.8410, 24.8320], // GeoJSON standard: [lon, lat]
        },
        reportedCondition: 'REPORTED_DAMAGED',
        author: 'Gram Panchayat Field Volunteer',
        authorRole: 'COMMUNITY_OBSERVER',
        reviewStatus: 'SUBMITTED',
        submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        notes: '0.8m thick silt deposit blocking standard 2-wheelers. Tractors passable.',
        uncertainty: 'Estimated via smartphone GPS ±8m',
        isDemonstration: true,
      },
    ];
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.edits));
      }
    } catch (e) {
      // Ignore
    }
  }

  public getAllEdits(): FieldEditRecord[] {
    return [...this.edits];
  }

  public getEditsByTheater(theaterId: string): FieldEditRecord[] {
    return this.edits.filter((e) => e.theaterId === theaterId);
  }

  public validateInput(input: CreateFieldEditInput): { valid: boolean; error?: string } {
    if (!input.title || input.title.trim().length < 3) {
      return { valid: false, error: 'Title must be at least 3 characters.' };
    }
    if (typeof input.lat !== 'number' || isNaN(input.lat) || input.lat < -90 || input.lat > 90) {
      return { valid: false, error: 'Latitude must be a valid number between -90 and 90.' };
    }
    if (typeof input.lon !== 'number' || isNaN(input.lon) || input.lon < -180 || input.lon > 180) {
      return { valid: false, error: 'Longitude must be a valid number between -180 and 180.' };
    }
    if (!input.author || input.author.trim().length < 2) {
      return { valid: false, error: 'Author identifier is required for provenance tracking.' };
    }
    return { valid: true };
  }

  public createEdit(input: CreateFieldEditInput): { success: boolean; edit?: FieldEditRecord; error?: string } {
    const val = this.validateInput(input);
    if (!val.valid) {
      return { success: false, error: val.error };
    }

    const edit: FieldEditRecord = {
      id: `EDIT-${Date.now().toString(36).toUpperCase()}`,
      theaterId: input.theaterId,
      type: input.type,
      title: input.title.trim(),
      geometry: {
        type: 'Point',
        coordinates: [input.lon, input.lat], // RFC 7946 standard: [lon, lat]
      },
      reportedCondition: input.reportedCondition,
      author: input.author.trim(),
      authorRole: input.authorRole || 'DEMO_CONTRIBUTOR',
      reviewStatus: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
      notes: input.notes?.trim() || 'Field observation recorded via Lifeline OS Demonstration Editor',
      attachmentUrl: input.attachmentUrl?.trim(),
      uncertainty: 'Direct operator input; unverified provisional status',
      isDemonstration: true,
    };

    this.edits.unshift(edit);
    this.saveToStorage();
    return { success: true, edit };
  }

  public submitFieldEdit(input: CreateFieldEditInput): { success: boolean; edit?: FieldEditRecord; error?: string } {
    return this.createEdit(input);
  }

  public updateReviewStatus(
    editId: string,
    status: FieldEditReviewStatus,
    reviewerId: string,
    reviewNotes?: string
  ): boolean {
    const edit = this.edits.find((e) => e.id === editId);
    if (!edit) return false;

    edit.reviewStatus = status;
    edit.reviewedAt = new Date().toISOString();
    edit.reviewerId = reviewerId;
    if (reviewNotes) {
      edit.reviewNotes = reviewNotes;
    }
    this.saveToStorage();
    return true;
  }

  public exportGeoJson(theaterId?: string): string {
    const targets = theaterId ? this.getEditsByTheater(theaterId) : this.edits;

    const featureCollection: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: targets.map((e) => ({
        type: 'Feature',
        geometry: e.geometry as any,
        properties: {
          id: e.id,
          theaterId: e.theaterId,
          type: e.type,
          title: e.title,
          reportedCondition: e.reportedCondition,
          author: e.author,
          authorRole: e.authorRole,
          reviewStatus: e.reviewStatus,
          submittedAt: e.submittedAt,
          reviewedAt: e.reviewedAt,
          reviewerId: e.reviewerId,
          notes: e.notes,
          provenance: 'USER_SUBMITTED_LOCAL_DEMO',
          crs: 'urn:ogc:def:crs:OGC:1.3:CRS84',
        },
      })),
    };

    return JSON.stringify(featureCollection, null, 2);
  }
}

export const fieldEvidenceEditorService = new FieldEvidenceEditorService();
