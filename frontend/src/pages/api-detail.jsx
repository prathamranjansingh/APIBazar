import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useUser } from "@/contexts/user-context";
import { fetchApiDetails, updateApi, deleteApi } from "@/lib/api-service";
import { updateEndpoint, deleteEndpoint, createEndpoint } from "@/lib/endpoint-service";
import { purchaseApi } from "@/lib/purchase-service";
// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
// Page-specific components
import ApiPreview from "@/components/api/api-preview";
import ApiEditForm from "@/components/api/api-edit-form";
import EndpointsList from "@/components/api/endpoints-list";
import EndpointForm from "@/components/api/endpoint-form";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import PageHeader from "@/components/ui/page-header";

function ApiDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();
  const { user } = useUser();
  // State management
  const [api, setApi] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEndpointDialog, setShowEndpointDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived state
  const isOwner = useMemo(() =>
    api?.ownerId === user?.id,
    [api?.ownerId, user?.id]
  );
  const hasPurchased = useMemo(() =>
    api?.purchasedBy?.some(purchase => purchase.userId === user?.id),
    [api?.purchasedBy, user?.id]
  );

  // Initial data loading
  useEffect(() => {
    async function loadApiDetails() {
      setIsLoading(true);
      try {
        const token = await getAccessTokenSilently();
        const data = await fetchApiDetails(id, token);
        setApi(data);
        setError(null);
      } catch (err) {
        console.error("Failed to load API details:", err);
        setError("Failed to load API details. Please try again.");
        toast.error("Error", { description: "Failed to load API details" });
      } finally {
        setIsLoading(false);
      }
    }
    if (id) {
      loadApiDetails();
    }
  }, [id, getAccessTokenSilently]);

  // API update handler
  const handleApiUpdate = async (updatedData) => {
    setIsSubmitting(true);
    try {
      const token = await getAccessTokenSilently();
      const updated = await updateApi(id, updatedData, token);
      setApi(updated);
      setEditMode(false);
      toast.success("Success", { description: "API updated successfully" });
    } catch (err) {
      console.error("Failed to update API:", err);
      toast.error("Error", { description: err.message || "Failed to update API" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // API delete handler
  const handleApiDelete = async () => {
    setIsSubmitting(true);
    try {
      const token = await getAccessTokenSilently();
      await deleteApi(id, token);
      toast.success("Success", { description: "API deleted successfully" });
      navigate("/apis");
    } catch (err) {
      console.error("Failed to delete API:", err);
      toast.error("Error", { description: "Failed to delete API" });
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
    }
  };

  // Endpoint handlers
  const handleEndpointUpdate = async (endpointData) => {
    setIsSubmitting(true);
    try {
      const token = await getAccessTokenSilently();
      if (selectedEndpoint) {
        // Update existing endpoint
        const updated = await updateEndpoint(
          id,
          selectedEndpoint.id,
          endpointData,
          token
        );
        // Update API state with the updated endpoint
        setApi(prev => ({
          ...prev,
          endpoints: prev.endpoints.map(ep =>
            ep.id === updated.id ? updated : ep
          )
        }));
        toast.success("Success", { description: "Endpoint updated successfully" });
      } else {
        // Create new endpoint
        const newEndpoint = await createEndpoint(id, endpointData, token);
        // Add the new endpoint to API state
        setApi(prev => ({
          ...prev,
          endpoints: [...prev.endpoints, newEndpoint]
        }));
        toast.success("Success", { description: "Endpoint created successfully" });
      }
      setSelectedEndpoint(null);
    } catch (err) {
      console.error("Failed to save endpoint:", err);
      toast.error("Error", {
        description: err.message || "Failed to save endpoint"
      });
    } finally {
      setIsSubmitting(false);
      setShowEndpointDialog(false);
    }
  };

  const handleEndpointDelete = async (endpointId) => {
    try {
      const token = await getAccessTokenSilently();
      await deleteEndpoint(id, endpointId, token);
      // Remove the deleted endpoint from state
      setApi(prev => ({
        ...prev,
        endpoints: prev.endpoints.filter(ep => ep.id !== endpointId)
      }));
      toast.success("Success", { description: "Endpoint deleted successfully" });
    } catch (err) {
      console.error("Failed to delete endpoint:", err);
      toast.error("Error", { description: "Failed to delete endpoint" });
    }
  };

  // Purchase handler
  const handlePurchase = async () => {
    setIsSubmitting(true);
    try {
      const token = await getAccessTokenSilently();
      await purchaseApi(id, token);
      // Update local state to reflect purchase
      setApi(prev => ({
        ...prev,
        purchasedBy: [...(prev.purchasedBy || []), { userId: user.id }]
      }));
      toast.success("Success", { description: "API purchased successfully" });
    } catch (err) {
      console.error("Failed to purchase API:", err);
      toast.error("Error", { description: "Failed to purchase API" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return <ApiDetailSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <h2 className="text-2xl font-bold text-red-500">Error Loading API</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => navigate("/apis")}>Back to APIs</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={editMode ? "Edit API" : api.name}
        description={editMode ? "Modify your API details" : api.description}
        actions={
          isOwner && (
            <>
              {editMode ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    form="api-edit-form"
                    disabled={isSubmitting}
                  >
                    Save Changes
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    Delete API
                  </Button>
                  <Button onClick={() => setEditMode(true)}>
                    Edit API
                  </Button>
                </div>
              )}
            </>
          )
        }
      />
      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-6">
          {editMode ? (
            /* Edit Mode */
            <ApiEditForm
              api={api}
              onSubmit={handleApiUpdate}
              disabled={isSubmitting}
            />
          ) : (
            /* Preview Mode */
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{api.name}</CardTitle>
                      <CardDescription className="mt-2">{api.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={api.status === 'ACTIVE' ? 'success' : 'secondary'}>
                        {api.status}
                      </Badge>
                      <Badge variant={api.pricingModel === 'FREE' ? 'outline' : 'default'}>
                        {api.pricingModel === 'FREE' ? 'Free' : `$${api.price?.toFixed(2)}`}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
                      <TabsTrigger value="documentation">Documentation</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview" className="space-y-4">
                      <ApiPreview api={api} />
                    </TabsContent>
                    <TabsContent value="endpoints">
                      <EndpointsList
                        endpoints={api.endpoints || []}
                        isOwner={isOwner}
                        onEdit={(endpoint) => {
                          setSelectedEndpoint(endpoint);
                          setShowEndpointDialog(true);
                        }}
                        onDelete={handleEndpointDelete}
                      />
                      {isOwner && (
                        <div className="mt-4">
                          <Button
                            onClick={() => {
                              setSelectedEndpoint(null);
                              setShowEndpointDialog(true);
                            }}
                          >
                            Add Endpoint
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="documentation">
                      <div className="prose max-w-none dark:prose-invert">
                        <div dangerouslySetInnerHTML={{ __html: api.documentation || '<p>No documentation available</p>' }} />
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {!editMode && (
            <Card>
              <CardHeader>
                <CardTitle>API Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Base URL</p>
                  <code className="text-sm bg-muted p-1 rounded">
                    {api.baseUrl}
                  </code>
                </div>
                <div>
                  <p className="text-sm font-medium">Version</p>
                  <p className="text-sm">{api.version}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Rate Limit</p>
                  <p className="text-sm">{api.rateLimit} requests per minute</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm">
                    {new Date(api.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                {!isOwner && !hasPurchased && api.pricingModel === 'PAID' && (
                  <Button
                    className="w-full"
                    onClick={handlePurchase}
                    disabled={isSubmitting}
                  >
                    Purchase for ${api.price?.toFixed(2)}
                  </Button>
                )}
                {!isOwner && !hasPurchased && api.pricingModel === 'FREE' && (
                  <Button
                    className="w-full"
                    onClick={handlePurchase}
                    disabled={isSubmitting}
                  >
                    Add to My APIs
                  </Button>
                )}
                {hasPurchased && (
                  <Badge className="w-full flex justify-center py-2" variant="success">
                    Purchased
                  </Badge>
                )}
              </CardFooter>
            </Card>
          )}
          {isOwner && !editMode && (
            <Card>
              <CardHeader>
                <CardTitle>Owner Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full"
                  onClick={() => {
                    setActiveTab("endpoints");
                    setSelectedEndpoint(null);
                    setShowEndpointDialog(true);
                  }}
                >
                  Add New Endpoint
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      {/* Dialogs */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete API"
        description="Are you sure you want to delete this API? This action cannot be undone and will remove all endpoints."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleApiDelete}
      />
      {showEndpointDialog && (
        <EndpointForm
          endpoint={selectedEndpoint}
          open={showEndpointDialog}
          onOpenChange={setShowEndpointDialog}
          onSubmit={handleEndpointUpdate}
        />
      )}
    </div>
  );
}

// Skeleton loader for better UX
function ApiDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-24" />
                  ))}
                </div>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full mt-1" />
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ApiDetail;