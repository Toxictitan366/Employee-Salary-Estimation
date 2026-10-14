
from pathlib import Path

import joblib
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)

# Allow your friend's local React development server.
CORS(
    app,
    resources={
        r"/*": {
            "origins": ["http://localhost:5173"]
        }
    }
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = PROJECT_ROOT / "models" / "random_forest.joblib"
METRICS_PATH = PROJECT_ROOT / "reports" / "model_metrics.csv"

FEATURES = [
    "work_year",
    "experience_level",
    "employment_type",
    "job_title",
    "employee_residence",
    "remote_ratio",
    "company_location",
    "company_size",
]


@app.get("/")
def home():
    return jsonify({
        "project": "SalaryIQ",
        "status": "success",
        "message": "Salary prediction API is running"
    })


@app.get("/health")
def health():
    return jsonify({"status": "healthy"})


@app.get("/models/metrics")
def model_metrics():
    if not METRICS_PATH.exists():
        return jsonify({"error": "Model metrics not found"}), 404

    metrics = pd.read_csv(METRICS_PATH)
    return jsonify(metrics.to_dict(orient="records"))


@app.post("/predict")
def predict():
    if not MODEL_PATH.exists():
        return jsonify({"error": "Trained model not found"}), 500

    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        return jsonify({"error": "Send a valid JSON object"}), 400

    missing = [feature for feature in FEATURES
               if feature not in payload]

    if missing:
        return jsonify({
            "error": "Missing required fields",
            "missing_fields": missing
        }), 400

    try:
        row = {feature: payload[feature] for feature in FEATURES}
        input_df = pd.DataFrame([row])

        # Validate numeric features.
        input_df["work_year"] = pd.to_numeric(
            input_df["work_year"], errors="raise"
        )
        input_df["remote_ratio"] = pd.to_numeric(
            input_df["remote_ratio"], errors="raise"
        )

        if input_df.isnull().any().any():
            return jsonify({
                "error": "Input fields cannot be empty"
            }), 400

        if not input_df["work_year"].between(2020, 2030).all():
            return jsonify({"error": "Invalid work year"}), 400

        if not input_df["remote_ratio"].isin([0, 50, 100]).all():
            return jsonify({
                "error": "remote_ratio must be 0, 50, or 100"
            }), 400

        if not input_df["experience_level"].isin(
            ["EN", "MI", "SE", "EX"]
        ).all():
            return jsonify({
                "error": "experience_level must be EN, MI, SE, or EX"
            }), 400

        if not input_df["employment_type"].isin(
            ["FT", "PT", "CT", "FL"]
        ).all():
            return jsonify({
                "error": "employment_type must be FT, PT, CT, or FL"
            }), 400

        if not input_df["company_size"].isin(
            ["S", "M", "L"]
        ).all():
            return jsonify({
                "error": "company_size must be S, M, or L"
            }), 400

        model = joblib.load(MODEL_PATH)
        predicted_usd = float(model.predict(input_df)[0])

        # This model predicts the standardized USD target.
        # INR conversion will be added as a separate,
        # explicitly configured step.
        return jsonify({
            "predicted_salary_usd": round(predicted_usd, 2),
            "currency": "USD",
            "model": "Random Forest",
            "note": (
                "Estimate based on historical international "
                "data-science salary records."
            )
        })

    except (TypeError, ValueError) as exc:
        return jsonify({
            "error": "Invalid input",
            "details": str(exc)
        }), 400


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
