import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, ArrowLeft } from 'lucide-react';
import MarketplaceService from '@/lib/marketplace-service';

const CreateReview = () => {
  const { apiId } = useParams();
  const navigate = useNavigate();
  const [api, setApi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [isPurchased, setIsPurchased] = useState(false);

  useEffect(() => {
    const fetchApiDetails = async () => {
      try {
        setLoading(true);
        const apiData = await MarketplaceService.getApiById(apiId);
        setApi(apiData);
        const purchasedApis = await MarketplaceService.getPurchasedApis();
        const hasPurchased = purchasedApis.some((api) => api.id === apiId);
        setIsPurchased(hasPurchased);
        if (!hasPurchased) {
          toast.error('You must purchase this API before reviewing it');
          navigate(`/marketplace/${apiId}`);
        }
      } catch (error) {
        toast.error('Failed to load API details');
        navigate('/marketplace');
      } finally {
        setLoading(false);
      }
    };
    fetchApiDetails();
  }, [apiId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    try {
      setSubmitting(true);
      await MarketplaceService.createReview(apiId, {
        rating,
        comment: comment.trim() || null,
      });
      toast.success('Review submitted successfully');
      navigate(`/marketplace/${apiId}`);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to submit review');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-8 w-40 mb-6" />
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-32 w-full mb-6" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (!api || !isPurchased) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6 flex items-center gap-1"
          onClick={() => navigate(`/marketplace/${apiId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to API
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Write a Review for {api.name}</CardTitle>
            <CardDescription>
              Share your experience with this API to help others
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-8 w-8 cursor-pointer ${
                        (hoverRating || rating) >= star
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                    />
                  ))}
                </div>
                {rating === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Please select a rating
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Review (Optional)
                </label>
                <Textarea
                  placeholder="Share your experience with this API..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={5}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => navigate(`/marketplace/${apiId}`)}
                type="button"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={rating === 0 || submitting}>
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CreateReview;