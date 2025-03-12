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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MDEditor from "@uiw/react-md-editor";

// Form validation schema
const apiSchema = z.object({
  name: z.string().min(3).max(100).trim(),
  description: z.string().min(10).trim(),
  category: z.string().trim(),
  documentation: z.string().optional(),
  pricingModel: z.enum(["FREE", "PAID"]),
  price: z.number().positive().optional().nullable(),
  baseUrl: z.string().url(),
  rateLimit: z.number().int().positive().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "DEPRECATED"]),
});

const ApiEditForm = ({ api, onSubmit, onCancel, isSubmitting }) => {
  const [pricingModel, setPricingModel] = useState(api?.pricingModel || "FREE");

  const defaultValues = {
    name: api?.name || "",
    description: api?.description || "",
    category: api?.category || "Other",
    documentation: api?.documentation || "",
    pricingModel: api?.pricingModel || "FREE",
    price: api?.price || null,
    baseUrl: api?.baseUrl || "",
    rateLimit: api?.rateLimit || 60,
    status: api?.status || "ACTIVE",
  };

  const form = useForm({
    resolver: zodResolver(apiSchema),
    defaultValues,
    mode: "onSubmit",
  });

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
          <form id="api-edit-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Data">Data</SelectItem>
                      <SelectItem value="Communication">Communication</SelectItem>
                      <SelectItem value="Financial">Financial</SelectItem>
                      <SelectItem value="AI">AI</SelectItem>
                      <SelectItem value="Utilities">Utilities</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="baseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base URL</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormDescription>The root URL for your API endpoints</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
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
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>Maximum requests per minute</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="documentation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Documentation</FormLabel>
                  <FormControl>
                    <div className="max-h-[400px] overflow-hidden" style={{ height: '400px' }}>
                      <MDEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        height={400}
                        preview="edit"
                        visiableDragbar={false}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>Documentation in Markdown format</FormDescription>
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
        <Button type="submit" form="api-edit-form" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiEditForm;