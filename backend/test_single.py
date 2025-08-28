#!/usr/bin/env python3
"""
단일 키워드로 간단 테스트 (Rate Limit 방지)
"""
import asyncio
import httpx
from app.services.kakao_local_client import KakaoLocalClient
from app.config import KAKAO_API_KEY

async def test_single_keyword():
    print(f"🔑 API Key: {KAKAO_API_KEY[:15]}...")
    
    client = KakaoLocalClient(KAKAO_API_KEY)
    
    async with httpx.AsyncClient() as http_client:
        try:
            print("🔍 Testing single keyword search...")
            places = await client._search_by_keyword(
                client=http_client,
                keyword="해수욕장",  # 확실히 있는 키워드
                rect="126.14,33.11,126.98,33.60",
                max_results=5
            )
            print(f"✅ Search completed. Found {len(places)} places")
            
            for i, place in enumerate(places):
                print(f"  {i+1}. {place.get('name', 'NO_NAME')} at ({place.get('x', 'NO_X')}, {place.get('y', 'NO_Y')})")
                
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    # Rate limit을 피하기 위해 잠시 대기
    print("⏳ Waiting for rate limit to reset...")
    await asyncio.sleep(10)
    await test_single_keyword()
