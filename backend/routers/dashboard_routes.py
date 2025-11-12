# routers/dashboard_routes.py
import traceback
import pandas as pd
from datetime import datetime
from flask import Blueprint, jsonify, request
from psycopg2.extras import RealDictCursor
from config.db import get_connection
from models.expense_model import get_all_expenses

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/dashboard")

# =========================================================
# =============== HELPER UTILITIES =========================
# =========================================================

def safe_float(value):
    """Safely convert a value to float, returning 0.0 if invalid."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def fetch_dataframe(query, params=()):
    """Run a query and return a pandas DataFrame."""
    conn = None
    try:
        conn = get_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, params)
            rows = cursor.fetchall()
            return pd.DataFrame(rows)
    except Exception as e:
        traceback.print_exc()
        return pd.DataFrame()  # Return empty DataFrame on failure
    finally:
        if conn:
            conn.close()


def aggregate_monthly(df, date_col, value_col):
    """Group by month/year and return total sum."""
    if df.empty:
        return pd.DataFrame(columns=["year", "month", value_col])
    df[date_col] = pd.to_datetime(df[date_col])
    df[value_col] = df[value_col].astype(float)
    df["year"] = df[date_col].dt.year
    df["month"] = df[date_col].dt.month
    grouped = df.groupby(["year", "month"], as_index=False)[value_col].sum()
    return grouped


# =========================================================
# =============== DASHBOARD ROUTES ========================
# =========================================================

@dashboard_bp.route("/summary/<int:user_id>")
def get_summary(user_id):
    """
    Returns monthly cumulative summary of earnings & expenses.
    JSON format:
    {
      "month": 10,
      "year": 2025,
      "summary": [ {year, month, total_earning, total_expenses, cumulative_earning, cumulative_expenses}, ... ]
    }
    """
    try:
        month = int(request.args.get("month") or datetime.now().month)
        year = int(request.args.get("year") or datetime.now().year)

        # Fetch data safely
        earning_df = fetch_dataframe(
            """
            SELECT amount, earning_date 
            FROM earning 
            WHERE user_id = %s AND EXTRACT(YEAR FROM earning_date) = %s
            """,
            (user_id, year)
        )

        expense_df = fetch_dataframe(
            """
            SELECT e.amount, e.expense_date, c.name AS category_name
            FROM expense e
            JOIN category c ON e.cate_id = c.id
            WHERE e.user_id = %s AND EXTRACT(YEAR FROM e.expense_date) = %s
            """,
            (user_id, year)
        )

        # Process data
        earn_group = aggregate_monthly(earning_df, "earning_date", "amount").rename(columns={"amount": "total_earning"})
        exp_group = aggregate_monthly(expense_df, "expense_date", "amount").rename(columns={"amount": "total_expenses"})

        summary = pd.merge(earn_group, exp_group, on=["year", "month"], how="outer").fillna(0)
        summary = summary.sort_values(["year", "month"]).reset_index(drop=True)

        # Add cumulative
        summary["cumulative_earning"] = summary["total_earning"].cumsum()
        summary["cumulative_expenses"] = summary["total_expenses"].cumsum()

        return jsonify({
            "success": True,
            "month": month,
            "year": year,
            "summary": summary.to_dict(orient="records")
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@dashboard_bp.route("/charts/<int:user_id>")
def get_charts(user_id):
    """
    Return JSON for charts:
    - earning_trend (line)
    - expense_trend (line)
    - expense_by_category_pie (monthly category pie for provided month/year)
    - expense_by_category_bar (yearly category bar for provided year)
    - earning_vs_expense (monthly comparison for provided year)
    """
    try:
        # requested month/year (fallback to current)
        month = int(request.args.get("month") or datetime.now().month)
        year = int(request.args.get("year") or datetime.now().year)

        # Fetch year-scoped data (we'll filter for month where needed)
        earning_df = fetch_dataframe(
            """
            SELECT amount, earning_date
            FROM earning
            WHERE user_id = %s AND EXTRACT(YEAR FROM earning_date) = %s
            ORDER BY earning_date ASC
            """,
            (user_id, year)
        )

        expense_df = fetch_dataframe(
            """
            SELECT e.amount, e.expense_date, c.name AS category_name
            FROM expense e
            JOIN category c ON e.cate_id = c.id
            WHERE e.user_id = %s AND EXTRACT(YEAR FROM e.expense_date) = %s
            ORDER BY e.expense_date ASC
            """,
            (user_id, year)
        )

        charts = {}

        # ===== EARNING TREND =====
        if not earning_df.empty:
            earning_df["earning_date"] = pd.to_datetime(earning_df["earning_date"])
            earning_df = earning_df.sort_values("earning_date")
            charts["earning_trend"] = {
                "x": earning_df["earning_date"].dt.strftime("%Y-%m-%d").tolist(),
                "y": earning_df["amount"].astype(float).tolist()
            }
        else:
            charts["earning_trend"] = {"x": [], "y": []}

        # ===== EXPENSE TREND =====
        if not expense_df.empty:
            expense_df["expense_date"] = pd.to_datetime(expense_df["expense_date"])
            expense_df = expense_df.sort_values("expense_date")
            charts["expense_trend"] = {
                "x": expense_df["expense_date"].dt.strftime("%Y-%m-%d").tolist(),
                "y": expense_df["amount"].astype(float).tolist()
            }
        else:
            charts["expense_trend"] = {"x": [], "y": []}

        # ===== EXPENSE BY CATEGORY - MONTHLY PIE =====
        # Filter expense_df for the requested month & year
        if not expense_df.empty:
            expense_month_df = expense_df[
                (expense_df["expense_date"].dt.year == int(year)) &
                (expense_df["expense_date"].dt.month == int(month))
            ]
            if not expense_month_df.empty:
                pie_group = (
                    expense_month_df.groupby("category_name")["amount"]
                    .sum()
                    .reset_index()
                    .sort_values("amount", ascending=False)
                )
                charts["expense_by_category_pie"] = {
                    "x": pie_group["category_name"].tolist(),
                    "y": pie_group["amount"].astype(float).tolist()
                }
            else:
                charts["expense_by_category_pie"] = {"x": [], "y": []}
        else:
            charts["expense_by_category_pie"] = {"x": [], "y": []}

        # ===== EXPENSE BY CATEGORY - YEARLY BAR =====
        # Aggregate expenses for the entire year by category
        if not expense_df.empty:
            bar_group = (
                expense_df.groupby("category_name")["amount"]
                .sum()
                .reset_index()
                .sort_values("amount", ascending=False)
            )
            charts["expense_by_category_bar"] = {
                "x": bar_group["category_name"].tolist(),
                "y": bar_group["amount"].astype(float).tolist()
            }
        else:
            charts["expense_by_category_bar"] = {"x": [], "y": []}

        # ===== EARNING vs EXPENSE (monthly comparison for the requested year) =====
        earn_month = aggregate_monthly(earning_df, "earning_date", "amount") if not earning_df.empty else pd.DataFrame(columns=["year", "month", "amount"])
        exp_month = aggregate_monthly(expense_df, "expense_date", "amount") if not expense_df.empty else pd.DataFrame(columns=["year", "month", "amount"])

        merged = pd.merge(
            earn_month.rename(columns={"amount": "total_earning"}),
            exp_month.rename(columns={"amount": "total_expenses"}),
            on=["year", "month"],
            how="outer"
        ).fillna(0)

        # Ensure months for full year (1..12) are present with zeros if missing
        if merged.empty:
            # create empty months for year
            merged = pd.DataFrame({
                "year": [year] * 12,
                "month": list(range(1, 13)),
                "total_earning": [0.0] * 12,
                "total_expenses": [0.0] * 12
            })
        else:
            # reindex to ensure all months 1..12 appear for the given year
            all_months = pd.DataFrame({"year": [year]*12, "month": list(range(1,13))})
            merged = pd.merge(all_months, merged, on=["year","month"], how="left").fillna(0)
            merged["total_earning"] = merged["total_earning"].astype(float)
            merged["total_expenses"] = merged["total_expenses"].astype(float)

        merged = merged.sort_values(["month"])
        merged["x_label"] = merged.apply(lambda x: f"{int(x['month']):02d}-{int(x['year'])}", axis=1)

        charts["earning_vs_expense"] = {
            "x": merged["x_label"].tolist(),
            "earning": merged["total_earning"].astype(float).tolist(),
            "expenses": merged["total_expenses"].astype(float).tolist()
        }

        return jsonify({"success": True, "charts": charts})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@dashboard_bp.route("/review/<int:user_id>", methods=["GET"])
def review_summary(user_id):
    """
    Returns a summary for the selected year:
    - Earning (salary) per month
    - Total expenses per month
    - Expense breakdown by category for that month
    """
    try:
        import traceback
        year = int(request.args.get("year") or datetime.now().year)

        # Fetch data from DB
        earning_df = fetch_dataframe(
            """
            SELECT amount, earning_date
            FROM earning
            WHERE user_id = %s AND EXTRACT(YEAR FROM earning_date) = %s
            """,
            (user_id, year)
        )

        expense_df = fetch_dataframe(
            """
            SELECT e.amount, e.expense_date, c.name AS category_name
            FROM expense e
            JOIN category c ON e.cate_id = c.id
            WHERE e.user_id = %s AND EXTRACT(YEAR FROM e.expense_date) = %s
            """,
            (user_id, year)
        )

        # Prepare DataFrames
        if not earning_df.empty:
            earning_df["earning_date"] = pd.to_datetime(earning_df["earning_date"])
            earning_df["month"] = earning_df["earning_date"].dt.month
            earning_monthly = (
                earning_df.groupby("month")["amount"].sum().reset_index()
            )
        else:
            earning_monthly = pd.DataFrame(columns=["month", "amount"])

        if not expense_df.empty:
            expense_df["expense_date"] = pd.to_datetime(expense_df["expense_date"])
            expense_df["month"] = expense_df["expense_date"].dt.month

            # Monthly total expenses
            total_expenses = expense_df.groupby("month")["amount"].sum().reset_index()

            # Monthly category breakdown
            category_breakdown = (
                expense_df.groupby(["month", "category_name"])["amount"]
                .sum()
                .reset_index()
            )
        else:
            total_expenses = pd.DataFrame(columns=["month", "amount"])
            category_breakdown = pd.DataFrame(columns=["month", "category_name", "amount"])

        # Merge salary & expenses
        merged = pd.merge(
            earning_monthly.rename(columns={"amount": "earning"}),
            total_expenses.rename(columns={"amount": "total_expenses"}),
            on="month",
            how="outer"
        ).fillna(0)

        summary = []
        for _, row in merged.iterrows():
            month = int(row["month"])
            earning = float(row["earning"])
            total_exp = float(row["total_expenses"])

            # Get category breakdown for this month
            breakdown_df = category_breakdown[category_breakdown["month"] == month]
            category_map = {
                str(cat): float(amt)
                for cat, amt in zip(breakdown_df["category_name"], breakdown_df["amount"])
            }

            summary.append({
                "month": month,
                "earning": earning,
                "total_expenses": total_exp,
                "category_breakdown": category_map
            })

        return jsonify({"success": True, "year": year, "summary": summary}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


# YEARLY EXPENSE COMPARISON ROUTE
@dashboard_bp.route("/yearly-expense/<int:user_id>")
def get_yearly_expense_comparison(user_id):
    try:
        year = int(request.args.get("year") or datetime.now().year)

        # Fetch all expenses with category names
        expense_df = fetch_dataframe(
            """
            SELECT e.amount, e.expense_date, c.name AS category_name
            FROM expense e
            INNER JOIN category c ON e.cate_id = c.id
            WHERE e.user_id = %s
            AND EXTRACT(YEAR FROM e.expense_date) = %s
            """,
            (user_id, year)
        )

        if expense_df.empty:
            return jsonify({
                "success": True,
                "year": year,
                "data": [],
                "message": f"No expense data found for {year}."
            }), 200

        # Convert and group data
        expense_df["expense_date"] = pd.to_datetime(expense_df["expense_date"])
        expense_df["month"] = expense_df["expense_date"].dt.month
        expense_df["amount"] = expense_df["amount"].astype(float)

        monthly_group = (
            expense_df.groupby(["month", "category_name"])["amount"]
            .sum()
            .reset_index()
            .sort_values(["month", "amount"], ascending=[True, False])
        )

        formatted_data = []
        for month in sorted(monthly_group["month"].unique()):
            month_df = monthly_group[monthly_group["month"] == month]

            formatted_data.append({
                "month": int(month),  # ✅ Convert numpy.int32 → native int
                "total_expenses": float(month_df["amount"].sum()),  # ✅ native float
                "categories": [
                    {
                        "name": str(row["category_name"]),
                        "amount": float(row["amount"])  # ✅ convert each amount
                    }
                    for _, row in month_df.iterrows()
                ]
            })

        # ✅ Convert all data to pure Python types before jsonify
        response = {
            "success": True,
            "year": int(year),
            "data": formatted_data
        }

        return jsonify(response), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


# COMPARE TWO MONTHS (EARNING vs EXPENSE)
@dashboard_bp.route("/compare-months/<int:user_id>")
def compare_two_months(user_id):
    """
    Compare total earning and total expenses between two months.
    Query params:
      - month1
      - month2
      - year (optional)
    """
    try:
        year = int(request.args.get("year") or datetime.now().year)
        month1 = int(request.args.get("month1"))
        month2 = int(request.args.get("month2"))

        # Fetch earning and expense for both months
        df = fetch_dataframe(
            """
            SELECT
                'earning' AS type, amount, earning_date AS date
            FROM earning
            WHERE user_id = %s AND EXTRACT(YEAR FROM earning_date) = %s
              AND EXTRACT(MONTH FROM earning_date) IN (%s, %s)
            UNION ALL
            SELECT
                'expense' AS type, amount, expense_date AS date
            FROM expense
            WHERE user_id = %s AND EXTRACT(YEAR FROM expense_date) = %s
              AND EXTRACT(MONTH FROM expense_date) IN (%s, %s)
            """,
            (user_id, year, month1, month2, user_id, year, month1, month2)
        )

        if df.empty:
            return jsonify({"success": True, "data": [], "message": "No data found"}), 200

        df["date"] = pd.to_datetime(df["date"])
        df["month"] = df["date"].dt.month
        df["amount"] = df["amount"].astype(float)

        grouped = df.groupby(["type", "month"])["amount"].sum().reset_index()

        comparison = {
            "months": [month1, month2],
            "earning": [],
            "expense": []
        }
        for m in [month1, month2]:
            e = grouped.query("type == 'earning' and month == @m")["amount"].sum()
            x = grouped.query("type == 'expense' and month == @m")["amount"].sum()
            comparison["earning"].append(float(e))
            comparison["expense"].append(float(x))

        return jsonify({"success": True, "year": year, "comparison": comparison}), 200

        # 💬 Suggested Chart: Bar chart → x: [month1, month2], y: earning & expense bars side-by-side

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


# ==============================
# 📈 2️⃣ CUMULATIVE MONTHLY EXPENSE TREND
# ==============================
@dashboard_bp.route("/cumulative-expenses/<int:user_id>")
def cumulative_month_expense(user_id):
    """
    Returns cumulative expenses month-by-month for a selected year.
    Useful for trend line charts.
    """
    try:
        year = int(request.args.get("year") or datetime.now().year)

        df = fetch_dataframe(
            """
            SELECT amount, expense_date
            FROM expense
            WHERE user_id = %s AND EXTRACT(YEAR FROM expense_date) = %s
            """,
            (user_id, year)
        )

        if df.empty:
            return jsonify({"success": True, "year": year, "data": []}), 200

        df["expense_date"] = pd.to_datetime(df["expense_date"])
        df["month"] = df["expense_date"].dt.month
        df["amount"] = df["amount"].astype(float)

        month_sum = df.groupby("month")["amount"].sum().reset_index()
        month_sum["cumulative"] = month_sum["amount"].cumsum()

        result = {
            "x": month_sum["month"].astype(int).tolist(),
            "y": month_sum["cumulative"].astype(float).tolist()
        }

        return jsonify({"success": True, "year": year, "cumulative_expense": result}), 200

        # 💬 Suggested Chart: Line chart → x: month, y: cumulative_expense (increasing trend)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


# CATEGORY COMPARISON PER MONTH
@dashboard_bp.route("/compare-categories/<int:user_id>")
def compare_expense_categories(user_id):
    """
    Compare expense distribution across months by category.
    """
    try:
        year = int(request.args.get("year") or datetime.now().year)

        df = fetch_dataframe(
            """
            SELECT e.amount, e.expense_date, c.name AS category_name
            FROM expense e
            INNER JOIN category c ON e.cate_id = c.id
            WHERE e.user_id = %s AND EXTRACT(YEAR FROM e.expense_date) = %s
            """,
            (user_id, year)
        )

        if df.empty:
            return jsonify({"success": True, "data": [], "message": "No expenses found"}), 200

        df["expense_date"] = pd.to_datetime(df["expense_date"])
        df["month"] = df["expense_date"].dt.month
        df["amount"] = df["amount"].astype(float)

        grouped = (
            df.groupby(["month", "category_name"])["amount"]
            .sum()
            .reset_index()
            .sort_values(["month", "amount"], ascending=[True, False])
        )

        data = []
        for month in sorted(grouped["month"].unique()):
            month_df = grouped[grouped["month"] == month]
            data.append({
                "month": int(month),
                "categories": [
                    {"name": str(row["category_name"]), "amount": float(row["amount"])}
                    for _, row in month_df.iterrows()
                ]
            })

        return jsonify({"success": True, "year": year, "data": data}), 200

        # 💬 Suggested Chart: Stacked Bar Chart or Grouped Bar Chart
        # x: month, y: amount, color/group by category_name

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


# ==============================
# 📉 4️⃣ TOP CATEGORIES OVER YEAR
# ==============================
@dashboard_bp.route("/top-categories/<int:user_id>")
def get_top_expense_categories(user_id):
    """
    Returns top 5 categories with the highest total expense in a year.
    """
    try:
        year = int(request.args.get("year") or datetime.now().year)

        df = fetch_dataframe(
            """
            SELECT e.amount, c.name AS category_name
            FROM expense e
            INNER JOIN category c ON e.cate_id = c.id
            WHERE e.user_id = %s AND EXTRACT(YEAR FROM e.expense_date) = %s
            """,
            (user_id, year)
        )

        if df.empty:
            return jsonify({"success": True, "data": []}), 200

        df["amount"] = df["amount"].astype(float)
        top_cats = (
            df.groupby("category_name")["amount"]
            .sum()
            .reset_index()
            .sort_values("amount", ascending=False)
            .head(5)
        )

        result = {
            "x": top_cats["category_name"].tolist(),
            "y": top_cats["amount"].astype(float).tolist()
        }

        return jsonify({"success": True, "year": year, "top_categories": result}), 200

        # 💬 Suggested Chart: Horizontal Bar Chart → x: amount, y: category_name

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@dashboard_bp.route("/expense-alerts/<int:user_id>")
def expense_alerts(user_id):
    """
    Returns months where expenses exceeded earnings.
    """
    try:
        year = int(request.args.get("year") or datetime.now().year)

        earning_df = fetch_dataframe(
            """
            SELECT amount, earning_date
            FROM earning
            WHERE user_id = %s AND EXTRACT(YEAR FROM earning_date) = %s
            """,
            (user_id, year)
        )

        expense_df = fetch_dataframe(
            """
            SELECT amount, expense_date
            FROM expense
            WHERE user_id = %s AND EXTRACT(YEAR FROM expense_date) = %s
            """,
            (user_id, year)
        )

        earn_group = aggregate_monthly(earning_df, "earning_date", "amount").rename(columns={"amount": "total_earning"})
        exp_group = aggregate_monthly(expense_df, "expense_date", "amount").rename(columns={"amount": "total_expenses"})

        summary = pd.merge(earn_group, exp_group, on=["year", "month"], how="outer").fillna(0)

        alerts = []
        for _, row in summary.iterrows():
            if row["total_expenses"] > row["total_earning"]:
                alerts.append({
                    "year": int(row["year"]),
                    "month": int(row["month"]),
                    "total_earning": float(row["total_earning"]),
                    "total_expenses": float(row["total_expenses"])
                })

        return jsonify({"success": True, "year": year, "alerts": alerts}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500
    
@dashboard_bp.route("/average-expense/<int:user_id>")
def average_monthly_expense(user_id):
    """
    Returns the average monthly expense for the selected year.
    """
    try:
        year = int(request.args.get("year") or datetime.now().year)

        expense_df = fetch_dataframe(
            """
            SELECT amount, expense_date
            FROM expense
            WHERE user_id = %s AND EXTRACT(YEAR FROM expense_date) = %s
            """,
            (user_id, year)
        )

        if expense_df.empty:
            return jsonify({"success": True, "year": year, "average_monthly_expense": 0.0}), 200

        expense_df["expense_date"] = pd.to_datetime(expense_df["expense_date"])
        expense_df["month"] = expense_df["expense_date"].dt.month
        expense_df["amount"] = expense_df["amount"].astype(float)

        monthly_sum = expense_df.groupby("month")["amount"].sum().reset_index()
        average_expense = monthly_sum["amount"].mean()

        return jsonify({"success": True, "year": year, "average_monthly_expense": float(average_expense)}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500
    
@dashboard_bp.route("/predicted-expense/<int:user_id>")
def predict_expense(user_id):
    """
    Returns predicted expense for the selected year's all month based on linear regression of past monthly existing expense.
    and also do this prediction based on the salary of the month and dont find then take average salary of the year and predict based on that.
    """
    try:
        from sklearn.linear_model import LinearRegression
        import numpy as np
        year = int(request.args.get("year") or datetime.now().year)

        expense_df = fetch_dataframe(
            """
            SELECT amount, expense_date
            FROM expense
            WHERE user_id = %s AND EXTRACT(YEAR FROM expense_date) = %s
            """,
            (user_id, year)
        )

        if expense_df.empty:
            return jsonify({"success": True, "year": year, "predicted_expenses": []}), 200

        expense_df["expense_date"] = pd.to_datetime(expense_df["expense_date"])
        expense_df["month"] = expense_df["expense_date"].dt.month
        expense_df["amount"] = expense_df["amount"].astype(float)

        monthly_sum = expense_df.groupby("month")["amount"].sum().reset_index()

        # Prepare data for linear regression
        X = monthly_sum["month"].values.reshape(-1, 1)
        y = monthly_sum["amount"].values

        model = LinearRegression()
        model.fit(X, y)

        earnings = fetch_dataframe(
            """
            SELECT amount, earning_date
            FROM earning
            WHERE user_id = %s AND EXTRACT(YEAR FROM earning_date) = %s
            """,
            (user_id, year)
        )

        if not earnings.empty:
            earnings["earning_date"] = pd.to_datetime(earnings["earning_date"])
            earnings["month"] = earnings["earning_date"].dt.month
            earnings["amount"] = earnings["amount"].astype(float)

            monthly_earnings = earnings.groupby("month")["amount"].sum().reset_index()
            avg_salary = monthly_earnings["amount"].mean()
        else:
            avg_salary = 0.0
        
        # Predict expenses for all 12 months
        predicted_expenses = []
        for month in range(1, 13):
            predicted = model.predict(np.array([[month]]))[0]
            # Adjust prediction based on average salary
            if avg_salary > 0:
                predicted = min(predicted, avg_salary * 0.8)  # Assume expenses should not exceed 80% of salary
            predicted_expenses.append(predicted)

        return jsonify({
            "success": True,
            "year": year,
            "expenses": monthly_sum.set_index("month")["amount"].to_dict(),
            "predicted_expenses": [float(pred) for pred in predicted_expenses]
        }), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500
    
@dashboard_bp.route("/recommented-categories/<int:user_id>")
def recommend_categories(user_id):
    """
    Returns recommended categories for the selected year based on k cluster analysis of past expenses of 3 months 
    on last month * 60, last 2 months * 25, last 3 months * 15.
    """
    try:
        from sklearn.cluster import KMeans
        import numpy as np

        year = int(request.args.get("year") or datetime.now().year)

        expense_df = fetch_dataframe(
            """
            SELECT amount, expense_date, cate_id
            FROM expense
            WHERE user_id = %s AND EXTRACT(YEAR FROM expense_date) = %s
            """,
            (user_id, year)
        )

        if expense_df.empty:
            return jsonify({"success": True, "year": year, "recommended_categories": []}), 200

        expense_df["expense_date"] = pd.to_datetime(expense_df["expense_date"])
        expense_df["month"] = expense_df["expense_date"].dt.month
        expense_df["amount"] = expense_df["amount"].astype(float)

        monthly_sum = expense_df.groupby(["month", "cate_id"])["amount"].sum().reset_index()

        # Prepare data for k-means clustering
        last_month = monthly_sum[monthly_sum["month"] == 12]
        last_2_months = monthly_sum[monthly_sum["month"].isin([11, 12])].groupby("cate_id")["amount"].sum().reset_index()
        last_3_months = monthly_sum[monthly_sum["month"].isin([10, 11, 12])].groupby("cate_id")["amount"].sum().reset_index()

        merged = pd.merge(last_month, last_2_months, on="cate_id", how="outer", suffixes=('_1', '_2'))
        merged = pd.merge(merged, last_3_months, on="cate_id", how="outer")
        merged.rename(columns={"amount": "amount_3"}, inplace=True)
        merged.fillna(0, inplace=True)

        # Weights: last month * 60, last 2 months * 25, last 3 months * 15
        X = merged[["amount_1", "amount_2", "amount_3"]].values
        weights = np.array([60, 25, 15])
        X_weighted = X * weights

        kmeans = KMeans(n_clusters=3, random_state=0).fit(X_weighted)
        merged["cluster"] = kmeans.labels_

        # Get categories from the cluster with highest average expense
        cluster_means = merged.groupby("cluster")[["amount_1", "amount_2", "amount_3"]].mean().sum(axis=1)
        top_cluster = cluster_means.idxmax()
        recommended_categories = merged[merged["cluster"] == top_cluster]["cate_id"].tolist()

        category_names = fetch_dataframe(
            """
            SELECT id, name
            FROM category
            WHERE id = ANY(%s)
            """,
            (recommended_categories,)
        )

        return jsonify({
            "success": True,
            "year": year,
            "recommended_categories": category_names["name"].tolist()
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500