"""
데이터베이스 연결 및 관리 모듈
aiomysql을 사용한 비동기 MySQL 연결 풀 관리
"""

import aiomysql
import logging
from typing import Optional
from contextlib import asynccontextmanager
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class DatabaseManager:
    """데이터베이스 연결 풀 관리 클래스"""
    
    def __init__(self):
        self.pool: Optional[aiomysql.Pool] = None
    
    async def create_pool(self) -> aiomysql.Pool:
        """데이터베이스 연결 풀 생성"""
        try:
            self.pool = await aiomysql.create_pool(
                host=settings.MYSQL_HOST,
                port=settings.MYSQL_PORT,
                user=settings.MYSQL_USER,
                password=settings.MYSQL_PASSWORD,
                db=settings.MYSQL_DATABASE,
                charset='utf8mb4',
                autocommit=False,
                maxsize=20,  # 최대 연결 수
                minsize=1,   # 최소 연결 수
                echo=False   # SQL 로깅 (개발 시에만 True)
            )
            logger.info("✅ Database connection pool created successfully")
            return self.pool
        except Exception as e:
            logger.error(f"❌ Failed to create database pool: {e}")
            raise
    
    async def close_pool(self):
        """데이터베이스 연결 풀 종료"""
        if self.pool:
            self.pool.close()
            await self.pool.wait_closed()
            logger.info("✅ Database connection pool closed")
    
    @asynccontextmanager
    async def get_connection(self):
        """데이터베이스 연결 컨텍스트 매니저"""
        if not self.pool:
            raise RuntimeError("Database pool not initialized")
        
        async with self.pool.acquire() as conn:
            try:
                yield conn
            except Exception as e:
                await conn.rollback()
                logger.error(f"❌ Database operation failed: {e}")
                raise
    
    @asynccontextmanager
    async def get_cursor(self, cursor_class=None):
        """데이터베이스 커서 컨텍스트 매니저"""
        async with self.get_connection() as conn:
            if cursor_class:
                async with conn.cursor(cursor_class) as cursor:
                    try:
                        yield cursor, conn
                    except Exception as e:
                        await conn.rollback()
                        logger.error(f"❌ Database cursor operation failed: {e}")
                        raise
            else:
                async with conn.cursor() as cursor:
                    try:
                        yield cursor, conn
                    except Exception as e:
                        await conn.rollback()
                        logger.error(f"❌ Database cursor operation failed: {e}")
                        raise
    
    async def health_check(self) -> bool:
        """데이터베이스 연결 상태 확인"""
        try:
            async with self.get_cursor() as (cursor, conn):
                await cursor.execute("SELECT 1")
                result = await cursor.fetchone()
                return result[0] == 1
        except Exception as e:
            logger.error(f"❌ Database health check failed: {e}")
            return False

# 전역 데이터베이스 매니저 인스턴스
db_manager = DatabaseManager()

async def init_database():
    """데이터베이스 초기화"""
    try:
        await db_manager.create_pool()
        
        # 연결 테스트
        is_healthy = await db_manager.health_check()
        if not is_healthy:
            raise RuntimeError("Database health check failed")
        
        logger.info("🚀 Database initialized successfully")
        
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        raise

async def close_database():
    """데이터베이스 연결 종료"""
    await db_manager.close_pool()

def get_database() -> DatabaseManager:
    """데이터베이스 매니저 의존성 주입"""
    return db_manager