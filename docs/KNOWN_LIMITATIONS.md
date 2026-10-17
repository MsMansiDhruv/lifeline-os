# LIFELINE OS — KNOWN LIMITATIONS AND ENGINEERING ASSUMPTIONS

## 1. Hydrological & River Stage Limitations
1. **Rating Curves & Bathymetry**: Live volumetric discharge ($Q$) from Copernicus GloFAS is available globally at 0.05-degree resolution. However, converting volumetric discharge directly into absolute gauge water level (meters above danger level) requires a cross-sectional bathymetric rating curve. Where site-specific Central Water Commission (CWC) stage-discharge rating tables are unavailable, Lifeline OS explicitly flags water levels as `UNAVAILABLE` rather than extrapolating speculative water depths.
2. **Backwater & Embankment Breach Dynamics**: 2D hydrodynamic flow routing (such as HEC-RAS or Delft3D) requires high-performance computing clusters. Lifeline OS currently uses 1D kinematic flood extents derived from satellite-validated flood masks (Copernicus EMS / GEE Sentinel-1 SAR).

---

## 2. Telecommunications & Geocoding Constraints
1. **Nominatim Usage Limits**: OpenStreetMap Nominatim enforces a strict rate limit of 1 request per second. Lifeline OS implements client-side debouncing, request cancellation via `AbortController`, and in-memory LRU caching to remain compliant. For enterprise high-throughput deployments, a self-hosted Nominatim or Pelias instance is recommended.
2. **Live Two-Way Smartphone Hardware**: Physical smartphone push alerts utilize the open public `ntfy.sh` server. In an active war zone or complete telecommunications blackout, tactical ad-hoc mesh radios (e.g. Meshtastic / LoRa 868MHz) should be used as secondary physical transports.

---

## 3. Assumptions in Population Estimation
1. **Rural Density Factor**: The multiplier of 4.8 residents per structure footprint reflects eastern Indian rural household indices (Census of India). Urban centers or high-rise municipal areas require adjusted building-height multipliers ($N_{\text{floors}} \times 3.2$).
