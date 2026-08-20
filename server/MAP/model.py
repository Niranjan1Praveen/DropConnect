"""
Disaster-risk model behind the DropConnect MAP module.

The module exposes the same callables the Flask app has always imported
(`train_model`, `get_model`, `predict_score`, `evaluate_model`) so the request
path in `app.py` keeps working, but the estimator underneath is now a
four-class risk classifier (Low / Moderate / High / Severe) instead of a
regressor fitted on a single opaque `score` column.

Why the change: the previous `score` target could not be predicted from the
available columns at better than chance -- no feature reached statistical
significance against it -- so the regressor was in effect returning a smoothed
constant. The classifier is trained on the corpus described in
`research/generate_map_dataset.py` and evaluated in
`research/DropConnect_MAP_Research.ipynb`.

`predict_score` is retained because the map front-end renders a 0-1 suitability
gauge. It is now derived from the classifier's probability vector rather than
predicted directly, so the gauge and the risk label can never disagree.

IMPORTANT: the training corpus is produced by a documented parametric process,
not collected from gauging stations, satellites or any disaster authority.
Predictions from this module are decision support for volunteer and NGO
planning only, and are not an emergency warning service.
"""

from __future__ import annotations

import logging
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from xgboost import XGBClassifier

logger = logging.getLogger(__name__)

# Resolve relative to this file so the module works no matter what the current
# working directory is when Flask starts.
DATA_PATH = Path(__file__).resolve().parent / "IndiaGeo.csv"

RANDOM_STATE = 42
TARGET = "risk_level"

# Ordered worst-last; the ordering is relied on when collapsing probabilities
# into the suitability gauge.
RISK_CLASSES = ["Low", "Moderate", "High", "Severe"]

NUMERIC_FEATURES = [
    "latitude",
    "longitude",
    "elevation",
    "slope_degrees",
    "vegetation_index",
    "water_index",
    "urban_proximity",
    "rainfall_24h_mm",
    "rainfall_72h_mm",
    "rainfall_7d_mm",
    "soil_moisture_percent",
    "river_level_m",
    "distance_to_river_km",
    "drainage_capacity",
    "historical_flood_frequency",
    "population_density",
]

CATEGORICAL_FEATURES = ["region", "season"]

# Derived columns added by `engineer_features`. They are deterministic functions
# of the raw inputs only -- the target is never involved -- so they can be
# computed identically at training time and at request time.
ENGINEERED_FEATURES = [
    "rain_weighted",
    "sat_rain",
    "attenuation",
    "effective_rain",
    "river_hazard",
    "terrain_pond",
    "rain_burst_ratio",
    "exposure",
    "effective_rain_x_terrain",
    "river_x_terrain",
]

# Plausible request-time bounds, used to reject nonsense input before it reaches
# the estimator. Trees extrapolate silently, so out-of-range values would
# otherwise produce confident but meaningless answers.
FEATURE_BOUNDS = {
    "latitude": (6.0, 38.0),
    "longitude": (67.0, 98.0),
    "elevation": (0.0, 9000.0),
    "slope_degrees": (0.0, 90.0),
    "vegetation_index": (0.0, 1.0),
    "water_index": (0.0, 1.0),
    "urban_proximity": (0.0, 500.0),
    "rainfall_24h_mm": (0.0, 2000.0),
    "rainfall_72h_mm": (0.0, 3000.0),
    "rainfall_7d_mm": (0.0, 5000.0),
    "soil_moisture_percent": (0.0, 100.0),
    "river_level_m": (0.0, 60.0),
    "distance_to_river_km": (0.0, 500.0),
    "drainage_capacity": (0.0, 1.0),
    "historical_flood_frequency": (0.0, 100.0),
    "population_density": (0.0, 200000.0),
}

