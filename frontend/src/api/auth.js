/**
 * 인증 관련 API 클라이언트
 */

import apiClient from './client';

export const authAPI = {
    // 회원가입
    register: (userData) => {
        return apiClient.post('/api/auth/register', userData);
    },

    // 로그인
    login: (email, password) => {
        return apiClient.post('/api/auth/login', { email, password });
    },

    // 로그아웃
    logout: (refreshToken) => {
        return apiClient.post('/api/auth/logout', { refresh_token: refreshToken });
    },

    // 토큰 갱신
    refreshToken: (refreshToken) => {
        return apiClient.post('/api/auth/refresh', { refresh_token: refreshToken });
    },

    // 현재 사용자 정보 조회
    getCurrentUser: () => {
        return apiClient.get('/api/users/me');
    },

    // 프로필 업데이트
    updateProfile: (userData) => {
        return apiClient.put('/api/users/me', userData);
    },

    // 비밀번호 변경
    changePassword: (passwordData) => {
        return apiClient.put('/api/users/me/password', passwordData);
    },

    // 계정 비활성화
    deactivateAccount: () => {
        return apiClient.delete('/api/users/me');
    }
};