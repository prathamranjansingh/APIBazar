import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Lock } from "lucide-react";

const ApiTestingHeader = ({ api, hasPurchased, isAuthenticated, loginWithRedirect }) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{api.name}</h1>
              <Badge variant={api.pricingModel === 'FREE' ? "secondary" : "default"}>
                {api.pricingModel === 'FREE' ? 'Free' : `$${api.price?.toFixed(2)}`}
              </Badge>
              <Badge variant="outline">{api.category}</Badge>
            </div>
            <p className="text-muted-foreground mt-2 max-w-3xl">{api.description}</p>
          </div>
          {api.pricingModel === 'PAID' && !hasPurchased && (
            <div className="flex-shrink-0">
              {isAuthenticated ? (
                <Button className="gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Purchase API
                </Button>
              ) : (
                <Button
                  onClick={() => loginWithRedirect()}
                  variant="outline"
                  className="gap-2"
                >
                  <Lock className="h-4 w-4" />
                  Log in to purchase
                </Button>
              )}
            </div>
          )}
        </div>
        {api.pricingModel === 'PAID' && !hasPurchased && (
          <div className="mt-4 bg-muted p-3 rounded-md text-sm">
            <p className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>
                You're in public testing mode with limited capabilities.
                {isAuthenticated ? ' Purchase the API for full access with higher rate limits and complete responses.' :
                  ' Log in and purchase the API for full access.'}
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApiTestingHeader;