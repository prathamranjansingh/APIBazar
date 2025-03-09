import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Clock, User, DollarSign, Gauge } from "lucide-react"

export function ApiOverview({ api, isOwner, managementMode, onEdit }) {
  const formatDateTime = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <h2 className="text-2xl font-bold">API Overview</h2>
        {isOwner && managementMode && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" /> Edit API Details
          </Button>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{api.description}</p>
        </CardContent>
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>API Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Base URL</p>
                <p className="font-mono text-sm bg-muted p-2 rounded mt-1 overflow-auto">
                  {api.baseUrl}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <div className="mt-1">
                  <Badge variant="secondary">{api.category}</Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pricing</p>
                <div className="mt-1 flex items-center">
                  <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                  {api.pricingModel === "FREE" ? (
                    <span>Free</span>
                  ) : (
                    <span>${api.price.toFixed(2)}</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rate Limit</p>
                <div className="mt-1 flex items-center">
                  <Gauge className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>{api.rateLimit} req/min</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Created By</p>
              <div className="mt-1 flex items-center">
                <User className="h-4 w-4 mr-1 text-muted-foreground" />
                <span>{api.owner?.name || "Unknown"}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created Date</p>
              <div className="mt-1 flex items-center">
                <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                <span>{formatDateTime(api.createdAt)}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <div className="mt-1 flex items-center">
                <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                <span>{formatDateTime(api.updatedAt)}</span>
              </div>
            </div>
            {isOwner && (
              <div>
                <p className="text-sm text-muted-foreground">Active Subscribers</p>
                <div className="mt-1 flex items-center">
                  <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>{api._count?.purchasedBy || 0} users</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}