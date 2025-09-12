import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:8000",
});

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

export default api;
