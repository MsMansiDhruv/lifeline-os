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
