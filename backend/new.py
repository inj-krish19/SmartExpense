import jwt
token = jwt.encode({"user_id": 1}, "secret", algorithm="HS256")
print(token)