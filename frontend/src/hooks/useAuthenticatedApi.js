import { useCallback } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";

export function useAuthenticatedApi() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  /**
   * Makes an API request with authentication if the user is logged in
   */
  const apiRequest = useCallback(
    async ({ url, method = "get", data = null, requireAuth = false, config = {} }) => {
      const requestConfig = { ...config };

      // Add token if the user is authenticated
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently();
          requestConfig.headers = {
            ...requestConfig.headers,
            Authorization: `Bearer ${token}`,
          };
        } catch (error) {
          console.error("Failed to get auth token:", error);

          // If authentication is required but we couldn't get a token, fail
          if (requireAuth) {
            throw new Error("Authentication required");
          }
        }
      } else if (requireAuth) {
        throw new Error("Authentication required");
      }

      // Make the request
      return axios({
        method,
        url,
        ...requestConfig,
        data: data || undefined,
      });
    },
    [getAccessTokenSilently, isAuthenticated]
  );

  const post = useCallback(
    (url, data, options = {}) => {
      // Log the request details for debugging
      console.log(`About to POST to ${url} with data:`, data);
  
      // Call the apiRequest function with the POST method
      return apiRequest({
        url,
        method: "post",
        data,
        requireAuth: options.requireAuth,
        config: options.config,
      });
    },
    [apiRequest] // Dependency array to ensure the function is memoized
  );

  // Convenience methods for common HTTP methods
  return {
    apiRequest,
    get: useCallback(
      (url, options = {}) =>
        apiRequest({
          url,
          method: "get",
          requireAuth: options.requireAuth,
          config: options.config,
        }),
      [apiRequest]
    ),
    post: useCallback(
      (url, data, options = {}) =>
        apiRequest({
          url,
          method: "post",
          data,
          requireAuth: options.requireAuth,
          config: options.config,
        }),
      [apiRequest]
    ),
    put: useCallback(
      (url, data, options = {}) =>
        apiRequest({
          url,
          method: "put",
          data,
          requireAuth: options.requireAuth,
          config: options.config,
        }),
      [apiRequest]
    ),
    delete: useCallback(
      (url, options = {}) =>
        apiRequest({
          url,
          method: "delete",
          requireAuth: options.requireAuth,
          config: options.config,
        }),
      [apiRequest]
    ),
  };
}