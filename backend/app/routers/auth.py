"""
인증 관련 API 라우터
회원가입, 로그인, 토큰 갱신, 로그아웃 엔드포인트
"""

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging
from app.schemas.auth import (
    UserRegister, UserLogin, TokenResponse, TokenRefresh, 
    TokenRefreshResponse, LogoutRequest, MessageResponse, UserResponse
)
from app.services.user_service import get_user_service, UserService
from app.services.jwt_service import get_jwt_service, JWTService
from app.services.password_service import get_password_service, PasswordService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

@router.post("/register", 
             response_model=UserResponse,
             status_code=status.HTTP_201_CREATED,
             summary="회원가입",
             description="새로운 사용자 계정을 생성합니다.")
async def register(
    user_data: UserRegister,
    user_service: UserService = Depends(get_user_service),
    password_service: PasswordService = Depends(get_password_service)
):
    """
    회원가입 API
    
    - **email**: 유효한 이메일 주소
    - **name**: 사용자 이름 (2-50자)
    - **password**: 비밀번호 (8자 이상)
    - **password_confirm**: 비밀번호 확인
    """
    try:
        logger.info(f"🔄 Registration attempt for email: {user_data.email}")
        
        # 비밀번호 강도 검사
        is_strong, errors = password_service.is_password_strong(user_data.password)
        if not is_strong:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="; ".join(errors)
            )
        
        # 사용자 생성
        user_id = await user_service.create_user(
            email=user_data.email,
            name=user_data.name,
            password=user_data.password
        )
        
        # 생성된 사용자 정보 조회
        user = await user_service.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="사용자 생성 후 조회에 실패했습니다"
            )
        
        logger.info(f"✅ User registered successfully: {user_data.email}")
        
        return UserResponse(
            id=user['id'],
            email=user['email'],
            name=user['name'],
            created_at=user['created_at'],
            is_active=user['is_active']
        )
        
    except ValueError as e:
        logger.warning(f"⚠️ Registration validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"❌ Registration failed for {user_data.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="회원가입 처리 중 오류가 발생했습니다"
        )

@router.post("/login",
             response_model=TokenResponse,
             summary="로그인",
             description="이메일과 비밀번호로 로그인하여 JWT 토큰을 발급받습니다.")
async def login(
    login_data: UserLogin,
    user_service: UserService = Depends(get_user_service),
    jwt_service: JWTService = Depends(get_jwt_service)
):
    """
    로그인 API
    
    - **email**: 등록된 이메일 주소
    - **password**: 비밀번호
    
    성공 시 Access Token(15분)과 Refresh Token(7일)을 반환합니다.
    """
    try:
        logger.info(f"🔄 Login attempt for email: {login_data.email}")
        
        # 사용자 조회
        user = await user_service.get_user_by_email(login_data.email)
        if not user:
            logger.warning(f"⚠️ Login failed - user not found: {login_data.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="이메일 또는 비밀번호가 올바르지 않습니다"
            )
        
        # 계정 잠금 상태 확인
        if await user_service.is_user_locked(user):
            logger.warning(f"🔒 Login failed - account locked: {login_data.email}")
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="계정이 일시적으로 잠겨있습니다. 나중에 다시 시도해주세요."
            )
        
        # 비밀번호 검증
        if not await user_service.verify_password(user, login_data.password):
            # 로그인 실패 횟수 증가
            failed_attempts = await user_service.increment_failed_login(user['id'])
            logger.warning(f"⚠️ Login failed - invalid password: {login_data.email} (attempts: {failed_attempts})")
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="이메일 또는 비밀번호가 올바르지 않습니다"
            )
        
        # 로그인 성공 - 실패 횟수 초기화
        await user_service.reset_failed_login(user['id'])
        
        # JWT 토큰 생성
        token_data = jwt_service.create_token_pair({
            "user_id": user['id'],
            "email": user['email']
        })
        
        # Refresh Token 저장
        await user_service.store_refresh_token(
            user_id=user['id'],
            token_hash=token_data['refresh_token_hash'],
            expires_at=token_data['refresh_expires_at']
        )
        
        logger.info(f"✅ Login successful: {login_data.email}")
        
        return TokenResponse(
            access_token=token_data['access_token'],
            refresh_token=token_data['refresh_token'],
            token_type=token_data['token_type'],
            expires_in=token_data['expires_in'],
            user=UserResponse(
                id=user['id'],
                email=user['email'],
                name=user['name'],
                created_at=user['created_at'],
                is_active=user['is_active']
            )
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Login failed for {login_data.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="로그인 처리 중 오류가 발생했습니다"
        )

@router.post("/refresh",
             response_model=TokenRefreshResponse,
             summary="토큰 갱신",
             description="Refresh Token을 사용하여 새로운 Access Token을 발급받습니다.")
async def refresh_token(
    refresh_data: TokenRefresh,
    user_service: UserService = Depends(get_user_service),
    jwt_service: JWTService = Depends(get_jwt_service)
):
    """
    토큰 갱신 API
    
    - **refresh_token**: 유효한 Refresh Token
    
    새로운 Access Token을 반환합니다.
    """
    try:
        logger.info("🔄 Token refresh attempt")
        
        # Refresh Token 검증
        try:
            payload = jwt_service.verify_token(refresh_data.refresh_token, "refresh")
        except HTTPException as e:
            logger.warning(f"⚠️ Invalid refresh token: {e.detail}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="유효하지 않은 Refresh Token입니다"
            )
        
        # 데이터베이스에서 토큰 검증
        token_hash = jwt_service.hash_token(refresh_data.refresh_token)
        token_data = await user_service.verify_refresh_token(token_hash)
        
        if not token_data:
            logger.warning("⚠️ Refresh token not found in database")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="유효하지 않은 Refresh Token입니다"
            )
        
        # 새로운 Access Token 생성
        new_access_token = jwt_service.create_access_token({
            "user_id": token_data['user_id'],
            "email": token_data['email']
        })
        
        logger.info(f"✅ Token refreshed for user: {token_data['email']}")
        
        return TokenRefreshResponse(
            access_token=new_access_token,
            token_type="bearer",
            expires_in=jwt_service.access_token_expire_minutes * 60
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Token refresh failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="토큰 갱신 처리 중 오류가 발생했습니다"
        )

