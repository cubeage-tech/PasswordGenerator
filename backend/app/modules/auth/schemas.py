from pydantic import BaseModel, EmailStr, Field, ConfigDict


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterResponse(BaseModel):
    message: str
    email: EmailStr
    email_sent: bool = True


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=32, max_length=256)
    new_password: str = Field(min_length=8, max_length=128)


class PasswordResetResponse(BaseModel):
    message: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    full_name: str


class CurrentUserResponse(BaseModel):
    id: str
    full_name: str
    email: EmailStr
