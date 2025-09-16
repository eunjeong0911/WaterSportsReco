from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx
import asyncio
from .config import ALLOWED_ORIGINS, KAKAO_API_KEY, VITE_KAKAO_APPKEY
from .deps import get_http_client

from .services.kma_marine_client import fetch_all_stations
from .services.kma_surface_client import fetch_surface_obs, fetch_surface_obs_by_station, fetch_surface_station_info
from .services.tourist_client import fetch_tourist_spots, fetch_tourist_spot_by_id

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

#=============================================================================
# 해양 관측소 API
#=============================================================================
@app.get("/api/stations")
async def get_all_stations(
    tm: str | None = Query(None, description="KST 시각 YYYYMMDDHHMM"),
    client: httpx.AsyncClient = Depends(get_http_client),
):
    try:
        stations = await fetch_all_stations(client, tm)
        return {"stations": stations, "count": len(stations)}
    except Exception as e:
        return {"error": str(e), "stations": [], "count": 0}

#=============================================================================
# 지상 관측 API
#=============================================================================
@app.get("/api/surface-obs")
async def get_surface_observations(
    tm1: str | None = Query(None, description="시작 시간 YYYYMMDDHHMM"),
    tm2: str | None = Query(None, description="종료 시간 YYYYMMDDHHMM"), 
    stn: str | None = Query(None, description="관측소 번호"),
    client: httpx.AsyncClient = Depends(get_http_client),
):
    try:
        observations = await fetch_surface_obs(client, tm1=tm1, tm2=tm2, stn=stn)
        return {"observations": observations, "count": len(observations)}
    except Exception as e:
        return {"error": str(e), "observations": [], "count": 0}


@app.get("/api/surface-stations")
async def get_surface_station_info(
    tm: str | None = Query(None, description="관측 시간 YYYYMMDDHHMM"),
    client: httpx.AsyncClient = Depends(get_http_client),
):
    """지상 관측소 정보를 반환 (위치, 한글명 포함)"""
    try:
        stations = await fetch_surface_station_info(client, tm)
        return {"stations": stations, "count": len(stations)}
    except Exception as e:
        return {"error": str(e), "stations": [], "count": 0}


@app.get("/api/surface-stations-with-obs")
async def get_surface_stations_with_observations(
    tm: str | None = Query(None, description="관측 시간 YYYYMMDDHHMM"),
    client: httpx.AsyncClient = Depends(get_http_client),
):
    """
    지상관측소 정보와 실시간 관측 데이터를 결합하여 반환
    """
    try:
        # 관측소 정보와 실시간 관측 데이터를 병렬로 가져오기
        stations_info, observations = await asyncio.gather(
            fetch_surface_station_info(client, tm),
            fetch_surface_obs(client, tm1=tm)
        )
        
        # station_id를 키로 하는 관측 데이터 딕셔너리 생성
        obs_dict = {obs["station_id"]: obs for obs in observations}
        
        # 관측소 정보와 관측 데이터를 결합
        combined_stations = []
        matched_count = 0
        unmatched_stations = []
        
        for station in stations_info:
            station_id = station["station_id"]
            
            # 기본 관측소 정보 복사
            combined_station = station.copy()
            
            # 해당 관측소의 실시간 관측 데이터가 있으면 추가
            if station_id in obs_dict:
                matched_count += 1
                obs_data = obs_dict[station_id]
                combined_station.update({
                    "wind_direction": obs_data.get("wind_direction"),
                    "wind_speed": obs_data.get("wind_speed"),
                    "gust_speed": obs_data.get("gust_speed"),
                    "pressure": obs_data.get("pressure"),
                    "temperature": obs_data.get("temperature"),
                    "humidity": obs_data.get("humidity"),
                    "wave_height": obs_data.get("wave_height"),
                    "observed_at": obs_data.get("datetime")
                })
            else:
                unmatched_stations.append(station_id)
            
            combined_stations.append(combined_station)
        
        print(f"✅ Combined {len(combined_stations)} surface stations with observations")
        return {"stations": combined_stations, "count": len(combined_stations)}
        
    except Exception as e:
        print(f"❌ Error combining surface stations with observations: {e}")
        return {"error": str(e), "stations": [], "count": 0}


#=============================================================================
# 관광지 API
#=============================================================================
@app.get("/api/tourist-spots")
async def get_tourist_spots(
    area_code: str | None = Query(None, description="지역 코드"),
    sigungu_code: str | None = Query(None, description="시군구 코드"),
    content_type_id: str = Query("28", description="콘텐츠 타입 ID"),
    cat1: str | None = Query("A03", description="대분류 카테고리"),
    cat2: str | None = Query("A0303", description="중분류 카테고리"),
    cat3: str | None = Query(None, description="소분류 카테고리"),
    num_of_rows: int = Query(476, description="한 번에 가져올 결과 수"),  # 원래대로 476개
    page_no: int = Query(1, description="페이지 번호"),
    client: httpx.AsyncClient = Depends(get_http_client),
):
    try:
        tourist_spots = await fetch_tourist_spots(
            client=client,
            area_code=area_code,
            sigungu_code=sigungu_code,
            content_type_id=content_type_id,
            cat1=cat1,
            cat2=cat2,
            cat3=cat3,
            num_of_rows=num_of_rows,
            page_no=page_no
        )
        return {"tourist_spots": tourist_spots, "count": len(tourist_spots)}
    except Exception as e:
        return {"error": str(e), "tourist_spots": [], "count": 0}


#=============================================================================
# 관광지 상세정보 API
#=============================================================================
@app.get("/api/tourist-spots/{content_id}")
async def get_tourist_spot_detail(
    content_id: str,
    client: httpx.AsyncClient = Depends(get_http_client),
):
    try:
        tourist_spot = await fetch_tourist_spot_by_id(client, content_id)
        return tourist_spot
    except Exception as e:
        return {"error": str(e)}