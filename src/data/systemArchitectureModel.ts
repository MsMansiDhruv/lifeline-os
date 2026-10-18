/**
 * LIFELINE OS — Engineering-Grade Technical Architecture & Data-Flow Model
 * 
 * Clean, white-background, precision geospatial architecture diagram.
 * Accurately models the actual implemented system capabilities and data dependencies.
 */

export type NodeCategory =
  | 'external_source'
  | 'ingestion'
  | 'validation'
  | 'geospatial'
  | 'decision_support'
  | 'human_operations'
  | 'diagnostic_path'
  | 'audit';

export type ComponentStatus =
  | 'OPERATIONAL'
  | 'EXTERNAL_API'
  | 'IMPORTED'
  | 'SIMULATED'
  | 'USER_INPUT'
  | 'PLANNED';

export type EdgeType =
  | 'data_flow'
  | 'validated_flow'
  | 'quarantine_flow'
  | 'warning_flow'
  | 'failure_flow'
  | 'audit_flow'
  | 'feedback_loop';

export interface ArchitectureGroup {
  id: string;
  number: string;
  title: string;
  description: string;
  bounds: { x: number; y: number; width: number; height: number };
}

export interface ArchitectureNode {
  id: string;
  title: string;
  category: NodeCategory;
  groupId: string;
  status: ComponentStatus;
  statusLabel?: string;
  sourceName?: string;
  dataType?: string;
  inputDescription: string;
  outputDescription: string;
  purpose: string;
  technicalNotes?: string;
  sourceFiles: string[];
  upstreamIds: string[];
  downstreamIds: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  isDiagnosticPath?: boolean;
}

export interface ArchitectureEdge {
  id: string;
  sourceId: string;
  targetId: string;
  edgeType: EdgeType;
  label?: string;
  path: string; // SVG path string
  isHighlighted?: boolean;
}

// -----------------------------------------------------------------------------
// 5 GROUP CONTAINERS + SUPPORTING DIAGNOSTICS
// -----------------------------------------------------------------------------
export const ARCHITECTURE_GROUPS: ArchitectureGroup[] = [
  {
    id: 'grp_sources',
    number: '1',
    title: 'External Data Sources',
    description: 'Empirical remote sensing, gauge telemetry, base network & field reports',
    bounds: { x: 40, y: 30, width: 270, height: 690 },
  },
  {
    id: 'grp_ingest_quality',
    number: '2',
    title: 'Ingestion & Quality Assurance',
    description: 'Schema normalization, coordinate verification & epistemic provenance classification',
    bounds: { x: 350, y: 30, width: 270, height: 690 },
  },
  {
    id: 'grp_geospatial',
    number: '3',
    title: 'Geospatial Processing Engine',
    description: 'Metric reprojection, flood overlay intersection & shortest-path network topology',
    bounds: { x: 660, y: 30, width: 280, height: 690 },
  },
  {
    id: 'grp_decision_support',
    number: '4',
    title: 'Decision Support & Response Planning',
    description: 'Impact aggregation, k-medoids staging optimization & physical constraint validation',
    bounds: { x: 980, y: 30, width: 280, height: 690 },
  },
  {
    id: 'grp_human_audit',
    number: '5',
    title: 'Human Operations & Audit',
    description: 'Commander review, administrative sanctioning, broadcast dispatch & SHA-256 audit ledger',
    bounds: { x: 1300, y: 30, width: 280, height: 690 },
  },
];

