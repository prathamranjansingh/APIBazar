"use client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/user-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Code2, Plus, Users, DollarSign, Activity, Clock, ShoppingBag } from "lucide-react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { getAccessTokenSilently } = useAuth0();
  const [loading, setLoading] = useState(true);
  const [apis, setApis] = useState([]);
  const [purchasedApis, setPurchasedApis] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalApis: 0,
    totalCalls: 0,
    totalRevenue: 0,
    activeUsers: 0,
  });

  // Fetch user's APIs
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = await getAccessTokenSilently();

        // Fetch APIs created by the user
        const [apisResponse, purchasedResponse, analyticsResponse] = await Promise.all([
          // Get APIs created by user
          axios.get(`${API_BASE_URL}/apis/user/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          // Get APIs purchased by user
          axios.get(`${API_BASE_URL}/apis/user/purchased`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          // Simulate analytics data
          Promise.resolve({
            data: {
              totalCalls: 0,
              totalRevenue: 0,
              activeUsers: 0,
            },
          }),
        ]);

        // Set the data in state
        setApis(apisResponse.data || []);
        setPurchasedApis(purchasedResponse.data || []);

        // Calculate statistics
        const totalApis = apisResponse.data.length;
        const totalCalls = apisResponse.data.reduce((sum, api) => sum + (api.analytics?.totalCalls || 0), 0);

        // Get transaction data (this would come from a real endpoint)
        const recentActivity = getRecentActivity(apisResponse.data, purchasedResponse.data);

        // Set statistics
        setStats({
          totalApis,
          totalCalls,
          totalRevenue: analyticsResponse.data.totalRevenue || 0,
          activeUsers: analyticsResponse.data.activeUsers || 0,
          recentActivity,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user, getAccessTokenSilently]);

  // Helper function to generate recent activity from API data
  const getRecentActivity = (createdApis, purchasedApis) => {
    const activity = [];

    // Add purchase activities
    if (purchasedApis.length) {
      purchasedApis.slice(0, 3).forEach((api) => {
        activity.push({
          type: "purchase",
          apiName: api.name,
          time: formatTimestamp(api.createdAt),
          amount: api.price || 0,
        });
      });
    }

    // Add call activities (example)
    if (createdApis.length) {
      createdApis
        .filter((api) => api.analytics?.totalCalls > 0)
        .slice(0, 3)
        .forEach((api) => {
          activity.push({
            type: "call",
            apiName: api.name,
            time: "Recently",
            count: api.analytics?.totalCalls || 0,
          });
        });
    }

    // Sort by most recent (this is just example data)
    return activity.slice(0, 5);
  };

  // Format timestamps for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Recently";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else {
      return "Recently";
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 w-full font-bricolage h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}</h2>
        <Button onClick={() => navigate("/apis/create")}>
          <Plus className="mr-2 h-4 w-4" /> Create API
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 w-full">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total APIs</CardTitle>
            <Code2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApis}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalApis > 0
                ? `${apis.filter((api) => api.pricingModel === "PAID").length} paid APIs`
                : "No APIs yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCalls.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCalls > 0 ? "From all your APIs" : "No API calls yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalRevenue > 0 ? "From paid APIs" : "No revenue yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Keys</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchasedApis.length}</div>
            <p className="text-xs text-muted-foreground">
              {purchasedApis.length > 0 ? "Active API subscriptions" : "No purchased APIs"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="apis" className="space-y-4 w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="apis">My APIs</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="purchased">Purchased APIs</TabsTrigger>
        </TabsList>

        <TabsContent value="apis" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {apis.length > 0 ? (
              apis.map((api) => (
                <Card key={api.id} className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>{api.name}</CardTitle>
                    <CardDescription>
                      {api.description?.substring(0, 100) || "No description provided"}
                      {api.description?.length > 100 ? "..." : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2 mb-1">
                        <Code2 className="h-4 w-4" />
                        <span>{api.endpoints?.length || 0} endpoints</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        <span>{api.analytics?.totalCalls || 0} calls</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/50 p-3">
                    <Button variant="secondary" className="w-full" onClick={() => navigate(`/dashboard/apis/${api.id}`)}>
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle>No APIs Yet</CardTitle>
                  <CardDescription>Create your first API to get started</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button onClick={() => navigate("/dashboard/create-api")}>
                    <Plus className="mr-2 h-4 w-4" /> Create API
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent API activity and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-4">
                      {activity.type === "purchase" && (
                        <ShoppingBag className="h-9 w-9 rounded-full bg-primary/10 p-2 text-primary" />
                      )}
                      {activity.type === "call" && (
                        <Activity className="h-9 w-9 rounded-full bg-primary/10 p-2 text-primary" />
                      )}
                      {activity.type === "review" && (
                        <Users className="h-9 w-9 rounded-full bg-primary/10 p-2 text-primary" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-none">{activity.apiName}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.type === "purchase" && `Purchased for $${activity.amount}`}
                          {activity.type === "call" && `${activity.count} API calls`}
                          {activity.type === "review" && `Received ${activity.rating} star review`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{activity.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Activity className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchased">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {purchasedApis.length > 0 ? (
              purchasedApis.map((api) => (
                <Card key={api.id} className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>{api.name}</CardTitle>
                    <CardDescription>
                      {api.description?.substring(0, 100) || "No description provided"}
                      {api.description?.length > 100 ? "..." : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2 mb-1">
                        <Code2 className="h-4 w-4" />
                        <span>{api.endpoints?.length || 0} endpoints</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4" />
                        <span>By {api.owner?.name || "Unknown"}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/50 p-3">
                    <Button variant="secondary" className="w-full" onClick={() => navigate(`/dashboard/apis/${api.id}`)}>
                      View API
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle>No Purchased APIs</CardTitle>
                  <CardDescription>You haven't purchased any APIs yet</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="outline" onClick={() => navigate("/dashboard/marketplace")}>
                    Browse Marketplace
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-10 w-[150px]" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-[100px]" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[70px] mb-2" />
                <Skeleton className="h-4 w-[120px]" />
              </CardContent>
            </Card>
          ))}
      </div>

      <div className="space-y-4 w-full">
        <Skeleton className="h-10 w-[300px]" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-[150px] mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[80%]" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-[70%] mb-2" />
                  <Skeleton className="h-4 w-[50%]" />
                </CardContent>
                <CardFooter className="bg-muted/50 p-3">
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;