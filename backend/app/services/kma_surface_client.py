import httpx
from typing import List, Dict, Any
from ..config import KMA_API_KEY


def _to_float(token: str) -> float | None:
    """문자열을 float로 변환, 실패시 None 반환"""
    try:
        cleaned = token.strip()
        if not cleaned or cleaned == "-":
            return None
        
        value = float(cleaned)
        return value
    except Exception:
        return None


def _parse_surface_obs(text: str) -> List[Dict[str, Any]]:
    
    lines = [ln for ln in text.splitlines() if ln.strip()]
    
    data_lines = []
    in_data_section = False
    
    for line in lines:
        if line.startswith("#START7777"):
            in_data_section = True
            continue
        elif line.startswith("#7777END"):
            break
        elif in_data_section and not line.startswith("#"):
            data_lines.append(line)
    
    stations = []
    for line in data_lines:
        parts = line.split()
        if len(parts) < 15:  # 최소 필요한 필드 수
            continue
        
        try:
            datetime_str = parts[0]  # YYMMDDHHMI
            station_id = parts[1]    # STN
            wind_dir = _to_float(parts[2])      # WD (풍향)
            wind_speed = _to_float(parts[3])    # WS (풍속)
            gust_speed = _to_float(parts[4])    # GST (돌풍)
            pressure = _to_float(parts[7])      # PA (기압)
            temp = _to_float(parts[11])         # TA (기온)
            humidity = _to_float(parts[13])     # HM (습도)
            
            # 파고(WH) - 실제 데이터에서 확인된 위치
            wave_height = None
            
            # 디버깅: 전체 필드 개수와 마지막 몇 개 필드 확인
            # print(f"🔍 Station {station_id}: Total fields = {len(parts)}")
            # if len(parts) >= 45:
            #     print(f"🔍 Last 10 fields: {parts[-10:]}")
                
            # WH 파고는 뒤에서 4번째 위치 (BF IR IX 앞)
            if len(parts) >= 4:
                wh_index = len(parts) - 4  # 뒤에서 4번째
                wave_height = _to_float(parts[wh_index])
                # print(f"🌊 Station {station_id}: WH at index {wh_index} = {wave_height} (raw: {parts[wh_index]})")
            
            station = {
                "station_id": station_id,
                "datetime": datetime_str,
                "wind_direction": wind_dir,
                "wind_speed": wind_speed,
                "gust_speed": gust_speed,
                "pressure": pressure,
                "temperature": temp,
                "humidity": humidity,
                "wave_height": wave_height,  # 파고 추가
                "source": "KMA_SURFACE"
            }
            stations.append(station)
            
        except (IndexError, ValueError) as e:
            print(f"❌ Error parsing line: {e}")
            continue
    
    print(f"✅ Parsed {len(stations)} surface observations")
    return stations


async def fetch_surface_obs(
    client: httpx.AsyncClient, 
    tm1: str | None = None,
    tm2: str | None = None, 
    stn: str | None = None
) -> List[Dict[str, Any]]:
    """
    KMA 지상 관측 데이터를 가져옴
    API: https://apihub.kma.go.kr/api/typ01/url/kma_sfctm2.php
    
    Args:
        client: HTTP 클라이언트
        tm1: 시작 시간 (YYYYMMDDHHMM 형식) - tm 파라미터로 사용
        tm2: 종료 시간 (사용 안 함)
        stn: 관측소 번호 (빈 값이면 전체)
    """
    url = "https://apihub.kma.go.kr/api/typ01/url/kma_sfctm2.php"
    params = {"authKey": KMA_API_KEY}
    
    # tm1이 있으면 tm 파라미터로 사용 (API 형식에 맞춤)
    if tm1:
        params["tm"] = tm1
    else:
        params["tm"] = ""  # 빈 값으로 최신 데이터 요청
        
    if stn:
        params["stn"] = stn
    else:
        params["stn"] = ""  # 빈 값으로 전체 관측소 요청
    
    params["help"] = ""
    
    try:
        print(f"🔍 Fetching surface observations from: {url}")
        print(f"🔍 Parameters: {params}")
        
        r = await client.get(url, params=params, timeout=15)
        r.raise_for_status()
        
        print(f"📡 Response status: {r.status_code}")
        print(f"📡 Response length: {len(r.text)} characters")
        
        
        stations = _parse_surface_obs(r.text)
        return stations
    except Exception as e:
        print(f"❌ Error fetching surface observations: {e}")
        return []


