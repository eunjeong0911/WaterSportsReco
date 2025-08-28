import httpx
import asyncio
import json
from datetime import datetime
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

# 활동별 검색 키워드 맵
ACTIVITY_KEYWORDS = {
    "surfing": ["서핑", "서핑샵", "서핑스쿨", "서핑보드 대여"],
    "scuba": ["스쿠버다이빙", "다이빙 센터", "다이빙샵", "다이빙 교육"],
    "snorkel": ["스노클링", "스노클 장비대여", "스노클 투어"],
    "freedive": ["프리다이빙", "프리다이빙 교육"],
    "kayak": ["카약", "카누", "SUP"],
    "yacht": ["요트 투어", "세일링 스쿨"],
    "jetski": ["제트스키"],
    "windsurf": ["윈드서핑", "카이트서핑"],
    "fishing": ["낚시", "바다낚시", "선상낚시", "갯바위낚시", "낚시용품점"],
    "beach": ["해수욕장"],
    "marine_info": ["해양관측소", "해양정보", "조위관측소", "해수욕장"]
}

class KakaoLocalClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://dapi.kakao.com/v2/local/search/keyword.json"
        self.headers = {"Authorization": f"KakaoAK {api_key}"}
        
    async def search_places_in_rect(
        self, 
        client: httpx.AsyncClient,
        rect: str,  # "minLng,minLat,maxLng,maxLat"
        activities: List[str],
        max_results_per_activity: int = 45  # 3페이지 * 15개
    ) -> List[Dict]:
        """
        지정된 사각형 영역 내에서 활동별로 장소를 검색
        """
        all_places = []
        seen_ids = set()
        seen_locations = set()  # (name, phone) 조합으로 중복 체크
        
        for activity in activities:
            if activity not in ACTIVITY_KEYWORDS:
                logger.warning(f"Unknown activity: {activity}")
                continue
                
            keywords = ACTIVITY_KEYWORDS[activity]
            activity_places = []
            
            logger.info(f"🔍 Searching for activity '{activity}' with keywords: {keywords}")
            
            for keyword in keywords:
                try:
                    logger.info(f"  🔎 Searching keyword: '{keyword}' in rect: {rect}")
                    places = await self._search_by_keyword(
                        client, keyword, rect, max_results_per_activity // len(keywords)
                    )
                    
                    for place in places:
                        # ID 기반 중복 제거
                        if place["id"] in seen_ids:
                            continue
                            
                        # 위치+이름 기반 중복 제거
                        location_key = (place["name"], place.get("phone", ""))
                        if location_key in seen_locations:
                            continue
                            
                        # 활동 정보 추가
                        place["activity"] = activity
                        place["search_keyword"] = keyword
                        place["source"] = "kakao"
                        place["collected_at"] = datetime.now().isoformat()
                        
                        activity_places.append(place)
                        seen_ids.add(place["id"])
                        seen_locations.add(location_key)
                        
                    # API 레이트 제한 고려 - 더 긴 대기 시간
                    await asyncio.sleep(0.5)
                    
                except Exception as e:
                    logger.error(f"Error searching for {keyword}: {e}")
                    continue
                    
            all_places.extend(activity_places)
            
        logger.info(f"Found {len(all_places)} unique places for activities {activities}")
        return all_places
    
    async def _search_by_keyword(
        self, 
        client: httpx.AsyncClient,
        keyword: str, 
        rect: str,
        max_results: int = 15
    ) -> List[Dict]:
        """
        키워드로 장소 검색 (페이지네이션 지원)
        """
        places = []
        page = 1
        size = 15  # 카카오 API 최대값
        
        while len(places) < max_results and page <= 3:  # 최대 3페이지
            params = {
                "query": keyword,
                "rect": rect,
                "page": page,
                "size": size
            }
            
            try:
                logger.info(f"🔥 API Request: {self.base_url} with params: {params}")
                logger.info(f"🔥 Headers: {self.headers}")
                
                response = await client.get(
                    self.base_url,
                    headers=self.headers,
                    params=params,
                    timeout=10.0
                )
                
                logger.info(f"🔥 Response status: {response.status_code}")
                logger.info(f"🔥 Response headers: {dict(response.headers)}")
                
                response.raise_for_status()
                
                data = response.json()
                documents = data.get("documents", [])
                meta = data.get("meta", {})
                
                logger.info(f"🔥 API Response - Found {len(documents)} places, is_end: {meta.get('is_end', True)}")
                
                if not documents:
                    break
                    
                for doc in documents:
                    place = {
                        "id": doc["id"],
                        "name": doc["place_name"],
                        "activity": keyword,  # 검색한 키워드로 활동 추정
                        "category": doc["category_name"],
                        "phone": doc.get("phone", ""),
                        "addr": doc.get("road_address_name") or doc.get("address_name", ""),
                        "x": float(doc["x"]),  # 경도
                        "y": float(doc["y"]),  # 위도
                        "kakao_link": doc.get("place_url", ""),
                        "source": "kakao",
                        "collectedAt": None
                    }
                    places.append(place)
                    logger.info(f"  📍 {place['name']} at ({place['x']}, {place['y']})")
                    
                    if len(places) >= max_results:
                        break
                        
                # 다음 페이지가 없으면 종료
                meta = data.get("meta", {})
                if meta.get("is_end", True):
                    break
                    
                page += 1
                await asyncio.sleep(0.05)  # 50ms 대기
                
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:
                    logger.warning("Rate limit exceeded, waiting longer...")
                    await asyncio.sleep(5.0)  # 5초 대기
                    continue
                elif e.response.status_code == 401:
                    logger.error(f"Unauthorized: Invalid API key")
                    break
                elif e.response.status_code == 403:
                    logger.error(f"Forbidden: API key permissions issue")
                    break
                else:
                    logger.error(f"HTTP error {e.response.status_code}: {e}")
                    logger.error(f"Response body: {e.response.text}")
                    break
            except Exception as e:
                logger.error(f"Unexpected error: {e}")
                break
                
        return places[:max_results]
