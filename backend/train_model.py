
from pathlib import Path

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = PROJECT_ROOT / "data" / "ds_salaries.csv"
REPORTS_DIR = PROJECT_ROOT / "reports"
MODELS_DIR = PROJECT_ROOT / "models"

REPORTS_DIR.mkdir(exist_ok=True)
MODELS_DIR.mkdir(exist_ok=True)

# 1. Load data
df = pd.read_csv(DATA_PATH)

# 2. Remove exact duplicate records
before = len(df)
df = df.drop_duplicates().copy()
print(f"Removed {before - len(df)} exact duplicate rows.")

# 3. Define the target and features
target = "salary_in_usd"

features = [
    "work_year",
    "experience_level",
    "employment_type",
    "job_title",
    "employee_residence",
    "remote_ratio",
    "company_location",
    "company_size",
]

X = df[features]
y = df[target]

# 4. Split before fitting preprocessing to avoid data leakage
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
)

# 5. Identify numerical and categorical columns
numeric_features = ["work_year", "remote_ratio"]

categorical_features = [
    "experience_level",
    "employment_type",
    "job_title",
    "employee_residence",
    "company_location",
    "company_size",
]

# 6. Build preprocessing pipelines
numeric_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler()),
])

categorical_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("encoder", OneHotEncoder(handle_unknown="ignore")),
])

preprocessor = ColumnTransformer([
    ("numeric", numeric_pipeline, numeric_features),
    ("categorical", categorical_pipeline, categorical_features),
])

# 7. Train and compare models
models = {
    "Linear Regression": LinearRegression(),
    "Random Forest": RandomForestRegressor(
        n_estimators=200,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    ),
}

results = []
trained_models = {}

for name, estimator in models.items():
    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("model", estimator),
    ])

    pipeline.fit(X_train, y_train)
    predictions = pipeline.predict(X_test)

    mae = mean_absolute_error(y_test, predictions)
    rmse = mean_squared_error(y_test, predictions) ** 0.5
    r2 = r2_score(y_test, predictions)

    results.append({
        "model": name,
        "MAE_USD": round(mae, 2),
        "RMSE_USD": round(rmse, 2),
        "R2": round(r2, 4),
    })

    trained_models[name] = pipeline

# 8. Print comparison
results_df = pd.DataFrame(results)
print("\nModel comparison:")
print(results_df.to_string(index=False))

# 9. Save the metrics report
results_df.to_csv(
    REPORTS_DIR / "model_metrics.csv",
    index=False,
)

# 10. Save both trained pipelines
import joblib

for name, pipeline in trained_models.items():
    filename = (
        "linear_regression.joblib"
        if name == "Linear Regression"
        else "random_forest.joblib"
    )
    joblib.dump(pipeline, MODELS_DIR / filename)

print("\nTraining completed.")
print("Saved models in:", MODELS_DIR)
print("Saved metrics in:", REPORTS_DIR / "model_metrics.csv")
