# LIFELINE OS — DATA DICTIONARY

This dictionary defines all canonical domain entities, fields, units of measurement, valid ranges, and allowed enum values.

---

## 1. Evidence Types (`src/types/evidence.ts`)

### `DataAvailabilityState`
- **`LIVE`**: Value fetched from active upstream API within acceptable freshness SLA (<15 minutes).
- **`STALE`**: Value fetched successfully previously, but older than freshness SLA.
- **`PARTIAL`**: Incomplete geographic or feature coverage returned.
- **`UNAVAILABLE`**: Upstream service unreachable or physical sensor absent.
- **`SIMULATED`**: Synthetic value injected for testing or command-room simulation exercises.
- **`REJECTED`**: Value failed schema or plausibility validation checks.

### `RouteClassification`
- **`REAL_ROUTED`**: True road network path calculated via OSRM over OpenStreetMap topological ways.
- **`GRAPH_COMPUTED`**: Shortest-path routing over custom EOC road graph.
- **`SCENARIO_ROUTED`**: Historical corridor geometry verified against satellite imagery.
- **`SYNTHETIC_VISUAL`**: Interpolated polyline for visual orientation.
- **`NO_ROUTE`**: Verified topological disconnection (severed breach, impassable water gap).
- **`ROUTE_UNKNOWN`**: Network routing calculation pending or failed.

---

## 2. Telemetry & Hydrology Metrics

| Field | Type | Unit | Range / Constraints | Definition |
| :--- | :--- | :--- | :--- | :--- |
| `temperature_2m` | `number` | °Celsius (°C) | -50.0 to +60.0 | Ambient surface air temperature at 2 meters elevation. |
| `wind_speed_10m` | `number` | km/h | 0.0 to 250.0 | Wind velocity at 10 meters elevation. Drones ground if > 45 km/h. |
| `precipitation` | `number` | mm/hour | 0.0 to 300.0 | Instantaneous liquid precipitation equivalent rate. |
| `dischargeM3s` | `number` | $\text{m}^3/\text{s}$ | 0 to 100,000 | River volumetric flow rate from Copernicus GloFAS. |
| `surfaceVelocityMs`| `number`| m/s | 0.0 to 15.0 | Computed surface water velocity: $v = \sqrt{Q} \times 0.062 + 0.3$. |
| `spoilageHoursRemaining` | `number` | Hours | 1.0 to 48.0 | Cold-chain life: $(8 - 4) / (0.04 \times (T - 4))$. |

---

## 3. Disaster Infrastructure & Bottleneck Entities

| Field | Type | Definition |
| :--- | :--- | :--- |
| `id` | `string` | Unique alphanumeric corridor identifier (e.g., `jt_road`, `harinagar`). |
| `name` | `string` | Full human-readable name of road corridor or causeway. |
| `lat`, `lon` | `number` | WGS84 EPSG:4326 decimal coordinates of the primary breach or washout point. |
| `exposed_meters` | `number` | Linear gap distance (meters) of severed roadway under water. |
| `detour_km` | `number` | Distance penalty for vehicles navigating surrounding unflooded roads. |
| `trapped_villages_count` | `number` | Count of administrative revenue villages isolated by this breach. |
| `nearest_hospital_id` | `string` | Foreign key referencing destination referral hospital. |
| `baseline_travel_mins` | `number` | Normal dry-season vehicle transit time to referral hospital (minutes). |
| `detour_travel_mins` | `number` | Transit time to referral hospital when primary corridor is severed (minutes). |

---

## 4. Multi-Tool Resource Catalog & Constraints

| Asset Tool | ID | Unit Cost (INR) | Deployment Lead Time | Physical Constraint Rule |
| :--- | :--- | :--- | :--- | :--- |
| **Modular Bailey Bridge** | `bridge` | ₹1,80,00,000 (₹1.8 Cr) | 72 hours | Requires 16-Tonne heavy crane access on dry roadhead. |
| **Mobile Medical Unit (MMU)**| `booth` | ₹25,00,000 (₹25 Lakh) | 6 hours | Must be positioned on dry roadhead >500m from flood margin. |
| **Heavy Medical Drone** | `drone` | ₹12,00,000 (₹12 Lakh) | 45 minutes | Automatically grounded if live wind speed > 45 km/h. |
| **NDRF Rescue Boat (40HP)** | `boat` | ₹6,50,000 (₹6.5 Lakh) | 3 hours | Grounded if river surface velocity > 3.5 m/s or during night operations. |
