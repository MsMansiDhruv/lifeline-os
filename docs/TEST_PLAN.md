# LIFELINE OS — TEST PLAN & VERIFICATION MATRIX

## 1. Scope & Execution Strategy
The Lifeline OS test suite validates both deterministic computational logic and asynchronous external integrations.
Execution is managed via:
```bash
npm test        # Runs tsx test/runTests.ts
npm run lint    # Runs tsc --noEmit
npm run build   # Runs vite build (production distribution)
```

---

## 2. Test Execution Matrix

| Test ID | Test Category | Target Component | Description / Assertion | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Physical Mechanics | `EcosystemServiceBus` | Med-Drone permitted at 30.0 km/h wind | **PASSED** |
| **TC-02** | Physical Mechanics | `EcosystemServiceBus` | Med-Drone grounded when wind exceeds 45.0 km/h | **PASSED** |
| **TC-03** | Physical Mechanics | `EcosystemServiceBus` | Grounding lock reason message explicitly populated | **PASSED** |
| **TC-04** | Hydrology | `EcosystemServiceBus` | NDRF Boat viable at normal river discharge ($1000\text{ m}^3/\text{s}$) | **PASSED** |
| **TC-05** | Hydrology | `EcosystemServiceBus` | NDRF Boat locked when surface velocity $> 3.5\text{ m/s}$ ($3500\text{ m}^3/\text{s}$) | **PASSED** |
| **TC-06** | Hydrology | `EcosystemServiceBus` | Capsize hazard warning attached to boat lock state | **PASSED** |
| **TC-07** | Thermal Physics | `EcosystemServiceBus` | Biological cold-chain decay correctly calculates 3.3h at 34°C ambient | **PASSED** |
| **TC-08** | Population Calculus | Evidence Models | OSM 3,150 structures $\times$ 4.8 density yields exactly 15,120 citizens | **PASSED** |
| **TC-09** | Evidence Integrity | `src/types/evidence.ts` | DataAvailabilityState recognizes canonical `UNAVAILABLE` state | **PASSED** |
| **TC-10** | Evidence Integrity | `src/types/evidence.ts` | DataAvailabilityState recognizes canonical `LIVE` state | **PASSED** |
| **TC-11** | Route Topology | `src/types/evidence.ts` | RouteClassification recognizes `REAL_ROUTED` | **PASSED** |
| **TC-12** | Route Topology | `src/types/evidence.ts` | RouteClassification recognizes `NO_ROUTE` | **PASSED** |
| **TC-13** | Interoperability | `governmentInteroperabilityService` | CAP v1.2 XML conforms to OASIS namespace and schema | **PASSED** |
| **TC-14** | Interoperability | `governmentInteroperabilityService` | CAP alert includes geospatial bounding circle and areaDesc | **PASSED** |
| **TC-15** | Interoperability | `governmentInteroperabilityService` | Emergency GeoJSON conforms to RFC 7946 FeatureCollection | **PASSED** |
| **TC-16** | Geocoding | `geocodingService` | Direct coordinate parser extracts raw lat, lon coordinates | **PASSED** |
| **TC-17** | Spatial Isolation | `geocodingService` | Unknown queries return proper LocationAnalysisState without data pollution | **PASSED** |

---

## 3. End-to-End System Health Verification
- **HTTP Endpoint**: `GET http://localhost:3000/api/health`
  - Expected: `200 OK`, `{"status": "ok", "timestamp": "...", "aiReady": true}`
  - Verified: Executed and passing.
- **Production Build**: `vite build`
  - Expected: 0 TypeScript errors, bundle assets generated in `dist/`.
  - Verified: Executed and passing in 3.62s.
