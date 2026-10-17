/**
 * LIFELINE OS — CANONICAL EVIDENCE & PROVENANCE DATA MODEL
 * Schema Version: 1.0.0
 * 
 * Non-negotiable principles:
 * - No operationally important number without provenance.
 * - No forecast without time horizon, issue time, and uncertainty.
 * - Distinct separation between observed, official, modelled, and assumed evidence.
 */

// 1. Measurement Types (Section 3.1)
export type MeasurementType =
  | 'observed_gauge_level'
  | 'forecast_discharge'
  | 'forecast_water_level'
  | 'observed_rainfall'
  | 'forecast_rainfall'
  | 'modelled_flood_extent'
  | 'scenario_water_level'
  | 'unknown';

// 2. Data Availability States (Section 3.2)
export type DataAvailabilityState =
  | 'LIVE'
  | 'STALE'
  | 'PARTIAL'
  | 'UNAVAILABLE'
  | 'SIMULATED'
  | 'REJECTED';

// 3. Route Accessibility Classifications (Section 3.3)
export type RouteClassification =
  | 'REAL_ROUTED'
  | 'GRAPH_COMPUTED'
  | 'SCENARIO_ROUTED'
  | 'SYNTHETIC_VISUAL'
  | 'NO_ROUTE'
  | 'ROUTE_UNKNOWN';

// 4. Evidence Classification Tiers (Section 7)
export type EvidenceClass =
  | 'OBSERVED'
  | 'OFFICIAL'
  | 'REPORTED'
  | 'MODELLED'
  | 'ASSUMED'
  | 'SIMULATED'
  | 'UNKNOWN';

// 5. Geographic Search & Selection Modes (Section 5.4)
export type GeoSelectionMode =
  | 'POINT'
  | 'ADMIN_AREA'
  | 'CUSTOM_AOI'
  | 'BASIN';

// 6. Location Analysis States (Section 5.6)
export type LocationAnalysisState =
  | 'READY'
  | 'PARTIAL'
  | 'NEEDS_CONFIGURATION'
  | 'INSUFFICIENT_DATA'
  | 'FAILED'
  | 'UNSUPPORTED';

// 7. Human Authorization Status for Emergency Actions (Section 10, 15)
export type AuthorizationState =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'DISPATCHED'
  | 'REJECTED';

// 8. Canonical Evidence Record Schema (Section 7)
export interface CanonicalEvidenceRecord<T = number | string | boolean | object> {
  id: string;
  incident_id: string;
  location_id: string;
  source_id: string;
  measurement_type: MeasurementType;
  value: T;
  unit: string;
  geometry?: [number, number] | [number, number][] | GeoJSON.Geometry;
  observed_at?: string; // ISO 8601 UTC
  issued_at?: string;   // ISO 8601 UTC
  valid_from?: string;  // ISO 8601 UTC
  valid_to?: string;    // ISO 8601 UTC
  retrieved_at: string; // ISO 8601 UTC
  published_at?: string;// ISO 8601 UTC
  source_object_id?: string;
  source_url?: string;
  license: string;
  spatial_resolution?: string;
  temporal_resolution?: string;
  quality_flags: string[];
  evidence_class: EvidenceClass;
  data_state: DataAvailabilityState;
  uncertainty?: {
    plus_minus?: number;
    confidence_pct?: number;
    ensemble_spread?: [number, number];
    qualitative?: string;
  };
  processing_version: string;
  transformation_parameters?: Record<string, any>;
  parent_evidence_ids?: string[];
  scenario_id?: string;
  schema_version: '1.0.0';
}

// 9. Multidimensional Source Confidence & Trust Indicator (Section 6)
export interface SourceTrustProfile {
  source_id: string;
  name: string;
  authority_rating: 'OFFICIAL_NATIONAL' | 'OFFICIAL_STATE' | 'SCIENTIFIC_INTERGOVERNMENTAL' | 'OPEN_COMMUNITY' | 'UNVERIFIED';
  measurement_quality: 'HIGH_PRECISION_INSTRUMENT' | 'NUMERICAL_FORECAST_MODEL' | 'REMOTE_SENSING_ESTIMATE' | 'CITIZEN_REPORT';
  spatial_relevance: 'STATION_IN_AOI' | 'REGIONAL_GRID' | 'GLOBAL_INTERPOLATED' | 'OUT_OF_BOUNDS';
  freshness_latency_sec: number;
  completeness_pct: number;
  independent_corroboration: boolean;
  known_limitations: string[];
}

