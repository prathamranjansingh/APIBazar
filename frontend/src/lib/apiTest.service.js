import api from './api-test';

const ApiTestService = {
  /**
   * Test a public API without purchasing
   */
  testPublicApi: async (apiId, endpointId, testRequest) => {
    const url = endpointId
      ? `/api-proxy/public-test/${apiId}/${endpointId}`
      : `/api-proxy/public-test/${apiId}`;
    const response = await api.post(url, testRequest);
    return response.data;
  },

  /**
   * Test a purchased API (authenticated)
   */
  testPurchasedApi: async (apiId, endpointId, testRequest) => {
    const url = endpointId
      ? `/api-proxy/${apiId}/endpoints/${endpointId}/test`
      : `/api-proxy/${apiId}/test`;
    const response = await api.post(url, testRequest);
    return response.data;
  },

  /**
   * Get sample request for an endpoint
   */
  getSampleRequest: async (apiId, endpointId) => {
    const response = await api.get(`/api-proxy/${apiId}/endpoints/${endpointId}/sample`);
    return response.data;
  },

  /**
   * Generate cURL command for a request
   */
  generateCurl: async (request) => {
    const response = await api.post('/api-proxy/curl', request);
    return response.data.curl;
  },

  /**
   * Generate SDK code for an API
   */
  generateSdkCode: async (apiId, language) => {
    // Try authenticated SDK generation first
    try {
      const response = await api.get(`/api-proxy/${apiId}/sdk/${language}`);
      return {
        code: response.data.code,
        language: response.data.language,
        fileName: response.data.fileName,
        publicAccess: false,
      };
    } catch (error) {
      // If authentication fails, try public SDK generation
      if (error.response?.status === 401 || error.response?.status === 403) {
        const response = await api.get(`/api-proxy/public/${apiId}/sdk/${language}`);
        return {
          code: response.data.code,
          language: response.data.language,
          fileName: response.data.fileName,
          publicAccess: true,
          notice: response.data.notice,
        };
      }
      throw error; // Re-throw if other error
    }
  },
};

export default ApiTestService;