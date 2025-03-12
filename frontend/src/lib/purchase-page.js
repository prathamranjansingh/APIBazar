import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

// Create an axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create the API service with authentication
const createApiService = (getToken) => {
  // Add auth token to requests
  apiClient.interceptors.request.use(
    async (config) => {
      try {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error getting auth token:', error);
        // Continue with request without token
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return {
    // Get all purchased APIs for the current user
    getPurchasedApis: async () => {
      try {
        const response = await apiClient.get('/apis/user/purchased');
        return response.data;
      } catch (error) {
        console.error('Failed to fetch purchased APIs:', error);
        throw error;
      }
    },

    // Get a specific API by ID
    getApiById: async (id) => {
      try {
        const response = await apiClient.get(`/${id}`);
        return response.data;
      } catch (error) {
        console.error(`Failed to fetch API with ID ${id}:`, error);
        throw error;
      }
    },

    // Purchase an API
    purchaseApi: async (apiId) => {
      try {
        const response = await apiClient.post(`/${apiId}/purchase`);
        return response.data;
      } catch (error) {
        console.error(`Failed to purchase API with ID ${apiId}:`, error);
        throw error;
      }
    },

    // Get all API keys for the current user
    getUserApiKeys: async () => {
      try {
        const response = await apiClient.get('/keys/me');
        return response.data;
      } catch (error) {
        console.error('Failed to fetch API keys:', error);
        throw error;
      }
    },

    // Create a new API key
    createApiKey: async (data) => {
      try {
        const response = await apiClient.post('/apikeys', data);
        return response.data;
      } catch (error) {
        console.error('Failed to create API key:', error);
        throw error;
      }
    },

    // Revoke an API key
    revokeApiKey: async (keyId) => {
      try {
        const response = await apiClient.patch(`/apikeys/${keyId}/revoke`);
        return response.data;
      } catch (error) {
        console.error(`Failed to revoke API key with ID ${keyId}:`, error);
        throw error;
      }
    },

    // Get analytics for an API
    getApiAnalytics: async (apiId) => {
      try {
        const response = await apiClient.get(`/${apiId}/analytics`);
        return response.data;
      } catch (error) {
        console.error(`Failed to fetch analytics for API with ID ${apiId}:`, error);
        throw error;
      }
    },
  };
};

export { createApiService };