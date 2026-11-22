"""Bake the ML map into static files so the website can run without Flask.

Writes to client/public/map-data/:
  zones.json      evenly spread pointers, each with its full ML result + top drivers
  heatmap.png     the smooth green -> red risk surface
  india.geojson   a lighter copy of India's outline

Run after retraining:  ../venv/Scripts/python export_static.py
"""
import json
from pathlib import Path

import pandas as pd

from heatmap import BOUNDS, heatmap_png
from model import DATA_PATH, RISK_CLASSES, predict_batch, top_drivers
from zones import _even_sample, _inside_india, india_rings

OUT = Path(__file__).resolve().parents[2] / "client" / "public" / "map-data"
OUT.mkdir(parents=True, exist_ok=True)

# 1. Pointers: real dataset rows, evenly spread, each scored + explained by SHAP drivers
df = pd.read_csv(DATA_PATH)
df = _even_sample(df[_inside_india(df)])
rows = df.drop(columns=["risk_level"]).to_dict("records")
points = []
for row, pred in zip(rows, predict_batch(rows)):
    sev = sum(pred["risk_probabilities"][c] * i / 3 for i, c in enumerate(RISK_CLASSES))
    points.append({
        "lat": round(row["latitude"], 3), "lon": round(row["longitude"], 3),
        "region": row["region"], "season": row["season"], **pred,
        "score": round(1 - sev, 3),
        "elevation": int(row["elevation"]), "vegetation_index": round(row["vegetation_index"], 3),
        "water_index": round(row["water_index"], 3),
        "drivers": top_drivers(row),
    })
(OUT / "zones.json").write_text(json.dumps({"season": "Dataset", "bounds": BOUNDS, "points": points}))

# 2. Heatmap image
(OUT / "heatmap.png").write_bytes(heatmap_png())

# 3. Light outline (thinned rings, no tiny islands)
geo = {"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {}, "geometry": {
    "type": "MultiPolygon", "coordinates": [[[[round(x, 3), round(y, 3)] for x, y in r]] for r in india_rings(step=6)]}}]}
(OUT / "india.geojson").write_text(json.dumps(geo))

print(f"{len(points)} pointers ->", OUT)
