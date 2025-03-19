import { ExternalLink, Info, Clock, CheckCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function ApiCard({ api, onViewDetails }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border flex flex-col h-full bg-card">
      <CardHeader className="pb-2 space-y-1">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-xl truncate" title={api.name}>
            {api.name}
          </CardTitle>
          <Badge variant={api.pricingModel === "FREE" ? "secondary" : "default"} className="shrink-0">
            {api.pricingModel === "FREE" ? "Free" : `$${api.price}`}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1 text-sm">by {api.owner.name}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{api.description}</p>
        <div className="flex flex-wrap gap-2 mb-1">
          <Badge variant="outline" className="flex items-center gap-1 text-xs">
            <Info className="h-3 w-3" />
            {api.endpoints?.length || 0} Endpoints
          </Badge>
          {api.rateLimit && (
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              {api.rateLimit}/hr
            </Badge>
          )}
          {api._count?.purchasedBy > 10 && (
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <CheckCircle className="h-3 w-3" />
              {api._count.purchasedBy}+ users
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2 gap-2 mt-auto">
        <Button variant="default" onClick={onViewDetails} className="flex-1">
          View Details
        </Button>
        <Button
          variant="outline"
          onClick={() => window.open(api.documentation || "#", "_blank")}
          disabled={!api.documentation}
          className="flex-1"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Docs
        </Button>
      </CardFooter>
    </Card>
  )
}

