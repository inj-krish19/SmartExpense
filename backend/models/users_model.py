from config.db import get_connection, RealDictCursor
from werkzeug.security import generate_password_hash
import random, string

def create_users_table():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(100) UNIQUE NOT NULL,
            username VARCHAR(50) NOT NULL,
            phone VARCHAR(20),
            password VARCHAR(50) NOT NULL,
            bio TEXT
        );
    """)
    conn.commit()
    conn.close()

def insert_user(email, username, phone, password, bio):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (email, username, phone, password, bio) VALUES (%s, %s, %s, %s, %s) RETURNING id;",
            (email, username, phone, password, bio)
        )
        result = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        
        if result:
            return result[0]  # return user id
        else:
            print("Insert user error: No ID returned")
            return None

    except Exception as e:
        print("Insert user error:", e)
        return None
    
def find_all_users():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users")
    user = cursor.fetchall()
    print(user)
    conn.close()
    return user

def find_user_by_email(email):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email=%s;", (email,))
    user = cursor.fetchone()
    conn.close()
    return user

def get_email(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT email FROM users WHERE id = %s;", (user_id,))
    row = cursor.fetchone()
    conn.close()

    print("Email", row['email'] if row else None)
    return row["email"] if row else None


def find_user_by_email_and_password(email, password):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email=%s AND password=%s;", (email, password))
    user = cursor.fetchone()
    conn.close()
    return user

def handle_google_user(user_info, ):

    db_conn = get_connection()

    email = user_info.get("email")
    name = user_info.get("name") or email.split("@")[0]
    picture = user_info.get("picture", "")
    bio = f"Google account user - {name}"

    if not email:
        raise ValueError("Email not found in Google user info")

    with db_conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Check if user exists
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cur.fetchone()

        if user:
            print(f"✅ Existing user logged in: {email}")
            return user  # Already registered user

        # Create a random dummy password (Google accounts don't use local login)
        hashed_pass = "9700"

        # Insert new user
        cur.execute("""
            INSERT INTO users (email, username, phone, password, bio)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, email, username, bio
        """, (email, name, None, hashed_pass, bio))

        new_user = cur.fetchone()
        db_conn.commit()

        print(f"🆕 New user created from Google: {email}")
        return new_user