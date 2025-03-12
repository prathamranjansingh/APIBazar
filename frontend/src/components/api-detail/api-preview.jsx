import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ApiPreview = ({ api }) => {
  if (!api) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">About this API</h3>
        <p className="text-muted-foreground">{api.description}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-1">Pricing</h4>
            <div className="flex items-center gap-2">
              {api.pricingModel === "FREE" ? (
                <Badge variant="outline">Free</Badge>
              ) : (
                <Badge>${api.price?.toFixed(2)}</Badge>
              )}
              <span className="text-sm text-muted-foreground">per month</span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1">Rate Limit</h4>
            <p className="text-sm">{api.rateLimit} requests per minute</p>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1">Version</h4>
            <p className="text-sm">{api.version}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1">Last Updated</h4>
            <p className="text-sm">
              {formatDistanceToNow(new Date(api.updatedAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Getting Started</h3>
        <Card>
          <CardContent className="p-4 space-y-2">
            <h4 className="text-sm font-medium">Base URL</h4>
            <div className="bg-muted rounded-md p-2 font-mono text-sm overflow-x-auto">
              {api.baseUrl}
            </div>
            <h4 className="text-sm font-medium mt-4">Authentication</h4>
            <div className="bg-muted rounded-md p-2 font-mono text-sm overflow-x-auto">
              Authorization: Bearer YOUR_API_KEY
            </div>
          </CardContent>
        </Card>
      </div>
      {api.termsOfService && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Terms of Service</h3>
          <p className="text-sm text-muted-foreground">{api.termsOfService}</p>
        </div>
      )}
    </div>
  );
};

export default ApiPreview;