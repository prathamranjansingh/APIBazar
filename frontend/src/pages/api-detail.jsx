// src/pages/ApiDetail.jsx
"use client"
import { useState, useEffect, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuthenticatedApi } from "../hooks/useAuthenticatedApi"
import { useAuth0 } from "@auth0/auth0-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
         AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { EditEndpointDialog } from "../components/api-detail/edit-endpoint-dialog"
import { EditApiDialog } from "../components/api-detail/edit-api-dialog"
import { ApiOverview } from "../components/api-detail/api-overview"
import { ApiDocumentation } from "../components/api-detail/api-documentation"
import { ApiEndpoints } from "../components/api-detail/api-endpoints"
import { ApiSubscription } from "../components/api-detail/api-subscription"
import { ApiAnalytics } from "../components/api-detail/api-analytics"
import { Eye, Edit, Trash, Plus, PlusCircle, BarChart, Key, ShieldAlert, AlertCircle, BookOpen, Code } from "lucide-react"

/**
 * API Detail Page
 * Provides both a preview view for consumers and a management view for owners
 */
function ApiDetail() {
  const { id: apiId } = useParams()
  const navigate = useNavigate()
  const { get, post, put, delete: deleteRequest } = useAuthenticatedApi()
  const { user } = useAuth0()

  // State management
  const [api, setApi] = useState(null)
  const [endpoints, setEndpoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [managementMode, setManagementMode] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // Dialog states
  const [editEndpoint, setEditEndpoint] = useState(null)
  const [showEndpointDialog, setShowEndpointDialog] = useState(false)
  const [showApiEditDialog, setShowApiEditDialog] = useState(false)
  const [endpointToDelete, setEndpointToDelete] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  /**
   * Fetch API details from the backend
   */
  const fetchApiDetails = async () => {
    try {
      setLoading(true)
      const response = await get(`/api/apis/${apiId}`)
      setApi(response)

      // Set isOwner flag if the current user is the API owner
      if (user && response.owner && user.sub === response.owner.auth0Id) {
        setIsOwner(true)
      }

      // Organize endpoints
      if (response.endpoints) {
        setEndpoints(response.endpoints)
      }
    } catch (error) {
      console.error("Error fetching API details:", error)
      toast.error("Error", {
        description: "Failed to load API details. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  // Initial data loading
  useEffect(() => {
    fetchApiDetails()
  }, [apiId])

  /**
   * Handle API updating
   */
  const handleUpdateApi = async (updatedData) => {
    try {
      const response = await put(`/api/apis/${apiId}`, updatedData, { requireAuth: true })
      setApi({ ...api, ...response })
      toast.success("API Updated", {
        description: "API details have been successfully updated.",
      })
      setShowApiEditDialog(false)
    } catch (error) {
      console.error("Error updating API:", error)
      toast.error("Update Failed", {
        description: error.response?.data?.error || "Failed to update API details.",
      })
    }
  }

  /**
   * Handle endpoint creation
   */
  const handleCreateEndpoint = async (endpointData) => {
    try {
      const response = await post(`/api/apis/${apiId}/endpoints`, endpointData, { requireAuth: true })
      setEndpoints([...endpoints, response])
      toast.success("Endpoint Created", {
        description: "New endpoint has been successfully added.",
      })
      setShowEndpointDialog(false)
      setEditEndpoint(null)
    } catch (error) {
      console.error("Error creating endpoint:", error)
      toast.error("Creation Failed", {
        description: error.response?.data?.error || "Failed to create endpoint.",
      })
    }
  }

  /**
   * Handle endpoint updating
   */
  const handleUpdateEndpoint = async (endpointData) => {
    if (!editEndpoint) return
    try {
      const response = await put(
        `/api/apis/${apiId}/endpoints/${editEndpoint.id}`,
        endpointData,
        { requireAuth: true }
      )
      setEndpoints(endpoints.map(endpoint =>
        endpoint.id === editEndpoint.id ? response : endpoint
      ))
      toast.success("Endpoint Updated", {
        description: "Endpoint has been successfully updated.",
      })
      setShowEndpointDialog(false)
      setEditEndpoint(null)
    } catch (error) {
      console.error("Error updating endpoint:", error)
      toast.error("Update Failed", {
        description: error.response?.data?.error || "Failed to update endpoint.",
      })
    }
  }

  /**
   * Handle endpoint deletion
   */
  const handleDeleteEndpoint = async () => {
    if (!endpointToDelete) return
    try {
      setIsDeleting(true)
      await deleteRequest(`/api/apis/${apiId}/endpoints/${endpointToDelete.id}`, { requireAuth: true })
      setEndpoints(endpoints.filter(endpoint => endpoint.id !== endpointToDelete.id))
      toast.success("Endpoint Deleted", {
        description: "Endpoint has been successfully deleted.",
      })
    } catch (error) {
      console.error("Error deleting endpoint:", error)
      toast.error("Deletion Failed", {
        description: error.response?.data?.error || "Failed to delete endpoint.",
      })
    } finally {
      setIsDeleting(false)
      setEndpointToDelete(null)
      setShowDeleteDialog(false)
    }
  }

  /**
   * Handle API key generation
   */
  const handleGenerateApiKey = async () => {
    try {
      const response = await post(`/api/keys/apis/${apiId}`, {
        name: "Generated from dashboard"
      }, { requireAuth: true })
      toast.success("API Key Generated", {
        description: `Your new API key is: ${response.key}`,
      })
    } catch (error) {
      console.error("Error generating API key:", error)
      toast.error("Generation Failed", {
        description: error.response?.data?.error || "Failed to generate API key.",
      })
    }
  }

  /**
   * Handle API purchase
   */
  const handlePurchaseApi = async () => {
    try {
      await post(`/api/apis/${apiId}/purchase`, {}, { requireAuth: true })
      toast.success("API Purchased", {
        description: "You have successfully purchased access to this API.",
      })
      // Refresh API data to update UI
      fetchApiDetails()
    } catch (error) {
      console.error("Error purchasing API:", error)
      toast.error("Purchase Failed", {
        description: error.response?.data?.error || "Failed to purchase API.",
      })
    }
  }

  // Check if user has purchased this API
  const hasPurchased = useMemo(() => {
    if (!api || !api.purchasedBy || !user) return false
    return api.purchasedBy.some(purchase => purchase.userId === user.sub)
  }, [api, user])

  if (loading) {
    return <ApiDetailSkeleton />
  }

  if (!api) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">API Not Found</h2>
        <p className="text-muted-foreground mb-6">The API you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate("/apis")}>Return to API Listing</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header section with API details and management toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{api.name}</h1>
            {api.pricingModel === "FREE" ? (
              <Badge variant="outline" className="bg-green-100 text-green-800">Free</Badge>
            ) : (
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                Paid (${api.price?.toFixed(2)})
              </Badge>
            )}
            <Badge variant="secondary">{api.category}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {api.owner?.name ? `Created by ${api.owner.name}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {isOwner && (
            <Button
              variant={managementMode ? "default" : "outline"}
              onClick={() => setManagementMode(!managementMode)}
            >
              {managementMode ? (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  View as User
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Manage API
                </>
              )}
            </Button>
          )}
          {!isOwner && !hasPurchased && api.pricingModel === "PAID" && (
            <Button onClick={handlePurchaseApi}>
              Purchase API (${api.price?.toFixed(2)})
            </Button>
          )}
          {(isOwner || hasPurchased) && (
            <Button variant="outline" onClick={handleGenerateApiKey}>
              <Key className="mr-2 h-4 w-4" />
              Generate API Key
            </Button>
          )}
        </div>
      </div>
      <Separator />

      {/* Main content tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
          <TabsTrigger value="overview">
            <Eye className="h-4 w-4 mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger value="documentation">
            <BookOpen className="h-4 w-4 mr-2" /> Documentation
          </TabsTrigger>
          <TabsTrigger value="endpoints">
            <Code className="h-4 w-4 mr-2" /> Endpoints
          </TabsTrigger>
          <TabsTrigger value="subscription" disabled={!isOwner && !hasPurchased}>
            <Key className="h-4 w-4 mr-2" /> Access
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger value="analytics">
              <BarChart className="h-4 w-4 mr-2" /> Analytics
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview">
          <ApiOverview
            api={api}
            isOwner={isOwner}
            managementMode={managementMode}
            onEdit={() => setShowApiEditDialog(true)}
          />
        </TabsContent>

        {/* Documentation tab */}
        <TabsContent value="documentation">
          <ApiDocumentation
            documentation={api.documentation}
            isOwner={isOwner}
            managementMode={managementMode}
            onEdit={() => setShowApiEditDialog(true)}
          />
        </TabsContent>

        {/* Endpoints tab */}
        <TabsContent value="endpoints">
          <ApiEndpoints
            endpoints={endpoints}
            baseUrl={api.baseUrl}
            isOwner={isOwner}
            managementMode={managementMode}
            onEdit={(endpoint) => {
              setEditEndpoint(endpoint)
              setShowEndpointDialog(true)
            }}
            onDelete={(endpoint) => {
              setEndpointToDelete(endpoint)
              setShowDeleteDialog(true)
            }}
            onAdd={() => {
              setEditEndpoint(null)
              setShowEndpointDialog(true)
            }}
          />
        </TabsContent>

        {/* Subscription/Access tab */}
        <TabsContent value="subscription">
          <ApiSubscription
            api={api}
            isOwner={isOwner}
            hasPurchased={hasPurchased}
            onGenerateKey={handleGenerateApiKey}
            onPurchase={handlePurchaseApi}
          />
        </TabsContent>

        {/* Analytics tab */}
        {isOwner && (
          <TabsContent value="analytics">
            <ApiAnalytics api={api} />
          </TabsContent>
        )}
      </Tabs>

      {/* Edit API Dialog */}
      {showApiEditDialog && (
        <EditApiDialog
          api={api}
          open={showApiEditDialog}
          onOpenChange={setShowApiEditDialog}
          onSubmit={handleUpdateApi}
        />
      )}

      {/* Edit/Create Endpoint Dialog */}
      {showEndpointDialog && (
        <EditEndpointDialog
          endpoint={editEndpoint}
          open={showEndpointDialog}
          onOpenChange={setShowEndpointDialog}
          onSubmit={editEndpoint ? handleUpdateEndpoint : handleCreateEndpoint}
          baseUrl={api.baseUrl}
        />
      )}

      {/* Delete Endpoint Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Endpoint</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this endpoint? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEndpoint}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Endpoint"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ApiDetailSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-[250px]" />
            <Skeleton className="h-6 w-[60px] rounded-full" />
          </div>
          <Skeleton className="h-5 w-[180px] mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[120px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
      </div>
      <Skeleton className="h-[1px] w-full" />
      <div>
        <Skeleton className="h-10 w-full mb-6" />
        <div className="grid gap-6">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    </div>
  )
}

export default ApiDetail