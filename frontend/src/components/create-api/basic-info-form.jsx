import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function BasicInfoForm({ formData, handleChange, categories, updateFormData }) {
  return (
    <>
      {/* API Name Field */}
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
        <p className="text-sm text-muted-foreground">Choose a descriptive name for your API</p>
      </div>

      {/* Base URL Field */}
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
        <p className="text-sm text-muted-foreground">The root URL for your API, without any path components</p>
      </div>

      {/* Category Field */}
      <div className="space-y-2">
        <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
        <Select
          value={formData.category}
          onValueChange={(value) => updateFormData({ category: value })}
        >
          <SelectTrigger id="category" className="w-full">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">Categorizing your API helps users discover it more easily</p>
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe what your API does and the problems it solves..."
          value={formData.description}
          onChange={handleChange}
          rows={4}
          required
        />
        <p className="text-sm text-muted-foreground">This will be displayed in API listings and search results</p>
      </div>
    </>
  );
}

export default BasicInfoForm;