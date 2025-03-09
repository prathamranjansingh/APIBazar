// src/components/api-detail/edit-endpoint-dialog.jsx
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function EditEndpointDialog({ endpoint, baseUrl, open, onOpenChange, onSubmit }) {
  const [formData, setFormData] = useState({
    name: "",
    method: "GET",
    path: "",
    description: "",
    parameters: [],
    requestBody: "",
    responseExample: "",
    rateLimit: null
  })

  const [parameterForm, setParameterForm] = useState({
    name: "",
    description: "",
    required: false
  })

  const [jsonError, setJsonError] = useState({
    request: false,
    response: false
  })

  const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"]

  // Initialize form with endpoint data if editing
  useEffect(() => {
    if (endpoint) {
      setFormData({
        name: endpoint.name || "",
        method: endpoint.method || "GET",
        path: endpoint.path || "",
        description: endpoint.description || "",
        parameters: endpoint.parameters || [],
        requestBody: endpoint.requestBody ? JSON.stringify(endpoint.requestBody, null, 2) : "",
        responseExample: endpoint.responseSchema ? JSON.stringify(endpoint.responseSchema, null, 2) : "",
        rateLimit: endpoint.rateLimit || null
      })
    } else {
      // Reset form for new endpoint
      setFormData({
        name: "",
        method: "GET",
        path: "",
        description: "",
        parameters: [],
        requestBody: "",
        responseExample: "",
        rateLimit: null
      })
    }
  }, [endpoint])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear JSON validation errors when editing
    if (name === "requestBody") {
      setJsonError(prev => ({ ...prev, request: false }))
    } else if (name === "responseExample") {
      setJsonError(prev => ({ ...prev, response: false }))
    }
  }

  const handleParameterInputChange = (e) => {
    const { name, value } = e.target
    setParameterForm(prev => ({ ...prev, [name]: value }))
  }

  const handleRequiredToggle = () => {
    setParameterForm(prev => ({ ...prev, required: !prev.required }))
  }

  const addParameter = () => {
    if (!parameterForm.name.trim()) {
      return
    }
    const newParameter = {
      name: parameterForm.name,
      description: parameterForm.description,
      required: parameterForm.required
    }
    setFormData(prev => ({
      ...prev,
      parameters: [...prev.parameters, newParameter]
    }))
    // Reset parameter form
    setParameterForm({
      name: "",
      description: "",
      required: false
    })
  }

  const removeParameter = (index) => {
    setFormData(prev => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index)
    }))
  }

  const validateJson = (jsonString, field) => {
    if (!jsonString.trim()) return true
    try {
      JSON.parse(jsonString)
      setJsonError(prev => ({ ...prev, [field]: false }))
      return true
    } catch (e) {
      setJsonError(prev => ({ ...prev, [field]: true }))
      return false
    }
  }

  const handleSubmit = () => {
    // Validate inputs
    if (!formData.path) {
      alert("Path is required")
      return
    }
    // Validate JSON
    const isRequestValid = validateJson(formData.requestBody, "request")
    const isResponseValid = validateJson(formData.responseExample, "response")
    if (!isRequestValid || !isResponseValid) {
      return
    }
    // Format path
    const formattedPath = formData.path.startsWith('/') ? formData.path : `/${formData.path}`
    // Format data for submission
    const submitData = {
      ...formData,
      path: formattedPath,
      // Parse JSON if needed
      requestBody: formData.requestBody ? JSON.parse(formData.requestBody) : null,
      responseSchema: formData.responseExample ? JSON.parse(formData.responseExample) : null,
    }
    onSubmit(submitData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{endpoint ? 'Edit Endpoint' : 'Add Endpoint'}</DialogTitle>
          <DialogDescription>
            {endpoint ? 'Modify an existing endpoint' : 'Create a new endpoint for your API'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="method">HTTP Method</Label>
              <Select
                value={formData.method}
                onValueChange={(value) => setFormData(prev => ({ ...prev, method: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {HTTP_METHODS.map(method => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="path">Endpoint Path</Label>
              <div className="flex">
                <div className="bg-muted px-3 py-2 rounded-l-md border border-r-0 border-input text-muted-foreground truncate max-w-[150px]">
                  {baseUrl}/
                </div>
                <Input
                  id="path"
                  name="path"
                  value={formData.path}
                  onChange={handleChange}
                  placeholder="users/{id}"
                  className="rounded-l-none"
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Endpoint Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Get User Details"
            />
            <p className="text-sm text-muted-foreground">
              A descriptive name for this endpoint
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what this endpoint does..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rateLimit">Rate Limit (requests per minute)</Label>
            <Input
              id="rateLimit"
              name="rateLimit"
              type="number"
              min="1"
              value={formData.rateLimit || ''}
              onChange={handleChange}
              placeholder="Leave empty to use API default"
            />
          </div>
          {/* Parameters Section */}
          <div className="space-y-4 border p-4 rounded-md">
            <h4 className="font-medium">Parameters</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="param-name">Parameter Name</Label>
                <Input
                  id="param-name"
                  name="name"
                  value={parameterForm.name}
                  onChange={handleParameterInputChange}
                  placeholder="user_id"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="param-description">Description</Label>
                <Input
                  id="param-description"
                  name="description"
                  value={parameterForm.description}
                  onChange={handleParameterInputChange}
                  placeholder="The user's unique identifier"
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Switch
                  id="param-required"
                  checked={parameterForm.required}
                  onCheckedChange={handleRequiredToggle}
                />
                <Label htmlFor="param-required">Required parameter</Label>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addParameter}
                size="sm"
              >
                Add Parameter
              </Button>
            </div>
            {/* Parameter List */}
            {formData.parameters.length > 0 && (
              <div className="border rounded-md mt-4">
                <div className="p-3 border-b bg-muted font-medium text-sm">
                  Added Parameters
                </div>
                <div className="p-3 space-y-2">
                  {formData.parameters.map((param, index) => (
                    <div key={index} className="flex justify-between items-center bg-background p-2 rounded-md">
                      <div>
                        <div className="font-medium">{param.name}</div>
                        {param.description && (
                          <div className="text-sm text-muted-foreground">{param.description}</div>
                        )}
                        {param.required && (
                          <div className="text-xs text-red-500 mt-1">Required</div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeParameter(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Request & Response */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="requestBody">Request Body (JSON)</Label>
              <Textarea
                id="requestBody"
                name="requestBody"
                value={formData.requestBody}
                onChange={handleChange}
                placeholder='{\n  "name": "Example",\n  "email": "user@example.com"\n}'
                rows={4}
                className="font-mono text-sm"
              />
              {jsonError.request && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Invalid JSON format in request body
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="responseExample">Response Example (JSON)</Label>
              <Textarea
                id="responseExample"
                name="responseExample"
                value={formData.responseExample}
                onChange={handleChange}
                placeholder='{\n  "id": 123,\n  "name": "Example",\n  "email": "user@example.com"\n}'
                rows={4}
                className="font-mono text-sm"
              />
              {jsonError.response && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Invalid JSON format in response example
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>{endpoint ? 'Save Changes' : 'Add Endpoint'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}