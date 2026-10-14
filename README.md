# 🚨 Lifeline OS: Predictive Disaster Routing & Logistics Platform

> **Deterministic Disaster Accessibility & Preventative Logistics Simulator**  
> *Benchmark Event:* June 2022 Silchar, Cachar District, Assam Floods  
> *Sensors & Data:* Sentinel-1 SAR Flood Inundation Footprint & OSM Topological Road Network  
> *CRS:* UTM Zone 46N (`EPSG:32646`)

---

## 🌟 Overview

During the devastating June 2022 Silchar floods, over **80% of Cachar district was submerged**, trapping hundreds of thousands of civilians and severing arterial connectivity to critical healthcare facilities.

Standard shortest-path routing algorithms (naive Dijkstra) fail during real-world disasters because they treat road networks as static, Euclidean graphs and react only *after* bridges collapse.

**Lifeline OS** transforms disaster response from reactive detour plotting into a **predictive, decision-grade operations engine**. It couples topological graph analysis with physical surface impedance, bridgehead adjacency defenses, and preventative logistical optimizations.

---

## 🚀 Key Modules & Capabilities

### 1. 🛡️ Bulletproof Topological Architecture
- **Bridgehead Adjacency & Single Point of Failure Defense:** Prunes elevated bridges (e.g. Sadarghat Bridge) whose low-lying approach ramps are submerged.
- **Network Directionality & Contra-Flow Penalties:** Configurable routing modes for **Light Emergency (Ambulance/4x4)** with contra-flow penalties vs. **Heavy Supply (Truck/Bus)** with strict surface and turning restrictions.
- **Topologically Aware Metric Snapping:** Enforces ray-casting barrier checks across polygonal water bodies, preventing settlements on one riverbank from mistakenly snapping across the river to an unreachable bank.
- **Speed & Travel-Time Physics:** Models monsoon road degradation with dynamic impedance:
  $$\text{Cost} = \frac{\text{Length}}{\text{Base Speed} \times \text{Surface Degradation Factor}}$$
  *(paved = 1.0, unpaved = 0.4, fringe water proximity = 0.2)*.

---

### 2. 🔬 Feature 1: Pre-Disaster "Cut-Edge Percolation" (Criticality Index)
- Identifies single points of failure months before peak rainfall using an $\mathcal{O}(V + E)$ linear-time 2-edge connected condensation tree (`nx.k_edge_components(G, k=2)`).
- Ranks each road by its **Community Isolation Risk**:
  $$\text{Criticality}(e) = \sum_{v \in \text{Villages}} \Delta \text{Isolation}(e)$$
- Pinpoints critical choke points (e.g., *JT Road*, *Inbound Access Corridor to Harinagar*) for preventative embankment reinforcement and culvert widening.

---

### 3. ⚓ Feature 2: Pre-Positioning Supply Hub Optimization ($k$-Medoids)
- Computes optimal, non-flooded roadhead staging bases along the flood perimeter using combinatorial **$k$-Medoids facility location**:
  $$\min_{S \subseteq \mathcal{V}_{dry}, |S|=k} \sum_{v \in \mathcal{V}_{iso}} \min_{s \in S} d(v, s)$$
- Automates staging of **SDRF motorized Zodiacs, 4x4 Mobile Intensive Care Units, and helipad air-drop staging pads**, minimizing water rescue transit times to all cut-off settlements.

---

### 4. 🌉 Feature 4: Micro-Intervention ROI Engine (The Engineering Fix)
- Simulates individual topological restoration of candidate severed road spans.
- Ranks candidate crossings for deployment of temporary **Bailey bridges, folding pontoon crossings, or modular culvert decks** by **Return on Investment (ROI)**:
  $$\text{ROI}(e) = \frac{\text{Reconnected Population} + \sum \Delta \text{km saved}}{\text{Span Length (meters)}}$$
- Provides military / BRO combat engineer spec sheets with exact gap span, reconnected population, and estimated launch times.

---

### 5. 🤖 Autonomous AI Policy Copilot
- Integrates Google Gemini models (`gemini-1.5-pro` / `gemini-2.5-flash`) to generate structured, 3-bullet military-grade disaster memos for the Assam State Disaster Management Authority (ASDMA).

---

## 🛠️ Tech Stack

- **Frontend & App Shell:** Streamlit, Streamlit-Folium
- **Spatial & Graph Engine:** GeoPandas, OSMnx, NetworkX, Shapely, PyProj
- **Geospatial Visualization:** Folium, Esri Dark Gray Canvas & World Imagery
- **Analytics & Visuals:** Plotly, NumPy, Pandas
- **AI Synthesis:** Google GenAI SDK (`google-genai`), Python-DotEnv

---

## 💻 Local Installation & Setup

```bash
# 1. Clone repository
git clone https://github.com/MsMansiDhruv/lifeline-os.git
cd lifeline-os

# 2. Install dependencies
pip install -r requirements.txt

# 3. (Optional) Set your Gemini API key in .env or environment
echo GEMINI_API_KEY=your_key_here > .env

# 4. Launch the Lifeline OS Command Center
streamlit run app.py
```

---

## ☁️ Deploy to Streamlit Cloud

1. Fork or push to your GitHub account (`https://github.com/MsMansiDhruv/lifeline-os`).
2. Visit [share.streamlit.io](https://share.streamlit.io/).
3. Connect your GitHub repository:
   - **Repository:** `MsMansiDhruv/lifeline-os`
   - **Branch:** `main`
   - **Main file path:** `app.py`
4. Under **Advanced Settings ➔ Secrets**, add your Gemini API Key:
   ```toml
   GEMINI_API_KEY = "your-gemini-api-key"
   ```
5. Click **Deploy!** 🚀
