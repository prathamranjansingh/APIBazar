
import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { toast } from "sonner";

export function useAuthToken() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const getToken = async () => {
        setIsLoading(true);
        try {
          const accessToken = await getAccessTokenSilently();
          setToken(accessToken);
          localStorage.setItem("auth_token", accessToken);
        } catch (error) {
          console.error("Error getting token:", error);
          toast.error("Authentication Error", {
            description: "Failed to get authentication token. Please try logging in again.",
          });
        } finally {
          setIsLoading(false);
        }
      };
      getToken();
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  return { token, isLoading };
}


export const useAuth = () => {
  const {
    isLoading,           // Loading state
    isAuthenticated,     // Whether the user is authenticated
    user,                // User profile data
    loginWithRedirect,   // Function to log in
    logout,              // Function to log out
    getAccessTokenSilently, // Function to get access token
  } = useAuth0();

  const [accessToken, setAccessToken] = useState(null);

  // Fetch the access token silently
  useEffect(() => {
    if (isAuthenticated) {
      const fetchAccessToken = async () => {
        try {
          const token = await getAccessTokenSilently();
          setAccessToken(token);
        } catch (error) {
          console.error('Failed to fetch access token:', error);
        }
      };
      fetchAccessToken();
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  return {
    isLoading,
    isAuthenticated,
    user,
    accessToken,
    login: () => loginWithRedirect(), 
    logout: () => logout({ returnTo: window.location.origin }),
  };
};