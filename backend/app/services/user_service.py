"""
사용자 데이터베이스 서비스
사용자 CRUD 작업 및 인증 관련 데이터베이스 작업
"""

import aiomysql
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from app.database import get_database
from app.services.password_service import get_password_service
from app.services.jwt_service import get_jwt_service

logger = logging.getLogger(__name__)

class UserService:
    """사용자 관련 데이터베이스 서비스"""
    
    def __init__(self):
        self.db = get_database()
        self.password_service = get_password_service()
        self.jwt_service = get_jwt_service()
    
    async def create_user(self, email: str, name: str, password: str) -> int:
        """
        새 사용자 생성
        
        Args:
            email: 사용자 이메일
            name: 사용자 이름
            password: 원본 비밀번호
            
        Returns:
            int: 생성된 사용자 ID
            
        Raises:
            ValueError: 이메일이 이미 존재하는 경우
        """
        try:
            # 이메일 중복 검사
            existing_user = await self.get_user_by_email(email)
            if existing_user:
                raise ValueError("이미 존재하는 이메일입니다")
            
            # 비밀번호 해시화
            password_hash = self.password_service.hash_password(password)
            
            # 사용자 생성
            async with self.db.get_cursor() as (cursor, conn):
                await cursor.execute(
                    """INSERT INTO users (email, name, password_hash) 
                       VALUES (%s, %s, %s)""",
                    (email, name, password_hash)
                )
                await conn.commit()
                user_id = cursor.lastrowid
                
                logger.info(f"✅ User created successfully: {email} (ID: {user_id})")
                return user_id
                
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"❌ Failed to create user {email}: {e}")
            raise ValueError("사용자 생성에 실패했습니다")
    
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        이메일로 사용자 조회
        
        Args:
            email: 사용자 이메일
            
        Returns:
            Optional[Dict[str, Any]]: 사용자 정보 (없으면 None)
        """
        try:
            async with self.db.get_cursor(aiomysql.DictCursor) as (cursor, conn):
                await cursor.execute(
                    """SELECT id, email, name, password_hash, is_active, 
                              failed_login_attempts, locked_until, created_at, updated_at
                       FROM users 
                       WHERE email = %s AND is_active = TRUE""",
                    (email,)
                )
                return await cursor.fetchone()
                
        except Exception as e:
            logger.error(f"❌ Failed to get user by email {email}: {e}")
            return None
    
    async def get_user_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        """
        ID로 사용자 조회
        
        Args:
            user_id: 사용자 ID
            
        Returns:
            Optional[Dict[str, Any]]: 사용자 정보 (없으면 None)
        """
        try:
            async with self.db.get_cursor(aiomysql.DictCursor) as (cursor, conn):
                await cursor.execute(
                    """SELECT id, email, name, password_hash, is_active, 
                              failed_login_attempts, locked_until, created_at, updated_at
                       FROM users 
                       WHERE id = %s AND is_active = TRUE""",
                    (user_id,)
                )
                return await cursor.fetchone()
                
        except Exception as e:
            logger.error(f"❌ Failed to get user by ID {user_id}: {e}")
            return None
    
    async def update_user(self, user_id: int, **kwargs) -> bool:
        """
        사용자 정보 업데이트
        
        Args:
            user_id: 사용자 ID
            **kwargs: 업데이트할 필드들
            
        Returns:
            bool: 업데이트 성공 여부
        """
        try:
            if not kwargs:
                return True
            
            # 업데이트할 필드와 값 준비
            set_clauses = []
            values = []
            
            for field, value in kwargs.items():
                if field in ['name', 'email', 'is_active', 'failed_login_attempts', 'locked_until']:
                    set_clauses.append(f"{field} = %s")
                    values.append(value)
            
            if not set_clauses:
                return True
            
            # updated_at 자동 추가
            set_clauses.append("updated_at = NOW()")
            values.append(user_id)
            
            query = f"UPDATE users SET {', '.join(set_clauses)} WHERE id = %s"
            
            async with self.db.get_cursor() as (cursor, conn):
                await cursor.execute(query, values)
                await conn.commit()
                
                logger.info(f"✅ User {user_id} updated successfully")
                return cursor.rowcount > 0
                
        except Exception as e:
            logger.error(f"❌ Failed to update user {user_id}: {e}")
            return False
    
    async def change_password(self, user_id: int, new_password: str) -> bool:
        """
        사용자 비밀번호 변경
        
        Args:
            user_id: 사용자 ID
            new_password: 새 비밀번호
            
        Returns:
            bool: 변경 성공 여부
        """
        try:
            password_hash = self.password_service.hash_password(new_password)
            
            async with self.db.get_cursor() as (cursor, conn):
                await cursor.execute(
                    """UPDATE users 
                       SET password_hash = %s, updated_at = NOW() 
                       WHERE id = %s""",
                    (password_hash, user_id)
                )
                await conn.commit()
                
                logger.info(f"✅ Password changed for user {user_id}")
                return cursor.rowcount > 0
                
        except Exception as e:
            logger.error(f"❌ Failed to change password for user {user_id}: {e}")
            return False
    
    async def verify_password(self, user: Dict[str, Any], password: str) -> bool:
        """
        사용자 비밀번호 검증
        
        Args:
            user: 사용자 정보
            password: 입력된 비밀번호
            
        Returns:
            bool: 비밀번호 일치 여부
        """
        return self.password_service.verify_password(password, user['password_hash'])
    
    async def increment_failed_login(self, user_id: int) -> int:
        """
        로그인 실패 횟수 증가
        
        Args:
            user_id: 사용자 ID
            
        Returns:
            int: 현재 실패 횟수
        """
        try:
            async with self.db.get_cursor() as (cursor, conn):
                await cursor.execute(
                    """UPDATE users 
                       SET failed_login_attempts = failed_login_attempts + 1,
                           updated_at = NOW()
                       WHERE id = %s""",
                    (user_id,)
                )
                
                # 현재 실패 횟수 조회
                await cursor.execute(
                    "SELECT failed_login_attempts FROM users WHERE id = %s",
                    (user_id,)
                )
                result = await cursor.fetchone()
                failed_attempts = result[0] if result else 0
                
                # 5회 이상 실패 시 계정 잠금 (30분)
                if failed_attempts >= 5:
                    lock_until = datetime.utcnow() + timedelta(minutes=30)
                    await cursor.execute(
                        """UPDATE users 
                           SET locked_until = %s 
                           WHERE id = %s""",
                        (lock_until, user_id)
                    )
                    logger.warning(f"🔒 User {user_id} locked due to failed login attempts")
                
                await conn.commit()
                return failed_attempts
                
        except Exception as e:
            logger.error(f"❌ Failed to increment failed login for user {user_id}: {e}")
            return 0
    
    async def reset_failed_login(self, user_id: int) -> bool:
        """
        로그인 실패 횟수 초기화
        
        Args:
            user_id: 사용자 ID
            
        Returns:
            bool: 초기화 성공 여부
        """
        try:
            async with self.db.get_cursor() as (cursor, conn):
                await cursor.execute(
                    """UPDATE users 
                       SET failed_login_attempts = 0, 
                           locked_until = NULL,
                           updated_at = NOW()
                       WHERE id = %s""",
                    (user_id,)
                )
                await conn.commit()
                return cursor.rowcount > 0
                
        except Exception as e:
            logger.error(f"❌ Failed to reset failed login for user {user_id}: {e}")
            return False
    
    async def is_user_locked(self, user: Dict[str, Any]) -> bool:
        """
        사용자 계정 잠금 상태 확인
        
        Args:
            user: 사용자 정보
            
        Returns:
            bool: 잠금 상태면 True
        """
        if not user.get('locked_until'):
            return False
        
        return datetime.utcnow() < user['locked_until']
    
    # Refresh Token 관련 메서드들
    
    async def store_refresh_token(self, user_id: int, token_hash: str, expires_at: datetime) -> bool:
        """
        Refresh Token 저장
        
        Args:
            user_id: 사용자 ID
            token_hash: 토큰 해시값
            expires_at: 만료 시간
            
        Returns:
            bool: 저장 성공 여부
        """
        try:
            async with self.db.get_cursor() as (cursor, conn):
                await cursor.execute(
                    """INSERT INTO refresh_tokens (user_id, token_hash, expires_at) 
                       VALUES (%s, %s, %s)""",
                    (user_id, token_hash, expires_at)
                )
                await conn.commit()
                
                logger.info(f"✅ Refresh token stored for user {user_id}")
                return True
                
        except Exception as e:
            logger.error(f"❌ Failed to store refresh token for user {user_id}: {e}")
            return False
    
    async def verify_refresh_token(self, token_hash: str) -> Optional[Dict[str, Any]]:
        """
        Refresh Token 검증
        
        Args:
            token_hash: 토큰 해시값
            
        Returns:
            Optional[Dict[str, Any]]: 토큰과 사용자 정보 (유효하지 않으면 None)
        """
        try:
            async with self.db.get_cursor(aiomysql.DictCursor) as (cursor, conn):
                await cursor.execute(
                    """SELECT rt.*, u.id as user_id, u.email, u.name, u.is_active
                       FROM refresh_tokens rt 
                       JOIN users u ON rt.user_id = u.id 
                       WHERE rt.token_hash = %s 
                         AND rt.expires_at > NOW() 
                         AND u.is_active = TRUE""",
                    (token_hash,)
                )
                return await cursor.fetchone()
                
        except Exception as e:
            logger.error(f"❌ Failed to verify refresh token: {e}")
            return None
    
    async def delete_refresh_token(self, token_hash: str) -> bool:
        """
        Refresh Token 삭제
        
        Args:
            token_hash: 토큰 해시값
            
        Returns:
            bool: 삭제 성공 여부
        """
        try:
            async with self.db.get_cursor() as (cursor, conn):
                await cursor.execute(
                    "DELETE FROM refresh_tokens WHERE token_hash = %s",
                    (token_hash,)
                )
                await conn.commit()
                
                logger.info("✅ Refresh token deleted")
                return cursor.rowcount > 0
                
        except Exception as e:
            logger.error(f"❌ Failed to delete refresh token: {e}")
            return False
    
    async def delete_user_refresh_tokens(self, user_id: int) -> bool:
        """
        사용자의 모든 Refresh Token 삭제 (로그아웃 시)
        
        Args:
            user_id: 사용자 ID
            
        Returns:
            bool: 삭제 성공 여부
        """
        try:
            async with self.db.get_cursor() as (cursor, conn):
                await cursor.execute(
                    "DELETE FROM refresh_tokens WHERE user_id = %s",
                    (user_id,)
                )
                await conn.commit()
                
                logger.info(f"✅ All refresh tokens deleted for user {user_id}")
                return True
                
        except Exception as e:
            logger.error(f"❌ Failed to delete refresh tokens for user {user_id}: {e}")
            return False
    
    async def cleanup_expired_tokens(self) -> int:
        """
        만료된 Refresh Token 정리
        
        Returns:
            int: 삭제된 토큰 수
        """
        try:
            async with self.db.get_cursor() as (cursor, conn):
                await cursor.execute(
                    "DELETE FROM refresh_tokens WHERE expires_at < NOW()"
                )
                await conn.commit()
                
                deleted_count = cursor.rowcount
                if deleted_count > 0:
                    logger.info(f"✅ Cleaned up {deleted_count} expired refresh tokens")
                
                return deleted_count
                
        except Exception as e:
            logger.error(f"❌ Failed to cleanup expired tokens: {e}")
            return 0

# 전역 사용자 서비스 인스턴스
user_service = UserService()

def get_user_service() -> UserService:
    """사용자 서비스 의존성 주입"""
    return user_service