@router.post("/logout",
             response_model=MessageResponse,
             summary="로그아웃",
             description="Refresh Token을 무효화하여 로그아웃합니다.")
async def logout(
    logout_data: LogoutRequest,
    user_service: UserService = Depends(get_user_service),
    jwt_service: JWTService = Depends(get_jwt_service)
):
    """
    로그아웃 API
    
    - **refresh_token**: 무효화할 Refresh Token
    """
    try:
        logger.info("🔄 Logout attempt")
        
        # Refresh Token 해시화
        token_hash = jwt_service.hash_token(logout_data.refresh_token)
        
        # 토큰 삭제
        deleted = await user_service.delete_refresh_token(token_hash)
        
        if deleted:
            logger.info("✅ Logout successful")
            return MessageResponse(message="로그아웃되었습니다")
        else:
            logger.warning("⚠️ Refresh token not found for logout")
            return MessageResponse(message="이미 로그아웃된 상태입니다")
        
    except Exception as e:
        logger.error(f"❌ Logout failed: {str(e)}")
        # 로그아웃은 실패해도 클라이언트에서 토큰을 제거하도록 성공 응답
        return MessageResponse(message="로그아웃 처리되었습니다")

# 토큰 검증 의존성 함수
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    user_service: UserService = Depends(get_user_service),
    jwt_service: JWTService = Depends(get_jwt_service)
) -> dict:
    """
    현재 로그인한 사용자 정보 반환
    
    JWT Access Token을 검증하고 사용자 정보를 반환합니다.
    """
    try:
        # JWT 토큰 검증
        payload = jwt_service.verify_token(credentials.credentials, "access")
        user_id = payload.get("user_id")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="유효하지 않은 토큰입니다"
            )
        
        # 사용자 정보 조회
        user = await user_service.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="사용자를 찾을 수 없습니다"
            )
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Token validation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="토큰 검증에 실패했습니다"
        )