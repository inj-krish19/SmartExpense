from flask import Blueprint, request, jsonify
import pandas as pd
import datetime
from models.expense_model import insert_expense, get_all_expenses, delete_expenses

expense_bp = Blueprint("expense", __name__, url_prefix="/expense")


@expense_bp.route("/all", methods=["POST"])
def all_expenses():
    """
    Fetch all expenses
    """
    try:
        data = request.get_json()

        user_id = data.get("user_id") 
        if not user_id:
            return jsonify({"success": False, "message": "Please send the user id"}), 401
            
        expenses = get_all_expenses(user_id)
        return jsonify({"success": True, "expenses": expenses}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# @expense_bp.route("/delete")
# def delete_expenses():

#     month = int( request.args.get("month") or datetime.datetime.now().month )
#     year = int( request.args.get("year") or datetime.datetime.now().year )

#     try:
#         expenses = delete_expenses()
#         return jsonify({"success": True, "expenses": expenses}), 200
#     except Exception as e:
#         return jsonify({"success": False, "error": str(e)}), 500

@expense_bp.route("/monthly", methods=["POST"])
def monthly_expenses():
    """
    Fetch all expenses
    """
    try:

        data = request.get_json()

        user_id = data.get("user_id")
        if not user_id:
            return jsonify({"success": False, "message": "Please send the user id"}), 401
        
        expenses = get_all_expenses(user_id)
        df = pd.DataFrame({
            'date': pd.to_datetime([exp['expense_date'] for exp in expenses]),
            'amount': [float(exp['amount']) for exp in expenses]
        })

        # Extract month and year
        df['month'] = df['date'].dt.month
        df['year'] = df['date'].dt.year

        # Group by year & month and sum amounts
        monthly_sum = df.groupby(['year', 'month'])['amount'].sum().reset_index()

        # Prepare response
        result = []
        for _, row in monthly_sum.iterrows():
            result.append({
                "year": int(row['year']),
                "month": int(row['month']),
                "total_amount": float(row['amount'])
            })

        return jsonify({"success": True, "expenses": result}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@expense_bp.route("/add_bulk", methods=["POST"])
def add_bulk_expenses():
    """
    Insert multiple expenses at once
    Expect JSON: { user_id: int, expenses: [{cate_id, amount, expense_date}, ...] }
    """
    try:
        data = request.get_json()
        user_id = data.get("user_id")
        expenses = data.get("expenses")

        print(user_id, expenses)

        if not user_id:
            return jsonify({"success": False, "error": "user_id is required"}), 400
        if not expenses or not isinstance(expenses, list):
            return jsonify({"success": False, "error": "expenses must be a non-empty list"}), 400

        inserted = []
        for exp in expenses:
            cate_id = exp.get("cate_id")
            amount = exp.get("amount")
            expense_date = exp.get("expense_date")

            print(cate_id, amount, expense_date)
            if not cate_id or not user_id or not amount or not expense_date:
                print({"success": False, "error": "All fields required for each expense"})
                print(cate_id, amount, expense_date)

                return jsonify({"success": False, "error": "All fields required for each expense"}), 400

            expense_date = str(expense_date)
            inserted_row = insert_expense(cate_id, user_id, amount, expense_date)
            inserted.append(inserted_row)

        return jsonify({"success": True, "inserted": inserted}), 201

    except Exception as e:
        print({"success": False, "error": str(e)})
        return jsonify({"success": False, "error": str(e)}), 500


@expense_bp.route("/by_month", methods=["GET"])
def expenses_by_month():
    try:
        user_id = request.args.get("user_id", type=int)
        month = request.args.get("month", type=int)
        year = request.args.get("year", type=int)

        if not user_id or not month or not year:
            return jsonify({"success": False, "error": "user_id, month, and year are required"}), 400

        from config.db import get_connection
        from psycopg2.extras import RealDictCursor

        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            SELECT e.id, e.amount, e.expense_date, e.created_at,
                   c.name AS category_name, c.id AS cate_id
            FROM expense e
            JOIN category c ON e.cate_id = c.id
            WHERE EXTRACT(MONTH FROM e.expense_date) = %s
              AND EXTRACT(YEAR FROM e.expense_date) = %s
            ORDER BY e.expense_date ASC;
        """, (month, year))

        expenses = cursor.fetchall()
        conn.close()

        return jsonify({"success": True, "expenses": expenses}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    
@expense_bp.route("/delete", methods=["GET", "DELETE"])
def delete_expenses_route():
    """
    GET     → Preview the expenses that will be deleted
    DELETE  → Delete all expenses for given month/year
    Query Params: ?user_id=1&month=1&year=2025
    """
    try:
        user_id = request.args.get("user_id", type=int)
        month = request.args.get("month", type=int)
        year = request.args.get("year", type=int)

        if not user_id:
            return jsonify({"success": False, "error": "user_id is required"}), 400

        # Defaults
        if not month:
            month = datetime.datetime.now().month
        if not year:
            year = datetime.datetime.now().year

        from config.db import get_connection
        from psycopg2.extras import RealDictCursor

        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # First fetch the rows of this month/year
        cursor.execute("""
            SELECT e.id, e.amount, e.expense_date, e.created_at,
                   c.name AS category_name, c.id AS cate_id
            FROM expense e
            JOIN category c ON e.cate_id = c.id
            WHERE e.user_id = %s
              AND EXTRACT(MONTH FROM e.expense_date) = %s
              AND EXTRACT(YEAR FROM e.expense_date) = %s
            ORDER BY e.expense_date ASC;
        """, (user_id, month, year))

        expenses_to_delete = cursor.fetchall()

        # If GET → return preview only
        if request.method == "GET":
            conn.close()
            return jsonify({
                "success": True,
                "preview": True,
                "message": f"{len(expenses_to_delete)} expenses will be deleted for {month}/{year}",
                "expenses": expenses_to_delete
            }), 200

        # If DELETE → perform deletion
        if request.method == "DELETE":
            cursor.execute("""
                DELETE FROM expense
                WHERE user_id = %s
                  AND EXTRACT(MONTH FROM expense_date) = %s
                  AND EXTRACT(YEAR FROM expense_date) = %s
            """, (user_id, month, year))

            deleted_count = cursor.rowcount
            conn.commit()
            conn.close()

            return jsonify({
                "success": True,
                "deleted": deleted_count,
                "message": f"Deleted {deleted_count} expenses for {month}/{year}"
            }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@expense_bp.route("/yearly", methods=["GET", "DELETE"])
def yearly_expenses():
    """
    GET     → Preview all expenses for a full year (NO deletion)
    DELETE  → Delete all expenses for that year

    Query Params: ?user_id=1&year=2025
    If year not provided → defaults to current year.
    """
    try:
        user_id = request.args.get("user_id", type=int)
        year = request.args.get("year", type=int)

        if not user_id:
            return jsonify({"success": False, "error": "user_id is required"}), 400

        # Default to current year
        if not year:
            year = datetime.datetime.now().year

        from config.db import get_connection
        from psycopg2.extras import RealDictCursor

        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Fetch all expenses for the year
        cursor.execute("""
            SELECT e.id, e.amount, e.expense_date, e.created_at,
                   c.name AS category_name, c.id AS cate_id
            FROM expense e
            JOIN category c ON e.cate_id = c.id
            WHERE EXTRACT(YEAR FROM e.expense_date) = %s
              AND e.user_id = %s
            ORDER BY e.expense_date ASC;
        """, (year, user_id))

        expenses = cursor.fetchall()

        # ============================
        #          GET → PREVIEW
        # ============================
        if request.method == "GET":
            conn.close()
            return jsonify({
                "success": True,
                "preview": True,
                "message": f"{len(expenses)} expenses will be affected for year {year}",
                "year": year,
                "expenses": expenses
            }), 200

        # ============================
        #        DELETE → EXECUTE
        # ============================
        if request.method == "DELETE":
            cursor.execute("""
                DELETE FROM expense
                WHERE user_id = %s
                  AND EXTRACT(YEAR FROM expense_date) = %s
            """, (user_id, year))

            deleted_count = cursor.rowcount
            conn.commit()
            conn.close()

            return jsonify({
                "success": True,
                "deleted": deleted_count,
                "message": f"Deleted {deleted_count} expenses for year {year}"
            }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
