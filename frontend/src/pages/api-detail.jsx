// pages/api-detail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useUser } from "@/contexts/user-context";
import {
  fetchApiDetails,
  updateApi,
  deleteApi,
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
} from "@/lib/api-service";
import { toast } from "sonner";
import { marked } from "marked";
// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import MDEditor from "@uiw/react-md-editor";

const ApiDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();
  const { user } = useUser();

  // State
  const [api, setApi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [editMode, setEditMode] = useState(false);

  // Dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEndpointDialog, setShowEndpointDialog] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [showDocDialog, setShowDocDialog] = useState(false);

  // Action state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load API data
  useEffect(() => {
    const loadApi = async () => {
      try {
        setLoading(true);
        const token = await getAccessTokenSilently();
        const data = await fetchApiDetails(id, token);
        setApi(data);
      } catch (err) {
        console.error("Failed to load API:", err);
        setError("Could not load API details");
        toast.error("Error loading API details");
      } finally {
        setLoading(false);
      }
    };

    loadApi();
  }, [id, getAccessTokenSilently]);

  // Determine if user is owner
  const isOwner = api?.ownerId === user?.id;
  const hasPurchased = api?.purchasedBy?.some(
    (purchase) => purchase.userId === user?.id
  );

  // Handler functions
  const handleDeleteAPI = async () => {
    try {
      setIsSubmitting(true);
      const token = await getAccessTokenSilently();
      await deleteApi(id, token);
      toast.success("API deleted successfully");
      navigate("/apis");
    } catch (error) {
      console.error("Error deleting API:", error);
      toast.error("Failed to delete API");
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleUpdateApi = async (data) => {
    try {
      setIsSubmitting(true);
      const token = await getAccessTokenSilently();
      const updatedApi = await updateApi(id, data, token);
      setApi(updatedApi);
      setEditMode(false);
      toast.success("API updated successfully");
    } catch (error) {
      console.error("Error updating API:", error);
      toast.error("Failed to update API");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDocumentation = async (data) => {
    try {
      setIsSubmitting(true);
      const token = await getAccessTokenSilently();
      const updatedApi = await updateApi(id, { documentation: data.documentation }, token);
      setApi(updatedApi);
      setShowDocDialog(false);
      toast.success("Documentation updated successfully");
    } catch (error) {
      console.error("Error updating documentation:", error);
      toast.error("Failed to update documentation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateEndpoint = async (data) => {
    try {
      setIsSubmitting(true);
      const token = await getAccessTokenSilently();
      const newEndpoint = await createEndpoint(id, data, token);
      setApi((prev) => ({
        ...prev,
        endpoints: [...(prev.endpoints || []), newEndpoint],
      }));
      setShowEndpointDialog(false);
      toast.success("Endpoint created successfully");
    } catch (error) {
      console.error("Error creating endpoint:", error);
      toast.error("Failed to create endpoint");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEndpoint = async (data) => {
    try {
      setIsSubmitting(true);
      const token = await getAccessTokenSilently();
      const updatedEndpoint = await updateEndpoint(id, selectedEndpoint.id, data, token);
      setApi((prev) => ({
        ...prev,
        endpoints: prev.endpoints.map((ep) =>
          ep.id === updatedEndpoint.id ? updatedEndpoint : ep
        ),
      }));
      setShowEndpointDialog(false);
      setSelectedEndpoint(null);
      toast.success("Endpoint updated successfully");
    } catch (error) {
      console.error("Error updating endpoint:", error);
      toast.error("Failed to update endpoint");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndpointSubmit = (data) => {
    if (selectedEndpoint) {
      handleUpdateEndpoint(data);
    } else {
      handleCreateEndpoint(data);
    }
  };

  const handleDeleteEndpoint = async (endpointId) => {
    try {
      const token = await getAccessTokenSilently();
      await deleteEndpoint(id, endpointId, token);
      setApi((prev) => ({
        ...prev,
        endpoints: prev.endpoints.filter((ep) => ep.id !== endpointId),
      }));
      toast.success("Endpoint deleted successfully");
    } catch (error) {
      console.error("Error deleting endpoint:", error);
      toast.error("Failed to delete endpoint");
    }
  };

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
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
        <p className="mb-6 text-muted-foreground">{error}</p>
        <Button onClick={() => navigate("/apis")}>Return to APIs</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* API Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{api.name}</h1>
          <p className="text-muted-foreground mt-1">{api.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={api.status === "ACTIVE" ? "success" : "secondary"}>
              {api.status}
            </Badge>
            <Badge
              variant={api.pricingModel === "FREE" ? "outline" : "default"}
            >
              {api.pricingModel === "FREE" ? "Free" : `$${api.price?.toFixed(2)}`}
            </Badge>
          </div>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditMode(true)}>
              Edit API
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete API
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
            <Tabs
              defaultValue="overview"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
                <TabsTrigger value="documentation">Documentation</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>API Overview</CardTitle>
                    <CardDescription>
                      Details and specifications for this API
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Base URL</h3>
                      <code className="bg-muted p-3 rounded block font-mono text-sm">
                        {api.baseUrl}
                      </code>
                    </div>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Version</h3>
                        <p>{api.version}</p>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-2">Rate Limit</h3>
                        <p>{api.rateLimit} requests/minute</p>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-2">Pricing</h3>
                        <p>
                          {api.pricingModel === "FREE"
                            ? "Free"
                            : `$${api.price?.toFixed(2)} per month`}
                        </p>
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
                    <CardDescription>
                      Available endpoints for this API
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {api.endpoints?.length > 0 ? (
                      <div className="space-y-4">
                        {api.endpoints.map((endpoint) => (
                          <div
                            key={endpoint.id}
                            className="border p-4 rounded"
                          >
                            <div className="flex justify-between">
                              <div>
                                <Badge
                                  className={`mr-2 ${getMethodColor(
                                    endpoint.method
                                  )}`}
                                >
                                  {endpoint.method}
                                </Badge>
                                <span className="font-mono">{endpoint.path}</span>
                              </div>
                              {isOwner && (
                                <div className="space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedEndpoint(endpoint);
                                      setShowEndpointDialog(true);
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteEndpoint(endpoint.id)
                                    }
                                  >
                                    Delete
                                  </Button>
                                </div>
                              )}
                            </div>
                            <p className="text-sm mt-2 text-muted-foreground">
                              {endpoint.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        No endpoints defined for this API.
                      </p>
                    )}
                  </CardContent>
                  {isOwner && (
                    <CardFooter>
                      <Button
                        onClick={() => {
                          setSelectedEndpoint(null);
                          setShowEndpointDialog(true);
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
                    {api.documentation ? (
                      <div
                        className="prose max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{
                          __html: marked(api.documentation),
                        }}
                      />
                    ) : (
                      <p className="text-muted-foreground">
                        No documentation available for this API.
                      </p>
                    )}
                  </CardContent>
                  {isOwner && (
                    <CardFooter>
                      <Button onClick={() => setShowDocDialog(true)}>
                        Edit Documentation
                      </Button>
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
                  <code className="text-xs bg-muted p-1 rounded block mt-1">
                    {api.baseUrl}
                  </code>
                </div>
                <div>
                  <p className="text-sm font-medium">Authentication</p>
                  <code className="text-xs bg-muted p-1 rounded block mt-1">
                    Authorization: Bearer YOUR_API_KEY
                  </code>
                </div>
                <div>
                  <p className="text-sm font-medium">Rate Limit</p>
                  <p className="text-sm">{api.rateLimit} requests/minute</p>
                </div>
              </div>
            </CardContent>
            {!isOwner && !hasPurchased && (
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={async () => {
                    try {
                      setIsSubmitting(true);
                      const token = await getAccessTokenSilently();
                      // Implement purchase API call here
                      toast.success("API added to your account");
                      setApi((prev) => ({
                        ...prev,
                        purchasedBy: [...(prev.purchasedBy || []), { userId: user.id }],
                      }));
                    } catch (error) {
                      toast.error("Failed to purchase API");
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting}
                >
                  {api.pricingModel === "FREE"
                    ? "Add to My APIs"
                    : `Purchase ($${api.price?.toFixed(2)})`}
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
              Are you sure you want to delete this API? This action cannot be
              undone and will remove all endpoints.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAPI}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete API"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Documentation Editor Dialog */}
      <DocumentationEditorDialog
        open={showDocDialog}
        onOpenChange={setShowDocDialog}
        documentation={api.documentation || ""}
        onSave={handleUpdateDocumentation}
        isSubmitting={isSubmitting}
      />

      {/* Endpoint Dialog */}
      <EndpointDialog
        open={showEndpointDialog}
        onOpenChange={setShowEndpointDialog}
        endpoint={selectedEndpoint}
        onSubmit={handleEndpointSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

// Helper function to get method color
function getMethodColor(method) {
  switch (method) {
    case "GET":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "POST":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "PUT":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
    case "DELETE":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case "PATCH":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
}

// API Edit Form Component
const ApiEditForm = ({ api, onSubmit, onCancel, isSubmitting }) => {
  const apiSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    version: z.string(),
    baseUrl: z.string().url("Must be a valid URL"),
    pricingModel: z.enum(["FREE", "PAID"]),
    price: z.number().nullable().optional(),
    rateLimit: z.number().min(1, "Rate limit must be at least 1"),
    status: z.enum(["ACTIVE", "INACTIVE", "DEPRECATED"]),
  });

  const form = useForm({
    resolver: zodResolver(apiSchema),
    defaultValues: {
      name: api?.name || "",
      description: api?.description || "",
      version: api?.version || "1.0.0",
      baseUrl: api?.baseUrl || "",
      pricingModel: api?.pricingModel || "FREE",
      price: api?.price || null,
      rateLimit: api?.rateLimit || 60,
      status: api?.status || "ACTIVE",
    },
    mode: "onSubmit",
  });

  const [pricingModel, setPricingModel] = useState(api?.pricingModel || "FREE");

  const handlePricingChange = (value) => {
    setPricingModel(value);
    if (value === "FREE") {
      form.setValue("price", null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit API</CardTitle>
        <CardDescription>Update your API details</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            id="api-edit-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Version</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="DEPRECATED">Deprecated</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="baseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base URL</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormDescription>
                    The root URL for your API endpoints
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pricingModel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pricing Model</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handlePricingChange(value);
                    }}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pricing model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="FREE">Free</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {pricingModel === "PAID" && (
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (USD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>Monthly subscription price</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="rateLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate Limit</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value))
                      }
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum requests per minute
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="api-edit-form"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  );
};

// Documentation Editor Dialog
const DocumentationEditorDialog = ({
  open,
  onOpenChange,
  documentation,
  onSave,
  isSubmitting,
}) => {
  const docSchema = z.object({
    documentation: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(docSchema),
    defaultValues: {
      documentation: documentation,
    },
    mode: "onSubmit",
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => !isSubmitting && onOpenChange(value)}
    >
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Documentation</DialogTitle>
          <DialogDescription>
            Update documentation using Markdown. Preview will be shown below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="doc-edit-form" onSubmit={form.handleSubmit(onSave)}>
            <FormField
              control={form.control}
              name="documentation"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="min-h-[400px]">
                      <MDEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        height={400}
                        preview="edit"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Use Markdown to format your documentation.
                  </FormDescription>
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="doc-edit-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Documentation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Endpoint Dialog
const EndpointDialog = ({
  open,
  onOpenChange,
  endpoint,
  onSubmit,
  isSubmitting,
}) => {
  const endpointSchema = z.object({
    path: z
      .string()
      .min(1, "Path is required")
      .startsWith("/", "Path must start with /"),
    method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
    description: z.string().optional(),
    rateLimit: z
      .number()
      .min(1, "Rate limit must be at least 1")
      .optional()
      .nullable(),
    authRequired: z.boolean().default(true),
  });

  const form = useForm({
    resolver: zodResolver(endpointSchema),
    defaultValues: {
      path: endpoint?.path || "/",
      method: endpoint?.method || "GET",
      description: endpoint?.description || "",
      rateLimit: endpoint?.rateLimit || null,
      authRequired: endpoint?.authRequired ?? true,
    },
    mode: "onSubmit",
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => !isSubmitting && onOpenChange(value)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{endpoint ? "Edit Endpoint" : "Add Endpoint"}</DialogTitle>
          <DialogDescription>
            {endpoint
              ? "Update the details of this endpoint"
              : "Create a new endpoint for your API"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="endpoint-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <FormLabel>Method</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="path"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>Path</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="/users/:id"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe what this endpoint does"
                      rows={3}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rateLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate Limit (per minute)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseInt(e.target.value) : null)
                      }
                      placeholder="Use API default"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Override the API's default rate limit for this endpoint
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="authRequired"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Requires Authentication</FormLabel>
                    <FormDescription>
                      Endpoint requires a valid API key
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="endpoint-form"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? endpoint
                ? "Updating..."
                : "Creating..."
              : endpoint
              ? "Update Endpoint"
              : "Create Endpoint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApiDetail;