import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useApiService } from "@/lib/purchase-page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  AlertCircle,
  Copy,
  Key,
  MoreVertical,
  RefreshCw,
  ShieldAlert,
  Trash2,
  Play,
  Code,
  BarChart3,
  Search,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// EmptyState component
const EmptyState = ({ title, description, action, icon: Icon }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] border border-dashed rounded-lg p-10">
    <Icon className="h-16 w-16 text-muted-foreground mb-4" />
    <h2 className="text-2xl font-bold mb-2">{title}</h2>
    <p className="text-muted-foreground mb-6 text-center max-w-md">{description}</p>
    {action}
  </div>
);

// ApiKeyModal component
const ApiKeyModal = ({ isOpen, onClose, api, onKeyCreated }) => {
  const apiService = useApiService();
  const [keyName, setKeyName] = useState(`${api?.name || "API"} Key`);
  const [rateLimit, setRateLimit] = useState(api?.rateLimit || 100);
  const [expiryOption, setExpiryOption] = useState("never");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState(null);

  const generateExpiryDate = () => {
    if (expiryOption === "never") return null;
    const now = new Date();
    if (expiryOption === "1day") {
      now.setDate(now.getDate() + 1);
    } else if (expiryOption === "7days") {
      now.setDate(now.getDate() + 7);
    } else if (expiryOption === "30days") {
      now.setDate(now.getDate() + 30);
    } else if (expiryOption === "90days") {
      now.setDate(now.getDate() + 90);
    }
    return now.toISOString();
  };

  const handleCreateKey = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.createApiKey(api.id, {
        name: keyName,
        rateLimit: parseInt(rateLimit),
        expiresAt: generateExpiryDate(),
      });
      setGeneratedKey(data);
      if (onKeyCreated) {
        onKeyCreated(data);
      }
    } catch (error) {
      console.error("Error creating API key:", error);
      toast.error("Failed to create API key: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (generatedKey?.key) {
      navigator.clipboard.writeText(generatedKey.key);
      toast.success("API Key copied to clipboard");
    }
  };

  const handleClose = () => {
    setGeneratedKey(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-1">
            {generatedKey ? "API Key Generated" : "Create New API Key"}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {generatedKey
              ? "Your API key has been generated. Please copy it now as you won't be able to see it again."
              : `Create a new API key for ${api?.name || "the API"}`
            }
          </p>
          {generatedKey ? (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-md flex items-center gap-2">
                <Key className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                <code className="text-xs md:text-sm flex-1 overflow-hidden text-ellipsis">
                  {generatedKey.key}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyKey}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 rounded-md p-3">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <p className="text-xs">
                  This API key will only be displayed once and cannot be retrieved later.
                  Please store it securely.
                </p>
              </div>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span>{generatedKey.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate Limit:</span>
                  <span>{generatedKey.rateLimit} requests/hour</span>
                </div>
                {generatedKey.expiresAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires:</span>
                    <span>{new Date(generatedKey.expiresAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="key-name" className="block text-sm font-medium">Key Name</label>
                <input
                  id="key-name"
                  className="w-full px-3 py-2 border rounded-md"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="Enter a name for your API key"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="rate-limit" className="block text-sm font-medium">
                  Rate Limit (requests per hour)
                </label>
                <input
                  id="rate-limit"
                  type="number"
                  className="w-full px-3 py-2 border rounded-md"
                  value={rateLimit}
                  onChange={(e) => setRateLimit(e.target.value)}
                  min="1"
                  max="10000"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="expiry" className="block text-sm font-medium">Expiration</label>
                <select
                  id="expiry"
                  className="w-full px-3 py-2 border rounded-md"
                  value={expiryOption}
                  onChange={(e) => setExpiryOption(e.target.value)}
                >
                  <option value="never">No expiration</option>
                  <option value="1day">1 day</option>
                  <option value="7days">7 days</option>
                  <option value="30days">30 days</option>
                  <option value="90days">90 days</option>
                </select>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2 mt-6">
            {generatedKey ? (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
                <Button onClick={handleCopyKey}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy API Key
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleCreateKey} disabled={isLoading}>
                  {isLoading ? "Creating..." : "Generate API Key"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// EndpointExplorer component
const EndpointExplorer = ({ api, apiKeys }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState("");
  const [selectedApiKey, setSelectedApiKey] = useState("");
  const [requestHeaders, setRequestHeaders] = useState({});
  const [requestBody, setRequestBody] = useState("");
  const [queryParams, setQueryParams] = useState({});
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("request");

  useEffect(() => {
    if (api?.endpoints?.length > 0) {
      setSelectedEndpoint(api.endpoints[0].id);
    }
    if (apiKeys?.length > 0) {
      setSelectedApiKey(apiKeys[0].id);
    }
  }, [api, apiKeys]);

  const handleEndpointChange = (endpointId) => {
    setSelectedEndpoint(endpointId);
    setRequestBody("");
    setQueryParams({});
    setResponse(null);
  };

  const getSelectedEndpoint = () => {
    return api?.endpoints?.find(endpoint => endpoint.id === selectedEndpoint) || null;
  };

  const getSelectedApiKey = () => {
    return apiKeys?.find(key => key.id === selectedApiKey) || null;
  };

  const handleTestRequest = async () => {
    const endpoint = getSelectedEndpoint();
    const apiKey = getSelectedApiKey();
    if (!endpoint) {
      toast.error("No endpoint selected. Please select an endpoint to test.");
      return;
    }
    if (!apiKey) {
      toast.error("No API key selected. Please select an API key to authenticate your request.");
      return;
    }
    setIsLoading(true);
    try {
      let url = `${api.baseUrl}${endpoint.path}`;
      const queryString = new URLSearchParams(queryParams).toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      const headers = {
        "Content-Type": "application/json",
        "X-API-Key": apiKey.key,
        ...requestHeaders,
      };
      const startTime = Date.now();
      const response = await fetch(url, {
        method: endpoint.method,
        headers,
        body: ["POST", "PUT", "PATCH"].includes(endpoint.method) && requestBody
          ? requestBody
          : undefined,
      });
      const endTime = Date.now();
      const responseData = await response.json();
      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()]),
        data: responseData,
        time: new Date().toISOString(),
        duration: endTime - startTime,
      });
      setActiveTab("response");
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Request error:", error);
      toast.error("Request failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("Code example copied to clipboard");
  };

  const generateCodeExample = (language) => {
    const endpoint = getSelectedEndpoint();
    if (!endpoint) return "";
    const apiKey = getSelectedApiKey()?.key || "YOUR_API_KEY";
    const url = `${api.baseUrl}${endpoint.path}`;
    if (language === "curl") {
      let curl = `curl -X ${endpoint.method} "${url}"`;
      curl += ` -H "X-API-Key: ${apiKey}"`;
      curl += ` -H "Content-Type: application/json"`;
      if (["POST", "PUT", "PATCH"].includes(endpoint.method) && requestBody) {
        curl += ` -d '${requestBody}'`;
      }
      return curl;
    }
    if (language === "javascript") {
      let code = `// Using fetch API\n`;
      code += `const options = {\n`;
      code += `  method: "${endpoint.method}",\n`;
      code += `  headers: {\n`;
      code += `    "X-API-Key": "${apiKey}",\n`;
      code += `    "Content-Type": "application/json"\n`;
      code += `  }`;
      if (["POST", "PUT", "PATCH"].includes(endpoint.method) && requestBody) {
        code += `,\n  body: JSON.stringify(${requestBody})`;
      }
      code += `\n};\n\n`;
      code += `fetch("${url}", options)\n`;
      code += `  .then(response => response.json())\n`;
      code += `  .then(data => console.log(data))\n`;
      code += `  .catch(error => console.error("Error:", error));`;
      return code;
    }
    if (language === "python") {
      let code = `import requests\n\n`;
      code += `url = "${url}"\n`;
      code += `headers = {\n`;
      code += `    "X-API-Key": "${apiKey}",\n`;
      code += `    "Content-Type": "application/json"\n`;
      code += `}\n`;
      if (["POST", "PUT", "PATCH"].includes(endpoint.method) && requestBody) {
        code += `payload = ${requestBody}\n\n`;
        code += `response = requests.${endpoint.method.toLowerCase()}(url, json=payload, headers=headers)\n`;
      } else {
        code += `\nresponse = requests.${endpoint.method.toLowerCase()}(url, headers=headers)\n`;
      }
      code += `print(response.json())`;
      return code;
    }
    return "";
  };

  if (!api || !api.endpoints || api.endpoints.length === 0) {
    return (
      <div className="text-center p-8 border border-dashed rounded-md">
        <Code className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <h3 className="font-medium mb-1">No Endpoints Available</h3>
        <p className="text-sm text-muted-foreground">
          This API doesn't have any documented endpoints yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="w-full md:w-1/2">
          <label className="block text-sm font-medium mb-1">Endpoint</label>
          <select
            className="w-full p-2 border rounded-md"
            value={selectedEndpoint}
            onChange={(e) => handleEndpointChange(e.target.value)}
          >
            {api.endpoints.map((endpoint) => (
              <option key={endpoint.id} value={endpoint.id}>
                {endpoint.method} {endpoint.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-1/2">
          <label className="block text-sm font-medium mb-1">API Key</label>
          <select
            className="w-full p-2 border rounded-md"
            value={selectedApiKey}
            onChange={(e) => setSelectedApiKey(e.target.value)}
          >
            {apiKeys && apiKeys.length > 0 ? apiKeys.map((key) => (
              <option key={key.id} value={key.id}>
                {key.name} {!key.isActive && "(Inactive)"}
              </option>
            )) : (
              <option value="" disabled>
                No API keys available
              </option>
            )}
          </select>
        </div>
      </div>
      {getSelectedEndpoint() && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 uppercase">
                      {getSelectedEndpoint().method}
                    </Badge>
                    {getSelectedEndpoint().name}
                  </div>
                </CardTitle>
                <CardDescription>
                  {getSelectedEndpoint().description}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={handleTestRequest}
                disabled={isLoading || !getSelectedApiKey()}
              >
                <Play className="h-3 w-3" />
                Test
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="request">Request</TabsTrigger>
                <TabsTrigger value="response">Response</TabsTrigger>
              </TabsList>
              <TabsContent value="request" className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Query Parameters</h3>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex gap-2">
                        <input
                          placeholder="Key"
                          className="flex-1 p-2 border rounded-md"
                          onChange={(e) => {
                            const newParams = { ...queryParams };
                            if (e.target.value) {
                              newParams[e.target.value] = queryParams[""] || "";
                              delete newParams[""];
                            }
                            setQueryParams(newParams);
                          }}
                        />
                        <input
                          placeholder="Value"
                          className="flex-1 p-2 border rounded-md"
                          onChange={(e) => {
                            const newParams = { ...queryParams };
                            const key = Object.keys(newParams)[0] || "";
                            newParams[key] = e.target.value;
                            setQueryParams(newParams);
                          }}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setQueryParams({})}
                        >
                          -
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => {
                          setQueryParams({
                            ...queryParams,
                            "": ""
                          });
                        }}
                      >
                        Add Parameter
                      </Button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Headers</h3>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          value="X-API-Key"
                          disabled
                          className="flex-1 p-2 border rounded-md bg-muted"
                        />
                        <input
                          value={getSelectedApiKey()?.key || "No API Key selected"}
                          disabled
                          className="flex-1 p-2 border rounded-md bg-muted"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          value="Content-Type"
                          disabled
                          className="flex-1 p-2 border rounded-md bg-muted"
                        />
                        <input
                          value="application/json"
                          disabled
                          className="flex-1 p-2 border rounded-md bg-muted"
                        />
                      </div>
                    </div>
                  </div>
                  {["POST", "PUT", "PATCH"].includes(getSelectedEndpoint().method) && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Request Body</h3>
                      <textarea
                        placeholder="Enter JSON request body"
                        className="font-mono text-sm w-full p-3 border rounded-md"
                        rows={6}
                        value={requestBody}
                        onChange={(e) => setRequestBody(e.target.value)}
                      />
                      {getSelectedEndpoint().requestBody && (
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => setRequestBody(JSON.stringify(
                              getSelectedEndpoint().requestBody, null, 2
                            ))}
                          >
                            Use Example Schema
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Code Examples</h3>
                    <Tabs defaultValue="curl">
                      <TabsList>
                        <TabsTrigger value="curl">cURL</TabsTrigger>
                        <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                        <TabsTrigger value="python">Python</TabsTrigger>
                      </TabsList>
                      <TabsContent value="curl" className="pt-4">
                        <div className="relative">
                          <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                            <code>{generateCodeExample("curl")}</code>
                          </pre>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => handleCopyCode(generateCodeExample("curl"))}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TabsContent>
                      <TabsContent value="javascript" className="pt-4">
                        <div className="relative">
                          <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                            <code>{generateCodeExample("javascript")}</code>
                          </pre>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => handleCopyCode(generateCodeExample("javascript"))}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TabsContent>
                      <TabsContent value="python" className="pt-4">
                        <div className="relative">
                          <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                            <code>{generateCodeExample("python")}</code>
                          </pre>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => handleCopyCode(generateCodeExample("python"))}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="response" className="space-y-4 pt-4">
                {response ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={response.status >= 200 && response.status < 300 ? "default" : "destructive"}
                      >
                        {response.status} {response.statusText}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {new Date(response.time).toLocaleTimeString()}
                        ({response.duration}ms)
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Response Headers</h4>
                      <pre className="bg-muted p-2 rounded-md text-xs overflow-x-auto">
                        {JSON.stringify(response.headers, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Response Body</h4>
                      <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                        {JSON.stringify(response.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Code className="h-10 w-10 text-muted-foreground mb-2" />
                    <h3 className="font-medium">No Response Yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Test the endpoint to see the response here
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleTestRequest}
                      disabled={isLoading || !getSelectedApiKey()}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Send Request
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ApiAnalytics component
const ApiAnalytics = ({ apiId }) => {
  const apiService = useApiService();
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('30days');

  useEffect(() => {
    if (apiId) {
      fetchAnalytics();
    }
  }, [apiId, period]);

  const fetchAnalytics = async () => {
    if (!apiId) return;
    setIsLoading(true);
    try {
      const data = await apiService.getApiAnalytics(apiId, period);
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Could not retrieve usage data at this time.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-80" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8 border border-dashed rounded-md">
        <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
        <h3 className="font-medium">No Analytics Available</h3>
        <p className="text-sm text-muted-foreground">
          Usage data will appear here once your API receives traffic.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">API Usage Statistics</h3>
        <select
          className="p-2 border rounded-md"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="7days">Last 7 days</option>
          <option value="30days">Last 30 days</option>
          <option value="90days">Last 90 days</option>
        </select>
      </div>
      <div className="aspect-[3/1] min-h-[300px] bg-muted rounded-md p-4">
        <div className="h-full flex items-center justify-center">
          <p className="text-muted-foreground">Chart Visualization would be here</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {analytics.totalRequests || 0}
            </div>
            <p className="text-sm text-muted-foreground">Total Requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {analytics.successRate || 0}%
            </div>
            <p className="text-sm text-muted-foreground">Success Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {analytics.avgResponseTime || 0}ms
            </div>
            <p className="text-sm text-muted-foreground">Avg. Response Time</p>
          </CardContent>
        </Card>
      </div>
      <div>
        <h3 className="text-lg font-medium mb-3">Popular Endpoints</h3>
        <div className="border rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Endpoint</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Method</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Calls</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg. Time</th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {analytics.endpoints && analytics.endpoints.length > 0 ? (
                analytics.endpoints.map((endpoint, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{endpoint.path}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <Badge variant="outline" className="uppercase">
                        {endpoint.method}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {endpoint.totalCalls || 0}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {endpoint.avgResponseTime || 0}ms
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-4 py-4 text-center text-sm text-muted-foreground">
                    No endpoint data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Main Purchase Page Component
const PurchasePage = () => {
  const { isLoading: authLoading, isAuthenticated } = useAuth0();
  const apiService = useApiService();
  const [purchasedApis, setPurchasedApis] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeApiId, setActiveApiId] = useState(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [selectedApiForNewKey, setSelectedApiForNewKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPurchasedApis = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getPurchasedApis();
      setPurchasedApis(data);
      if (data.length > 0 && !activeApiId) {
        setActiveApiId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching purchased APIs:", error);
      toast.error("Error fetching your purchased APIs. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [apiService, activeApiId]);

  const fetchApiKeys = useCallback(async () => {
    try {
      const data = await apiService.getMyApiKeys();
      setApiKeys(data);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      toast.error("Error fetching API keys. Please try again later.");
    }
  }, [apiService]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchPurchasedApis();
      fetchApiKeys();
    }
  }, [authLoading, isAuthenticated, fetchPurchasedApis, fetchApiKeys]);

  const handleCopyKey = useCallback((key) => {
    navigator.clipboard.writeText(key);
    toast.success("API Key copied to clipboard");
  }, []);

  const handleRevokeKey = useCallback(async (keyId) => {
    try {
      await apiService.revokeApiKey(keyId);
      fetchApiKeys();
      toast.success("API key has been successfully revoked");
    } catch (error) {
      console.error("Error revoking API key:", error);
      toast.error("Failed to revoke API key. Please try again later.");
    }
  }, [apiService, fetchApiKeys]);

  const handleCreateNewKey = useCallback((api) => {
    setSelectedApiForNewKey(api);
    setIsApiKeyModalOpen(true);
  }, []);

  const handleKeyCreated = useCallback(() => {
    fetchApiKeys();
    setIsApiKeyModalOpen(false);
  }, [fetchApiKeys]);

  const getApiKeysForActiveApi = useMemo(() => {
    return apiKeys.filter(key => key.api.id === activeApiId);
  }, [apiKeys, activeApiId]);

  const getActiveApi = useMemo(() => {
    return purchasedApis.find(api => api.id === activeApiId) || null;
  }, [purchasedApis, activeApiId]);

  const filteredApis = useMemo(() => {
    if (!searchQuery.trim()) return purchasedApis;
    return purchasedApis.filter(api =>
      api.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      api.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      api.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [purchasedApis, searchQuery]);

  if (authLoading) {
    return (
      <div className="container py-10">
        <Skeleton className="w-full h-12 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-10">
        <EmptyState
          title="Authentication Required"
          description="Please sign in to view your purchased APIs."
          icon={AlertCircle}
          action={<Button>Sign In</Button>}
        />
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Your API Collection</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search APIs..."
              className="pl-8 p-2 border rounded-md w-full md:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={fetchPurchasedApis}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
        </div>
      ) : filteredApis.length === 0 ? (
        <EmptyState
          title="No APIs Found"
          description={
            searchQuery
              ? "No APIs match your search criteria. Try different keywords."
              : "You haven't purchased any APIs yet. Browse the marketplace to discover APIs that can help power your applications."
          }
          icon={ShieldAlert}
          action={<Button href="/marketplace">Browse APIs</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Your APIs</CardTitle>
                <CardDescription>APIs you've purchased or added</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-1 p-2">
                    {filteredApis.map((api) => (
                      <Button
                        key={api.id}
                        variant={activeApiId === api.id ? "secondary" : "ghost"}
                        className="w-full justify-start text-left h-auto py-3"
                        onClick={() => setActiveApiId(api.id)}
                      >
                        <div className="flex flex-col items-start">
                          <div className="font-medium">{api.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Badge
                              variant={api.pricingModel === "FREE" ? "outline" : "default"}
                              className="text-[10px]"
                            >
                              {api.pricingModel}
                            </Badge>
                            {api.owner.name}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-3">
            {getActiveApi && (
              <Tabs defaultValue="endpoints" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
                  <TabsTrigger value="keys">API Keys</TabsTrigger>
                  <TabsTrigger value="analytics">Usage & Analytics</TabsTrigger>
                </TabsList>
                <TabsContent value="endpoints">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{getActiveApi.name}</CardTitle>
                          <CardDescription>{getActiveApi.description}</CardDescription>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {getActiveApi.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <div className="text-sm font-medium mb-1">Base URL</div>
                        <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
                          <code className="text-sm overflow-x-auto flex-1">{getActiveApi.baseUrl}</code>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleCopyKey(getActiveApi.baseUrl || '')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <EndpointExplorer
                        api={getActiveApi}
                        apiKeys={getApiKeysForActiveApi}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="keys">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>API Keys</CardTitle>
                          <CardDescription>
                            Manage your API keys for {getActiveApi.name}
                          </CardDescription>
                        </div>
                        <Button
                          onClick={() => handleCreateNewKey(getActiveApi)}
                          className="flex items-center gap-2"
                        >
                          <Key className="h-4 w-4" /> New Key
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {getApiKeysForActiveApi.length === 0 ? (
                        <div className="text-center py-8 border border-dashed rounded-md">
                          <Key className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                          <h3 className="font-medium mb-1">No API Keys</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            You don't have any API keys for this service yet
                          </p>
                          <Button
                            onClick={() => handleCreateNewKey(getActiveApi)}
                            size="sm"
                          >
                            Generate API Key
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {getApiKeysForActiveApi.map((apiKey) => (
                            <Card key={apiKey.id} className="overflow-hidden">
                              <div className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      apiKey.isActive ? "bg-green-500" : "bg-red-500"
                                    }`}
                                  />
                                  <span className="font-medium">{apiKey.name}</span>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={() => handleCopyKey(apiKey.key)}
                                      className="cursor-pointer"
                                    >
                                      <Copy className="h-4 w-4 mr-2" />
                                      Copy key
                                    </DropdownMenuItem>
                                    {apiKey.isActive && (
                                      <DropdownMenuItem
                                        onClick={() => handleRevokeKey(apiKey.id)}
                                        className="text-red-500 cursor-pointer"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Revoke key
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <div className="px-4 pb-4">
                                <div className="bg-muted p-2 rounded-md flex items-center justify-between">
                                  <code className="text-xs md:text-sm truncate max-w-[60%] md:max-w-[80%]">
                                    {apiKey.key}
                                  </code>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleCopyKey(apiKey.key)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                  <div className="flex items-center">
                                    <Badge variant="outline" className="mr-1">
                                      Rate Limit: {apiKey.rateLimit}/hour
                                    </Badge>
                                  </div>
                                  <div>
                                    Created: {formatDistanceToNow(new Date(apiKey.createdAt))} ago
                                  </div>
                                  {apiKey.expiresAt && (
                                    <div>
                                      Expires: {formatDistanceToNow(new Date(apiKey.expiresAt))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="analytics">
                  <Card>
                    <CardHeader>
                      <CardTitle>Usage & Analytics</CardTitle>
                      <CardDescription>
                        Monitor your API usage and performance metrics
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ApiAnalytics apiId={activeApiId} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      )}
      {isApiKeyModalOpen && (
        <ApiKeyModal
          isOpen={isApiKeyModalOpen}
          onClose={() => setIsApiKeyModalOpen(false)}
          api={selectedApiForNewKey}
          onKeyCreated={handleKeyCreated}
        />
      )}
    </div>
  );
};

export default PurchasePage;