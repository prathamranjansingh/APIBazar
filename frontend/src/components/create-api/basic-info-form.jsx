import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

// Category options
const CATEGORIES = [
  { value: "GENERAL", label: "General" },
  { value: "FINANCE", label: "Finance" },
  { value: "WEATHER", label: "Weather" },
  { value: "SOCIAL", label: "Social" },
  { value: "ECOMMERCE", label: "E-Commerce" },
  { value: "COMMUNICATION", label: "Communication" },
  { value: "DATA", label: "Data & Analytics" },
  { value: "OTHER", label: "Other" },
]

function BasicInfoForm({ formData, handleChange }) {
  return (
    <>
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
          {CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
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
        <p className="text-sm text-muted-foreground">The base URL for your API (e.g., https://api.example.com)</p>
      </div>
    </>
  )
}

export default BasicInfoForm

