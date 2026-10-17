# LIFELINE OS — PROVENANCE AND CONFIDENCE FRAMEWORK

## 1. Scientific Integrity Policy
Lifeline OS adheres to the zero-fabrication principle:
- **No operationally important number without provenance**: Every number displayed to an incident commander or decision-maker must state whether it is observed, official, modelled, or assumed.
- **No forecast without context**: All forecasts state target period, issue timestamp, lead time, and underlying weather model.
- **No model presented as observation**: Rainfall rate is never converted to a river gauge height without an explicit rating curve and hydro-dynamic model.

---

## 2. Confidence Tier Classification
Each operational metric is scored across 4 confidence levels:

| Confidence Tier | Description | Typical Sources | Visual Indicator |
| :--- | :--- | :--- | :--- |
| **Tier 1 (High)** | Verified direct empirical observation or official government gazette data. | CWC telemetric gauges, IMD automatic weather stations, official census gazette. | Solid Green Badge (`CONFIDENCE: HIGH (TIER 1)`) |
| **Tier 2 (Moderate)** | High-resolution validated physics or numerical weather prediction model. | Open-Meteo GFS/ECMWF 10m wind, Copernicus GloFAS discharge, OSRM road graph. | Solid Blue Badge (`CONFIDENCE: MODERATE (TIER 2)`) |
| **Tier 3 (Low)** | Statistical downscaling, proxy extrapolation, or uncalibrated satellite inference. | OSM building footprint density extrapolation ($4.8 \times \text{structures}$), Manning's empirical velocity formula. | Amber Badge (`CONFIDENCE: ESTIMATED (TIER 3)`) |
| **Tier 4 (Unverified)**| Operator override, synthetic scenario input, or offline heuristic. | Command-room simulation toggle (e.g. 52 km/h wind override). | Striped Purple Badge (`CONFIDENCE: SIMULATED (TIER 4)`) |

---

## 3. Provenance Envelope Schema
Every evidence item transmitted across Lifeline OS is wrapped in a `CanonicalEvidenceRecord<T>`:
```typescript
interface CanonicalEvidenceRecord<T> {
  id: string;
  metricName: string;
  value: T;
  unit: string;
  evidenceClass: 'OBSERVED' | 'OFFICIAL' | 'MODELLED' | 'ASSUMED';
  dataState: 'LIVE' | 'STALE' | 'PARTIAL' | 'UNAVAILABLE' | 'SIMULATED' | 'REJECTED';
  sourceName: string;
  sourceUrl?: string;
  retrievalTimestamp: string;
  validUntilTimestamp?: string;
  confidenceScore: number; // 0.0 to 1.0
  confidenceTier: 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4';
  methodologyNotes: string;
}
```

---

## 4. Handling Degraded Telecommunications & Missing Sensors
When an upstream API fails or is unreachable:
1. Lifeline OS **never** substitutes random realistic-looking data.
2. The UI explicitly states: `"River gauge data unavailable (No local CWC telemetric link)"`.
3. The state transition is logged in the immutable audit trail with an alert raised in the SEOC console.
