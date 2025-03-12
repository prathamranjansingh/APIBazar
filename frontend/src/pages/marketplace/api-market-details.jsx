import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ChevronDown,
  ChevronRight,
  Code,
  CreditCard,
  ExternalLink,
  FileText,
  Info,
  MessageSquare,
  PlusCircle,
  Star,
  Send,
  Copy,
  CheckCircle,
  X,
} from 'lucide-react';
import EndpointTester from '@/components/market/endpoint-tester';
import MarketplaceService from '@/lib/marketplace-service';
import { useUser } from '@/contexts/user-context';

const ApiMarketDetails = () => {
  const { apiId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();

  // State management
  const [api, setApi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [reviews, setReviews] = useState({ reviews: [], metadata: {} });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  // Test endpoint state
  const [testParams, setTestParams] = useState({});
  const [testHeaders, setTestHeaders] = useState({});
  const [testBody, setTestBody] = useState('');
  const [testResponse, setTestResponse] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [showTestResponse, setShowTestResponse] = useState(false);

  // Fetch API details and user data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get API details
        const apiData = await MarketplaceService.getApiById(apiId);
        setApi(apiData);

        // Set first endpoint as selected by default
        if (apiData.endpoints && apiData.endpoints.length > 0) {
          setSelectedEndpoint(apiData.endpoints[0]);
        }

        // Check if user is the owner of this API
        if (user) {
          setIsOwner(apiData.ownerId === user.id);

          // Check if user has purchased this API
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
    fetchData();
  }, [apiId, navigate, user]);

  // Fetch reviews
  const fetchReviews = async () => {
    if (!api) return;
    try {
      setReviewsLoading(true);
      const reviewsData = await MarketplaceService.getApiReviews(apiId);
      setReviews(reviewsData);
    } catch (error) {
      toast.error('Failed to load reviews');
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (api) {
      fetchReviews();
    }
  }, [api]);

  // Handle endpoint selection
  const handleSelectEndpoint = (endpoint) => {
    setSelectedEndpoint(endpoint);

    // Reset test state
    setTestParams({});
    setTestHeaders({});
    setTestBody('');
    setTestResponse(null);
    setShowTestResponse(false);

    // Initialize params for this endpoint
    if (endpoint.headers) {
      const initialHeaders = {};
      Object.keys(endpoint.headers).forEach((key) => {
        initialHeaders[key] = '';
      });
      setTestHeaders(initialHeaders);
    }
  };

  // Handle API purchase
  const handlePurchaseApi = async () => {
    if (!user) {
      toast.error('Please log in to purchase this API');
      navigate('/');
      return;
    }
    try {
      setPurchasing(true);
      const result = await MarketplaceService.purchaseApi(apiId);
      setIsPurchased(true);
      toast.success('API purchased successfully! You can now test the endpoints.');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to purchase API. Please try again.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  // Handle test parameter change
  const handleParamChange = (key, value) => {
    setTestParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle test header change
  const handleHeaderChange = (key, value) => {
    setTestHeaders((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle test body change
  const handleBodyChange = (e) => {
    setTestBody(e.target.value);
  };

  // Test endpoint
  const handleTestEndpoint = async () => {
    if (!selectedEndpoint) return;
    try {
      setTestLoading(true);
      setShowTestResponse(true);
      let parsedBody = null;
      if (testBody) {
        try {
          parsedBody = JSON.parse(testBody);
        } catch (e) {
          setTestResponse({
            status: 'error',
            statusCode: 400,
            data: { error: 'Invalid JSON in request body' },
          });
          return;
        }
      }
      const testData = {
        params: testParams,
        headers: testHeaders,
        body: parsedBody,
      };
      const response = await MarketplaceService.testEndpoint(apiId, selectedEndpoint.id, testData);
      setTestResponse(response);
    } catch (error) {
      setTestResponse({
        status: 'error',
        statusCode: error.response?.status || 500,
        data: error.response?.data || { error: 'An error occurred while testing the endpoint' },
      });
    } finally {
      setTestLoading(false);
    }
  };

  // Copy response to clipboard
  const handleCopyResponse = () => {
    if (!testResponse) return;
    navigator.clipboard.writeText(JSON.stringify(testResponse, null, 2));
    toast.success('Response copied to clipboard');
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-10 w-28" />
          </div>
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Skeleton className="h-72 w-full" />
            </div>
            <div className="md:col-span-2">
              <Skeleton className="h-96 w-full" />
            </div>
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
        {/* API Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold">{api.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={api.pricingModel === 'FREE' ? 'secondary' : 'default'}>
                {api.pricingModel === 'FREE' ? 'Free' : `$${api.price}`}
              </Badge>
              <span className="text-muted-foreground">•</span>
              <Badge variant="outline">{api.category}</Badge>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1 text-yellow-400 fill-yellow-400" />
                <span>
                  {reviews.metadata?.averageRating?.toFixed(1) || 'N/A'}
                  <span className="text-muted-foreground text-sm ml-1">
                    ({reviews.metadata?.totalCount || 0} reviews)
                  </span>
                </span>
              </div>
            </div>
          </div>
          {!isOwner && (
            <Button
              onClick={handlePurchaseApi}
              disabled={isPurchased || purchasing}
              className="min-w-[120px]"
            >
              {purchasing ? 'Processing...' : isPurchased ? 'Purchased' : 'Purchase'}
            </Button>
          )}
          {isOwner && (
            <Button
              variant="outline"
              onClick={() => navigate(`/apis/${apiId}`)}
            >
              Manage API
            </Button>
          )}
        </div>

        {/* API Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line">{api.description}</p>
            <div className="flex flex-col sm:flex-row gap-6 mt-6">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Base URL</h4>
                <div className="flex items-center">
                  <code className="bg-muted px-2 py-1 rounded text-sm">{api.baseUrl}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 ml-1"
                    onClick={() => {
                      navigator.clipboard.writeText(api.baseUrl);
                      toast.success('Base URL copied to clipboard');
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Rate Limit</h4>
                <p>{api.rateLimit ? `${api.rateLimit} requests per minute` : 'Unlimited'}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Created By</h4>
                <div className="flex items-center">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={api.owner.picture} alt={api.owner.name} />
                    <AvatarFallback>{api.owner.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{api.owner.name}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Endpoints Sidebar */}
          <div className="md:col-span-1">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">Endpoints</CardTitle>
                <CardDescription>
                  {api.endpoints.length} {api.endpoints.length === 1 ? 'endpoint' : 'endpoints'} available
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-400px)] p-4 pt-0">
                  {api.endpoints.map((endpoint) => (
                    <div
                      key={endpoint.id}
                      className={`
                        mb-2 p-3 rounded-md cursor-pointer transition-colors
                        ${selectedEndpoint?.id === endpoint.id
                          ? 'bg-primary/10 border-l-2 border-primary'
                          : 'hover:bg-secondary/50'
                        }
                      `}
                      onClick={() => handleSelectEndpoint(endpoint)}
                    >
                      <div className="flex items-center">
                        <Badge
                          className="mr-2 uppercase font-mono text-xs"
                          variant={
                            endpoint.method === 'GET'
                              ? 'secondary'
                              : endpoint.method === 'POST'
                              ? 'default'
                              : endpoint.method === 'PUT'
                              ? 'outline'
                              : endpoint.method === 'DELETE'
                              ? 'destructive'
                              : 'outline'
                          }
                        >
                          {endpoint.method}
                        </Badge>
                        <span className="font-medium truncate">{endpoint.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 font-mono">
                        {endpoint.path}
                      </p>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Endpoint Detail & Testing */}
          <div className="md:col-span-2">
            <Tabs defaultValue="docs">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="docs">Documentation</TabsTrigger>
                <TabsTrigger value="test" disabled={!isPurchased && !isOwner}>
                  Test Endpoint
                </TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              {/* Documentation Tab */}
              <TabsContent value="docs" className="mt-4">
                {selectedEndpoint ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center">
                        <Badge
                          className="mr-2 uppercase font-mono text-xs"
                          variant={
                            selectedEndpoint.method === 'GET'
                              ? 'secondary'
                              : selectedEndpoint.method === 'POST'
                              ? 'default'
                              : selectedEndpoint.method === 'PUT'
                              ? 'outline'
                              : selectedEndpoint.method === 'DELETE'
                              ? 'destructive'
                              : 'outline'
                          }
                        >
                          {selectedEndpoint.method}
                        </Badge>
                        <CardTitle className="text-xl">{selectedEndpoint.name}</CardTitle>
                      </div>
                      <CardDescription className="font-mono">
                        {api.baseUrl}{selectedEndpoint.path}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4">{selectedEndpoint.description}</p>
                      <Accordion type="single" collapsible defaultValue="headers">
                        {/* Headers Section */}
                        <AccordionItem value="headers">
                          <AccordionTrigger className="text-base font-medium">
                            Headers
                          </AccordionTrigger>
                          <AccordionContent>
                            {selectedEndpoint.headers && Object.keys(selectedEndpoint.headers).length > 0 ? (
                              <div className="rounded-md border">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b bg-muted/50">
                                      <th className="px-4 py-2 text-left font-medium">Name</th>
                                      <th className="px-4 py-2 text-left font-medium">Description</th>
                                      <th className="px-4 py-2 text-left font-medium">Required</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {Object.entries(selectedEndpoint.headers).map(([key, header]) => (
                                      <tr key={key} className="border-b">
                                        <td className="px-4 py-2 font-mono">{key}</td>
                                        <td className="px-4 py-2">{header.description}</td>
                                        <td className="px-4 py-2">
                                          {header.required ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                          ) : (
                                            <X className="h-4 w-4 text-muted-foreground" />
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-muted-foreground">No headers required for this endpoint</p>
                            )}
                          </AccordionContent>
                        </AccordionItem>

                        {/* Request Body Section */}
                        {['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && (
                          <AccordionItem value="requestBody">
                            <AccordionTrigger className="text-base font-medium">
                              Request Body
                            </AccordionTrigger>
                            <AccordionContent>
                              {selectedEndpoint.requestBody ? (
                                <div className="space-y-4">
                                  <div className="rounded-md bg-muted p-4">
                                    <pre className="text-sm overflow-x-auto">
                                      {JSON.stringify(selectedEndpoint.requestBody, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-muted-foreground">No request body schema defined for this endpoint</p>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        )}

                        {/* Response Schema Section */}
                        <AccordionItem value="responseSchema">
                          <AccordionTrigger className="text-base font-medium">
                            Response Schema
                          </AccordionTrigger>
                          <AccordionContent>
                            {selectedEndpoint.responseSchema ? (
                              <div className="space-y-4">
                                <div className="rounded-md bg-muted p-4">
                                  <pre className="text-sm overflow-x-auto">
                                    {JSON.stringify(selectedEndpoint.responseSchema, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            ) : (
                              <p className="text-muted-foreground">No response schema defined for this endpoint</p>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex items-center justify-center h-[400px]">
                    <div className="text-center">
                      <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">Select an endpoint</h3>
                      <p className="text-muted-foreground mt-1">
                        Choose an endpoint from the sidebar to view its documentation
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Test Endpoint Tab */}
              <TabsContent value="test" className="mt-4">
                {!isPurchased && !isOwner ? (
                  <Card>
                    <CardHeader className="text-center pb-2">
                      <CardTitle>Purchase Required</CardTitle>
                      <CardDescription>
                        You need to purchase this API to test its endpoints
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                      <Button onClick={handlePurchaseApi} disabled={purchasing}>
                        {purchasing ? 'Processing...' : `Purchase for $${api.price}`}
                      </Button>
                    </CardContent>
                  </Card>
                ) : selectedEndpoint ? (
                  <EndpointTester api={api} endpoint={selectedEndpoint} />
                ) : (
                  <div className="flex items-center justify-center h-[400px]">
                    <div className="text-center">
                      <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">Select an endpoint</h3>
                      <p className="text-muted-foreground mt-1">
                        Choose an endpoint from the sidebar to test it
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl">Reviews</CardTitle>
                      {isPurchased && !isOwner && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/reviews/create/${apiId}`)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Write a Review
                        </Button>
                      )}
                    </div>
                    <CardDescription>
                      {reviews.metadata?.totalCount || 0} reviews, {reviews.metadata?.averageRating?.toFixed(1) || 'N/A'} average rating
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {reviewsLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex space-x-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-4 w-1/3" />
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-2/3" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : reviews.reviews?.length > 0 ? (
                      <div className="space-y-6">
                        {reviews.reviews.map((review) => (
                          <div key={review.id} className="border-b pb-4 last:border-0">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 mr-2">
                                  <AvatarImage src={review.user.picture} alt={review.user.name} />
                                  <AvatarFallback>{review.user.name.charAt(0)}</AvatarFallback>
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
                                    className={`h-4 w-4 ${
                                      i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            {review.comment && <p className="mt-2 text-sm">{review.comment}</p>}
                          </div>
                        ))}
                        {reviews.metadata?.totalCount > reviews.reviews.length && (
                          <div className="flex justify-center mt-4">
                            <Button
                              variant="outline"
                              onClick={() => navigate(`/marketplace/${apiId}/reviews`)}
                            >
                              View All Reviews
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
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
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiMarketDetails;