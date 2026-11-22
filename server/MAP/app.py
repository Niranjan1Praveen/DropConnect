from flask import Flask, request, jsonify, render_template
import google.generativeai as genai
import json
import logging
import os
import re
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from model import RISK_CLASSES, predict_risk, top_drivers, NUMERIC_FEATURES, CATEGORICAL_FEATURES
from explain import explain
import storage
import geo_features

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Read the key from the environment so no credential is ever committed. With no
# key configured the endpoint still answers: every request simply takes the
# coordinate-derived path below instead of asking Gemini.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")  # server/.env

# Several keys may be listed (comma separated); we use the first one that's set
GEMINI_KEYS = [k.strip() for k in os.environ.get("GEMINI_API_KEYS", os.environ.get("GEMINI_API_KEY", "")).split(",") if k.strip()]
GEMINI_API_KEY = GEMINI_KEYS[0] if GEMINI_KEYS else ""
GEMINI_MODEL = os.environ.get("GEMINI_MODEL") or "gemini-1.5-flash"
gemini_model = None
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel(GEMINI_MODEL)
else:
    logger.warning("GEMINI_API_KEY not set; /analyze will derive features from coordinates.")

# Gemini is only ever asked for the descriptive inputs. The risk decision itself
# is always made by the trained classifier in model.py, so the label the map
# shows cannot drift with prompt wording.
REQUIRED_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES

# Coarse regional boxes, matching the regions the classifier was trained on.
REGION_BOXES = [
    ("Northeast", 24.0, 28.0, 91.0, 96.0),
    ("East", 20.0, 27.0, 85.0, 92.0),
    ("North", 26.0, 32.0, 74.0, 80.0),
    ("West", 18.0, 24.0, 69.0, 76.0),
    ("Central", 21.0, 26.0, 76.0, 84.0),
    ("South", 8.0, 16.0, 74.0, 80.0),
]

RISK_GUIDANCE = {
    "Low": ("Conditions look stable. Suitable for routine volunteering drives "
            "and longer-term water conservation work."),
    "Moderate": ("Some water-stress indicators present. Schedule activities with "
                 "a weather check and keep a contingency plan."),
    "High": ("Elevated water-related risk. Prioritise preparedness work and "
             "confirm conditions with local authorities before deploying teams."),
    "Severe": ("Severe water-related risk indicated. Do not deploy volunteers on "
               "the basis of this screening; defer to official disaster advisories."),
}


def classify_region(lat, lon):
    """Map a coordinate onto one of the regions present in the training data."""
    for name, lat_min, lat_max, lon_min, lon_max in REGION_BOXES:
        if lat_min <= lat <= lat_max and lon_min <= lon <= lon_max:
            return name
    # Fall back to the nearest box centre so the classifier always receives a
    # category it has seen.
    best, best_dist = "Central", float("inf")
    for name, lat_min, lat_max, lon_min, lon_max in REGION_BOXES:
        dist = ((lat - (lat_min + lat_max) / 2) ** 2
                + (lon - (lon_min + lon_max) / 2) ** 2)
        if dist < best_dist:
            best, best_dist = name, dist
    return best


def current_season(month=None):
    """Indian hydrological seasons, as used when building the training corpus."""
    month = month or datetime.now().month
    if month in (3, 4, 5):
        return "Pre-Monsoon"
    if month in (6, 7, 8, 9):
        return "Monsoon"
    if month in (10, 11):
        return "Post-Monsoon"
    return "Winter"


def extract_json_from_text(text):
    """Extract JSON string from Gemini's response text"""
    try:
        # Try to find JSON between ```json ``` markers
        json_match = re.search(r'```json\n(.*?)\n```', text, re.DOTALL)
        if json_match:
            return json_match.group(1)

        # Try to find JSON between ``` markers
        json_match = re.search(r'```(.*?)```', text, re.DOTALL)
        if json_match:
            return json_match.group(1)

        # Try to find standalone JSON
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json_match.group(0)

        return text
    except Exception as e:
        logger.error(f"JSON extraction failed: {str(e)}")
        return text


def get_gemini_features(lat, lon):
    """Ask Gemini for the descriptive inputs only; never for the risk label."""
    if gemini_model is None:
        raise RuntimeError("Gemini not configured")

    prompt = f"""Describe the current environmental conditions at this location in India (Lat: {lat}, Lon: {lon}).
Return ONLY a valid JSON object with these exact keys and units:
{{
    "elevation": (metres above sea level),
    "slope_degrees": (0-90),
    "vegetation_index": (0-1),
    "water_index": (0-1),
    "urban_proximity": (km to nearest urban centre),
    "rainfall_24h_mm": (mm in last 24 hours),
    "rainfall_72h_mm": (mm in last 72 hours),
    "rainfall_7d_mm": (mm in last 7 days),
    "soil_moisture_percent": (0-100),
    "river_level_m": (metres, stage of nearest river),
    "distance_to_river_km": (km to nearest river),
    "drainage_capacity": (0-1, higher means better drainage),
    "historical_flood_frequency": (integer count of notable floods in recent decades),
    "population_density": (people per square km),
    "issues": ["short list of local water-related concerns"]
}}

Important:
- Return ONLY the JSON object
- No additional text or explanations
- All numeric values must be numbers, not strings
- Do not include any risk rating or score"""

    response = gemini_model.generate_content(prompt)
    response_text = response.text if hasattr(response, 'text') else ""
    parsed = json.loads(extract_json_from_text(response_text))

    features = {"latitude": lat, "longitude": lon,
                "region": classify_region(lat, lon), "season": current_season()}
    for key in NUMERIC_FEATURES:
        if key in ("latitude", "longitude"):
            continue
        if key not in parsed:
            raise ValueError(f"Gemini response missing key: {key}")
        features[key] = float(parsed[key])

    issues = parsed.get("issues", [])
    return features, (issues if isinstance(issues, list) else [])


