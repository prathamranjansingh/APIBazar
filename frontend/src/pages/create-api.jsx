import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import BasicInfoForm from "../components/create-api/basic-info-form";
import PricingForm from "../components/create-api/pricing-form";
import DocumentationEditor from "../components/create-api/documentation-editor";
import EndpointsForm from "../components/create-api/endpoints-form";
import "./editor.css";
import { useAuthenticatedApi } from "../hooks/useAuthenticatedApi";

const CATEGORIES = [
  { id: "GENERAL", name: "General" },
  { id: "FINANCE", name: "Finance" },
  { id: "WEATHER", name: "Weather" },
  { id: "SOCIAL", name: "Social Media" },
  { id: "ECOMMERCE", name: "E-Commerce" },
  { id: "DATA", name: "Data Processing" },
  { id: "AI", name: "Artificial Intelligence" },
];

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

const INITIAL_FORM_DATA = {
  name: "",
  baseUrl: "",
  description: "",
  documentation: "",
  category: "GENERAL",
  pricingModel: "FREE",
  price: null,
  rateLimit: 100, // Default rate limit per hour
  endpoints: [],
};

function CreateApi() {
  const navigate = useNavigate();
  const {post} = useAuthenticatedApi();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [activeTab, setActiveTab] = useState("basic");
  const [editorRef, setEditorRef] = useState(null);

  // Form field change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Update form data
  const updateFormData = (newData) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  // Add endpoint to the API
  const addEndpoint = (endpoint) => {
    setFormData((prev) => ({
      ...prev,
      endpoints: [...prev.endpoints, endpoint],
    }));
  };

  // Remove endpoint from the API
  const removeEndpoint = (index) => {
    setFormData((prev) => ({
      ...prev,
      endpoints: prev.endpoints.filter((_, i) => i !== index),
    }));
  };

  // Update endpoint in the API
  const updateEndpoint = (index, updatedEndpoint) => {
    setFormData((prev) => ({
      ...prev,
      endpoints: prev.endpoints.map((endpoint, i) =>
        i === index ? updatedEndpoint : endpoint
      ),
    }));
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.baseUrl || !formData.description) {
      toast.error("Validation Error", {
        description: "Please fill in all required fields",
      });
      return;
    }

    // Validate price for PAID models
    if (
      formData.pricingModel === "PAID" &&
      (formData.price === null || formData.price <= 0)
    ) {
      toast.error("Validation Error", {
        description: "Price is required for paid APIs and must be greater than zero.",
      });
      return;
    }

    // Get the documentation content from the editor
    const documentationContent = editorRef ? editorRef.innerHTML : formData.documentation;

    try {
      setLoading(true);

      // Prepare the API data in the required format
      const apiData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        documentation: documentationContent || "<p>No documentation provided</p>",
        pricingModel: formData.pricingModel,
        price: formData.pricingModel === "FREE" ? null : parseFloat(formData.price),
        baseUrl: formData.baseUrl,
        rateLimit: parseInt(formData.rateLimit),
      };

      // Step 1: Create the API using the proper endpoint
      const apiResponse = await post(`${API_BASE_URL}/apis`, apiData, { requireAuth: true });
      const newApi = apiResponse.data;

      // Step 2: If API has endpoints, create them
      // Step 2: If API has endpoints, create them
      if (formData.endpoints.length > 0) {
        try {
          // Map through each endpoint and prepare the data
          const endpointPromises = formData.endpoints.map((endpoint) => {
            // Prepare the endpoint data in the correct format
            const endpointData = {
              name: endpoint.name || `${endpoint.method} ${endpoint.path}`,
              method: endpoint.method,
              path: endpoint.path,
              description: endpoint.description || "",
              rateLimit: endpoint.rateLimit || null,
            };
      
            // Safely handle JSON parsing for request body
            if (endpoint.requestBody && endpoint.requestBody.trim()) {
              try {
                endpointData.requestBody = JSON.parse(endpoint.requestBody);
              } catch (err) {
                console.warn(`Invalid request body JSON for endpoint ${endpoint.path}:`, err);
                // Use an empty object as fallback
                endpointData.requestBody = {};
              }
            }
      
            // Safely handle JSON parsing for response example
            if (endpoint.responseExample && endpoint.responseExample.trim()) {
              try {
                endpointData.responseSchema = JSON.parse(endpoint.responseExample);
              } catch (err) {
                console.warn(`Invalid response example JSON for endpoint ${endpoint.path}:`, err);
                // Use an empty object as fallback
                endpointData.responseSchema = {};
              }
            }
      
            // Add parameters if they exist
            if (endpoint.parameters && endpoint.parameters.length > 0) {
              endpointData.parameters = endpoint.parameters;
            }
      
            console.log("Creating endpoint with data:", endpointData);
      
            // Make the POST request to create the endpoint
            return post(`${API_BASE_URL}/apis/${newApi.id}/endpoints`, endpointData, { requireAuth: true });
          });
      
          // Wait for all endpoint creation requests to complete
          await Promise.all(endpointPromises);
        } catch (endpointError) {
          console.error("Error creating endpoints:", endpointError);
      
          // Show a warning toast but don't stop execution - the API was already created
          toast.error("Warning", {
            description: "API was created but there was an error adding some endpoints.",
          });
        }
      }


      toast.success("API Created", {
        description: `${formData.name} has been created successfully.`,
      });
      navigate(`/apis/${newApi.id}`);
    } catch (error) {
      console.error("API creation error:", error);
      toast.error("Error", {
        description: error.response?.data?.message || "Failed to create API. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Form validation
  const isFormValid = () => {
    if (!formData.name || !formData.baseUrl || !formData.description) return false;
    if (formData.pricingModel === "PAID" && (formData.price === null || formData.price <= 0)) return false;
    return true;
  };

  // Navigate to next tab if validation passes
  const goToNextTab = (currentTab) => {
    if (currentTab === "basic") {
      if (!formData.name || !formData.baseUrl || !formData.description) {
        toast.error("Validation Error", {
          description: "Please fill in all required fields",
        });
        return;
      }
      setActiveTab("pricing");
    } else if (currentTab === "pricing") {
      if (
        formData.pricingModel === "PAID" &&
        (!formData.price || formData.price <= 0)
      ) {
        toast.error("Validation Error", {
          description: "Please enter a valid price for your paid API",
        });
        return;
      }
      setActiveTab("endpoints");
    } else if (currentTab === "endpoints") {
      setActiveTab("documentation");
    }
  };

  return (
    <div className="space-y-6 font-inter">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/apis")} aria-label="Go back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-3xl font-bold tracking-tight font-bricolage">Create New API</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="pricing">Pricing & Access</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Provide the basic details about your API</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <BasicInfoForm
                  formData={formData}
                  handleChange={handleChange}
                  categories={CATEGORIES}
                  updateFormData={updateFormData}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => navigate("/apis")}>
                  Cancel
                </Button>
                <Button type="button" onClick={() => goToNextTab("basic")}>
                  Next
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Pricing & Access Tab */}
          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Access</CardTitle>
                <CardDescription>Configure how users will access and pay for your API</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PricingForm formData={formData} updateFormData={updateFormData} handleChange={handleChange} />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("basic")}>
                  Back
                </Button>
                <Button type="button" onClick={() => goToNextTab("pricing")}>
                  Next
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Endpoints Tab */}
          <TabsContent value="endpoints">
            <Card>
              <CardHeader>
                <CardTitle>API Endpoints</CardTitle>
                <CardDescription>Define the endpoints that your API exposes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <EndpointsForm
                  endpoints={formData.endpoints}
                  addEndpoint={addEndpoint}
                  removeEndpoint={removeEndpoint}
                  updateEndpoint={updateEndpoint}
                  baseUrl={formData.baseUrl}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("pricing")}>
                  Back
                </Button>
                <Button type="button" onClick={() => goToNextTab("endpoints")}>
                  Next
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="documentation">
            <Card>
              <CardHeader>
                <CardTitle>Documentation</CardTitle>
                <CardDescription>Provide documentation for your API using the rich text editor below</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <DocumentationEditor formData={formData} updateFormData={updateFormData} setEditorRef={setEditorRef} />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("endpoints")}>
                  Back
                </Button>
                <Button type="submit" disabled={!isFormValid() || loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create API"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}

export default CreateApi;