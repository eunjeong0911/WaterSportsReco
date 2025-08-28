export default function Header() {
  return (
    <header style={{
      height: "60px",
      backgroundColor: "#2c3e50",
      color: "white",
      display: "flex",
      alignItems: "center",
      padding: "0 20px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    }}>
      <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
        해양 스포츠 추천 시스템
      </h1>
      <div style={{ marginLeft: "auto", fontSize: "14px" }}>
        실시간 해양 정보 기반 추천 서비스
      </div>
    </header>
  );
}
