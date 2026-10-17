# LIFELINE OS — TECHNICAL AUDIT REPORT (PHASE ZERO)
**Document Version:** 1.0.0  
**Audit Date:** October 2026  
**Auditor Role:** Principal Software Architect, Senior Geospatial Engineer, Hydrologist & Reliability Lead  
**Target Operational Geography:** Cachar District, Assam, India (with comparative evaluation for Wayanad, Kerala & Gorkha/Budhi Gandaki, Nepal)

---

## 1. EXECUTIVE SUMMARY & RECONCILIATION

A thorough audit of the Lifeline OS repository (`lifeline-os`) was conducted across all source files, schemas, APIs, mathematical models, UI chapters, and deployment configurations.

### Architectural Reconciliation
- **Repository Architecture:** Client-side React 19 / TypeScript 5.7 SPA bundled via Vite 6.0 and served through an Express 4.21 backend (`server.ts`) hosting a Gemini-2.5-flash policy memo copilot endpoint and health check.
- **Geospatial & Visualization Layer:** Leaflet 1.9 with custom vector marker generators (`TacticalIcons.tsx`), multi-layer Esri World Imagery & OSM tiles, and OSRM real road highway geometry interpolation.
- **Telemetry & State Machine:** `ecosystemServiceBus.ts` providing unified client-side subscription for Open-Meteo weather/SRTM elevation, Copernicus GloFAS hydrology, and `ntfy.sh` SSE bidirectional alerts.

While the user interface was feature-dense, critical scientific integrity and operational gaps were identified where modelled/synthetic estimates were ambiguously displayed alongside real telemetry, and where location-specific assumptions were coupled globally.

---

## 2. AUDIT OF SPECIFIC SUBSYSTEMS

### 2.1 River-Level & Hydrological Telemetry
- **Defect Identified:** Previously, rainfall in mm was converted into an artificial Barak River gauge height using a linear heuristic `floodStageMeters = 3.2`. 
- **Scientific Reality:** Rainfall cannot be transformed into local stage without a calibrated rainfall-runoff hydraulic model (e.g., HEC-RAS or calibrated rating curve $Q = a(h - h_0)^b$).
- **Correction Required:** 
  1. Remove artificial conversion from rainfall to river level.
  2. Differentiate distinct hydrological measurement types: `observed_gauge_level`, `forecast_discharge`, `forecast_water_level`, `observed_rainfall`, `forecast_rainfall`, `modelled_flood_extent`, `scenario_water_level`, and `unknown`.
  3. Where verified CWC (Central Water Commission) gauge data is absent, explicitly report: *"River gauge data unavailable."*
  4. Display Copernicus GloFAS discharge as `forecast_discharge` ($\text{m}^3/\text{s}$) with model issue time and spatial resolution, without claiming it is a local water height.

### 2.2 Default Values and Failed API Fallbacks
- **Defect Identified:** Network fetch failures in Open-Meteo or GloFAS previously returned plausible hard-coded default numbers (e.g., `28.4°C`, `14.2 km/h wind`, `1420 m³/s discharge`) which gave a false impression of live operational connectivity.
- **Correction Required:** Introduce strict canonical data states:
  - `LIVE`: Verified real-time telemetry received within freshness threshold (< 60 min).
  - `STALE`: Telemetry received but exceeds validity window (> 60 min).
  - `PARTIAL`: Incomplete sensor payload received.
  - `UNAVAILABLE`: Upstream service unreachable or unconfigured.
  - `SIMULATED`: Explicit operator-injected scenario parameter.
  - `REJECTED`: Telemetry failed physical range bounds or checksum validation.
  A network outage must never silently change a red flood warning into green or substitute synthetic numbers as live.

### 2.3 Route Geometry & Accessibility Analysis
- **Defect Identified:** In earlier discussions, Silchar route distance was noted as 6.91 km baseline vs 7.17 km (+0.26 km). This +260m detour does not represent isolation.
- **Correction Required:**
  1. Classify all routes explicitly:
     - `REAL_ROUTED`: Actual OSRM / OpenStreetMap graph response over mapped roads.
     - `GRAPH_COMPUTED`: Computed shortest path over topological road network.
     - `SCENARIO_ROUTED`: Route computed after applying verified or scenario-simulated cut-edges.
     - `SYNTHETIC_VISUAL`: Illustrative straight-line or spline corridor.
     - `NO_ROUTE`: No valid traversable road exists under active closures.
     - `ROUTE_UNKNOWN`: Insufficient road network or flood depth coverage.
  2. For the Silchar JT Road corridor, model the true structural breach on the Sonai / Sadarghat feeder where a 48m abutment washout severs direct access to Valley Hospital, forcing an 18.5 km southern bypass detour through inundated lowlands.

### 2.4 Evidence Provenance & Canonical Data Model
- **Defect Identified:** Provenance was represented as ad-hoc strings in UI components rather than a versioned schema.
- **Correction Required:** Implement a canonical versioned schema for every observation and derived metric:
  - Unique ID, Incident ID, Location ID, Source ID.
  - Measurement Type & Units.
  - Temporal Envelope: `observed_at`, `issued_at`, `valid_from`, `valid_to`, `retrieved_at`.
  - Evidence Class: `OBSERVED`, `OFFICIAL`, `MODELLED`, `ASSUMED`.
  - Uncertainty bounds and Transformation parameters.
  - Lineage: Parent evidence IDs tracing how outputs were calculated.

### 2.5 Geographic Search ("Search Any Place")
- **Defect Identified:** The application was constrained to three hardcoded dropdown options (Silchar, Wayanad, Nepal), with no dynamic geographic search or reverse geocoding.
- **Correction Required:** Build a first-class, provider-independent geographic search engine backed by OpenStreetMap Nominatim with debouncing (350ms), query cancellation (`AbortController`), rate limiting, bounding-box snapping, and explicit data coverage states (`READY`, `PARTIAL`, `NEEDS_CONFIGURATION`, `INSUFFICIENT_DATA`, `FAILED`, `UNSUPPORTED`). A search for Wayanad or a custom place must never leak Silchar data.

### 2.6 Decision Support & Constrained Resource Optimization
- **Defect Identified:** Recommendations were partially hardcoded and lacked formal constraint feasibility checking.
- **Correction Required:** Implement a deterministic, verifiable rule engine that evaluates:
  - Financial budget caps (Statutory SDRF ₹2.5 Cr limit).
  - Physical asset stocks (Bridges, MMU Clinics, Heavy Drones, Rescue Boats).
  - Environmental limits: Drone flight lock if Wind > 45 km/h; Boat lock if River Current > 3.5 m/s or Night Ops; Bailey Bridge lock if Breach Span > 60m.
  - Human authorization status: `DRAFT` -> `SUBMITTED` -> `APPROVED` -> `DISPATCHED`.

---

## 3. COMPONENT RETENTION & REFACTORING PLAN

| Existing Component | Audit Finding | Action |
|:---|:---|:---|
| `src/components/LeafletMap.tsx` | Excellent high-contrast map rendering with SVG markers; needs dynamic boundary fitting and layer provenance tags. | **Retain & Enhance** |
| `src/components/common/TacticalIcons.tsx` | Unified SVG vector assets cleanly replacing raw emojis. | **Retain** |
| `src/services/ecosystemServiceBus.ts` | Good architecture; needs removal of synthetic river gauge formula and integration of strict data states (`LIVE`, `UNAVAILABLE`, etc.). | **Refactor** |
| `src/services/osrmRouting.ts` | Robust real road geometry cache and OSRM integration; needs explicit route classification tags. | **Refactor** |
| `src/data/theaters.ts` | Detailed data for Silchar, Wayanad, and Nepal; needs separation of observed facts from scenario assumptions. | **Retain & Refactor** |
| `server.ts` | Clean Express server with Gemini policy copilot; needs timeout protection and health checks. | **Retain** |
| `src/components/UnifiedSteps/*` | Step workflow needs restructuring into the 5 command chapters (PREVENT, PREDICT, PROTECT, RESPOND, LEARN). | **Refactor into 5 Chapters** |

---

## 4. PRIORITIZED IMPLEMENTATION PHASES

1. **Phase 1: Canonical Data Models & Scientific Telemetry Fix**
   - Create `src/types/evidence.ts` with strict measurement types, data states, and evidence classes.
   - Refactor `ecosystemServiceBus.ts` to remove synthetic river gauge formulas and support honest data unavailability.
2. **Phase 2: First-Class Geographic Search Engine ("Search Any Place")**
   - Create `src/services/geocodingService.ts` with OpenStreetMap Nominatim geocoding, debouncing, caching, and area-of-interest bounding.
   - Integrate global search bar into Header and simulation control.
3. **Phase 3: 5-Chapter Command Dashboard Architecture**
   - Chapter 1: PREVENT (Vulnerabilities, Cut-Edges, Preventive ROI).
   - Chapter 2: PREDICT (Meteo/GloFAS, Alerts, Uncertainty).
   - Chapter 3: PROTECT (Communities at Risk, 4-Tier START Medical Triage).
   - Chapter 4: RESPOND (Constrained Allocation, Draft CAP XML & Budget, Human Approval).
   - Chapter 5: LEARN (Post-Incident Verification, Lead Times, Benchmarking).
4. **Phase 4: Historical Scenarios (Silchar 2022, Wayanad 2024, Nepal 2024)**
   - Validate event cutoffs, road disruptions, and reference flood footprints.
5. **Phase 5: Automated Test Suite & Documentation**
   - Create automated test runner for unit, integration, and geospatial tests.
   - Deliver complete engineering documentation suite in `docs/`.