def derive_features_from_coordinates(lat, lon):
    """Deterministic coordinate-based inputs used whenever Gemini is unavailable.

    These are coarse geographic approximations, not observations, and the
    response labels them as such through the `sources` field.
    """
    season = current_season()
    region = classify_region(lat, lon)

    monsoon = {"Northeast": 1.45, "East": 1.25, "South": 1.00,
               "Central": 0.95, "North": 0.85, "West": 0.80}[region]
    seasonal = {"Monsoon": 1.75, "Post-Monsoon": 0.85,
                "Pre-Monsoon": 0.45, "Winter": 0.30}[season]

    # Geography-aware estimate (river basins, deltas, deserts, plateaus)
    features = geo_features.derive(lat, lon, region, season, monsoon, seasonal)
    return features, ["derived from coordinates"]


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/analyze', methods=['POST'])
def analyze():
    lat = lon = None
    try:
        data = request.get_json(silent=True) or {}
        lat = float(data["latitude"])
        lon = float(data["longitude"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "latitude and longitude are required numbers"}), 400

    # India bounds check
    if not (8.0 <= lat <= 37.0 and 68.0 <= lon <= 97.0):
        return jsonify({"error": "Coordinates outside India"}), 400

    # Step 1: gather the descriptive inputs.
    try:
        features, issues = get_gemini_features(lat, lon)
        sources = [f"{GEMINI_MODEL} environmental description"]
    except Exception as e:
        logger.warning(f"Falling back to coordinate-derived features: {e}")
        features, issues = derive_features_from_coordinates(lat, lon)
        sources = ["coordinate-based estimation"]

    # Step 2: the classifier makes the risk decision.
    try:
        prediction = predict_risk(features)
    except Exception as e:
        logger.error(f"Risk prediction failed: {str(e)}")
        return jsonify({"error": "Unable to score this location"}), 500

    # The four original keys are preserved because the map template renders them
    # directly; the risk fields are additive.
    response = {
        "vegetation_index": round(float(features["vegetation_index"]), 3),
        "water_index": round(float(features["water_index"]), 3),
        "elevation": int(round(float(features["elevation"]))),
        "urban_proximity": round(float(features["urban_proximity"]), 1),
        "score": prediction["score"],
        "risk_level": prediction["risk_level"],
        "risk_confidence": prediction["risk_confidence"],
        "risk_probabilities": prediction["risk_probabilities"],
        "issues": issues,
        "recommendation": RISK_GUIDANCE[prediction["risk_level"]],
        "sources": sources + ["DropConnect MAP risk classifier (screening only)"],
    }
    # Step 3: why did the model decide this? SHAP drivers + a Gemini explanation
    try:
        drivers = top_drivers(features)
    except Exception as e:
        logger.warning(f"Driver extraction failed: {e}")
        drivers = []
    response["drivers"] = drivers
    response["explanation"], response["explanation_source"] = explain(gemini_model, prediction, drivers, features)
    response["region"], response["season"] = features["region"], features["season"]

    # Keep every prediction in Mongo so NGOs can turn it into a PDF later
    response["result_id"] = storage.save_result(dict(response), lat, lon)
    return jsonify(response), 200


@app.route('/report/<result_id>', methods=['POST'])
def report(result_id):
    """Render a saved prediction as a PDF and store it in Mongo GridFS."""
    try:
        owner = (request.get_json(silent=True) or {}).get("ownerId")
        report_id = storage.store_pdf(result_id, owner)
    except Exception as e:
        logger.error(f"PDF report failed: {e}")
        return jsonify({"error": "Could not create report"}), 500
    if not report_id:
        return jsonify({"error": "Result not found"}), 404
    return jsonify({"report_id": report_id}), 201


@app.route('/zones', methods=['GET'])
def zones():
    """Risk level for a grid of points across India (feeds the coloured zone layer)."""
    from zones import risk_zones
    try:
        return jsonify({"season": "Dataset", "points": risk_zones()}), 200
    except Exception as e:
        logger.error(f"Zone scoring failed: {e}")
        return jsonify({"error": "Could not compute zones"}), 500


@app.route('/heatmap.png', methods=['GET'])
def heatmap():
    """Smooth green-to-red risk surface clipped to India (Leaflet image overlay)."""
    from heatmap import heatmap_png, BOUNDS
    try:
        resp = app.response_class(heatmap_png(), mimetype="image/png")
        resp.headers["X-Bounds"] = ",".join(map(str, BOUNDS))
        resp.headers["Cache-Control"] = "public, max-age=3600"
        return resp
    except Exception as e:
        logger.error(f"Heatmap failed: {e}")
        return jsonify({"error": "Could not build heatmap"}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "risk_classes": RISK_CLASSES}), 200


if __name__ == '__main__':
    import threading
    from zones import risk_zones
    # Warm up in the background: load/train the model and pre-score the zone grid
    from heatmap import heatmap_png
    threading.Thread(target=lambda: (risk_zones(), heatmap_png()), daemon=True).start()
    app.run(debug=True, port=5003)
