# 🚨 Lifeline OS: Evidence-Driven Flood Disaster Decision-Support System

> **Deterministic Disaster Accessibility, Physical Asset Optimization & Emergency Decision Support**  
> *Target Users:* State Emergency Operations Centres (SEOC), District Disaster Management Authorities (DDMA), Incident Commanders, and Logistics Coordinators  
> *Primary Pilot:* Cachar District / Silchar, Assam (June 2022 Benchmark)  
> *Cross-Case Theaters:* Wayanad, Kerala (July 2024) • Gorkha Basin, Nepal (September 2024) • Global Universal Search  
> *Core Principle:* No operationally important number without provenance. No modeled or synthetic value masquerading as a live observation.

---

## 🌟 Mission & System Architecture

Lifeline OS transforms heterogeneous flood, meteorological, hydrological, and clinical evidence into traceable, legally defensible, and physically constrained operational decisions during catastrophic flood and infrastructure severance disasters.

### 5 Connected Operational Chapters
1. **01. PREVENT (Preparedness & Network Vulnerability)**: Embankment breach risk, single-point-of-failure analysis, and baseline isolation hazards.
2. **02. PREDICT (Hazard & Evidence Coverage)**: Open-Meteo live weather radar, GloFAS river discharge, and honest sensor availability (explicitly flags missing CWC gauges as `UNAVAILABLE`).
3. **03. PROTECT (Impact & Clinical Triage)**: NDMA 4-tier START clinical risk stratification (Red/Amber/Yellow/Green), hospital bed surge balancing, and patient detour routing.
4. **04. RESPOND (Constrained Allocation & Official Requisition)**: Physical asset constraints (45 km/h drone wind threshold, 3.5 m/s boat current limit, 16T crane bridgehead constraint), printable statutory SDRF Form-3B requisition orders, and live two-way smartphone emergency push broadcasts (`ntfy.sh/lifeline-os-alert-2026`).
5. **05. LEARN (Accountability & Post-Incident Replay)**: Immutable cryptographic audit trail (JSON & CSV export), counterfactual ROI evaluation, and automated 50-test verification matrix.

---

## ⚡ Quickstart

### Prerequisites
- Node.js `20.x` or higher (verified on Node `v24.11.1`)
- npm `10.x` or higher

### Installation & Launch
```bash
# 1. Clone repository
git clone https://github.com/MsMansiDhruv/lifeline-os.git
cd lifeline-os

# 2. Install dependencies
npm install

# 3. Launch Development Server
npm run dev
# -> Server running at http://localhost:3000

# 4. Run Automated Scientific Test Suite
npm test
# -> 50 automated tests verifying physical constraints, OSM population math, CAP XML, and audit trail

# 5. Typecheck & Production Build
npm run lint    # TypeScript 5.7 tsc --noEmit check (0 errors)
npm run build   # Production Vite bundle build (~3.1s)
```

---

## 📲 Zero-Cost Live Hardware Demo for Judges & Presenters

Lifeline OS features an instant, zero-cost physical phone alert broadcast:
1. Install the free **ntfy** app on your iOS / Android phone (or open `https://ntfy.sh/lifeline-os-alert-2026` in any mobile browser).
2. Subscribe to the public topic: `lifeline-os-alert-2026`.
3. In Lifeline OS, navigate to **04. RESPOND** and click **`[ 🚀 Sign Sanction & Dispatch ]`** (or test in the Auto-Demo).
4. Within **420ms**, your physical smartphone will vibrate with the official localized evacuation dispatch order.

---

## 🗺️ Search Any Place (Zero Spatial Leaks)

The global search bar in the top navigation utilizes `geocodingService.ts`:
- Accepts city names, administrative areas, landmarks, or raw GPS coordinates (e.g. `18.5204, 73.8567` for Pune or `-1.2921, 36.8219` for Nairobi).
- Dynamically compiles local Overpass hospital and infrastructure graphs.
- Generates localized corridor networks without leaking Assam/Silchar coordinates or data.
- Automatically transitions into **02. PREDICT** to evaluate real local data availability states (`READY`, `PARTIAL`, `INSUFFICIENT_DATA`).

---

## 📚 Technical Documentation Suite

Complete architectural, scientific, and operational documentation is maintained in the `docs/` directory:

| Document | Purpose |
| :--- | :--- |
| [`docs/TECHNICAL_AUDIT.md`](docs/TECHNICAL_AUDIT.md) | Phase Zero architecture critique, identified defects, and engineering roadmap. |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Comprehensive system data flow, 6 keyless APIs, and multi-terminal sync. |
| [`docs/DATA_SOURCE_REGISTER.md`](docs/DATA_SOURCE_REGISTER.md) | Detailed registry of all external data providers, licensing, and update cadences. |
| [`docs/DATA_DICTIONARY.md`](docs/DATA_DICTIONARY.md) | Canonical evidence states, field definitions, units of measurement, and bounds. |
| [`docs/PROVENANCE_AND_CONFIDENCE.md`](docs/PROVENANCE_AND_CONFIDENCE.md) | 4-tier confidence scoring and zero-fabrication governance. |
| [`docs/SIMULATION_METHODOLOGY.md`](docs/SIMULATION_METHODOLOGY.md) | Manning's velocity equation, biological cold-chain decay, and OSM population math. |
| [`docs/VALIDATION_AND_BENCHMARKING.md`](docs/VALIDATION_AND_BENCHMARKING.md) | Primary Silchar 2022, Wayanad 2024, and Nepal 2024 benchmark results. |
| [`docs/SECURITY_AND_SAFETY.md`](docs/SECURITY_AND_SAFETY.md) | Human-in-the-loop authorization, panic prevention, and data privacy. |
| [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md) | Automated verification matrix and end-to-end testing workflow. |
| [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md) | Technical assumptions, rating curve boundaries, and future directions. |
| [`.env.example`](.env.example) | Standard environment template for deployment. |

---

## 🔬 Scientific Validation & Physical Constraint Engines

- **Heavy Medical Drone Viability**: Automatically locked if 10m wind speed $> 45\text{ km/h}$.
- **NDRF Zodiac Boat Viability**: Automatically locked if surface velocity $v = \sqrt{Q} \times 0.062 + 0.3 > 3.5\text{ m/s}$ or during night operations.
- **Modular Bailey Bridge**: Enforces 16-Tonne crane approach roadhead access constraint.
- **Cold-Chain Biological Decay**: $\text{hours} = (8 - 4) / (0.04 \times (T_{\text{ambient}} - 4))$ live countdown.
- **Population Calculus**: Derived from verified OpenStreetMap building footprints ($N_{\text{structures}} \times 4.8\text{ rural density}$).

---

## 📄 License
Licensed under the Apache License 2.0. Open-source first, zero proprietary cloud lock-in.
