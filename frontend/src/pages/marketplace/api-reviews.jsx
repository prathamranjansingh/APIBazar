import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MessageSquare, ArrowLeft } from 'lucide-react';
import MarketplaceService from '@/lib/marketplace-service';
import { useUser } from '@/contexts/user-context';

const ApiReviews = () => {
  const { apiId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [api, setApi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState({ reviews: [], metadata: {} });
  const [isPurchased, setIsPurchased] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  useEffect(() => {
    const fetchApiDetails = async () => {
      try {
        setLoading(true);
        const apiData = await MarketplaceService.getApiById(apiId);
        setApi(apiData);
        if (user) {
          setIsOwner(apiData.ownerId === user.id);
          try {
            const purchasedApis = await MarketplaceService.getPurchasedApis();
            setIsPurchased(purchasedApis.some((api) => api.id === apiId));
          } catch (error) {
            console.error('Error checking purchased APIs', error);
          }
        }
      } catch (error) {
        toast.error('Failed to load API details');
        navigate('/marketplace');
      } finally {
        setLoading(false);
      }
    };
    fetchApiDetails();
  }, [apiId, navigate, user]);

  const fetchReviews = async () => {
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      const response = await MarketplaceService.getApiReviews(apiId, params);
      setReviews(response);
      setPagination((prev) => ({
        ...prev,
        totalPages: response.metadata.totalPages,
      }));
    } catch (error) {
      toast.error('Failed to load reviews');
    }
  };

  useEffect(() => {
    if (api) {
      fetchReviews();
    }
  }, [api, pagination.page]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-32 w-full" />
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!api) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h2 className="text-2xl font-bold">API not found</h2>
        <p className="mt-2 text-muted-foreground">
          The API you're looking for doesn't exist or has been removed.
        </p>
        <Button className="mt-4" onClick={() => navigate('/marketplace')}>
          Back to Marketplace
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <Button
            variant="ghost"
            className="w-fit flex items-center gap-1"
            onClick={() => navigate(`/marketplace/${apiId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to API
          </Button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">
                {api.name} - Reviews
              </h1>
              <p className="text-muted-foreground">
                {reviews.metadata.totalCount || 0} reviews,{' '}
                {reviews.metadata.averageRating?.toFixed(1) || 'N/A'} average rating
              </p>
            </div>
            {isPurchased && !isOwner && (
              <Button onClick={() => navigate(`/reviews/create/${apiId}`)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Write a Review
              </Button>
            )}
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            {reviews.reviews?.length > 0 ? (
              <div className="space-y-8">
                {reviews.reviews.map((review) => (
                  <div key={review.id} className="border-b pb-6 last:border-0">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={review.user.picture} alt={review.user.name} />
                          <AvatarFallback>{review.user.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{review.user.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && <p className="mt-4">{review.comment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No reviews yet</h3>
                <p className="text-muted-foreground mt-1">
                  Be the first to review this API
                </p>
                {isPurchased && !isOwner && (
                  <Button
                    className="mt-4"
                    onClick={() => navigate(`/reviews/create/${apiId}`)}
                  >
                    Write a Review
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        {pagination.totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    pagination.page > 1 &&
                    setPagination({ ...pagination, page: pagination.page - 1 })
                  }
                  className={
                    pagination.page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                  }
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNumber;
                if (pagination.totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (pagination.page <= 3) {
                  pageNumber = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNumber = pagination.totalPages - 4 + i;
                } else {
                  pageNumber = pagination.page - 2 + i;
                }
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      isActive={pageNumber === pagination.page}
                      onClick={() => setPagination({ ...pagination, page: pageNumber })}
                      className="cursor-pointer"
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    pagination.page < pagination.totalPages &&
                    setPagination({ ...pagination, page: pagination.page + 1 })
                  }
                  className={
                    pagination.page >= pagination.totalPages
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
};

export default ApiReviews;