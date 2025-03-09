import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MDEditor from "@uiw/react-md-editor";

// Form validation schema
const apiSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  version: z.string(),
  baseUrl: z.string().url("Must be a valid URL"),
  documentation: z.string().optional(),
  termsOfService: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "DEPRECATED"]),
  pricingModel: z.enum(["FREE", "PAID"]),
  price: z.number().nullable().optional(),
  rateLimit: z.number().min(1, "Rate limit must be at least 1"),
});

const ApiEditForm = ({ api, onSubmit, disabled }) => {
  const [activeTab, setActiveTab] = useState("basic");
  const [pricingModel, setPricingModel] = useState(api?.pricingModel || "FREE");

  const defaultValues = {
    name: api?.name || "",
    description: api?.description || "",
    version: api?.version || "1.0.0",
    baseUrl: api?.baseUrl || "",
    documentation: api?.documentation || "",
    termsOfService: api?.termsOfService || "",
    status: api?.status || "ACTIVE",
    pricingModel: api?.pricingModel || "FREE",
    price: api?.price || null,
    rateLimit: api?.rateLimit || 60,
  };

  const form = useForm({
    resolver: zodResolver(apiSchema),
    defaultValues,
  });

  const handlePricingChange = (value) => {
    setPricingModel(value);
    if (value === "FREE") {
      form.setValue("price", null);
    }
  };

  return (
    <Form {...form}>
      <form id="api-edit-form" onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="pricing">Pricing & Limits</TabsTrigger>
                <TabsTrigger value="docs">Documentation</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={disabled} />
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
                        <Textarea
                          {...field}
                          rows={4}
                          disabled={disabled}
                        />
                      </FormControl>
                      <FormDescription>
                        Briefly describe what your API does
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={disabled} />
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
                          disabled={disabled}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
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
                        <Input {...field} disabled={disabled} />
                      </FormControl>
                      <FormDescription>
                        The root URL for all API endpoints
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              <TabsContent value="pricing" className="space-y-4">
                <FormField
                  control={form.control}
                  name="pricingModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pricing Model</FormLabel>
                      <Select
                        disabled={disabled}
                        onValueChange={(value) => {
                          field.onChange(value);
                          handlePricingChange(value);
                        }}
                        defaultValue={field.value}
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
                            disabled={disabled}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Monthly subscription price
                        </FormDescription>
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
                          disabled={disabled}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          value={field.value}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum requests per minute
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              <TabsContent value="docs" className="space-y-4">
                <FormField
                  control={form.control}
                  name="documentation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Documentation (Markdown)</FormLabel>
                      <FormControl>
                        <div data-color-mode="light" className="dark:hidden">
                          <MDEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                            preview="edit"
                            height={300}
                          />
                        </div>
                        <div data-color-mode="dark" className="hidden dark:block">
                          <MDEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                            preview="edit"
                            height={300}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Provide detailed documentation for API consumers
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="termsOfService"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Terms of Service</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={4}
                          disabled={disabled}
                        />
                      </FormControl>
                      <FormDescription>
                        Legal terms for using your API
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
};

export default ApiEditForm;