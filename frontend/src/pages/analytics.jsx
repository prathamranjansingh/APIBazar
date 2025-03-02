"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, TrendingUp, Users, DollarSign, Clock } from "lucide-react"

function Analytics() {
  const [timeRange, setTimeRange] = useState("30d")

  // In a real app, you would fetch this data from your backend
  const analyticsData = {
    totalCalls: 12450,
    totalRevenue: 2350,
    activeUsers: 573,
    avgResponseTime: 125,
    callsByApi: [
      { name: "Weather API", calls: 5230, growth: 12 },
      { name: "Geocoding API", calls: 3120, growth: 8 },
      { name: "Translation API", calls: 2100, growth: -3 },
      { name: "Payment API", calls: 2000, growth: 15 },
    ],
    revenueByApi: [
      { name: "Weather API", revenue: 950, growth: 10 },
      { name: "Geocoding API", revenue: 750, growth: 5 },
      { name: "Translation API", revenue: 350, growth: -2 },
      { name: "Payment API", revenue: 300, growth: 20 },
    ],
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalCalls.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% from previous period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analyticsData.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+18% from previous period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.activeUsers}</div>
            <p className="text-xs text-muted-foreground">+201 since last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.avgResponseTime} ms</div>
            <p className="text-xs text-muted-foreground">-5ms from previous period</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="calls" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calls">API Calls</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="calls">
          <Card>
            <CardHeader>
              <CardTitle>API Calls by API</CardTitle>
              <CardDescription>Number of API calls for each of your APIs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {analyticsData.callsByApi.map((api, index) => (
                  <div key={index} className="flex items-center">
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none">{api.name}</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span>{api.calls.toLocaleString()} calls</span>
                        <span
                          className={`ml-2 flex items-center text-xs ${api.growth >= 0 ? "text-green-500" : "text-red-500"}`}
                        >
                          <TrendingUp className={`h-3 w-3 mr-1 ${api.growth < 0 ? "rotate-180" : ""}`} />
                          {Math.abs(api.growth)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-[30%] h-2 relative rounded-full overflow-hidden bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${(api.calls / Math.max(...analyticsData.callsByApi.map((a) => a.calls))) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 h-[300px] flex items-center justify-center bg-muted rounded-md">
                <p className="text-muted-foreground">API calls chart will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by API</CardTitle>
              <CardDescription>Revenue generated by each of your APIs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {analyticsData.revenueByApi.map((api, index) => (
                  <div key={index} className="flex items-center">
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none">{api.name}</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span>${api.revenue.toLocaleString()}</span>
                        <span
                          className={`ml-2 flex items-center text-xs ${api.growth >= 0 ? "text-green-500" : "text-red-500"}`}
                        >
                          <TrendingUp className={`h-3 w-3 mr-1 ${api.growth < 0 ? "rotate-180" : ""}`} />
                          {Math.abs(api.growth)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-[30%] h-2 relative rounded-full overflow-hidden bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${(api.revenue / Math.max(...analyticsData.revenueByApi.map((a) => a.revenue))) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 h-[300px] flex items-center justify-center bg-muted rounded-md">
                <p className="text-muted-foreground">Revenue chart will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Analytics</CardTitle>
              <CardDescription>User activity and engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center bg-muted rounded-md">
                <p className="text-muted-foreground">User analytics will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Analytics

