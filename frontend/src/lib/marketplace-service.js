import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle token expiration
    if (error.response?.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const MarketplaceService = {
  // API endpoints
  getAllApis: async (params = {}) => {
    try {
      const response = await apiClient.get('/apis', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching APIs:', error);
      throw error;
    }
  },

  getApiById: async (id) => {
    try {
      const response = await apiClient.get(`/apis/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching API with ID ${id}:`, error);
      throw error;
    }
  },

  purchaseApi: async (apiId) => {
    try {
      const response = await apiClient.post(`/apis/${apiId}/purchase`);
      return response.data;
    } catch (error) {
      console.error(`Error purchasing API with ID ${apiId}:`, error);
      throw error;
    }
  },

  verifyPayment: async (paymentData) => {
    try {
      const response = await apiClient.post('/payments/verify', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  },

  getApiReviews: async (apiId, params = {}) => {
    try {
      const response = await apiClient.get(`/reviews/apis/${apiId}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching reviews for API ${apiId}:`, error);
      throw error;
    }
  },

  createReview: async (apiId, reviewData) => {
    try {
      const response = await apiClient.post(`/reviews/apis/${apiId}`, reviewData);
      return response.data;
    } catch (error) {
      console.error(`Error creating review for API ${apiId}:`, error);
      throw error;
    }
  },

  // User endpoints
  getMyProfile: async () => {
    try {
      const response = await apiClient.get('/users/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  getMyApis: async () => {
    try {
      const response = await apiClient.get('/apis/user/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching my APIs:', error);
      throw error;
    }
  },

  getPurchasedApis: async () => {
    try {
      const response = await apiClient.get('/apis/user/purchased');
      return response.data;
    } catch (error) {
      console.error('Error fetching purchased APIs:', error);
      throw error;
    }
  },

  // Test endpoints functionality
  testEndpoint: async (apiId, endpointId, testData) => {
    try {
      const response = await apiClient.post(
        `/apis/${apiId}/endpoints/${endpointId}/test`,
        testData
      );
      return response.data;
    } catch (error) {
      console.error(`Error testing endpoint ${endpointId}:`, error);
      throw error;
    }
  },
};

export default MarketplaceService;