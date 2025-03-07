import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

// Create an axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the auth token for all requests
const setAuthHeader = async (config) => {
  try {
    // We'll get the token from Auth0 and add it to requests
    if (window.getAccessToken) {
      const token = await window.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  } catch (error) {
    console.error("Error setting auth header:", error);
    return config;
  }
};

api.interceptors.request.use(setAuthHeader);

// API service for various endpoints
export const apiService = {
  // API endpoints
  getApis: async (params = {}) => {
    const response = await api.get("/apis", { params });
    return response.data;
  },
  getApiById: async (id) => {
    const response = await api.get(`/apis/${id}`);
    return response.data;
  },
  createApi: async (apiData) => {
    const response = await api.post("/apis", apiData);
    return response.data;
  },
  updateApi: async (id, apiData) => {
    const response = await api.put(`/apis/${id}`, apiData);
    return response.data;
  },
  deleteApi: async (id) => {
    const response = await api.delete(`/apis/${id}`);
    return response.data;
  },
  // Endpoints
  addEndpoint: async (apiId, endpointData) => {
    const response = await api.post(`/apis/${apiId}/endpoints`, endpointData);
    return response.data;
  },
  updateEndpoint: async (apiId, endpointId, endpointData) => {
    const response = await api.put(`/apis/${apiId}/endpoints/${endpointId}`, endpointData);
    return response.data;
  },
  deleteEndpoint: async (apiId, endpointId) => {
    const response = await api.delete(`/apis/${apiId}/endpoints/${endpointId}`);
    return response.data;
  },
  // API keys
  createApiKey: async (apiId, keyData = {}) => {
    const response = await api.post(`/keys/apis/${apiId}`, keyData);
    return response.data;
  },
  getMyApiKeys: async () => {
    const response = await api.get("/keys/me");
    return response.data;
  },
  revokeApiKey: async (keyId) => {
    const response = await api.delete(`/keys/${keyId}`);
    return response.data;
  },
  // API Reviews
  getApiReviews: async (apiId, params = {}) => {
    const response = await api.get(`/reviews/apis/${apiId}`, { params });
    return response.data;
  },
  createReview: async (apiId, reviewData) => {
    const response = await api.post(`/reviews/apis/${apiId}`, reviewData);
    return response.data;
  },
  // API purchase
  purchaseApi: async (apiId) => {
    const response = await api.post(`/apis/${apiId}/purchase`);
    return response.data;
  },
  // User APIs
  getMyApis: async () => {
    const response = await api.get("/apis/user/me");
    return response.data;
  },
  getPurchasedApis: async () => {
    const response = await api.get("/apis/user/purchased");
    return response.data;
  },
};

export default api;