async def fetch_surface_obs_by_station(
    client: httpx.AsyncClient,
    station_id: str,
    tm1: str | None = None,
    tm2: str | None = None
) -> List[Dict[str, Any]]:
    """특정 관측소의 지상 관측 데이터를 가져옴"""
    return await fetch_surface_obs(client, tm1=tm1, tm2=None, stn=station_id)


def _parse_station_info(text: str) -> List[Dict[str, Any]]:
    """
    stn_inf.php 관측소 정보 응답을 파싱하여 관측소 정보를 반환
    응답 형식: STN_ID LON LAT STN_SP HT HT_PA HT_TA HT_WD HT_RN STN_CD STN_KO STN_EN FCT_ID LAW_ID BASIN
    """
    lines = [ln for ln in text.splitlines() if ln.strip()]
    
    data_lines = []
    in_data_section = False
    
    for line in lines:
        if line.startswith("#START7777"):
            in_data_section = True
            continue
        elif line.startswith("#7777END"):
            break
        elif in_data_section and not line.startswith("#"):
            data_lines.append(line)
    
    stations = []
    for line in data_lines:
        parts = line.split()
        if len(parts) < 12:  # 최소 필요한 필드 수
            continue
        
        try:
            station_id = parts[0]        # STN_ID
            lon = _to_float(parts[1])    # LON (경도)
            lat = _to_float(parts[2])    # LAT (위도)
            station_code = parts[9]      # STN_CD
            station_name_ko = parts[10]  # STN_KO (한글명)
            station_name_en = parts[11]  # STN_EN (영문명)
            
            # 위경도가 유효한 경우만 포함
            if lat is not None and lon is not None:
                station = {
                    "station_id": station_id,
                    "station_name": station_name_ko,
                    "station_name_en": station_name_en,
                    "station_code": station_code,
                    "lat": lat,
                    "lon": lon,
                    "source": "KMA_SURFACE_INFO"
                }
                stations.append(station)
                
        except (IndexError, ValueError):
            continue
    
    return stations


async def fetch_surface_station_info(
    client: httpx.AsyncClient,
    tm: str | None = None
) -> List[Dict[str, Any]]:
    """
    KMA 지상 관측소 정보를 가져옴
    API: https://apihub.kma.go.kr/api/typ01/url/stn_inf.php
    
    Args:
        client: HTTP 클라이언트
        tm: 관측 시간 (YYYYMMDDHHMM 형식, 선택사항)
    """
    url = "https://apihub.kma.go.kr/api/typ01/url/stn_inf.php"
    params = {
        "inf": "SFC",  # 지상관측소
        "stn": "",     # 빈 값으로 전체 관측소
        "help": "1",
        "authKey": KMA_API_KEY
    }
    
    if tm:
        params["tm"] = tm
    else:
        # 기본값으로 최근 시간 설정
        from datetime import datetime, timedelta
        default_time = datetime.now() - timedelta(hours=1)
        params["tm"] = default_time.strftime("%Y%m%d%H00")
    
    try:
        print(f"🔍 Fetching surface station info from: {url}")
        print(f"🔍 Parameters: {params}")
        
        r = await client.get(url, params=params, timeout=15)
        r.raise_for_status()
        
        print(f"📡 Response status: {r.status_code}")
        print(f"📡 Response length: {len(r.text)} characters")
        
        stations = _parse_station_info(r.text)
        print(f"✅ Parsed {len(stations)} surface station info")
        return stations
        
    except Exception as e:
        print(f"❌ Error fetching surface station info: {e}")
        return []


