import os
import requests
from flask import Flask, redirect, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from routers.auth_routes import auth_bp
from routers.earning_routes import earning_bp
from routers.category_routes import category_bp
from routers.expense_router import expense_bp
from routers.dashboard_routes import dashboard_bp
from models.users_model import find_all_users

load_dotenv()
needed_help = ( os.getenv("access") or "denied" )

if needed_help != "denied":
    find_all_users()
    

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "SOMECLIENTID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "SOMECLIENTSECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "SOMEDUMMYURL")


app = Flask(__name__)

# Enable CORS for your frontend (Vercel URL or localhost for dev)
CORS(app)

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(earning_bp, url_prefix="/earning")
app.register_blueprint(category_bp, url_prefix="/category")
app.register_blueprint(expense_bp)
app.register_blueprint(dashboard_bp)

# Root route (optional)
@app.route("/")
def index():
    return {"message": "Smart Expense Backend is running!"}

@app.route("/google-callback")
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
