import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 자동 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터 - 401 오류 시 토큰 갱신 시도
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refresh_token: refreshToken
          });
          
          const { access_token } = response.data;
          localStorage.setItem('accessToken', access_token);
          
          // 원래 요청 재시도
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // 토큰 갱신 실패 시 로그아웃
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// 하위 호환성을 위한 기존 api 인스턴스
const api = apiClient;

// 해양 관측소 관련 API
export const getMarineSurface = async () => {
  const response = await api.get("/api/marine/surface");
  return response.data;
};

// KMA 지상 관측 데이터 API
export const getSurfaceObservations = async (params = {}) => {
  const response = await api.get("/api/surface-obs", { params });
  return response.data;
};

export const getMarineStations = async (tm = null) => {
  const params = tm ? { tm } : {};
  const response = await api.get("/api/stations", { params });
  return response.data;
};

// KMA 지상 관측소 정보 API (위치, 한글명 포함)
export const getSurfaceStations = async (tm = null) => {
  const params = tm ? { tm } : {};
  const response = await api.get("/api/surface-stations-with-obs", { params });
  return response.data;
};

// 장소 검색 API
export const getPlacesInRect = async (rect, activities) => {
  const params = { rect, activities };
  const response = await api.get("/api/places/in-rect", { params });
  return response.data;
};

// 관광지 관련 API
export const getTouristSpots = async (params = {}) => {
  const response = await api.get("/api/tourist-spots", { params });
  return response.data;
};

export const getTouristSpotDetail = async (contentId) => {
  const response = await api.get(`/api/tourist-spots/${contentId}`);
  return response.data;
};

export default apiClient;
