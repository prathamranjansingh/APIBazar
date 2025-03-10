import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

const httpMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"];

// Form validation schema
const endpointSchema = z.object({
  path: z.string().min(1, "Path is required").startsWith("/", "Path must start with /"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  description: z.string().optional(),
  rateLimit: z.number().min(1, "Rate limit must be at least 1").optional().nullable(),
  authRequired: z.boolean().default(true),
  deprecated: z.boolean().default(false),
  requestBodySchema: z.string().optional(),
  responseBodySchema: z.string().optional(),
  cachingEnabled: z.boolean().default(false),
  cacheDuration: z.number().min(0).optional().nullable(),
});

const EndpointForm = ({ endpoint, open, onOpenChange, onSubmit, isSubmitting }) => {
  const [activeTab, setActiveTab] = useState("basic");
  const [isAuthRequired, setIsAuthRequired] = useState(endpoint?.authRequired ?? true);
  const [isCachingEnabled, setIsCachingEnabled] = useState(endpoint?.cachingEnabled ?? false);

  const defaultValues = {
    path: endpoint?.path || "/",
    method: endpoint?.method || "GET",
    description: endpoint?.description || "",
    rateLimit: endpoint?.rateLimit || null,
    authRequired: endpoint?.authRequired ?? true,
    deprecated: endpoint?.deprecated ?? false,
    requestBodySchema: endpoint?.requestBodySchema || "",
    responseBodySchema: endpoint?.responseBodySchema || "",
    cachingEnabled: endpoint?.cachingEnabled ?? false,
    cacheDuration: endpoint?.cacheDuration || null,
  };

  const form = useForm({
    resolver: zodResolver(endpointSchema),
    defaultValues,
    mode: "onSubmit", // Ensure form only submits on explicit submit
  });

  // Reset form when dialog opens with different endpoint
  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
      setIsAuthRequired(defaultValues.authRequired);
      setIsCachingEnabled(defaultValues.cachingEnabled);
    }
  }, [open, form, defaultValues]);

  const handleSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      // Only allow closing if not submitting
      if (!isSubmitting || !isOpen) {
        onOpenChange(isOpen);
      }
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {endpoint ? "Edit Endpoint" : "Add New Endpoint"}
          </DialogTitle>
          <DialogDescription>
            {endpoint
              ? "Modify the details of this endpoint."
              : "Create a new endpoint for your API."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="pt-2">
              <TabsList className="mb-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                <TabsTrigger value="schema">Schema</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
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
                            {httpMethods.map((method) => (
                              <SelectItem key={method} value={method}>
                                {method}
                              </SelectItem>
                            ))}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="authRequired"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div>
                          <FormLabel>Requires Authentication</FormLabel>
                          <FormDescription>
                            Endpoint requires valid API key
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              setIsAuthRequired(checked);
                            }}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deprecated"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div>
                          <FormLabel>Deprecated</FormLabel>
                          <FormDescription>
                            Mark as deprecated
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
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
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
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          value={field.value || ""}
                          placeholder="Use API default"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        Override default API rate limit for this endpoint
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cachingEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <div>
                        <FormLabel>Enable Caching</FormLabel>
                        <FormDescription>
                          Cache responses to improve performance
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            setIsCachingEnabled(checked);
                          }}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {isCachingEnabled && (
                  <FormField
                    control={form.control}
                    name="cacheDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cache Duration (seconds)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                            value={field.value || ""}
                            placeholder="60"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </TabsContent>

              <TabsContent value="schema" className="space-y-4">
                <FormField
                  control={form.control}
                  name="requestBodySchema"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Body Schema (JSON)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder='{ "type": "object", "properties": { ... } }'
                          rows={5}
                          className="font-mono text-sm"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        JSON Schema format describing the request payload
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="responseBodySchema"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Response Body Schema (JSON)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder='{ "type": "object", "properties": { ... } }'
                          rows={5}
                          className="font-mono text-sm"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        JSON Schema format describing the response payload
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">↻</span>
                    {endpoint ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  endpoint ? "Update Endpoint" : "Create Endpoint"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EndpointForm;