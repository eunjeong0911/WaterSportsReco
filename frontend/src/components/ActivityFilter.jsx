import { useState } from "react";

const REGIONS = [
  { id: "전체", label: "전체", description: "전국 전체 지역" },
  { id: "서울", label: "서울", description: "서울특별시" },
  { id: "부산", label: "부산", description: "부산광역시" },
  { id: "대구", label: "대구", description: "대구광역시" },
  { id: "인천", label: "인천", description: "인천광역시" },
  { id: "광주", label: "광주", description: "광주광역시" },
  { id: "대전", label: "대전", description: "대전광역시" },
  { id: "울산", label: "울산", description: "울산광역시" },
  { id: "세종", label: "세종", description: "세종특별자치시" },
  { id: "경기", label: "경기", description: "경기도" },
  { id: "강원", label: "강원", description: "강원도" },
  { id: "충북", label: "충북", description: "충청북도" },
  { id: "충남", label: "충남", description: "충청남도" },
  { id: "전북", label: "전북", description: "전라북도" },
  { id: "전남", label: "전남", description: "전라남도" },
  { id: "경북", label: "경북", description: "경상북도" },
  { id: "경남", label: "경남", description: "경상남도" },
  { id: "제주", label: "제주", description: "제주특별자치도" }
];

const MARINE_INFO = [
  { id: "marine_info", label: "해양정보", description: "풍향, 풍속, 기온, 강수량, 파고" }
];

const TOURIST_SPOTS = [
  { id: "tourist_spots", label: "관광지", description: "한국관광공사 관광지 정보" }
];

