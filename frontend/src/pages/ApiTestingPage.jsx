import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { toast } from "sonner";
import EndpointSelector from "@/components/api-testing/EndpointSelector";
import RequestDetails from "@/components/api-testing/RequestDetails";
import ResponsePanel from "@/components/api-testing/ResponsePanel";
import ApiTestingHeader from "@/components/api-testing/ApiTestingHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const ApiTestingPage = () => {
  const { apiId } = useParams();
  const navigate = useNavigate();
  const { getAccessTokenSilently, isAuthenticated, loginWithRedirect } = useAuth0();
  const [api, setApi] = useState(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [sampleRequest, setSampleRequest] = useState(null);
  const [testResponse, setTestResponse] = useState(null);
  const [curlCommand, setCurlCommand] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [activeTab, setActiveTab] = useState("request");
  const [error, setError] = useState(null);
  const BACKEND_URL = "http://localhost:5000";

  // Fetch API details
  useEffect(() => {
    const loadApiDetails = async () => {
      if (!apiId) return;
      setIsLoading(true);
      setError(null);

      try {
        // API call to get details
        let headers = {};
        if (isAuthenticated) {
          try {
            const token = await getAccessTokenSilently();
            headers.Authorization = `Bearer ${token}`;
          } catch (err) {
            console.error("Failed to get auth token:", err);
          }
        }

        const response = await axios.get(`${BACKEND_URL}/api/apis/${apiId}`, {
          headers,
          responseType: "json",
        });
        const apiData = response.data;

        // Ensure endpoints exist
        if (!apiData.endpoints) {
          apiData.endpoints = [];
        }

        setApi(apiData);

        // Check if user has purchased this API
        if (isAuthenticated) {
          try {
            const token = await getAccessTokenSilently();
            const purchaseCheck = await axios.get(
              `${BACKEND_URL}/api/users/purchases/${apiId}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            setHasPurchased(purchaseCheck.data.purchased);
          } catch (err) {
            console.error("Failed to check purchase status:", err);
          }
        }
      } catch (error) {
        console.error("Error loading API details:", error);
        setError(
          "Failed to load API details. The API may not exist or you might not have permission to access it."
        );
        toast.error("Failed to load API details");
      } finally {
        setIsLoading(false);
      }
    };

    loadApiDetails();
  }, [apiId, isAuthenticated, getAccessTokenSilently]);

  // Fetch sample request when endpoint is selected
  useEffect(() => {
    const fetchSampleRequest = async () => {
      if (!selectedEndpoint) return;
      setIsLoading(true);

      try {
        let headers = {};
        if (isAuthenticated) {
          const token = await getAccessTokenSilently();
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await axios.get(
          `${BACKEND_URL}/api/api-test/${apiId}/endpoints/${selectedEndpoint}/sample`,
          { headers }
        );
        setSampleRequest(response.data);
        setTestResponse(null);
        setCurlCommand(null);
        setActiveTab("request");
      } catch (error) {
        toast.error("Failed to load sample request");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSampleRequest();
  }, [selectedEndpoint, apiId, isAuthenticated, getAccessTokenSilently]);

  // Execute test against endpoint
  const executeTest = async () => {
    if (!selectedEndpoint || !sampleRequest) return;
    setIsLoading(true);

    try {
      let headers = {};
      if (isAuthenticated) {
        const token = await getAccessTokenSilently();
        headers.Authorization = `Bearer ${token}`;
      }

      // Choose the appropriate testing endpoint based on authentication status and purchase status
      let endpoint = `${BACKEND_URL}/api/api-test/${apiId}/endpoints/${selectedEndpoint}/public-test`;
      if (isAuthenticated && hasPurchased) {
        endpoint = `${BACKEND_URL}/api/api-test/${apiId}/endpoints/${selectedEndpoint}/test`;
      }

      const response = await axios.post(endpoint, sampleRequest.sampleRequest, { headers });
      setTestResponse(response.data);
      generateCurl();
      setActiveTab("response");

      if (response.data.success) {
        toast.success("API test executed successfully");
      } else if (response.data.error) {
        toast.error("API test failed: " + response.data.error.message);
      }
    } catch (error) {
      toast.error("Failed to execute test");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate cURL command
  const generateCurl = async () => {
    if (!sampleRequest) return;

    try {
      let headers = {};
      if (isAuthenticated) {
        const token = await getAccessTokenSilently();
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.post(
        `${BACKEND_URL}/api/api-test/generate-curl`,
        sampleRequest.sampleRequest,
        { headers }
      );
      setCurlCommand(response.data.curl);
    } catch (error) {
      console.error("Failed to generate cURL command", error);
    }
  };

  // Loading state
  if (isLoading && !api) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="w-full h-12 mb-4" />
        <Skeleton className="w-3/4 h-4 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="w-full h-[500px]" />
          <Skeleton className="w-full h-[500px] md:col-span-2" />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !api) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button className="mt-4" onClick={() => navigate("/marketplace")}>
            Return to Marketplace
          </Button>
        </Alert>
      </div>
    );
  }

  // API not found state
  if (!api) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            API not found or you may not have permission to view it.
          </AlertDescription>
          <Button className="mt-4" onClick={() => navigate("/marketplace")}>
            Return to Marketplace
          </Button>
        </Alert>
      </div>
    );
  }

  // Main render
  return (
    <div className="container mx-auto py-8">
      <ApiTestingHeader
        api={api}
        hasPurchased={hasPurchased}
        isAuthenticated={isAuthenticated}
        loginWithRedirect={loginWithRedirect}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="md:col-span-1">
          <CardContent className="p-4">
            <EndpointSelector
              endpoints={api.endpoints || []}
              selectedEndpoint={selectedEndpoint}
              setSelectedEndpoint={setSelectedEndpoint}
            />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="p-0">
            {selectedEndpoint && sampleRequest ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="request">Request</TabsTrigger>
                  <TabsTrigger value="response" disabled={!testResponse}>
                    Response
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="request" className="p-4">
                  <RequestDetails
                    endpoint={sampleRequest.endpoint}
                    sampleRequest={sampleRequest.sampleRequest}
                    executeTest={executeTest}
                    isLoading={isLoading}
                    isAuthenticated={isAuthenticated}
                    hasPurchased={hasPurchased}
                    api={api}
                    loginWithRedirect={loginWithRedirect}
                  />
                </TabsContent>

                <TabsContent value="response" className="p-4">
                  {testResponse && (
                    <ResponsePanel testResponse={testResponse} curlCommand={curlCommand} />
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center h-[500px] text-center p-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Select an endpoint to test</h3>
                  <p className="text-muted-foreground">
                    Choose an endpoint from the list on the left to see sample requests and test the
                    API.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApiTestingPage;