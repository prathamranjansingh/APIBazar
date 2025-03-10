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

  // Explicitly set mode to onSubmit to prevent auto-submission
  const form = useForm({
    resolver: zodResolver(apiSchema),
    defaultValues,
    mode: "onSubmit", // Critical: prevents auto-submission
    reValidateMode: "onSubmit",
  });

  const handlePricingChange = (value) => {
    setPricingModel(value);
    if (value === "FREE") {
      form.setValue("price", null);
    }
  };

  // Explicitly handle form submission
  const handleFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form
        id="api-edit-form"
        onSubmit={(e) => {
          e.preventDefault(); // Ensure form doesn't submit automatically
          form.handleSubmit(handleFormSubmit)(e);
        }}
      >
        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="pricing">Pricing & Limits</TabsTrigger>
                <TabsTrigger value="docs">Documentation</TabsTrigger>
              </TabsList>
              {/* Rest of form content... */}
              {/* Basic tab */}
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
                {/* Other fields... */}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
};

export default ApiEditForm;