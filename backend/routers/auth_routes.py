import traceback
import os, requests
from flask import Blueprint, request, jsonify
from models.users_model import create_users_table, insert_user, find_user_by_email_and_password
from config.db import get_connection
from psycopg2.extras import RealDictCursor

auth_bp = Blueprint("auth", __name__)

# Ensure table exists when routes are imported
create_users_table()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "SOMECLIENTID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "SOMECLIENTSECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "SOMEDUMMYURL")


@auth_bp.route("/profile/<int:user_id>", methods=["GET"])
def profile(user_id):
    conn = get_connection()
    # Use RealDictCursor if not already
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute(
        "SELECT id, email, username, phone, bio FROM users WHERE id = %s;",
        (user_id,)
    )
    user = cursor.fetchone()
    conn.close()

    if user:
        # Access fields by keys, not by index
        return jsonify({
            "id": user["id"],
            "email": user["email"],
            "username": user["username"],
            "phone": user["phone"],
            "bio": user["bio"]
        })

    return jsonify({"error": "User not found"}), 404

@auth_bp.route("/signup", methods=["POST"])
def signup():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Required fields
        email = data.get("email")
        username = data.get("username")
        password = data.get("password")

        # Optional fields
        phone = data.get("phone", "")
        bio = data.get("bio", "")

        if not email or not username or not password:
            return jsonify({"error": "Email, username, and password are required"}), 400

        # Insert user safely using your model function
        from models.users_model import insert_user, find_user_by_email

        # Check if user already exists
        if find_user_by_email(email):
            return jsonify({"error": "User with this email already exists"}), 400

        user_id = insert_user(email, username, phone, password, bio)
        if not user_id:
            return jsonify({"error": "Failed to create user"}), 500

        return jsonify({
            "message": "User created successfully",
            "user": {
                "id": user_id,
                "email": email,
                "username": username,
                "phone": phone,
                "bio": bio
            }
        }), 201

    except Exception as e:
        print("Signup error:", e)
        traceback.print_exc()
        return jsonify({"error": "Server error"}), 500
    
@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        user = find_user_by_email_and_password(email, password)
        if not user:
            return jsonify({"error": "Invalid credentials"}), 401

        # If user is a dict (RealDictCursor), map it safely
        if isinstance(user, dict):
            user_dict = {k: v for k, v in user.items() if k != "password"}  # hide password
        else:
            # If tuple, map manually
            user_dict = {
                "id": user[0],
                "email": user[1],
                "username": user[2],
                "phone": user[3],
                "bio": user[5]
            }

        return jsonify({"message": "Login successful", "user": user_dict}), 200

    except Exception as e:
        import traceback
        print("Login error:", e)
        traceback.print_exc()
        return jsonify({"error": "Server error"}), 500

@auth_bp.route("/google-callback")
def google_auth():
    try:
        code = request.args.get("code")
        if not code:
            return jsonify({"success": False, "error": "Missing authorization code"}), 400

        print(f"✅ Google OAuth code received: {code}")

        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        }

        token_response = requests.post(token_url, data=token_data)
        token_json = token_response.json()

        if "error" in token_json:
            print("❌ Token Error:", token_json)
            return jsonify({"success": False, "error": token_json.get("error_description", "Token exchange failed")}), 400

        access_token = token_json.get("access_token")
        id_token = token_json.get("id_token")

        print("✅ Google Access Token:", access_token)

        user_info_response = requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        user_info = user_info_response.json()

        print("✅ Google User Info:", user_info)

        return jsonify({
            "success": True,
            "message": "Successfully connected with Google",
            "google_user": user_info,
            "token": access_token,
        }), 200

    except Exception as e:
        print("Error in redirection uri:", str(e))
        return jsonify({
            "success": False,
            "error": "Unable to connect with Google",
            "details": str(e)
        }), 500
    
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # Use Render's PORT
    app.run(host="0.0.0.0", port=port, debug=True)
