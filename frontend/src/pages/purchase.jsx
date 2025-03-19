import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth0 } from "@auth0/auth0-react"
import { useApiService } from "../contexts/ApiServiceContext"
import { toast, Toaster } from "sonner"
import { Sparkles, BookOpen, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import EmptyState from "@/components/common/EmptyState"
import ApiCard from "../components/purchase/api-card"
import ApiDetailsDialog from "../components/purchase/api-details-dialog"
import CreateKeyDialog from "../components/purchase/create-key-dialog" 
import { createApiService } from "../lib/purchase-page"


export default function PurchasePage() {

  const { isAuthenticated,getAccessTokenSilently, isLoading: authLoading, loginWithRedirect } = useAuth0()
  const apiService = useApiService()
  const navigate = useNavigate()
  const useAnalytics = createApiService(() => getAccessTokenSilently())
  // State management
  const [purchasedApis, setPurchasedApis] = useState([])
  const [apiKeys, setApiKeys] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingError, setLoadingError] = useState(null)
  const [selectedApi, setSelectedApi] = useState(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [createKeyDialogOpen, setCreateKeyDialogOpen] = useState(false)
  const [selectedApiAnalytics, setSelectedApiAnalytics] = useState(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)

  // Authentication check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      loginWithRedirect({
        appState: { returnTo: window.location.pathname },
      })
      return
    }
    if (isAuthenticated) {
      fetchPurchasedApis()
    }
  }, [isAuthenticated, authLoading])

  // Fetch all purchased APIs and API keys data
  const fetchPurchasedApis = async () => {
    setIsLoading(true)
    setLoadingError(null)
    try {
      const [apis, keys] = await Promise.all([apiService.getPurchasedApis(), apiService.getUserApiKeys()])
      setPurchasedApis(apis)
      setApiKeys(keys)
    } catch (error) {
      setLoadingError("Failed to load purchased APIs")
      toast.error("Unable to load your purchased APIs", {
        description: "Please try again or contact support if the problem persists.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch analytics for a specific API
  const fetchApiAnalytics = async (apiId) => {
    setLoadingAnalytics(true)
    try {
      const analytics = await useAnalytics.getApiAnalytics(apiId)
      setSelectedApiAnalytics(analytics)
    } catch (error) {
      toast.error("Failed to load API analytics", {
        description: "Please try again later.",
      })
    } finally {
      setLoadingAnalytics(false)
    }
  }

  // Handle creating a new API key
  const handleCreateApiKey = async (keyName) => {
    try {
      const result = await apiService.createApiKey({
        apiId: selectedApi.id,
        name: keyName,
      })
      setApiKeys((prevKeys) => [...prevKeys, result])
      setCreateKeyDialogOpen(false)
      toast.success("API key created successfully", {
        description: "Your new API key is ready to use.",
      })
      return true
    } catch (error) {
      toast.error("Failed to create API key", {
        description: error.response?.data?.error || "Please try again later.",
      })
      return false
    }
  }

  // Handle revoking an API key
  const handleRevokeApiKey = async (keyId) => {
    try {
      await apiService.revokeApiKey(keyId)
      setApiKeys((prevKeys) => prevKeys.map((key) => (key.id === keyId ? { ...key, isActive: false } : key)))
      toast.success("API key revoked successfully")
    } catch (error) {
      toast.error("Failed to revoke API key", {
        description: "Please try again later.",
      })
    }
  }

  // Open API details dialog
  const openApiDetails = (api) => {
    setSelectedApi(api)
    setSelectedApiAnalytics(null)
    setDetailsDialogOpen(true)
  }

  // Handle tab change in details dialog
  const handleTabChange = async (value) => {
    if (value === "analytics" && selectedApi && !selectedApiAnalytics) {
      await fetchApiAnalytics(selectedApi.id)
    }
  }

  // Render loading state
  if (isLoading) {
    return <LoadingState />
  }

  // Render error state
  if (loadingError) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <EmptyState
          icon={<AlertCircle className="h-12 w-12 text-destructive" />}
          title="Error Loading APIs"
          description="We couldn't load your purchased APIs. Please try refreshing the page."
          action={<Button onClick={fetchPurchasedApis}>Try Again</Button>}
        />
        <Toaster position="top-right" richColors closeButton />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Purchased APIs</h1>
          <p className="text-muted-foreground mt-1">Manage and access your API subscriptions</p>
        </div>
        <Button onClick={() => navigate("/apis")} className="shrink-0">
          <Sparkles className="h-4 w-4 mr-2" />
          Explore More APIs
        </Button>
      </div>

      {/* Empty state when no APIs are purchased */}
      {purchasedApis.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 my-6">
          <EmptyState
            icon={<BookOpen className="h-12 w-12 text-muted-foreground" />}
            title="No Purchased APIs Yet"
            description="Explore our marketplace to find and purchase APIs for your projects."
            action={<Button onClick={() => navigate("/apis")}>Browse API Marketplace</Button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {purchasedApis.map((api) => (
            <ApiCard key={api.id} api={api} onViewDetails={() => openApiDetails(api)} />
          ))}
        </div>
      )}

      {/* API Details Dialog */}
      {selectedApi && (
        <ApiDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          api={selectedApi}
          apiKeys={apiKeys.filter((key) => key.apiId === selectedApi.id)}
          analytics={selectedApiAnalytics}
          loadingAnalytics={loadingAnalytics}
          onTabChange={handleTabChange}
          onCreateKey={() => setCreateKeyDialogOpen(true)}
          onRevokeKey={handleRevokeApiKey}
        />
      )}

      {/* Create API Key Dialog */}
      <CreateKeyDialog
        open={createKeyDialogOpen}
        onOpenChange={setCreateKeyDialogOpen}
        apiName={selectedApi?.name}
        onCreateKey={handleCreateApiKey}
      />

      {/* Single toast provider */}
      <Toaster position="top-right" richColors closeButton />
    </div>
  )
}

// Loading state component
function LoadingState() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="flex flex-col space-y-2 mb-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-6 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="pt-2">
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

