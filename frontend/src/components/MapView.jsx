import { useEffect, useRef, useState } from "react";
import useKakaoLoader from "../hooks/useKakaoLoader";
import api from "../api/client";
import RegionFilter from "./RegionFilter";
import ActivityFilter from "./ActivityFilter";

const KAKAO_APPKEY = import.meta.env.VITE_KAKAO_APPKEY;

export default function MapView({ onRegionSelect }) {
  const { loaded, error } = useKakaoLoader(KAKAO_APPKEY);
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const infoWindowRef = useRef(null);
  const markersRef = useRef([]);
  const placeMarkersRef = useRef([]);
  const polygonsRef = useRef({});
  const [stations, setStations] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState("marine_info");
  const [geoData, setGeoData] = useState(null);

  // GeoJSON 데이터 로드
  const loadGeoData = async () => {
    try {
      const response = await fetch("/geo/korea_sido_simple.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("GeoJSON 로드 성공:", data);
      setGeoData(data);
      const regionNames = data.features.map(f => f.properties.name);
      setRegions(regionNames);
    } catch (error) {
      console.error("GeoJSON 로드 실패:", error);
    }
  };

  // 모든 지점 데이터 가져오기
  const fetchStations = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/stations");
      const stationsData = res.data?.stations || [];
      console.log(`Loaded ${stationsData.length} stations`);
      setStations(stationsData);
    } catch (e) {
      console.error("Failed to fetch stations:", e);
      alert("지점 데이터를 가져오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 사업장 데이터 가져오기
  const fetchPlaces = async (activity) => {
    if (!mapRef.current || activity === "marine_info") {
      setPlaces([]);
      return;
    }

    setPlacesLoading(true);
    try {
      let rect;
      
      // 제주도인 경우 고정된 영역 사용 (더 넓은 범위)
      if (selectedRegion === "제주") {
        rect = "126.14,33.11,126.98,33.60";  // 제주도 전체 커버
        console.log(`🏝️ Using fixed Jeju rect: ${rect}`);
      } else {
        // 다른 지역은 현재 지도 영역 사용
        const bounds = mapRef.current.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        rect = `${sw.getLng()},${sw.getLat()},${ne.getLng()},${ne.getLat()}`;
        console.log(`🗺️ Using current map bounds: ${rect}`);
      }
      
      console.log(`🔍 Searching places for activity: ${activity}, rect: ${rect}`);
      
      const res = await api.get("/api/places/in-rect", {
        params: {
          rect: rect,
          activities: activity
        }
      });
      
      const placesData = res.data?.places || [];
      console.log(`✅ API Response:`, res.data);
      console.log(`✅ Loaded ${placesData.length} places for activity: ${activity}`);
      
      if (placesData.length === 0) {
        console.warn(`⚠️ No places found for activity: ${activity} in rect: ${rect}`);
        alert(`${selectedRegion}에서 ${getActivityLabel(activity)} 관련 사업장을 찾을 수 없습니다. 다른 지역이나 활동을 선택해보세요.`);
      }
      
      setPlaces(placesData);
    } catch (e) {
      console.error("❌ Failed to fetch places:", e);
      console.error("❌ Error details:", e.response?.data);
      alert(`사업장 데이터를 가져오지 못했습니다: ${e.response?.data?.detail || e.message}`);
    } finally {
      setPlacesLoading(false);
    }
  };

  // 활동 선택 핸들러
  const handleActivitySelect = (activity) => {
    setSelectedActivity(activity);
    
    // 선택된 활동에 따라 데이터 로드
    if (activity === "marine_info") {
      // 기존 KMA API 사용
      fetchStations();
    } else {
      // 카카오 로컬 API 사용 - 지도가 준비된 후 호출
      if (mapRef.current) {
        fetchPlaces(activity);
      } else {
        // 지도가 아직 준비되지 않았으면 잠시 후 재시도
        setTimeout(() => {
          if (mapRef.current) {
            fetchPlaces(activity);
          }
        }, 500);
      }
    }
  };

  // 지역 선택 핸들러
  const handleRegionSelect = (regionName) => {
    setSelectedRegion(regionName);
    
    // 부모 컴포넌트에 선택된 지역 전달
    if (onRegionSelect) {
      onRegionSelect(regionName);
    }
    
    // 활동 초기화
    setSelectedActivity("marine_info");
    
    if (!mapRef.current || !geoData) return;

    const { kakao } = window;
    
    // 모든 폴리곤 스타일 초기화
    Object.values(polygonsRef.current).forEach(polygon => {
      polygon.setOptions({
        strokeWeight: 2,
        strokeColor: "#4287f5",
        strokeOpacity: 0.8,
        fillColor: "#4287f5",
        fillOpacity: 0.1
      });
    });

    if (!regionName) {
      // 전체 지도 보기 - 우리나라 전체가 보이도록
      const center = new kakao.maps.LatLng(35.9078, 127.7669);
      mapRef.current.panTo(center);
      setTimeout(() => {
        mapRef.current.setLevel(13, { animate: true });
        // 지도 재조정
        setTimeout(() => {
          mapRef.current.relayout();
        }, 300);
      }, 200);
      return;
    }

    // 선택된 지역 찾기
    const feature = geoData.features.find(f => f.properties.name === regionName);
    if (!feature) return;

    // 선택된 폴리곤 하이라이트
    const polygon = polygonsRef.current[regionName];
    if (polygon) {
      polygon.setOptions({
        strokeWeight: 4,
        strokeColor: "#ff6b6b",
        strokeOpacity: 1,
        fillColor: "#ff6b6b",
        fillOpacity: 0.3
      });
    }

    // 폴리곤 경계에 맞게 지도 범위 설정
    try {
      const coordinates = feature.geometry.coordinates[0];
      if (!coordinates || coordinates.length === 0) {
        console.error("유효하지 않은 좌표 데이터:", feature);
        return;
      }

      const bounds = new kakao.maps.LatLngBounds();
      coordinates.forEach(coord => {
        if (Array.isArray(coord) && coord.length >= 2) {
          const lat = parseFloat(coord[1]);
          const lng = parseFloat(coord[0]);
          if (!isNaN(lat) && !isNaN(lng)) {
            bounds.extend(new kakao.maps.LatLng(lat, lng));
          }
        }
      });
      
      // 폴리곤 전체가 보이도록 지도 범위 설정 (여백 추가)
      if (mapRef.current && bounds) {
        // 먼저 중심으로 이동
        const centerLat = (bounds.getSouthWest().getLat() + bounds.getNorthEast().getLat()) / 2;
        const centerLng = (bounds.getSouthWest().getLng() + bounds.getNorthEast().getLng()) / 2;
        const centerPoint = new kakao.maps.LatLng(centerLat, centerLng);
        
        mapRef.current.panTo(centerPoint);
        
        // 그 다음 bounds 설정
        setTimeout(() => {
          if (mapRef.current && !bounds.isEmpty()) {
            mapRef.current.setBounds(bounds, 100); // padding을 숫자로만 설정
          }
        }, 300);
      }
    } catch (error) {
      console.error("지도 범위 설정 오류:", error);
    }
  };

  // 지도 초기화 및 폴리곤 그리기
  useEffect(() => {
    if (!loaded || !geoData || !containerRef.current) return;
    
    try {
      const { kakao } = window;
      if (!kakao || !kakao.maps) {
        console.error("카카오맵 API가 로드되지 않았습니다");
        return;
      }

      // 우리나라 전체가 보이도록 중심점과 레벨 설정
      const center = new kakao.maps.LatLng(35.9078, 127.7669); // 한국 중심 (좀 더 남쪽으로 조정)
      const options = { center, level: 13 }; // 우리나라 전체가 보이는 레벨
      
      // 지도가 이미 있으면 재사용, 없으면 새로 생성
      if (!mapRef.current) {
        const map = new kakao.maps.Map(containerRef.current, options);
        mapRef.current = map;
      } else {
        mapRef.current.setCenter(center);
        mapRef.current.setLevel(13);
      }

      // 지도 크기 재조정 (컨테이너 크기 변경 시 필요)
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.relayout();
          mapRef.current.setCenter(center);
        }
      }, 100);

      // 기존 폴리곤 제거
      Object.values(polygonsRef.current).forEach(polygon => polygon.setMap(null));
      polygonsRef.current = {};

    // GeoJSON 폴리곤 그리기
    geoData.features.forEach(feature => {
      try {
        const coordinates = feature.geometry.coordinates[0];
        if (!coordinates || coordinates.length === 0) {
          console.error("유효하지 않은 좌표:", feature.properties.name);
          return;
        }

        const paths = coordinates.map(coord => {
          if (!Array.isArray(coord) || coord.length < 2) {
            console.error("잘못된 좌표 형식:", coord);
            return null;
          }
          const lat = parseFloat(coord[1]);
          const lng = parseFloat(coord[0]);
          if (isNaN(lat) || isNaN(lng)) {
            console.error("NaN 좌표:", coord);
            return null;
          }
          return new kakao.maps.LatLng(lat, lng);
        }).filter(path => path !== null);

        if (paths.length === 0) {
          console.error("유효한 좌표가 없음:", feature.properties.name);
          return;
        }

        const polygon = new kakao.maps.Polygon({
          path: paths,
          strokeWeight: 2,
          strokeColor: "#4287f5",
          strokeOpacity: 0.8,
          fillColor: "#4287f5",
          fillOpacity: 0.1
        });

        polygon.setMap(mapRef.current);
        polygonsRef.current[feature.properties.name] = polygon;

        // 폴리곤 클릭 이벤트
        kakao.maps.event.addListener(polygon, "click", () => {
          handleRegionSelect(feature.properties.name);
        });
      } catch (error) {
        console.error(`폴리곤 생성 오류 (${feature.properties.name}):`, error);
      }
    });
    } catch (error) {
      console.error("지도 초기화 오류:", error);
    }
  }, [loaded, geoData]);

  // 해양정보 마커 생성 및 업데이트
  useEffect(() => {
    if (!loaded || !mapRef.current || selectedActivity !== "marine_info") return;
    
    const { kakao } = window;
    
    // 기존 마커 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // 모든 지점에 마커 생성
    stations.forEach((station) => {
      const pos = new kakao.maps.LatLng(station.lat, station.lon);
      const marker = new kakao.maps.Marker({ 
        position: pos,
        title: station.station_name 
      });
      marker.setMap(mapRef.current);
      markersRef.current.push(marker);

      // 마커 클릭 이벤트
      kakao.maps.event.addListener(marker, "click", async () => {
        try {
          // 기존 인포윈도우 닫기
          if (infoWindowRef.current) {
            infoWindowRef.current.close();
          }

          // 해당 지점의 상세 데이터 가져오기
          const res = await api.get("/api/conditions", {
            params: { station_id: station.station_id },
          });
          const data = res.data || {};

          const safeName = String(data.spotName || station.station_name || "Unknown")
            .replace(/</g, "&lt;").replace(/>/g, "&gt;");
          
          const html = `
            <div style="min-width:260px; max-width:300px; background:#fff; border:1px solid #ddd; border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,0.15); overflow:hidden;">
              <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:10px 12px; border-bottom:1px solid #eee; background:#f8f9fa;">
                <div style="font-weight:600; color:#333;">${safeName}</div>
                <div style="font-size:11px; color:#666;">ID: ${station.station_id}</div>
              </div>
              <div style="padding:10px 12px; font-size:13px; line-height:1.8;">
                <div style="display:flex; justify-content:space-between;">
                  <span>수온(SST):</span>
                  <span style="font-weight:600; color:#d63384;">${data.sst ?? "-"} ℃</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span>유의파고:</span>
                  <span style="font-weight:600; color:#0d6efd;">${data.wave_height ?? "-"} m</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                  <span>조류속도:</span>
                  <span style="font-weight:600; color:#198754;">${data.current_speed ?? "-"} m/s</span>
                </div>
                <div style="margin-top:8px; padding-top:8px; border-top:1px solid #eee; font-size:11px; color:#666;">
                  <div>관측시각: ${data.observed_at ?? "-"}</div>
                  <div>위치: ${station.lat.toFixed(3)}, ${station.lon.toFixed(3)}</div>
                  <div>출처: ${data.source || "KMA"}</div>
                </div>
              </div>
            </div>`;

          const infoWindow = new kakao.maps.InfoWindow({ 
            content: html, 
            removable: true 
          });
          infoWindow.open(mapRef.current, marker);
          infoWindowRef.current = infoWindow;
          mapRef.current.panTo(pos);
        } catch (e) {
          console.error(e);
          alert("해양 정보를 가져오지 못했습니다.");
        }
      });
    });

    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [loaded, stations, selectedActivity]);

  // 사업장 마커 생성 및 업데이트
  useEffect(() => {
    if (!loaded || !mapRef.current || selectedActivity === "marine_info") return;
    
    const { kakao } = window;
    
    // 기존 사업장 마커 제거
    placeMarkersRef.current.forEach(marker => marker.setMap(null));
    placeMarkersRef.current = [];

    // 사업장 마커 생성
    places.forEach((place) => {
      const pos = new kakao.maps.LatLng(place.y, place.x);
      
      // 활동별 마커 이미지 설정
      const markerImageSrc = getMarkerImageSrc(selectedActivity);
      const markerSize = new kakao.maps.Size(32, 32);
      const markerImage = new kakao.maps.MarkerImage(markerImageSrc, markerSize);
      
      const marker = new kakao.maps.Marker({ 
        position: pos,
        title: place.name,
        image: markerImage
      });
      
      marker.setMap(mapRef.current);
      placeMarkersRef.current.push(marker);

      // 마커 클릭 이벤트
      kakao.maps.event.addListener(marker, "click", () => {
        try {
          // 기존 인포윈도우 닫기
          if (infoWindowRef.current) {
            infoWindowRef.current.close();
          }

          const safeName = String(place.name || "Unknown")
            .replace(/</g, "&lt;").replace(/>/g, "&gt;");
          
          const html = `
            <div style="min-width:280px; max-width:320px; background:#fff; border:1px solid #ddd; border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,0.15); overflow:hidden;">
              <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:12px 15px; border-bottom:1px solid #eee; background:#f8f9fa;">
                <div style="font-weight:600; color:#333; font-size:14px;">${safeName}</div>
                <div style="font-size:11px; color:#666; background:#e9ecef; padding:2px 6px; border-radius:3px;">${getActivityLabel(place.activity)}</div>
              </div>
              <div style="padding:12px 15px; font-size:13px; line-height:1.6;">
                <div style="margin-bottom:8px;">
                  <div style="color:#666; font-size:11px; margin-bottom:2px;">카테고리</div>
                  <div style="color:#333;">${place.category || "-"}</div>
                </div>
                <div style="margin-bottom:8px;">
                  <div style="color:#666; font-size:11px; margin-bottom:2px;">주소</div>
                  <div style="color:#333;">${place.road_address || place.address || "-"}</div>
                </div>
                <div style="margin-bottom:8px;">
                  <div style="color:#666; font-size:11px; margin-bottom:2px;">전화번호</div>
                  <div style="color:#333;">${place.phone || "-"}</div>
                </div>
                ${place.place_url ? `
                <div style="margin-top:10px; padding-top:8px; border-top:1px solid #eee;">
                  <a href="${place.place_url}" target="_blank" style="color:#007bff; text-decoration:none; font-size:12px;">
                    🔗 카카오맵에서 보기
                  </a>
                </div>
                ` : ''}
              </div>
            </div>`;

          const infoWindow = new kakao.maps.InfoWindow({ 
            content: html, 
            removable: true 
          });
          infoWindow.open(mapRef.current, marker);
          infoWindowRef.current = infoWindow;
          mapRef.current.panTo(pos);
        } catch (e) {
          console.error(e);
          alert("사업장 정보를 표시하는 중 오류가 발생했습니다.");
        }
      });
    });

    return () => {
      placeMarkersRef.current.forEach(marker => marker.setMap(null));
      placeMarkersRef.current = [];
    };
  }, [loaded, places, selectedActivity]);

  // 활동별 마커 이미지 경로 반환
  const getMarkerImageSrc = (activity) => {
    const markerColors = {
      surfing: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_blue.png",
      scuba: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png",
      snorkel: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_orange.png",
      freedive: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_green.png",
      kayak: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_yellow.png",
      yacht: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_purple.png",
      jetski: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_pink.png",
      windsurf: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_blue.png",
      fishing: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_black.png",
      beach: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_black.png"
    };
    return markerColors[activity] || "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png";
  };

  // 활동 라벨 반환
  const getActivityLabel = (activity) => {
    const labels = {
      surfing: "서핑",
      scuba: "스쿠버다이빙",
      snorkel: "스노클링",
      freedive: "프리다이빙",
      kayak: "카약/SUP",
      yacht: "요트/세일링",
      jetski: "제트스키",
      windsurf: "윈드서핑",
      fishing: "낚시",
      beach: "해수욕장"
    };
    return labels[activity] || activity;
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (loaded) {
      loadGeoData();
      fetchStations();
    }
  }, [loaded]);

  // 카카오맵 API 키 확인
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
        <code style={{ backgroundColor: "#e9ecef", padding: "8px", borderRadius: "4px" }}>
          VITE_KAKAO_APPKEY=your_kakao_api_key_here
        </code>
      </div>
    );
  }

  // 카카오맵 로딩 오류
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

  // 카카오맵 로딩 중
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
        <div>
          <div style={{ fontSize: "18px", marginBottom: "10px" }}>지도 로딩 중...</div>
          <div style={{ fontSize: "14px" }}>카카오맵 API를 불러오고 있습니다</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      
      {/* 지역 필터 */}
      <RegionFilter
        regions={regions}
        selectedRegion={selectedRegion}
        onRegionSelect={handleRegionSelect}
      />
      
      {/* 활동 필터 */}
      <ActivityFilter
        selectedRegion={selectedRegion}
        selectedActivity={selectedActivity}
        onActivitySelect={handleActivitySelect}
      />
      
      {/* 로딩 표시 */}
      {(loading || placesLoading) && (
        <div style={{
          position: "absolute",
          top: 20,
          left: 520,
          background: "rgba(0,0,0,0.8)",
          color: "white",
          padding: "8px 12px",
          borderRadius: 4,
          fontSize: 14
        }}>
          {loading ? "해양정보 로딩 중..." : "사업장 정보 로딩 중..."}
        </div>
      )}
      
      {/* 정보 표시 */}
      {!loading && !placesLoading && (
        <div style={{
          position: "absolute",
          top: 70,
          left: 20,
          background: "rgba(255,255,255,0.95)",
          padding: "8px 12px",
          borderRadius: 4,
          fontSize: 13,
          border: "1px solid #ddd",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          {selectedActivity === "marine_info" 
            ? `해양 관측소: ${stations.length}개 지점`
            : `${getActivityLabel(selectedActivity)}: ${places.length}개 사업장`
          }
        </div>
      )}
      
      {/* 새로고침 버튼 */}
      <button
        onClick={() => {
          if (selectedActivity === "marine_info") {
            fetchStations();
          } else {
            fetchPlaces(selectedActivity);
          }
        }}
        disabled={loading || placesLoading}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          background: "#007bff",
          color: "white",
          border: "none",
          padding: "8px 12px",
          borderRadius: 4,
          cursor: (loading || placesLoading) ? "not-allowed" : "pointer",
          fontSize: 13
        }}
      >
        {(loading || placesLoading) ? "로딩..." : "새로고침"}
      </button>
    </div>
  );
}