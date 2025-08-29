#!/usr/bin/env python3
"""
search_places_in_rect 함수 직접 디버그
"""
import asyncio
import httpx
from app.services.kakao_local_client import KakaoLocalClient
from app.config import KAKAO_API_KEY

async def debug_search():
    print(f"🔑 API Key: {KAKAO_API_KEY[:15]}...")
    
    client = KakaoLocalClient(KAKAO_API_KEY)
    
    async with httpx.AsyncClient() as http_client:
        try:
            print("🔍 Starting search...")
            places = await client.search_places_in_rect(
                client=http_client,
                rect="126.14,33.11,126.98,33.60",
                activities=["scuba"]
            )
            print(f"✅ Search completed. Found {len(places)} places")
            
            for i, place in enumerate(places[:5]):  # 처음 5개만 출력
                print(f"  {i+1}. {place.get('name', 'NO_NAME')} at ({place.get('x', 'NO_X')}, {place.get('y', 'NO_Y')})")
                
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_search())
