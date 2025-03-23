"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { useAuth0 } from "@auth0/auth0-react"
import axios from "axios"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, Edit, Plus, RefreshCw, Play, Check, X, Bell, ArrowLeft } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"

// Define form schema based on your backend validation
const webhookFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  url: z.string().url("Must be a valid URL"),
  secret: z.string().min(8, "Secret must be at least 8 characters"),
  events: z.array(z.string()).min(1, "Select at least one event"),
  isActive: z.boolean().default(true),
})

const ApiWebhooksPage = () => {
  const { apiId } = useParams()
  const { getAccessTokenSilently } = useAuth0()
  const [webhooks, setWebhooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentWebhook, setCurrentWebhook] = useState(null)
  const [error, setError] = useState(null)

  // Available events with descriptions
  const availableEvents = [
    { id: "api_call", label: "API Call", description: "When your API is called by a consumer" },
    {
      id: "subscription_updated",
      label: "Subscription Updated",
      description: "When someone subscribes or unsubscribes",
    },
    { id: "payment_received", label: "Payment Received", description: "When a payment is processed" },
    { id: "error_occurred", label: "Error Occurred", description: "When an error happens during API usage" },
  ]

  const form = useForm({
    resolver: zodResolver(webhookFormSchema),
    defaultValues: {
      name: "",
      url: "",
      secret: "",
      events: [],
      isActive: true,
    },
  })

  const fetchWebhooks = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = await getAccessTokenSilently()

      // Use VITE_BACKEND_URL in the API endpoint
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/webhooks/apis/${apiId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json", // Explicitly request JSON response
        },
      })

      // Check if response is valid before processing
      if (response.headers["content-type"]?.includes("application/json")) {
        const webhookData = response.data

        if (Array.isArray(webhookData)) {
          setWebhooks(webhookData)
        } else if (webhookData && typeof webhookData === "object") {
          if (webhookData.webhooks && Array.isArray(webhookData.webhooks)) {
            setWebhooks(webhookData.webhooks)
          } else {
            console.error("Unexpected API response format:", webhookData)
            setWebhooks([])
            setError("API returned unexpected data format")
          }
        } else {
          console.error("Invalid webhook data received:", webhookData)
          setWebhooks([])
          setError("Invalid webhook data received")
        }
      } else {
        // Not JSON data
        console.error("Server returned non-JSON response")
        setWebhooks([])
        setError("Server returned HTML instead of JSON. API endpoint may be incorrect.")
      }
    } catch (error) {
      console.error("Error fetching webhooks:", error)

      // Better error handling
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 404) {
          setError("API endpoint not found. Check API configuration.")
        } else {
          setError(`Failed to fetch webhooks: Server returned ${error.response.status}`)
        }
      } else if (error.request) {
        // The request was made but no response was received
        setError("Failed to fetch webhooks: No response from server")
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(`Error setting up request: ${error.message}`)
      }

      setWebhooks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWebhooks()
  }, [apiId])

  const handleCreateSubmit = async (data) => {
    try {
      const token = await getAccessTokenSilently()
      // Use VITE_BACKEND_URL in the API endpoint
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/webhooks/apis/${apiId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success("Webhook created successfully")
      fetchWebhooks()
      setIsCreating(false)
      form.reset()
    } catch (error) {
      console.error("Error creating webhook:", error)
      toast.error(`Failed to create webhook: ${error.message}`)
    }
  }

  const handleUpdateSubmit = async (data) => {
    try {
      const token = await getAccessTokenSilently()
      // Use VITE_BACKEND_URL in the API endpoint
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/webhooks/apis/${apiId}/${currentWebhook.id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success("Webhook updated successfully")
      fetchWebhooks()
      setIsEditing(false)
      setCurrentWebhook(null)
      form.reset()
    } catch (error) {
      console.error("Error updating webhook:", error)
      toast.error(`Failed to update webhook: ${error.message}`)
    }
  }

  const handleToggleActive = async (webhook) => {
    try {
      const token = await getAccessTokenSilently()
      // Use VITE_BACKEND_URL in the API endpoint
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/webhooks/apis/${apiId}/${webhook.id}`,
        { isActive: !webhook.isActive },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      toast.success(`Webhook ${webhook.isActive ? "deactivated" : "activated"} successfully`)
      fetchWebhooks()
    } catch (error) {
      console.error("Error updating webhook status:", error)
      toast.error(`Failed to update webhook status: ${error.message}`)
    }
  }

  const handleDelete = async (webhookId) => {
    if (confirm("Are you sure you want to delete this webhook?")) {
      try {
        const token = await getAccessTokenSilently()
        // Use VITE_BACKEND_URL in the API endpoint
        await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/webhooks/apis/${apiId}/${webhookId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        toast.success("Webhook deleted successfully")
        fetchWebhooks()
      } catch (error) {
        console.error("Error deleting webhook:", error)
        toast.error(`Failed to delete webhook: ${error.message}`)
      }
    }
  }

  const openEditModal = (webhook) => {
    setCurrentWebhook(webhook)
    form.reset({
      name: webhook.name,
      url: webhook.url,
      secret: webhook.secret || "",
      events: webhook.events || [],
      isActive: webhook.isActive,
    })
    setIsEditing(true)
  }

  const openCreateModal = () => {
    form.reset({
      name: "",
      url: "",
      secret: "",
      events: [],
      isActive: true,
    })
    setIsCreating(true)
  }

  // Helper function to render webhook status badge
  const renderStatusBadge = (webhook) => {
    // If webhook has never been triggered
    if (!webhook.lastTriggered) {
      return (
        <Badge variant="outline" className="text-xs">
          Never triggered
        </Badge>
      )
    }
    // If webhook has a status code
    if (webhook.lastStatus) {
      const isSuccess = webhook.lastStatus >= 200 && webhook.lastStatus < 300
      if (isSuccess) {
        return (
          <Badge variant="success" className="bg-green-100 text-green-800 text-xs">
            <Check className="h-3 w-3 mr-1" /> Success ({webhook.lastStatus})
          </Badge>
        )
      } else {
        return (
          <Badge variant="destructive" className="text-xs">
            <X className="h-3 w-3 mr-1" /> Failed ({webhook.lastStatus})
          </Badge>
        )
      }
    }
    return (
      <Badge variant="outline" className="text-xs">
        Unknown status
      </Badge>
    )
  }

  return (
    <div className="container mx-auto py-4 px-4 md:py-6 md:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 md:mb-6">
        <Link to={`/apis/${apiId}`} className="text-muted-foreground hover:text-foreground">
          <Button variant="ghost" size="sm" className="pl-0">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to API
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold">API Webhooks</h1>
      </div>
      <div className="mb-6">
        <p className="text-muted-foreground">
          Webhooks allow you to receive real-time notifications when events happen in your API. Configure endpoints to
          receive HTTP requests when users interact with your API.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Tabs defaultValue="active" className="w-full sm:w-[400px]">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="active" className="flex-1 sm:flex-none">
              Active
            </TabsTrigger>
            <TabsTrigger value="all" className="flex-1 sm:flex-none">
              All Webhooks
            </TabsTrigger>
          </TabsList>
          <TabsContent value="active">{/* Only show active webhooks */}</TabsContent>
          <TabsContent value="all">{/* Show all webhooks */}</TabsContent>
        </Tabs>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={fetchWebhooks} disabled={loading} className="flex-1 sm:flex-none">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={openCreateModal} className="flex-1 sm:flex-none">
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
        <Card className="text-center py-6 sm:py-10">
          <CardContent>
            <p className="text-muted-foreground">Error loading webhooks data: Invalid format</p>
            <Button onClick={fetchWebhooks} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : webhooks.length === 0 ? (
        <Card className="text-center py-6 sm:py-10">
          <CardContent>
            <Bell className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-base sm:text-lg font-medium mb-2">No webhooks found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create webhooks to receive real-time notifications when events happen in your API.
            </p>
            <Button onClick={openCreateModal}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {webhooks.map((webhook) => (
            <Card key={webhook.id} className={`${webhook.isActive ? "" : "opacity-70"} h-full flex flex-col`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate text-base sm:text-lg">{webhook.name}</CardTitle>
                    <CardDescription className="truncate text-xs sm:text-sm">{webhook.url}</CardDescription>
                  </div>
                  <Switch
                    checked={webhook.isActive}
                    onCheckedChange={() => handleToggleActive(webhook)}
                    aria-label="Toggle webhook active state"
                  />
                </div>
              </CardHeader>
              <CardContent className="pb-2 flex-1">
                <div className="flex flex-wrap gap-1 mb-3">
                  {Array.isArray(webhook.events) ? (
                    webhook.events.map((event) => (
                      <Badge key={event} variant="secondary" className="text-xs">
                        {event}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No events configured</p>
                  )}
                </div>
                {/* Status section */}
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <div className="flex items-center">
                      {webhook.isActive ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Last delivery:</span>
                    <div>{renderStatusBadge(webhook)}</div>
                  </div>
                  {webhook.lastTriggered && (
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Triggered:</span>
                      <span>{format(new Date(webhook.lastTriggered), "MMM d, yyyy HH:mm")}</span>
                    </div>
                  )}
                  {webhook.failCount > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Failures:</span>
                      <Badge
                        variant="outline"
                        className={`${webhook.failCount > 5 ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"} text-xs`}
                      >
                        {webhook.failCount} {webhook.failCount === 1 ? "failure" : "failures"}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center">
                    <span className="font-medium mr-1">Secret:</span>
                    {webhook.secret ? (
                      webhook.secret.substring(0, 3) + "•".repeat(8)
                    ) : (
                      <span className="italic">Not configured</span>
                    )}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-2 mt-auto">
                {webhook.failCount > 5 && (
                  <Button
                    variant="outline"
                    size="icon"
                    title="Reset fail count"
                    onClick={() => handleToggleActive({ ...webhook, isActive: true })}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="outline" size="icon" onClick={() => openEditModal(webhook)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => handleDelete(webhook.id)} disabled={loading}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      {/* Test Webhook Button */}
      <div className="mt-6 sm:mt-8">
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Test Your Webhooks</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Send a test event to all active webhooks to verify your integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Testing will send a sample payload to all active webhooks. Make sure your endpoint is ready to receive
                and process webhook events.
              </p>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const token = await getAccessTokenSilently()
                      await axios.post(
                        `${import.meta.env.VITE_BACKEND_URL}/webhooks/apis/${apiId}/test`,
                        {
                          event: "api_call",
                          payload: {
                            message: "This is a test webhook event",
                            timestamp: new Date().toISOString(),
                          },
                        },
                        {
                          headers: { Authorization: `Bearer ${token}` },
                        },
                      )
                      toast.success("Test webhooks sent successfully")
                      // Refresh webhook status after 2 seconds
                      setTimeout(() => fetchWebhooks(), 2000)
                    } catch (error) {
                      console.error("Error testing webhooks:", error)
                      toast.error(`Failed to test webhooks: ${error.message}`)
                    }
                  }}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Send Test Event
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Create Webhook Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Webhook</DialogTitle>
            <DialogDescription>Create a new webhook to get notified when events occur with your API.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-3 sm:space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Payment Webhook" {...field} className="text-sm" />
                    </FormControl>
                    <FormDescription className="text-xs">A descriptive name to identify this webhook</FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://your-site.com/webhook" {...field} className="text-sm" />
                    </FormControl>
                    <FormDescription className="text-xs">The URL where webhook events will be sent</FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="secret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Secret</FormLabel>
                    <FormControl>
                      <Input placeholder="your-webhook-secret" {...field} type="password" className="text-sm" />
                    </FormControl>
                    <FormDescription className="text-xs">
                      This will be used to sign the webhook payload for security verification
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Activate Webhook</FormLabel>
                      <FormDescription className="text-xs">Enable or disable this webhook</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="events"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-sm">Events</FormLabel>
                      <FormDescription className="text-xs">Select events that trigger this webhook</FormDescription>
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
                              className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mb-2"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(event.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, event.id])
                                      : field.onChange(field.value?.filter((value) => value !== event.id))
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-normal text-sm">{event.label}</FormLabel>
                                <FormDescription className="text-xs">{event.description}</FormDescription>
                              </div>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Webhook</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      {/* Edit Webhook Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Webhook</DialogTitle>
            <DialogDescription>Update your webhook configuration.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateSubmit)} className="space-y-3 sm:space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Payment Webhook" {...field} className="text-sm" />
                    </FormControl>
                    <FormDescription className="text-xs">A descriptive name to identify this webhook</FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://your-site.com/webhook" {...field} className="text-sm" />
                    </FormControl>
                    <FormDescription className="text-xs">The URL where webhook events will be sent</FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="secret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Secret</FormLabel>
                    <FormControl>
                      <Input placeholder="your-webhook-secret" {...field} type="password" className="text-sm" />
                    </FormControl>
                    <FormDescription className="text-xs">
                      This will be used to sign the webhook payload for security verification
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Activate Webhook</FormLabel>
                      <FormDescription className="text-xs">Enable or disable this webhook</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="events"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-sm">Events</FormLabel>
                      <FormDescription className="text-xs">Select events that trigger this webhook</FormDescription>
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
                              className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mb-2"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(event.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, event.id])
                                      : field.onChange(field.value?.filter((value) => value !== event.id))
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-normal text-sm">{event.label}</FormLabel>
                                <FormDescription className="text-xs">{event.description}</FormDescription>
                              </div>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      {/* Documentation Section */}
      <div className="mt-8 sm:mt-12">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Webhook Documentation</h2>
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">How to Use Webhooks</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Learn how to set up your server to receive and process webhook events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-base sm:text-lg font-medium mb-2">1. Create an Endpoint</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                  First, create an HTTP endpoint on your server that can receive POST requests.
                </p>
                <pre className="bg-slate-950 text-slate-50 p-2 sm:p-4 rounded-md overflow-x-auto text-xs sm:text-sm">
                  {`// Example Express.js endpoint
const express = require('express');
const crypto = require('crypto');
const app = express();
app.use(express.json()); // Parse JSON bodies
app.post('/webhook-receiver', (req, res) => {
  // Get the signature from headers
  const signature = req.headers['x-webhook-signature'];
  // Get event type
  const event = req.headers['x-webhook-event'];
  // Your webhook secret from the dashboard
  const secret = process.env.WEBHOOK_SECRET;
  // Verify signature if you have a secret configured
  if (secret && signature) {
    const hmac = crypto.createHmac('sha256', secret);
    const calculatedSignature = hmac.update(JSON.stringify(req.body)).digest('hex');
    if (signature !== calculatedSignature) {
      return res.status(401).send('Invalid signature');
    }
  }
  // Process the webhook based on event type
  console.log(\`Received \${event} webhook\`, req.body);
  // Do something with the data...
  // Return a 200 OK response
  res.status(200).send('Webhook received');
});
app.listen(3000, () => {
  console.log('Webhook receiver listening on port 3000');
});`}
                </pre>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-medium mb-2">2. Verify Signatures</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                  Always verify webhook signatures to ensure the request is legitimate. We send a signature in the{" "}
                  <code className="bg-muted p-1 rounded text-xs">X-Webhook-Signature</code> header.
                </p>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-medium mb-2">3. Process Different Events</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                  Each webhook will have an event type in the{" "}
                  <code className="bg-muted p-1 rounded text-xs">X-Webhook-Event</code> header. Handle each event type
                  appropriately:
                </p>
                <ul className="list-disc list-inside text-xs sm:text-sm text-muted-foreground ml-2 sm:ml-4 space-y-1">
                  {availableEvents.map((event) => (
                    <li key={event.id}>
                      <span className="font-medium">{event.id}</span>: {event.description}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-medium mb-2">4. Respond Quickly</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Your webhook endpoint should respond within 10 seconds with a 2xx status code. If your processing will
                  take longer, acknowledge the webhook first and then process asynchronously.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ApiWebhooksPage

