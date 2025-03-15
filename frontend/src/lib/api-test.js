import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      // Get token from Auth0
      const auth0 = window.auth0;
      if (auth0) {
        const isAuthenticated = await auth0.isAuthenticated();
        if (isAuthenticated) {
          const token = await auth0.getTokenSilently();
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    } catch (error) {
      console.error('Auth token error:', error);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = error.response?.data?.error || error.message || 'An unknown error occurred';
    // Show toast notification for errors
    toast.error(errorMessage);
    return Promise.reject(error);
  }
);

export default api;