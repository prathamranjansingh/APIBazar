"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"

const ApiDetailsHeader = ({ api, reviews, isOwner, isPurchased, purchasing, onPurchase, navigate }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
      <div className="w-full sm:w-auto">
        <h1 className="text-2xl sm:text-3xl font-bold truncate">{api.name}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <Badge variant={api.pricingModel === "FREE" ? "secondary" : "default"}>
            {api.pricingModel === "FREE" ? "Free" : `$${api.price}`}
          </Badge>
          <span className="text-muted-foreground hidden xs:inline">•</span>
          <Badge variant="outline">{api.category}</Badge>
          <span className="text-muted-foreground hidden xs:inline">•</span>
          <div className="flex items-center">
            <Star className="h-4 w-4 mr-1 text-yellow-400 fill-yellow-400" />
            <span>
              {reviews.metadata?.averageRating?.toFixed(1) || "N/A"}
              <span className="text-muted-foreground text-xs sm:text-sm ml-1">
                ({reviews.metadata?.totalCount || 0} reviews)
              </span>
            </span>
          </div>
        </div>
      </div>
      <div className="w-full sm:w-auto mt-2 sm:mt-0">
        {!isOwner && (
          <Button onClick={onPurchase} disabled={isPurchased || purchasing} className="w-full sm:w-auto min-w-[120px]">
            {purchasing ? "Processing..." : isPurchased ? "Purchased" : "Purchase"}
          </Button>
        )}
        {isOwner && (
          <Button variant="outline" onClick={() => navigate(`/apis/${api.id}`)} className="w-full sm:w-auto">
            Manage API
          </Button>
        )}
      </div>
    </div>
  )
}

export default ApiDetailsHeader