// -----------------------------------------------------------------------------
// NODES DEFINITION (23 ENGINEERING NODES)
// -----------------------------------------------------------------------------
export const ARCHITECTURE_NODES: ArchitectureNode[] = [
  // =========================================================================
  // GROUP 1: EXTERNAL DATA SOURCES
  // =========================================================================
  {
    id: 'src_sentinel1',
    title: 'Sentinel-1 Flood Imagery',
    category: 'external_source',
    groupId: 'grp_sources',
    status: 'IMPORTED',
    statusLabel: 'IMPORTED (C-BAND SAR)',
    sourceName: 'Copernicus Open Access / GEE',
    dataType: 'GeoTIFF Raster & Vector Polygons',
    inputDescription: 'Radar backscatter amplitude (VV/VH polarization)',
    outputDescription: 'Surface water extent polygons (>= 5,000 m²)',
    purpose: 'Provides all-weather, cloud-penetrating synthetic aperture radar imagery of inundation boundaries.',
    technicalNotes: 'Filtered with 5,000 m² minimum area threshold to eliminate radar noise and ephemeral puddles.',
    sourceFiles: ['src/data/disasterData.ts', 'app.py'],
    upstreamIds: [],
    downstreamIds: ['comp_ingest_norm'],
    x: 60,
    y: 75,
    width: 230,
    height: 105,
  },
  {
    id: 'src_weather',
    title: 'Rainfall & Weather Telemetry',
    category: 'external_source',
    groupId: 'grp_sources',
    status: 'EXTERNAL_API',
    statusLabel: 'EXTERNAL API (REST/LIVE)',
    sourceName: 'Open-Meteo Meteorological Service',
    dataType: 'Hourly JSON Time-Series',
    inputDescription: 'District bounding box coordinates',
    outputDescription: 'Hourly precipitation (mm), wind speed & gusts (km/h)',
    purpose: 'Supplies real-time meteorological conditions for dynamic flood risk and aircraft wind safety envelope checks.',
    technicalNotes: 'Polled at 15-minute intervals with local fallback cache when connectivity drops.',
    sourceFiles: ['src/services/ecosystemServiceBus.ts', 'src/components/LiveMeteoTelemetryPanel.tsx'],
    upstreamIds: [],
    downstreamIds: ['comp_ingest_norm'],
    x: 60,
    y: 195,
    width: 230,
    height: 105,
  },
  {
    id: 'src_cwc_gauge',
    title: 'River Discharge & Gauge Telemetry',
    category: 'external_source',
    groupId: 'grp_sources',
    status: 'SIMULATED',
    statusLabel: 'SIMULATED TELEMETRY',
    sourceName: 'Central Water Commission (Barak River)',
    dataType: 'Hydrological River Stage Levels (m ASL)',
    inputDescription: 'Automated gauge telemetry telemetry streams',
    outputDescription: 'Water surface elevation relative to danger mark',
    purpose: 'Tracks upstream water discharge and breach hazard thresholds along critical embankment corridors.',
    technicalNotes: 'Calibrated to the Annapurna Ghat gauge station historical flood hydrographs.',
    sourceFiles: ['src/data/theaters.ts', 'src/services/ecosystemServiceBus.ts'],
    upstreamIds: [],
    downstreamIds: ['comp_ingest_norm'],
    x: 60,
    y: 315,
    width: 230,
    height: 105,
  },
  {
    id: 'src_infrastructure',
    title: 'Road, Hospital & Settlement Registry',
    category: 'external_source',
    groupId: 'grp_sources',
    status: 'IMPORTED',
    statusLabel: 'IMPORTED (OSM + MoHFW)',
    sourceName: 'OpenStreetMap PBF & Health Facility Portal',
    dataType: 'OSM XML / Metric Graph + GeoJSON Points',
    inputDescription: 'Cachar District geographic administrative boundary',
    outputDescription: '31,214 graph nodes, 69,663 edges, 42 hospitals, 319 settlements',
    purpose: 'Establishes baseline traversable transport topology, clinic care capacities, and population counts.',
    technicalNotes: 'Projected from EPSG:4326 into UTM Zone 46N (EPSG:32646) metric Cartesian coordinate system.',
    sourceFiles: ['src/data/disasterData.ts', 'src/services/osrmRouting.ts'],
    upstreamIds: [],
    downstreamIds: ['comp_ingest_norm'],
    x: 60,
    y: 435,
    width: 230,
    height: 105,
  },
  {
    id: 'src_ground_reports',
    title: 'Ground Reports & Field Patrols',
    category: 'external_source',
    groupId: 'grp_sources',
    status: 'USER_INPUT',
    statusLabel: 'USER / FIELD INPUT',
    sourceName: 'Field Evidence Editor & Incident Patrols',
    dataType: 'Geo-tagged Mobile Tickets & Photos',
    inputDescription: 'First responder mobile inspection reports',
    outputDescription: 'Culvert breach confirmations, water depth overrides',
    purpose: 'Captures empirical ground truth overrides from on-site patrol units to correct remote sensing latency.',
    technicalNotes: 'Includes evidentiary timestamp, observer credentials, and photographic audit records.',
    sourceFiles: ['src/components/FieldEvidenceEditorModal.tsx'],
    upstreamIds: [],
    downstreamIds: ['comp_ingest_norm'],
    x: 60,
    y: 555,
    width: 230,
    height: 105,
  },

  // =========================================================================
  // GROUP 2: INGESTION & QUALITY ASSURANCE
  // =========================================================================
  {
    id: 'comp_ingest_norm',
    title: 'Data Ingestion & Normalization',
    category: 'ingestion',
    groupId: 'grp_ingest_quality',
    status: 'OPERATIONAL',
    statusLabel: 'OPERATIONAL',
    inputDescription: 'Raw satellite rasters, REST JSON, OSM XML, field tickets',
    outputDescription: 'Normalized GeoJSON feature records (WGS-84)',
    purpose: 'Harmonizes heterogeneous spatial resolutions, coordinate systems, and update rates into unified data objects.',
    technicalNotes: 'Applies canonical schemas to ensure temporal and spatial alignment across all sources.',
    sourceFiles: ['src/services/osrmRouting.ts', 'src/data/disasterData.ts'],
    upstreamIds: ['src_sentinel1', 'src_weather', 'src_cwc_gauge', 'src_infrastructure', 'src_ground_reports', 'node_feedback_reingest'],
    downstreamIds: ['comp_schema_prov'],
    x: 370,
    y: 75,
    width: 230,
    height: 115,
  },
  {
    id: 'comp_schema_prov',
    title: 'Schema Validation & Provenance',
    category: 'validation',
    groupId: 'grp_ingest_quality',
    status: 'OPERATIONAL',
    statusLabel: 'OPERATIONAL',
    inputDescription: 'Normalized GeoJSON candidate records',
    outputDescription: 'Validated records, rejected logs, quality warnings',
    purpose: 'Validates strict coordinate bounds, geometry integrity, data provenance, and freshness TTL (6 hours).',
    technicalNotes: 'Tags every record with epistemic category (OBSERVED, OFFICIAL, REPORTED, MODELLED, SIMULATED, UNKNOWN).',
    sourceFiles: ['src/services/auditService.ts', 'src/data/disasterData.ts'],
    upstreamIds: ['comp_ingest_norm'],
    downstreamIds: ['comp_coord_proj', 'out_quarantine', 'out_quality_warnings'],
    x: 370,
    y: 220,
    width: 230,
    height: 125,
  },
  {
    id: 'out_quarantine',
    title: 'Quarantine & Diagnostics',
    category: 'diagnostic_path',
    groupId: 'grp_ingest_quality',
    status: 'OPERATIONAL',
    statusLabel: 'DIAGNOSTIC PATH',
    inputDescription: 'Schema-rejected or corrupt geometry records',
    outputDescription: 'Isolated quarantine logs with fault codes',
    purpose: 'Prevents corrupted, self-intersecting, or out-of-bounds geometries from crashing downstream network algorithms.',
    technicalNotes: 'Records are never silently discarded; error logs are retained for post-incident audit inspection.',
    sourceFiles: ['src/services/auditService.ts'],
    upstreamIds: ['comp_schema_prov'],
    downstreamIds: [],
    x: 370,
    y: 385,
    width: 230,
    height: 105,
    isDiagnosticPath: true,
  },
  {
    id: 'out_quality_warnings',
    title: 'Data-Quality Warnings & Staleness',
    category: 'diagnostic_path',
    groupId: 'grp_ingest_quality',
    status: 'OPERATIONAL',
    statusLabel: 'WARNING PATH',
    inputDescription: 'Stale telemetry (>6h) or unmonitored coordinates',
    outputDescription: 'Epistemic uncertainty caveat markers',
    purpose: 'Surfaces known measurement gaps, missing sensors, and conflicting observations without halting pipeline execution.',
    technicalNotes: 'Directly informs the What We Don\'t Know epistemic uncertainty ledger.',
    sourceFiles: ['src/components/WhatWeDontKnowModal.tsx'],
    upstreamIds: ['comp_schema_prov'],
    downstreamIds: [],
    x: 370,
    y: 515,
    width: 230,
    height: 110,
    isDiagnosticPath: true,
  },

  // =========================================================================
  // GROUP 3: GEOSPATIAL PROCESSING ENGINE
  // =========================================================================
  {
    id: 'comp_coord_proj',
    title: 'Coordinate & Geometry Validation',
    category: 'geospatial',
    groupId: 'grp_geospatial',
    status: 'OPERATIONAL',
    statusLabel: 'OPERATIONAL',
    inputDescription: 'Validated WGS-84 (EPSG:4326) geometries',
    outputDescription: 'Metric planar coordinates (UTM 46N / EPSG:32646)',
    purpose: 'Converts angular coordinates into metric meters to guarantee accurate Euclidean distances and bridge span sizing.',
    technicalNotes: 'Eliminates degree distortion errors inherent to unprojected spherical calculations in Assam.',
    sourceFiles: ['src/data/disasterData.ts', 'app.py'],
    upstreamIds: ['comp_schema_prov'],
    downstreamIds: ['comp_flood_intersect'],
    x: 680,
    y: 75,
    width: 240,
    height: 105,
  },
  {
    id: 'comp_flood_intersect',
    title: 'Flood Extent & Asset Intersection',
    category: 'geospatial',
    groupId: 'grp_geospatial',
    status: 'OPERATIONAL',
    statusLabel: 'OPERATIONAL',
    inputDescription: 'Projected flood polygons + buffered road lines',
    outputDescription: 'Potential exposure candidate edges & bridgeheads',
    purpose: 'Identifies which transport links intersect water boundaries. Distinguishes observed flood from modelled surge.',
    technicalNotes: 'Crucial distinction: Geographic intersection indicates POTENTIAL exposure, not confirmed structural destruction.',
    sourceFiles: ['src/data/disasterData.ts', 'src/services/osrmRouting.ts'],
    upstreamIds: ['comp_coord_proj'],
    downstreamIds: ['comp_network_engine'],
    x: 680,
    y: 205,
    width: 240,
    height: 125,
  },
  {
    id: 'comp_network_engine',
    title: 'Road-Network Graph Engine',
    category: 'geospatial',
    groupId: 'grp_geospatial',
    status: 'OPERATIONAL',
    statusLabel: 'OPERATIONAL',
    inputDescription: 'Metric road graph + candidate severed edge list',
    outputDescription: 'Sub-graphs, cut-edges, Dijkstra travel times',
    purpose: 'Constructs the active transport network, severs impassable edges, and calculates shortest path access to clinics.',
    technicalNotes: 'Computes Tarjan articulation bridges to identify community isolation pinch-points.',
    sourceFiles: ['src/services/osrmRouting.ts', 'app.py'],
    upstreamIds: ['comp_flood_intersect'],
    downstreamIds: ['comp_exposure_agg'],
    x: 680,
    y: 355,
    width: 240,
    height: 115,
  },
  {
    id: 'comp_exposure_agg',
    title: 'Settlement Exposure Aggregation',
    category: 'geospatial',
    groupId: 'grp_geospatial',
    status: 'OPERATIONAL',
    statusLabel: 'OPERATIONAL',
    inputDescription: 'Graph accessibility matrix + settlement census',
    outputDescription: 'Isolated settlement counts, delayed populations',
    purpose: 'Aggregates impacted human populations and maps catchment losses for each public health center.',
    technicalNotes: 'Differentiates between partial detour delays and absolute physical severance (isolated villages).',
    sourceFiles: ['src/data/disasterData.ts'],
    upstreamIds: ['comp_network_engine'],
    downstreamIds: ['out_impact_assessment'],
    x: 680,
    y: 495,
    width: 240,
    height: 115,
  },

  // =========================================================================
  // GROUP 4: DECISION SUPPORT & RESPONSE PLANNING
  // =========================================================================
  {
    id: 'out_impact_assessment',
    title: 'Impact & Route Disruption Outputs',
    category: 'decision_support',
    groupId: 'grp_decision_support',
    status: 'OPERATIONAL',
    statusLabel: 'OPERATIONAL',
    inputDescription: 'Settlement reachability & severed segment indices',
    outputDescription: 'Severed segments (1,830), isolated villages (17)',
    purpose: 'Summarizes verified network disruption metrics and detour ratios for emergency commanders.',
    technicalNotes: 'Provides the empirical baseline against which engineering interventions are evaluated.',
    sourceFiles: ['src/data/disasterData.ts'],
    upstreamIds: ['comp_exposure_agg'],
    downstreamIds: ['comp_alloc_engine'],
    x: 1000,
    y: 75,
    width: 240,
    height: 115,
  },
  {
    id: 'comp_alloc_engine',
    title: 'Deterministic Resource Allocation',
    category: 'decision_support',
    groupId: 'grp_decision_support',
    status: 'OPERATIONAL',
    statusLabel: 'OPERATIONAL',
    inputDescription: 'Fleet inventory, patient priorities, network graph',
    outputDescription: 'Optimal staging hubs, Bailey bridge ROI ranking',
    purpose: 'Runs k-medoids clustering on high-elevation unflooded nodes and calculates intervention return on investment.',
    technicalNotes: 'ROI(e) = (Reconnected Population + Sum Delta-km saved) / Span Length.',
    sourceFiles: ['src/services/ambulanceAllocationService.ts', 'app.py'],
    upstreamIds: ['out_impact_assessment'],
    downstreamIds: ['comp_feasibility_check'],
    x: 1000,
    y: 215,
    width: 240,
    height: 125,
  },
  {
    id: 'comp_feasibility_check',
    title: 'Feasibility & Constraint Validation',
    category: 'decision_support',
    groupId: 'grp_decision_support',
    status: 'OPERATIONAL',
    statusLabel: 'OPERATIONAL',
    inputDescription: 'Proposed staging sites & physical terrain profiles',
    outputDescription: 'Feasible response plan OR Infeasible failure flag',
    purpose: 'Enforces engineering reality checks: bridge span limit (<=60m), vehicle weight limits, and 60-minute Golden Hour.',
    technicalNotes: 'Prevents proposing ground solutions when roadheads are submerged or spans exceed military modular limits.',
    sourceFiles: ['src/data/theaters.ts', 'src/services/ambulanceAllocationService.ts'],
    upstreamIds: ['comp_alloc_engine'],
    downstreamIds: ['node_proposed_plan', 'out_planner_diagnostics'],
    x: 1000,
    y: 365,
    width: 240,
    height: 115,
  },
  {
    id: 'node_proposed_plan',
    title: 'Proposed Response Plan',
    category: 'decision_support',
    groupId: 'grp_decision_support',
    status: 'OPERATIONAL',
    statusLabel: 'OPERATIONAL',
    inputDescription: 'Feasible resource pairings & validated corridors',
    outputDescription: 'Staging assignments, route guidance manifests',
    purpose: 'Assembles actionable deployment instructions ready for human incident commander review and authorization.',
    technicalNotes: 'Specifies vehicle fleet profile (Light 4x4 vs Heavy) and turn-by-turn waypoint corridors.',
    sourceFiles: ['src/components/SanctionOrderModal.tsx'],
    upstreamIds: ['comp_feasibility_check'],
    downstreamIds: ['comp_report_gen'],
    x: 1000,
    y: 505,
    width: 240,
    height: 105,
  },
  {
    id: 'out_planner_diagnostics',
    title: 'Planner Diagnostics: NO_ROUTE',
    category: 'diagnostic_path',
    groupId: 'grp_decision_support',
    status: 'OPERATIONAL',
    statusLabel: 'FAILURE PATH',
    inputDescription: 'Infeasible constraint breaches or total road severance',
    outputDescription: 'Strategic Air-Drop / SDRF Boat Escalation ticket',
    purpose: 'Explicit failure path: When ground transit is impossible, alerts commander that road response cannot succeed.',
    technicalNotes: 'Triggers request for Indian Air Force rotary-wing air-drop and NDRF motorized inflatable boats.',
    sourceFiles: ['src/components/CommandPanel.tsx', 'src/data/disasterData.ts'],
    upstreamIds: ['comp_feasibility_check'],
    downstreamIds: [],
    x: 1000,
    y: 635,
    width: 240,
    height: 105,
    isDiagnosticPath: true,
  },

  // =========================================================================
  // GROUP 5: HUMAN OPERATIONS & AUDIT
  // =========================================================================
  {
    id: 'comp_report_gen',
    title: 'Evidence-Linked Report Synthesis',
    category: 'human_operations',
    groupId: 'grp_human_audit',
    status: 'OPERATIONAL',
    statusLabel: 'OPERATIONAL',
    inputDescription: 'Validated impacts + proposed engineering plan',
    outputDescription: 'Official DM Memo with coordinate audit receipts',
    purpose: 'Generates plain-language civil disaster memos citing exact flooded bridgeheads, isolated villages, and required repairs.',
    technicalNotes: 'Strict grounding: References only empirically verified coordinates and reachability deltas.',
    sourceFiles: ['src/components/UnifiedSteps/Chapter5Learn.tsx', 'src/services/auditService.ts'],
    upstreamIds: ['node_proposed_plan'],
    downstreamIds: ['comp_human_approval'],
    x: 1320,
    y: 75,
    width: 240,
    height: 110,
  },
  {
    id: 'comp_human_approval',
    title: 'Human Review & Operational Authorization',
    category: 'human_operations',
    groupId: 'grp_human_audit',
    status: 'OPERATIONAL',
    statusLabel: 'OPERATIONAL',
    inputDescription: 'Synthesized report + proposed response plan',
    outputDescription: 'Approved DM Act 2005 Sanction Order',
    purpose: 'Incident Commander reviews recommendations, overrides fleet constraints if necessary, and legally signs off.',
    technicalNotes: 'Ensures no automated system executes unverified field operations without human authorization.',
    sourceFiles: ['src/components/SanctionOrderModal.tsx'],
    upstreamIds: ['comp_report_gen'],
    downstreamIds: ['comp_notification', 'comp_audit_ledger'],
    x: 1320,
    y: 210,
    width: 240,
    height: 115,
  },
  {
    id: 'comp_notification',
    title: 'Authorized Notification / Test Broadcast',
    category: 'human_operations',
    groupId: 'grp_human_audit',
    status: 'SIMULATED',
    statusLabel: 'SIMULATED INTEGRATION',
    inputDescription: 'Approved sanction order + officer contact registry',
    outputDescription: 'CAP XML alert payload & SMS dispatch transmission',
    purpose: 'Formats Common Alerting Protocol (CAP) messages and transmits dispatch orders to local emergency teams.',
    technicalNotes: 'Clearly separated from real-world delivery confirmation; labeled as simulated test integration.',
    sourceFiles: ['src/services/emergencyBroadcastService.ts'],
    upstreamIds: ['comp_human_approval'],
    downstreamIds: [],
    x: 1320,
    y: 350,
    width: 240,
    height: 115,
  },
  {
    id: 'comp_audit_ledger',
    title: 'Cryptographic SHA-256 Audit Ledger',
    category: 'audit',
    groupId: 'grp_human_audit',
    status: 'OPERATIONAL',
    statusLabel: 'OPERATIONAL',
    inputDescription: 'Evidence hashes, model states, commander authorizations',
    outputDescription: 'Immutable SHA-256 Merkle chain state receipt',
    purpose: 'Records a tamper-evident audit trail of all data snapshots, algorithmic rankings, and human decisions.',
    technicalNotes: 'Provides complete post-incident forensic accountability under national disaster management guidelines.',
    sourceFiles: ['src/services/auditService.ts'],
    upstreamIds: ['comp_human_approval'],
    downstreamIds: ['node_feedback_reingest'],
    x: 1320,
    y: 490,
    width: 240,
    height: 105,
  },
  {
    id: 'node_feedback_reingest',
    title: 'Ground Truth Re-Ingestion & Audit',
    category: 'audit',
    groupId: 'grp_human_audit',
    status: 'OPERATIONAL',
    statusLabel: 'FEEDBACK LOOP',
    inputDescription: 'Field officer overrides, actual transit delays, flood marks',
    outputDescription: 'Hydrological calibration deltas & road graph updates',
    purpose: 'Closed-loop feedback: Compares predicted versus actual outcomes to recalibrate runoff coefficients and baseline roads.',
    technicalNotes: 'Loops directly back into Stage 2 Ingestion for iterative continuous model improvement.',
    sourceFiles: ['src/services/auditService.ts', 'src/components/FieldEvidenceEditorModal.tsx'],
    upstreamIds: ['comp_audit_ledger'],
    downstreamIds: ['comp_ingest_norm'],
    x: 1320,
    y: 615,
    width: 240,
    height: 105,
  },
];

