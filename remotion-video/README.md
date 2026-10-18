# Lifeline OS — Hackathon Technical Product Demonstration Video

Story-led, programmatic demonstration video engineered with [Remotion](https://www.remotion.dev/) (React 19 + TypeScript + Tailwind CSS).

## Video Specifications
- **Target Duration:** 3 minutes 40 seconds (220.0 seconds)
- **Total Frames:** 6,600 frames @ 30 FPS
- **Resolution:** 1920 × 1080 (Full HD, 16:9 widescreen)
- **Output Artifact:** `demo-assets/Lifeline_OS_Hackathon_Demo_3m40s.mp4`

---

## Editorial & Design Architecture
- **Palette:** Clinical, editorial light theme (`#f8fafc` canvas, `#0f172a` slate typography, `#0284c7` restrained response blue, `#0d9488` teal provenance accents).
- **Structure:**
  - Real, unvarnished application captures from Playwright browser automation against `http://localhost:3000/`.
  - Zero fabricated stats, zero science-fiction HUDs, zero artificial hype.
  - Clear provenance indicators and disclosure of local adapters (`LOCAL_ADAPTER`).
  - Synchronized narration audio generated with Microsoft Speech Synthesizer.

---

## 8-Scene Story Structure

| Scene | Name | Time Window | Frame Range | Core Content |
|---|---|---|---|---|
| **Scene 1** | The Problem | 00:00 – 00:18 | 0 – 540 | Flood response failure modes: Inundation vs Operational Disruption (isolated wards, cut-off hospitals, impassable bridges). |
| **Scene 2** | Introducing Lifeline OS | 00:18 – 00:38 | 540 – 1140 | Prototype walkthrough, Incident selection (Silchar 2022 flood, 3,248 km² watershed), Core 3-pillar pipeline. |
| **Scene 3** | Evidence & Provenance | 00:38 – 01:05 | 1140 – 1950 | Multi-source ingestion: Copernicus Sentinel-1 SAR (10m), GloFAS discharge forecasts (2,840 m³/s), OpenStreetMap road networks, SitRep #22 validation. |
| **Scene 4** | Impact & Accessibility | 01:05 – 01:42 | 1950 – 3060 | Road-network breach analysis (80m JT Road breach), A* routing reroute (+47m penalty), hospital capacity triage (88% surge diversion). |
| **Scene 5** | Deterministic Response Planning | 01:42 – 02:20 | 3060 – 4200 | Constraint satisfaction solver (linear resource allocation). Hard stock caps (Bailey Bridge 1/1, Zodiac Boats 4/4, Budget ₹250L / ₹214.5L utilized). |
| **Scene 6** | Human Review & Governance | 02:20 – 02:48 | 4200 – 5040 | Statutory SDRF Form-3B order generation, immutable SHA-256 audit log, verified simulation notification sandbox. |
| **Scene 7** | System Architecture | 02:48 – 03:12 | 5040 – 5760 | End-to-end decoupled pipeline: Ingestion Worker → Geospatial Graph Engine → Solver Engine → Governance & Audit Layer. |
| **Scene 8** | Conclusion & Synthesis | 03:12 – 03:40 | 5760 – 6600 | Summary of capability: "From flood evidence to informed response". Repository and live prototype links. |

---

## Project Structure
```
remotion-video/
├── public/
│   ├── assets/       # Live application screenshots and architecture diagrams
│   └── audio/        # Synchronized scene narration WAV tracks
├── src/
│   ├── components/   # HeaderBar, Captions, ProcessFlow
│   ├── scenes/       # Scene1 through Scene8 implementations
│   ├── Composition.tsx # Main 6,600-frame sequential Remotion Composition
│   ├── Root.tsx      # Remotion Root registration
│   └── index.ts      # Entry point
├── package.json
└── remotion.config.ts
```

---

## Commands

### Live Interactive Preview in Studio
```bash
npm run dev
# Opens Remotion Studio at http://localhost:3000 or http://localhost:3001
```

### Render Final High-Resolution MP4
```bash
npx remotion render LifelineOS-Demo ../demo-assets/Lifeline_OS_Hackathon_Demo_3m40s.mp4
```
