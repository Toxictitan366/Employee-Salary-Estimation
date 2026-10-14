
from pathlib import Path
import pandas as pd

# Locate the project directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = PROJECT_ROOT / "data" / "ds_salaries.csv"

# Load dataset
df = pd.read_csv(DATA_PATH)

print("=" * 55)
print("          SALARYIQ - DATA INSPECTION")
print("=" * 55)

# Dataset information
print("\n1. Dataset shape:")
print(df.shape)

print("\n2. Column names:")
print(df.columns.tolist())

print("\n3. Data types:")
print(df.dtypes)

print("\n4. Missing values:")
print(df.isnull().sum())

print("\n5. Duplicate rows:")
print(df.duplicated().sum())

print("\n6. Experience-level distribution:")
print(df["experience_level"].value_counts())

print("\n7. Employment-type distribution:")
print(df["employment_type"].value_counts())

print("\n8. Top 10 job titles:")
print(df["job_title"].value_counts().head(10))

print("\n9. Salary statistics (USD):")
print(df["salary_in_usd"].describe())

print("\n10. Salary by experience level:")
print(
    df.groupby("experience_level")["salary_in_usd"]
    .agg(["count", "mean", "median", "min", "max"])
    .round(2)
)

print("\n11. Company size distribution:")
print(df["company_size"].value_counts())

print("\n" + "=" * 55)
print("INSPECTION COMPLETED")
print("=" * 55)