// -----------------------------------------------------------------------------
// ORTHOGONAL CONNECTORS SPECIFICATION (CLEAN RIGHT-ANGLE PATHS)
// -----------------------------------------------------------------------------
export const ARCHITECTURE_EDGES: ArchitectureEdge[] = [
  // 1. Sources -> Ingestion & Normalization
  {
    id: 'e_sentinel1_ingest',
    sourceId: 'src_sentinel1',
    targetId: 'comp_ingest_norm',
    edgeType: 'data_flow',
    label: 'Flood raster',
    path: 'M 290 127 H 330 V 100 H 370',
  },
  {
    id: 'e_weather_ingest',
    sourceId: 'src_weather',
    targetId: 'comp_ingest_norm',
    edgeType: 'data_flow',
    label: 'Rainfall JSON',
    path: 'M 290 247 H 330 V 125 H 370',
  },
  {
    id: 'e_cwc_ingest',
    sourceId: 'src_cwc_gauge',
    targetId: 'comp_ingest_norm',
    edgeType: 'data_flow',
    label: 'Gauge stage',
    path: 'M 290 367 H 325 V 145 H 370',
  },
  {
    id: 'e_infra_ingest',
    sourceId: 'src_infrastructure',
    targetId: 'comp_ingest_norm',
    edgeType: 'data_flow',
    label: 'OSM road graph',
    path: 'M 290 487 H 320 V 165 H 370',
  },
  {
    id: 'e_ground_ingest',
    sourceId: 'src_ground_reports',
    targetId: 'comp_ingest_norm',
    edgeType: 'data_flow',
    label: 'Field patrols',
    path: 'M 290 607 H 315 V 180 H 370',
  },

  // 2. Ingestion -> Validation & Provenance
  {
    id: 'e_ingest_schema',
    sourceId: 'comp_ingest_norm',
    targetId: 'comp_schema_prov',
    edgeType: 'data_flow',
    label: 'Normalized GeoJSON',
    path: 'M 485 190 V 220',
  },

  // 3. Validation -> Processing (Validated Records: Teal)
  {
    id: 'e_schema_coord',
    sourceId: 'comp_schema_prov',
    targetId: 'comp_coord_proj',
    edgeType: 'validated_flow',
    label: 'Validated records',
    path: 'M 600 250 H 640 V 127 H 680',
  },

  // 4. Validation -> Quarantine & Warnings (Lower tier)
  {
    id: 'e_schema_quarantine',
    sourceId: 'comp_schema_prov',
    targetId: 'out_quarantine',
    edgeType: 'quarantine_flow',
    label: 'Rejected / invalid',
    path: 'M 485 345 V 385',
  },
  {
    id: 'e_schema_warnings',
    sourceId: 'comp_schema_prov',
    targetId: 'out_quality_warnings',
    edgeType: 'warning_flow',
    label: 'Stale / missing',
    path: 'M 400 345 V 515',
  },

  // 5. Geospatial Processing Sequence
  {
    id: 'e_coord_flood',
    sourceId: 'comp_coord_proj',
    targetId: 'comp_flood_intersect',
    edgeType: 'data_flow',
    label: 'Metric planar coords',
    path: 'M 800 180 V 205',
  },
  {
    id: 'e_flood_network',
    sourceId: 'comp_flood_intersect',
    targetId: 'comp_network_engine',
    edgeType: 'data_flow',
    label: 'Candidate breached edges',
    path: 'M 800 330 V 355',
  },
  {
    id: 'e_network_exposure',
    sourceId: 'comp_network_engine',
    targetId: 'comp_exposure_agg',
    edgeType: 'data_flow',
    label: 'Reachability matrix',
    path: 'M 800 470 V 495',
  },

  // 6. Geospatial -> Decision Support (Impact Outputs)
  {
    id: 'e_exposure_impact',
    sourceId: 'comp_exposure_agg',
    targetId: 'out_impact_assessment',
    edgeType: 'data_flow',
    label: 'Impacted settlements',
    path: 'M 920 545 H 950 V 132 H 1000',
  },

  // 7. Decision Support Sequence
  {
    id: 'e_impact_alloc',
    sourceId: 'out_impact_assessment',
    targetId: 'comp_alloc_engine',
    edgeType: 'data_flow',
    label: 'Severity ranking',
    path: 'M 1120 190 V 215',
  },
  {
    id: 'e_alloc_feasibility',
    sourceId: 'comp_alloc_engine',
    targetId: 'comp_feasibility_check',
    edgeType: 'data_flow',
    label: 'Candidate bridge & staging',
    path: 'M 1120 340 V 365',
  },
  {
    id: 'e_feasibility_plan',
    sourceId: 'comp_feasibility_check',
    targetId: 'node_proposed_plan',
    edgeType: 'validated_flow',
    label: 'Feasible (Span <= 60m)',
    path: 'M 1120 480 V 505',
  },
  {
    id: 'e_feasibility_failure',
    sourceId: 'comp_feasibility_check',
    targetId: 'out_planner_diagnostics',
    edgeType: 'failure_flow',
    label: 'NO_FEASIBLE_PLAN / NO_ROUTE',
    path: 'M 1180 480 V 635',
  },

  // 8. Decision Support -> Human Operations
  {
    id: 'e_plan_report',
    sourceId: 'node_proposed_plan',
    targetId: 'comp_report_gen',
    edgeType: 'data_flow',
    label: 'Proposed plan manifest',
    path: 'M 1240 550 H 1270 V 130 H 1320',
  },
  {
    id: 'e_report_approval',
    sourceId: 'comp_report_gen',
    targetId: 'comp_human_approval',
    edgeType: 'data_flow',
    label: 'Evidence memo',
    path: 'M 1440 185 V 210',
  },
  {
    id: 'e_approval_notification',
    sourceId: 'comp_human_approval',
    targetId: 'comp_notification',
    edgeType: 'data_flow',
    label: 'Approved sanction ticket',
    path: 'M 1440 325 V 350',
  },
  {
    id: 'e_approval_audit',
    sourceId: 'comp_human_approval',
    targetId: 'comp_audit_ledger',
    edgeType: 'audit_flow',
    label: 'Authorized state record',
    path: 'M 1500 325 V 490',
  },
  {
    id: 'e_audit_feedback',
    sourceId: 'comp_audit_ledger',
    targetId: 'node_feedback_reingest',
    edgeType: 'audit_flow',
    label: 'SHA-256 verified trail',
    path: 'M 1440 595 V 615',
  },

  // 9. Closed-Loop Feedback Path: Ground Truth -> Ingestion
  {
    id: 'e_feedback_loop',
    sourceId: 'node_feedback_reingest',
    targetId: 'comp_ingest_norm',
    edgeType: 'feedback_loop',
    label: 'Field corrections & recalibration loop',
    path: 'M 1320 665 H 335 V 205 H 370',
  },
];
