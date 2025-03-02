import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useApi } from "../contexts/api-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

function CreateApi() {
  const navigate = useNavigate()
  const { createApi, loading } = useApi()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "GENERAL",
    documentation: "",
    pricingModel: "FREE",
    baseUrl: "",
  })
  const [activeTab, setActiveTab] = useState("basic")

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePricingChange = (value) => {
    setFormData((prev) => ({ ...prev, pricingModel: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form
    if (!formData.name || !formData.baseUrl) {
      toast.error("Validation Error", {
        description: "Please fill in all required fields",
      })
      return
    }

    const newApi = await createApi(formData)
    if (newApi) {
      navigate(`/apis/${newApi.id}`)
    }
  }

  const isFormValid = () => {
    return formData.name && formData.baseUrl
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/apis")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Create New API</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="pricing">Pricing & Access</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Provide the basic details about your API</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    API Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="My Awesome API"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe what your API does..."
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    name="category"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="GENERAL">General</option>
                    <option value="FINANCE">Finance</option>
                    <option value="WEATHER">Weather</option>
                    <option value="SOCIAL">Social</option>
                    <option value="ECOMMERCE">E-Commerce</option>
                    <option value="COMMUNICATION">Communication</option>
                    <option value="DATA">Data & Analytics</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baseUrl">
                    Base URL <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="baseUrl"
                    name="baseUrl"
                    placeholder="https://api.example.com"
                    value={formData.baseUrl}
                    onChange={handleChange}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    The base URL for your API (e.g., https://api.example.com)
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => navigate("/apis")}>
                  Cancel
                </Button>
                <Button type="button" onClick={() => setActiveTab("pricing")}>
                  Next
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Access</CardTitle>
                <CardDescription>Configure how users will access and pay for your API</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Pricing Model</Label>
                  <RadioGroup value={formData.pricingModel} onValueChange={handlePricingChange} className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="FREE" id="free" />
                      <Label htmlFor="free" className="font-normal cursor-pointer">
                        Free - Anyone can use your API without payment
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="PAID" id="paid" />
                      <Label htmlFor="paid" className="font-normal cursor-pointer">
                        Paid - Users pay per API call or in packages
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="SUBSCRIPTION" id="subscription" />
                      <Label htmlFor="subscription" className="font-normal cursor-pointer">
                        Subscription - Users pay a recurring fee for access
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.pricingModel !== "FREE" && (
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-sm">
                      You'll be able to configure detailed pricing options after creating your API.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("basic")}>
                  Back
                </Button>
                <Button type="button" onClick={() => setActiveTab("documentation")}>
                  Next
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="documentation">
            <Card>
              <CardHeader>
                <CardTitle>Documentation</CardTitle>
                <CardDescription>Provide documentation for your API</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="documentation">Documentation</Label>
                  <Textarea
                    id="documentation"
                    name="documentation"
                    placeholder="# API Documentation

Use Markdown to document your API. For example:

## Authentication
Describe how to authenticate with your API.

## Endpoints
List and describe your API endpoints."
                    value={formData.documentation}
                    onChange={handleChange}
                    rows={10}
                    className="font-mono"
                  />
                  <p className="text-sm text-muted-foreground">You can use Markdown to format your documentation</p>
                </div>
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

