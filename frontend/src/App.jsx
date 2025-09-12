import { useState } from "react";
import MapView from "./components/MapView";
import ChatWindow from "./components/ChatWindow";
import MarineDataView from "./components/MarineDataView";
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function App() {
  const [selectedRegion, setSelectedRegion] = useState(null);
  
  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      height: "100vh",
      overflow: "hidden"
    }}>
      <Header />
      
      <main style={{ 
        flex: 1, 
        display: "flex",
        overflow: "hidden",
        position: "relative"
      }}>
        {/* 왼쪽: 지도 */}
        <div style={{ 
          flex: 1,
          position: "relative",
          overflow: "hidden",
          minWidth: 0  // flex 아이템이 축소될 수 있도록
        }}>
          <MapView onRegionSelect={setSelectedRegion} />
          
          {/* 해양 데이터 패널 */}
          <div style={{
            position: "absolute",
            top: "20px",
            left: "320px",
            width: "350px",
            maxHeight: "500px",
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            zIndex: 10,
            overflow: "hidden"
          }}>
            <MarineDataView />
          </div>
        </div>
        
        {/* 오른쪽: 채팅창 */}
        <div style={{ 
          width: "400px",
          minWidth: "300px",
          maxWidth: "500px",
          borderLeft: "1px solid #ddd",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}>
          <ChatWindow selectedRegion={selectedRegion} />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
