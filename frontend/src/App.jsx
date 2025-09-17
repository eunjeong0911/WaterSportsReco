import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// 페이지 컴포넌트들
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 공개 라우트 */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* 보호된 라우트 */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          
          {/* 404 페이지 */}
          <Route path="*" element={<div>페이지를 찾을 수 없습니다</div>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
