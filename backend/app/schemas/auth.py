"""
인증 관련 Pydantic 스키마 모델
요청/응답 데이터 검증 및 직렬화
"""

from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime
from typing import Optional

class UserRegister(BaseModel):
    """회원가입 요청 스키마"""
    email: EmailStr = Field(..., description="사용자 이메일")
    name: str = Field(..., min_length=2, max_length=50, description="사용자 이름")
    password: str = Field(..., min_length=8, max_length=100, description="비밀번호 (최소 8자)")
    password_confirm: str = Field(..., description="비밀번호 확인")
    
    @validator('password_confirm')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('비밀번호가 일치하지 않습니다')
        return v
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('비밀번호는 8자 이상이어야 합니다')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "name": "홍길동",
                "password": "password123",
                "password_confirm": "password123"
            }
        }

class UserLogin(BaseModel):
    """로그인 요청 스키마"""
    email: EmailStr = Field(..., description="사용자 이메일")
    password: str = Field(..., description="비밀번호")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "password123"
            }
        }

class UserResponse(BaseModel):
    """사용자 정보 응답 스키마"""
    id: int = Field(..., description="사용자 ID")
    email: str = Field(..., description="사용자 이메일")
    name: str = Field(..., description="사용자 이름")
    created_at: datetime = Field(..., description="가입일시")
    is_active: bool = Field(..., description="계정 활성화 상태")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "email": "user@example.com",
                "name": "홍길동",
                "created_at": "2024-01-01T00:00:00",
                "is_active": True
            }
        }

class TokenResponse(BaseModel):
    """토큰 응답 스키마"""
    access_token: str = Field(..., description="액세스 토큰")
    refresh_token: str = Field(..., description="리프레시 토큰")
    token_type: str = Field(default="bearer", description="토큰 타입")
    expires_in: int = Field(..., description="토큰 만료 시간(초)")
    user: UserResponse = Field(..., description="사용자 정보")
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 900,
                "user": {
                    "id": 1,
                    "email": "user@example.com",
                    "name": "홍길동",
                    "created_at": "2024-01-01T00:00:00",
                    "is_active": True
                }
            }
        }

class TokenRefresh(BaseModel):
    """토큰 갱신 요청 스키마"""
    refresh_token: str = Field(..., description="리프레시 토큰")
    
    class Config:
        json_schema_extra = {
            "example": {
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        }

class TokenRefreshResponse(BaseModel):
    """토큰 갱신 응답 스키마"""
    access_token: str = Field(..., description="새로운 액세스 토큰")
    token_type: str = Field(default="bearer", description="토큰 타입")
    expires_in: int = Field(..., description="토큰 만료 시간(초)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 900
            }
        }

class UserUpdate(BaseModel):
    """사용자 정보 수정 요청 스키마"""
    name: Optional[str] = Field(None, min_length=2, max_length=50, description="사용자 이름")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "새로운이름"
            }
        }

class PasswordChange(BaseModel):
    """비밀번호 변경 요청 스키마"""
    current_password: str = Field(..., description="현재 비밀번호")
    new_password: str = Field(..., min_length=8, max_length=100, description="새 비밀번호 (최소 8자)")
    new_password_confirm: str = Field(..., description="새 비밀번호 확인")
    
    @validator('new_password_confirm')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('새 비밀번호가 일치하지 않습니다')
        return v
    
    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('비밀번호는 8자 이상이어야 합니다')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "current_password": "oldpassword123",
                "new_password": "newpassword123",
                "new_password_confirm": "newpassword123"
            }
        }

class LogoutRequest(BaseModel):
    """로그아웃 요청 스키마"""
    refresh_token: str = Field(..., description="리프레시 토큰")
    
    class Config:
        json_schema_extra = {
            "example": {
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        }

class MessageResponse(BaseModel):
    """일반 메시지 응답 스키마"""
    message: str = Field(..., description="응답 메시지")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "작업이 성공적으로 완료되었습니다"
            }
        }