// 10. Audit Log Entry for Incident Decision Lineage (Section 7, 15)
export interface AuditLogEntry {
  audit_id: string;
  timestamp: string; // ISO 8601 UTC
  user_id: string;
  user_role: 'INCIDENT_COMMANDER' | 'LOGISTICS_CHIEF' | 'GIS_ANALYST' | 'PUBLIC_INFO_OFFICER' | 'AUTOMATED_POLICY';
  action_type:
    | 'SCENARIO_CREATED'
    | 'EDGE_REMOVED'
    | 'RESOURCE_ASSIGNED'
    | 'CAP_ALERT_DRAFTED'
    | 'BUDGET_SUBMITTED'
    | 'DISPATCH_AUTHORIZED'
    | 'ORDER_DISPATCHED'
    | 'SURGE_STABILIZED'
    | 'GEOGRAPHIC_SEARCH'
    | 'MANUAL_OVERRIDE';
  rationale: string;
  input_evidence_ids: string[];
  output_state_hash?: string;
  human_authorized: boolean;
}

// 11. Geospatial Evidence States (Nepal Flood Map / Lifeline OS Standard)
export type EvidenceState =
  | 'OBSERVED'
  | 'OFFICIAL'
  | 'REPORTED'
  | 'MODELLED'
  | 'ASSUMED'
  | 'SIMULATED'
  | 'UNKNOWN';

export type EvidenceCategory =
  | 'imagery'
  | 'flood_extent'
  | 'official_assessment'
  | 'ground_reports'
  | 'infrastructure_footprints'
  | 'critical_facilities'
  | 'transport_network'
  | 'community_media'
  | 'simulated_scenarios';

// 12. Standard Damage Report Statuses
export type DamageReportStatus =
  | 'UNASSESSED'
  | 'REPORTED_DAMAGED'
  | 'REPORTED_DESTROYED'
  | 'UNDER_REPAIR'
  | 'REPORTED_RESTORED'
  | 'VERIFIED'
  | 'CONFLICTING_REPORTS'
  | 'UNKNOWN';

// 13. Field Evidence Editing Lifecycle
export type FieldEditReviewStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'REVIEWED'
  | 'ACCEPTED'
  | 'REJECTED';

export type FieldEditType =
  | 'bridge'
  | 'road'
  | 'flood_boundary'
  | 'blocked_access'
  | 'facility'
  | 'community_observation';

export interface FieldEditRecord {
  id: string;
  theaterId: string;
  type: FieldEditType;
  title: string;
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon';
    coordinates: any;
  };
  reportedCondition: DamageReportStatus;
  author: string;
  authorRole: string;
  reviewStatus: FieldEditReviewStatus;
  submittedAt: string; // ISO 8601
  reviewedAt?: string;
  reviewerId?: string;
  reviewNotes?: string;
  notes?: string;
  uncertainty?: string;
  attachmentUrl?: string;
  isDemonstration: boolean;
}

// 14. Explicit Separation of Road Condition from Route Accessibility
export interface RoadSegmentCondition {
  segmentId: string;
  roadName: string;
  corridorId: string;
  condition: DamageReportStatus;
  evidenceSource: string;
  sourceUrl?: string;
  observationTime: string; // ISO 8601
  verificationStatus: 'VERIFIED' | 'PROVISIONAL_UNVERIFIED' | 'CONFLICTING' | 'OFFICIAL_CONFIRMED';
  isClosureConfirmed: boolean;
  isSimulatedClosure: boolean;
  intersectsFloodPolygon: boolean;
  floodDepthEstMeters?: number;
  breachWidthMeters?: number;
  notes: string;
}

export interface RouteFeasibilityEvaluation {
  routeId: string;
  origin: { name: string; coordinates: [number, number] };
  destination: { name: string; coordinates: [number, number] };
  networkVersion: string;
  scenarioId: string;
  routingAlgorithm: string; // e.g. "OSRM v5.24 + Dijkstra Dynamic Avoidance"
  validity: RouteClassification; // 'REAL_ROUTED' | 'NO_ROUTE' | 'ROUTE_UNKNOWN'
  distanceKm: number;
  estimatedTravelMins: number;
  appliedClosures: string[];
  traversesDamagedSegmentWithoutIntervention: boolean;
  conflictDetected: boolean;
  conflictDetails?: string;
  missingNetworkCoverage: boolean;
  rationale: string;
}
