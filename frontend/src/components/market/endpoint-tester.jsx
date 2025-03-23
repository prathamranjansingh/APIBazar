import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Code, Copy, Send } from 'lucide-react';
import MarketplaceService from '@/lib/marketplace-service';

const EndpointTester = ({ api, endpoint }) => {
  const [params, setParams] = useState({});
  const [headers, setHeaders] = useState({});
  const [body, setBody] = useState('');
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('body');

  const handleParamChange = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleHeaderChange = (key, value) => {
    setHeaders((prev) => ({ ...prev, [key]: value }));
  };

  const handleBodyChange = (e) => {
    setBody(e.target.value);
  };

  const handleTestEndpoint = async () => {
    if (!endpoint) return;
    try {
      setIsLoading(true);
      let parsedBody = null;
      if (body) {
        try {
          parsedBody = JSON.parse(body);
        } catch (e) {
          toast.error('Invalid JSON in request body');
          setIsLoading(false);
          return;
        }
      }
      const testData = { params, headers, body: parsedBody };
      const result = await MarketplaceService.testEndpoint(api.id, endpoint.id, testData);
      setResponse(result);
      if (result.statusCode >= 200 && result.statusCode < 300) {
        toast.success(`Success (${result.statusCode})`);
      } else {
        toast.error(`Error (${result.statusCode})`);
      }
    } catch (error) {
      setResponse({
        status: 'error',
        statusCode: error.response?.status || 500,
        data: error.response?.data || { error: 'An error occurred while testing the endpoint' },
      });
      toast.error('Failed to test endpoint');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResponse = () => {
    if (!response) return;
    navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    toast.success('Response copied to clipboard');
  };

  const loadExampleBody = () => {
    if (endpoint?.requestBody) {
      setBody(JSON.stringify(endpoint.requestBody, null, 2));
      toast.success('Example body loaded');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Badge
              className="mr-2 uppercase font-mono text-xs"
              variant={
                endpoint.method === 'GET'
                  ? 'secondary'
                  : endpoint.method === 'POST'
                  ? 'default'
                  : endpoint.method === 'PUT'
                  ? 'outline'
                  : endpoint.method === 'DELETE'
                  ? 'destructive'
                  : 'outline'
              }
            >
              {endpoint.method}
            </Badge>
            <CardTitle>{endpoint.name}</CardTitle>
          </div>
        </div>
        <CardDescription className="font-mono flex items-center">
        <span className="truncate">
          {api.baseUrl}
          {endpoint.path}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-1"
            onClick={() => {
              navigator.clipboard.writeText(`${api.baseUrl}${endpoint.path}`);
              toast.success('URL copied to clipboard');
            }}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-medium mb-3">Request</h3>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="params">Query Params</TabsTrigger>
                <TabsTrigger value="headers">Headers</TabsTrigger>
                {['POST', 'PUT', 'PATCH'].includes(endpoint.method) && (
                  <TabsTrigger value="body">Body</TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="params" className="pt-4">
                {endpoint.params && Object.keys(endpoint.params).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(endpoint.params).map(([key, param]) => (
                      <div key={key} className="grid grid-cols-12 gap-2">
                        <div className="col-span-4">
                          <Label className="font-mono text-xs">
                            {key}
                            {param.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                        </div>
                        <div className="col-span-8">
                          <Input
                            placeholder={param.description}
                            value={params[key] || ''}
                            onChange={(e) => handleParamChange(key, e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No query parameters for this endpoint</p>
                )}
              </TabsContent>
              <TabsContent value="headers" className="pt-4">
                {endpoint.headers && Object.keys(endpoint.headers).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(endpoint.headers).map(([key, header]) => (
                      <div key={key} className="grid grid-cols-12 gap-2">
                        <div className="col-span-4">
                          <Label className="font-mono text-xs">
                            {key}
                            {header.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                        </div>
                        <div className="col-span-8">
                          <Input
                            placeholder={header.description}
                            value={headers[key] || ''}
                            onChange={(e) => handleHeaderChange(key, e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No headers required for this endpoint</p>
                )}
              </TabsContent>
              {['POST', 'PUT', 'PATCH'].includes(endpoint.method) && (
                <TabsContent value="body" className="pt-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Request Body (JSON)</Label>
                      {endpoint.requestBody && (
                        <Button variant="outline" size="sm" onClick={loadExampleBody}>
                          Load Example
                        </Button>
                      )}
                    </div>
                    <Textarea
                      placeholder="Enter request body as JSON"
                      className="font-mono text-sm min-h-[200px]"
                      value={body}
                      onChange={handleBodyChange}
                    />
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
          <Button onClick={handleTestEndpoint} disabled={isLoading} className="w-full">
            {isLoading ? (
              'Testing...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Test Endpoint
              </>
            )}
          </Button>
          {response && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-base font-medium">Response</h3>
                <Badge
                  variant={
                    response.statusCode >= 200 && response.statusCode < 300 ? 'success' : 'destructive'
                  }
                >
                  Status: {response.statusCode}
                </Badge>
              </div>
              <Card>
                <CardHeader className="pb-0 pt-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm">Response Body</CardTitle>
                    <Button variant="ghost" size="sm" onClick={handleCopyResponse}>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] rounded-md border p-4">
                    <pre className="font-mono text-sm">
                      {JSON.stringify(response.data, null, 2)}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EndpointTester;