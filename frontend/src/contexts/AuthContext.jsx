/**
 * 인증 컨텍스트
 * 전역 인증 상태 관리 및 토큰 자동 갱신
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tokens, setTokens] = useState({
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken')
    });

    // 초기 로드 시 토큰 확인
    useEffect(() => {
        const initAuth = async () => {
            const accessToken = localStorage.getItem('accessToken');
            const refreshToken = localStorage.getItem('refreshToken');
            
            if (accessToken && refreshToken) {
                try {
                    // 현재 사용자 정보 조회
                    const response = await authAPI.getCurrentUser();
                    setUser(response.data);
                    setTokens({ accessToken, refreshToken });
                } catch (error) {
                    console.error('Failed to get current user:', error);
                    // 토큰이 유효하지 않으면 제거
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    setTokens({ accessToken: null, refreshToken: null });
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    // 토큰 자동 갱신 (5분마다 체크)
    useEffect(() => {
        if (!tokens.accessToken) return;

        const refreshInterval = setInterval(() => {
            refreshTokenIfNeeded();
        }, 5 * 60 * 1000); // 5분마다 체크

        return () => clearInterval(refreshInterval);
    }, [tokens.accessToken]);

    const login = async (email, password) => {
        try {
            setLoading(true);
            const response = await authAPI.login(email, password);
            const { access_token, refresh_token, user: userData } = response.data;
            
            setTokens({ accessToken: access_token, refreshToken: refresh_token });
            setUser(userData);
            
            localStorage.setItem('accessToken', access_token);
            localStorage.setItem('refreshToken', refresh_token);
            
            return { success: true };
        } catch (error) {
            console.error('Login failed:', error);
            return { 
                success: false, 
                error: error.response?.data?.detail || '로그인에 실패했습니다' 
            };
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        try {
            setLoading(true);
            const response = await authAPI.register(userData);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Registration failed:', error);
            return { 
                success: false, 
                error: error.response?.data?.detail || '회원가입에 실패했습니다' 
            };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            if (tokens.refreshToken) {
                await authAPI.logout(tokens.refreshToken);
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            setTokens({ accessToken: null, refreshToken: null });
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        }
    };

    const refreshTokenIfNeeded = async () => {
        if (!tokens.refreshToken) return false;
        
        try {
            // Access Token 만료 시간 확인 (JWT 디코딩)
            const accessToken = tokens.accessToken;
            if (accessToken) {
                const payload = JSON.parse(atob(accessToken.split('.')[1]));
                const currentTime = Date.now() / 1000;
                const timeUntilExpiry = payload.exp - currentTime;
                
                // 5분(300초) 이내에 만료되면 갱신
                if (timeUntilExpiry > 300) {
                    return true; // 아직 갱신할 필요 없음
                }
            }
            
            const response = await authAPI.refreshToken(tokens.refreshToken);
            const { access_token } = response.data;
            
            setTokens(prev => ({ ...prev, accessToken: access_token }));
            localStorage.setItem('accessToken', access_token);
            
            return true;
        } catch (error) {
            console.error('Token refresh failed:', error);
            logout();
            return false;
        }
    };

    const updateUser = async (userData) => {
        try {
            const response = await authAPI.updateProfile(userData);
            setUser(response.data);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Profile update failed:', error);
            return { 
                success: false, 
                error: error.response?.data?.detail || '프로필 업데이트에 실패했습니다' 
            };
        }
    };

    const changePassword = async (passwordData) => {
        try {
            const response = await authAPI.changePassword(passwordData);
            return { success: true, message: response.data.message };
        } catch (error) {
            console.error('Password change failed:', error);
            return { 
                success: false, 
                error: error.response?.data?.detail || '비밀번호 변경에 실패했습니다' 
            };
        }
    };

    const value = {
        user,
        tokens,
        loading,
        login,
        register,
        logout,
        updateUser,
        changePassword,
        refreshTokenIfNeeded,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};