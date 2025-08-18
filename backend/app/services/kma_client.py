from typing import Dict, Any, List
import httpx
from ..config import KMA_API_KEY


def _to_float(token: str) -> float | None:
    try:
        if token is None:
            return None
        cleaned = token.strip().strip(",=")
        if cleaned in {"", "-99", "-99.0"}:
            return None
        return float(cleaned)
    except Exception:
        return None


def _parse_sea_obs_all(text: str) -> List[Dict[str, Any]]:
    """
    sea_obs.php 전체 지점 응답을 파싱하여 모든 지점 정보를 반환
    응답 형식: TP, TM, STN_ID, STN_KO, LON, LAT, WH, WD, WS, WS_GST, TW, TA, PA, HM, ...
    """
    lines = [ln for ln in text.splitlines() if ln.strip() and not ln.strip().startswith("#")]
    data_lines = [ln for ln in lines if "," in ln]
    
    stations = []
    for row in data_lines:
        cols = [c.strip() for c in row.split(",")]
        if len(cols) < 14:
            continue
            
        tp = cols[0]         # TP (관측종류)
        tm = cols[1]         # TM (관측시각)
        stn_id = cols[2]     # STN_ID
        stn_name = cols[3]   # STN_KO
        lon = _to_float(cols[4])  # LON (경도)
        lat = _to_float(cols[5])  # LAT (위도)
        wh = _to_float(cols[6])   # WH (유의파고)
        tw = _to_float(cols[10])  # TW (해수면 온도)
        
        # 위경도가 유효한 경우만 포함
        if lat is not None and lon is not None:
            station = {
                "station_id": stn_id,
                "station_name": stn_name,
                "lat": lat,
                "lon": lon,
                "sst": tw,
                "wave_height": wh,
                "observed_at": tm,
                "tp": tp,
                "source": "KMA"
            }
            stations.append(station)
    
    return stations


async def fetch_all_stations(client: httpx.AsyncClient, tm: str | None = None) -> List[Dict[str, Any]]:
    """모든 지점의 해양 관측 데이터를 가져옴"""
    url = "https://apihub.kma.go.kr/api/typ01/url/sea_obs.php"
    params = {"stn": 0, "authKey": KMA_API_KEY}
    if tm:
        params["tm"] = tm
    
    try:
        r = await client.get(url, params=params, timeout=15)
        r.raise_for_status()
        stations = _parse_sea_obs_all(r.text)
        return stations
    except Exception as e:
        print(f"Error fetching stations: {e}")
        return []


async def fetch_station_by_id(client: httpx.AsyncClient, station_id: str, tm: str | None = None) -> Dict[str, Any]:
    """특정 지점의 해양 관측 데이터를 가져옴"""
    url = "https://apihub.kma.go.kr/api/typ01/url/sea_obs.php"
    params = {"stn": station_id, "authKey": KMA_API_KEY}
    if tm:
        params["tm"] = tm
    
    try:
        r = await client.get(url, params=params, timeout=10)
        r.raise_for_status()
        stations = _parse_sea_obs_all(r.text)
        if stations:
            return stations[0]
        return {}
    except Exception as e:
        print(f"Error fetching station {station_id}: {e}")
        return {}