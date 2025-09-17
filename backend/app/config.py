import os
from functools import lru_cache
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from pathlib import Path

# 백엔드 루트 디렉토리에서 .env 파일 찾기
backend_root = Path(__file__).parent.parent
env_path = backend_root / ".env"

print(f"🔍 Looking for .env file at: {env_path}")
print(f"🔍 .env file exists: {env_path.exists()}")

load_dotenv(env_path)

class Settings(BaseSettings):
    """애플리케이션 설정 클래스"""
    
    # 기존 API 키들
    KMA_API_KEY: str = ""
    KAKAO_API_KEY: str = ""
    VITE_KAKAO_APPKEY: str = ""
    TOURIST_API_KEY: str = ""
    
    # 데이터베이스 설정
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3306
    MYSQL_DATABASE: str = "water_sports_db"
    MYSQL_USER: str = "water_sports_user"
    MYSQL_PASSWORD: str = "water_sports_password"
    DATABASE_URL: str = ""
    
    # JWT 설정
    JWT_SECRET_KEY: str = "your-super-secret-jwt-key-change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS 설정
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    
    @property
    def allowed_origins_list(self) -> list[str]:
        """CORS 허용 오리진 리스트 반환"""
        default_origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173", 
            "http://localhost:3000",
            "http://127.0.0.1:3000"
        ]
        
        if self.ALLOWED_ORIGINS:
            return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]
        return default_origins
    
    class Config:
        env_file = env_path
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    """설정 인스턴스 반환 (캐시됨)"""
    return Settings()

# 하위 호환성을 위한 기존 변수들
settings = get_settings()
KMA_API_KEY = settings.KMA_API_KEY
KAKAO_API_KEY = settings.KAKAO_API_KEY
VITE_KAKAO_APPKEY = settings.VITE_KAKAO_APPKEY
TOURIST_API_KEY = settings.TOURIST_API_KEY
ALLOWED_ORIGINS = settings.allowed_origins_list


