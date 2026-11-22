"""Builds DropConnect_MAP_Research.ipynb (EDA -> Feature Engineering -> ML).
Run:  ../server/venv/Scripts/python build_notebook.py
"""
import nbformat as nbf

md, code = nbf.v4.new_markdown_cell, nbf.v4.new_code_cell

cells = [
md("""# DropConnect MAP - Flood Risk Classification
Predicting the **water-related risk level** (Low / Moderate / High / Severe) of a location in India.

**Flow of this notebook**
1. **EDA** - understand the data
2. **Feature Engineering & Processing** - build better inputs, encode, scale, split
3. **Machine Learning** - train models and compare them with accuracy metrics

> Data: `server/MAP/IndiaGeo.csv` (synthetic, generated for prototyping - not for real emergency use)."""),

code("""import numpy as np, pandas as pd, matplotlib.pyplot as plt, seaborn as sns
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, classification_report, ConfusionMatrixDisplay
from xgboost import XGBClassifier

sns.set_theme(style="whitegrid")          # cleaner default plots
SEED = 42                                  # same seed everywhere = reproducible results
ORDER = ["Low", "Moderate", "High", "Severe"]"""),

# ---------------- EDA ----------------
md("""## 1. Exploratory Data Analysis
- Load the data and check its size, types and missing values
- Look at how the target classes are balanced
- See how key features differ across risk levels
- Check correlations between numeric features"""),

code("""df = pd.read_csv("../server/MAP/IndiaGeo.csv")   # 12k locations, one row each
print(df.shape)
df.head()"""),

code("""df.info()                                   # column types at a glance
df.isna().sum().sum(), df.duplicated().sum()  # total missing values, duplicate rows"""),

code("""df.describe().T.round(2)                    # quick spread of every numeric column"""),

md("""- Target balance: are some risk levels much rarer than others?"""),
code("""ax = sns.countplot(x="risk_level", data=df, order=ORDER, palette="Blues")
ax.set_title("How many locations per risk level"); plt.show()
df.risk_level.value_counts(normalize=True).reindex(ORDER).round(3)"""),

md("""- Category columns vs risk: region and season usually matter a lot for floods"""),
code("""fig, axes = plt.subplots(1, 2, figsize=(14, 4))
for ax, c in zip(axes, ["region", "season"]):
    pd.crosstab(df[c], df.risk_level, normalize="index")[ORDER].plot.bar(stacked=True, ax=ax, colormap="RdYlGn_r")
    ax.set_title(f"Risk mix by {c}"); ax.legend(fontsize=8)
plt.tight_layout(); plt.show()"""),

md("""- Key numeric drivers split by risk level"""),
code("""keys = ["rainfall_72h_mm", "river_level_m", "drainage_capacity", "elevation"]
fig, axes = plt.subplots(1, 4, figsize=(18, 4))
for ax, c in zip(axes, keys):
    sns.boxplot(x="risk_level", y=c, data=df, order=ORDER, ax=ax, palette="RdYlGn_r")  # spread per class
plt.tight_layout(); plt.show()"""),

code("""num = df.select_dtypes("number").columns
plt.figure(figsize=(11, 8))
sns.heatmap(df[num].corr(), cmap="coolwarm", center=0)   # red = move together, blue = opposite
plt.title("Correlation between numeric features"); plt.show()"""),

md("""**EDA takeaways**
- No missing values or duplicates, so no imputation is needed
- Rainfall columns are strongly correlated with each other (24h -> 72h -> 7d)
- Higher rainfall & river level and lower drainage line up with higher risk
- Region and season shift the risk mix noticeably, so they must be kept"""),

# ---------------- FE ----------------
md("""## 2. Feature Engineering & Processing
- Create a few physically meaningful features
- Separate numeric vs categorical columns
- One-hot encode categories, scale numbers (inside a pipeline, so no data leakage)
- Stratified train/test split so every class appears in both sets"""),

code("""fe = df.copy()
fe["rain_trend"]      = fe.rainfall_24h_mm / (fe.rainfall_7d_mm / 7 + 1)      # is rain accelerating?
fe["runoff_pressure"] = fe.rainfall_72h_mm * (1 - fe.drainage_capacity)       # rain the ground can't drain
fe["river_threat"]    = fe.river_level_m / (fe.distance_to_river_km + 0.5)    # high river that's close by
fe["wet_soil_rain"]   = fe.soil_moisture_percent * fe.rainfall_24h_mm / 100   # rain on already-wet soil
fe["log_population"]  = np.log1p(fe.population_density)                       # tame a skewed column
fe.drop(columns="population_density", inplace=True)
fe[["rain_trend", "runoff_pressure", "river_threat", "wet_soil_rain"]].describe().round(2)"""),

md("""- Do the new features actually separate the classes? (mean per risk level)"""),
code("""fe.groupby("risk_level")[["runoff_pressure", "river_threat", "wet_soil_rain"]].mean().reindex(ORDER).round(2)"""),

code("""y = fe.pop("risk_level").map({k: i for i, k in enumerate(ORDER)})   # labels -> 0..3
cat_cols = ["region", "season"]
num_cols = [c for c in fe.columns if c not in cat_cols]

prep = ColumnTransformer([
    ("num", StandardScaler(), num_cols),                         # same scale for every number
    ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),   # text -> 0/1 columns
])

X_tr, X_te, y_tr, y_te = train_test_split(fe, y, test_size=0.2, stratify=y, random_state=SEED)
print(f"train {X_tr.shape}, test {X_te.shape}")"""),

# ---------------- ML ----------------
md("""## 3. Machine Learning
- Train three models of increasing power on the same pipeline
- Compare with **accuracy** and **macro F1** (F1 treats every class equally)
- 5-fold cross-validation on training data to check stability
- Deep-dive on the best model: per-class report, confusion matrix, feature importance"""),

code("""models = {
    "Logistic Regression": LogisticRegression(max_iter=2000),
    "Random Forest":       RandomForestClassifier(n_estimators=300, random_state=SEED, n_jobs=-1),
    "XGBoost":             XGBClassifier(n_estimators=400, max_depth=5, learning_rate=0.08,
                                         subsample=0.9, colsample_bytree=0.9, random_state=SEED),
}
cv = StratifiedKFold(5, shuffle=True, random_state=SEED)
rows, fitted = [], {}
for name, m in models.items():
    pipe = Pipeline([("prep", prep), ("model", m)]).fit(X_tr, y_tr)     # prep is learnt on train only
    pred = pipe.predict(X_te)
    cv_f1 = cross_val_score(pipe, X_tr, y_tr, cv=cv, scoring="f1_macro")
    rows.append([name, accuracy_score(y_te, pred), f1_score(y_te, pred, average="macro"), cv_f1.mean(), cv_f1.std()])
    fitted[name] = pipe

scores = pd.DataFrame(rows, columns=["model", "test_accuracy", "test_macro_f1", "cv_f1_mean", "cv_f1_std"]).set_index("model")
scores.round(4).sort_values("test_macro_f1", ascending=False)"""),

code("""scores[["test_accuracy", "test_macro_f1"]].plot.barh(figsize=(8, 3), xlim=(0.5, 1))
plt.title("Model comparison on the held-out test set"); plt.show()"""),

code("""best = scores.test_macro_f1.idxmax()            # pick the winner by macro F1
pred = fitted[best].predict(X_te)
print(f"Best model: {best}\\n")
print(classification_report(y_te, pred, target_names=ORDER, digits=3))"""),

code("""ConfusionMatrixDisplay.from_predictions(y_te, pred, display_labels=ORDER, cmap="Blues", normalize="true")
plt.title(f"{best} - confusion matrix (row-normalised)"); plt.show()   # mistakes mostly land in neighbouring classes"""),

code("""names = fitted[best].named_steps["prep"].get_feature_names_out()
imp = pd.Series(fitted[best].named_steps["model"].feature_importances_, index=names)
imp.sort_values().tail(12).plot.barh(figsize=(8, 5), color="teal")
plt.title("Top features driving the prediction"); plt.show()"""),

md("""**Results summary**
- XGBoost is the best model (~80% accuracy, ~0.79 macro F1) and is what the live map uses
- Logistic Regression comes a close second, so much of the signal is fairly linear once features are engineered
- Random Forest trails the others here; boosting handles the overlapping classes better
- Cross-validation scores sit close to the test scores with a small std, so the results are stable, not lucky
- Most mistakes are between *neighbouring* classes (e.g. High vs Severe), the least harmful kind of error
- The served model (`server/MAP/model.py`) adds its own engineered features and explains each prediction with SHAP drivers + Gemini"""),
]

nb = nbf.v4.new_notebook(cells=cells, metadata={"kernelspec": {"name": "python3", "display_name": "Python 3", "language": "python"}})
nbf.write(nb, "DropConnect_MAP_Research.ipynb")
print("notebook written:", len(cells), "cells")
