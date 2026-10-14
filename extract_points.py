import os
import sys
import geopandas as gpd

pbf_path = r"datasets\north-eastern-zone-261011.osm.pbf"
bbox = (92.5, 24.5, 93.2, 25.1)

print("Reading points layer from PBF with bbox...")
pts = gpd.read_file(pbf_path, layer='points', bbox=bbox)
print(f"Total points read: {len(pts)}")
print(f"Columns: {pts.columns.tolist()}")

def parse_tag(other_tags_str, target_key):
    if not isinstance(other_tags_str, str):
        return None
    for part in other_tags_str.split(','):
        if '=>' in part:
            k, v = part.split('=>', 1)
            k = k.strip().strip('"').strip("'")
            v = v.strip().strip('"').strip("'")
            if k == target_key:
                return v
    return None

if 'amenity' not in pts.columns:
    pts['amenity'] = pts['other_tags'].apply(lambda x: parse_tag(x, 'amenity'))
else:
    # fill from other_tags if null
    pts['amenity'] = pts['amenity'].fillna(pts['other_tags'].apply(lambda x: parse_tag(x, 'amenity')))

if 'place' not in pts.columns:
    pts['place'] = pts['other_tags'].apply(lambda x: parse_tag(x, 'place'))
else:
    pts['place'] = pts['place'].fillna(pts['other_tags'].apply(lambda x: parse_tag(x, 'place')))

if 'name' not in pts.columns:
    pts['name'] = pts['other_tags'].apply(lambda x: parse_tag(x, 'name'))
else:
    pts['name'] = pts['name'].fillna(pts['other_tags'].apply(lambda x: parse_tag(x, 'name')))

health_mask = pts['amenity'].isin(['hospital', 'clinic', 'doctors', 'health_post', 'dispensary'])
health_gdf = pts[health_mask].copy()
health_gdf['name'] = health_gdf['name'].fillna('Unnamed Health Facility')
health_gdf = health_gdf[['name', 'amenity', 'geometry']].dropna(subset=['geometry'])

village_mask = pts['place'].isin(['village', 'hamlet', 'town', 'isolated_dwelling'])
villages_gdf = pts[village_mask].copy()
villages_gdf['name'] = villages_gdf['name'].fillna('Unnamed Settlement')
villages_gdf = villages_gdf[['name', 'place', 'geometry']].dropna(subset=['geometry'])

print(f"Extracted health points: {len(health_gdf)}")
print(f"Extracted village points: {len(villages_gdf)}")

# Save to datasets directory and root directory for convenience
health_gdf.to_file(r"datasets\health.geojson", driver="GeoJSON")
villages_gdf.to_file(r"datasets\villages.geojson", driver="GeoJSON")
health_gdf.to_file("health.geojson", driver="GeoJSON")
villages_gdf.to_file("villages.geojson", driver="GeoJSON")
print("Saved health.geojson and villages.geojson successfully!")
