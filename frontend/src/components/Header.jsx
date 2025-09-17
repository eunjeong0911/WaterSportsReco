import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

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
      <Link 
        to="/" 
        style={{ 
          textDecoration: 'none', 
          color: 'white',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
          해양 스포츠 추천 시스템
        </h1>
      </Link>
      
      <div style={{ 
        marginLeft: "auto", 
        display: "flex", 
        alignItems: "center", 
        gap: "20px" 
      }}>
        <div style={{ fontSize: "14px" }}>
          실시간 해양 정보 기반 추천 서비스
        </div>
        
        {isAuthenticated ? (
          // 로그인된 상태
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "15px",
            fontSize: "14px"
          }}>
            <span>안녕하세요, {user?.name}님!</span>
            <Link 
              to="/profile" 
              style={{ 
                color: "white", 
                textDecoration: "none",
                padding: "8px 16px",
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: "4px",
                transition: "background-color 0.2s"
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.2)"}
              onMouseOut={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.1)"}
            >
              마이페이지
            </Link>
            <button
              onClick={handleLogout}
              style={{
                color: "white",
                backgroundColor: "transparent",
                border: "1px solid rgba(255,255,255,0.3)",
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = "rgba(255,255,255,0.1)";
                e.target.style.borderColor = "rgba(255,255,255,0.5)";
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = "transparent";
                e.target.style.borderColor = "rgba(255,255,255,0.3)";
              }}
            >
              로그아웃
            </button>
          </div>
        ) : (
          // 로그인되지 않은 상태
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "10px",
            fontSize: "14px"
          }}>
            <Link 
              to="/login" 
              style={{ 
                color: "white", 
                textDecoration: "none",
                padding: "8px 16px",
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: "4px",
                transition: "background-color 0.2s"
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.2)"}
              onMouseOut={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.1)"}
            >
              로그인
            </Link>
            <Link 
              to="/register" 
              style={{ 
                color: "white", 
                textDecoration: "none",
                padding: "8px 16px",
                backgroundColor: "#3498db",
                borderRadius: "4px",
                transition: "background-color 0.2s"
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = "#2980b9"}
              onMouseOut={(e) => e.target.style.backgroundColor = "#3498db"}
            >
              회원가입
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
