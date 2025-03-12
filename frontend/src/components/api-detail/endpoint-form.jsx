import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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

// Endpoint schema
const endpointSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  method: z.string().trim(),
  path: z.string().min(1).trim(),
  description: z.string().optional(),
  headers: z.any().optional().nullable(),
  requestBody: z.any().optional().nullable(),
  responseSchema: z.any().optional().nullable(),
  rateLimit: z.number().int().positive().optional().nullable(),
});

const httpMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"];

const EndpointDialog = ({ open, onOpenChange, endpoint, onSubmit, isSubmitting }) => {
  const defaultValues = {
    name: endpoint?.name || "",
    method: endpoint?.method || "GET",
    path: endpoint?.path || "/",
    description: endpoint?.description || "",
    headers: endpoint?.headers || null,
    requestBody: endpoint?.requestBody || null,
    responseSchema: endpoint?.responseSchema || null,
    rateLimit: endpoint?.rateLimit || null,
  };

  const form = useForm({
    resolver: zodResolver(endpointSchema),
    defaultValues,
    mode: "onSubmit",
  });

  return (
    <Dialog open={open} onOpenChange={(value) => !isSubmitting && onOpenChange(value)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{endpoint ? "Edit Endpoint" : "Add Endpoint"}</DialogTitle>
          <DialogDescription>
            {endpoint
              ? "Update the details of this endpoint"
              : "Create a new endpoint for your API"
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="endpoint-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endpoint Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Get User" disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                      <Input {...field} placeholder="/users/:id" disabled={isSubmitting} />
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
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="Use API default"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>Override the API's default rate limit for this endpoint</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="headers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Headers (JSON)</FormLabel>
                  <FormControl>
                    <Textarea
                      value={field.value ? JSON.stringify(field.value, null, 2) : ""}
                      onChange={(e) => {
                        try {
                          const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                          field.onChange(parsed);
                        } catch (err) {
                          console.log("Invalid JSON - will validate on submit");
                        }
                      }}
                      placeholder='{ "Content-Type": "application/json" }'
                      rows={3}
                      className="font-mono text-sm"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>Required headers for this endpoint (JSON format)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="requestBody"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Request Body Schema (JSON)</FormLabel>
                  <FormControl>
                    <Textarea
                      value={field.value ? JSON.stringify(field.value, null, 2) : ""}
                      onChange={(e) => {
                        try {
                          const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                          field.onChange(parsed);
                        } catch (err) {
                          // Allow invalid JSON during typing
                        }
                      }}
                      placeholder='{ "type": "object", "properties": { "name": { "type": "string" } } }'
                      rows={3}
                      className="font-mono text-sm"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>JSON Schema for request body</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="responseSchema"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Response Schema (JSON)</FormLabel>
                  <FormControl>
                    <Textarea
                      value={field.value ? JSON.stringify(field.value, null, 2) : ""}
                      onChange={(e) => {
                        try {
                          const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                          field.onChange(parsed);
                        } catch (err) {
                          // Allow invalid JSON during typing
                        }
                      }}
                      placeholder='{ "type": "object", "properties": { "id": { "type": "number" } } }'
                      rows={3}
                      className="font-mono text-sm"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>JSON Schema for response body</FormDescription>
                  <FormMessage />
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
              ? (endpoint ? "Updating..." : "Creating...")
              : (endpoint ? "Update Endpoint" : "Create Endpoint")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EndpointDialog;