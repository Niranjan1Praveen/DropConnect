"""Smooth risk heatmap for India (green = lowest risk, red = highest).

1. Score every dataset row with the classifier -> expected severity in [0, 1]
2. Interpolate those scores onto a fine grid and blur it into a smooth surface
3. Cut it to India's outline and colour it, saved as a transparent PNG

The grid is spaced evenly in Web-Mercator Y so it lines up with Leaflet tiles.
"""
import io
import math

import numpy as np
import pandas as pd
from matplotlib import colormaps
from matplotlib.colors import LinearSegmentedColormap
from PIL import Image, ImageDraw
from scipy.interpolate import griddata
from scipy.ndimage import gaussian_filter

from model import DATA_PATH, RISK_CLASSES, predict_batch
from zones import _inside_india, india_rings

BOUNDS = (6.5, 67.5, 37.5, 97.5)   # south, west, north, east
WIDTH = 700
# Same ramp as the dashboard legend: green -> yellow -> orange -> red
CMAP = LinearSegmentedColormap.from_list("risk", ["#22c55e", "#eab308", "#f97316", "#ef4444"])
_png = None

merc = lambda lat: math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
unmerc = lambda y: math.degrees(2 * math.atan(math.exp(y)) - math.pi / 2)


def _severity_points():
    """(lon, lat, severity) for every dataset row inside India."""
    df = pd.read_csv(DATA_PATH)
    df = df[_inside_india(df)]
    weights = np.linspace(0, 1, len(RISK_CLASSES))
    preds = predict_batch(df.drop(columns=["risk_level"]).to_dict("records"))
    sev = [float(np.dot([p["risk_probabilities"][c] for c in RISK_CLASSES], weights)) for p in preds]
    return df.longitude.to_numpy(), df.latitude.to_numpy(), np.array(sev)


def heatmap_png():
    """PNG bytes of the clipped heatmap (computed once, then cached)."""
    global _png
    if _png is None:
        s, w, n, e = BOUNDS
        lons = np.linspace(w, e, WIDTH)
        ys = np.linspace(merc(n), merc(s), int(WIDTH * (merc(n) - merc(s)) / math.radians(e - w)))
        lats = np.array([unmerc(y) for y in ys])
        glon, glat = np.meshgrid(lons, lats)

        x, y, sev = _severity_points()
        # Average into ~1 degree regional cells first so single noisy rows don't create streaks
        cells = pd.DataFrame({"x": np.round(x), "y": np.round(y), "s": sev}).groupby(["x", "y"]).s.mean().reset_index()
        pts, vals = (cells.x, cells.y), cells.s
        grid = griddata(pts, vals, (glon, glat), method="cubic")
        near = griddata(pts, vals, (glon, glat), method="nearest")      # fill the edges
        grid = gaussian_filter(np.where(np.isnan(grid), near, grid), sigma=10)  # broad smooth regions

        # Paint India's outline onto a pixel mask (much faster than testing each pixel)
        h = len(lats)
        canvas = Image.new("L", (WIDTH, h), 0)
        draw = ImageDraw.Draw(canvas)
        for ring in india_rings(step=3):
            xs = (ring[:, 0] - w) / (e - w) * (WIDTH - 1)
            ys_px = (merc(n) - np.array([merc(v) for v in ring[:, 1]])) / (merc(n) - merc(s)) * (h - 1)
            draw.polygon(list(zip(xs, ys_px)), fill=255)
        mask = np.array(canvas) > 0

        # Stretch over India's pixels only so the full green -> red range is used
        lo, hi = np.percentile(grid[mask], [4, 96])
        rgba = CMAP(np.clip((grid - lo) / (hi - lo), 0, 1))
        rgba[..., 3] = np.where(mask, 0.78, 0.0)                         # transparent outside India

        buf = io.BytesIO()
        Image.fromarray((rgba * 255).astype(np.uint8)).save(buf, format="PNG")
        _png = buf.getvalue()
    return _png
