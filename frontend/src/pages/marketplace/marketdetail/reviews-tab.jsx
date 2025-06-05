"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Star } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

const ReviewsTab = ({ apiId, reviews, loading, isPurchased, isOwner, navigate }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
          <div>
            <CardTitle className="text-lg sm:text-xl">Reviews</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {reviews.metadata?.totalCount || 0} reviews, {reviews.metadata?.averageRating?.toFixed(1) || "N/A"}{" "}
              average rating
            </CardDescription>
          </div>
          {isPurchased && !isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/reviews/create/${apiId}`)}
              className="w-full sm:w-auto"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Write a Review
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 sm:h-4 w-1/3" />
                  <Skeleton className="h-3 sm:h-4 w-full" />
                  <Skeleton className="h-3 sm:h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : reviews.reviews?.length > 0 ? (
          <div className="space-y-4 sm:space-y-6">
            {reviews.reviews.map((review) => (
              <div key={review.id} className="border-b pb-4 last:border-0">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                  <div className="flex items-center">
                    <Avatar className="h-6 w-6 sm:h-8 sm:w-8 mr-2">
                      <AvatarImage src={review.user.picture || "/placeholder.svg"} alt={review.user.name} />
                      <AvatarFallback>{review.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-sm sm:text-base">{review.user.name}</h4>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 sm:h-4 sm:w-4 ${
                          i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {review.comment && <p className="mt-2 text-xs sm:text-sm">{review.comment}</p>}
              </div>
            ))}
            {reviews.metadata?.totalCount > reviews.reviews.length && (
              <div className="flex justify-center mt-4">
                <Button variant="outline" onClick={() => navigate(`/marketplace/${apiId}/reviews`)}>
                  View All Reviews
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <MessageSquare className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium">No reviews yet</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Be the first to review this API</p>
            {isPurchased && !isOwner && (
              <Button className="mt-4" onClick={() => navigate(`/reviews/create/${apiId}`)}>
                Write a Review
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ReviewsTab
