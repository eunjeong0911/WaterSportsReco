import { useEffect, useRef, useState } from "react";
import useKakaoLoader from "../hooks/useKakaoLoader";
import api from "../api/client";

const KAKAO_APPKEY = import.meta.env.VITE_KAKAO_APPKEY;

export default function MapView() {
  const { loaded } = useKakaoLoader(KAKAO_APPKEY);
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const infoWindowRef = useRef(null);
  const markersRef = useRef([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);

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

  // 지도 초기화 및 마커 생성
  useEffect(() => {
    if (!loaded) return;
    
    const { kakao } = window;
    const center = new kakao.maps.LatLng(36.5, 127.5); // 한국 중심
    const options = { center, level: 7 };
    const map = new kakao.maps.Map(containerRef.current, options);
    mapRef.current = map;

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
      marker.setMap(map);
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
          infoWindow.open(map, marker);
          infoWindowRef.current = infoWindow;
          map.panTo(pos);
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
  }, [loaded, stations]);

  // 컴포넌트 마운트 시 지점 데이터 가져오기
  useEffect(() => {
    if (loaded) {
      fetchStations();
    }
  }, [loaded]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100vh" }} />
      
      {/* 로딩 표시 */}
      {loading && (
        <div style={{
          position: "absolute",
          top: 20,
          left: 20,
          background: "rgba(0,0,0,0.8)",
          color: "white",
          padding: "8px 12px",
          borderRadius: 4,
          fontSize: 14
        }}>
          지점 데이터 로딩 중...
        </div>
      )}
      
      {/* 지점 수 표시 */}
      {!loading && stations.length > 0 && (
        <div style={{
          position: "absolute",
          top: 20,
          left: 20,
          background: "rgba(255,255,255,0.95)",
          padding: "8px 12px",
          borderRadius: 4,
          fontSize: 13,
          border: "1px solid #ddd",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          해양 관측소: {stations.length}개 지점
        </div>
      )}
      
      {/* 새로고침 버튼 */}
      <button
        onClick={fetchStations}
        disabled={loading}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          background: "#007bff",
          color: "white",
          border: "none",
          padding: "8px 12px",
          borderRadius: 4,
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: 13
        }}
      >
        {loading ? "로딩..." : "새로고침"}
      </button>
    </div>
  );
}