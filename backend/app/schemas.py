from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ConditionResponse(BaseModel):
    spotName: str
    lat: float
    lon: float
    sst: Optional[float] = None
    wave_height: Optional[float] = None
    current_speed: Optional[float] = None
    observed_at: Optional[str] = None
    source: str = "KMA"

class PlaceResponse(BaseModel):
    id: str
    name: str
    activity: str
    category: str
    phone: str
    address: str
    road_address: str
    x: float  # 경도
    y: float  # 위도
    place_url: str
    distance: str
    source: str
    collected_at: Optional[str] = None
    search_keyword: str

class PlacesInRectResponse(BaseModel):
    places: List[PlaceResponse]
    count: int
    activities: List[str]
    rect: str