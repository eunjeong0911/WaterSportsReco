import { useEffect, useRef, useState } from "react";
import useKakaoLoader from "../hooks/useKakaoLoader";
import { getTouristSpots, getMarineStations, getSurfaceStations } from "../api/client";

const KAKAO_APPKEY = import.meta.env.VITE_KAKAO_APPKEY;

export default function MapView({ onRegionSelect }) {
  const { loaded, error } = useKakaoLoader(KAKAO_APPKEY);
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const infoWindowRef = useRef(null);
  const touristMarkersRef = useRef([]);
  const marineMarkersRef = useRef([]);
  const surfaceMarkersRef = useRef([]);
  const [touristSpots, setTouristSpots] = useState([]);
  const [touristSpotsLoading, setTouristSpotsLoading] = useState(false);
  const [marineStations, setMarineStations] = useState([]);
  const [marineStationsLoading, setMarineStationsLoading] = useState(false);
  const [surfaceStations, setSurfaceStations] = useState([]);
  const [surfaceStationsLoading, setSurfaceStationsLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("전체");
  const [availableRegions, setAvailableRegions] = useState(["전체"]);
  const [showMarineStations, setShowMarineStations] = useState(true);
  const [showSurfaceStations, setShowSurfaceStations] = useState(true);

  // 관광지 데이터 가져오기
  const fetchTouristSpots = async () => {
    setTouristSpotsLoading(true);
    try {
      console.log("🔄 Fetching tourist spots...");
      const data = await getTouristSpots();
      const spots = data?.tourist_spots || [];
      console.log(`✅ Loaded ${spots.length} tourist spots`);
      
      // 첫 번째 관광지 데이터 구조 확인
      if (spots.length > 0) {
        console.log("📋 Sample tourist spot:", spots[0]);
        console.log("📋 Fields available:", Object.keys(spots[0]));
        
        // 주소에서 지역 추출
        const regions = extractRegionsFromData(spots);
        console.log("🗺️ Available regions:", regions);
        setAvailableRegions(["전체", ...regions]);
      }
      
      setTouristSpots(spots);
    } catch (e) {
      console.error("❌ Failed to fetch tourist spots:", e);
      alert("관광지 데이터를 가져오지 못했습니다.");
    } finally {
      setTouristSpotsLoading(false);
    }
  };

  // 해양관측소 데이터 가져오기
  const fetchMarineStations = async () => {
    setMarineStationsLoading(true);
    try {
      console.log("🔄 Fetching marine stations...");
      const data = await getMarineStations();
      const stations = data?.stations || [];
      console.log(`✅ Loaded ${stations.length} marine stations`);
      
      // 첫 번째 해양관측소 데이터 구조 확인
      if (stations.length > 0) {
        console.log("📋 Sample marine station:", stations[0]);
        console.log("📋 Fields available:", Object.keys(stations[0]));
      }
      
      setMarineStations(stations);
    } catch (e) {
      console.error("❌ Failed to fetch marine stations:", e);
      alert("해양관측소 데이터를 가져오지 못했습니다.");
    } finally {
      setMarineStationsLoading(false);
    }
  };

  // 지상관측소 데이터 가져오기
  const fetchSurfaceStations = async () => {
    setSurfaceStationsLoading(true);
    try {
      console.log("🔄 Fetching surface stations...");
      const data = await getSurfaceStations();
      const stations = data?.stations || [];
      console.log(`✅ Loaded ${stations.length} surface stations`);
      
      // 첫 번째 지상관측소 데이터 구조 확인
      if (stations.length > 0) {
        console.log("📋 Sample surface station:", stations[0]);
        console.log("📋 Fields available:", Object.keys(stations[0]));
      }
      
      setSurfaceStations(stations);
    } catch (e) {
      console.error("❌ Failed to fetch surface stations:", e);
      alert("지상관측소 데이터를 가져오지 못했습니다.");
    } finally {
      setSurfaceStationsLoading(false);
    }
  };

  // 한국관광공사 지역 코드 매핑
  const AREA_CODE_TO_REGION = {
    "1": "서울",
    "2": "인천", 
    "3": "대전",
    "4": "대구",
    "5": "광주",
    "6": "부산",
    "7": "울산",
    "8": "세종",
    "31": "경기",
    "32": "강원",
    "33": "충북",
    "34": "충남",
    "35": "경북",
    "36": "경남",
    "37": "전북",
    "38": "전남",
    "39": "제주"
  };

  // 데이터에서 지역 추출 (areacode 기반)
  const extractRegionsFromData = (spots) => {
    const regionSet = new Set();
    
    spots.forEach(spot => {
      // areacode가 있으면 그것을 사용
      if (spot.areacode && AREA_CODE_TO_REGION[spot.areacode]) {
        regionSet.add(AREA_CODE_TO_REGION[spot.areacode]);
      }
      // areacode가 없으면 주소에서 추출
      else if (spot.addr1) {
        const address = spot.addr1;
        if (address.includes('서울')) regionSet.add('서울');
        else if (address.includes('부산')) regionSet.add('부산');
        else if (address.includes('대구')) regionSet.add('대구');
        else if (address.includes('인천')) regionSet.add('인천');
        else if (address.includes('광주')) regionSet.add('광주');
        else if (address.includes('대전')) regionSet.add('대전');
        else if (address.includes('울산')) regionSet.add('울산');
        else if (address.includes('세종')) regionSet.add('세종');
        else if (address.includes('경기')) regionSet.add('경기');
        else if (address.includes('강원')) regionSet.add('강원');
        else if (address.includes('충청북') || address.includes('충북')) regionSet.add('충북');
        else if (address.includes('충청남') || address.includes('충남')) regionSet.add('충남');
        else if (address.includes('전라북') || address.includes('전북')) regionSet.add('전북');
        else if (address.includes('전라남') || address.includes('전남')) regionSet.add('전남');
        else if (address.includes('경상북') || address.includes('경북')) regionSet.add('경북');
        else if (address.includes('경상남') || address.includes('경남')) regionSet.add('경남');
        else if (address.includes('제주')) regionSet.add('제주');
      }
    });
    
    return Array.from(regionSet).sort();
  };

  // 지역별 관광지 필터링 (areacode 우선 사용)
  const getFilteredTouristSpots = () => {
    if (selectedRegion === "전체") {
      return touristSpots;
    }
    
    return touristSpots.filter(spot => {
      // areacode로 먼저 필터링 시도
      if (spot.areacode && AREA_CODE_TO_REGION[spot.areacode]) {
        return AREA_CODE_TO_REGION[spot.areacode] === selectedRegion;
      }
      
      // areacode가 없으면 주소로 필터링
      if (spot.addr1) {
        const address = spot.addr1.toLowerCase();
        switch(selectedRegion) {
          case '서울': return address.includes('서울');
          case '부산': return address.includes('부산');
          case '대구': return address.includes('대구');
          case '인천': return address.includes('인천');
          case '광주': return address.includes('광주');
          case '대전': return address.includes('대전');
          case '울산': return address.includes('울산');
          case '세종': return address.includes('세종');
          case '경기': return address.includes('경기');
          case '강원': return address.includes('강원');
          case '충북': return address.includes('충청북') || address.includes('충북');
          case '충남': return address.includes('충청남') || address.includes('충남');
          case '전북': return address.includes('전라북') || address.includes('전북');
          case '전남': return address.includes('전라남') || address.includes('전남');
          case '경북': return address.includes('경상북') || address.includes('경북');
          case '경남': return address.includes('경상남') || address.includes('경남');
          case '제주': return address.includes('제주');
          default: return false;
        }
      }
      
      return false;
    });
  };

  // 관광지 마커 표시
  const displayTouristSpots = () => {
    if (!mapRef.current || !window.kakao) {
      console.log("⚠️ Map or Kakao not ready");
      return;
    }
    
    const { kakao } = window;
    
    // 기존 관광지 마커 제거
    touristMarkersRef.current.forEach(marker => marker.setMap(null));
    touristMarkersRef.current = [];
    
    const filteredSpots = getFilteredTouristSpots();
    console.log(`🗺️ Displaying ${filteredSpots.length} tourist spots for region: ${selectedRegion}`);
    
    let validMarkerCount = 0;
    
    filteredSpots.forEach((spot, index) => {
      // 다양한 좌표 필드명 시도
      let lat, lng;
      
      if (spot.mapy && spot.mapx) {
        lat = parseFloat(spot.mapy);
        lng = parseFloat(spot.mapx);
      } else if (spot.lat && spot.lon) {
        lat = parseFloat(spot.lat);
        lng = parseFloat(spot.lon);
      } else if (spot.latitude && spot.longitude) {
        lat = parseFloat(spot.latitude);
        lng = parseFloat(spot.longitude);
      } else {
        if (index < 5) {
          console.log(`⚠️ No coordinates found for spot ${index}:`, spot);
        }
        return;
      }
      
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
        if (index < 5) {
          console.log(`⚠️ Invalid coordinates for spot ${index}: lat=${lat}, lng=${lng}`);
        }
        return;
      }
      
      // 한국 영역 내 좌표인지 확인
      if (lat < 33 || lat > 43 || lng < 124 || lng > 132) {
        if (index < 5) {
          console.log(`⚠️ Coordinates outside Korea for spot ${index}: lat=${lat}, lng=${lng}`);
        }
        return;
      }
      
      const position = new kakao.maps.LatLng(lat, lng);
      const marker = new kakao.maps.Marker({
        position: position,
        map: mapRef.current
      });
      
      // 관광지 정보창
      const infoContent = `
        <div style="padding:12px;min-width:250px;max-width:300px;">
          <h4 style="margin:0 0 8px 0;color:#333;font-size:14px;font-weight:bold;">${spot.title || '제목 없음'}</h4>
          <p style="margin:0 0 5px 0;color:#666;font-size:12px;line-height:1.4;">📍 ${spot.addr1 || spot.address || '주소 없음'}</p>
          ${spot.tel ? `<p style="margin:0 0 5px 0;color:#666;font-size:12px;">📞 ${spot.tel}</p>` : ''}
          <p style="margin:5px 0 0 0;color:#888;font-size:11px;">위도: ${lat}, 경도: ${lng}</p>
        </div>
      `;
      
      const infoWindow = new kakao.maps.InfoWindow({
        content: infoContent
      });
      
      kakao.maps.event.addListener(marker, 'click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
        }
        infoWindow.open(mapRef.current, marker);
        infoWindowRef.current = infoWindow;
      });
      
      touristMarkersRef.current.push(marker);
      validMarkerCount++;
      
      if (validMarkerCount <= 3) {
        console.log(`✅ Created marker ${validMarkerCount}: ${spot.title} at (${lat}, ${lng})`);
      }
    });
    
    console.log(`🎯 Successfully created ${validMarkerCount} markers out of ${filteredSpots.length} spots`);
  };

  // 해양관측소 마커 표시
  const displayMarineStations = () => {
    if (!mapRef.current || !window.kakao || !showMarineStations) {
      console.log("⚠️ Map, Kakao not ready, or marine stations hidden");
      return;
    }
    
    const { kakao } = window;
    
    // 기존 해양관측소 마커 제거
    marineMarkersRef.current.forEach(marker => marker.setMap(null));
    marineMarkersRef.current = [];
    
    console.log(`🌊 Displaying ${marineStations.length} marine stations`);
    
    let validMarkerCount = 0;
    
    marineStations.forEach((station, index) => {
      const lat = parseFloat(station.lat);
      const lng = parseFloat(station.lon);
      
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
        if (index < 5) {
          console.log(`⚠️ Invalid coordinates for marine station ${index}: lat=${lat}, lng=${lng}`);
        }
        return;
      }
      
      // 한국 영역 내 좌표인지 확인
      if (lat < 33 || lat > 43 || lng < 124 || lng > 132) {
        if (index < 5) {
          console.log(`⚠️ Coordinates outside Korea for marine station ${index}: lat=${lat}, lng=${lng}`);
        }
        return;
      }
      
      const position = new kakao.maps.LatLng(lat, lng);
      
      // 해양관측소 전용 마커 이미지 (파란색 원형)
      const markerImage = new kakao.maps.MarkerImage(
        'data:image/svg+xml;base64,' + btoa(`
          <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="8" fill="#1976d2" stroke="white" stroke-width="2"/>
            <circle cx="10" cy="10" r="4" fill="white"/>
          </svg>
        `),
        new kakao.maps.Size(20, 20),
        {
          offset: new kakao.maps.Point(10, 10)
        }
      );
      
      const marker = new kakao.maps.Marker({
        position: position,
        map: mapRef.current,
        image: markerImage
      });
      
      // 해양관측소 정보창
      const formatValue = (value, unit = "") => {
        if (value === null || value === undefined) return "N/A";
        if (value === -9 || value === -9.0 || value === -99 || value === -99.0) return "결측";
        return `${value}${unit}`;
      };
      
      const infoContent = `
        <div style="padding:12px;min-width:280px;max-width:320px;font-family:Arial,sans-serif;">
          <h4 style="margin:0 0 8px 0;color:#1976d2;font-size:14px;font-weight:bold;">
            🌊 ${station.station_name || `해양관측소 ${station.station_id}`}
          </h4>
          <div style="font-size:12px;line-height:1.4;color:#333;">
            <p style="margin:2px 0;"><strong>관측소 ID:</strong> ${station.station_id}</p>
            <p style="margin:2px 0;"><strong>위치:</strong> ${lat}°N, ${lng}°E</p>
            <p style="margin:2px 0;"><strong>해수온도:</strong> ${formatValue(station.sst, "°C")}</p>
            <p style="margin:2px 0;color:#e74c3c;"><strong>파고:</strong> ${formatValue(station.wave_height, " m")}</p>
            <p style="margin:2px 0;"><strong>관측시각:</strong> ${station.observed_at || "N/A"}</p>
          </div>
        </div>
      `;
      
      const infoWindow = new kakao.maps.InfoWindow({
        content: infoContent
      });
      
      kakao.maps.event.addListener(marker, 'click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
        }
        infoWindow.open(mapRef.current, marker);
        infoWindowRef.current = infoWindow;
      });
      
      marineMarkersRef.current.push(marker);
      validMarkerCount++;
      
      if (validMarkerCount <= 3) {
        console.log(`✅ Created marine marker ${validMarkerCount}: ${station.station_name || station.station_id} at (${lat}, ${lng})`);
      }
    });
    
    console.log(`🌊 Successfully created ${validMarkerCount} marine markers out of ${marineStations.length} stations`);
  };

  // 지상관측소 마커 표시
  const displaySurfaceStations = () => {
    if (!mapRef.current || !window.kakao || !showSurfaceStations) {
      console.log("⚠️ Map, Kakao not ready, or surface stations hidden");
      return;
    }
    
    const { kakao } = window;
    
    // 기존 지상관측소 마커 제거
    surfaceMarkersRef.current.forEach(marker => marker.setMap(null));
    surfaceMarkersRef.current = [];
    
    console.log(`🏢 Displaying ${surfaceStations.length} surface stations`);
    
    let validMarkerCount = 0;
    
    surfaceStations.forEach((station, index) => {
      const lat = parseFloat(station.lat);
      const lng = parseFloat(station.lon);
      
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
        if (index < 5) {
          console.log(`⚠️ Invalid coordinates for surface station ${index}: lat=${lat}, lng=${lng}`);
        }
        return;
      }
      
      // 한국 영역 내 좌표인지 확인
      if (lat < 33 || lat > 43 || lng < 124 || lng > 132) {
        if (index < 5) {
          console.log(`⚠️ Coordinates outside Korea for surface station ${index}: lat=${lat}, lng=${lng}`);
        }
        return;
      }
      
      const position = new kakao.maps.LatLng(lat, lng);
      
      // 지상관측소 전용 마커 이미지 (빨간색 삼각형)
      const markerImage = new kakao.maps.MarkerImage(
        'data:image/svg+xml;base64,' + btoa(`
          <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <polygon points="10,2 18,16 2,16" fill="#dc3545" stroke="white" stroke-width="2"/>
            <circle cx="10" cy="12" r="2" fill="white"/>
          </svg>
        `),
        new kakao.maps.Size(20, 20),
        {
          offset: new kakao.maps.Point(10, 10)
        }
      );
      
      const marker = new kakao.maps.Marker({
        position: position,
        map: mapRef.current,
        image: markerImage
      });
      
      // 지상관측소 정보창
      const formatValue = (value, unit = "") => {
        if (value === null || value === undefined) return "N/A";
        if (value === -9 || value === -9.0 || value === -99 || value === -99.0) return "결측";
        return `${value}${unit}`;
      };

      const formatWindDirection = (windDir) => {
        if (windDir === null || windDir === undefined || windDir === -9 || windDir === -9.0) return "결측";
        const directions = ["북", "북북동", "북동", "동북동", "동", "동남동", "남동", "남남동", 
                           "남", "남남서", "남서", "서남서", "서", "서북서", "북서", "북북서"];
        const index = Math.round(windDir / 22.5) % 16;
        return `${directions[index]} (${windDir}°)`;
      };

      const formatDateTime = (datetime) => {
        if (!datetime) return "N/A";
        // YYYYMMDDHHMM 형식을 YYYY-MM-DD HH:MM 형식으로 변환
        const year = datetime.substring(0, 4);
        const month = datetime.substring(4, 6);
        const day = datetime.substring(6, 8);
        const hour = datetime.substring(8, 10);
        const minute = datetime.substring(10, 12);
        return `${year}-${month}-${day} ${hour}:${minute}`;
      };

      const infoContent = `
        <div style="padding:12px;min-width:300px;max-width:350px;font-family:Arial,sans-serif;">
          <h4 style="margin:0 0 8px 0;color:#dc3545;font-size:14px;font-weight:bold;">
            🏢 ${station.station_name || `지상관측소 ${station.station_id}`}
          </h4>
          <div style="font-size:12px;line-height:1.4;color:#333;">
            <div style="margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #eee;">
              <p style="margin:2px 0;"><strong>관측소 ID:</strong> ${station.station_id}</p>
              <p style="margin:2px 0;"><strong>영문명:</strong> ${station.station_name_en || "N/A"}</p>
              <p style="margin:2px 0;"><strong>위치:</strong> ${lat}°N, ${lng}°E</p>
              <p style="margin:2px 0;"><strong>관측소 코드:</strong> ${station.station_code || "N/A"}</p>
            </div>
            <div style="margin-bottom:6px;">
              <p style="margin:2px 0;color:#e74c3c;"><strong>💨 풍속:</strong> ${formatValue(station.wind_speed, " m/s")}</p>
              <p style="margin:2px 0;color:#e74c3c;"><strong>🧭 풍향:</strong> ${formatWindDirection(station.wind_direction)}</p>
              <p style="margin:2px 0;color:#ff6b35;"><strong>🌡️ 기온:</strong> ${formatValue(station.temperature, "°C")}</p>
              <p style="margin:2px 0;color:#007bff;"><strong>💧 습도:</strong> ${formatValue(station.humidity, "%")}</p>
              <p style="margin:2px 0;color:#6c757d;"><strong>🔘 기압:</strong> ${formatValue(station.pressure, " hPa")}</p>
            </div>
            <div style="margin-top:6px;padding-top:4px;border-top:1px solid #eee;">
              <p style="margin:2px 0;color:#666;font-size:11px;"><strong>관측시각:</strong> ${formatDateTime(station.observed_at)}</p>
              <p style="margin:2px 0;color:#666;font-size:11px;">지상 기상 관측소</p>
            </div>
          </div>
        </div>
      `;
      
      const infoWindow = new kakao.maps.InfoWindow({
        content: infoContent
      });
      
      kakao.maps.event.addListener(marker, 'click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
        }
        infoWindow.open(mapRef.current, marker);
        infoWindowRef.current = infoWindow;
      });
      
      surfaceMarkersRef.current.push(marker);
      validMarkerCount++;
      
      if (validMarkerCount <= 3) {
        console.log(`✅ Created surface marker ${validMarkerCount}: ${station.station_name || station.station_id} at (${lat}, ${lng})`);
      }
    });
    
    console.log(`🏢 Successfully created ${validMarkerCount} surface markers out of ${surfaceStations.length} stations`);
  };

  // 지역 선택 핸들러
  const handleRegionSelect = (region) => {
    setSelectedRegion(region);
    console.log(`🗺️ Region selected: ${region}`);
  };

  // 지도 초기화
  useEffect(() => {
    if (!loaded || !containerRef.current) return;
    
    try {
      const { kakao } = window;
      if (!kakao || !kakao.maps) {
        console.error("❌ 카카오맵 API가 로드되지 않았습니다");
        return;
      }

      console.log("🗺️ Initializing map...");
      const center = new kakao.maps.LatLng(35.9078, 127.7669);
      const options = { center, level: 13 };
      
      if (!mapRef.current) {
        const map = new kakao.maps.Map(containerRef.current, options);
        mapRef.current = map;
        console.log("✅ Map created successfully");
      }

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.relayout();
          mapRef.current.setCenter(center);
          console.log("🔄 Map layout updated");
        }
      }, 100);

    } catch (error) {
      console.error("❌ 지도 초기화 중 오류:", error);
    }
  }, [loaded]);

  // 관광지 마커 표시 (지역 변경 시마다 업데이트)
  useEffect(() => {
    if (touristSpots.length > 0) {
      console.log("🔄 Triggering tourist marker display...");
      displayTouristSpots();
    }
  }, [touristSpots, selectedRegion]);

  // 해양관측소 마커 표시
  useEffect(() => {
    if (marineStations.length > 0) {
      console.log("🔄 Triggering marine station marker display...");
      displayMarineStations();
    }
  }, [marineStations, showMarineStations]);

  // 지상관측소 마커 표시
  useEffect(() => {
    if (surfaceStations.length > 0) {
      console.log("🔄 Triggering surface station marker display...");
      displaySurfaceStations();
    }
  }, [surfaceStations, showSurfaceStations]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (loaded) {
      console.log("🚀 Map loaded, fetching data...");
      fetchTouristSpots();
      fetchMarineStations();
      fetchSurfaceStations();
    }
  }, [loaded]);

  if (!KAKAO_APPKEY) {
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        height: "100%", 
        flexDirection: "column",
        backgroundColor: "#f5f5f5",
        color: "#666"
      }}>
        <h3>카카오맵 API 키가 설정되지 않았습니다</h3>
        <p>.env 파일에 VITE_KAKAO_APPKEY를 설정해주세요</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        height: "100%", 
        flexDirection: "column",
        backgroundColor: "#f5f5f5",
        color: "#d63384"
      }}>
        <h3>지도 로딩 오류</h3>
        <p>{error.message}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          새로고침
        </button>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        height: "100%",
        backgroundColor: "#f5f5f5",
        color: "#666"
      }}>
        <div>지도 로딩 중...</div>
      </div>
    );
  }

  const filteredCount = getFilteredTouristSpots().length;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      
      {/* 지역 선택 및 관광지 정보 */}
      <div style={{
        position: "absolute",
        top: "20px",
        left: "20px",
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        zIndex: 10,
        minWidth: "280px",
        overflow: "hidden"
      }}>
        {/* 헤더 */}
        <div style={{
          padding: "16px 20px",
          backgroundColor: "#007bff",
          color: "white",
          fontWeight: "bold",
          fontSize: "16px"
        }}>
          지역별 관광지
        </div>
        
        {/* 지역 선택 */}
        <div style={{ padding: "16px 20px" }}>
          <label style={{ 
            display: "block", 
            marginBottom: "8px", 
            fontSize: "14px", 
            fontWeight: "500",
            color: "#333"
          }}>
            지역 선택
          </label>
          <select
            value={selectedRegion}
            onChange={(e) => handleRegionSelect(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "2px solid #e9ecef",
              borderRadius: "8px",
              fontSize: "14px",
              backgroundColor: "white",
              cursor: "pointer"
            }}
          >
            {availableRegions.map(region => (
              <option key={region} value={region}>
                {region === "전체" ? "전체 지역" : ` ${region}`}
              </option>
            ))}
          </select>
        </div>
        
        {/* 관측소 토글 */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid #e9ecef" }}>
          <label style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            color: "#333",
            marginBottom: "8px"
          }}>
            <input
              type="checkbox"
              checked={showMarineStations}
              onChange={(e) => setShowMarineStations(e.target.checked)}
              style={{ marginRight: "8px" }}
            />
            🌊 해양관측소 표시
          </label>
          
          <label style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            color: "#333"
          }}>
            <input
              type="checkbox"
              checked={showSurfaceStations}
              onChange={(e) => setShowSurfaceStations(e.target.checked)}
              style={{ marginRight: "8px" }}
            />
            🏢 지상관측소 표시
          </label>
        </div>

        {/* 통계 정보 */}
        <div style={{
          padding: "12px 20px",
          backgroundColor: "#f8f9fa",
          borderTop: "1px solid #e9ecef",
          fontSize: "13px",
          color: "#666"
        }}>
          <div style={{ marginBottom: "4px" }}>
            <strong style={{ color: "#007bff" }}>
              {filteredCount}개
            </strong>의 관광지 (전체: {touristSpots.length}개)
          </div>
          <div style={{ marginBottom: "4px" }}>
            <strong style={{ color: "#1976d2" }}>
              {marineStations.length}개
            </strong>의 해양관측소
          </div>
          <div style={{ marginBottom: "4px" }}>
            <strong style={{ color: "#dc3545" }}>
              {surfaceStations.length}개
            </strong>의 지상관측소
          </div>
          <div style={{ fontSize: "12px", opacity: 0.8 }}>
            관광지: <strong style={{ color: "#28a745" }}>{touristMarkersRef.current.length}개</strong> | 
            해양: <strong style={{ color: "#1976d2" }}>{marineMarkersRef.current.length}개</strong> | 
            지상: <strong style={{ color: "#dc3545" }}>{surfaceMarkersRef.current.length}개</strong>
          </div>
        </div>
      </div>
      
      {/* 로딩 표시 */}
      {(touristSpotsLoading || marineStationsLoading || surfaceStationsLoading) && (
        <div style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          background: "rgba(0,0,0,0.8)",
          color: "white",
          padding: "12px 16px",
          borderRadius: 8,
          fontSize: 14
        }}>
          🔄 {(touristSpotsLoading && marineStationsLoading && surfaceStationsLoading) ? "데이터 로딩 중..." : 
               (touristSpotsLoading && marineStationsLoading) ? "관광지·해양 로딩 중..." :
               (touristSpotsLoading && surfaceStationsLoading) ? "관광지·지상 로딩 중..." :
               (marineStationsLoading && surfaceStationsLoading) ? "해양·지상 로딩 중..." :
               touristSpotsLoading ? "관광지 정보 로딩 중..." : 
               marineStationsLoading ? "해양관측소 정보 로딩 중..." : "지상관측소 정보 로딩 중..."}
        </div>
      )}
      
      {/* 새로고침 버튼 */}
      <button
        onClick={() => {
          fetchTouristSpots();
          fetchMarineStations();
          fetchSurfaceStations();
        }}
        disabled={touristSpotsLoading || marineStationsLoading || surfaceStationsLoading}
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          background: "#28a745",
          color: "white",
          border: "none",
          padding: "12px 20px",
          borderRadius: 8,
          cursor: (touristSpotsLoading || marineStationsLoading || surfaceStationsLoading) ? "not-allowed" : "pointer",
          fontSize: 14,
          fontWeight: "600"
        }}
      >
        {(touristSpotsLoading || marineStationsLoading || surfaceStationsLoading) ? "로딩..." : "새로고침"}
      </button>
    </div>
  );
}