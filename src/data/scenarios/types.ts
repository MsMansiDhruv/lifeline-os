/**
 * LIFELINE OS — SCENARIO MANIFEST TYPES
 * 
 * Defines standard schemas for versioned scenario workspaces.
 * Both Assam and Nepal share this schema while keeping their scenario-specific
 * datasets, corridors, and operational analyses distinct.
 */

import { EvidenceCategory, EvidenceState } from '../../types/evidence';

export type ScenarioId = 'silchar' | 'nepal';

export interface ScenarioCorridor {
  id: string;
  name: string;
  roadDesignation: string;
  failureType: string;
  breachWidthMeters: number;
  coordinates: [number, number]; // [lat, lon]
  baselineKm: number;
  baselineMinutes: number;
  detourKm: number;
  detourMinutes: number;
  detourPenaltyMinutes: number;
  detourRouteName: string;
  evidenceSource: string;
  verificationStatus: 'VERIFIED' | 'PROVISIONAL_UNVERIFIED' | 'CONFLICTING' | 'OFFICIAL_CONFIRMED';
  affectedSettlements: string[];
  isolatedPopulationEst: number;
}

export interface ScenarioSettlement {
  id: string;
  name: string;
  lat: number;
  lon: number;
  population: number;
  accessState: 'CONNECTED' | 'CUT_OFF' | 'RESTRICTED';
  elevationAsl: number;
  notes: string;
}

export interface ScenarioFacility {
  id: string;
  name: string;
  type: 'referral' | 'district' | 'primary' | 'aid_post';
  lat: number;
  lon: number;
  beds?: number;
  availableBeds?: number;
  icuBeds?: number;
  elevationAsl: number;
  status: 'OPERATIONAL' | 'WATERLOGGED' | 'SATURATED' | 'ISOLATED';
  selectionReason: string;
}

export interface ScenarioManifest {
  id: ScenarioId;
  version: string;
  title: string;
  subtitle: string;
  region: string;
  country: string;
  authority: {
    name: string;
    shortName: string;
    portalUrl: string;
  };
  eventDate: string;
  headline: string;
  coreQuestion: string;
  description: string;
  center: [number, number];
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  defaultZoom: number;
  elevationContext: {
    minMeters: number;
    maxMeters: number;
    terrainType: 'riverine_floodplain' | 'himalayan_mountain_gorge';
    demSource: string;
    verticalExaggeration: number;
  };
  river: {
    name: string;
    coordinates: [number, number][];
  };
  floodExtent: {
    name: string;
    areaSqKm: number;
    sensor: string;
    acquisitionDate: string;
    coordinates: [number, number][];
  };
  corridors: ScenarioCorridor[];
  primaryCorridorId: string;
  settlements: ScenarioSettlement[];
  facilities: ScenarioFacility[];
  supportedAnalyses: Array<
    | 'healthcare_surge'
    | 'bridge_restoration'
    | 'terrain_3d_investigation'
    | 'image_swipe_comparison'
    | 'field_damage_explorer'
    | 'connectivity_impact'
  >;
  evidenceDatasetIds: string[];
  damageReportIds: string[];
  metrics: {
    totalExposedStructures: number;
    totalCutOffKm: number;
    damagedBridgesCount: number;
    isolatedPopulationTotal: number;
    criticalRiskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE';
  };
}