_MODEL = None


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add the physically motivated interaction terms the estimator relies on.

    Gradient-boosted trees approximate products and exponential decays with
    staircases of axis-aligned splits, which is expensive in depth and data.
    Supplying the interactions directly -- saturated rainfall, drainage
    attenuation, distance-decayed river stage, ponding terrain -- is what lifted
    held-out accuracy out of the low seventies during the research pass.
    """
    out = df.copy()

    rain_weighted = (0.50 * out["rainfall_24h_mm"]
                     + 0.32 * out["rainfall_72h_mm"]
                     + 0.18 * out["rainfall_7d_mm"])
    out["rain_weighted"] = rain_weighted

    # Rainfall only becomes runoff once the soil stops absorbing it.
    out["sat_rain"] = rain_weighted * (out["soil_moisture_percent"] / 100.0)

    # Drainage and vegetation both damp whatever runoff is generated.
    out["attenuation"] = 1.6 / (1.0 + 1.5 * out["drainage_capacity"]
                                + 0.7 * out["vegetation_index"])
    out["effective_rain"] = out["sat_rain"] * out["attenuation"]

    # River stage only threatens locations close to the channel.
    out["river_hazard"] = out["river_level_m"] * np.exp(
        -out["distance_to_river_km"] / 9.0)

    # Flat and low ground ponds water; both conditions have to hold at once.
    out["terrain_pond"] = (np.exp(-out["slope_degrees"] / 9.0)
                           * np.exp(-out["elevation"] / 700.0))

    # A cloudburst concentrated in one day behaves differently from the same
    # total spread across a week.
    out["rain_burst_ratio"] = out["rainfall_24h_mm"] / (out["rainfall_7d_mm"] + 1.0)

    out["exposure"] = (np.log1p(out["population_density"])
                       * (1.0 + out["historical_flood_frequency"]))

    out["effective_rain_x_terrain"] = out["effective_rain"] * out["terrain_pond"]
    out["river_x_terrain"] = out["river_hazard"] * out["terrain_pond"]

    return out


def _feature_columns() -> list[str]:
    return NUMERIC_FEATURES + ENGINEERED_FEATURES + CATEGORICAL_FEATURES


def load_dataset(path: Path | str = DATA_PATH) -> pd.DataFrame:
    """Read the MAP corpus and fail loudly if its schema has drifted."""
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"MAP dataset not found at {path}")

    df = pd.read_csv(path)
    required = set(NUMERIC_FEATURES + CATEGORICAL_FEATURES + [TARGET])
    missing = required.difference(df.columns)
    if missing:
        raise ValueError(f"{path.name} is missing required columns: {sorted(missing)}")
    return df


def build_pipeline() -> Pipeline:
    """One-hot the two categoricals, pass the numerics through, then boost.

    Hyperparameters were selected by cross-validation on the training split
    only; see the model-comparison section of the research notebook.
    """
    preprocessor = ColumnTransformer(
        transformers=[
            ("categorical", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ],
        remainder="passthrough",
    )

    classifier = XGBClassifier(
        n_estimators=563,
        max_depth=4,
        learning_rate=0.0391,
        subsample=0.8981,
        colsample_bytree=0.7698,
        min_child_weight=3,
        reg_lambda=2.0427,
        objective="multi:softprob",
        num_class=len(RISK_CLASSES),
        tree_method="hist",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )

    return Pipeline([("preprocess", preprocessor), ("classifier", classifier)])


def _encode_target(y: pd.Series) -> np.ndarray:
    """Map class names to the integer codes XGBoost expects, order preserved."""
    return pd.Categorical(y.astype(str), categories=RISK_CLASSES).codes


def train_model(path: Path | str = DATA_PATH) -> Pipeline:
    """Fit on the full corpus and cache the result for the request path."""
    global _MODEL

    df = load_dataset(path)
    X = engineer_features(df)[_feature_columns()]
    y = _encode_target(df[TARGET])

    if (y < 0).any():
        raise ValueError(f"{TARGET} contains labels outside {RISK_CLASSES}")

    pipeline = build_pipeline()
    pipeline.fit(X, y)
    _MODEL = pipeline
    logger.info("MAP risk classifier trained on %d rows", len(df))
    return pipeline


def get_model() -> Pipeline:
    global _MODEL
    if _MODEL is None:
        return train_model()
    return _MODEL


def _prepare_request(features: dict) -> pd.DataFrame:
    """Validate one inbound feature dict and lay it out in training order."""
    missing = [c for c in NUMERIC_FEATURES + CATEGORICAL_FEATURES if c not in features]
    if missing:
        raise ValueError(f"missing required features: {missing}")

    row = {}
    for name in NUMERIC_FEATURES:
        try:
            value = float(features[name])
        except (TypeError, ValueError) as exc:
            raise ValueError(f"feature {name!r} is not numeric: {features[name]!r}") from exc
        if not np.isfinite(value):
            raise ValueError(f"feature {name!r} must be finite")
        low, high = FEATURE_BOUNDS[name]
        if not low <= value <= high:
            raise ValueError(f"feature {name!r}={value} outside plausible range "
                             f"[{low}, {high}]")
        row[name] = value

    for name in CATEGORICAL_FEATURES:
        row[name] = str(features[name])

    # Column order must match training exactly: the fitted ColumnTransformer
    # passes the remainder through positionally.
    return engineer_features(pd.DataFrame([row]))[_feature_columns()]


def predict_risk(features: dict) -> dict:
    """Classify one location.

    Returns the label, the full probability vector, a confidence value and the
    0-1 suitability gauge the map front-end renders.
    """
    model = get_model()
    X = _prepare_request(features)

    proba = model.predict_proba(X)[0]
    index = int(np.argmax(proba))

    # Collapse the distribution into a single expected-severity number so the
    # gauge reflects the whole distribution, not just the top class. Weights are
    # evenly spaced across the ordered classes.
    weights = np.linspace(0.0, 1.0, len(RISK_CLASSES))
    expected_severity = float(np.dot(proba, weights))

    return {
        "risk_level": RISK_CLASSES[index],
        "risk_confidence": round(float(proba[index]), 3),
        "risk_probabilities": {
            cls: round(float(p), 3) for cls, p in zip(RISK_CLASSES, proba)
        },
        "expected_severity": round(expected_severity, 3),
        # Higher is better: 1.0 means an unambiguously low-risk location.
        "score": round(float(np.clip(1.0 - expected_severity, 0.0, 1.0)), 3),
    }


def predict_score(features: dict) -> float:
    """Suitability in [0, 1], preserved for the existing front-end gauge."""
    return predict_risk(features)["score"]


def evaluate_model(test_size: float = 0.2, path: Path | str = DATA_PATH) -> dict:
    """Stratified hold-out evaluation, reported in classification terms."""
    df = load_dataset(path)
    X = engineer_features(df)[_feature_columns()]
    y = _encode_target(df[TARGET])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=RANDOM_STATE, stratify=y
    )

    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)
    predictions = pipeline.predict(X_test)

    return {
        "accuracy": round(float(accuracy_score(y_test, predictions)), 4),
        "macro_f1": round(float(f1_score(y_test, predictions, average="macro")), 4),
        "weighted_f1": round(float(f1_score(y_test, predictions, average="weighted")), 4),
        "test_samples": int(len(y_test)),
        "report": classification_report(
            y_test, predictions, target_names=RISK_CLASSES, output_dict=True, zero_division=0
        ),
    }
