// Standalone checks for telemetry-driven settlement classification (no React required).
import { DF_CLEAN, ASSAM_TELEMETRY_RESULTS } from '../src/data/disasterData';

let passed = 0, failed = 0;
function check(name: string, ok: boolean) {
  if (ok) { passed++; console.log(`  ✓ ${name}`); } else { failed++; console.log(`  ✗ ${name}`); }
}
const count = (s: string) => DF_CLEAN.filter((r) => r.modeled_status === s).length;

console.log('--- SETTLEMENT ACCESS (telemetry-driven) ---');
check('319 settlements analysed', DF_CLEAN.length === 319 && ASSAM_TELEMETRY_RESULTS.analysedCount === 319);
check('236 reachable (same facility)', count('REACHABLE_SAME_FACILITY') === 236);
check('41 rerouted (alternative facility)', count('REROUTED_ALT_FACILITY') === 41);
check('42 isolated (no modelled route)', count('MODEL_ISOLATED') === 42);
check('counts sum to analysed total', 236 + 41 + 42 === DF_CLEAN.length);
check('headline constants match the data', ASSAM_TELEMETRY_RESULTS.reachableCount === count('REACHABLE_SAME_FACILITY') && ASSAM_TELEMETRY_RESULTS.reroutedCount === count('REROUTED_ALT_FACILITY') && ASSAM_TELEMETRY_RESULTS.noRouteCount === count('MODEL_ISOLATED'));
check('every row has finite coordinates', DF_CLEAN.every((r) => Number.isFinite(r.lat) && Number.isFinite(r.lon)));
check('every row inside the Cachar bounding box', DF_CLEAN.every((r) => r.lat > 24.4 && r.lat < 25.3 && r.lon > 92.3 && r.lon < 93.4));
check('rerouted rows carry finite extra minutes', DF_CLEAN.filter((r) => r.modeled_status === 'REROUTED_ALT_FACILITY').every((r) => Number.isFinite(r.additional_min)));
console.log(`\nSettlement access: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
