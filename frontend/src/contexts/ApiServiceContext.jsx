import React, { createContext, useContext } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { createApiService } from '../lib/purchase-page';
import { toast } from 'sonner';

// Create context for the API service
const ApiServiceContext = createContext(null);

// Provider component to wrap around your application
export const ApiServiceProvider = ({ children }) => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";
  // Fetch API details
  const fetchApiDetails = async (apiId) => {
    try {
      let headers = {};
      if (isAuthenticated) {
        const token = await getAccessTokenSilently();
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await axios.get(`/api/apis/${apiId}`, { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching API details:', error);
      toast.error('Failed to load API details');
      throw error;
    }
  };

  // Purchase an API
  const purchaseApi = async (apiId) => {
    try {
      if (!isAuthenticated) {
        toast.error('You must be logged in to purchase an API');
        return null;
      }

      const token = await getAccessTokenSilently();
      const response = await axios.post(
        `/api/apis/${apiId}/purchase`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('API purchased successfully');
      return response.data;
    } catch (error) {
      console.error('Error purchasing API:', error);
      toast.error(error.response?.data?.message || 'Failed to purchase API');
      throw error;
    }
  };

  // Check if the user has purchased the API
  const checkPurchaseStatus = async (apiId) => {
    try {
      if (!isAuthenticated) return false;

      const token = await getAccessTokenSilently();
      const response = await axios.get(`/api/users/me/purchased/${apiId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data.purchased;
    } catch (error) {
      console.error('Error checking purchase status:', error);
      return false;
    }
  };

  // Create the base API service and extend it with additional functions
  const baseApiService = createApiService(() => getAccessTokenSilently());

  // Combine the base API service with the new functions
  const apiService = {
    ...baseApiService,
    fetchApiDetails,
    purchaseApi,
    checkPurchaseStatus,
  };

  return (
    <ApiServiceContext.Provider value={apiService}>
      {children}
    </ApiServiceContext.Provider>
  );
};

// Custom hook to use the API service
export const useApiService = () => {
  const context = useContext(ApiServiceContext);
  if (!context) {
    throw new Error('useApiService must be used within an ApiServiceProvider');
  }
  return context;
};