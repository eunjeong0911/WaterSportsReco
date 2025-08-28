#!/usr/bin/env python3
"""
간단한 스쿠버다이빙 검색 테스트
"""
import os
import requests
from dotenv import load_dotenv
from pathlib import Path

# 환경변수 로드
backend_root = Path(__file__).parent
env_path = backend_root / ".env"
load_dotenv(env_path)

KAKAO_API_KEY = os.getenv("KAKAO_API_KEY", "")

# 스쿠버 관련 키워드들을 직접 테스트
keywords = ["스쿠버다이빙", "다이빙 센터", "다이빙샵", "다이빙 교육"]
url = "https://dapi.kakao.com/v2/local/search/keyword.json"
headers = {"Authorization": f"KakaoAK {KAKAO_API_KEY}"}

print(f"🔍 Testing scuba keywords in Jeju...")

total_found = 0
for keyword in keywords:
    params = {
        "query": keyword,
        "rect": "126.14,33.11,126.98,33.60",  # 제주도
        "page": 1,
        "size": 15
    }
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            documents = data.get("documents", [])
            print(f"  🔎 '{keyword}': {len(documents)} places found")
            total_found += len(documents)
            
            for i, doc in enumerate(documents[:3]):  # 처음 3개만 출력
                print(f"    {i+1}. {doc['place_name']} at ({doc['x']}, {doc['y']})")
        else:
            print(f"  ❌ '{keyword}': Error {response.status_code}")
    except Exception as e:
        print(f"  ❌ '{keyword}': Exception {e}")

print(f"\n📊 Total places found: {total_found}")
