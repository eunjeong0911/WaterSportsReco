/**
 * 보호된 라우트 컴포넌트
 * 인증된 사용자만 접근 가능한 페이지를 보호
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '18px'
            }}>
                로딩 중...
            </div>
        );
    }

    if (!isAuthenticated) {
        // 로그인 후 원래 페이지로 돌아가기 위해 현재 위치 저장
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;