export default function ActivityFilter({ selectedRegion, selectedActivity, onActivitySelect, onRegionSelect }) {
  const [activeTab, setActiveTab] = useState("tourist"); // regions 제거, tourist가 기본
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isMarineOpen, setIsMarineOpen] = useState(false);
  const [isTouristOpen, setIsTouristOpen] = useState(false);

  const handleRegionSelect = (regionId) => {
    onRegionSelect(regionId);
    setIsRegionOpen(false);
  };

  const handleActivitySelect = (activityId) => {
    onActivitySelect(activityId);
    setIsTouristOpen(false);
  };

  const getSelectedRegionLabel = () => {
      const selectedRegionInfo = REGIONS.find(r => r.id === selectedRegion) || REGIONS[0];
      return selectedRegionInfo.label;
  };

  const getSelectedRegionDescription = () => {
      const selectedRegionInfo = REGIONS.find(r => r.id === selectedRegion) || REGIONS[0];
      return selectedRegionInfo.description;
  };

  return (
    <div>
      {/* 지역 선택 박스 */}
    <div style={{
      position: "absolute",
      top: "20px",
      left: "220px",
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      zIndex: 10,
      minWidth: "320px"
    }}>
        {/* 지역 선택 헤더 */}
      <div style={{
        padding: "12px 15px",
        borderBottom: "1px solid #eee",
        fontWeight: "bold",
        fontSize: "14px",
        color: "#333",
          backgroundColor: "#007bff",
          color: "white",
          borderRadius: "8px 8px 0 0"
        }}>
          지역 선택
        </div>

        {/* 지역 드롭다운 */}
        <div style={{ padding: "10px 15px" }}>
        <div style={{ position: "relative" }}>
          <button
              onClick={() => setIsRegionOpen(!isRegionOpen)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              backgroundColor: "white",
              cursor: "pointer",
              fontSize: "14px",
              textAlign: "left",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <div style={{ fontWeight: "500", color: "#333" }}>
                  {getSelectedRegionLabel()}
              </div>
              <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                  {getSelectedRegionDescription()}
                </div>
            </div>
            <span style={{ 
              color: "#999", 
                transform: isRegionOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s"
            }}>
              ▼
            </span>
          </button>

            {isRegionOpen && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              backgroundColor: "white",
              border: "1px solid #ddd",
              borderRadius: "6px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                zIndex: 20,
                maxHeight: "200px",
              overflowY: "auto",
              marginTop: "4px"
            }}>
                {REGIONS.map(region => (
                <button
                  key={region.id}
                  onClick={() => handleRegionSelect(region.id)}
                  style={{
                    width: "100%",
                      padding: "10px 12px",
                    border: "none",
                      backgroundColor: selectedRegion === region.id ? "#f0f8ff" : "transparent",
                    cursor: "pointer",
                      fontSize: "13px",
                    textAlign: "left",
                      color: selectedRegion === region.id ? "#007bff" : "#333",
                    borderBottom: "1px solid #f0f0f0"
                  }}
                  onMouseEnter={(e) => {
                    if (selectedRegion !== region.id) {
                        e.target.style.backgroundColor = "#f8f9fa";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedRegion !== region.id) {
                        e.target.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <div style={{ fontWeight: "500" }}>{region.label}</div>
                    <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>
                    {region.description}
                  </div>
                </button>
              ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 해양정보 박스 */}
      <div style={{
        position: "absolute",
        top: "140px", // 지역 선택 박스 아래에 배치
        left: "220px",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        zIndex: 10,
        minWidth: "320px"
      }}>
        {/* 해양정보 헤더 */}
        <div style={{
          padding: "12px 15px",
          borderBottom: "1px solid #eee",
          fontWeight: "bold",
          fontSize: "14px",
          color: "#333",
          backgroundColor: "#17a2b8",
          color: "white",
          borderRadius: "8px 8px 0 0"
        }}>
          해양정보
        </div>

        {/* 해양정보 드롭다운 */}
        <div style={{ padding: "10px 15px" }}>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setIsMarineOpen(!isMarineOpen)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                backgroundColor: "white",
                cursor: "pointer",
                fontSize: "14px",
                textAlign: "left",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <div style={{ fontWeight: "500", color: "#333" }}>
                  해양정보
                </div>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                  풍향, 풍속, 기온, 강수량, 파고
                </div>
              </div>
              <span style={{ 
                color: "#999", 
                transform: isMarineOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s"
              }}>
                ▼
              </span>
            </button>

            {isMarineOpen && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                backgroundColor: "white",
                border: "1px solid #ddd",
                borderRadius: "6px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                zIndex: 20,
                marginTop: "4px"
              }}>
                {MARINE_INFO.map(marine => (
                <button
                    key={marine.id}
                    onClick={() => onActivitySelect(marine.id)}
                  style={{
                    width: "100%",
                      padding: "10px 12px",
                    border: "none",
                      backgroundColor: selectedActivity === marine.id ? "#f0f8ff" : "transparent",
                    cursor: "pointer",
                      fontSize: "13px",
                    textAlign: "left",
                      color: selectedActivity === marine.id ? "#17a2b8" : "#333"
                  }}
                  onMouseEnter={(e) => {
                      if (selectedActivity !== marine.id) {
                        e.target.style.backgroundColor = "#f8f9fa";
                    }
                  }}
                  onMouseLeave={(e) => {
                      if (selectedActivity !== marine.id) {
                        e.target.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <div style={{ fontWeight: "500" }}>{marine.label}</div>
                    <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>
                      {marine.description}
                  </div>
                </button>
              ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 관광지 박스 */}
      <div style={{
        position: "absolute",
        top: "260px", // 해양정보 박스 아래에 배치
        left: "220px",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        zIndex: 10,
        minWidth: "320px"
      }}>
        {/* 관광지 헤더 */}
        <div style={{
          padding: "12px 15px",
          borderBottom: "1px solid #eee",
          fontWeight: "bold",
          fontSize: "14px",
          backgroundColor: "#28a745",
          color: "white",
          borderRadius: "8px 8px 0 0"
        }}>
          관광지
        </div>

        {/* 관광지 드롭다운 */}
        <div style={{ padding: "10px 15px" }}>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setIsTouristOpen(!isTouristOpen)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                backgroundColor: "white",
                cursor: "pointer",
                fontSize: "14px",
                textAlign: "left",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <div style={{ fontWeight: "500", color: "#333" }}>
                  관광지
                </div>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                  한국관광공사 관광지 정보
                </div>
              </div>
              <span style={{ 
                color: "#999", 
                transform: isTouristOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s"
              }}>
                ▼
              </span>
            </button>

            {isTouristOpen && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                backgroundColor: "white",
                border: "1px solid #ddd",
                borderRadius: "6px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                zIndex: 20,
                marginTop: "4px"
              }}>
                {TOURIST_SPOTS.map(tourist => (
                <button
                    key={tourist.id}
                    onClick={() => handleActivitySelect(tourist.id)}
                  style={{
                    width: "100%",
                      padding: "10px 12px",
                    border: "none",
                      backgroundColor: selectedActivity === tourist.id ? "#f0f8ff" : "transparent",
                    cursor: "pointer",
                      fontSize: "13px",
                    textAlign: "left",
                      color: selectedActivity === tourist.id ? "#28a745" : "#333"
                  }}
                  onMouseEnter={(e) => {
                      if (selectedActivity !== tourist.id) {
                        e.target.style.backgroundColor = "#f8f9fa";
                    }
                  }}
                  onMouseLeave={(e) => {
                      if (selectedActivity !== tourist.id) {
                        e.target.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <div style={{ fontWeight: "500" }}>{tourist.label}</div>
                    <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>
                      {tourist.description}
                  </div>
                </button>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
