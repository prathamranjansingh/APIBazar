"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUser } from "@/contexts/user-context"
import MarketplaceService from "@/lib/marketplace-service"

// Import our new components
import ApiDetailsHeader from "./marketdetail/api-details-header"
import ApiDescription from "./marketdetail/api-description"
import EndpointsSidebar from "./marketdetail/endpoints-sidebar"
import DocumentationTab from "./marketdetail/documentation-tab"
import ReviewsTab from "./marketdetail/reviews-tab"
import ApiDetailsLoading from "./marketdetail/api-details-loading"
import EndpointTester from "./marketdetail/endpoint-tester"

const ApiMarketDetails = () => {
  const { apiId } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()

  // State management
  const [api, setApi] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedEndpoint, setSelectedEndpoint] = useState(null)
  const [isPurchased, setIsPurchased] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [reviews, setReviews] = useState({ reviews: [], metadata: {} })
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [purchasing, setPurchasing] = useState(false)

  // Fetch API details and user data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Get API details
        const apiData = await MarketplaceService.getApiById(apiId)
        setApi(apiData)

        // Set first endpoint as selected by default
        if (apiData.endpoints && apiData.endpoints.length > 0) {
          setSelectedEndpoint(apiData.endpoints[0])
        }

        // Check if user is the owner of this API
        if (user) {
          setIsOwner(apiData.ownerId === user.id)

          // Check if user has purchased this API
          try {
            const purchasedApis = await MarketplaceService.getPurchasedApis()
            setIsPurchased(purchasedApis.some((api) => api.id === apiId))
          } catch (error) {
            console.error("Error checking purchased APIs", error)
          }
        }
      } catch (error) {
        toast.error("Failed to load API details")
        navigate("/marketplace")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [apiId, navigate, user])

  // Fetch reviews
  const fetchReviews = async () => {
    if (!api) return
    try {
      setReviewsLoading(true)
      const reviewsData = await MarketplaceService.getApiReviews(apiId)
      setReviews(reviewsData)
    } catch (error) {
      toast.error("Failed to load reviews")
    } finally {
      setReviewsLoading(false)
    }
  }

  useEffect(() => {
    if (api) {
      fetchReviews()
    }
  }, [api])

  // Handle endpoint selection
  const handleSelectEndpoint = (endpoint) => {
    setSelectedEndpoint(endpoint)
  }

  // Handle API purchase
  const handlePurchaseApi = async () => {
  if (!user) {
    toast.error("Please log in to purchase this API");
    navigate("/");
    return;
  }

  try {
    setPurchasing(true);
    
    // Create order
    const orderData = await MarketplaceService.purchaseApi(apiId);
    
    // Initialize Razorpay
    const options = {
      key: orderData.key,
      amount: orderData.amount,
      currency: orderData.currency,
      name: orderData.name,
      description: orderData.description,
      order_id: orderData.orderId,
      handler: async function (response) {
        try {
          // Verify payment on backend
          await MarketplaceService.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          
          setIsPurchased(true);
          toast.success("API purchased successfully! You can now test the endpoints.");
        } catch (error) {
          toast.error("Payment verification failed. Please contact support.");
        }
      },
      prefill: orderData.prefill,
      theme: {
        color: "#3399cc"
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
    
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error) {
      toast.error(error.response.data.error);
    } else {
      toast.error("Failed to initiate purchase. Please try again.");
    }
  } finally {
    setPurchasing(false);
  }
};

  // Loading state
  if (loading) {
    return <ApiDetailsLoading />
  }

  if (!api) {
    return (
      <div className="container mx-auto py-4 sm:py-8 px-4 text-center">
        <h2 className="text-xl sm:text-2xl font-bold">API not found</h2>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          The API you're looking for doesn't exist or has been removed.
        </p>
        <Button className="mt-4" onClick={() => navigate("/marketplace")}>
          Back to Marketplace
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-4 sm:py-8 px-4">
      <div className="space-y-4 sm:space-y-6">
        {/* API Header */}
        <ApiDetailsHeader
          api={api}
          reviews={reviews}
          isOwner={isOwner}
          isPurchased={isPurchased}
          purchasing={purchasing}
          onPurchase={handlePurchaseApi}
          navigate={navigate}
        />

        {/* API Information */}
        <ApiDescription api={api} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Endpoints Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <EndpointsSidebar
              endpoints={api.endpoints}
              selectedEndpoint={selectedEndpoint}
              onSelectEndpoint={handleSelectEndpoint}
            />
          </div>

          {/* Endpoint Detail & Testing */}
          <div className="lg:col-span-2 order-1 lg:order-2">
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
                <DocumentationTab selectedEndpoint={selectedEndpoint} api={api} />
              </TabsContent>

              {/* Test Endpoint Tab */}
              <TabsContent value="test" className="mt-4">
                {!isPurchased && !isOwner ? (
                  <Card>
                    <div className="text-center p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-medium mb-2">Purchase Required</h3>
                      <p className="text-sm sm:text-base text-muted-foreground mb-4">
                        You need to purchase this API to test its endpoints
                      </p>
                      <Button onClick={handlePurchaseApi} disabled={purchasing}>
                        {purchasing ? "Processing..." : `Purchase for $${api.price}`}
                      </Button>
                    </div>
                  </Card>
                ) : selectedEndpoint ? (
                  <EndpointTester api={api} endpoint={selectedEndpoint} />
                ) : (
                  <div className="flex items-center justify-center h-[300px] sm:h-[400px]">
                    <div className="text-center px-4">
                      <p className="text-base sm:text-lg font-medium">Select an endpoint</p>
                      <p className="text-sm sm:text-base text-muted-foreground mt-1">
                        Choose an endpoint from the sidebar to test it
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-4">
                <ReviewsTab
                  apiId={apiId}
                  reviews={reviews}
                  loading={reviewsLoading}
                  isPurchased={isPurchased}
                  isOwner={isOwner}
                  navigate={navigate}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApiMarketDetails
