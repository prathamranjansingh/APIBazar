import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { toast } from 'sonner';
import ApiTestService from '../../services/apiTest.service';
import MethodSelect from './MethodSelect';
import HeadersEditor from './HeadersEditor';
import QueryParamsEditor from './QueryParamsEditor';
import BodyEditor from './BodyEditor';
import ResponseViewer from './ResponseViewer';
import AuthSection from './AuthSection';
import CodeSnippet from './CodeSnippet';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  PlayIcon,
  CodeIcon,
  KeyIcon,
  ShoppingCartIcon,
  AlertTriangleIcon,
} from 'lucide-react';

function ApiTestingConsole({ api, endpoint, isPurchased }) {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const [activeTab, setActiveTab] = useState('request');
  const [testRequest, setTestRequest] = useState({
    method: endpoint?.method || 'GET',
    url: `${api?.baseUrl || ''}${endpoint?.path || ''}`,
    headers: {},
    queryParams: {},
    body: null,
    auth: { type: 'none' },
  });
  const [testResponse, setTestResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [curlCommand, setCurlCommand] = useState('');

  // Update the request when the API or endpoint changes
  useEffect(() => {
    if (api && endpoint) {
      setTestRequest((prev) => ({
        ...prev,
        method: endpoint.method,
        url: `${api.baseUrl || ''}${endpoint.path || ''}`,
      }));
      // Reset response when changing endpoints
      setTestResponse(null);
      setCurlCommand('');
    }
  }, [api, endpoint]);

  // Load sample request for the endpoint
  const loadSampleRequest = async () => {
    if (!api?.id || !endpoint?.id) return;
    setIsLoading(true);
    try {
      const result = await ApiTestService.getSampleRequest(api.id, endpoint.id);
      setTestRequest(result.sampleRequest);
      toast.success('Sample request loaded');
    } catch (error) {
      console.error('Error loading sample:', error);
      toast.error('Failed to load sample request');
    } finally {
      setIsLoading(false);
    }
  };

  // Execute the test request
  const executeTest = async () => {
    if (!api?.id) {
      toast.error('Please select an API to test');
      return;
    }
    setIsLoading(true);
    try {
      let result;
      // If user is logged in and has purchased the API, use the authenticated endpoint
      if (isAuthenticated && isPurchased) {
        result = await ApiTestService.testPurchasedApi(
          api.id,
          endpoint?.id || null,
          testRequest
        );
      } else {
        // Otherwise use the public testing endpoint with limitations
        result = await ApiTestService.testPublicApi(
          api.id,
          endpoint?.id || null,
          testRequest
        );
      }
      setTestResponse(result);
      setActiveTab('response');
      // Show appropriate message based on result
      if (result.success) {
        toast.success(`Test successful (${result.response?.status})`);
      } else if (result.error) {
        toast.error(`API returned an error: ${result.error.message}`);
      }
    } catch (error) {
      console.error('Test execution error:', error);
      toast.error('Failed to execute test');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate curl command
  const generateCurl = async () => {
    setIsLoading(true);
    try {
      const curl = await ApiTestService.generateCurl(testRequest);
      setCurlCommand(curl);
      setActiveTab('code');
      toast.success('cURL command generated');
    } catch (error) {
      console.error('Error generating curl command:', error);
      toast.error('Failed to generate curl command');
    } finally {
      setIsLoading(false);
    }
  };

  // Update request fields
  const updateRequest = (updatedFields) => {
    setTestRequest((prev) => ({
      ...prev,
      ...updatedFields,
    }));
  };

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">API Testing Console</CardTitle>
            <CardDescription>Test the API endpoints before purchasing</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {!isPurchased && isAuthenticated && (
              <Button variant="outline" className="flex items-center gap-2">
                <ShoppingCartIcon size={16} />
                Purchase API
              </Button>
            )}
            {!isAuthenticated && (
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => loginWithRedirect()}
              >
                <KeyIcon size={16} />
                Login to Purchase
              </Button>
            )}
          </div>
        </div>
        {!isPurchased && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-4 flex items-start gap-2">
            <AlertTriangleIcon size={18} className="text-amber-500 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800">
                You're using the public testing mode. Some features and rate limits may be restricted.
                {isAuthenticated
                  ? ' Purchase this API for full access.'
                  : ' Login and purchase this API for full access.'}
              </p>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="request">Request</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>
          <TabsContent value="request">
            <div className="space-y-4">
              {/* Method and URL */}
              <div className="flex gap-2">
                <MethodSelect
                  value={testRequest.method}
                  onChange={(method) => updateRequest({ method })}
                />
                <div className="flex-1">
                  <Input
                    value={testRequest.url}
                    onChange={(e) => updateRequest({ url: e.target.value })}
                    placeholder="API URL"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={loadSampleRequest}
                  disabled={!endpoint?.id}
                >
                  Load Sample
                </Button>
              </div>
              {/* Headers, Params, Body, Auth */}
              <Tabs defaultValue="params">
                <TabsList>
                  <TabsTrigger value="params">Query Params</TabsTrigger>
                  <TabsTrigger value="headers">Headers</TabsTrigger>
                  <TabsTrigger value="body">Body</TabsTrigger>
                  <TabsTrigger value="auth">Auth</TabsTrigger>
                </TabsList>
                <TabsContent value="params">
                  <QueryParamsEditor
                    params={testRequest.queryParams}
                    onChange={(queryParams) => updateRequest({ queryParams })}
                  />
                </TabsContent>
                <TabsContent value="headers">
                  <HeadersEditor
                    headers={testRequest.headers}
                    onChange={(headers) => updateRequest({ headers })}
                  />
                </TabsContent>
                <TabsContent value="body">
                  <BodyEditor
                    body={testRequest.body}
                    onChange={(body) => updateRequest({ body })}
                    disabled={['GET', 'HEAD'].includes(testRequest.method)}
                  />
                </TabsContent>
                <TabsContent value="auth">
                  <AuthSection
                    auth={testRequest.auth}
                    onChange={(auth) => updateRequest({ auth })}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
          <TabsContent value="response">
            <ResponseViewer response={testResponse} />
          </TabsContent>
          <TabsContent value="code">
            <CodeSnippet code={curlCommand} language="bash" />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4">
        <div className="flex items-center gap-2">
          {isPurchased && <Badge variant="success">Full Access</Badge>}
          {!isPurchased && <Badge variant="outline">Test Mode</Badge>}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={generateCurl}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <CodeIcon size={16} />
            Generate Code
          </Button>
          <Button
            onClick={executeTest}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <PlayIcon size={16} />
            Test API
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default ApiTestingConsole;