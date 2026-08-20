# DropConnect MAP — Research

Technical research behind the machine-learning component of DropConnect's **MAP module**
(`server/MAP/`), which assigns a water-related disaster risk band to a geographic location.

## Contents

| File | What it is |
|---|---|
| `DropConnect_MAP_Research.ipynb` | The full research record — dataset audit, feature justification, modelling experiments, evaluation and deployment notes. Committed with outputs. |

The notebook is the deliverable; it reads its data and model code directly from `server/MAP/`
rather than keeping copies here.

## What this research established

The MAP module shipped with an `XGBRegressor` fitted to a continuous `score` column in
`server/MAP/IndiaGeo.csv`. Auditing that data showed the target was **not predictable from its
inputs**: no feature reached statistical significance against it (all Pearson *p* > 0.05), and the
model's cross-validated R² was *negative* — worse than always predicting the column's mean. The
repository documentation described "XGBoost for Disaster Zone Classification", but the code
contained a regressor and the data contained no class labels at all.

The dataset was assessed as **Category C (inadequate)** and rebuilt around a four-class ordered
target, with a schema chosen from flood-risk literature before any modelling was attempted. The
model was then replaced with a tuned four-class classifier and integrated back into the Flask app.

## Results

| | |
|---|---|
| Task | 4-class classification — Low / Moderate / High / Severe |
| Corpus | 12,000 rows × 19 columns; 18 input features → 28 after engineering |
| Split | Stratified 80/20 (9,600 train / 2,400 test), `random_state=42` |
| Majority baseline | 35.00% |
| Original MAP approach | 52.92% test accuracy |
| Final model | XGBoost, tuned by `RandomizedSearchCV` on training data only |
| Cross-validated accuracy | 81.46% |
| **Final held-out accuracy** | **81.29%** |
| Macro / weighted F1 | 0.8081 / 0.8135 |
| Macro precision / recall | 0.8183 / 0.7997 |
| ROC-AUC (OvR, macro) | 0.9568 |

The test set is scored exactly once, in Section 23. Model and hyperparameter selection use
cross-validation on the training split only.

## Data provenance — read before quoting any number above

The corpus in `server/MAP/IndiaGeo.csv` is **produced by a parametric process, documented in full
in Section 10 of the notebook**. It is *not* collected from gauging stations, satellite products,
meteorological services, field surveys or any disaster authority, and must never be presented as
such.

What the literature in the notebook's *Research Basis for Dataset Features* section justifies is
**which variables belong in the schema and how they relate to one another** — drawn from NDMA, CWC,
NRSC/ISRO, IMD, DST and World Bank material plus two peer-reviewed flood-susceptibility studies.
The **values** are generated.

The practical consequence: the 81.29% figure measures how well the model recovers that documented
process. It is **not** evidence of real-world flood-forecasting skill. Section 31 of the notebook
sets out the full limitations, and Section 32 puts replacing the corpus with observed measurements
first among the follow-ups.

MAP is **decision support for planning volunteer and NGO activity — not an emergency warning
system.** It has no live rainfall, river-gauge or official-advisory integration. Authoritative
disaster advisories always take precedence.

## Running the notebook

From the repository root or from this folder — paths are discovered, not hard-coded, so it runs
from either, and from Jupyter or VS Code:

```bash
jupyter lab research/DropConnect_MAP_Research.ipynb
```

To execute it end to end without opening it:

```bash
jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=1800 research/DropConnect_MAP_Research.ipynb
```

A full run takes roughly 6–10 minutes, most of it in the hyperparameter search (Section 20).

**Requirements:** `pandas`, `numpy`, `scikit-learn`, `xgboost`, `scipy`, `matplotlib`, `seaborn`,
`flask`, `nbformat`. All are already used by the MAP module or its research path — the notebook
prints the exact versions it ran against in Section 5.

**Reproducibility:** every split, estimator and search is seeded (`random_state=42`), and two
clean-kernel runs produced identical results. Residual run-to-run variation is limited to
XGBoost's threaded histogram builder and BLAS threading, which move accuracy by well under half a
percentage point.

Section 7 recovers the pre-research version of `IndiaGeo.csv` from Git history, so the original
dataset audit stays executable without keeping a duplicate copy in the repository.

## How this connects to the application

```
server/MAP/IndiaGeo.csv   ->  model.py  ->  app.py  ->  templates/index.html
     training corpus          classifier    /analyze     Leaflet map (unchanged)
```

The notebook's selected model **is** the deployed model: `model.py` carries the hyperparameters
chosen in Section 20, and Section 30 exercises the live Flask route to confirm the response still
satisfies the front-end's key contract. `templates/` and `static/` were not modified.
