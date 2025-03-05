"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useApi } from "../contexts/api-context"
import { useUser } from "../contexts/user-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Code2, Plus, Users, DollarSign, Activity, Clock, ShoppingBag } from "lucide-react"

function Dashboard() {
  const navigate = useNavigate()
  const { apis, loading, fetchApis } = useApi()
  const { user } = useUser()
  const [stats, setStats] = useState({
    totalApis: 0,
    totalCalls: 0,
    totalRevenue: 0,
    recentActivity: [],
  })

  useEffect(() => {
    fetchApis()
  }, [fetchApis])

  useEffect(() => {
    if (apis.length > 0) {
      // In a real app, you would fetch these stats from your backend
      setStats({
        totalApis: apis.length,
        totalCalls: apis.reduce((sum, api) => sum + (api.analytics?.totalCalls || 0), 0),
        totalRevenue: 1250, // Example value
        recentActivity: [
          { type: "purchase", apiName: "Weather API", time: "2 hours ago", amount: 25 },
          { type: "call", apiName: "Geocoding API", time: "5 hours ago", count: 150 },
          { type: "review", apiName: "Translation API", time: "1 day ago", rating: 5 },
        ],
      })
    }
  }, [apis])

  if (loading && !apis.length) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6 w-full font-bricolage h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold  tracking-tight">Welcome back, {user?.name}</h2>
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
              {stats.totalCalls > 0 ? "+12% from last month" : "No API calls yet"}
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
              {stats.totalRevenue > 0 ? "+18% from last month" : "No revenue yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">+201 since last week</p>
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
                    <Button variant="secondary" className="w-full" onClick={() => navigate(`/apis/${api.id}`)}>
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
                  <Button onClick={() => navigate("/apis/create")}>
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
              {stats.recentActivity.length > 0 ? (
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
          <Card>
            <CardHeader>
              <CardTitle>Purchased APIs</CardTitle>
              <CardDescription>APIs you have purchased from the marketplace</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No purchased APIs yet</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate("/marketplace")}>
                  Browse Marketplace
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
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
  )
}

export default Dashboard

