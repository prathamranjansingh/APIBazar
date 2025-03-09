// src/hooks/use-auth-token.js
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