import { useState, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { analyticsService } from '../services/analyticsService';

/**
 * Custom hook that provides analytics functionality with auth token management
 */
export const useAnalytics = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get analytics for all APIs owned by the current user
   */
  const getMyApiAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getAccessTokenSilently();
      const result = await analyticsService.getMyApiAnalytics(token);
      setIsLoading(false);
      return result;
    } catch (err) {
      setError(err);
      setIsLoading(false);
      throw err;
    }
  }, [getAccessTokenSilently]);

  /**
   * Get complete analytics for a specific API
   */
  const getApiCompleteAnalytics = useCallback(
    async (apiId) => {
      setIsLoading(true);
      setError(null);
      try {
        const token = await getAccessTokenSilently();
        const result = await analyticsService.getApiCompleteAnalytics(apiId, token);
        setIsLoading(false);
        return result;
      } catch (err) {
        setError(err);
        setIsLoading(false);
        throw err;
      }
    },
    [getAccessTokenSilently]
  );

  /**
   * Get time series data for a specific API
   */
  const getApiTimeSeriesData = useCallback(
    async (apiId, period = 'day', startDate, endDate) => {
      setIsLoading(true);
      setError(null);
      try {
        const token = await getAccessTokenSilently();
        const result = await analyticsService.getApiTimeSeriesData(
          apiId,
          token,
          period,
          startDate,
          endDate
        );
        setIsLoading(false);
        return result;
      } catch (err) {
        setError(err);
        setIsLoading(false);
        throw err;
      }
    },
    [getAccessTokenSilently]
  );

  /**
   * Get analytics for APIs purchased by the current user
   */
  const getPurchasedApiAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getAccessTokenSilently();
      const result = await analyticsService.getPurchasedApiAnalytics(token);
      setIsLoading(false);
      return result;
    } catch (err) {
      setError(err);
      setIsLoading(false);
      throw err;
    }
  }, [getAccessTokenSilently]);

  return {
    getMyApiAnalytics,
    getApiCompleteAnalytics,
    getApiTimeSeriesData,
    getPurchasedApiAnalytics,
    isLoading,
    error,
  };
};
