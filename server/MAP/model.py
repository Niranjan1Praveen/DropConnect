import pandas as pd
import xgboost as xgb
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error

DATA_PATH = "IndiaGeo.csv"
MODEL_PATH = "xgb_model.joblib"

FEATURES = [
    "vegetation_index",
    "water_index",
    "elevation",
    "urban_proximity"
]

TARGET = "score"


def train_and_save_model():
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
    joblib.dump(model, MODEL_PATH)
    return model


def load_model():
    if not os.path.exists(MODEL_PATH):
        return train_and_save_model()
    return joblib.load(MODEL_PATH)


def predict_score(features: dict):
    model = load_model()

    X = pd.DataFrame([{
        "vegetation_index": features["vegetation_index"],
        "water_index": features["water_index"],
        "elevation": features["elevation"],
        "urban_proximity": features["urban_proximity"]
    }])

    score = model.predict(X)[0]
    return round(float(max(0, min(1, score))), 3)


def evaluate_model(test_size=0.2):
    """
    Returns objective regression metrics.
    """
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

    r2 = r2_score(y_test, preds)
    rmse = mean_squared_error(y_test, preds, squared=False)

    return {
        "r2_score": round(float(r2), 4),
        "rmse": round(float(rmse), 4),
        "test_samples": len(X_test)
    }
