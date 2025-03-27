"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth0 } from "@auth0/auth0-react"
import { useUser } from "@/contexts/user-context"
import {
  fetchApiDetails,
  updateApi,
  deleteApi,
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
  purchaseApi,
} from "@/lib/api-service"
import { toast } from "sonner"
import { marked } from "marked"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import ApiEditForm from "@/components/api-detail/api-edit-form"
import EndpointDialog from "@/components/api-detail/endpoint-form"
import DocumentationEditorDialog from "@/components/api-detail/documentation-editor"

const ApiDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getAccessTokenSilently } = useAuth0()
  const { user } = useUser()

  // State
  const [api, setApi] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [editMode, setEditMode] = useState(false)

  // Dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEndpointDialog, setShowEndpointDialog] = useState(false)
  const [selectedEndpoint, setSelectedEndpoint] = useState(null)
  const [showDocDialog, setShowDocDialog] = useState(false)

  // Action state
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load API data
  useEffect(() => {
    const loadApi = async () => {
      try {
        setLoading(true)
        const token = await getAccessTokenSilently()
        const data = await fetchApiDetails(id, token)
        setApi(data)
      } catch (err) {
        console.error("Failed to load API:", err)
        setError("Could not load API details")
        toast.error("Error loading API details")
      } finally {
        setLoading(false)
      }
    }
    loadApi()
  }, [id, getAccessTokenSilently])

  // Determine if user is owner
  const isOwner = api?.ownerId === user?.id
  const hasPurchased = api?.purchasedBy?.some((purchase) => purchase.userId === user?.id)

  // Handler functions
  const handleDeleteAPI = async () => {
    try {
      setIsSubmitting(true)
      const token = await getAccessTokenSilently()
      await deleteApi(id, token)
      toast.success("API deleted successfully")
      navigate("/apis")
    } catch (error) {
      console.error("Error deleting API:", error)
      toast.error("Failed to delete API")
    } finally {
      setIsSubmitting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleUpdateApi = async (data) => {
    try {
      setIsSubmitting(true)
      const token = await getAccessTokenSilently()
      const updatedApi = await updateApi(id, data, token)
      setApi({
        ...updatedApi,
        endpoints: api.endpoints, // Preserve existing endpoints
      })
      setEditMode(false)
      toast.success("API updated successfully")
    } catch (error) {
      console.error("Error updating API:", error)
      toast.error("Failed to update API")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateDocumentation = async (data) => {
    try {
      setIsSubmitting(true)
      const token = await getAccessTokenSilently()
      const updatedApi = await updateApi(id, { documentation: data.documentation }, token)
      setApi({
        ...updatedApi,
        endpoints: api.endpoints, // Preserve existing endpoints
      })
      setShowDocDialog(false)
      toast.success("Documentation updated successfully")
    } catch (error) {
      console.error("Error updating documentation:", error)
      toast.error("Failed to update documentation")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEndpointSubmit = async (data) => {
    try {
      setIsSubmitting(true)
      const token = await getAccessTokenSilently()
      if (selectedEndpoint) {
        const updatedEndpoint = await updateEndpoint(id, selectedEndpoint.id, data, token)
        setApi((prev) => ({
          ...prev,
          endpoints: prev.endpoints.map((ep) => (ep.id === updatedEndpoint.id ? updatedEndpoint : ep)),
        }))
        toast.success("Endpoint updated successfully")
      } else {
        const newEndpoint = await createEndpoint(id, data, token)
        setApi((prev) => ({
          ...prev,
          endpoints: [...(prev.endpoints || []), newEndpoint],
        }))
        toast.success("Endpoint created successfully")
      }
      setShowEndpointDialog(false)
      setSelectedEndpoint(null)
    } catch (error) {
      console.error("Error saving endpoint:", error)
      toast.error("Failed to save endpoint")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteEndpoint = async (endpointId) => {
    try {
      setIsSubmitting(true)
      const token = await getAccessTokenSilently()
      await deleteEndpoint(id, endpointId, token)
      setApi((prev) => ({
        ...prev,
        endpoints: prev.endpoints.filter((ep) => ep.id !== endpointId),
      }))
      toast.success("Endpoint deleted successfully")
    } catch (error) {
      console.error("Error deleting endpoint:", error)
      toast.error("Failed to delete endpoint")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePurchase = async () => {
    try {
      setIsSubmitting(true)
      const token = await getAccessTokenSilently()
      await purchaseApi(id, token)
      setApi((prev) => ({
        ...prev,
        purchasedBy: [...(prev.purchasedBy || []), { userId: user.id }],
      }))
      toast.success("API purchased successfully")
    } catch (error) {
      console.error("Error purchasing API:", error)
      toast.error("Failed to purchase API")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          <div className="md:col-span-2">
            <Skeleton className="h-64 w-full rounded-md" />
          </div>
          <div>
            <Skeleton className="h-64 w-full rounded-md" />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
        <p className="mb-6 text-muted-foreground">{error}</p>
        <Button onClick={() => navigate("/apis")}>Return to APIs</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* API Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{api.name}</h1>
          <p className="text-muted-foreground mt-1">{api.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={api.status === "ACTIVE" ? "success" : "secondary"}>{api.status}</Badge>
            <Badge variant={api.pricingModel === "FREE" ? "outline" : "default"}>
              {api.pricingModel === "FREE" ? "Free" : `$${api.price?.toFixed(2)}`}
            </Badge>
          </div>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditMode(true)}>
              Edit API
            </Button>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              Delete API
            </Button>
            <Button
              variant="outline"
              className="bg-green-500 hover:bg-green-500 hover:text-white text-white"
              onClick={() => navigate(`/apis/${id}/webhooks`)}
            >
              Webhooks
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {editMode ? (
            <ApiEditForm
              api={api}
              onSubmit={handleUpdateApi}
              onCancel={() => setEditMode(false)}
              isSubmitting={isSubmitting}
            />
          ) : (
            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
                <TabsTrigger value="documentation">Documentation</TabsTrigger>
              </TabsList>
              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>API Overview</CardTitle>
                    <CardDescription>Details and specifications for this API</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Base URL</h3>
                      <code className="bg-muted p-3 rounded block font-mono text-sm overflow-x-auto whitespace-pre-wrap break-all">
                        {api.baseUrl}
                      </code>
                    </div>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Version</h3>
                        <p>{api.version || "1.0.0"}</p>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-2">Rate Limit</h3>
                        <p>{api.rateLimit || 60} requests/minute</p>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-2">Category</h3>
                        <p>{api.category || "Uncategorized"}</p>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-2">Created</h3>
                        <p>{new Date(api.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="endpoints">
                <Card>
                  <CardHeader>
                    <CardTitle>API Endpoints</CardTitle>
                    <CardDescription>Available endpoints for this API</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {api.endpoints?.length > 0 ? (
                      <div className="space-y-4">
                        {api.endpoints.map((endpoint) => (
                          <div key={endpoint.id} className="border p-4 rounded-md">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center overflow-hidden max-w-[70%]">
                                <Badge className={`mr-2 flex-shrink-0 ${getMethodColor(endpoint.method)}`}>
                                  {endpoint.method}
                                </Badge>
                                <span className="font-mono text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                                  {endpoint.path}
                                </span>
                              </div>
                              {isOwner && (
                                <div className="space-x-2 flex-shrink-0">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedEndpoint(endpoint)
                                      setShowEndpointDialog(true)
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteEndpoint(endpoint.id)}
                                    disabled={isSubmitting}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              )}
                            </div>
                            <p className="text-sm mt-2 text-muted-foreground line-clamp-2">
                              {endpoint.name}: {endpoint.description || "No description provided"}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground py-4 text-center">No endpoints defined for this API.</p>
                    )}
                  </CardContent>
                  {isOwner && (
                    <CardFooter>
                      <Button
                        onClick={() => {
                          setSelectedEndpoint(null)
                          setShowEndpointDialog(true)
                        }}
                      >
                        Add Endpoint
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </TabsContent>
              <TabsContent value="documentation">
                <Card>
                  <CardHeader>
                    <CardTitle>Documentation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none dark:prose-invert overflow-y-auto max-h-[60vh] p-1">
                      {api.documentation ? (
                        <div dangerouslySetInnerHTML={{ __html: marked(api.documentation) }} />
                      ) : (
                        <p className="text-muted-foreground">No documentation available for this API.</p>
                      )}
                    </div>
                  </CardContent>
                  {isOwner && (
                    <CardFooter>
                      <Button onClick={() => setShowDocDialog(true)}>Edit Documentation</Button>
                    </CardFooter>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
        {/* Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>API Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Base URL</p>
                  <code className="text-xs bg-muted p-1 rounded block mt-1 overflow-x-auto whitespace-pre-wrap break-all">
                    {api.baseUrl}
                  </code>
                </div>
                <div>
                  <p className="text-sm font-medium">Authentication</p>
                  <code className="text-xs bg-muted p-1 rounded block mt-1 overflow-x-auto whitespace-pre-wrap">
                    Authorization: Bearer YOUR_API_KEY
                  </code>
                </div>
                <div>
                  <p className="text-sm font-medium">Rate Limit</p>
                  <p className="text-sm">{api.rateLimit || 60} requests/minute</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Endpoints</p>
                  <p className="text-sm">{api.endpoints?.length || 0} endpoints available</p>
                </div>
              </div>
            </CardContent>
            {!isOwner && !hasPurchased && (
              <CardFooter>
                <Button className="w-full" onClick={handlePurchase} disabled={isSubmitting}>
                  {api.pricingModel === "FREE" ? "Add to My APIs" : `Purchase ($${api.price?.toFixed(2)})`}
                </Button>
              </CardFooter>
            )}
            {hasPurchased && (
              <CardFooter>
                <Badge className="w-full justify-center py-2">Purchased</Badge>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
      {/* Dialogs */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete API</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this API? This action cannot be undone and will remove all endpoints.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAPI} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete API"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Documentation Editor Dialog */}
      {showDocDialog && (
        <DocumentationEditorDialog
          open={showDocDialog}
          onOpenChange={setShowDocDialog}
          documentation={api.documentation || ""}
          onSave={handleUpdateDocumentation}
          isSubmitting={isSubmitting}
        />
      )}
      {/* Endpoint Dialog */}
      {showEndpointDialog && (
        <EndpointDialog
          open={showEndpointDialog}
          onOpenChange={setShowEndpointDialog}
          endpoint={selectedEndpoint}
          onSubmit={handleEndpointSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  )
}

// Helper function to get method color
function getMethodColor(method) {
  switch (method) {
    case "GET":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    case "POST":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    case "PUT":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
    case "DELETE":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    case "PATCH":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  }
}

export default ApiDetail

