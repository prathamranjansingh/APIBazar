import React, { createContext, useContext } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { createApiService } from '../lib/purchase-page';

const ApiServiceContext = createContext(null);

export const ApiServiceProvider = ({ children }) => {
  const { getAccessTokenSilently } = useAuth0();

  // Create the API service with the token getter function
  const apiService = createApiService(() => getAccessTokenSilently());

  return (
    <ApiServiceContext.Provider value={apiService}>
      {children}
    </ApiServiceContext.Provider>
  );
};

export const useApiService = () => {
  const context = useContext(ApiServiceContext);
  if (!context) {
    throw new Error('useApiService must be used within an ApiServiceProvider');
  }
  return context;
};