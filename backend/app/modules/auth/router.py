import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.modules.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    RegisterResponse,
    LoginResponse,
    ForgotPasswordRequest,
    PasswordResetResponse,
    ResetPasswordRequest,
)
from app.modules.auth import service
from app.core.email import (
    EmailConfigurationError,
    EmailDeliveryError,
    send_password_reset_email,
    send_welcome_email,
)
from app.core.security import create_access_token
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import CurrentUserResponse
from app.database.models import User

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/me", response_model=CurrentUserResponse)
def current_user(user: User = Depends(get_current_user)):
    return {"id": str(user.id), "full_name": user.full_name, "email": user.email}


@router.post("/register", response_model=RegisterResponse)
async def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):
    generated_password = service.generate_password()
    try:
        user = service.register_user(db, data, generated_password)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email is already registered.") from None
    except Exception as error:
        db.rollback()
        logger.error("MyPass registration persistence failed (%s)", type(error).__name__)
        raise HTTPException(
            status_code=500,
            detail="Registration failed. Please try again.",
        ) from error

    try:
        await send_welcome_email(user.full_name, user.email, generated_password)
    except Exception as error:
        db.rollback()
        public_error = (
            str(error)
            if isinstance(error, (EmailConfigurationError, EmailDeliveryError))
            else "The welcome email could not be delivered. Check SMTP settings and try again."
        )
        raise HTTPException(
            status_code=503,
            detail={
                "code": "welcome_email_failed",
                "message": f"Registration could not be completed because the welcome email was not delivered. {public_error}",
                "account_created": False,
                "email_sent": False,
            },
        ) from None

    try:
        db.commit()
    except Exception as error:
        db.rollback()
        logger.error("MyPass registration persistence failed (%s)", type(error).__name__)
        raise HTTPException(status_code=500, detail="Registration failed. Please try again.") from None

    return {
        "message": "Registration successful. Welcome email sent.",
        "email": user.email,
        "email_sent": True,
    }


@router.post("/forgot-password", response_model=PasswordResetResponse)
async def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    generic_message = "If an account exists for that email, a password reset link will be sent shortly."
    try:
        user, reset_token = service.create_password_reset(db, data.email)
    except Exception:
        db.rollback()
        logger.exception("Password reset request could not be processed")
        return {"message": generic_message}

    if user is not None and reset_token is not None:
        try:
            await send_password_reset_email(user.full_name, user.email, reset_token)
        except Exception:
            db.rollback()
            try:
                service.invalidate_password_reset(db, reset_token)
            except Exception:
                db.rollback()
                logger.exception("Failed to invalidate an unsent password reset token")
            logger.exception("Password reset email delivery failed")

    return {"message": generic_message}


@router.post("/reset-password", response_model=PasswordResetResponse)
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    try:
        service.reset_user_password(db, data.token, data.new_password)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        db.rollback()
        logger.exception("Password reset persistence failed")
        raise HTTPException(
            status_code=500,
            detail="Password reset failed. Please request a new reset link.",
        ) from error

    return {"message": "Password updated. You can now sign in."}


@router.post("/login", response_model=LoginResponse)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    user = service.authenticate_user(
        db,
        data.email,
        data.password,
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    token = create_access_token(str(user.id))

    return {
        "access_token": token,
        "token_type": "bearer",
        "full_name": user.full_name,
    }
