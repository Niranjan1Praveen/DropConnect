"""Plain-language explanations of the risk model's output.

The classifier makes the decision; Gemini only *explains* it in words an NGO
coordinator can act on. If Gemini is unavailable we fall back to a template.
"""
import logging

log = logging.getLogger(__name__)

# Friendly names for the model's raw column names
LABELS = {
    "rainfall_24h_mm": "rain in the last 24h", "rainfall_72h_mm": "rain in the last 3 days",
    "rainfall_7d_mm": "rain in the last week", "river_level_m": "river level",
    "distance_to_river_km": "distance to the river", "drainage_capacity": "drainage capacity",
    "soil_moisture_percent": "soil moisture", "historical_flood_frequency": "past flood frequency",
    "elevation": "elevation", "slope_degrees": "slope", "population_density": "population density",
    "river_x_terrain": "high river on low-lying ground", "exposure": "people exposed to flooding",
    "river_hazard": "river hazard", "terrain_pond": "terrain where water pools",
}
nice = lambda f: LABELS.get(f, f.replace("_", " "))


def fallback(pred, drivers):
    """Template explanation used when Gemini can't be reached."""
    up = [nice(d["feature"]) for d in drivers if d["impact"] > 0][:3]
    down = [nice(d["feature"]) for d in drivers if d["impact"] < 0][:2]
    text = f"The model rates this area {pred['risk_level']} risk ({pred['risk_confidence']:.0%} confident)."
    if up:
        text += f" The main factors raising the risk are {', '.join(up)}."
    if down:
        text += f" {', '.join(down).capitalize()} help keep it lower."
    return text


def explain(model, pred, drivers, features):
    """Ask Gemini for a short explanation; never raises."""
    if model is None:
        return fallback(pred, drivers), "template"

    driver_lines = "\n".join(
        f"- {nice(d['feature'])} = {d['value']} (impact {d['impact']:+.2f})" for d in drivers)
    prompt = f"""You explain a machine-learning flood-risk prediction to an NGO volunteer coordinator in India.

Prediction: {pred['risk_level']} risk, confidence {pred['risk_confidence']:.0%}.
Class probabilities: {pred['risk_probabilities']}
Region: {features.get('region')}, season: {features.get('season')}
Top drivers (positive impact pushed TOWARDS this risk level, negative pushed away):
{driver_lines}

Write 3-4 short sentences in plain English:
1. What the risk level means for this place.
2. Why the model thinks so, citing the top 2-3 drivers in everyday words.
3. One practical suggestion for planning volunteer work here.
Do not change or second-guess the risk level. No markdown, no bullet points."""
    try:
        text = model.generate_content(prompt).text.strip()
        return text, "gemini"
    except Exception as e:
        log.warning(f"Gemini explanation failed, using template: {e}")
        return fallback(pred, drivers), "template"
