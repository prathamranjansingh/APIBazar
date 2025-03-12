import { useAuth0 } from '@auth0/auth0-react';

const API_URL =  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";


// Create a wrapper hook to use the Auth0 context
export const useApiService = () => {
  const { getAccessTokenSilently } = useAuth0();

  // Helper function to get the auth token
  const getAuthToken = async () => {
    try {
      const token = await getAccessTokenSilently();
      return token;
    } catch (error) {
      console.error('Error getting token', error);
      return null;
    }
  };

  // API request helper with authentication
  const apiRequest = async (endpoint, options = {}) => {
    try {
      const token = await getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API request failed');
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  };

  // Return the API service methods
  return {
    // API endpoints
    getAllApis: () => apiRequest('/apis'),
    getApiById: (id) => apiRequest(`/apis/${id}`),
    createApi: (data) => apiRequest('/apis', { method: 'POST', body: JSON.stringify(data) }),
    updateApi: (id, data) => apiRequest(`/apis/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteApi: (id) => apiRequest(`/apis/${id}`, { method: 'DELETE' }),

    // User APIs
    getMyApis: () => apiRequest('/apis/user/me'),
    getPurchasedApis: () => apiRequest('/apis/user/purchased'),

    // API Keys
    getMyApiKeys: () => apiRequest('/keys/me'),
    createApiKey: (apiId, data) =>
      apiRequest(`/keys/apis/${apiId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    revokeApiKey: (keyId) => apiRequest(`/keys/${keyId}`, { method: 'DELETE' }),

    // Purchase
    purchaseApi: (apiId) => apiRequest(`/apis/${apiId}/purchase`, { method: 'POST' }),

    // Webhooks
    getApiWebhooks: (apiId) => apiRequest(`/webhooks/apis/${apiId}`),
    createWebhook: (apiId, data) =>
      apiRequest(`/webhooks/apis/${apiId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateWebhook: (apiId, webhookId, data) =>
      apiRequest(`/webhooks/apis/${apiId}/${webhookId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteWebhook: (apiId, webhookId) =>
      apiRequest(`/webhooks/apis/${apiId}/${webhookId}`, {
        method: 'DELETE',
      }),

    // Analytics
    getApiAnalytics: (apiId, period = '30days') =>
      apiRequest(`/analytics/${apiId}?period=${period}`),
  };
};