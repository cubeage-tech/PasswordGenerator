import re
import hashlib
import secrets
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.database.models import PasswordResetToken, User
from app.core.security import hash_password, verify_password


def generate_password() -> str:
    """Generate a strong password while ensuring every required character class."""
    groups = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    required = "".join((
        secrets.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
        secrets.choice("abcdefghijklmnopqrstuvwxyz"),
        secrets.choice("0123456789"),
        secrets.choice("!@#$%^&*"),
    ))
    return "".join(secrets.SystemRandom().sample(required + "".join(
        secrets.choice(groups) for _ in range(8 - len(required))
    ), 8))


def validate_password(password: str):
    rules = [
        len(password) >= 8,
        re.search(r"[A-Z]", password),
        re.search(r"[a-z]", password),
        re.search(r"[0-9]", password),
        re.search(r"[^A-Za-z0-9]", password),
    ]

    return all(rules)


def register_user(db: Session, data, password: str):
    email = str(data.email).strip().lower()
    existing_user = db.query(User).filter(func.lower(User.email) == email).first()

    if existing_user:
        raise ValueError("Email is already registered.")

    if not validate_password(password):
        raise ValueError("Password does not meet security requirements.")

    user = User(
        full_name=data.full_name,
        email=email,
        hashed_password=hash_password(password),
        is_active=True,
    )

    db.add(user)
    db.flush()

    return user


def authenticate_user(db: Session, email: str, password: str):
    normalized_email = str(email).strip().lower()
    user = db.query(User).filter(func.lower(User.email) == normalized_email).first()

    if not user:
        return None

    if not user.is_active:
        return None

    if not verify_password(password, user.hashed_password):
        return None

    return user


def create_password_reset(db: Session, email: str):
    normalized_email = str(email).strip().lower()
    user = db.query(User).filter(func.lower(User.email) == normalized_email).first()
    if user is None:
        return None, None

    now = datetime.now(timezone.utc)
    recent_reset = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.user_id == user.id)
        .order_by(PasswordResetToken.created_at.desc())
        .first()
    )
    if recent_reset and recent_reset.created_at:
        created_at = recent_reset.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        if created_at > now - timedelta(seconds=60):
            return user, None

    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id
    ).delete(synchronize_session=False)

    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    db.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=now + timedelta(minutes=30),
        )
    )
    db.commit()
    return user, raw_token


def invalidate_password_reset(db: Session, raw_token: str) -> None:
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash
    ).delete(synchronize_session=False)
    db.commit()


def reset_user_password(db: Session, raw_token: str, new_password: str) -> None:
    if not validate_password(new_password):
        raise ValueError("Password does not meet security requirements.")

    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    now = datetime.now(timezone.utc)
    reset_record = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token_hash == token_hash)
        .with_for_update()
        .first()
    )
    if reset_record is None or reset_record.used_at is not None:
        raise ValueError("Reset link is invalid or expired. Request a new one.")

    expires_at = reset_record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= now:
        raise ValueError("Reset link is invalid or expired. Request a new one.")

    user = (
        db.query(User)
        .filter(User.id == reset_record.user_id)
        .with_for_update()
        .first()
    )
    if user is None or not user.is_active:
        raise ValueError("Reset link is invalid or expired. Request a new one.")

    user.hashed_password = hash_password(new_password)
    reset_record.used_at = now
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.id != reset_record.id,
    ).delete(synchronize_session=False)
    db.commit()
