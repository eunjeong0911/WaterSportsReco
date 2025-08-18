from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx
from typing import List
from .config import ALLOWED_ORIGINS
from .schemas import ConditionResponse
from .deps import get_http_client
from .services.kma_client import fetch_all_stations, fetch_station_by_id

app = FastAPI(title="Marine Conditions API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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