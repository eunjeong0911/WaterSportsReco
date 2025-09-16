from typing import Dict, Any, List, Optional
import httpx
import xml.etree.ElementTree as ET
from ..config import TOURIST_API_KEY


def _parse_tourist_data(text: str) -> List[Dict[str, Any]]:
    """
    XML 응답을 파싱하여 관광지 정보를 반환
    """
    try:
        root = ET.fromstring(text)
        
        namespaces = {
            'ns': 'http://www.openapi.or.kr/'
        }
        
        tourist_spots = []
        
        # item 요소들을 찾기
        items = root.findall('.//item')
        if not items:
            # 네임스페이스가 있는 경우
            items = root.findall('.//ns:item', namespaces)
        
        for item in items:
            try:
                # 기본 정보
                content_id = item.find('contentid')
                title = item.find('title')
                address = item.find('addr1')
                address2 = item.find('addr2')
                map_x = item.find('mapx')  # 경도
                map_y = item.find('mapy')  # 위도
                first_image = item.find('firstimage')
                category = item.find('cat1')
                tel = item.find('tel')
                
                # 지역 관련 정보
                area_code = item.find('areacode')
                sigungu_code = item.find('sigungucode')
                content_type_id = item.find('contenttypeid')
                
                # 위경도 변환
                lat = None
                lon = None
                if map_y is not None and map_y.text:
                    try:
                        lat = float(map_y.text)
                    except ValueError:
                        pass
                if map_x is not None and map_x.text:
                    try:
                        lon = float(map_x.text)
                    except ValueError:
                        pass
                
                tourist_spot = {
                    "content_id": content_id.text if content_id is not None else "",
                    "title": title.text if title is not None else "",
                    "addr1": address.text if address is not None else "",
                    "addr2": address2.text if address2 is not None else "",
                    "mapy": lat,
                    "mapx": lon,
                    "tel": tel.text if tel is not None else "",
                    "category": category.text if category is not None else "",
                    "image_url": first_image.text if first_image is not None else "",
                    "areacode": area_code.text if area_code is not None else "",
                    "sigungucode": sigungu_code.text if sigungu_code is not None else "",
                    "contenttypeid": content_type_id.text if content_type_id is not None else "",
                    "source": "TOURIST"
                }
                
                # 유효한 위경도가 있는 경우만 포함
                if lat is not None and lon is not None:
                    tourist_spots.append(tourist_spot)
                    
            except Exception as e:
                print(f"Error parsing tourist item: {e}")
                continue
    
        return tourist_spots
        
    except ET.ParseError as e:
        print(f"XML parsing error: {e}")
        # XML 파싱 실패 시 텍스트 기반 파싱 시도
        return _parse_tourist_data_text(text)
    except Exception as e:
        print(f"Unexpected error in tourist data parsing: {e}")
        return []


def _parse_tourist_data_text(text: str) -> List[Dict[str, Any]]:
    """
    텍스트 기반 파싱 (XML 파싱 실패 시 사용)
    """
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    
    tourist_spots = []
    for line in lines:
        # API 응답이 공백으로 구분된 형태로 보임
        parts = line.split()
        if len(parts) < 10:
            continue
            
        try:
            # 응답 구조에 따라 파싱 (실제 응답 형식에 맞게 조정 필요)
            tourist_spot = {
                "content_id": parts[0] if len(parts) > 0 else "",
                "title": parts[1] if len(parts) > 1 else "",
                "address": parts[2] if len(parts) > 2 else "",
                "lat": float(parts[3]) if len(parts) > 3 and parts[3].replace('.', '').replace('-', '').isdigit() else None,
                "lon": float(parts[4]) if len(parts) > 4 and parts[4].replace('.', '').replace('-', '').isdigit() else None,
                "category": parts[5] if len(parts) > 5 else "",
                "image_url": parts[6] if len(parts) > 6 else "",
                "description": parts[7] if len(parts) > 7 else "",
                "source": "TOURIST"
            }
            
            # 위경도가 유효한 경우만 포함
            if tourist_spot["lat"] is not None and tourist_spot["lon"] is not None:
                tourist_spots.append(tourist_spot)
                
        except (ValueError, IndexError) as e:
            print(f"Error parsing tourist data line: {e}")
            continue
    
    return tourist_spots


async def fetch_tourist_spots(
    client: httpx.AsyncClient, 
    area_code: Optional[str] = None,
    sigungu_code: Optional[str] = None,
    content_type_id: str = "28",
    cat1: Optional[str] = "A03",
    cat2: Optional[str] = "A0303", 
    cat3: Optional[str] = None,
    num_of_rows: int = 476,
    page_no: int = 1
) -> List[Dict[str, Any]]:
    """관광지 정보를 가져옴"""
    url = "http://apis.data.go.kr/B551011/KorService2/areaBasedList2"
    
    params = {
        "numOfRows": num_of_rows,
        "pageNo": page_no,
        "MobileOS": "ETC",
        "MobileApp": "AppTest",
        "ServiceKey": TOURIST_API_KEY,
        "arrange": "A",
        "contentTypeId": content_type_id
    }
    
    # 카테고리 파라미터들을 동적으로 추가
    if cat1:
        params["cat1"] = cat1
    if cat2:
        params["cat2"] = cat2
    if cat3:
        params["cat3"] = cat3
    
    if area_code:
        params["areaCode"] = area_code
    if sigungu_code:
        params["sigunguCode"] = sigungu_code
    
    try:
        r = await client.get(url, params=params, timeout=15)
        r.raise_for_status()
        
        # XML 응답을 파싱 (실제로는 XML 파서 사용 필요)
        tourist_spots = _parse_tourist_data(r.text)
        return tourist_spots
        
    except Exception as e:
        print(f"Error fetching tourist spots: {e}")
        return []


async def fetch_tourist_spot_by_id(
    client: httpx.AsyncClient, 
    content_id: str
) -> Dict[str, Any]:
    """특정 관광지의 상세 정보를 가져옴"""
    url = "http://apis.data.go.kr/B551011/KorService2/detailCommon"
    
    params = {
        "MobileOS": "ETC",
        "MobileApp": "AppTest",
        "ServiceKey": TOURIST_API_KEY,
        "contentId": content_id,
        "defaultYN": "Y",
        "firstImageYN": "Y",
        "addrinfoYN": "Y",
        "mapinfoYN": "Y",
        "overviewYN": "Y"
    }
    
    try:
        r = await client.get(url, params=params, timeout=10)
        r.raise_for_status()
        
        # XML 응답을 파싱 (실제로는 XML 파서 사용 필요)
        # 여기서는 간단한 텍스트 파싱 사용
        return {"content_id": content_id, "raw_response": r.text}
        
    except Exception as e:
        print(f"Error fetching tourist spot {content_id}: {e}")
        return {}
