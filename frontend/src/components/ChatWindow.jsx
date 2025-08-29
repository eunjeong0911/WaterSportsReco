import { useState, useRef, useEffect } from "react";

export default function ChatWindow({ selectedRegion }) {
  const [messages, setMessages] = useState([
    { type: "system", text: "안녕하세요! 해양 스포츠 추천 도우미입니다. 지역을 선택하시면 현재 해양 정보를 기반으로 적합한 스포츠를 추천해드립니다." }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 지역 선택 시 메시지 추가
  useEffect(() => {
    if (selectedRegion) {
      const regionMessage = {
        type: "bot",
        text: `${selectedRegion} 지역을 선택하셨습니다. 해당 지역의 해양 정보를 분석 중입니다...`
      };
      setMessages(prev => [...prev, regionMessage]);
      
      // 추천 메시지 (실제로는 API 호출 후 결과 표시)
      setTimeout(() => {
        const recommendMessage = {
          type: "bot",
          text: `${selectedRegion} 지역의 현재 해양 상태:\n• 수온: 적정\n• 파도: 잔잔함\n• 날씨: 맑음\n\n추천 스포츠: 카약, 패들보드, 스노클링`
        };
        setMessages(prev => [...prev, recommendMessage]);
      }, 1500);
    }
  }, [selectedRegion]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { type: "user", text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    // 임시 응답 (실제로는 백엔드 API 호출)
    setTimeout(() => {
      let responseText = `"${input}"에 대한 추천을 준비하고 있습니다.`;
      
      if (!selectedRegion) {
        responseText += " 먼저 지도에서 지역을 선택해주세요!";
      } else {
        responseText = `${selectedRegion} 지역에서 "${input}"에 적합한 스포츠를 찾고 있습니다...`;
      }
      
      const botMessage = {
        type: "bot",
        text: responseText
      };
      setMessages(prev => [...prev, botMessage]);
    }, 500);
  };

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#f7f7f7"
    }}>
      {/* 채팅 제목 */}
      <div style={{
        padding: "15px",
        backgroundColor: "#3498db",
        color: "white",
        fontWeight: "bold"
      }}>
        AI 해양 스포츠 추천
      </div>

      {/* 메시지 영역 */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "15px",
        display: "flex",
        flexDirection: "column",
        gap: "10px"
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              justifyContent: msg.type === "user" ? "flex-end" : "flex-start"
            }}
          >
            <div style={{
              maxWidth: "80%",
              padding: "10px 15px",
              borderRadius: "10px",
              backgroundColor: msg.type === "user" ? "#3498db" : msg.type === "system" ? "#95a5a6" : "#ecf0f1",
              color: msg.type === "user" || msg.type === "system" ? "white" : "#2c3e50",
              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word"
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div style={{
        padding: "15px",
        borderTop: "1px solid #ddd",
        backgroundColor: "white",
        display: "flex",
        gap: "10px"
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="메시지를 입력하세요..."
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "20px",
            border: "1px solid #ddd",
            outline: "none"
          }}
        />
        <button
          onClick={handleSend}
          style={{
            padding: "10px 20px",
            borderRadius: "20px",
            border: "none",
            backgroundColor: "#3498db",
            color: "white",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          전송
        </button>
      </div>
    </div>
  );
}
