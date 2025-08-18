from pydantic import BaseModel
from typing import Optional


class ConditionResponse(BaseModel):
    spotName: str
    lat: float
    lon: float
    # 단위: 수온(°C), 파고(m), 조류속도(m/s)
    sst: Optional[float] = None
    wave_height: Optional[float] = None
    current_speed: Optional[float] = None
    observed_at: Optional[str] = None  # ISO 시각
    source: str = "KMA"


