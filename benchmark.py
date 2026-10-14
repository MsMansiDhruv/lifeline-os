import pickle
import time
import geopandas as gpd
import osmnx as ox
import networkx as nx
import numpy as np
import pandas as pd

t0 = time.time()
print("Loading graph...")
G = pickle.load(open("cachar_graph.pkl", "rb"))
print(f"Graph loaded in {time.time()-t0:.2f}s: {len(G.nodes)} nodes, {len(G.edges)} edges")

# 1. Project to UTM Zone 46N (EPSG:32646)
G_proj = ox.project_graph(G, to_crs="EPSG:32646")
print("Graph projected to EPSG:32646")

# 2. Load flood polygon
flood_gdf = gpd.read_file("datasets/Silchar_Flood_Polygon_2022.geojson")
flood_proj = flood_gdf.to_crs("EPSG:32646")
print("Flood polygon loaded and projected")

# 3. Intersect road edges with flood polygon
nodes_gdf, edges_gdf = ox.graph_to_gdfs(G_proj)
print(f"Edges count: {len(edges_gdf)}")

# Spatial join edges with flood
flooded_edges = gpd.sjoin(edges_gdf, flood_proj, predicate="intersects")
print(f"Flooded intersecting edge rows: {len(flooded_edges)}")

# Exclude bridge tagged edges
bridge_vals = ['yes', 'viaduct', 'suspension']
if 'bridge' in flooded_edges.columns:
    sever_candidates = flooded_edges[~flooded_edges['bridge'].isin(bridge_vals)]
else:
    sever_candidates = flooded_edges

print(f"Edges to sever: {len(sever_candidates)}")

# Sever BOTH directions
G_scenario = G_proj.copy()
for u, v, k in sever_candidates.index.unique():
    if G_scenario.has_edge(u, v, k):
        G_scenario.remove_edge(u, v, k)
    if G_scenario.has_edge(v, u):
        G_scenario.remove_edge(v, u)

print(f"Remaining edges in G_scenario: {len(G_scenario.edges)}")

# 4. Health and Villages
health_gdf = gpd.read_file("health.geojson").to_crs("EPSG:32646")
villages_gdf = gpd.read_file("villages.geojson").to_crs("EPSG:32646")

# Facility status: submerged check
health_in_flood = gpd.sjoin(health_gdf, flood_proj, predicate="intersects")
submerged_indices = set(health_in_flood.index)
health_gdf["is_submerged"] = health_gdf.index.isin(submerged_indices)
operational_health = health_gdf[~health_gdf["is_submerged"]].copy()

print(f"Total health facilities: {len(health_gdf)}, Submerged: {len(submerged_indices)}, Operational: {len(operational_health)}")

# 5. Snapping (reject > 1500 meters)
v_xs, v_ys = villages_gdf.geometry.x.values, villages_gdf.geometry.y.values
v_nodes, v_dists = ox.distance.nearest_nodes(G_proj, v_xs, v_ys, return_dist=True)
villages_gdf["graph_node"] = v_nodes
villages_gdf["snap_dist_m"] = v_dists
valid_villages = villages_gdf[villages_gdf["snap_dist_m"] <= 1500].copy()

h_xs, h_ys = health_gdf.geometry.x.values, health_gdf.geometry.y.values
h_nodes, h_dists = ox.distance.nearest_nodes(G_proj, h_xs, h_ys, return_dist=True)
health_gdf["graph_node"] = h_nodes
health_gdf["snap_dist_m"] = h_dists
valid_health = health_gdf[health_gdf["snap_dist_m"] <= 1500].copy()

valid_op_health = operational_health.copy()
op_xs, op_ys = valid_op_health.geometry.x.values, valid_op_health.geometry.y.values
op_nodes, op_dists = ox.distance.nearest_nodes(G_proj, op_xs, op_ys, return_dist=True)
valid_op_health["graph_node"] = op_nodes
valid_op_health["snap_dist_m"] = op_dists
valid_op_health = valid_op_health[valid_op_health["snap_dist_m"] <= 1500].copy()

print(f"Valid settlements (within 1500m): {len(valid_villages)}/{len(villages_gdf)}")
print(f"Valid operational facilities: {len(valid_op_health)}/{len(operational_health)}")

all_health_nodes = set(valid_health["graph_node"])
op_health_nodes = set(valid_op_health["graph_node"])

# 6. Lightning Routing
records = []
t_route = time.time()
for v_idx, v_row in valid_villages.iterrows():
    v_node = v_row["graph_node"]
    v_name = v_row.get("name", "Unnamed Village")

    try:
        base_all_dists = nx.single_source_dijkstra_path_length(G_proj, v_node, weight="length")
    except Exception:
        continue

    base_dists = {h: base_all_dists[h] / 1000.0 for h in all_health_nodes if h in base_all_dists}
    if not base_dists:
        continue
    best_base_h = min(base_dists, key=base_dists.get)
    base_km = base_dists[best_base_h]
    is_coincident = base_km < 0.05

    try:
        scen_all_dists = nx.single_source_dijkstra_path_length(G_scenario, v_node, weight="length")
    except Exception:
        scen_all_dists = {}

    scen_dists = {h: scen_all_dists[h] / 1000.0 for h in op_health_nodes if h in scen_all_dists}

    if not scen_dists:
        status = "MODEL_ISOLATED"
        scen_km = np.nan
        additional_km = np.nan
        detour_ratio = np.nan
        best_scen_h = None
        dest_changed = False
    else:
        best_scen_h = min(scen_dists, key=scen_dists.get)
        scen_km = scen_dists[best_scen_h]
        additional_km = round(scen_km - base_km, 2)
        detour_ratio = round(scen_km / base_km, 2) if base_km > 0.05 else np.nan
        dest_changed = best_scen_h != best_base_h
        if dest_changed:
            status = "REROUTED_ALT_FACILITY"
        else:
            status = "REACHABLE_SAME_FACILITY"

    records.append({
        "village_id": v_idx,
        "village_name": v_name,
        "lat": G.nodes[v_node]["y"],
        "lon": G.nodes[v_node]["x"],
        "snap_distance_m": round(v_row["snap_dist_m"], 1),
        "baseline_nearest_node": best_base_h,
        "scenario_nearest_node": best_scen_h,
        "baseline_km": round(base_km, 2),
        "scenario_km": round(scen_km, 2) if not np.isnan(scen_km) else None,
        "additional_km": additional_km,
        "detour_ratio": detour_ratio,
        "destination_altered": dest_changed,
        "is_coincident_base": is_coincident,
        "modeled_status": status,
    })

print(f"Routing evaluated in {time.time()-t_route:.2f}s for {len(records)} settlements")
df = pd.DataFrame(records)
print(df["modeled_status"].value_counts())
print("Max additional km:", df["additional_km"].max())
print("\nTop 5 severe detours:")
print(df.sort_values(by="additional_km", ascending=False)[["village_name", "baseline_km", "scenario_km", "additional_km", "detour_ratio", "modeled_status"]].head(5))
