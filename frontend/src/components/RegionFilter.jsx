export default function RegionFilter({ regions, selectedRegion, onRegionSelect }) {
  return (
    <div style={{
      position: "absolute",
      top: "20px",
      left: "20px",
      backgroundColor: "white",
      padding: "15px",
      borderRadius: "8px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      zIndex: 10
    }}>
      <div style={{ marginBottom: "10px", fontWeight: "bold", fontSize: "14px" }}>
        지역 선택
      </div>
      <select
        value={selectedRegion || ""}
        onChange={(e) => onRegionSelect(e.target.value || null)}
        style={{
          width: "150px",
          padding: "8px",
          borderRadius: "4px",
          border: "1px solid #ddd",
          outline: "none",
          cursor: "pointer"
        }}
      >
        <option value="">전체 지도</option>
        {regions.map(region => (
          <option key={region} value={region}>{region}</option>
        ))}
      </select>
    </div>
  );
}
