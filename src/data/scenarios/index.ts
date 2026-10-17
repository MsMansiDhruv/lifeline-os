/**
 * LIFELINE OS — SCENARIO MANIFEST REGISTRY
 * 
 * Provides unified access to versioned scenario workspaces:
 * 1. Assam — Silchar & Cachar (June 2022 Riverine Flood & Healthcare Access)
 * 2. Nepal — Roshi Khola & BP Highway (Sep-Oct 2024 Flash Floods & Mountain Connectivity)
 */

import { ScenarioManifest, ScenarioId } from './types';
import { SILCHAR_SCENARIO } from './silcharScenario';
import { NEPAL_SCENARIO } from './nepalScenario';

export * from './types';
export * from './silcharScenario';
export * from './nepalScenario';

export const SCENARIO_MANIFESTS: Record<ScenarioId, ScenarioManifest> = {
  silchar: SILCHAR_SCENARIO,
  nepal: NEPAL_SCENARIO,
};

export function getScenarioManifest(scenarioId: string): ScenarioManifest {
  if (scenarioId === 'nepal') {
    return NEPAL_SCENARIO;
  }
  return SILCHAR_SCENARIO;
}

export function getAllScenarioManifests(): ScenarioManifest[] {
  return [SILCHAR_SCENARIO, NEPAL_SCENARIO];
}
