import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, RefreshCw } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const webhookFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  url: z.string().url("Must be a valid URL"),
  secret: z.string().min(8, "Secret must be at least 8 characters"),
  events: z.array(z.string()).min(1, "Select at least one event"),
});

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

const ApiWebhooksPage = () => {
  const { apiId } = useParams();
  const { getAccessTokenSilently } = useAuth0();
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ isOpen: false, isEditing: false, webhook: null });
  const [error, setError] = useState(null); // Add error state

  const availableEvents = [
    { id: "api_call", label: "API Call" },
    { id: "subscription_updated", label: "Subscription Updated" },
    { id: "payment_received", label: "Payment Received" },
    { id: "error_occurred", label: "Error Occurred" },
  ];

  const form = useForm({
    resolver: zodResolver(webhookFormSchema),
    defaultValues: { name: "", url: "", secret: "", events: [] },
  });

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      setError(null); // Reset error state
      const token = await getAccessTokenSilently();
      const response = await axios.get(`${API_BASE_URL}/webhooks/apis/${apiId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWebhooks(Array.isArray(response.data) ? response.data : response.data.webhooks || []);
    } catch (error) {
      console.error("Error fetching webhooks:", error);
      setError("Failed to fetch webhooks. Please try again."); // Set error state
      toast.error("Failed to fetch webhooks");
      setWebhooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWebhooks(); }, [apiId]);

  const handleSubmit = async (data) => {
    try {
      const token = await getAccessTokenSilently();
      const method = modalState.isEditing ? "put" : "post";
      const url = modalState.isEditing 
        ? `${API_BASE_URL}/webhooks/apis/${apiId}/${modalState.webhook.id}` 
        : `${API_BASE_URL}/webhooks/apis/${apiId}`;

      await axios[method](url, data, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Webhook ${modalState.isEditing ? "updated" : "created"} successfully`);
      fetchWebhooks();
      setModalState({ isOpen: false, isEditing: false, webhook: null });
      form.reset();
    } catch (error) {
      console.error("Error saving webhook:", error);
      setError(`Failed to ${modalState.isEditing ? "update" : "create"} webhook. Please try again.`);
      toast.error(`Failed to ${modalState.isEditing ? "update" : "create"} webhook`);
    }
  };

  const handleDelete = async (webhookId) => {
    if (confirm("Are you sure you want to delete this webhook?")) {
      try {
        const token = await getAccessTokenSilently();
        await axios.delete(`${API_BASE_URL}/webhooks/apis/${apiId}/${webhookId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Webhook deleted successfully");
        fetchWebhooks();
      } catch (error) {
        console.error("Error deleting webhook:", error);
        setError("Failed to delete webhook. Please try again.");
        toast.error("Failed to delete webhook");
      }
    }
  };

  const openEditModal = (webhook) => {
    setModalState({ isOpen: true, isEditing: true, webhook });
    form.reset({
      name: webhook.name,
      url: webhook.url,
      secret: webhook.secret,
      events: webhook.events || [],
    });
  };

  const openCreateModal = () => {
    setModalState({ isOpen: true, isEditing: false, webhook: null });
    form.reset({
      name: "",
      url: "",
      secret: "",
      events: [],
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">API Webhooks</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchWebhooks} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Add Webhook
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {/* Webhooks List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </div>
      ) : !Array.isArray(webhooks) ? (
        <Card className="text-center py-10">
          <CardContent>
            <p className="text-muted-foreground">Error loading webhooks data: Invalid format</p>
            <Button onClick={fetchWebhooks} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : webhooks.length === 0 ? (
        <Card className="text-center py-10">
          <CardContent>
            <p className="text-muted-foreground">No webhooks found for this API</p>
            <Button onClick={openCreateModal} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create your first webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader>
                <CardTitle className="truncate">{webhook.name}</CardTitle>
                <CardDescription className="truncate">{webhook.url}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-2">
                  {Array.isArray(webhook.events) ? (
                    webhook.events.map((event) => (
                      <Badge key={event} variant="secondary">
                        {event}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No events configured</p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Secret:</span>{" "}
                  {webhook.secret ? webhook.secret.substring(0, 3) + "•".repeat(8) : "No secret configured"}
                </p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="icon" onClick={() => openEditModal(webhook)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => handleDelete(webhook.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Webhook Dialog */}
      <Dialog open={modalState.isOpen} onOpenChange={(isOpen) => setModalState({ ...modalState, isOpen })}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{modalState.isEditing ? "Edit Webhook" : "Create Webhook"}</DialogTitle>
            <DialogDescription>
              {modalState.isEditing ? "Update your webhook configuration." : "Create a new webhook to get notified when events occur."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Payment Webhook" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://your-site.com/webhook" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="secret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret</FormLabel>
                    <FormControl>
                      <Input placeholder="your-webhook-secret" {...field} />
                    </FormControl>
                    <FormDescription>
                      This will be used to sign the webhook payload.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="events"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel>Events</FormLabel>
                      <FormDescription>
                        Select events that trigger this webhook
                      </FormDescription>
                    </div>
                    {availableEvents.map((event) => (
                      <FormField
                        key={event.id}
                        control={form.control}
                        name="events"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={event.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(event.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, event.id])
                                      : field.onChange(
                                          field.value?.filter((value) => value !== event.id)
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{event.label}</FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setModalState({ ...modalState, isOpen: false })}>
                  Cancel
                </Button>
                <Button type="submit">{modalState.isEditing ? "Save Changes" : "Create Webhook"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApiWebhooksPage;