import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar, Check } from "lucide-react"

function PricingForm({ formData, updateFormData, handleChange }) {
  // Pricing model change handler
  const handlePricingChange = (value) => {
    updateFormData({
      pricingModel: value,
      // Reset price if switching to FREE
      price: value === "FREE" ? null : formData.price,
      // Reset billing cycle if switching to FREE
      billingCycle: value === "FREE" ? "MONTHLY" : formData.billingCycle,
    })
  }

  // Billing cycle change handler
  const handleBillingCycleChange = (value) => {
    updateFormData({ billingCycle: value })
  }

  return (
    <>
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
        <div className="space-y-4 border rounded-md p-4">
          <h3 className="font-medium">Pricing Details</h3>

          <div className="space-y-2">
            <Label htmlFor="price">
              Price <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center">
              <span className="bg-muted px-3 py-2 rounded-l-md border border-r-0 border-input">$</span>
              <Input
                id="price"
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="9.99"
                value={formData.price || ""}
                onChange={handleChange}
                className="rounded-l-none"
                required={formData.pricingModel !== "FREE"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Billing Cycle</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                className={`border rounded-md p-4 cursor-pointer transition-colors ${
                  formData.billingCycle === "MONTHLY" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                }`}
                onClick={() => handleBillingCycleChange("MONTHLY")}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Monthly</span>
                  </div>
                  {formData.billingCycle === "MONTHLY" && <Check className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-sm text-muted-foreground">Charge customers every month</p>
              </div>

              <div
                className={`border rounded-md p-4 cursor-pointer transition-colors ${
                  formData.billingCycle === "YEARLY" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                }`}
                onClick={() => handleBillingCycleChange("YEARLY")}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Yearly</span>
                  </div>
                  {formData.billingCycle === "YEARLY" && <Check className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-sm text-muted-foreground">Charge customers annually (20% savings)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default PricingForm

