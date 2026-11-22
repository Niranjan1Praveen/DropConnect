"""Coordinate -> model inputs, using coarse but real Indian geography.

Without live data we still know *where* India floods: big river basins and
deltas, monsoon coasts. And where it rarely does: deserts, high mountains,
plateaus. Each hotspot spreads its influence with a smooth Gaussian falloff,
so neighbouring points blend naturally. These are screening estimates, not
observations.
"""
import math

# (lat, lon, spread in degrees, wetness)  wetness > 0 = flood-prone, < 0 = dry/safe
HOTSPOTS = [
    (26.3, 92.5, 1.6, 1.0),    # Brahmaputra valley, Assam
    (25.9, 86.6, 1.3, 0.95),   # Kosi / north Bihar plains
    (22.3, 88.6, 1.0, 0.9),    # Ganga delta, Sundarbans
    (20.4, 86.3, 0.9, 0.8),    # Mahanadi delta, Odisha
    (10.0, 76.4, 0.9, 0.8),    # Kerala backwaters
    (19.1, 72.9, 0.6, 0.75),   # Mumbai coast
    (16.4, 81.3, 0.9, 0.6),    # Godavari-Krishna delta
    (26.8, 81.0, 1.6, 0.35),   # Ganga plains, UP
    (13.1, 80.2, 0.6, 0.45),   # Chennai coast
    (27.0, 71.0, 2.6, -1.0),   # Thar desert
    (34.2, 77.6, 2.0, -1.0),   # Ladakh high desert
    (31.5, 78.5, 1.6, -0.5),   # Himalayan uplands
    (16.0, 76.3, 2.2, -0.7),   # Deccan plateau interior
    (23.5, 69.8, 1.3, -0.6),   # Kutch
    (22.5, 77.5, 1.6, -0.35),  # Malwa plateau
]


def wetness(lat, lon):
    """Blend of all hotspots at this point, roughly in [-1, 1]."""
    w = sum(s * math.exp(-((lat - a) ** 2 + (lon - b) ** 2) / (2 * r * r)) for a, b, r, s in HOTSPOTS)
    return max(-1.0, min(1.0, w))


def jitter(lat, lon):
    """Small deterministic wobble so the grid doesn't look perfectly smooth."""
    return math.sin(lat * 12.9898 + lon * 78.233) * 0.5  # in [-0.5, 0.5]


def derive(lat, lon, region, season, monsoon, seasonal):
    """Full feature dict for the classifier from coordinates + season."""
    w = wetness(lat, lon) + 0.15 * jitter(lat, lon)
    wet, dry = max(w, 0.0), max(-w, 0.0)

    elevation = max(5.0, 120 + abs(lat - 20) * 18 + dry * 900 - wet * 110)
    rain_24 = max(0.0, 30 * monsoon * seasonal * (1 + 1.4 * wet - 0.85 * dry))
    rain_72 = rain_24 * 2.1 + 15 * seasonal * (1 + wet)
    rain_7d = rain_72 * 1.7 + 25 * seasonal * (1 + wet)

    return {
        "latitude": lat, "longitude": lon, "region": region, "season": season,
        "elevation": elevation,
        "slope_degrees": max(0.5, 2 + elevation / 700),
        "vegetation_index": max(0.05, min(0.95, 0.55 + 0.25 * wet - 0.4 * dry)),
        "water_index": max(0.05, min(0.95, 0.45 + 0.4 * wet - 0.35 * dry)),
        "urban_proximity": max(1.0, 25 - 12 * wet + 20 * dry),
        "rainfall_24h_mm": rain_24, "rainfall_72h_mm": rain_72, "rainfall_7d_mm": rain_7d,
        "soil_moisture_percent": max(5.0, min(100.0, 28 + 0.055 * rain_7d + 30 * wet - 18 * dry)),
        "river_level_m": max(0.1, 1.4 + 0.0075 * rain_72 + 0.9 * monsoon + 3.5 * wet - dry),
        "distance_to_river_km": max(0.3, 8 - 7 * wet + 25 * dry),
        "drainage_capacity": max(0.05, min(0.95, 0.5 - 0.35 * wet + 0.4 * dry)),
        "historical_flood_frequency": max(0, round(0.4 + 2.6 * monsoon + 6 * wet - 2 * dry)),
        "population_density": max(10.0, 800 + 1400 * wet - 700 * dry),
    }
