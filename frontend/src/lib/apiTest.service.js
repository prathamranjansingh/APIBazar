import api from './api-test'

const ApiTestService = {
  /**
   * Test a public API without purchasing
   */
  testPublicApi: async (apiId, endpointId, testRequest) => {
    const url = endpointId
      ? `/public-api-test/${apiId}/endpoints/${endpointId}`
      : `/public-api-test/${apiId}`;
    const response = await api.post(url, testRequest);
    return response.data;
  },

  /**
   * Test a purchased API (authenticated)
   */
  testPurchasedApi: async (apiId, endpointId, testRequest) => {
    const url = endpointId
      ? `/api-test/${apiId}/endpoints/${endpointId}/test`
      : `/api-test/${apiId}/test`;
    const response = await api.post(url, testRequest);
    return response.data;
  },

  /**
   * Get sample request for an endpoint (public)
   */
  getSampleRequest: async (apiId, endpointId) => {
    const response = await api.get(`/api-test/${apiId}/endpoints/${endpointId}/sample`);
    return response.data;
  },

  /**
   * Generate cURL command for a request
   */
  generateCurl: async (request) => {
    const response = await api.post('/api-test/generate-curl', request);
    return response.data.curl;
  },
};

export default ApiTestService;