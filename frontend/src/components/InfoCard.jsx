export default function InfoCard({ info, onClose }) {
  if (!info) return null;
  const { spotName, sst, wave_height, current_speed, observed_at } = info;
  return (
    <div style={{
      position: "absolute", bottom: 20, left: 20, background: "white",
      padding: 12, borderRadius: 8, boxShadow: "0 4px 14px rgba(0,0,0,0.15)"
    }}>
      <div style={{display:"flex", justifyContent:"space-between", gap:8}}>
        <h3 style={{margin:0}}>{spotName}</h3>
        <button onClick={onClose}>닫기</button>
      </div>
      <ul style={{margin:"8px 0 0 0", paddingLeft:18}}>
        <li>수온(SST): {sst ?? "-"} ℃</li>
        <li>파고(Wave H): {wave_height ?? "-"} m</li>
        <li>조류(Current): {current_speed ?? "-"} m/s</li>
        <li>관측시각: {observed_at ?? "-"}</li>
      </ul>
    </div>
  );
}
