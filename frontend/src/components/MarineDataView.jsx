import { useState, useEffect } from "react";
import { getSurfaceObservations, getMarineStations } from "../api/client";

export default function MarineDataView() {
  const [surfaceData, setSurfaceData] = useState([]);
  const [marineStations, setMarineStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("surface");

  // KMA 지상 관측 데이터 가져오기
  const fetchSurfaceData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching KMA surface observations...");
      const data = await getSurfaceObservations();
      console.log("Surface observations loaded:", data);
      setSurfaceData(data.observations || []);
    } catch (e) {
      console.error("❌ Failed to fetch surface data:", e);
      setError("지상 관측 데이터를 가져올 수 없습니다: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // KMA 해양 관측소 데이터 가져오기
  const fetchMarineStations = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching KMA marine stations...");
      const data = await getMarineStations();
      console.log("Marine stations loaded:", data);
      setMarineStations(data.stations || []);
    } catch (e) {
      console.error("❌ Failed to fetch marine stations:", e);
      setError("해양 관측소 데이터를 가져올 수 없습니다: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "surface") {
      fetchSurfaceData();
    } else if (activeTab === "marine") {
      fetchMarineStations();
    }
  }, [activeTab]);

  const formatValue = (value, unit = "") => {
    if (value === null || value === undefined) {
      return "N/A";
    }
    // 일단 결측치도 다 표시
    return `${value}${unit}`;
  };

  const renderSurfaceData = () => {
    if (surfaceData.length === 0) {
      return <p>지상 관측 데이터가 없습니다.</p>;
    }

    return (
      <div style={{ maxHeight: "350px", overflowY: "auto" }}>
        <h4 style={{ fontSize: "14px", marginBottom: "12px", color: "#007bff" }}>
          KMA 지상 관측 데이터 ({surfaceData.length}개 관측소)
        </h4>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr", 
          gap: "12px",
          marginTop: "8px"
        }}>
          {surfaceData.slice(0, 20).map((obs, index) => (
            <div key={`${obs.station_id}-${index}`} style={{
              border: "1px solid #ddd",
              borderRadius: "6px",
              padding: "12px",
              backgroundColor: "#f8f9fa"
            }}>
              <h5 style={{ margin: "0 0 8px 0", color: "#007bff", fontSize: "13px" }}>
                관측소 {obs.station_id}
              </h5>
              <div style={{ fontSize: "12px", lineHeight: "1.6" }}>
                <div><strong>관측시각:</strong> {obs.datetime || "N/A"}</div>
                <div><strong>기온:</strong> {formatValue(obs.temperature, "°C")}</div>
                <div><strong>습도:</strong> {formatValue(obs.humidity, "%")}</div>
                <div><strong>기압:</strong> {formatValue(obs.pressure, " hPa")}</div>
                <div><strong>풍향:</strong> {formatValue(obs.wind_direction, "°")}</div>
                <div><strong>풍속:</strong> {formatValue(obs.wind_speed, " m/s")}</div>
                <div><strong>돌풍:</strong> {formatValue(obs.gust_speed, " m/s")}</div>
                <div style={{ 
                  color: obs.wave_height === -9 || obs.wave_height === -9.0 ? "#999" : "#e74c3c",
                  fontWeight: "bold"
                }}>
                  <strong>파고:</strong> {formatValue(obs.wave_height, " m")}
                  {(obs.wave_height === -9 || obs.wave_height === -9.0) && " (결측)"}
                </div>
              </div>
            </div>
          ))}
        </div>
        {surfaceData.length > 20 && (
          <p style={{ textAlign: "center", marginTop: "12px", color: "#666", fontSize: "11px" }}>
            처음 20개 관측소만 표시됨 (총 {surfaceData.length}개)
          </p>
        )}
      </div>
    );
  };

  const renderMarineStations = () => {
    if (marineStations.length === 0) {
      return <p>해양 관측소 데이터가 없습니다.</p>;
    }

    return (
      <div style={{ maxHeight: "350px", overflowY: "auto" }}>
        <h4 style={{ fontSize: "14px", marginBottom: "12px", color: "#1976d2" }}>
        KMA 해양 관측소 ({marineStations.length}개)
        </h4>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr", 
          gap: "12px",
          marginTop: "8px"
        }}>
          {marineStations.slice(0, 20).map((station, index) => (
            <div key={`${station.station_id}-${index}`} style={{
              border: "1px solid #ddd",
              borderRadius: "6px",
              padding: "12px",
              backgroundColor: "#e3f2fd"
            }}>
              <h5 style={{ margin: "0 0 8px 0", color: "#1976d2", fontSize: "13px" }}>
                {station.station_name || `관측소 ${station.station_id}`}
              </h5>
              <div style={{ fontSize: "12px", lineHeight: "1.6" }}>
                <div><strong>관측소 ID:</strong> {station.station_id}</div>
                <div><strong>위도:</strong> {formatValue(station.lat, "°")}</div>
                <div><strong>경도:</strong> {formatValue(station.lon, "°")}</div>
                <div><strong>해수온도:</strong> {formatValue(station.sst, "°C")}</div>
                <div style={{ 
                  color: station.wave_height === -9 || station.wave_height === -9.0 ? "#999" : "#e74c3c",
                  fontWeight: "bold"
                }}>
                  <strong>파고:</strong> {formatValue(station.wave_height, " m")}
                  {(station.wave_height === -9 || station.wave_height === -9.0) && " (결측)"}
                </div>
                <div><strong>관측시각:</strong> {station.observed_at || "N/A"}</div>
              </div>
            </div>
          ))}
        </div>
        {marineStations.length > 20 && (
          <p style={{ textAlign: "center", marginTop: "12px", color: "#666", fontSize: "11px" }}>
            처음 20개 관측소만 표시됨 (총 {marineStations.length}개)
          </p>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: "16px", backgroundColor: "white", borderRadius: "12px", height: "100%" }}>
      <h3 style={{ marginBottom: "16px", color: "#333", fontSize: "16px", fontWeight: "bold" }}>KMA 해양 기상 데이터</h3>
      
      {/* 탭 메뉴 */}
      <div style={{ marginBottom: "16px" }}>
        <button
          onClick={() => setActiveTab("surface")}
          style={{
            padding: "8px 16px",
            marginRight: "8px",
            border: "none",
            borderRadius: "6px",
            backgroundColor: activeTab === "surface" ? "#007bff" : "#f8f9fa",
            color: activeTab === "surface" ? "white" : "#666",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "500"
          }}
        >
          지상 관측
        </button>
        <button
          onClick={() => setActiveTab("marine")}
          style={{
            padding: "8px 16px",
            border: "none",
            borderRadius: "6px",
            backgroundColor: activeTab === "marine" ? "#1976d2" : "#f8f9fa",
            color: activeTab === "marine" ? "white" : "#666",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "500"
          }}
        >
          해양 관측소
        </button>
      </div>

      {/* 로딩 및 에러 상태 */}
      {loading && <p>데이터를 불러오는 중...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* 데이터 표시 */}
      {!loading && !error && (
        <>
          {activeTab === "surface" && renderSurfaceData()}
          {activeTab === "marine" && renderMarineStations()}
        </>
      )}
    </div>
  );
}
