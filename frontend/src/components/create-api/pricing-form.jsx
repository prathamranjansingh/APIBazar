import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Gauge, Check } from "lucide-react";

function PricingForm({ formData, updateFormData, handleChange }) {
  const [localPrice, setLocalPrice] = useState(formData.price !== null ? formData.price : "");
  const [localRateLimit, setLocalRateLimit] = useState(formData.rateLimit || 100);

  // Update local state when props change (to avoid desync)
  useEffect(() => {
    setLocalPrice(formData.price !== null ? formData.price : "");
    setLocalRateLimit(formData.rateLimit || 100);
  }, [formData.price, formData.rateLimit]);

  // Handle price changes
  const handlePriceChange = (e) => {
    const value = e.target.value;
    setLocalPrice(value);

    // Only update parent when explicitly typing is done
    if (value !== "") {
      updateFormData({ price: parseFloat(value) });
    }
  };

  // Handle rate limit changes
  const handleRateLimitChange = (values) => {
    const value = values[0];
    setLocalRateLimit(value);
    updateFormData({ rateLimit: value });
  };

  // Pricing model change handler
  const handlePricingChange = (value) => {
    // Update the pricing model and reset price if switching to FREE
    if (value === "FREE") {
      updateFormData({
        pricingModel: value,
        price: null,
      });
    } else {
      updateFormData({
        pricingModel: value,
        price: localPrice !== "" ? parseFloat(localPrice) : 0.99, // Default price
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Pricing Model Selection */}
      <div className="space-y-4">
        <Label className="text-base">Pricing Model</Label>
        <RadioGroup
          value={formData.pricingModel}
          onValueChange={handlePricingChange}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Free Pricing Option */}
          <Card
            className={`p-4 cursor-pointer border-2 hover:bg-muted/20 transition-colors ${
              formData.pricingModel === "FREE" ? "border-primary" : "border-muted"
            }`}
          >
            <RadioGroupItem value="FREE" id="free" className="sr-only" />
            <Label htmlFor="free" className="cursor-pointer flex flex-col h-full">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Free</span>
                {formData.pricingModel === "FREE" && <Check className="h-4 w-4 text-primary" />}
              </div>
              <span className="text-sm text-muted-foreground mt-1">
                Offer your API at no cost to users
              </span>
              <div className="mt-auto pt-3">
                <span className="text-2xl font-bold">$0</span>
              </div>
            </Label>
          </Card>

          {/* Paid Pricing Option */}
          <Card
            className={`p-4 cursor-pointer border-2 hover:bg-muted/20 transition-colors ${
              formData.pricingModel === "PAID" ? "border-primary" : "border-muted"
            }`}
          >
            <RadioGroupItem value="PAID" id="paid" className="sr-only" />
            <Label htmlFor="paid" className="cursor-pointer flex flex-col h-full">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Paid</span>
                {formData.pricingModel === "PAID" && <Check className="h-4 w-4 text-primary" />}
              </div>
              <span className="text-sm text-muted-foreground mt-1">
                Charge users a one-time fee for access
              </span>
              <div className="mt-auto pt-3">
                <span className="text-2xl font-bold">
                  ${formData.pricingModel === "PAID" ? localPrice || "X" : "X"}
                </span>
              </div>
            </Label>
          </Card>
        </RadioGroup>
      </div>

      {/* Pricing Details for Paid Model */}
      {formData.pricingModel === "PAID" && (
        <div className="space-y-6 border rounded-md p-4">
          <h3 className="font-medium text-base">Pricing Details</h3>

          {/* Price Input */}
          <div className="space-y-2">
            <Label htmlFor="price">
              Price <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center">
              <span className="bg-muted px-3 py-2 rounded-l-md border border-r-0 border-input">$</span>
              <Input
                id="price"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="9.99"
                value={localPrice}
                onChange={handlePriceChange}
                className="rounded-l-none"
                required
              />
            </div>
            <p className="text-sm text-muted-foreground">
              One-time payment for access to your API
            </p>
          </div>

          {/* Rate Limit Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="rate-limit" className="flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                Rate Limit (requests per minute)
              </Label>
              <span className="text-sm font-medium">{localRateLimit} req/min</span>
            </div>
            <Slider
              id="rate-limit"
              min={10}
              max={1000}
              step={10}
              value={[localRateLimit]}
              onValueChange={handleRateLimitChange}
            />
            <p className="text-sm text-muted-foreground">
              Set how many requests a user can make per minute
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PricingForm;