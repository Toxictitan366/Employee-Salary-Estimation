# SalaryIQ React frontend

A responsive React + Vite dashboard based on the supplied Google Stitch export. The predictor sends requests to the existing Flask API; model-performance screens use the metrics endpoint.

## 1. Start the Flask backend

In your existing backend terminal, run the command you already use to start Flask. The default frontend API URL is `http://127.0.0.1:5000`.

The backend should provide:
- `GET /health`
- `GET /models/metrics`
- `POST /predict`

If your API uses a different address, create a `.env` file in this frontend folder containing:

```env
VITE_API_URL=http://127.0.0.1:5000
```

Restart Vite after changing `.env`.

## 2. Install and run

Open a terminal in this folder and run:

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Notes

- The salary predictor submits the fields expected by the existing `/predict` route.
- Predicted salary is displayed in USD because the model target is `salary_in_usd`.
- The current dataset does not have education or explicit skills columns; this UI does not ask for them.
- The Stitch HTML contained illustrative values such as R² 0.942, fake confidence intervals, and sample salary distributions. Those are not shown as real metrics. The dashboard uses the known evaluation metrics (Linear Regression MAE $40,002.25 / RMSE $53,229.84 / R² 0.3522; Random Forest MAE $39,398.01 / RMSE $52,829.22 / R² 0.3619) unless the backend metrics endpoint returns updated values.
- Salary Analytics uses real model evaluation metrics only. Charts for salary by geography, seniority, or job title need an aggregate-data endpoint from the backend.
