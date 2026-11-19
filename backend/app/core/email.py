import logging
import os
import re
from pathlib import Path
from urllib.parse import quote

from aiosmtplib.errors import (
    SMTPAuthenticationError,
    SMTPServerDisconnected,
    SMTPTimeoutError,
)
from dotenv import dotenv_values
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from fastapi_mail.errors import ConnectionErrors

logger = logging.getLogger(__name__)

ENV_FILE = Path(__file__).resolve().parents[2] / ".env"
TEMPLATE_DIR = Path(__file__).resolve().parents[1] / "templates"


def _mail_setting(name: str, default: str | None = None) -> str | None:
    """Prefer the backend's explicit .env values over stale inherited values."""
    file_settings = dotenv_values(ENV_FILE)
    if name in file_settings and file_settings[name] is not None:
        return file_settings[name]
    return os.getenv(name, default)


class EmailConfigurationError(ValueError):
    """Safe-to-display mail configuration error without credential values."""


class EmailDeliveryError(RuntimeError):
    """Sanitized SMTP failure message safe to return to the frontend."""


def _mail_config() -> ConnectionConfig:
    username = _mail_setting("SMTP_USERNAME") or _mail_setting("SMTP_EMAIL")
    password = _mail_setting("SMTP_PASSWORD")
    sender = _mail_setting("SMTP_EMAIL") or username
    host = _mail_setting("SMTP_HOST", "smtp.gmail.com") or "smtp.gmail.com"

    try:
        port = int(_mail_setting("SMTP_PORT", "465") or "465")
    except ValueError as error:
        raise EmailConfigurationError("SMTP_PORT must be 465 or 587.") from error

    if not username or not password or not sender:
        raise EmailConfigurationError(
            "Email is not configured. Set SMTP_EMAIL, SMTP_USERNAME (or SMTP_EMAIL), "
            "and SMTP_PASSWORD in backend/.env."
        )

    app_password = password.strip().replace(" ", "")
    if host.strip().lower() == "smtp.gmail.com" and not re.fullmatch(r"[A-Za-z0-9]{16}", app_password):
        raise EmailConfigurationError(
            "SMTP_PASSWORD must be the 16-character alphanumeric Google App Password. "
            "Spaces may be removed; do not use the regular Gmail account password."
        )

    if port not in (465, 587):
        raise EmailConfigurationError("Gmail SMTP_PORT must be 465 (SSL) or 587 (STARTTLS).")

    return ConnectionConfig(
        MAIL_USERNAME=username.strip(),
        MAIL_PASSWORD=app_password,
        MAIL_FROM=sender.strip(),
        MAIL_FROM_NAME="MyPass",
        MAIL_PORT=port,
        MAIL_SERVER=host.strip(),
        MAIL_STARTTLS=(port == 587),
        MAIL_SSL_TLS=(port == 465),
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True,
        TEMPLATE_FOLDER=TEMPLATE_DIR,
        TIMEOUT=30,
    )


async def send_welcome_email(full_name: str, recipient_email: str, generated_password: str) -> None:
    """Send the welcome message and raise on configuration or delivery errors."""
    login_url = (
        _mail_setting("FRONTEND_LOGIN_URL", "http://localhost:5173/login")
        or "http://localhost:5173/login"
    ).strip()
    message = MessageSchema(
        subject="Your MyPass Account Password",
        recipients=[recipient_email],
        subtype=MessageType.html,
        template_body={
            "full_name": full_name,
            "registered_email": recipient_email,
            "generated_password": generated_password,
            "login_url": login_url,
        },
    )

    await _send_templated_email(message, "welcome_email.html", "MyPass welcome email")


async def send_password_reset_email(
    full_name: str,
    recipient_email: str,
    reset_token: str,
) -> None:
    reset_page = (
        _mail_setting("FRONTEND_RESET_URL", "http://localhost:5173/reset-password")
        or "http://localhost:5173/reset-password"
    ).strip()
    # A fragment keeps the one-time token out of HTTP access logs and referrers.
    separator = "&" if "#" in reset_page else "#"
    reset_url = f"{reset_page}{separator}token={quote(reset_token, safe='')}"
    message = MessageSchema(
        subject="Reset your MyPass password",
        recipients=[recipient_email],
        subtype=MessageType.html,
        template_body={
            "full_name": full_name,
            "reset_url": reset_url,
        },
    )
    await _send_templated_email(message, "password_reset_email.html", "MyPass password reset email")


async def _send_templated_email(
    message: MessageSchema,
    template_name: str,
    log_context: str,
) -> None:
    try:
        config = _mail_config()
    except EmailConfigurationError:
        logger.error("MyPass SMTP configuration is invalid")
        raise

    try:
        await FastMail(config).send_message(message, template_name=template_name)
    except SMTPAuthenticationError as error:
        logger.error("%s delivery failed: SMTP authentication rejected", log_context)
        raise EmailDeliveryError(
            "Gmail rejected SMTP authentication. Verify the sender account and Google App Password."
        ) from error
    except SMTPServerDisconnected as error:
        logger.error("%s delivery failed: SMTP server disconnected", log_context)
        raise EmailDeliveryError(
            "Gmail closed the SMTP connection during authentication. Verify the sender account and App Password."
        ) from error
    except SMTPTimeoutError as error:
        logger.error("%s delivery timed out", log_context)
        raise EmailDeliveryError(
            "The connection to Gmail timed out. Check the network and try again."
        ) from error
    except ConnectionErrors as error:
        logger.error("Could not connect to the configured SMTP server")
        raise EmailDeliveryError(
            "Could not connect to Gmail SMTP. Check outbound network access, firewall rules, and SMTP host and port."
        ) from error
    except Exception as error:
        logger.error("%s delivery failed (%s)", log_context, type(error).__name__)
        raise EmailDeliveryError(
            f"Gmail SMTP delivery failed ({type(error).__name__}). Check SMTP settings and try again."
        ) from error
