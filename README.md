# 🚨 Lifeline OS: Evidence-Driven Flood Disaster Decision-Support System

<div align="center">

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![TypeScript 5.7](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](tsconfig.json)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](package.json)
[![Google Cloud Run](https://img.shields.io/badge/Google_Cloud-Cloud_Run-4285F4?logo=googlecloud&logoColor=white)](cloudbuild.yaml)
[![Vite 6](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](vite.config.ts)
[![Tests Passing](https://img.shields.io/badge/Tests-235_Passing-10B981?logo=checkmarx&logoColor=white)](test/runTests.ts)
[![Status: Production Ready](https://img.shields.io/badge/Status-Production_Ready-emerald.svg)](https://lifeline-os.ai.studio/)

**Deterministic Disaster Accessibility, Physical Asset Optimization & Resilient Public Health Equity**

[🚀 Live Deployed Prototype](https://lifeline-os.ai.studio/) • [📊 Pitch Deck (PowerPoint)](Lifeline_OS_Pitch_Deck.pptx) • [📑 Pitch Deck (PDF)](Lifeline_OS_Pitch_Deck.pdf) • [📚 Technical Docs](docs/ARCHITECTURE.md) • [📲 Live Phone Demo](https://ntfy.sh/lifeline-os-alert-2026)

</div>

---

## 🧭 Executive Summary & Operational Challenge

During catastrophic monsoon river surges in Assam's **Barak River basin (Cachar District / Silchar)**, rapid inundation severs road embankments, culverts, and bridges within hours. Disaster commanders face a severe operational dilemma:
- **Evidence Fragmentation**: Satellite radar passes arrive 12–36 hours apart, emergency calls report conflicting breaches, and river levels fluctuate without local gauge coverage.
- **Intuition-Based Misallocation**: Relief convoys and medical teams are dispatched blindly onto submerged dirt tracks, unaware of which communities have crossed the clinical 60-minute **"Golden Hour"** medical cutoff.
- **Micro-Intervention Bottlenecks**: District magistrates possess resources to deploy only one modular Bailey bridge or pontoon crossing, but lack topological math to determine which severed span maximizes reconnected population per meter of bridgehead.

**Lifeline OS** is an evidence-driven flood-impact intelligence and emergency-response decision-support platform. It transforms raw multi-source radar, weather, and river telemetry into deterministic, auditable, and physically viable field interventions under India's **Disaster Management Act 2005**.

---

## 🏗️ Technical System Architecture

Lifeline OS executes an end-to-end operational pipeline across 5 architectural tiers, balancing client-side edge computation with Google Cloud serverless scalability:

![Lifeline OS System Architecture](lifeline_os_system_architecture.gif)
*Figure 1: High-resolution animated system reference architecture showing multi-source ingestion, client-side Web Worker graph traversal, and multi-channel emergency dispatch. (Static PNG: [`lifeline_os_system_architecture.png`](lifeline_os_system_architecture.png))*

### System Architecture Layers:
1. **External Telemetry & Provider Layer**: Keyless ingestion from Copernicus Sentinel-1 SAR (10m radar), Open-Meteo Weather (10m wind, precipitation, temperature), Copernicus GloFAS (daily river discharge $Q\text{ m}^3/\text{s}$), and OpenStreetMap (OSM) highway infrastructure.
2. **Ingestion & Edge Cache Layer**: Normalizes disparate spatial vectors; stores tiled GeoTIFF rasters and baseline PBF road networks locally in browser **IndexedDB (Dexie)** for 100% offline field survivability during disaster power and cellular outages.
3. **Epistemic Validation Layer**: Enforces strict Zod runtime type-checking, flags temporal staleness (>6h TTL), and tags every feature with explicit confidence boundaries.
4. **Geospatial & Network Graph Core**: Metric projection in **UTM Zone 46N (EPSG:32646)** via Proj4js. Multi-threaded Web Workers execute Turf.js polygon dissolves, line slicing, and NetworkX topological percolation over 31,214 nodes and 69,663 directed edges.
5. **Decision Optimization & Governance**: Solves $k$-medoids facility locations for non-flooded boat staging pads, calculates micro-bridge accessibility ROI, issues printable statutory SDRF Form-3B requisition orders, and anchors state in an immutable SHA-256 Merkle audit trail.

---

## 🔄 Operational Process Flow & Swimlanes

Lifeline OS enforces strict operational separation between external inputs, algorithmic evaluation, and statutory human authority across 7 organizational swimlanes:

![Lifeline OS Process Flow & Operational Swimlanes](lifeline_os_process_swimlane.gif)
*Figure 2: End-to-end operational decision flow from raw satellite evidence to digital commander sanction. (Static PNG: [`lifeline_os_process_swimlane.png`](lifeline_os_process_swimlane.png))*

### 7 Operational Swimlanes:
| # | Swimlane | Operational Function |
| :-: | :--- | :--- |
| **1** | **External Providers** | Emits Sentinel-1 radar backscatter, Open-Meteo precipitation, and GloFAS river discharge. |
| **2** | **Ingestion & Cache** | Ingests data streams, populates IndexedDB client store, and triggers Web Workers. |
| **3** | **Epistemic Validation** | Verifies schema validity, checks 6-hour temporal TTL, and filters anomalous telemetry. |
| **4** | **Spatial Graph Core** | Slices 69,663 road segments in UTM Zone 46N; identifies 1,830 severed edges in 840ms. |
| **5** | **Decision Engine** | Evaluates 60-min Golden Hour isochrones, runs $k$-medoids boat staging, and ranks bridge ROI. |
| **6** | **Civil Commander** | Incident Commander digitally reviews, modifies, and signs the SDRF Form-3B requisition order. |
| **7** | **Audit Ledger** | Publishes verified alerts via ntfy/SMS and appends state to an immutable SHA-256 Merkle chain. |

---

## 🎯 5 Connected Operational Chapters

Lifeline OS organizes incident operations into 5 sequential, deterministic chapters:

```
[ 01. PREVENT ] ──► [ 02. PREDICT ] ──► [ 03. PROTECT ] ──► [ 04. RESPOND ] ──► [ 05. LEARN ]
 Preparedness &      Hydrology &         Clinical Triage     Constrained ROI     Accountability &
 Vulnerability       Weather Ingest      & Bed Surge         Asset Dispatch      Audit Ledger
```

1. **01. PREVENT (Network Vulnerability & Embankment Breach)**: Evaluates single-points-of-failure along river dykes, bridgeheads, and causeways before flood peaks arrive.
2. **02. PREDICT (Hazard & Environmental Telemetry Coverage)**: Ingests live precipitation, GloFAS river discharge, and displays honest sensor coverage (explicitly marks missing Central Water Commission gauges as `UNAVAILABLE`).
3. **03. PROTECT (Health Catchment Surge & Clinical Triage)**: Implements NDMA 4-tier START clinical risk stratification (Red/Amber/Yellow/Green), monitors Block Primary Health Center (BPHC) bed surge, and computes ambulance detour times.
4. **04. RESPOND (Constrained Allocation & Micro-Intervention ROI Engine)**: Enforces physical feasibility boundaries (wind $<45\text{ km/h}$ for drones, river velocity $<3.5\text{ m/s}$ for boats, 16-Tonne crane access for Bailey bridges) and calculates engineering ROI for temporary crossings.
5. **05. LEARN (Accountability & SHA-256 Merkle Audit Ledger)**: Cryptographic state ledger recording every simulation run, commander override, and dispatch order for post-disaster judicial and legislative review under the Disaster Management Act 2005.

---

## 📐 Mathematical Formulations & Engineering Engines

### 1. Topological Percolation & Cut-Edge Detection
Let transportation infrastructure be modeled as a directed, weighted graph $G = (V, E, W)$, where $|V| = 31,214$ nodes and $|E| = 69,663$ metric edges in UTM Zone 46N.

Given polygonal flood extent $\mathcal{P}_{\text{flood}}$ vectorized from Copernicus Sentinel-1 SAR (Otsu threshold at $-14.2\text{ dB}$):
$$E_{\text{cut}} = \{e \in E \mid \text{Intersects}(e, \mathcal{P}_{\text{flood}}) = \text{true}\}$$
$$G' = (V, E \setminus E_{\text{cut}}, W)$$
*Cachar Benchmark: $|E_{\text{cut}}| = 1,830$ severed links computed in 840ms.*

### 2. Dynamic Dijkstra Healthcare Routing & 60-Min Golden Hour
Travel time $T(s_i, H)$ from settlement $s_i$ to nearest hospital $h \in H$ is computed via dynamic shortest-path traversal:
$$T(s_i, H) = \min_{h_j \in H} \text{Dijkstra}(G', s_i, h_j)$$

$$\text{Status}(s_i) = \begin{cases} 
\text{REACHABLE} & \text{if } T(s_i, H) \le 60\text{ min} \\
\text{DELAYED\_REROUTED} & \text{if } 60\text{ min} < T(s_i, H) < \infty \\
\text{MODEL\_ISOLATED} & \text{if } T(s_i, H) = \infty \text{ (no traversable path)}
\end{cases}$$

### 3. Pre-Positioning Facility Location ($k$-Medoids Optimization)
Finds $k$ staging hub locations $M = \{m_1, \dots, m_k\} \subset V_{\text{dry}}$ minimizing weighted transit distance to isolated clusters $C$:
$$\min_{M \subset V_{\text{dry}}, |M|=k} \sum_{i=1}^{m} w(c_i) \min_{j=1}^{k} d(c_i, m_j)$$
*Subject to: $m_j \notin \mathcal{P}_{\text{flood}}$, $\text{Elevation}(m_j) \ge Z_{\text{crest}} + 1.5\text{m}$, and continuous roadhead arterial connectivity.*

### 4. Micro-Intervention ROI Engine (The Engineering Fix)
Evaluates candidate temporary Bailey bridge or pontoon bridge sites $e \in E_{\text{cut}}$ and ranks by accessibility return:
$$\text{ROI}(e) = \frac{\text{Reconnected Population}(e) + \sum_{s \in S} \Delta \text{km saved}(e, s)}{\text{Span Length}(e)}$$
Where $\Delta \text{km saved}(e, s) = \max\left(0, \text{Dist}_{G'}(s, H) - \text{Dist}_{G'_e}(s, H)\right)$.

### 5. Biological Cold-Chain Thermal Decay
Passive container insulation life for insulin and antivenom based on live ambient temperature $T_{\text{ambient}}$:
$$\text{spoilageHoursRemaining} = \max\left(1.2, \frac{8 - 4}{0.04 \times (T_{\text{ambient}} - 4)}\right)$$

### 6. Hydrological Surface Velocity Approximation
Surface river velocity $v$ (in $\text{m/s}$) derived from GloFAS discharge $Q$ (in $\text{m}^3/\text{s}$):
$$v = \sqrt{Q} \times 0.062 + 0.3$$
*Lockout Rule: If $v > 3.5\text{ m/s}$, NDRF Zodiac boat operations are locked out due to capsize hazard.*

---

## 📸 Prototype UI & Operational Console

<div align="center">

| 1. Situational Command Dashboard | 2. Health Catchment Vulnerability |
| :---: | :---: |
| ![Situational Command Dashboard](demo-assets/screenshots/01_application_overview.png) | ![Health Vulnerability Summary](demo-assets/screenshots/06_flood_impact_analysis.png) |
| *Dual-panel Leaflet 2D/3D flood map & isolation counters* | *START clinical triage & hospital bed surge balancing* |

| 3. Cut-Edge Disruption Engine | 4. Pre-Positioning & Micro-Bridge ROI |
| :---: | :---: |
| ![Cut-Edge Disruption](demo-assets/screenshots/07_route_disruption_hospital_surge.png) | ![Pre-Positioning & ROI](demo-assets/screenshots/08_resource_planner_roi.png) |
| *1,830 severed road links with calculated overland detours* | *$k$-Medoids boat pads & Bailey bridge ranking* |

</div>

<div align="center">

### 5. Statutory Sanction Order & Dispatch Terminal
![Commander Sanction Order Terminal](demo-assets/screenshots/09_sanction_order_audit_trail.png)  
*Legally defensible SDRF Form-3B order generation with digital commander signature lock and multi-channel dispatch*

</div>

---

## 📲 Zero-Cost Live Smartphone Hardware Demo

Evaluators and judges can trigger a real, sub-second physical emergency dispatch alert directly on their own mobile device:

1. Open **[ntfy.sh/lifeline-os-alert-2026](https://ntfy.sh/lifeline-os-alert-2026)** in any mobile browser (or install the free [ntfy app](https://ntfy.sh/) on iOS/Android).
2. Tap **Subscribe** to topic: `lifeline-os-alert-2026`.
3. In Lifeline OS, navigate to **04. RESPOND** and click **`[ 🚀 Sign Sanction & Dispatch ]`**.
4. Within **420 milliseconds**, your phone will vibrate with the localized statutory evacuation order containing incident coordinates and shelter routing.

---

## ⚡ Empirical Performance Benchmarks

Measured on the **Cachar District, Assam operational dataset** (June 2022 flood replay):

| Metric / Benchmark | Measured Value | Standard Enterprise GIS | Advantage |
| :--- | :---: | :---: | :--- |
| **Topological Road Scale** | 31,214 nodes / 69,663 edges | Static shapefile layer | Fully traversable directed graph |
| **Cut-Edge Percolation Speed** | **840 ms** (Web Worker) | 15–45 seconds | Zero UI thread blocking |
| **Dynamic Dijkstra Re-Routing** | **<1.2 seconds** (319 towns) | 30–90 seconds | Real-time Golden Hour isochrones |
| **$k$-Medoids Staging Solver** | **210 ms** | Manual human estimate | High-elevation dry node guarantee |
| **Micro-Bridge ROI Solver** | **340 ms** | Not supported | Mathematical return on investment |
| **Client Memory Footprint** | **<85 MB** heap (Chromium) | >1.5 GB desktop GIS | Runs on standard field laptops |
| **Offline Edge Resilience** | **100% Offline** (IndexedDB) | Cloud-dependent | Operates during total grid outages |

---

## 💰 Public-Sector District Deployment TCO Model

Because all spatial calculations execute client-side in browser Web Workers, district disaster authorities require zero dedicated GPU clusters:

| Cost Component | Monthly Cost (Dry Season) | Monthly Cost (Monsoon Activation) |
| :--- | :---: | :---: |
| **Google Cloud Run** (Microservices API) | ~$15 / mo | ~$45 / mo |
| **Google Cloud Storage** (GeoTIFF tile cache) | ~$10 / mo | ~$15 / mo |
| **Firebase Firestore** (Command sync) | ~$20 / mo | ~$25 / mo |
| **Copernicus Sentinel-1 SAR Telemetry** | **$0** (Free & Open Access) | **$0** (Free & Open Access) |
| **OpenStreetMap Infrastructure Vectors** | **$0** (ODbL License) | **$0** (ODbL License) |
| **Total Estimated Annual TCO** | **~$1,140 / year per district** | *(Legacy GIS: >$40,000 / year)* |

---

## 🛡️ Operational Truthfulness & 7-Tier Epistemic Lineage

To eliminate disaster misinformation, Lifeline OS enforces strict operational truthfulness rules:
- **Non-Confirmatory Spatial Guarantee**: Intersections between radar masks and road vectors are strictly classified as *"Potential Inundation / Exposure."* Physical structural collapse is never claimed without field drone or engineer verification.
- **Zero Route Hallucination**: When no safe traversable road exists, the routing engine terminates with an explicit `NO_ROUTE` error boundary rather than routing emergency crews onto submerged causeways.
- **7-Tier Epistemic Lineage**:
  - `OBSERVED`: Raw satellite radar backscatter or field sensor readings.
  - `OFFICIAL`: Verified gazetted infrastructure data from government authorities.
  - `REPORTED`: Field reports submitted by local duty officers (pending ground check).
  - `MODELLED`: Algorithmically computed flood depth, travel times, or isochrones.
  - `ASSUMED`: Calibrated engineering constants (e.g., $4.8$ persons per rural dwelling).
  - `SIMULATED`: Operator-injected counterfactual scenario parameters.
  - `REJECTED`: Telemetry failing physical range bounds or checksum verification.
- **Mandatory Human-in-the-Loop Authority**: Under the Disaster Management Act 2005, artificial intelligence never executes autonomous field dispatches. All orders require digital sign-off from the Civil Defense Incident Commander.

---

## 💻 Tech Stack

- **Frontend & Edge**: React 19, TypeScript 5.7, Vite 6, Tailwind CSS 4, Lucide Icons, Web Workers.
- **Geospatial & Graph**: Turf.js, Proj4js (EPSG:32646 UTM Zone 46N), NetworkX, Leaflet 1.9, MapLibre GL.
- **Validation & Client Store**: Zod runtime schema validation, IndexedDB (Dexie), SHA-256 Merkle hash chains.
- **Google Cloud & Services**: Google Cloud Run, Cloud Storage, BigQuery (`ST_INTERSECTS`), Firebase Firestore, Google GenAI SDK (`@google/genai`).
- **External Telemetry**: Copernicus Sentinel-1 SAR, Open-Meteo Weather/SRTM Elevation, Copernicus GloFAS, OpenStreetMap, ntfy.sh.

---

## 🚀 Quickstart & Developer Guide

### Prerequisites
- Node.js `20.x` or higher (tested on Node `v24.11.1`)
- npm `10.x` or higher

### Installation & Local Run
```bash
# 1. Clone repository
git clone https://github.com/MsMansiDhruv/lifeline-os.git
cd lifeline-os

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
# -> Server running at http://localhost:3000

# 4. Run automated test suite (235 tests)
npm test

# 5. Typecheck & production bundle build
npm run lint    # TypeScript strict check (0 errors)
npm run build   # Production Vite bundle build (~3.9s)
```

### Docker Deployment
```bash
# Build and run Docker container
docker build -t lifeline-os .
docker run -p 3000:3000 -e PORT=3000 lifeline-os
```

---

## 📚 Technical Documentation Directory

Comprehensive architectural, scientific, and governance specifications are maintained in the [`docs/`](docs/) directory:

| Document | Purpose & Description |
| :--- | :--- |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Technical system architecture, visual diagrams, data-flow pipelines, and cloud adapters. |
| [`docs/SIMULATION_METHODOLOGY.md`](docs/SIMULATION_METHODOLOGY.md) | Complete mathematical formulations: percolation, Dijkstra, $k$-medoids, and bridge ROI engine. |
| [`docs/TECHNICAL_AUDIT.md`](docs/TECHNICAL_AUDIT.md) | Phase Zero architecture critique, identified defects, and engineering corrections. |
| [`docs/DATA_SOURCE_REGISTER.md`](docs/DATA_SOURCE_REGISTER.md) | Registry of all external telemetry providers, licenses, spatial resolutions, and update cadences. |
| [`docs/DATA_DICTIONARY.md`](docs/DATA_DICTIONARY.md) | Canonical evidence states, field definitions, units of measurement, and physical bounds. |
| [`docs/PROVENANCE_AND_CONFIDENCE.md`](docs/PROVENANCE_AND_CONFIDENCE.md) | 7-tier confidence scoring and zero-fabrication data lineage governance. |
| [`docs/VALIDATION_AND_BENCHMARKING.md`](docs/VALIDATION_AND_BENCHMARKING.md) | Cachar 2022, Wayanad 2024, and Nepal 2024 empirical benchmark results. |
| [`docs/SECURITY_AND_SAFETY.md`](docs/SECURITY_AND_SAFETY.md) | Human-in-the-loop authorization, panic prevention, and data privacy protocols. |
| [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md) | Automated verification matrix and end-to-end testing workflow (235 tests). |
| [`docs/GCP_DEPLOYMENT_PLAN.md`](docs/GCP_DEPLOYMENT_PLAN.md) | Google Cloud Run, Cloud Storage, and BigQuery production deployment guide. |
| [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md) | Assumptions, rating curve boundaries, and future sensor telemetry roadmap. |
| [`Lifeline_OS_Pitch_Deck.pdf`](Lifeline_OS_Pitch_Deck.pdf) | Official 16-slide competition pitch deck in high-resolution vector PDF format. |

---

## 📄 License

Licensed under the **Apache License 2.0**. Open-source, public good infrastructure designed for zero proprietary cloud lock-in.
