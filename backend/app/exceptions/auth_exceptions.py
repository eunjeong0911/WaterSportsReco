"""
인증 관련 커스텀 예외 클래스들
"""

from fastapi import HTTPException, status

class AuthException(HTTPException):
    """기본 인증 예외"""
    def __init__(self, detail: str):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)

class UserNotFoundException(HTTPException):
    """사용자를 찾을 수 없음"""
    def __init__(self):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail="사용자를 찾을 수 없습니다")

class EmailAlreadyExistsException(HTTPException):
    """이메일이 이미 존재함"""
    def __init__(self):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail="이미 존재하는 이메일입니다")

class InvalidCredentialsException(AuthException):
    """잘못된 인증 정보"""
    def __init__(self):
        super().__init__("이메일 또는 비밀번호가 올바르지 않습니다")

class TokenExpiredException(AuthException):
    """토큰 만료"""
    def __init__(self):
        super().__init__("토큰이 만료되었습니다")

class InvalidTokenException(AuthException):
    """유효하지 않은 토큰"""
    def __init__(self):
        super().__init__("유효하지 않은 토큰입니다")

class AccountLockedException(HTTPException):
    """계정 잠금"""
    def __init__(self, unlock_time: str = None):
        detail = "계정이 일시적으로 잠겨있습니다"
        if unlock_time:
            detail += f". 잠금 해제 시간: {unlock_time}"
        super().__init__(
            status_code=status.HTTP_423_LOCKED,
            detail=detail
        )

class InactiveAccountException(HTTPException):
    """비활성화된 계정"""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="비활성화된 계정입니다"
        )

class WeakPasswordException(HTTPException):
    """약한 비밀번호"""
    def __init__(self, errors: list[str]):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="; ".join(errors)
        )