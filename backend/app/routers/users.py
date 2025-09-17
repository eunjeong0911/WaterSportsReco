"""
사용자 관리 API 라우터
사용자 정보 조회, 수정, 비밀번호 변경 엔드포인트
"""

from fastapi import APIRouter, HTTPException, status, Depends
import logging
from app.schemas.auth import UserResponse, UserUpdate, PasswordChange, MessageResponse
from app.services.user_service import get_user_service, UserService
from app.services.password_service import get_password_service, PasswordService
from app.routers.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["User Management"])

@router.get("/me",
            response_model=UserResponse,
            summary="내 정보 조회",
            description="현재 로그인한 사용자의 프로필 정보를 조회합니다.")
async def get_my_profile(
    current_user: dict = Depends(get_current_user)
):
    """
    내 정보 조회 API
    
    JWT 토큰을 통해 인증된 사용자의 프로필 정보를 반환합니다.
    
    **Headers:**
    - Authorization: Bearer {access_token}
    """
    try:
        logger.info(f"🔄 Profile request for user: {current_user['email']}")
        
        return UserResponse(
            id=current_user['id'],
            email=current_user['email'],
            name=current_user['name'],
            created_at=current_user['created_at'],
            is_active=current_user['is_active']
        )
        
    except Exception as e:
        logger.error(f"❌ Failed to get profile for user {current_user['id']}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="프로필 조회 중 오류가 발생했습니다"
        )

@router.put("/me",
            response_model=UserResponse,
            summary="내 정보 수정",
            description="현재 로그인한 사용자의 프로필 정보를 수정합니다.")
async def update_my_profile(
    update_data: UserUpdate,
    current_user: dict = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    내 정보 수정 API
    
    현재는 이름만 수정 가능합니다.
    
    **Headers:**
    - Authorization: Bearer {access_token}
    
    **Body:**
    - **name**: 새로운 사용자 이름 (2-50자, 선택사항)
    """
    try:
        logger.info(f"🔄 Profile update request for user: {current_user['email']}")
        
        # 수정할 데이터가 없으면 현재 정보 반환
        if not update_data.name:
            return UserResponse(
                id=current_user['id'],
                email=current_user['email'],
                name=current_user['name'],
                created_at=current_user['created_at'],
                is_active=current_user['is_active']
            )
        
        # 사용자 정보 업데이트
        success = await user_service.update_user(
            user_id=current_user['id'],
            name=update_data.name
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="프로필 업데이트에 실패했습니다"
            )
        
        # 업데이트된 사용자 정보 조회
        updated_user = await user_service.get_user_by_id(current_user['id'])
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="업데이트된 정보 조회에 실패했습니다"
            )
        
        logger.info(f"✅ Profile updated for user: {current_user['email']}")
        
        return UserResponse(
            id=updated_user['id'],
            email=updated_user['email'],
            name=updated_user['name'],
            created_at=updated_user['created_at'],
            is_active=updated_user['is_active']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to update profile for user {current_user['id']}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="프로필 수정 중 오류가 발생했습니다"
        )

@router.put("/me/password",
            response_model=MessageResponse,
            summary="비밀번호 변경",
            description="현재 로그인한 사용자의 비밀번호를 변경합니다.")
async def change_my_password(
    password_data: PasswordChange,
    current_user: dict = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
    password_service: PasswordService = Depends(get_password_service)
):
    """
    비밀번호 변경 API
    
    현재 비밀번호를 확인한 후 새 비밀번호로 변경합니다.
    
    **Headers:**
    - Authorization: Bearer {access_token}
    
    **Body:**
    - **current_password**: 현재 비밀번호
    - **new_password**: 새 비밀번호 (8자 이상)
    - **new_password_confirm**: 새 비밀번호 확인
    """
    try:
        logger.info(f"🔄 Password change request for user: {current_user['email']}")
        
        # 현재 비밀번호 확인
        if not await user_service.verify_password(current_user, password_data.current_password):
            logger.warning(f"⚠️ Invalid current password for user: {current_user['email']}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="현재 비밀번호가 올바르지 않습니다"
            )
        
        # 새 비밀번호 강도 검사
        is_strong, errors = password_service.is_password_strong(password_data.new_password)
        if not is_strong:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="; ".join(errors)
            )
        
        # 현재 비밀번호와 새 비밀번호가 같은지 확인
        if password_data.current_password == password_data.new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="새 비밀번호는 현재 비밀번호와 달라야 합니다"
            )
        
        # 비밀번호 변경
        success = await user_service.change_password(
            user_id=current_user['id'],
            new_password=password_data.new_password
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="비밀번호 변경에 실패했습니다"
            )
        
        # 보안을 위해 해당 사용자의 모든 Refresh Token 삭제
        await user_service.delete_user_refresh_tokens(current_user['id'])
        
        logger.info(f"✅ Password changed for user: {current_user['email']}")
        
        return MessageResponse(
            message="비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to change password for user {current_user['id']}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="비밀번호 변경 중 오류가 발생했습니다"
        )

@router.delete("/me",
               response_model=MessageResponse,
               summary="회원 탈퇴",
               description="현재 로그인한 사용자의 계정을 비활성화합니다.")
async def deactivate_my_account(
    current_user: dict = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    회원 탈퇴 API
    
    계정을 완전히 삭제하지 않고 비활성화 상태로 변경합니다.
    모든 Refresh Token도 함께 삭제됩니다.
    
    **Headers:**
    - Authorization: Bearer {access_token}
    """
    try:
        logger.info(f"🔄 Account deactivation request for user: {current_user['email']}")
        
        # 계정 비활성화
        success = await user_service.update_user(
            user_id=current_user['id'],
            is_active=False
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="계정 비활성화에 실패했습니다"
            )
        
        # 모든 Refresh Token 삭제
        await user_service.delete_user_refresh_tokens(current_user['id'])
        
        logger.info(f"✅ Account deactivated for user: {current_user['email']}")
        
        return MessageResponse(
            message="계정이 성공적으로 비활성화되었습니다"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to deactivate account for user {current_user['id']}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="계정 비활성화 중 오류가 발생했습니다"
        )