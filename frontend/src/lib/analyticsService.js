const getBaseUrl = () => {
    return import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';
  };
  
  const getHeaders = (token) => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  });
  
  const handleResponse = async (response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  };
  
  export const analyticsService = {
    /**
     * Fetch analytics for all APIs owned by the current user
     * @param {string} token - Authentication token
     * @returns {Promise<Object>} - Analytics data
     */
    async getMyApiAnalytics(token) {
      try {
        const response = await fetch(`${getBaseUrl()}/analytics/my`, {
          method: 'GET',
          headers: getHeaders(token),
        });
        return handleResponse(response);
      } catch (error) {
        console.error('Failed to fetch API analytics:', error);
        throw new Error('Failed to fetch API analytics');
      }
    },
  
    /**
     * Fetch complete analytics for a specific API
     * @param {string} apiId - API ID
     * @param {string} token - Authentication token
     * @returns {Promise<Object>} - Complete analytics data
     */
    async getApiCompleteAnalytics(apiId, token) {
      try {
        const response = await fetch(`${getBaseUrl()}/analytics/api/${apiId}/complete`, {
          method: 'GET',
          headers: getHeaders(token),
        });
        return handleResponse(response);
      } catch (error) {
        console.error(`Failed to fetch complete analytics for API ${apiId}:`, error);
        throw new Error(`Failed to fetch analytics for API ${apiId}`);
      }
    },
  
    /**
     * Fetch time series data for a specific API
     * @param {string} apiId - API ID
     * @param {string} token - Authentication token
     * @param {Object} params - Time series parameters
     * @returns {Promise<Object>} - Time series data
     */
    async getApiTimeSeriesData(apiId, token, params = { period: 'day' }) {
      try {
        let url = `${getBaseUrl()}/analytics/api/${apiId}/timeseries?period=${params.period}`;
        if (params.startDate) url += `&startDate=${params.startDate}`;
        if (params.endDate) url += `&endDate=${params.endDate}`;
  
        const response = await fetch(url, {
          method: 'GET',
          headers: getHeaders(token),
        });
        return handleResponse(response);
      } catch (error) {
        console.error(`Failed to fetch time series data for API ${apiId}:`, error);
        throw new Error(`Failed to fetch time series data for API ${apiId}`);
      }
    },
  
    /**
     * Fetch analytics for APIs purchased by the current user
     * @param {string} token - Authentication token
     * @returns {Promise<Object>} - Purchased APIs analytics data
     */
    async getPurchasedApiAnalytics(token) {
      try {
        const response = await fetch(`${getBaseUrl()}/analytics/purchased`, {
          method: 'GET',
          headers: getHeaders(token),
        });
        return handleResponse(response);
      } catch (error) {
        console.error('Failed to fetch purchased API analytics:', error);
        throw new Error('Failed to fetch purchased API analytics');
      }
    },
  };
  