import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useApi } from "../contexts/api-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import BasicInfoForm from "../components/create-api/basic-info-form"
import PricingForm from "../components/create-api/pricing-form"
import DocumentationEditor from "../components/create-api/documentation-editor"
import "./editor.css"

const INITIAL_FORM_DATA = {
  name: "Sample API",
  baseUrl: "https://example.com",
  description: "This is a sample API",
  documentation: "",
  category: "GENERAL",
  pricingModel: "FREE",
  price: null,
  billingCycle: "MONTHLY",
}

function CreateApi() {
  const navigate = useNavigate()
  const { createApi, loading } = useApi()
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [activeTab, setActiveTab] = useState("basic")
  const [editorRef, setEditorRef] = useState(null)

  // Form field change handler
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Update form data
  const updateFormData = (newData) => {
    setFormData((prev) => ({ ...prev, ...newData }))
  }

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.baseUrl) {
      toast.error("Validation Error", {
        description: "Please fill in all required fields",
      })
      return
    }

    // Validate price for PAID models
    if (
      (formData.pricingModel === "PAID" || formData.pricingModel === "SUBSCRIPTION") &&
      (formData.price === null || formData.price === undefined)
    ) {
      toast.error("Validation Error", {
        description: "Price is required for paid models.",
      })
      return
    }

    // Get the documentation content from the editor
    const documentationContent = editorRef ? editorRef.innerHTML : formData.documentation

    try {
      // Prepare the API data in the required format
      const apiData = {
        ...formData,
        documentation: documentationContent,
        price: formData.pricingModel === "FREE" ? null : formData.price,
        billingCycle: formData.pricingModel === "FREE" ? null : formData.billingCycle,
      }

      const newApi = await createApi(apiData)
      if (newApi) {
        navigate(`/apis/${newApi.id}`)
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to create API. Please try again.",
      })
      console.error("API creation error:", error)
    }
  }

  // Form validation
  const isFormValid = () => {
    if (!formData.name || !formData.baseUrl) return false
    if (
      (formData.pricingModel === "PAID" || formData.pricingModel === "SUBSCRIPTION") &&
      (formData.price === null || formData.price === undefined)
    )
      return false
    return true
  }

  // Navigate to next tab if validation passes
  const goToNextTab = (currentTab) => {
    if (currentTab === "basic") {
      if (!formData.name || !formData.baseUrl) {
        toast.error("Validation Error", {
          description: "Please fill in all required fields",
        })
        return
      }
      setActiveTab("pricing")
    } else if (currentTab === "pricing") {
      if (
        (formData.pricingModel === "PAID" || formData.pricingModel === "SUBSCRIPTION") &&
        (!formData.price || formData.price <= 0)
      ) {
        toast.error("Validation Error", {
          description: "Please enter a valid price for your paid API",
        })
        return
      }
      setActiveTab("documentation")
    }
  }

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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="pricing">Pricing & Access</TabsTrigger>
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
                <BasicInfoForm formData={formData} handleChange={handleChange} />
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
                <Button variant="outline" onClick={() => setActiveTab("pricing")}>
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
  )
}

export default CreateApi

