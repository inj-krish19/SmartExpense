"""
algorithm.py
-------------
AI-powered Expense Recommendation Engine

Features:
✅ Loads sample expense data
✅ Finds top 3 spending categories
✅ Clusters user spending patterns (K-Means)
✅ Predicts next month's expense (Linear Regression)
✅ Generates natural-language recommendations using AI
"""

import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.linear_model import LinearRegression
import matplotlib.pyplot as plt
from datetime import datetime

# -----------------------------
# 1️⃣  SAMPLE DATA (Demo)
# -----------------------------
def get_sample_data():
    data = [
        {"month": 1, "category_name": "Food", "amount": 12000},
        {"month": 1, "category_name": "Rent", "amount": 25000},
        {"month": 1, "category_name": "Entertainment", "amount": 4000},
        {"month": 2, "category_name": "Food", "amount": 13000},
        {"month": 2, "category_name": "Rent", "amount": 25000},
        {"month": 2, "category_name": "Travel", "amount": 8000},
        {"month": 3, "category_name": "Food", "amount": 11000},
        {"month": 3, "category_name": "Rent", "amount": 25000},
        {"month": 3, "category_name": "Shopping", "amount": 10000},
        {"month": 4, "category_name": "Food", "amount": 12500},
        {"month": 4, "category_name": "Rent", "amount": 25000},
        {"month": 4, "category_name": "Entertainment", "amount": 7000},
        {"month": 5, "category_name": "Food", "amount": 11500},
        {"month": 5, "category_name": "Rent", "amount": 25000},
        {"month": 5, "category_name": "Travel", "amount": 9500},
    ]
    return pd.DataFrame(data)


# -----------------------------
# 2️⃣  RULE-BASED RECOMMENDATION
# -----------------------------
def get_top_expense_categories(df, top_n=3):
    grouped = df.groupby("category_name")["amount"].sum().reset_index()
    top = grouped.sort_values("amount", ascending=False).head(top_n)
    print("\n💰 Top Expense Categories:")
    print(top)
    return top


# -----------------------------
# 3️⃣  CLUSTERING (SPENDING PATTERNS)
# -----------------------------
def cluster_spending_patterns(df, n_clusters=3):
    pivot = df.pivot_table(index="month", columns="category_name", values="amount", aggfunc="sum").fillna(0)
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    pivot["cluster"] = kmeans.fit_predict(pivot)
    cluster_summary = pivot.groupby("cluster").mean().round(2)
    print("\n🔹 Cluster Summary (Average Spending per Cluster):")
    print(cluster_summary)
    return cluster_summary, pivot["cluster"]


# -----------------------------
# 4️⃣  FORECASTING (LINEAR REGRESSION)
# -----------------------------
def predict_future_expenses(df):
    monthly_total = df.groupby("month")["amount"].sum().reset_index()
    X = monthly_total["month"].values.reshape(-1, 1)
    y = monthly_total["amount"].values

    model = LinearRegression().fit(X, y)
    next_month = np.array([[monthly_total["month"].max() + 1]])
    predicted_value = model.predict(next_month)[0]

    print(f"\n📈 Predicted Expense for Next Month ({int(next_month[0][0])}): ₹{predicted_value:.2f}")
    return predicted_value



# -----------------------------
# 6️⃣  MAIN FUNCTION
# -----------------------------
def main():
    print("=== 🧠 AI-Powered Expense Recommendation Engine ===\n")
    df = get_sample_data()

    print("📊 Raw Expense Data:")
    print(df)

    # Step 1: Top Categories
    top = get_top_expense_categories(df)

    # Step 2: Clustering
    cluster_summary, labels = cluster_spending_patterns(df)

    # Step 3: Forecasting
    predicted_value = predict_future_expenses(df)

    # Step 4: Prepare Summary for AI
    summary_text = {
        "Top categories": top.to_dict(orient="records"),
        "Cluster summary": cluster_summary.to_dict(),
        "Next month predicted expense": predicted_value,
    }

    # Step 6: Visualize Trend
    monthly = df.groupby("month")["amount"].sum()
    plt.figure(figsize=(8, 4))
    plt.plot(monthly.index, monthly.values, marker="o", color="teal")
    plt.title("Monthly Expense Trend")
    plt.xlabel("Month")
    plt.ylabel("Total Expense (₹)")
    plt.grid(True)
    plt.show()

    # Step 7: Final Output
    print("\n✅ Final Output Summary:")
    print({
        "predicted_next_month": predicted_value,
        "clusters": cluster_summary.to_dict(),
    })


if __name__ == "__main__":
    main()
