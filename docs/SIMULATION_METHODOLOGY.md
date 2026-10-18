# LIFELINE OS — SIMULATION METHODOLOGY & MATHEMATICAL FORMULATIONS

This document details the scientific and engineering formulas used across Lifeline OS for physical asset constraint checking, hydrological kinematics, clinical surge balancing, and geospatial population estimation.

---

## 1. Hydrological Surface Velocity Approximation
In the absence of local bathymetric acoustic Doppler current profiler (ADCP) measurements, surface river velocity $v$ (in $\text{m/s}$) is derived from Copernicus GloFAS volumetric discharge $Q$ (in $\text{m}^3/\text{s}$) using a Manning's semi-empirical power relationship calibrated for alluvial plains:

$$v = \sqrt{Q} \times 0.062 + 0.3$$

### Boundary Limits:
- For $Q = 1,420\text{ m}^3/\text{s}$:
  $$v = \sqrt{1420} \times 0.062 + 0.3 \approx 37.68 \times 0.062 + 0.3 \approx 2.34 + 0.3 = 2.64\text{ m/s}$$
  *Result: Boat viable ($v \le 3.5\text{ m/s}$).*
- For $Q = 3,500\text{ m}^3/\text{s}$:
  $$v = \sqrt{3500} \times 0.062 + 0.3 \approx 59.16 \times 0.062 + 0.3 \approx 3.67 + 0.3 = 3.97\text{ m/s}$$
  *Result: Capsize hazard ($v > 3.5\text{ m/s}$). NDRF Zodiac boat locked.*

---

## 2. Biological Cold-Chain Thermal Decay
Critical cold-chain medical supplies (such as ASV antivenom, rabies immunoglobulins, and insulin) stored inside forward passive insulated transport containers experience thermal degradation according to Newton’s law of cooling and enzymatic denaturation curves:

$$\text{spoilageHoursRemaining} = \max\left(1.2, \frac{8 - 4}{0.04 \times (T_{\text{ambient}} - 4)}\right)$$

Where:
- $T_{\text{ambient}}$ is the live 2-meter air temperature (°C) retrieved from Open-Meteo.
- At $T = 28.4^\circ\text{C}$:
  $$\text{thermalFactor} = 0.04 \times (28.4 - 4) = 0.04 \times 24.4 = 0.976$$
  $$\text{spoilageHoursRemaining} = \frac{4}{0.976} \approx 4.1\text{ hours}$$
- At $T = 34^\circ\text{C}$:
  $$\text{thermalFactor} = 0.04 \times 30 = 1.20$$
  $$\text{spoilageHoursRemaining} = \frac{4}{1.20} \approx 3.3\text{ hours}$$

---

## 3. OSM Building Footprint Population Calculus
Rather than applying arbitrary population figures, Lifeline OS computes isolated population $P_{\text{isolated}}$ from OpenStreetMap polygon building footprints:

$$P_{\text{isolated}} = N_{\text{structures}} \times \mu_{\text{density}}$$

Where:
- $N_{\text{structures}}$ is the total number of verified building outlines within the polygon catchment.
- $\mu_{\text{density}} = 4.8$ persons per rural dwelling structure (calibrated against Census of India rural household indices for northeastern alluvial riverine floodplains).
- For JT Road Corridor ($N = 3,150$ structures):
  $$P_{\text{isolated}} = 3,150 \times 4.8 = 15,120\text{ citizens}$$

---

## 4. 4-Tier START Clinical Risk Stratification
Trapped rural populations cut off from district headquarters are partitioned according to NDMA clinical emergency standards:
1. **Red Tier (Immediate, $<1\text{h}$)**: 2.5% of cohort. Active hemorrhages, severe trauma, snakebites, acute coronary syndromes. Requires immediate airbridge or surgical corridor.
2. **Amber Tier (Urgent, $<24\text{h}$)**: 8.5% of cohort. Renal hemodialysis dependency, insulin-dependent diabetes, severe COPD. Requires boat evacuation or forward stabilization clinic within 24 hours.
3. **Yellow Tier (Vulnerable)**: 22.0% of cohort. Geriatric citizens ($>65$), infants under 2 years, pregnant women in third trimester.
4. **Green Tier (Displaced)**: 67.0% of cohort. Ambulatory uninjured displaced population requiring potable WASH and dry food rations (5.5 kg/person/week).

---

## 5. Topological Road Network Percolation & Cut-Edge Detection
During monsoon surges, inundation severances do not occur uniformly. Rather, the road network undergoes topological percolation breakdown where critical arterial links are severed, dividing the connected component into isolated sub-graphs.

### Mathematical Definition:
Let the transportation infrastructure be modeled as a directed, weighted graph $G = (V, E, W)$, where $V$ represents 31,214 road intersections and settlement centroids, $E$ represents 69,663 directed road segments, and $W: E \to \mathbb{R}^+$ denotes segment transit travel time (derived from length and road classification speed limits in UTM Zone 46N).

