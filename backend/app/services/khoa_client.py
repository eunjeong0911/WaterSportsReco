from typing import Dict, Any
import httpx, math, datetime as dt
from ..config import KHOA_API_KEY


def _center_bbox(lat, lon, half_km=2.0):
    # 간단 bbox(약식) — 실제로는 면단위 API 스펙에 맞게 파라미터 구성
    dlat = half_km / 111.0
    dlon = half_km / (111.0 * math.cos(math.radians(lat)))
    return lat - dlat, lon - dlon, lat + dlat, lon + dlon


async def fetch_khoa_current(client: httpx.AsyncClient, lat: float, lon: float) -> Dict[str, Any]:
    if not KHOA_API_KEY:
        return {"current_speed": None, "current_dir": None, "current_time": None}
    # 면단위 수치조류도 예측 유향·유속 (예시 URL, 기관 스펙에 맞춰 파라미터명 수정)
    # 문서: 데이터포털 "수치조류도 예측 유향 유속"
    # https://www.data.go.kr/data/15039006/openapi.do
    s_lat, s_lon, e_lat, e_lon = _center_bbox(lat, lon)
    url = "http://www.khoa.go.kr/oceangrid/khoa/takepart/openapi/openApiTidalCurrentArea.do"
    params = {
        "ServiceKey": KHOA_API_KEY,
        "ResultType": "json",
        "DateTime": dt.datetime.utcnow().strftime("%Y%m%d%H%M"),
        "MinLat": s_lat,
        "MinLon": s_lon,
        "MaxLat": e_lat,
        "MaxLon": e_lon,
    }
    r = await client.get(url, params=params, timeout=10)
    j = r.json()
    # TODO: 기관 응답 스키마에 맞춰 가장 가까운 격자점 1개 추출
    return {"current_speed": None, "current_dir": None, "current_time": None}


