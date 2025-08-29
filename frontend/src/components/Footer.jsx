export default function Footer() {
  return (
    <footer style={{
      height: "40px",
      backgroundColor: "#34495e",
      color: "#bdc3c7",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "12px",
      borderTop: "1px solid #2c3e50"
    }}>
      <div>
        © 2024 해양 스포츠 추천 시스템 | 데이터 출처: 기상청(KMA), 국립해양조사원(KHOA)
      </div>
    </footer>
  );
}
