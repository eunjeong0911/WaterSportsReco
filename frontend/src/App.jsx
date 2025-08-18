import { useState } from "react";
import MapView from "./components/MapView";
import InfoCard from "./components/InfoCard";

export default function App() {
  const [info, setInfo] = useState(null);

  // MapView 내부에서 setInfo를 쓰려면 props로 내려주어도 되고,
  // 여기서는 간단하게 InfoCard를 MapView로 옮겨도 됩니다.
  // 빠르게 하기 위해 전역 이벤트로 대체하지 않고, 아래처럼 구조를 바꿉니다.

  return (
    <div>
      {/* MapView를 그대로 쓰되, InfoCard를 MapView 안에서 setInfo 하도록 리팩을 권장 */}
      {/* 여기서는 간단히 MapView만 렌더하고, InfoCard는 추후 통합 */}
      <MapView />
      {/* 임시: InfoCard를 전역으로 쓰고 싶다면 상태를 리프트업하세요. */}
      {/* <InfoCard info={info} onClose={() => setInfo(null)} /> */}
    </div>
  );
}
