#!/usr/bin/env python3
"""
카카오 로컬 API 직접 테스트 스크립트
"""
import os
import requests
from dotenv import load_dotenv
from pathlib import Path

# 환경변수 로드
backend_root = Path(__file__).parent
env_path = backend_root / ".env"
print(f"🔍 Loading .env from: {env_path}")
print(f"🔍 .env exists: {env_path.exists()}")

load_dotenv(env_path)

KAKAO_API_KEY = os.getenv("KAKAO_API_KEY", "")
print(f"🔑 KAKAO_API_KEY loaded: {'YES' if KAKAO_API_KEY else 'NO'}")
print(f"🔑 Key length: {len(KAKAO_API_KEY)}")
print(f"🔑 Key preview: {KAKAO_API_KEY[:15]}..." if KAKAO_API_KEY else "🔑 Key preview: EMPTY")

if not KAKAO_API_KEY:
    print("❌ KAKAO_API_KEY is not set!")
    exit(1)

# 카카오 로컬 API 직접 호출
url = "https://dapi.kakao.com/v2/local/search/keyword.json"
headers = {"Authorization": f"KakaoAK {KAKAO_API_KEY}"}
params = {
    "query": "해수욕장",
    "rect": "126.14,33.11,126.98,33.60",  # 제주도
    "page": 1,
    "size": 15
}

print(f"\n🔥 Testing Kakao API:")
print(f"🔥 URL: {url}")
print(f"🔥 Headers: {headers}")
print(f"🔥 Params: {params}")

try:
    response = requests.get(url, headers=headers, params=params, timeout=10)
    print(f"\n🔥 Response Status: {response.status_code}")
    print(f"🔥 Response Headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        data = response.json()
        documents = data.get("documents", [])
        print(f"✅ Success! Found {len(documents)} places")
        
        if documents:
            print(f"📍 First result: {documents[0]['place_name']}")
            print(f"📍 Address: {documents[0].get('address_name', 'N/A')}")
            print(f"📍 Coordinates: ({documents[0]['x']}, {documents[0]['y']})")
        else:
            print("⚠️ No places found")
            
        print(f"\n🔍 Full response: {response.text[:1000]}")
    else:
        print(f"❌ API Error: {response.status_code}")
        print(f"❌ Error response: {response.text}")
        
except Exception as e:
    print(f"❌ Exception: {e}")
