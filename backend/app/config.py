import os
from dotenv import load_dotenv

load_dotenv()

KMA_API_KEY = os.getenv("KMA_API_KEY", "")
KHOA_API_KEY = os.getenv("KHOA_API_KEY", "")
# 기본 개발 환경 CORS 설정
DEFAULT_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173", 
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()] or DEFAULT_ORIGINS


