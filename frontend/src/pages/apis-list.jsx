"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useApi } from "../contexts/api-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Code2, Plus, Search, Activity, DollarSign, Clock, Filter, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function ApisList() {
  const navigate = useNavigate()
  const { apis, loading, fetchApis } = useApi()
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredApis, setFilteredApis] = useState([])

  useEffect(() => {
    fetchApis()
  }, [fetchApis])

  useEffect(() => {
    if (apis) {
      setFilteredApis(
        apis.filter(
          (api) =>
            api.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            api.description?.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      )
    }
  }, [apis, searchTerm])

  const getPricingBadge = (pricingModel) => {
    switch (pricingModel) {
      case "FREE":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            Free
          </Badge>
        )
      case "PAID":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            Paid
          </Badge>
        )
      case "SUBSCRIPTION":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
            Subscription
          </Badge>
        )
      default:
        return null
    }
  }

  if (loading && !apis.length) {
    return <ApisListSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">My APIs</h2>
        <Button onClick={() => navigate("/apis/create")}>
          <Plus className="mr-2 h-4 w-4" /> Create API
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search APIs..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSearchTerm("")}>All APIs</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("free")}>Free APIs</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("paid")}>Paid APIs</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("subscription")}>Subscription APIs</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filteredApis.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredApis.map((api) => (
            <Card key={api.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {api.name}
                      {getPricingBadge(api.pricingModel)}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {api.description?.substring(0, 100) || "No description provided"}
                      {api.description?.length > 100 ? "..." : ""}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/apis/${api.id}`)}>View Details</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/apis/${api.id}/edit`)}>Edit API</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Delete API</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-muted-foreground" />
                      <span>{api.endpoints?.length || 0} endpoints</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span>{api.analytics?.totalCalls || 0} calls</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {api.pricingModel === "FREE" ? "Free" : api.pricingModel === "PAID" ? "Paid" : "Subscription"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(api.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 p-3">
                <Button variant="secondary" className="w-full" onClick={() => navigate(`/apis/${api.id}`)}>
                  Manage API
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center p-8">
          <div className="flex flex-col items-center justify-center py-8">
            <Code2 className="h-12 w-12 text-muted-foreground/50 mb-3" />
            {searchTerm ? (
              <>
                <p className="text-xl font-semibold mb-2">No APIs found</p>
                <p className="text-muted-foreground mb-4">No APIs match your search criteria</p>
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Clear Search
                </Button>
              </>
            ) : (
              <>
                <p className="text-xl font-semibold mb-2">No APIs yet</p>
                <p className="text-muted-foreground mb-4">Create your first API to get started</p>
                <Button onClick={() => navigate("/apis/create")}>
                  <Plus className="mr-2 h-4 w-4" /> Create API
                </Button>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

function ApisListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[150px]" />
        <Skeleton className="h-10 w-[150px]" />
      </div>

      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-[100px]" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <Skeleton className="h-6 w-[150px] mb-2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[80%] mt-1" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-4 w-[120px]" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 p-3">
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
      </div>
    </div>
  )
}

export default ApisList

