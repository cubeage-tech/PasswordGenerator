import os
from datetime import datetime, timedelta, timezone

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from jose import jwt

password_hasher = PasswordHasher()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return password_hasher.verify(hashed_password, password)
    except (VerifyMismatchError, Exception):
        return False


def create_access_token(user_id: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": user_id,
        "exp": expires,
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)