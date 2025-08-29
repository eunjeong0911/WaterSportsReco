from fastapi import FastAPI, Depends, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
from typing import List
from .config import ALLOWED_ORIGINS, KAKAO_API_KEY, VITE_KAKAO_APPKEY
from .schemas import ConditionResponse, PlacesInRectResponse
from .deps import get_http_client
from .services.kma_client import fetch_all_stations, fetch_station_by_id
from .services.kakao_local_client import KakaoLocalClient

app = FastAPI(title="Marine Conditions API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 환경변수 확인 및 로깅
print(f"🔑 KAKAO_API_KEY loaded: {'YES' if KAKAO_API_KEY else 'NO'} (length: {len(KAKAO_API_KEY) if KAKAO_API_KEY else 0})")
print(f"🔑 VITE_KAKAO_APPKEY loaded: {'YES' if VITE_KAKAO_APPKEY else 'NO'} (length: {len(VITE_KAKAO_APPKEY) if VITE_KAKAO_APPKEY else 0})")

# 카카오 로컬 API 클라이언트 초기화 (사업장 검색용)
kakao_client = KakaoLocalClient(KAKAO_API_KEY) if KAKAO_API_KEY else None
print(f"🏢 kakao_client initialized: {'YES' if kakao_client else 'NO'}")

# 해양정보용 카카오 클라이언트 (VITE_KAKAO_APPKEY 사용)
marine_kakao_client = KakaoLocalClient(VITE_KAKAO_APPKEY) if VITE_KAKAO_APPKEY else None
print(f"🌊 marine_kakao_client initialized: {'YES' if marine_kakao_client else 'NO'}")


@app.get("/api/stations")
async def get_all_stations(
    tm: str | None = Query(None, description="KST 시각 YYYYMMDDHHMM"),
    client: httpx.AsyncClient = Depends(get_http_client),
):
    """모든 해양 관측소 데이터를 반환"""
    try:
        stations = await fetch_all_stations(client, tm)
        return {"stations": stations, "count": len(stations)}
    except Exception as e:
        return {"error": str(e), "stations": [], "count": 0}


@app.get("/api/conditions", response_model=ConditionResponse)
async def get_conditions(
    station_id: str = Query(..., description="KMA 지점 ID"),
    tm: str | None = Query(None, description="KST 시각 YYYYMMDDHHMM"),
    client: httpx.AsyncClient = Depends(get_http_client),
):
    """특정 지점의 해양 조건 데이터를 반환"""
    try:
        station_data = await fetch_station_by_id(client, station_id, tm)
        if not station_data:
            return ConditionResponse(
                spotName="Unknown",
                lat=0.0,
                lon=0.0,
                sst=None,
                wave_height=None,
                current_speed=None,
                observed_at=None,
                source="KMA",
            )
        
        return ConditionResponse(
            spotName=station_data.get("station_name", "Unknown"),
            lat=station_data.get("lat", 0.0),
            lon=station_data.get("lon", 0.0),
            sst=station_data.get("sst"),
            wave_height=station_data.get("wave_height"),
            current_speed=None,
            observed_at=station_data.get("observed_at"),
            source="KMA",
        )
    except Exception as e:
        return ConditionResponse(
            spotName="Error",
            lat=0.0,
            lon=0.0,
            sst=None,
            wave_height=None,
            current_speed=None,
            observed_at=None,
            source="KMA",
        )


@app.get("/api/places/in-rect", response_model=PlacesInRectResponse)
async def get_places_in_rect(
    rect: str = Query(..., description="영역 좌표: minLng,minLat,maxLng,maxLat"),
    activities: str = Query(..., description="활동 종류: scuba,kayak,beach 등 (쉼표로 구분)"),
    client: httpx.AsyncClient = Depends(get_http_client),
):
    """지정된 사각형 영역 내의 해양레저 사업장을 검색"""
    # 활동 목록 파싱
    activity_list = [activity.strip() for activity in activities.split(",") if activity.strip()]
    
    if not activity_list:
        raise HTTPException(status_code=400, detail="At least one activity must be specified")
    
    # 해양정보인 경우 marine_kakao_client 사용, 그 외는 일반 kakao_client 사용
    if "marine_info" in activity_list:
        client_to_use = marine_kakao_client
        if not client_to_use:
            raise HTTPException(status_code=500, detail="Marine Kakao API key (VITE_KAKAO_APPKEY) not configured")
    else:
        client_to_use = kakao_client
        if not client_to_use:
            raise HTTPException(status_code=500, detail="Kakao API key not configured")
    
    try:
        print(f"🔍 Searching places with rect: {rect}, activities: {activity_list}")
        print(f"🔑 Using client: {'marine_kakao_client' if 'marine_info' in activity_list else 'kakao_client'}")
        print(f"🔑 Client object: {client_to_use}")
        print(f"🔑 Client API key (first 10 chars): {client_to_use.api_key[:10] if client_to_use and client_to_use.api_key else 'None'}...")
        
        # 카카오 로컬 API로 장소 검색
        places = await client_to_use.search_places_in_rect(
            client=client,
            rect=rect,
            activities=activity_list
        )
        
        print(f"✅ Found {len(places)} places")
        if len(places) > 0:
            print(f"📍 First place example: {places[0].get('name', 'N/A')}")
        
        return PlacesInRectResponse(
            places=places,
            count=len(places),
            activities=activity_list,
            rect=rect
        )
        
    except Exception as e:
        print(f"❌ Search failed: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")