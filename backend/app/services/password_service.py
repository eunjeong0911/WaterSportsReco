"""
비밀번호 해시 서비스
bcrypt를 사용한 안전한 비밀번호 해시화 및 검증
"""

import bcrypt
import logging

logger = logging.getLogger(__name__)

class PasswordService:
    """비밀번호 해시화 및 검증 서비스"""
    
    def __init__(self, rounds: int = 12):
        """
        비밀번호 서비스 초기화
        
        Args:
            rounds: bcrypt 해시 라운드 수 (기본값: 12, 보안 강도 높음)
        """
        self.rounds = rounds
    
    def hash_password(self, password: str) -> str:
        """
        비밀번호 해시화
        
        Args:
            password: 원본 비밀번호
            
        Returns:
            str: 해시화된 비밀번호
        """
        try:
            # 비밀번호를 바이트로 인코딩
            password_bytes = password.encode('utf-8')
            
            # salt 생성 및 해시화
            salt = bcrypt.gensalt(rounds=self.rounds)
            hashed = bcrypt.hashpw(password_bytes, salt)
            
            # 문자열로 디코딩하여 반환
            return hashed.decode('utf-8')
            
        except Exception as e:
            logger.error(f"❌ Password hashing failed: {e}")
            raise ValueError("비밀번호 해시화에 실패했습니다")
    
    def verify_password(self, password: str, hashed_password: str) -> bool:
        """
        비밀번호 검증
        
        Args:
            password: 입력된 원본 비밀번호
            hashed_password: 저장된 해시화된 비밀번호
            
        Returns:
            bool: 비밀번호가 일치하면 True, 아니면 False
        """
        try:
            # 비밀번호와 해시를 바이트로 인코딩
            password_bytes = password.encode('utf-8')
            hashed_bytes = hashed_password.encode('utf-8')
            
            # bcrypt로 검증
            return bcrypt.checkpw(password_bytes, hashed_bytes)
            
        except Exception as e:
            logger.error(f"❌ Password verification failed: {e}")
            return False
    
    def is_password_strong(self, password: str) -> tuple[bool, list[str]]:
        """
        비밀번호 강도 검사
        
        Args:
            password: 검사할 비밀번호
            
        Returns:
            tuple[bool, list[str]]: (강도 충족 여부, 오류 메시지 리스트)
        """
        errors = []
        
        # 길이 검사
        if len(password) < 8:
            errors.append("비밀번호는 8자 이상이어야 합니다")
        
        # 최대 길이 검사
        if len(password) > 100:
            errors.append("비밀번호는 100자 이하여야 합니다")
        
        # 공백 검사
        if ' ' in password:
            errors.append("비밀번호에 공백을 포함할 수 없습니다")
        
        # 선택적 강도 검사 (주석 처리 - 필요시 활성화)
        # has_upper = any(c.isupper() for c in password)
        # has_lower = any(c.islower() for c in password)
        # has_digit = any(c.isdigit() for c in password)
        # has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
        
        # if not has_upper:
        #     errors.append("비밀번호에 대문자를 포함해야 합니다")
        # if not has_lower:
        #     errors.append("비밀번호에 소문자를 포함해야 합니다")
        # if not has_digit:
        #     errors.append("비밀번호에 숫자를 포함해야 합니다")
        # if not has_special:
        #     errors.append("비밀번호에 특수문자를 포함해야 합니다")
        
        return len(errors) == 0, errors
    
    def generate_temp_password(self, length: int = 12) -> str:
        """
        임시 비밀번호 생성 (비밀번호 재설정용)
        
        Args:
            length: 비밀번호 길이
            
        Returns:
            str: 임시 비밀번호
        """
        import secrets
        import string
        
        # 영문자, 숫자, 일부 특수문자 조합
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(secrets.choice(alphabet) for _ in range(length))

# 전역 비밀번호 서비스 인스턴스
password_service = PasswordService()

def get_password_service() -> PasswordService:
    """비밀번호 서비스 의존성 주입"""
    return password_service