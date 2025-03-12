import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useApiService } from '../contexts/ApiServiceContext'; 
import { toast, Toaster } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle,
  BarChart,
  BookOpen,
  CheckCircle,
  CopyCheck,
  ExternalLink,
  Info,
  Key,
  Lock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import LineChart from '@/components/ui/line-chart';
import ApiKeyDisplay from '@/components/common/ApiKeyDisplay';
import EmptyState from '@/components/common/EmptyState';

function PurchasePage() {
  const { isAuthenticated, isLoading: authLoading, loginWithRedirect } = useAuth0();
  const apiService = useApiService();
  const navigate = useNavigate();

  // State management
  const [purchasedApis, setPurchasedApis] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  const [selectedApi, setSelectedApi] = useState(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [keyNameError, setKeyNameError] = useState('');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [createKeyDialogOpen, setCreateKeyDialogOpen] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [selectedApiAnalytics, setSelectedApiAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Authentication check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      loginWithRedirect({
        appState: { returnTo: window.location.pathname },
      });
      return;
    }
    if (isAuthenticated) {
      fetchPurchasedApis();
    }
  }, [isAuthenticated, authLoading]);

  // Fetch all purchased APIs and API keys data
  const fetchPurchasedApis = async () => {
    setIsLoading(true);
    setLoadingError(null);
    try {
      const [apis, keys] = await Promise.all([
        apiService.getPurchasedApis(),
        apiService.getUserApiKeys(),
      ]);
      setPurchasedApis(apis);
      setApiKeys(keys);
    } catch (error) {
      setLoadingError('Failed to load purchased APIs');
      toast.error('Unable to load your purchased APIs', {
        description: 'Please try again or contact support if the problem persists.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch analytics for a specific API
  const fetchApiAnalytics = async (apiId) => {
    setLoadingAnalytics(true);
    try {
      const analytics = await apiService.getApiAnalytics(apiId);
      setSelectedApiAnalytics(analytics);
    } catch (error) {
      toast.error('Failed to load API analytics', {
        description: 'Please try again later.',
      });
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Handle creating a new API key
  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      setKeyNameError('Please provide a name for your API key');
      return;
    }
    setKeyNameError('');
    setCreatingKey(true);
    try {
      const result = await apiService.createApiKey({
        apiId: selectedApi.id,
        name: newKeyName,
      });
      setApiKeys((prevKeys) => [...prevKeys, result]);
      setNewKeyName('');
      setCreateKeyDialogOpen(false);
      toast.success('API key created successfully', {
        description: 'Your new API key is ready to use.',
      });
    } catch (error) {
      toast.error('Failed to create API key', {
        description: error.response?.data?.error || 'Please try again later.',
      });
    } finally {
      setCreatingKey(false);
    }
  };

  const handleTabChange = async (value) => {
    if (value === 'analytics' && selectedApi && !selectedApiAnalytics) {
    await fetchApiAnalytics(selectedApi.id)
    }
    }

  // Handle revoking an API key
  const handleRevokeApiKey = async (keyId) => {
    try {
      await apiService.revokeApiKey(keyId);
      setApiKeys((prevKeys) =>
        prevKeys.map((key) =>
          key.id === keyId ? { ...key, isActive: false } : key
        )
      );
      toast.success('API key revoked successfully');
    } catch (error) {
      toast.error('Failed to revoke API key', {
        description: 'Please try again later.',
      });
    }
  };

  // Copy to clipboard function
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Open API details dialog
  const openApiDetails = async (api) => {
    setSelectedApi(api);
    setSelectedApiAnalytics(null);
    setDetailsDialogOpen(true);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-8">Your Purchased APIs</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-2 mt-4">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
        <Toaster position="top-right" richColors />
      </div>
    );
  }

  // Render error state
  if (loadingError) {
    return (
      <div className="container mx-auto py-10 px-4">
        <EmptyState
          icon={<AlertCircle className="h-10 w-10 text-destructive" />}
          title="Error Loading APIs"
          description="We couldn't load your purchased APIs. Please try refreshing the page."
          action={<Button onClick={fetchPurchasedApis}>Try Again</Button>}
        />
        <Toaster position="top-right" richColors />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Your Purchased APIs</h1>
        <Button onClick={() => navigate('/apis')}>
          <Sparkles className="h-4 w-4 mr-2" />
          Explore More APIs
        </Button>
      </div>

      {/* Empty state when no APIs are purchased */}
      {purchasedApis.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-12 w-12 text-muted-foreground" />}
          title="No Purchased APIs Yet"
          description="Explore our marketplace to find and purchase APIs for your projects."
          action={
            <Button onClick={() => navigate('/apis')}>
              Browse API Marketplace
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {purchasedApis.map((api) => (
            <Card key={api.id} className="overflow-hidden hover:shadow-lg transition-shadow border-border">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl truncate" title={api.name}>
                    {api.name}
                  </CardTitle>
                  <Badge variant={api.pricingModel === 'FREE' ? 'secondary' : 'default'}>
                    {api.pricingModel === 'FREE' ? 'Free' : `$${api.price}`}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-1">
                  by {api.owner.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {api.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-1">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    {api.endpoints?.length || 0} Endpoints
                  </Badge>
                  {api.rateLimit && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      {api.rateLimit}/hr
                    </Badge>
                  )}
                  {api._count?.purchasedBy > 10 && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {api._count.purchasedBy}+ users
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => openApiDetails(api)}>
                  View Details
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => window.open(api.documentation || '#', '_blank')}
                  disabled={!api.documentation}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Docs
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* API Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedApi && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-2xl">{selectedApi.name}</DialogTitle>
                  <Badge variant={selectedApi.pricingModel === 'FREE' ? 'secondary' : 'default'}>
                    {selectedApi.pricingModel === 'FREE' ? 'Free' : `$${selectedApi.price}`}
                  </Badge>
                </div>
                <DialogDescription className="flex items-center gap-2">
                  Created by {selectedApi.owner.name}
                  {selectedApi.owner.profile?.bio && (
                    <span className="text-xs text-muted-foreground truncate">
                      {selectedApi.owner.profile.bio}
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="endpoints" onValueChange={handleTabChange}>
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
                  <TabsTrigger value="keys">API Keys</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>
                {/* Endpoints Tab */}
                <TabsContent value="endpoints" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Available Endpoints</h3>
                    <Badge variant="outline" className="font-mono">
                      Base URL: {selectedApi.baseUrl}
                    </Badge>
                  </div>
                  {selectedApi.endpoints.length === 0 ? (
                    <EmptyState
                      icon={<Info className="h-8 w-8 text-muted-foreground" />}
                      title="No Endpoints Available"
                      description="This API doesn't have any documented endpoints yet."
                    />
                  ) : (
                    selectedApi.endpoints.map((endpoint) => (
                      <Card key={endpoint.id}>
                        <CardHeader className="py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`font-mono ${
                                  endpoint.method === 'GET'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : endpoint.method === 'POST'
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : endpoint.method === 'DELETE'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : endpoint.method === 'PUT' || endpoint.method === 'PATCH'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : ''
                                }`}
                              >
                                {endpoint.method}
                              </Badge>
                              <CardTitle className="text-base font-medium">
                                {endpoint.name}
                              </CardTitle>
                            </div>
                            {endpoint.rateLimit && (
                              <Badge variant="secondary">{endpoint.rateLimit}/hr</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="py-2">
                          <p className="text-sm text-muted-foreground mb-2">
                            {endpoint.description || 'No description provided'}
                          </p>
                          <div className="flex items-center gap-2">
                            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm truncate max-w-[calc(100%-40px)]">
                              {selectedApi.baseUrl}
                              {endpoint.path}
                            </code>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() =>
                                copyToClipboard(`${selectedApi.baseUrl}${endpoint.path}`)
                              }
                            >
                              <CopyCheck className="h-4 w-4" />
                            </Button>
                          </div>
                          {/* Show request/response details if available */}
                          {(endpoint.headers || endpoint.requestBody || endpoint.responseSchema) && (
                            <div className="mt-3 grid gap-2">
                              {endpoint.headers && (
                                <div className="text-xs">
                                  <h4 className="font-semibold">Headers:</h4>
                                  <pre className="mt-1 bg-muted p-2 rounded overflow-x-auto">
                                    {JSON.stringify(endpoint.headers, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {endpoint.requestBody && (
                                <div className="text-xs">
                                  <h4 className="font-semibold">Request Body:</h4>
                                  <pre className="mt-1 bg-muted p-2 rounded overflow-x-auto">
                                    {JSON.stringify(endpoint.requestBody, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
                {/* API Keys Tab */}
                <TabsContent value="keys" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Your API Keys</h3>
                    <Button
                      size="sm"
                      className="gap-1"
                      onClick={() => {
                        setNewKeyName('');
                        setKeyNameError('');
                        setCreateKeyDialogOpen(true);
                      }}
                    >
                      <Key className="h-4 w-4" />
                      Create New Key
                    </Button>
                  </div>
                  {apiKeys.filter((key) => key.apiId === selectedApi.id).length === 0 ? (
                    <EmptyState
                      icon={<Lock className="h-8 w-8 text-muted-foreground" />}
                      title="No API Keys Yet"
                      description="Create a key to start using this API in your applications."
                      action={
                        <Button
                          variant="outline"
                          onClick={() => {
                            setNewKeyName('');
                            setKeyNameError('');
                            setCreateKeyDialogOpen(true);
                          }}
                        >
                          Generate API Key
                        </Button>
                      }
                    />
                  ) : (
                    <div className="space-y-3">
                      {apiKeys
                        .filter((key) => key.apiId === selectedApi.id)
                        .map((key) => (
                          <Card key={key.id}>
                            <CardHeader className="py-3">
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-base font-medium flex items-center gap-2">
                                  {key.name}
                                  {!key.isActive && (
                                    <Badge
                                      variant="outline"
                                      className="text-destructive border-destructive"
                                    >
                                      Revoked
                                    </Badge>
                                  )}
                                </CardTitle>
                                <div className="text-xs text-muted-foreground">
                                  Created: {new Date(key.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="py-2">
                              <div className="flex items-center gap-2 bg-muted p-2 rounded">
                                <div className="font-mono text-xs truncate flex-1">
                                  {key.key}
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(key.key)}
                                  disabled={!key.isActive}
                                >
                                  <CopyCheck className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                            <CardFooter className="py-3">
                              <div className="flex justify-between items-center w-full">
                                <div className="text-sm">
                                  {key.rateLimit && (
                                    <span className="text-muted-foreground">
                                      Rate Limit: {key.rateLimit}/hr
                                    </span>
                                  )}
                                </div>
                                {key.isActive && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleRevokeApiKey(key.id)}
                                  >
                                    Revoke Key
                                  </Button>
                                )}
                              </div>
                            </CardFooter>
                          </Card>
                        ))}
                    </div>
                  )}
                </TabsContent>
                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-4">
                  <h3 className="text-lg font-medium">Usage Analytics</h3>
                  {loadingAnalytics ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <Skeleton className="h-4 w-24 mx-auto mb-2" />
                        <Skeleton className="h-4 w-32 mx-auto" />
                      </div>
                    </div>
                  ) : !selectedApiAnalytics ? (
                    <EmptyState
                      icon={<BarChart className="h-8 w-8 text-muted-foreground" />}
                      title="No Analytics Available"
                      description="We don't have usage data for this API yet."
                    />
                  ) : (
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Request Volume</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64">
                            <LineChart
                              data={selectedApiAnalytics.requestsOverTime || []}
                              xField="date"
                              yField="count"
                              tooltipLabel="Requests"
                            />
                          </div>
                        </CardContent>
                      </Card>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Response Codes</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {selectedApiAnalytics.responseCodes ? (
                                Object.entries(selectedApiAnalytics.responseCodes).map(
                                  ([code, count]) => (
                                    <div
                                      key={code}
                                      className="flex justify-between items-center"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          variant="outline"
                                          className={`${
                                            code.startsWith('2')
                                              ? 'bg-green-50 text-green-700 border-green-200'
                                              : code.startsWith('4')
                                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                                              : code.startsWith('5')
                                              ? 'bg-red-50 text-red-700 border-red-200'
                                              : ''
                                          }`}
                                        >
                                          {code}
                                        </Badge>
                                        <span className="text-sm">
                                          {code === '200'
                                            ? 'OK'
                                            : code === '201'
                                            ? 'Created'
                                            : code === '400'
                                            ? 'Bad Request'
                                            : code === '401'
                                            ? 'Unauthorized'
                                            : code === '403'
                                            ? 'Forbidden'
                                            : code === '404'
                                            ? 'Not Found'
                                            : code === '429'
                                            ? 'Too Many Requests'
                                            : code === '500'
                                            ? 'Server Error'
                                            : ''}
                                        </span>
                                      </div>
                                      <span className="font-medium">{count}</span>
                                    </div>
                                  )
                                )
                              ) : (
                                <p className="text-center text-muted-foreground">
                                  No data available
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Endpoint Usage</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {selectedApiAnalytics.endpointUsage ? (
                                Object.entries(selectedApiAnalytics.endpointUsage)
                                  .sort((a, b) => b[1] - a[1])
                                  .map(([endpoint, count]) => (
                                    <div
                                      key={endpoint}
                                      className="flex justify-between items-center"
                                    >
                                      <div className="truncate max-w-[70%] text-sm">
                                        {endpoint}
                                      </div>
                                      <span className="font-medium">{count}</span>
                                    </div>
                                  ))
                              ) : (
                                <p className="text-center text-muted-foreground">
                                  No data available
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create API Key Dialog */}
      <Dialog open={createKeyDialogOpen} onOpenChange={setCreateKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
            <DialogDescription>
              Generate a new API key to access {selectedApi?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="keyName">Key Name</Label>
              <Input
                id="keyName"
                placeholder="My Project Key"
                value={newKeyName}
                onChange={(e) => {
                  setNewKeyName(e.target.value);
                  if (e.target.value.trim()) setKeyNameError('');
                }}
                error={keyNameError}
              />
              {keyNameError && (
                <p className="text-sm text-destructive">{keyNameError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setCreateKeyDialogOpen(false)}
              disabled={creatingKey}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleCreateApiKey()}
              disabled={creatingKey}
            >
              {creatingKey ? 'Generating...' : 'Generate Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default PurchasePage;