Let $\mathcal{P}_{\text{flood}} \subset \mathbb{R}^2$ be the polygonal flood extent mask vectorized from Copernicus Sentinel-1 SAR (10m VV/VH backscatter thresholded via Otsu's method at $-14.2\text{ dB}$).

The severed edge set $E_{\text{cut}} \subset E$ is computed by geometric line intersection:
$$E_{\text{cut}} = \{e \in E \mid \text{Intersects}(e, \mathcal{P}_{\text{flood}}) = \text{true}\}$$

In the Cachar District benchmark (June 2022 event), $|E_{\text{cut}}| = 1,830$ severed edges. The active operational graph becomes:
$$G' = (V, E \setminus E_{\text{cut}}, W)$$

---

## 6. Dynamic Dijkstra Healthcare Routing & Golden Hour Isochrones
For every settlement $s_i \in S$ (where $|S| = 319$ analyzed settlements in Cachar), the system calculates travel time $T(s_i, h_j)$ to the nearest functioning Block Primary Health Center (BPHC) or Apex Hospital $h_j \in H$:

$$T(s_i, H) = \min_{h_j \in H} \text{Dijkstra}(G', s_i, h_j)$$

### Golden Hour Isochrone Threshold:
Clinical survivability for Red-tier patients collapses when transfer time exceeds 60 minutes:
$$\text{Status}(s_i) = \begin{cases} 
\text{REACHABLE} & \text{if } T(s_i, H) \le 60\text{ min} \\
\text{DELAYED\_REROUTED} & \text{if } 60\text{ min} < T(s_i, H) < \infty \\
\text{MODEL\_ISOLATED} & \text{if } T(s_i, H) = \infty \text{ (no traversable path)}
\end{cases}$$

In baseline conditions, all 319 settlements are reachable within 48 minutes. Under peak flood severance, 42 settlements (14,000 citizens) are classified as `MODEL_ISOLATED` ($T = \infty$), and 41 settlements experience severe overland detour delays.

---

## 7. Pre-Positioning Facility Location via $k$-Medoids on High-Elevation Dry Nodes
When road connectivity is severed, relief must be dispatched via waterborne rescue boats (NDRF/SDRF 40HP Zodiacs) or mobile clinical vans. Staging pads cannot be stationed inside flooded zones or arbitrary coordinates; they must be physically positioned on accessible, non-flooded, high-elevation road nodes adjacent to cut-off clusters.

### Objective Function:
Given isolated population clusters $C = \{c_1, c_2, \dots, c_m\}$ with population weights $w(c_i)$, find $k$ staging hub locations $M = \{m_1, \dots, m_k\} \subset V_{\text{dry}}$ that minimize total weighted transit distance:

$$\min_{M \subset V_{\text{dry}}, |M|=k} \sum_{i=1}^{m} w(c_i) \min_{j=1}^{k} d(c_i, m_j)$$

Subject to physical feasibility constraints:
1. **Dry Node Constraint**: $m_j \notin \mathcal{P}_{\text{flood}}$
2. **Elevation Constraint**: $\text{Elevation}(m_j) \ge Z_{\text{crest}} + 1.5\text{m}$ (where $Z_{\text{crest}}$ is the local peak flood stage derived from SRTM 90m DEM).
3. **Roadhead Approach**: $m_j$ must remain connected to the district arterial supply spine.

---

## 8. Micro-Intervention ROI Engine (The Engineering Fix)
An operations commander or district magistrate has resources to deploy only one modular temporary bridge (e.g., 40-meter Class-40 Bailey bridge or pontoon crossing). Where does it go?

Lifeline OS evaluates all candidate severed links $e \in E_{\text{cut}}$ and simulates their individual restoration $G'_e = (V, (E \setminus E_{\text{cut}}) \cup \{e\}, W)$. It ranks each candidate edge by accessibility return on investment:

$$\text{ROI}(e) = \frac{\text{Reconnected Population}(e) + \sum_{s \in S} \Delta \text{km saved}(e, s)}{\text{Span Length}(e)}$$

Where:
- $\text{Reconnected Population}(e)$: Number of citizens in settlements whose status transitions from `MODEL_ISOLATED` back to `REACHABLE` upon restoring edge $e$.
- $\sum \Delta \text{km saved}(e, s)$: Total cumulative distance saved across all rerouted ambulance and supply trips compared to long overland detours:
  $$\Delta \text{km saved}(e, s) = \max\left(0, \text{Dist}_{G'}(s, H) - \text{Dist}_{G'_e}(s, H)\right)$$
- $\text{Span Length}(e)$: Physical breach gap in meters (e.g., 80m for JT Road Sadarghat feeder vs 45m for Sonabarighat feeder).

### Operational Significance:
This formulation prevents intuitive misallocation. Deploying a bridge across a small 30m breach serving 200 citizens produces a low ROI, whereas restoring the 80m JT Road breach reconnects 14,000 citizens and eliminates 47 minutes of detour delay, yielding the highest accessibility ROI across the entire Barak River basin.

---

## 9. Heavy Axle Bridgehead Pruning & Structural Limits
To prevent emergency vehicle collapse on compromised rural infrastructure:
- **Feeder Bridge Width Constraint**: Bridges with lane width $< 3.5\text{m}$ are automatically pruned for heavy supply trucks ($>16\text{ Tonnes}$ gross vehicle weight).
- **Crane Access Requirement**: Modular Bailey bridges require a 16-Tonne mobile crane and a stable, dry approach roadhead. If the access corridor leading to the bridgehead is submerged $>0.3\text{m}$, the bridge deployment is flagged as `INFEASIBLE_APPROACH_FLOODED`.
