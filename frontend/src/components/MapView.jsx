import { useEffect, useRef, useState } from "react";
import useKakaoLoader from "../hooks/useKakaoLoader";
import { getTouristSpots, getMarineStations, getSurfaceStations } from "../api/client";
import ActivityFilter from "./ActivityFilter";

const KAKAO_APPKEY = import.meta.env.VITE_KAKAO_APPKEY;

export default function MapView({ selectedRegion, onRegionSelect }) {
  const { loaded, error } = useKakaoLoader(KAKAO_APPKEY);
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const infoWindowRef = useRef(null);
  const touristMarkersRef = useRef([]);
  const marineMarkersRef = useRef([]);
  const surfaceMarkersRef = useRef([]);
  
  const [touristSpots, setTouristSpots] = useState([]);
  const [marineStations, setMarineStations] = useState([]);
  const [surfaceStations, setSurfaceStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedWaterSport, setSelectedWaterSport] = useState(null);
  const [showMarineStations, setShowMarineStations] = useState(true);
  const [showSurfaceStations, setShowSurfaceStations] = useState(true);


  // 데이터 가져오기
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const params = selectedWaterSport ? { cat3: selectedWaterSport } : {};
      const [touristData, marineData, surfaceData] = await Promise.all([
        getTouristSpots(params),
        getMarineStations(),
        getSurfaceStations()
      ]);
      
      setTouristSpots(touristData?.tourist_spots || []);
      setMarineStations(marineData?.stations || []);
      setSurfaceStations(surfaceData?.stations || []);
    } catch (error) {
      console.error("❌ Data fetch failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // 마커 생성 헬퍼
  const createMarker = (position, map, markerType = 'default') => {
    const markerImages = {
      marine: 'data:image/svg+xml;base64,' + btoa(`
        <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="8" fill="#1976d2" stroke="white" stroke-width="2"/>
          <circle cx="10" cy="10" r="4" fill="white"/>
        </svg>`),
      surface: 'data:image/svg+xml;base64,' + btoa(`
        <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <polygon points="10,2 18,16 2,16" fill="#dc3545" stroke="white" stroke-width="2"/>
          <circle cx="10" cy="12" r="2" fill="white"/>
        </svg>`)
    };

    const marker = new window.kakao.maps.Marker({
      position,
      map,
      ...(markerImages[markerType] && {
        image: new window.kakao.maps.MarkerImage(
          markerImages[markerType],
          new window.kakao.maps.Size(20, 20),
          { offset: new window.kakao.maps.Point(10, 10) }
        )
      })
    });

    return marker;
  };

  // 좌표 유효성 검사
  const isValidCoordinate = (lat, lng) => {
    return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0 && 
          lat >= 33 && lat <= 43 && lng >= 124 && lng <= 132;
  };

  // 지역별 관광지 필터링
  const getFilteredTouristSpots = () => {
    if (!selectedRegion || selectedRegion === "전체") {
      return touristSpots;
    }
    
    return touristSpots.filter(spot => {
      if (spot.addr1) {
        const address = spot.addr1.toLowerCase();
        const region = selectedRegion.toLowerCase();
        return address.includes(region) || 
               (region === '경기' && address.includes('경기')) ||
               (region === '강원' && address.includes('강원')) ||
               (region === '충북' && (address.includes('충청북') || address.includes('충북'))) ||
               (region === '충남' && (address.includes('충청남') || address.includes('충남'))) ||
               (region === '전북' && (address.includes('전라북') || address.includes('전북'))) ||
               (region === '전남' && (address.includes('전라남') || address.includes('전남'))) ||
               (region === '경북' && (address.includes('경상북') || address.includes('경북'))) ||
               (region === '경남' && (address.includes('경상남') || address.includes('경남')));
      }
      return false;
    });
  };

  // 관광지 마커 표시
  const displayTouristSpots = () => {
    if (!mapRef.current || !window.kakao) return;

    // 기존 마커 제거
    touristMarkersRef.current.forEach(marker => marker.setMap(null));
    touristMarkersRef.current = [];

    const filteredSpots = getFilteredTouristSpots();
    filteredSpots.forEach(spot => {
      const lat = parseFloat(spot.mapy || spot.lat);
      const lng = parseFloat(spot.mapx || spot.lon);
      
      if (!isValidCoordinate(lat, lng)) return;

      const position = new window.kakao.maps.LatLng(lat, lng);
      const marker = createMarker(position, mapRef.current);
      
      const infoContent = `
        <div style="padding:12px;min-width:250px;max-width:300px;">
          <h4 style="margin:0 0 8px 0;color:#333;font-size:14px;font-weight:bold;">
            ${spot.title || '제목 없음'}
          </h4>
          <p style="margin:0 0 5px 0;color:#666;font-size:12px;">
            📍 ${spot.addr1 || '주소 없음'}
          </p>
          ${spot.tel ? `<p style="margin:0;color:#666;font-size:12px;">📞 ${spot.tel}</p>` : ''}
        </div>`;
      
      const infoWindow = new window.kakao.maps.InfoWindow({ content: infoContent });
      
      window.kakao.maps.event.addListener(marker, 'click', () => {
        if (infoWindowRef.current) infoWindowRef.current.close();
        infoWindow.open(mapRef.current, marker);
        infoWindowRef.current = infoWindow;
      });
      
      touristMarkersRef.current.push(marker);
    });
  };

  // 해양관측소 마커 표시
  const displayMarineStations = () => {
    if (!mapRef.current || !window.kakao || !showMarineStations) return;

    marineMarkersRef.current.forEach(marker => marker.setMap(null));
    marineMarkersRef.current = [];
    
    marineStations.forEach(station => {
      const lat = parseFloat(station.lat);
      const lng = parseFloat(station.lon);
      
      if (!isValidCoordinate(lat, lng)) return;

      const position = new window.kakao.maps.LatLng(lat, lng);
      const marker = createMarker(position, mapRef.current, 'marine');
      
      const formatValue = (value, unit = "") => {
        if (value === null || value === undefined || value === -9 || value === -99) return "결측";
        return `${value}${unit}`;
      };
      
      const infoContent = `
        <div style="padding:12px;min-width:280px;font-family:Arial,sans-serif;">
          <h4 style="margin:0 0 8px 0;color:#1976d2;font-size:14px;font-weight:bold;">
            🌊 ${station.station_name || `해양관측소 ${station.station_id}`}
          </h4>
          <div style="font-size:12px;color:#333;">
            <p style="margin:2px 0;"><strong>해수온도:</strong> ${formatValue(station.sst, "°C")}</p>
            <p style="margin:2px 0;"><strong>파고:</strong> ${formatValue(station.wave_height, " m")}</p>
            <p style="margin:2px 0;"><strong>관측시각:</strong> ${station.observed_at || "N/A"}</p>
          </div>
        </div>`;
      
      const infoWindow = new window.kakao.maps.InfoWindow({ content: infoContent });
      
      window.kakao.maps.event.addListener(marker, 'click', () => {
        if (infoWindowRef.current) infoWindowRef.current.close();
        infoWindow.open(mapRef.current, marker);
        infoWindowRef.current = infoWindow;
      });
      
      marineMarkersRef.current.push(marker);
    });
  };

  // 지상관측소 마커 표시
  const displaySurfaceStations = () => {
    if (!mapRef.current || !window.kakao || !showSurfaceStations) {
      surfaceMarkersRef.current.forEach(marker => marker.setMap(null));
      surfaceMarkersRef.current = [];
      return;
    }

    surfaceMarkersRef.current.forEach(marker => marker.setMap(null));
    surfaceMarkersRef.current = [];

    surfaceStations.forEach(station => {
      const lat = parseFloat(station.lat);
      const lng = parseFloat(station.lon);
      
      if (!isValidCoordinate(lat, lng)) return;

      const position = new window.kakao.maps.LatLng(lat, lng);
      const marker = createMarker(position, mapRef.current, 'surface');
      
      const formatValue = (value, unit = "") => {
        if (value === null || value === undefined || value === -9 || value === -99) return "결측";
        return `${value}${unit}`;
      };

      const infoContent = `
        <div style="padding:12px;min-width:300px;font-family:Arial,sans-serif;">
          <h4 style="margin:0 0 8px 0;color:#dc3545;font-size:14px;font-weight:bold;">
            🏢 ${station.station_name || `지상관측소 ${station.station_id}`}
          </h4>
          <div style="font-size:12px;color:#333;">
            <p style="margin:2px 0;"><strong>풍속:</strong> ${formatValue(station.wind_speed, " m/s")}</p>
            <p style="margin:2px 0;"><strong>기온:</strong> ${formatValue(station.temperature, "°C")}</p>
            <p style="margin:2px 0;"><strong>습도:</strong> ${formatValue(station.humidity, "%")}</p>
          </div>
        </div>`;
      
      const infoWindow = new window.kakao.maps.InfoWindow({ content: infoContent });
      
      window.kakao.maps.event.addListener(marker, 'click', () => {
        if (infoWindowRef.current) infoWindowRef.current.close();
        infoWindow.open(mapRef.current, marker);
        infoWindowRef.current = infoWindow;
      });
      
      surfaceMarkersRef.current.push(marker);
    });
  };

  // 지도 초기화
  useEffect(() => {
    if (!loaded || !containerRef.current) return;
    
    try {
      const { kakao } = window;
      if (!kakao?.maps) return;

      const center = new kakao.maps.LatLng(35.9078, 127.7669);
      const map = new kakao.maps.Map(containerRef.current, { center, level: 13 });
        mapRef.current = map;

      setTimeout(() => {
        map.relayout();
        map.setCenter(center);
      }, 100);
    } catch (error) {
      console.error("❌ Map initialization failed:", error);
    }
  }, [loaded]);

  // 데이터 로드
  useEffect(() => {
    if (loaded) fetchAllData();
  }, [loaded, selectedWaterSport]);

  // 마커 표시
  useEffect(() => {
      displayTouristSpots();
  }, [touristSpots, selectedRegion]);

  useEffect(() => {
      displayMarineStations();
  }, [marineStations, showMarineStations]);

  useEffect(() => {
    displaySurfaceStations();
  }, [surfaceStations, showSurfaceStations]);

  // 에러 및 로딩 상태 처리
  if (!KAKAO_APPKEY) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", backgroundColor: "#f5f5f5" }}>
        <h3>카카오맵 API 키가 설정되지 않았습니다</h3>
        <p>.env 파일에 VITE_KAKAO_APPKEY를 설정해주세요</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", backgroundColor: "#f5f5f5" }}>
        <h3>지도 로딩 오류</h3>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()} style={{ padding: "8px 16px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          새로고침
        </button>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", backgroundColor: "#f5f5f5", color: "#666" }}>
        <div>지도 로딩 중...</div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      
      {/* 활동 필터 */}
      <ActivityFilter
        selectedRegion={selectedRegion}
        selectedWaterSport={selectedWaterSport}
        onRegionSelect={onRegionSelect}
        onWaterSportSelect={setSelectedWaterSport}
      />
      
      {/* 컨트롤 패널 */}
      <div style={{
        position: "absolute", top: "20px", right: "20px", backgroundColor: "white",
        borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", padding: "16px", minWidth: "200px"
      }}>
        <h4 style={{ margin: "0 0 12px 0", fontSize: "14px" }}>표시 옵션</h4>
        
        <label style={{ display: "flex", alignItems: "center", marginBottom: "8px", cursor: "pointer", fontSize: "13px" }}>
            <input
              type="checkbox"
              checked={showMarineStations}
              onChange={(e) => setShowMarineStations(e.target.checked)}
              style={{ marginRight: "8px" }}
            />
          🌊 해양관측소 ({marineStations.length}개)
          </label>
          
        <label style={{ display: "flex", alignItems: "center", marginBottom: "12px", cursor: "pointer", fontSize: "13px" }}>
            <input
              type="checkbox"
              checked={showSurfaceStations}
              onChange={(e) => setShowSurfaceStations(e.target.checked)}
              style={{ marginRight: "8px" }}
            />
          🏢 지상관측소 ({surfaceStations.length}개)
          </label>
        
        <div style={{ fontSize: "12px", color: "#666", borderTop: "1px solid #eee", paddingTop: "8px" }}>
          관광지: <strong>{getFilteredTouristSpots().length}개</strong> (전체: {touristSpots.length}개)
        </div>

        <button
          onClick={fetchAllData}
          disabled={loading}
          style={{
            width: "100%", marginTop: "8px", padding: "8px", backgroundColor: "#28a745", color: "white",
            border: "none", borderRadius: "4px", cursor: loading ? "not-allowed" : "pointer", fontSize: "12px"
          }}
        >
          {loading ? "로딩..." : "새로고침"}
        </button>
      </div>
      
      {/* 로딩 표시 */}
      {loading && (
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          background: "rgba(0,0,0,0.8)", color: "white", padding: "12px 16px", borderRadius: "8px"
        }}>
          🔄 데이터 로딩 중...
        </div>
      )}
    </div>
  );
}