# LIFELINE OS — DATA SOURCE REGISTER

This register documents all live, cached, and scenario-based data sources used across Lifeline OS, including their provider, update frequency, latency characteristics, fallback behavior, and licensing.

| Identifier | Source Name | Provider / Authority | Access Protocol & URL | Update Cadence | Canonical Data State | Fallback Mode | License / Terms |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DS-01** | Open-Meteo Weather Forecast | Open-Meteo GmbH / ECMWF / DWD | `GET https://api.open-meteo.com/v1/forecast` | Hourly / 15-min intervals | `LIVE` / `STALE` | Degraded state flag; no synthetic spoofing | CC-BY 4.0 / Free for non-commercial & research |
| **DS-02** | Copernicus GloFAS Flood Discharge | European Commission / Copernicus EMS / Open-Meteo Flood API | `GET https://flood-api.open-meteo.com/v1/flood` | Daily | `LIVE` / `STALE` | Reports historical baseline discharge | Copernicus Open Access / Free Open Data |
| **DS-03** | SRTM Digital Elevation Model | NASA / USGS / Open-Meteo Elevation API | `GET https://api.open-meteo.com/v1/elevation` | Static 90m DEM | `LIVE` / `CACHED` | Pre-indexed district elevation cache | Public Domain |
| **DS-04** | OpenStreetMap Nominatim Geocoding | OpenStreetMap Foundation | `GET https://nominatim.openstreetmap.org/search` | Dynamic / Rate-limited (1 req/s) | `LIVE` | Matches against pre-verified historical theaters | ODbL 1.0 (Open Database License) |
| **DS-05** | OpenStreetMap Overpass Infrastructure | OpenStreetMap Community / FOSSGIS | `GET https://overpass-api.de/api/interpreter` | Dynamic Overpass QL | `LIVE` / `PARTIAL` | Deterministic baseline facility records | ODbL 1.0 |
| **DS-06** | OSRM Road Routing Engine | Project OSRM / OpenStreetMap | `GET https://router.project-osrm.org/route/v1/driving` | Dynamic graph routing | `REAL_ROUTED` | Scenario route graph / synthetic fallback flag | ODbL 1.0 |
| **DS-07** | ntfy.sh SSE Hardware Bridge | ntfy.sh (Philipp Heckel) | `GET https://ntfy.sh/{topic}/sse` | Real-time push (<500ms) | `LIVE` | In-memory simulated SOS injector | Apache 2.0 / Free Public Service |
| **DS-08** | Cachar Flood Baseline Manifest | Assam SDMA / Cachar DDMA 2022 Post-Disaster Need Assessment | Local verified static dataset (`src/data/theaters.ts`) | Historical Benchmark | `SCENARIO_ROUTED` | Static ground truth | Govt of Assam Open Report |
| **DS-09** | Wayanad Landslide Baseline Manifest | Kerala SDMA July 2024 Geological Report | Local verified static dataset (`src/data/theaters.ts`) | Historical Benchmark | `SCENARIO_ROUTED` | Static ground truth | Kerala SDMA Public Release |
| **DS-10** | Nepal Gorkha Basin Manifest | Nepal NDDRR / ICIMOD 2024 Flood Assessment | Local verified static dataset (`src/data/theaters.ts`) | Historical Benchmark | `SCENARIO_ROUTED` | Static ground truth | ICIMOD Open Access |

---

## Provenance Enforcement Policy
1. **No Spoofed Observations**: Live physical sensors (such as river stage gauges) are only reported as `LIVE` if an authenticated telemetric link exists. In the absence of a Central Water Commission (CWC) API feed, the system strictly marks river gauge levels as `UNAVAILABLE` rather than extrapolating water levels from GloFAS discharge without a site-specific rating curve.
2. **Explicit Uncertainty**: All forecasted values (wind speed, precipitation, discharge) display confidence intervals and age timestamps.
