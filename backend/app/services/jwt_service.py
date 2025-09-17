"""
JWT 토큰 서비스
Access Token(15분) 및 Refresh Token(7일) 생성, 검증, 관리
"""

import jwt
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from app.config import get_settings

settings = get_settings()

class JWTService:
    """JWT 토큰 관리 서비스"""
    
    def __init__(self):
        self.secret_key = settings.JWT_SECRET_KEY
        self.algorithm = settings.JWT_ALGORITHM
        self.access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
        self.refresh_token_expire_days = settings.REFRESH_TOKEN_EXPIRE_DAYS
    
    def create_access_token(self, data: Dict[str, Any]) -> str:
        """
        Access Token 생성 (15분 만료)
        
        Args:
            data: 토큰에 포함할 데이터 (user_id, email 등)
            
        Returns:
            str: JWT Access Token
        """
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode.update({
            "exp": expire,
            "type": "access",
            "iat": datetime.utcnow()
        })
        
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
    
    def create_refresh_token(self, data: Dict[str, Any]) -> str:
        """
        Refresh Token 생성 (7일 만료)
        
        Args:
            data: 토큰에 포함할 데이터 (user_id 등)
            
        Returns:
            str: JWT Refresh Token
        """
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)
        
        to_encode.update({
            "exp": expire,
            "type": "refresh",
            "iat": datetime.utcnow()
        })
        
        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token: str, token_type: str = "access") -> Dict[str, Any]:
        """
        JWT 토큰 검증
        
        Args:
            token: 검증할 JWT 토큰
            token_type: 토큰 타입 ("access" 또는 "refresh")
            
        Returns:
            Dict[str, Any]: 토큰 페이로드
            
        Raises:
            HTTPException: 토큰이 유효하지 않은 경우
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            
            # 토큰 타입 확인
            if payload.get("type") != token_type:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Invalid token type. Expected {token_type}"
                )
            
            return payload
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}"
            )
    
    def get_token_expiry(self, token: str) -> Optional[datetime]:
        """
        토큰 만료 시간 반환
        
        Args:
            token: JWT 토큰
            
        Returns:
            Optional[datetime]: 만료 시간 (토큰이 유효하지 않으면 None)
        """
        try:
            payload = jwt.decode(
                token, 
                self.secret_key, 
                algorithms=[self.algorithm],
                options={"verify_exp": False}  # 만료 시간 검증 비활성화
            )
            exp_timestamp = payload.get("exp")
            if exp_timestamp:
                return datetime.utcfromtimestamp(exp_timestamp)
            return None
        except jwt.JWTError:
            return None
    
    def is_token_expired(self, token: str) -> bool:
        """
        토큰 만료 여부 확인
        
        Args:
            token: JWT 토큰
            
        Returns:
            bool: 만료되었으면 True, 아니면 False
        """
        expiry = self.get_token_expiry(token)
        if expiry:
            return datetime.utcnow() > expiry
        return True
    
    def hash_token(self, token: str) -> str:
        """
        토큰 해시화 (데이터베이스 저장용)
        
        Args:
            token: 원본 토큰
            
        Returns:
            str: SHA256 해시값
        """
        return hashlib.sha256(token.encode()).hexdigest()
    
    def create_token_pair(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Access Token과 Refresh Token 쌍 생성
        
        Args:
            user_data: 사용자 데이터 (id, email 등)
            
        Returns:
            Dict[str, Any]: 토큰 쌍과 메타데이터
        """
        access_token = self.create_access_token(user_data)
        refresh_token = self.create_refresh_token({"user_id": user_data.get("user_id")})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": self.access_token_expire_minutes * 60,  # 초 단위
            "refresh_token_hash": self.hash_token(refresh_token),
            "refresh_expires_at": datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)
        }

# 전역 JWT 서비스 인스턴스
jwt_service = JWTService()

def get_jwt_service() -> JWTService:
    """JWT 서비스 의존성 주입"""
    return jwt_service