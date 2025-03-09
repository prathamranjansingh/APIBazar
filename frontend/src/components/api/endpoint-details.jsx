import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
  } from "@/components/ui/dialog";
  import { Badge } from "@/components/ui/badge";
  import { Button } from "@/components/ui/button";
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
  import { formatDistance } from "date-fns";
  import { Check, X } from "lucide-react";
  
  const EndpointDetails = ({ endpoint, open, onOpenChange }) => {
    const methodColors = {
      GET: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      POST: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      PUT: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
      DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      PATCH: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    };
  
    if (!endpoint) return null;
  
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={methodColors[endpoint.method] || "bg-gray-100 text-gray-800"}
              >
                {endpoint.method}
              </Badge>
              <span className="font-mono">{endpoint.path}</span>
            </DialogTitle>
            <DialogDescription>{endpoint.description || "No description provided"}</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="details" className="pt-2">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="schema">Schema</TabsTrigger>
              <TabsTrigger value="example">Example</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Authentication Required</h4>
                  <div className="flex items-center mt-1">
                    {endpoint.authRequired ? (
                      <>
                        <Check className="h-4 w-4 text-green-500 mr-1" />
                        <span>Yes</span>
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 text-red-500 mr-1" />
                        <span>No</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Rate Limit</h4>
                  <p className="mt-1">{endpoint.rateLimit || "Default API limit"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Caching</h4>
                  <div className="flex items-center mt-1">
                    {endpoint.cachingEnabled ? (
                      <>
                        <Check className="h-4 w-4 text-green-500 mr-1" />
                        <span>
                          {endpoint.cacheDuration
                            ? `${endpoint.cacheDuration} seconds`
                            : "Enabled"}
                        </span>
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 text-red-500 mr-1" />
                        <span>Disabled</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Status</h4>
                  <div className="mt-1">
                    {endpoint.deprecated ? (
                      <Badge variant="destructive">Deprecated</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </div>
                </div>
                {endpoint.createdAt && (
                  <div className="col-span-2">
                    <h4 className="text-sm font-medium">Created</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDistance(new Date(endpoint.createdAt), new Date(), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="schema" className="space-y-4">
              <div>
                <h4 className="text-sm font-medium">Request Body Schema</h4>
                {endpoint.requestBodySchema ? (
                  <pre className="mt-2 p-4 bg-muted rounded-md overflow-x-auto font-mono text-xs">
                    {formatJsonSchema(endpoint.requestBodySchema)}
                  </pre>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No request body schema defined.
                  </p>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium">Response Body Schema</h4>
                {endpoint.responseBodySchema ? (
                  <pre className="mt-2 p-4 bg-muted rounded-md overflow-x-auto font-mono text-xs">
                    {formatJsonSchema(endpoint.responseBodySchema)}
                  </pre>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No response body schema defined.
                  </p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="example" className="space-y-4">
              <div>
                <h4 className="text-sm font-medium">Example Request</h4>
                <pre className="mt-2 p-4 bg-muted rounded-md overflow-x-auto font-mono text-xs">
                  {generateExampleRequest(endpoint)}
                </pre>
              </div>
              <div>
                <h4 className="text-sm font-medium">Example Response</h4>
                <pre className="mt-2 p-4 bg-muted rounded-md overflow-x-auto font-mono text-xs">
                  {generateExampleResponse(endpoint)}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  // Helper functions for formatting
  function formatJsonSchema(schema) {
    try {
      const parsedSchema = typeof schema === 'string' ? JSON.parse(schema) : schema;
      return JSON.stringify(parsedSchema, null, 2);
    } catch (error) {
      return schema;
    }
  }
  
  function generateExampleRequest(endpoint) {
    const method = endpoint.method;
    let curlExample = `curl -X ${method} "${endpoint.path}"`;
    if (endpoint.authRequired) {
      curlExample += ' \\\n  -H "Authorization: Bearer YOUR_API_KEY"';
    }
    curlExample += ' \\\n  -H "Content-Type: application/json"';
    if (["POST", "PUT", "PATCH"].includes(method) && endpoint.requestBodySchema) {
      try {
        const schema = JSON.parse(endpoint.requestBodySchema);
        const example = generateExampleFromSchema(schema);
        curlExample += ` \\\n  -d '${JSON.stringify(example, null, 2)}'`;
      } catch (error) {
        // If schema parsing fails, provide a basic example
        curlExample += ` \\\n  -d '{ "example": "data" }'`;
      }
    }
    return curlExample;
  }
  
  function generateExampleResponse(endpoint) {
    if (endpoint.responseBodySchema) {
      try {
        const schema = JSON.parse(endpoint.responseBodySchema);
        const example = generateExampleFromSchema(schema);
        return JSON.stringify(example, null, 2);
      } catch (error) {
        // Fallback for invalid JSON
        return '{\n  "example": "response"\n}';
      }
    }
    // Default example based on method
    if (endpoint.method === "GET") {
      return '{\n  "id": 123,\n  "name": "Example",\n  "status": "active"\n}';
    } else if (endpoint.method === "POST") {
      return '{\n  "id": 123,\n  "created": true,\n  "timestamp": "2023-07-21T15:30:00Z"\n}';
    } else if (endpoint.method === "DELETE") {
      return '{\n  "deleted": true\n}';
    }
    return '{\n  "success": true\n}';
  }
  
  // Generate example data from JSON schema
  function generateExampleFromSchema(schema) {
    if (!schema || typeof schema !== 'object') return {};
    // Handle different schema types
    if (schema.type === 'object') {
      const result = {};
      if (schema.properties) {
        Object.keys(schema.properties).forEach(propName => {
          result[propName] = generateExampleFromSchema(schema.properties[propName]);
        });
      }
      return result;
    } else if (schema.type === 'array') {
      if (schema.items) {
        return [generateExampleFromSchema(schema.items)];
      }
      return [];
    } else if (schema.type === 'string') {
      if (schema.enum) return schema.enum[0];
      if (schema.format === 'date-time') return '2023-07-21T15:30:00Z';
      if (schema.format === 'date') return '2023-07-21';
      if (schema.format === 'email') return 'user@example.com';
      return 'string';
    } else if (schema.type === 'number' || schema.type === 'integer') {
      return 123;
    } else if (schema.type === 'boolean') {
      return true;
    }
    return null;
  }
  
  export default EndpointDetails;