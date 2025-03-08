// src/components/create-api/endpoints-form.jsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash, Edit, Save, X, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

function EndpointsForm({ endpoints, addEndpoint, removeEndpoint, updateEndpoint, baseUrl }) {
  const [formValues, setFormValues] = useState({
    name: "",
    method: "GET",
    path: "",
    description: "",
    parameters: [],
    requestBody: "",
    responseExample: "",
    rateLimit: null,
  });

  const [parameterForm, setParameterForm] = useState({
    name: "",
    description: "",
    required: false,
  });

  const [editingIndex, setEditingIndex] = useState(null);
  const [showJsonError, setShowJsonError] = useState({
    request: false,
    response: false,
  });

  const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];

  // Handle method change
  const handleMethodChange = (value) => {
    setFormValues((prev) => ({ ...prev, method: value }));
  };

  // Handle input change for form fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));

    // Clear JSON validation errors when editing
    if (name === "requestBody") {
      setShowJsonError((prev) => ({ ...prev, request: false }));
    } else if (name === "responseExample") {
      setShowJsonError((prev) => ({ ...prev, response: false }));
    }
  };

  // Handle input change for parameter fields
  const handleParameterInputChange = (e) => {
    const { name, value } = e.target;
    setParameterForm((prev) => ({ ...prev, [name]: value }));
  };

  // Toggle required field for parameters
  const handleRequiredToggle = () => {
    setParameterForm((prev) => ({ ...prev, required: !prev.required }));
  };

  // Add a new parameter
  const addParameter = () => {
    if (!parameterForm.name.trim()) {
      return;
    }

    const newParameter = {
      name: parameterForm.name,
      description: parameterForm.description,
      required: parameterForm.required,
    };

    setFormValues((prev) => ({
      ...prev,
      parameters: [...prev.parameters, newParameter],
    }));

    // Reset parameter form
    setParameterForm({
      name: "",
      description: "",
      required: false,
    });
  };

  // Remove a parameter
  const removeParameter = (index) => {
    setFormValues((prev) => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index),
    }));
  };

  // Validate JSON input
  const validateJson = (jsonString, field) => {
    if (!jsonString.trim()) return true;
    try {
      JSON.parse(jsonString);
      return true;
    } catch (e) {
      setShowJsonError((prev) => ({ ...prev, [field]: true }));
      return false;
    }
  };

  // Add a new endpoint
  const handleAddEndpoint = () => {
    if (!formValues.path.trim()) {
      return;
    }

    const isRequestValid = validateJson(formValues.requestBody, "request");
    const isResponseValid = validateJson(formValues.responseExample, "response");

    if (!isRequestValid || !isResponseValid) {
      return;
    }

    // Format the path to ensure it starts with a slash
    const formattedPath = formValues.path.startsWith("/") ? formValues.path : `/${formValues.path}`;

    addEndpoint({
      ...formValues,
      path: formattedPath,
      name: formValues.name || `${formValues.method} ${formattedPath}`,
    });

    // Reset form
    setFormValues({
      name: "",
      method: "GET",
      path: "",
      description: "",
      parameters: [],
      requestBody: "",
      responseExample: "",
      rateLimit: null,
    });

    setShowJsonError({
      request: false,
      response: false,
    });
  };

  // Start editing an endpoint
  const startEditing = (index) => {
    setEditingIndex(index);
    setFormValues(endpoints[index]);
    setShowJsonError({
      request: false,
      response: false,
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingIndex(null);
    setFormValues({
      name: "",
      method: "GET",
      path: "",
      description: "",
      parameters: [],
      requestBody: "",
      responseExample: "",
      rateLimit: null,
    });
    setShowJsonError({
      request: false,
      response: false,
    });
  };

  // Save edited endpoint
  const saveEditedEndpoint = () => {
    if (!formValues.path.trim()) {
      return;
    }

    const isRequestValid = validateJson(formValues.requestBody, "request");
    const isResponseValid = validateJson(formValues.responseExample, "response");

    if (!isRequestValid || !isResponseValid) {
      return;
    }

    // Format the path to ensure it starts with a slash
    const formattedPath = formValues.path.startsWith("/") ? formValues.path : `/${formValues.path}`;

    updateEndpoint(editingIndex, {
      ...formValues,
      path: formattedPath,
      name: formValues.name || `${formValues.method} ${formattedPath}`,
    });

    setEditingIndex(null);
    setFormValues({
      name: "",
      method: "GET",
      path: "",
      description: "",
      parameters: [],
      requestBody: "",
      responseExample: "",
      rateLimit: null,
    });
  };

  // Get method color for badges
  const getMethodColor = (method) => {
    switch (method) {
      case "GET":
        return "bg-green-100 text-green-800 border-green-200";
      case "POST":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "PUT":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "DELETE":
        return "bg-red-100 text-red-800 border-red-200";
      case "PATCH":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Endpoint Form */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* HTTP Method */}
          <div className="space-y-2">
            <Label htmlFor="method">HTTP Method</Label>
            <Select value={formValues.method} onValueChange={handleMethodChange}>
              <SelectTrigger id="method">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {HTTP_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    <span className={`px-2 py-1 rounded text-xs ${getMethodColor(method)}`}>{method}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Endpoint Path */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="path">
              Endpoint Path <span className="text-destructive">*</span>
            </Label>
            <div className="flex">
              <div className="bg-muted px-3 py-2 rounded-l-md border border-r-0 border-input text-muted-foreground truncate max-w-[200px]">
                {baseUrl}/
              </div>
              <Input
                id="path"
                name="path"
                placeholder="users/{id}"
                value={formValues.path}
                onChange={handleInputChange}
                className="rounded-l-none"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              The path relative to your base URL (e.g., /users/{'{id}'})
            </p>
          </div>
        </div>

        {/* Endpoint Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Endpoint Name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Get User"
            value={formValues.name}
            onChange={handleInputChange}
          />
          <p className="text-sm text-muted-foreground">
            A descriptive name for this endpoint (optional)
          </p>
        </div>

        {/* Endpoint Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Describe what this endpoint does..."
            value={formValues.description}
            onChange={handleInputChange}
            rows={3}
          />
        </div>

        {/* Rate Limit */}
        <div className="space-y-2">
          <Label htmlFor="rateLimit">Rate Limit (requests per minute)</Label>
          <Input
            id="rateLimit"
            name="rateLimit"
            type="number"
            min="0"
            placeholder="Leave empty to use API default"
            value={formValues.rateLimit || ""}
            onChange={handleInputChange}
          />
          <p className="text-sm text-muted-foreground">
            Set a custom rate limit for this specific endpoint (overrides API default)
          </p>
        </div>

        {/* Parameters Section */}
        <Accordion type="single" collapsible defaultValue="parameters" className="w-full">
          <AccordionItem value="parameters">
            <AccordionTrigger>Parameters</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Parameter Name */}
                  <div className="space-y-2">
                    <Label htmlFor="param-name">Parameter Name</Label>
                    <Input
                      id="param-name"
                      name="name"
                      placeholder="user_id"
                      value={parameterForm.name}
                      onChange={handleParameterInputChange}
                    />
                  </div>

                  {/* Parameter Description */}
                  <div className="space-y-2">
                    <Label htmlFor="param-description">Description</Label>
                    <Input
                      id="param-description"
                      name="description"
                      placeholder="The user's unique identifier"
                      value={parameterForm.description}
                      onChange={handleParameterInputChange}
                    />
                  </div>

                  {/* Required Toggle */}
                  <div className="flex items-end space-x-4">
                    <div className="space-y-2">
                      <Label htmlFor="param-required" className="block">Required</Label>
                      <div className="flex items-center space-x-2 h-10">
                        <Switch
                          id="param-required"
                          checked={parameterForm.required}
                          onCheckedChange={handleRequiredToggle}
                        />
                        <Label htmlFor="param-required" className="cursor-pointer">
                          {parameterForm.required ? "Yes" : "No"}
                        </Label>
                      </div>
                    </div>
                    <Button type="button" variant="outline" onClick={addParameter} className="ml-auto">
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                </div>

                {/* Parameter List */}
                {formValues.parameters.length > 0 && (
                  <div className="border rounded-md mt-4">
                    <div className="bg-muted px-4 py-2 font-medium text-sm rounded-t-md">
                      Parameters ({formValues.parameters.length})
                    </div>
                    <div className="divide-y">
                      {formValues.parameters.map((param, index) => (
                        <div key={index} className="px-4 py-3 flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{param.name}</span>
                              {param.required && (
                                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                  Required
                                </Badge>
                              )}
                            </div>
                            {param.description && (
                              <p className="text-sm text-muted-foreground mt-1">{param.description}</p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeParameter(index)}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Request and Response Examples */}
        <Accordion type="single" collapsible defaultValue="request-response" className="w-full">
          <AccordionItem value="request-response">
            <AccordionTrigger>Request & Response Examples</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                {/* Request Body */}
                <div className="space-y-2">
                  <Label htmlFor="requestBody">Request Body (JSON)</Label>
                  <Textarea
                    id="requestBody"
                    name="requestBody"
                    placeholder='{\n  "name": "Example User",\n  "email": "user@example.com"\n}'
                    value={formValues.requestBody}
                    onChange={handleInputChange}
                    className="font-mono text-sm"
                    rows={5}
                  />
                  {showJsonError.request && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Invalid JSON format. Please check your syntax.
                      </AlertDescription>
                    </Alert>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Example JSON body that should be sent with the request
                  </p>
                </div>

                {/* Response Example */}
                <div className="space-y-2">
                  <Label htmlFor="responseExample">Response Example (JSON)</Label>
                  <Textarea
                    id="responseExample"
                    name="responseExample"
                    placeholder='{\n  "id": 123,\n  "name": "Example User",\n  "email": "user@example.com",\n  "createdAt": "2023-04-01T12:00:00Z"\n}'
                    value={formValues.responseExample}
                    onChange={handleInputChange}
                    className="font-mono text-sm"
                    rows={5}
                  />
                  {showJsonError.response && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Invalid JSON format. Please check your syntax.
                      </AlertDescription>
                    </Alert>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Example JSON response that will be returned from this endpoint
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        {editingIndex !== null ? (
          <>
            <Button type="button" variant="outline" onClick={cancelEditing}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button type="button" onClick={saveEditedEndpoint}>
              <Save className="h-4 w-4 mr-1" /> Save Changes
            </Button>
          </>
        ) : (
          <Button type="button" onClick={handleAddEndpoint}>
            <Plus className="h-4 w-4 mr-1" /> Add Endpoint
          </Button>
        )}
      </div>

      {/* Endpoints List */}
      {endpoints.length > 0 && (
        <div className="space-y-3 mt-6">
          <h4 className="font-medium">Defined Endpoints ({endpoints.length})</h4>
          <div className="space-y-3">
            {endpoints.map((endpoint, index) => (
              <Card key={index} className={editingIndex === index ? "border-primary" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getMethodColor(endpoint.method)}>{endpoint.method}</Badge>
                        <span className="font-mono text-sm">{baseUrl}{endpoint.path}</span>
                      </div>
                      <p className="text-sm font-medium">{endpoint.name}</p>
                      {endpoint.description && (
                        <p className="text-sm text-muted-foreground mt-1">{endpoint.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(index)}
                      >
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEndpoint(index)}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {/* Parameter Summary */}
                  {endpoint.parameters.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground">Parameters: {endpoint.parameters.length}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {endpoint.parameters.map((param, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {param.name}
                            {param.required && "*"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rate Limit Indicator */}
                  {endpoint.rateLimit && (
                    <div className="mt-2 flex items-center gap-1">
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {endpoint.rateLimit} req/min
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default EndpointsForm;