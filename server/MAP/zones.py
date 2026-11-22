"""Nationwide risk pointers built from the real dataset rows.

We take IndiaGeo.csv, keep only points inside India's border, and thin them
to roughly one per grid cell so the pointers are spread evenly across the
country instead of clumping. Each kept row is scored by the classifier with
its own recorded features.
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd
from matplotlib.path import Path as Polygon

from model import DATA_PATH, predict_batch

CELL = 1.4  # degrees per grid cell (~150 km): about 140 evenly spaced pointers
_cache = {}


def india_rings(step=15):
    """India's outline, thinned (every `step`-th vertex) and without tiny islands."""
    geo = json.loads((Path(__file__).parent / "static" / "india-composite.geojson").read_text())
    polys = geo["features"][0]["geometry"]["coordinates"]
    return [np.array(p[0])[::step] for p in polys if len(p[0]) > 300]


_SHAPES = None


def _inside_india(df):
    """Boolean mask of rows that fall inside India's (simplified) outline."""
    global _SHAPES
    _SHAPES = _SHAPES or [Polygon(r) for r in india_rings()]
    pts = df[["longitude", "latitude"]].to_numpy()
    return np.any([s.contains_points(pts) for s in _SHAPES], axis=0)


def _even_sample(df):
    """One row per grid cell: the row closest to that cell's centre."""
    cell = (df.latitude // CELL).astype(int).astype(str) + ":" + (df.longitude // CELL).astype(int).astype(str)
    centre_lat = (df.latitude // CELL + 0.5) * CELL
    centre_lon = (df.longitude // CELL + 0.5) * CELL
    dist = (df.latitude - centre_lat) ** 2 + (df.longitude - centre_lon) ** 2
    return df.assign(_cell=cell, _d=dist).sort_values("_d").drop_duplicates("_cell").drop(columns=["_cell", "_d"])


def risk_zones():
    """[{lat, lon, region, season, risk_level, ...}] evenly spread over India."""
    if "points" not in _cache:
        df = pd.read_csv(DATA_PATH)
        df = _even_sample(df[_inside_india(df)])
        preds = predict_batch(df.drop(columns=["risk_level"]).to_dict("records"))
        _cache["points"] = [{"lat": round(r.latitude, 3), "lon": round(r.longitude, 3),
                             "region": r.region, "season": r.season, **p}
                            for r, p in zip(df.itertuples(), preds)]
    return _cache["points"]
