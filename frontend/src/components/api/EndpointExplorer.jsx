import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner"
import { Play, Code, Copy, BookOpen, Share2 } from "lucide-react";

const EndpointExplorer = ({ api, apiKeys }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState(api.endpoints[0]?.id || "");
  const [selectedApiKey, setSelectedApiKey] = useState(apiKeys[0]?.id || "");
  const [requestHeaders, setRequestHeaders] = useState({});
  const [requestBody, setRequestBody] = useState("");
  const [queryParams, setQueryParams] = useState({});
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleEndpointChange = (endpointId) => {
    setSelectedEndpoint(endpointId);
    setRequestBody("");
    setQueryParams({});
    setResponse(null);
  };

  const getSelectedEndpoint = () => {
    return api.endpoints.find(endpoint => endpoint.id === selectedEndpoint) || null;
  };

  const getSelectedApiKey = () => {
    return apiKeys.find(key => key.id === selectedApiKey) || null;
  };

  const handleTestRequest = async () => {
    const endpoint = getSelectedEndpoint();
    const apiKey = getSelectedApiKey();
    if (!endpoint) {
      toast({
        title: "No endpoint selected",
        description: "Please select an endpoint to test.",
        variant: "destructive",
      });
      return;
    }
    if (!apiKey) {
      toast({
        title: "No API key selected",
        description: "Please select an API key to authenticate your request.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      // Construct the URL with query parameters
      let url = `${api.baseUrl}${endpoint.path}`;
      const queryString = new URLSearchParams(queryParams).toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      // Prepare headers
      const headers = {
        "Content-Type": "application/json",
        "X-API-Key": apiKey.key,
        ...requestHeaders
      };
      // Make the request
      const response = await fetch(url, {
        method: endpoint.method,
        headers,
        body: ["POST", "PUT", "PATCH"].includes(endpoint.method) && requestBody ?
          requestBody : undefined,
      });
      const responseData = await response.json();
      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()]),
        data: responseData,
        time: new Date().toISOString()
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Request error:", error);
      toast({
        title: "Request failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code copied",
      description: "Example code copied to clipboard",
      variant: "default",
    });
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="w-full md:w-1/2">
          <label className="block text-sm font-medium mb-1">Endpoint</label>
          <Select
            value={selectedEndpoint}
            onValueChange={handleEndpointChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select endpoint" />
            </SelectTrigger>
            <SelectContent>
              {api.endpoints.map((endpoint) => (
                <SelectItem key={endpoint.id} value={endpoint.id}>
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2 uppercase">{endpoint.method}</Badge>
                    {endpoint.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-1/2">
          <label className="block text-sm font-medium mb-1">API Key</label>
          <Select
            value={selectedApiKey}
            onValueChange={setSelectedApiKey}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select API Key" />
            </SelectTrigger>
            <SelectContent>
              {apiKeys.map((key) => (
                <SelectItem key={key.id} value={key.id}>
                  {key.name} {!key.isActive && "(Inactive)"}
                </SelectItem>
              ))}
              {apiKeys.length === 0 && (
                <SelectItem value="none" disabled>
                  No API keys available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
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
            <Tabs defaultValue="request">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="request">Request</TabsTrigger>
                <TabsTrigger value="response">Response</TabsTrigger>
              </TabsList>
              <TabsContent value="request" className="space-y-4 pt-4">
                <Accordion type="single" collapsible>
                  <AccordionItem value="params">
                    <AccordionTrigger>Query Parameters</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 gap-2">
                        {/* Example query param inputs - customize based on your needs */}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Key"
                            className="flex-1"
                            onChange={(e) => {
                              const newParams = { ...queryParams };
                              if (e.target.value) {
                                newParams[e.target.value] = queryParams[""] || "";
                                delete newParams[""];
                              }
                              setQueryParams(newParams);
                            }}
                          />
                          <Input
                            placeholder="Value"
                            className="flex-1"
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
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="headers">
                    <AccordionTrigger>Headers</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center gap-2">
                          <Input
                            value="X-API-Key"
                            disabled
                            className="flex-1"
                          />
                          <Input
                            value={getSelectedApiKey()?.key || "No API Key selected"}
                            disabled
                            className="flex-1"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            value="Content-Type"
                            disabled
                            className="flex-1"
                          />
                          <Input
                            value="application/json"
                            disabled
                            className="flex-1"
                          />
                        </div>
                        {/* Add custom header inputs here */}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  {["POST", "PUT", "PATCH"].includes(getSelectedEndpoint().method) && (
                    <AccordionItem value="body">
                      <AccordionTrigger>Request Body</AccordionTrigger>
                      <AccordionContent>
                        <Textarea
                          placeholder="Enter JSON request body"
                          className="font-mono text-sm"
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
                      </AccordionContent>
                    </AccordionItem>
                  )}
                  <AccordionItem value="code">
                    <AccordionTrigger>Code Examples</AccordionTrigger>
                    <AccordionContent>
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
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
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

export default EndpointExplorer;