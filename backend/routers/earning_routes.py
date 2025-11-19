import traceback
import datetime
from flask import Blueprint, request, jsonify
from models.earning_model import insert_earning, get_salaries_by_user, get_salaries_by_user_year, create_earning_table, delete_salaries, exist_month_year_user, update_month_year_earning
from config.db import get_connection
from psycopg2.extras import RealDictCursor

earning_bp = Blueprint("earning", __name__, url_prefix="/earning")
create_earning_table()

@earning_bp.route("/add", methods=["POST"])
def add_earning():
    data = request.get_json()
    print("Incoming earning data:", data)

    user_id = data.get("user_id")
    amount = data.get("amount")
    earning_date = data.get("earning_date")  # expects 'YYYY-MM-DD'

    if not user_id or not amount or not earning_date:
        return jsonify({"error": "Missing user_id, amount, or earning_date"}), 400

    try:
        # Call model function (handles validation + insert)

        is_user_month_year_earning_exist = exist_month_year_user(user_id, earning_date)

        if is_user_month_year_earning_exist:
            data = update_month_year_earning(user_id, amount, earning_date)
        else:
            data = insert_earning(user_id, amount, earning_date)

        return jsonify({
            "message": "earning added",
            "earning": data  # full row dict
        }), 201

    except Exception as e:
        print("Error inserting earning:")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@earning_bp.route("/user/<int:user_id>", methods=["GET"])
def get_earning(user_id):
    try:
        year = int(request.args.get("year") or datetime.datetime.now().year)
        salaries = get_salaries_by_user_year(user_id, year)
        # salaries is already a list of dicts from RealDictCursor
        print("Earning", salaries)
        return jsonify(salaries)
    except Exception as e:
        print("Error fetching salaries:")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@earning_bp.route("/latest/<int:user_id>", methods=["GET"])
def get_latest_earning(user_id):
    salaries = get_salaries_by_user(user_id)
    if not salaries:
        return jsonify({"success": False, "error": "No earning found"}), 404
    latest = salaries[0]  # assuming DESC order
    return jsonify({"success": True, "earning": latest}), 200

@earning_bp.route("/delete/<int:user_id>")
def delete_salaries(user_id):
    message = delete_salaries(user_id)

    if not message:
        return jsonify({"success": False, "error": "No earning found"}), 404
    return jsonify({"success": True, "earning": message}), 200

@earning_bp.route("/delete", methods=["GET", "DELETE"])
def delete_earning_by_month():
    """
    GET     → Preview earnings that will be deleted for the specified month.
    DELETE  → Delete earnings for that month.

    Query Params: user_id, month, year
    """
    try:
        user_id = request.args.get("user_id", type=int)
        month = request.args.get("month", type=int)
        year = request.args.get("year", type=int)

        if not user_id:
            return jsonify({"success": False, "error": "user_id is required"}), 400

        if not month:
            month = datetime.datetime.now().month
        if not year:
            year = datetime.datetime.now().year

        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Fetch earnings
        cursor.execute("""
            SELECT e.id, e.amount, e.earning_date, e.created_at
            FROM earning e
            WHERE e.user_id = %s
              AND EXTRACT(MONTH FROM e.earning_date) = %s
              AND EXTRACT(YEAR FROM e.earning_date) = %s
            ORDER BY e.earning_date ASC;
        """, (user_id, month, year))

        earnings = cursor.fetchall()

        # GET → Preview
        if request.method == "GET":
            conn.close()
            return jsonify({
                "success": True,
                "preview": True,
                "month": month,
                "year": year,
                "message": f"{len(earnings)} earnings will be deleted",
                "earnings": earnings
            }), 200

        # DELETE → Perform deletion
        cursor.execute("""
            DELETE FROM earning
            WHERE user_id = %s
              AND EXTRACT(MONTH FROM earning_date) = %s
              AND EXTRACT(YEAR FROM earning_date) = %s
        """, (user_id, month, year))

        deleted_count = cursor.rowcount
        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "deleted": deleted_count,
            "message": f"Deleted {deleted_count} earnings for {month}/{year}"
        }), 200

    except Exception as e:
        print({"success": False, "error": str(e)})
        return jsonify({"success": False, "error": str(e)}), 500


@earning_bp.route("/yearly", methods=["GET", "DELETE"])
def yearly_earnings():
    """
    GET     → Preview all earnings for the full year.
    DELETE  → Delete all those earnings.

    Query Params: user_id, year
    """
    try:
        user_id = request.args.get("user_id", type=int)
        year = request.args.get("year", type=int)

        if not user_id:
            return jsonify({"success": False, "error": "user_id is required"}), 400

        if not year:
            year = datetime.datetime.now().year

        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            SELECT e.id, e.amount, e.earning_date, e.created_at
            FROM earning e
            WHERE e.user_id = %s
              AND EXTRACT(YEAR FROM e.earning_date) = %s
            ORDER BY e.earning_date ASC;
        """, (user_id, year))

        earnings = cursor.fetchall()

        # GET → Preview
        if request.method == "GET":
            conn.close()
            return jsonify({
                "success": True,
                "preview": True,
                "year": year,
                "message": f"{len(earnings)} earnings will be deleted",
                "earnings": earnings
            }), 200

        # DELETE → Delete yearly earnings
        cursor.execute("""
            DELETE FROM earning
            WHERE user_id = %s
              AND EXTRACT(YEAR FROM earning_date) = %s
        """, (user_id, year))

        deleted_count = cursor.rowcount
        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "deleted": deleted_count,
            "message": f"Deleted {deleted_count} earnings for year {year}"
        }), 200

    except Exception as e:
        print({"success": False, "error": str(e)})
        return jsonify({"success": False, "error": str(e)}), 500
