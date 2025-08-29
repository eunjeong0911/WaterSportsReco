import { useState } from "react";

const ACTIVITIES = [
  { id: "marine_info", label: "해양정보", description: "수온, 파고 등 해양 상태 정보" },
  { id: "surfing", label: "서핑", description: "서핑샵, 서핑스쿨, 서핑보드 대여" },
  { id: "scuba", label: "스쿠버다이빙", description: "다이빙센터, 교육장" },
  { id: "snorkel", label: "스노클링", description: "스노클링 투어, 장비대여" },
  { id: "freedive", label: "프리다이빙", description: "프리다이빙 교육장" },
  { id: "kayak", label: "카약/SUP", description: "카약, 카누, SUP" },
  { id: "yacht", label: "요트/세일링", description: "요트투어, 세일링스쿨" },
  { id: "jetski", label: "제트스키", description: "제트스키 대여" },
  { id: "windsurf", label: "윈드서핑", description: "윈드서핑, 카이트서핑" },
  { id: "fishing", label: "낚시", description: "바다낚시, 선상낚시, 갯바위낚시" },
  { id: "beach", label: "해수욕장", description: "해수욕장 정보" }
];

export default function ActivityFilter({ selectedRegion, selectedActivity, onActivitySelect }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!selectedRegion) {
    return null;
  }

  const handleActivitySelect = (activityId) => {
    onActivitySelect(activityId);
    setIsOpen(false);
  };

  const selectedActivityInfo = ACTIVITIES.find(a => a.id === selectedActivity) || ACTIVITIES[0];

  return (
    <div style={{
      position: "absolute",
      top: "20px",
      left: "220px",
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      zIndex: 10,
      minWidth: "280px"
    }}>
      {/* 선택된 지역 표시 */}
      <div style={{
        padding: "12px 15px",
        borderBottom: "1px solid #eee",
        fontWeight: "bold",
        fontSize: "14px",
        color: "#333",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px 8px 0 0"
      }}>
        📍 {selectedRegion}
      </div>

      {/* 활동 선택 드롭다운 */}
      <div style={{ padding: "10px 15px" }}>
        <label style={{ 
          display: "block", 
          marginBottom: "8px", 
          fontSize: "13px", 
          fontWeight: "600",
          color: "#555"
        }}>
          보기 옵션 선택
        </label>
        
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setIsOpen(!isOpen)}
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
                {selectedActivityInfo.label}
              </div>
              <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                {selectedActivityInfo.description}
              </div>
            </div>
            <span style={{ 
              color: "#999", 
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s"
            }}>
              ▼
            </span>
          </button>

          {isOpen && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              backgroundColor: "white",
              border: "1px solid #ddd",
              borderRadius: "6px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 1000,
              maxHeight: "300px",
              overflowY: "auto",
              marginTop: "4px"
            }}>
              {ACTIVITIES.map((activity) => (
                <button
                  key={activity.id}
                  onClick={() => handleActivitySelect(activity.id)}
                  style={{
                    width: "100%",
                    padding: "12px 15px",
                    border: "none",
                    backgroundColor: selectedActivity === activity.id ? "#e3f2fd" : "white",
                    cursor: "pointer",
                    textAlign: "left",
                    borderBottom: "1px solid #f0f0f0"
                  }}
                  onMouseEnter={(e) => {
                    if (selectedActivity !== activity.id) {
                      e.target.style.backgroundColor = "#f5f5f5";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedActivity !== activity.id) {
                      e.target.style.backgroundColor = "white";
                    }
                  }}
                >
                  <div style={{ fontWeight: "500", color: "#333", fontSize: "14px" }}>
                    {activity.label}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                    {activity.description}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
