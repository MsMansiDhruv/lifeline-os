export type FleetMode = 'Light Emergency (Ambulance/4x4)' | 'Heavy Supply (Truck/Bus)';

export type SettlementStatus = 'MODEL_ISOLATED' | 'REROUTED_ALT_FACILITY' | 'REACHABLE_SAME_FACILITY';

export interface SettlementRecord {
  village_id: number;
  village_name: string;
  lat: number;
  lon: number;
  v_node: number;
  snap_distance_m: number;
  baseline_nearest_node: number;
  scenario_nearest_node: number | null;
  baseline_facility_name: string;
  scenario_facility_name: string;
  baseline_km: number;
  scenario_km: number | null;
  additional_km: number | null;
  baseline_min: number;
  scenario_min: number | null;
  additional_min: number | null;
  detour_ratio: number | null;
  destination_altered: boolean;
  is_coincident_base: boolean;
  modeled_status: SettlementStatus;
}

export interface CriticalEdgeRecord {
  corridor_id: string;
  road_name: string;
  serving_settlement: string;
  segments_count: number;
  critical_spans_count: number;
  exposed_meters: number;
  highway_type: string;
  total_length_m: number;
  lat: number;
  lon: number;
  isolated_villages_count: number;
  heavy_isolated_villages_count: number;
  dissolved_badge: string;
  recommended_engineering_intervention: string;
  action_tier: 'CRITICAL_BOTTLENECK' | 'HIGH_VULNERABILITY' | 'MODERATE_RISK';
}

export interface StagingHubRecord {
  hub_id: number;
  hub_name: string;
  nearest_roadhead: string;
  lat: number;
  lon: number;
  node: number;
  assigned_settlements_count: number;
  assigned_villages_str: string;
  avg_boat_transit_km: number;
  max_boat_transit_km: number;
  est_boat_transit_min: number;
  recommended_relief_assets: string;
  hub_tier: string;
}

export interface BridgeInterventionRecord {
  rank: number;
  u: number;
  v: number;
  lat: number;
  lon: number;
  road_name: string;
  span_length_m: number;
  reconnected_villages_count: number;
  reconnected_villages_str: string;
  reconnected_population: number;
  km_saved: number;
  roi_score: number;
  intervention_type: string;
  recommended_structure: string;
  est_install_hrs: number;
}

export interface DiagnosticsRecord {
  pruned_bridges: number;
  valid_settlements: number;
  total_settlements: number;
  fleet_mode: FleetMode;
  critical_cut_edges_count: number;
  articulation_bridges: number;
  max_cut_settlements: number;
  isolated_villages_count: number;
  axle_pruned_edges: number;
  average_detour_km: number;
  max_villages_cut_by_single_road: number;
  optimal_staging_hubs_count: number;
  bridge_interventions_count: number;
  max_bridge_roi: number;
}
