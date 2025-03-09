import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DocumentationEditor } from "./documentation-editor"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const CATEGORIES = [
  { id: "GENERAL", name: "General" },
  { id: "FINANCE", name: "Finance" },
  { id: "WEATHER", name: "Weather" },
  { id: "SOCIAL", name: "Social Media" },
  { id: "ECOMMERCE", name: "E-Commerce" },
  { id: "DATA", name: "Data Processing" },
  { id: "AI", name: "Artificial Intelligence" },
]

export function EditApiDialog({ api, open, onOpenChange, onSubmit }) {
  const [formData, setFormData] = useState({
    name: api.name || "",
    description: api.description || "",
    category: api.category || "GENERAL",
    documentation: api.documentation || "",
    pricingModel: api.pricingModel || "FREE",
    price: api.price || "",
    baseUrl: api.baseUrl || "",
    rateLimit: api.rateLimit || 100,
  })

  const [editorRef, setEditorRef] = useState(null)
  const [activeTab, setActiveTab] = useState("basic")

  // Reset form data when the API changes
  useEffect(() => {
    setFormData({
      name: api.name || "",
      description: api.description || "",
      category: api.category || "GENERAL",
      documentation: api.documentation || "",
      pricingModel: api.pricingModel || "FREE",
      price: api.price || "",
      baseUrl: api.baseUrl || "",
      rateLimit: api.rateLimit || 100,
    })
  }, [api])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePricingChange = (value) => {
    setFormData(prev => ({
      ...prev,
      pricingModel: value,
      price: value === "FREE" ? null : prev.price
    }))
  }

  const handleRateLimitChange = (values) => {
    setFormData(prev => ({ ...prev, rateLimit: values[0] }))
  }

  const handleSubmit = () => {
    // Get documentation content from editor if available
    const documentationContent = editorRef ? editorRef.innerHTML : formData.documentation
    // Prepare data for submission
    const submitData = {
      ...formData,
      documentation: documentationContent,
      price: formData.pricingModel === "FREE" ? null :
        formData.price !== "" ? parseFloat(formData.price) : null
    }
    onSubmit(submitData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit API</DialogTitle>
          <DialogDescription>
            Update the details of your API
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="pricing">Pricing & Access</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">API Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="My Awesome API"
                required
              />
              <p className="text-sm text-muted-foreground">A descriptive name for your API</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                name="baseUrl"
                value={formData.baseUrl}
                onChange={handleChange}
                placeholder="https://api.example.com"
                required
              />
              <p className="text-sm text-muted-foreground">
                The root URL for your API, without any path components
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Categorizing your API helps users discover it more easily
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what your API does..."
                rows={4}
                required
              />
              <p className="text-sm text-muted-foreground">
                A concise description of your API's purpose and features
              </p>
            </div>
            <div className="space-y-2">
              <Label>Documentation</Label>
              <DocumentationEditor
                content={formData.documentation}
                onChange={(content) => setFormData(prev => ({ ...prev, documentation: content }))}
                setEditorRef={setEditorRef}
              />
              <p className="text-sm text-muted-foreground">
                Comprehensive documentation helps users understand how to use your API
              </p>
            </div>
          </TabsContent>

          {/* Pricing & Access Tab */}
          <TabsContent value="pricing" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Pricing Model</Label>
              <RadioGroup
                value={formData.pricingModel}
                onValueChange={handlePricingChange}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="FREE" id="pricing-free" />
                  <Label htmlFor="pricing-free">Free - Anyone can use your API without payment</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PAID" id="pricing-paid" />
                  <Label htmlFor="pricing-paid">Paid - Users pay a one-time fee for access</Label>
                </div>
              </RadioGroup>
            </div>
            {formData.pricingModel === "PAID" && (
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <div className="flex">
                  <span className="bg-muted px-3 py-2 rounded-l-md border border-r-0 border-input">$</span>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="9.99"
                    className="rounded-l-none"
                    required={formData.pricingModel === "PAID"}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Set the price users will pay to access your API
                </p>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="rate-limit">Rate Limit (requests per minute)</Label>
                <span className="text-sm font-medium">{formData.rateLimit} req/min</span>
              </div>
              <Slider
                id="rate-limit"
                min={10}
                max={1000}
                step={10}
                value={[formData.rateLimit]}
                onValueChange={handleRateLimitChange}
              />
              <p className="text-sm text-muted-foreground">
                Set how many requests a user can make per minute
              </p>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}