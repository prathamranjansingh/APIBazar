import { useState, useEffect, useCallback } from "react";
import { apiService } from "@/services/api";
import { useAuth0 } from "@auth0/auth0-react";
import { toast } from "sonner";

export function useApis() {
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth0();

  const fetchApis = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const data = await apiService.getApis(params);
      setApis(data.data || []);
      return data;
    } catch (err) {
      console.error("Error fetching APIs:", err);
      setError(err.message || "Failed to fetch APIs");
      return { data: [], pagination: {} };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApis();
  }, [fetchApis]);

  const getApiById = useCallback(async (id) => {
    try {
      setLoading(true);
      const data = await apiService.getApiById(id);
      return data;
    } catch (err) {
      setError(err.message || "Failed to fetch API details");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createApi = useCallback(
    async (apiData) => {
      if (!isAuthenticated) {
        toast.error("Authentication required", {
          description: "You must be logged in to create an API",
        });
        return null;
      }

      try {
        setLoading(true);
        const data = await apiService.createApi(apiData);
        toast.success("API created", {
          description: "Your API has been created successfully",
        });
        return data;
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.message || "Failed to create API";
        setError(errorMsg);
        toast.error("Failed to create API", {
          description: errorMsg,
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  return {
    apis,
    loading,
    error,
    fetchApis,
    getApiById,
    createApi,
  };
}