"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useApi } from "../contexts/api-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Code2, Plus, Trash2, Edit, Copy, BarChart3, Key, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"

function ApiDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fetchApiById, fetchEndpoints, addEndpoint, deleteEndpoint, loading } = useApi()
  const [api, setApi] = useState(null)
  const [endpoints, setEndpoints] = useState([])
  const [endpointFormOpen, setEndpointFormOpen] = useState(false)
  const [endpointForm, setEndpointForm] = useState({
    apiId: id,
    method: "GET",
    path: "",
    description: "",
    headers: "{}",
    requestBody: "{}",
    response: "{}",
  })

  useEffect(() => {
    const loadApiData = async () => {
      const apiData = await fetchApiById(id)
      if (apiData) {
        setApi(apiData)
        const endpointsData = await fetchEndpoints(id)
        setEndpoints(endpointsData)
      }
    }

    loadApiData()
  }, [id, fetchApiById, fetchEndpoints])

  const handleEndpointChange = (e) => {
    const { name, value } = e.target
    setEndpointForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleMethodChange = (value) => {
    setEndpointForm((prev) => ({ ...prev, method: value }))
  }

  const handleEndpointSubmit = async (e) => {
    e.preventDefault()

    try {
      // Validate JSON fields
      JSON.parse(endpointForm.headers)
      JSON.parse(endpointForm.requestBody)
      JSON.parse(endpointForm.response)

      const newEndpoint = await addEndpoint(endpointForm)
      if (newEndpoint) {
        setEndpoints((prev) => [...prev, newEndpoint])
        setEndpointFormOpen(false)
        setEndpointForm({
          apiId: id,
          method: "GET",
          path: "",
          description: "",
          headers: "{}",
          requestBody: "{}",
          response: "{}",
        })
      }
    } catch (error) {
      toast.error("Invalid JSON", {
        description: "Please ensure headers, requestBody, and response are valid JSON",
      })
    }
  }

  const handleDeleteEndpoint = async (endpointId) => {
    const success = await deleteEndpoint(endpointId)
    if (success) {
      setEndpoints((prev) => prev.filter((endpoint) => endpoint.id !== endpointId))
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard", {
      description: "The text has been copied to your clipboard",
    })
  }

  if (loading && !api) {
    return <ApiDetailSkeleton />
  }

  if (!api) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-2xl font-bold mb-4">API not found</h2>
        <p className="text-muted-foreground mb-6">
          The API you're looking for doesn't exist or you don't have access to it.
        </p>
        <Button onClick={() => navigate("/apis")}>Go Back to APIs</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/apis")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            {api.name}
            <Badge
              variant="outline"
              className={
                api.pricingModel === "FREE"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                  : api.pricingModel === "PAID"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
              }
            >
              {api.pricingModel === "FREE" ? "Free" : api.pricingModel === "PAID" ? "Paid" : "Subscription"}
            </Badge>
          </h2>
          <p className="text-muted-foreground">{api.description}</p>
        </div>
      </div>

      <Tabs defaultValue="endpoints" className="space-y-6">
        <TabsList>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">API Endpoints</h3>
              <Dialog open={endpointFormOpen} onOpenChange={setEndpointFormOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Endpoint
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <form onSubmit={handleEndpointSubmit}>
                    <DialogHeader>
                      <DialogTitle>Add New Endpoint</DialogTitle>
                      <DialogDescription>
                        Create a new endpoint for your API. Fill in the details below.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="method" className="text-right">
                          Method
                        </Label>
                        <Select value={endpointForm.method} onValueChange={handleMethodChange}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GET">GET</SelectItem>
                            <SelectItem value="POST">POST</SelectItem>
                            <SelectItem value="PUT">PUT</SelectItem>
                            <SelectItem value="DELETE">DELETE</SelectItem>
                            <SelectItem value="PATCH">PATCH</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="path" className="text-right">
                          Path
                        </Label>
                        <Input
                          id="path"
                          name="path"
                          placeholder="/users"
                          value={endpointForm.path}
                          onChange={handleEndpointChange}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                          Description
                        </Label>
                        <Input
                          id="description"
                          name="description"
                          placeholder="Get all users"
                          value={endpointForm.description}
                          onChange={handleEndpointChange}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="headers" className="text-right pt-2">
                          Headers
                        </Label>
                        <Textarea
                          id="headers"
                          name="headers"
                          placeholder='{"Content-Type": "application/json"}'
                          value={endpointForm.headers}
                          onChange={handleEndpointChange}
                          className="col-span-3 font-mono"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="requestBody" className="text-right pt-2">
                          Request Body
                        </Label>
                        <Textarea
                          id="requestBody"
                          name="requestBody"
                          placeholder='{"name": "John", "email": "john@example.com"}'
                          value={endpointForm.requestBody}
                          onChange={handleEndpointChange}
                          className="col-span-3 font-mono"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="response" className="text-right pt-2">
                          Response
                        </Label>
                        <Textarea
                          id="response"
                          name="response"
                          placeholder='{"id": 1, "name": "John", "email": "john@example.com"}'
                          value={endpointForm.response}
                          onChange={handleEndpointChange}
                          className="col-span-3 font-mono"
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setEndpointFormOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          "Add Endpoint"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {endpoints.length > 0 ? (
              <div className="space-y-4">
                {endpoints.map((endpoint) => (
                  <Card key={endpoint.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              endpoint.method === "GET"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                : endpoint.method === "POST"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  : endpoint.method === "PUT"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                    : endpoint.method === "DELETE"
                                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                      : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                            }
                          >
                            {endpoint.method}
                          </Badge>
                          <CardTitle className="text-lg">{endpoint.path}</CardTitle>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => {}}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteEndpoint(endpoint.id)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                      <CardDescription>{endpoint.description || "No description provided"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-1">Full URL</h4>
                          <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
                            <code className="text-sm flex-1 overflow-x-auto">
                              {api.baseUrl}
                              {endpoint.path}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => copyToClipboard(`${api.baseUrl}${endpoint.path}`)}
                            >
                              <Copy className="h-4 w-4" />
                              <span className="sr-only">Copy</span>
                            </Button>
                          </div>
                        </div>

                        {endpoint.headers && endpoint.headers !== "{}" && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Headers</h4>
                            <pre className="bg-muted p-2 rounded-md text-sm overflow-x-auto">
                              {JSON.stringify(JSON.parse(endpoint.headers), null, 2)}
                            </pre>
                          </div>
                        )}

                        {endpoint.requestBody && endpoint.requestBody !== "{}" && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Request Body</h4>
                            <pre className="bg-muted p-2 rounded-md text-sm overflow-x-auto">
                              {JSON.stringify(JSON.parse(endpoint.requestBody), null, 2)}
                            </pre>
                          </div>
                        )}

                        {endpoint.response && endpoint.response !== "{}" && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Response</h4>
                            <pre className="bg-muted p-2 rounded-md text-sm overflow-x-auto">
                              {JSON.stringify(JSON.parse(endpoint.response), null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center p-8">
                <div className="flex flex-col items-center justify-center py-8">
                  <Code2 className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-xl font-semibold mb-2">No endpoints yet</p>
                  <p className="text-muted-foreground mb-4">Add your first endpoint to get started</p>
                  <Button onClick={() => setEndpointFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Endpoint
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="documentation">
          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>Documentation for your API</CardDescription>
            </CardHeader>
            <CardContent>
              {api.documentation ? (
                <div className="prose dark:prose-invert max-w-none">
                  {/* In a real app, you would render Markdown here */}
                  <pre className="whitespace-pre-wrap">{api.documentation}</pre>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No documentation provided</p>
                  <Button variant="outline" className="mt-4" onClick={() => {}}>
                    <Edit className="mr-2 h-4 w-4" /> Add Documentation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>API Analytics</CardTitle>
              <CardDescription>Usage statistics for your API</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{api.analytics?.totalCalls || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {api.analytics?.totalCalls > 0 ? "+12% from last month" : "No API calls yet"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{api.analytics?.errorRate || 0}%</div>
                    <p className="text-xs text-muted-foreground">
                      {api.analytics?.errorRate > 0 ? "-2% from last month" : "No errors yet"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{api.analytics?.responseTimeAvg || 0} ms</div>
                    <p className="text-xs text-muted-foreground">
                      {api.analytics?.responseTimeAvg > 0 ? "-5ms from last month" : "No data yet"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">No active users yet</p>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8 text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Detailed analytics will be available once your API receives traffic
                </p>
                <Button variant="outline" className="mt-4" onClick={() => {}}>
                  <ExternalLink className="mr-2 h-4 w-4" /> View Detailed Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keys">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>Manage API keys for authentication</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Generate New Key
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Default API Key</h3>
                        <p className="text-sm text-muted-foreground">Created on {new Date().toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard("sk_test_example_api_key_12345")}
                        >
                          <Copy className="mr-2 h-4 w-4" /> Copy
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Revoke
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 bg-muted p-2 rounded-md">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <code className="text-sm flex-1">sk_test_example_api_key_12345</code>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline">Rate Limit: 1000 req/month</Badge>
                      <Badge variant="outline">No Expiration</Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-md">
                  <h3 className="font-medium mb-2">API Key Security</h3>
                  <p className="text-sm text-muted-foreground">
                    Your API keys carry many privileges, so be sure to keep them secure. Don't share your API keys in
                    publicly accessible areas such as GitHub, client-side code, etc.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ApiDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div>
          <Skeleton className="h-8 w-[250px] mb-2" />
          <Skeleton className="h-4 w-[350px]" />
        </div>
      </div>

      <Skeleton className="h-10 w-[300px]" />

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-[150px]" />
          <Skeleton className="h-10 w-[150px]" />
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-[60px]" />
                <Skeleton className="h-6 w-[150px]" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Skeleton className="h-4 w-[100px] mb-1" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-[100px] mb-1" />
                <Skeleton className="h-20 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-[100px] mb-1" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ApiDetail

