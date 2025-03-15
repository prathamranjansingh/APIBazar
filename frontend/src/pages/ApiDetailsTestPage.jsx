import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { toast } from 'sonner';
import ApiTestingConsole from '../components/api-testing/ApiTestingConsole';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import api from '../lib/api-test';

function ApiDetailsTestPage() {
  const { apiId } = useParams();
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const [apiDetails, setApiDetails] = useState(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch API details and check if user has purchased it
  useEffect(() => {
    const fetchApiDetails = async () => {
      setIsLoading(true);
      try {
        // Get API details
        const response = await api.get(`/api/${apiId}`);
        setApiDetails(response.data);
        // If user is authenticated, check if they've purchased this API
        if (isAuthenticated) {
          try {
            const purchaseResponse = await api.get(`/user/purchased-apis`);
            const hasPurchased = purchaseResponse.data.some((api) => api.id === apiId);
            setIsPurchased(hasPurchased);
          } catch (error) {
            console.error('Error checking purchase status:', error);
            // Default to not purchased if error
            setIsPurchased(false);
          }
        } else {
          setIsPurchased(false);
        }
        // Set the first endpoint as selected by default
        if (response.data.endpoints && response.data.endpoints.length > 0) {
          setSelectedEndpoint(response.data.endpoints[0]);
        }
      } catch (error) {
        console.error('Error fetching API details:', error);
        toast.error('Failed to load API details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchApiDetails();
  }, [apiId, isAuthenticated]);

  // Handle API purchase
  const handlePurchase = async () => {
    if (!isAuthenticated) {
      loginWithRedirect({
        appState: { returnTo: window.location.pathname },
      });
      return;
    }
    try {
      await api.post(`/api/${apiId}/purchase`);
      setIsPurchased(true);
      toast.success('API purchased successfully!');
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to purchase API');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
          <div className="md:col-span-3">
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!apiDetails) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold text-red-500">API not found</h1>
        <p className="text-gray-600 mt-2">
          The API you're looking for doesn't exist or you don't have access to it.
        </p>
        <Button className="mt-4" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{apiDetails.name}</h1>
          <div className="flex items-center mt-2 space-x-2">
            <Badge variant={apiDetails.pricingModel === 'FREE' ? 'secondary' : 'default'}>
              {apiDetails.pricingModel === 'FREE' ? 'Free' : `$${apiDetails.price}`}
            </Badge>
            {apiDetails.category && (
              <Badge variant="outline">{apiDetails.category}</Badge>
            )}
          </div>
        </div>
        {!isPurchased && apiDetails.pricingModel === 'PAID' && (
          <Button className="mt-4 md:mt-0" onClick={handlePurchase}>
            Purchase API
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar with endpoints list */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Endpoints</CardTitle>
              <CardDescription>Select an endpoint to test</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {apiDetails.endpoints.map((endpoint) => (
                  <li
                    key={endpoint.id}
                    className={`px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors ${
                      selectedEndpoint?.id === endpoint.id
                        ? 'bg-gray-100 border-l-4 border-primary'
                        : ''
                    }`}
                    onClick={() => setSelectedEndpoint(endpoint)}
                  >
                    <div className="flex items-center">
                      <Badge
                        variant="outline"
                        className={
                          endpoint.method === 'GET'
                            ? 'text-green-600 border-green-600'
                            : endpoint.method === 'POST'
                            ? 'text-blue-600 border-blue-600'
                            : endpoint.method === 'PUT'
                            ? 'text-amber-600 border-amber-600'
                            : endpoint.method === 'DELETE'
                            ? 'text-red-600 border-red-600'
                            : ''
                        }
                      >
                        {endpoint.method}
                      </Badge>
                      <span className="ml-2 text-sm font-medium">{endpoint.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {endpoint.path}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        {/* Main content */}
        <div className="md:col-span-3">
          <Tabs defaultValue="test">
            <TabsList className="mb-4">
              <TabsTrigger value="test">Test API</TabsTrigger>
              <TabsTrigger value="docs">Documentation</TabsTrigger>
              <TabsTrigger value="sdks">SDKs</TabsTrigger>
            </TabsList>
            <TabsContent value="test">
              <ApiTestingConsole
                api={apiDetails}
                endpoint={selectedEndpoint}
                isPurchased={isPurchased}
              />
            </TabsContent>
            <TabsContent value="docs">
              <Card>
                <CardHeader>
                  <CardTitle>API Documentation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: apiDetails.documentation || 'No documentation available.',
                      }}
                    />
                  </div>
                  {selectedEndpoint && (
                    <div className="mt-8">
                      <h3 className="text-xl font-semibold mb-4">{selectedEndpoint.name}</h3>
                      <div className="bg-gray-50 p-4 rounded-md mb-4">
                        <code className="text-sm">
                          <span
                            className={
                              selectedEndpoint.method === 'GET'
                                ? 'text-green-600'
                                : selectedEndpoint.method === 'POST'
                                ? 'text-blue-600'
                                : selectedEndpoint.method === 'PUT'
                                ? 'text-amber-600'
                                : selectedEndpoint.method === 'DELETE'
                                ? 'text-red-600'
                                : ''
                            }
                          >
                            {selectedEndpoint.method}
                          </span>
                          <span className="text-gray-800">
                            {' '}
                            {apiDetails.baseUrl}
                            {selectedEndpoint.path}
                          </span>
                        </code>
                      </div>
                      <p className="text-gray-700 mb-4">
                        {selectedEndpoint.description || 'No description available.'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="sdks">
              {isPurchased ? (
                <Card>
                  <CardHeader>
                    <CardTitle>SDK Code Examples</CardTitle>
                    <CardDescription>
                      Use these code snippets in your applications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="javascript">
                      <TabsList>
                        <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                        <TabsTrigger value="python">Python</TabsTrigger>
                        <TabsTrigger value="curl">cURL</TabsTrigger>
                      </TabsList>
                      <TabsContent value="javascript">
                        <SDKCodeExample apiId={apiId} language="javascript" />
                      </TabsContent>
                      <TabsContent value="python">
                        <SDKCodeExample apiId={apiId} language="python" />
                      </TabsContent>
                      <TabsContent value="curl">
                        <SDKCodeExample apiId={apiId} language="curl" />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>SDK Code Examples</CardTitle>
                    <CardDescription>
                      Purchase this API to get SDK code examples.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-gray-500 mb-4">
                      Access to SDK code examples is available after purchasing this API.
                    </p>
                    <Button onClick={handlePurchase}>Purchase API</Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// SDK Code Example Component
function SDKCodeExample({ apiId, language }) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCode = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/api-proxy/${apiId}/sdk/${language}`);
        setCode(response.data.code);
      } catch (error) {
        console.error(`Error fetching ${language} code:`, error);
        setCode(`// Error loading ${language} code example`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCode();
  }, [apiId, language]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-48 bg-gray-200 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-auto max-h-96 text-sm">
        <code>{code}</code>
      </pre>
      <Button
        variant="outline"
        size="sm"
        className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-700"
        onClick={() => {
          navigator.clipboard.writeText(code);
          toast.success('Code copied to clipboard');
        }}
      >
        Copy
      </Button>
    </div>
  );
}

export default ApiDetailsTestPage;