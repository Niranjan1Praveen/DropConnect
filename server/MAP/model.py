import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error

DATA_PATH = "IndiaGeo.csv"

FEATURES = [
    "vegetation_index",
    "water_index",
    "elevation",
    "urban_proximity"
]

TARGET = "score"

# Global in-memory model
_MODEL = None


def train_model():
    global _MODEL

    df = pd.read_csv(DATA_PATH)

    X = df[FEATURES]
    y = df[TARGET]

    model = xgb.XGBRegressor(
        n_estimators=300,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="reg:squarederror",
        random_state=42
    )

    model.fit(X, y)
    _MODEL = model
    return model


def get_model():
    global _MODEL
    if _MODEL is None:
        return train_model()
    return _MODEL


def predict_score(features: dict):
    model = get_model()

    X = pd.DataFrame([{
        "vegetation_index": features["vegetation_index"],
        "water_index": features["water_index"],
        "elevation": features["elevation"],
        "urban_proximity": features["urban_proximity"]
    }])

    score = model.predict(X)[0]
    return round(float(max(0, min(1, score))), 3)


def evaluate_model(test_size=0.2):
    df = pd.read_csv(DATA_PATH)

    X = df[FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42
    )

    model = xgb.XGBRegressor(
        n_estimators=300,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="reg:squarederror",
        random_state=42
    )

    model.fit(X_train, y_train)
    preds = model.predict(X_test)

    return {
        "r2_score": round(float(r2_score(y_test, preds)), 4),
        "rmse": round(float(mean_squared_error(y_test, preds, squared=False)), 4),
        "test_samples": len(X_test)
    }
