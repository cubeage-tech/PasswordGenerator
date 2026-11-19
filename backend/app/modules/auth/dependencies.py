from uuid import UUID

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.security import ALGORITHM, SECRET_KEY
from app.database.connection import get_db
from app.database.models import User

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required.")

    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise JWTError("Missing subject")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    try:
        parsed_user_id = UUID(user_id)
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    user = db.query(User).filter(User.id == parsed_user_id).first()
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="Account is unavailable.")
    return user

