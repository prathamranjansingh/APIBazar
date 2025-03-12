"use client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthenticatedApi } from "../hooks/useAuthenticatedApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Code2,
  Plus,
  Search,
  Activity,
  DollarSign,
  Clock,
  Filter,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function ApisList() {
  const navigate = useNavigate();
  const { get, delete: deleteApi } = useAuthenticatedApi();
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredApis, setFilteredApis] = useState([]);
  const [deleteApiId, setDeleteApiId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";
  // Fetch APIs created by the current user
  const fetchApis = async () => {
    try {
      setLoading(true);
      const response = await get(`${API_BASE_URL}/apis/user/me`, { requireAuth: true });

      // Check if response is an object with a data property (common API pattern)
      const apisData = response.data ? response.data : response;

      // Ensure we're setting an array
      setApis(Array.isArray(apisData) ? apisData : []);
    } catch (error) {
      console.error("Error fetching APIs:", error);
      toast.error("Error", {
        description: "Failed to fetch your APIs. Please try again.",
      });
      setApis([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch APIs on component mount
  useEffect(() => {
    fetchApis();
  }, []);

  // Filter APIs based on search term
  useEffect(() => {
    
    const apisArray = Array.isArray(apis) ? apis : [];
    console.log("api",apisArray);
    
    setFilteredApis(
      apisArray.filter(
        (api) =>
          api.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          api.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          api.pricingModel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          api.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [apis, searchTerm]);

  // Handle API deletion
  const handleDeleteApi = async () => {
    if (!deleteApiId) return;
    try {
      setIsDeleting(true);
      await deleteApi(`${API_BASE_URL}/apis/${deleteApiId}`, { requireAuth: true });
      setApis(apis.filter((api) => api.id !== deleteApiId));
      toast.success("API Deleted", {
        description: "The API has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting API:", error);
      toast.error("Error", {
        description:
          error.response?.data?.error || "Failed to delete API. Please try again.",
      });
    } finally {
      setIsDeleting(false);
      setDeleteApiId(null);
    }
  };

  // Get pricing badge based on pricing model
  const getPricingBadge = (pricingModel) => {
    switch (pricingModel) {
      case "FREE":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
          >
            Free
          </Badge>
        );
      case "PAID":
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
          >
            Paid
          </Badge>
        );
      default:
        return null;
    }
  };

  // Format date for display
  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Show skeleton loader while loading
  if (loading) {
    return <ApisListSkeleton />;
  }


  return (
    <div className="space-y-6">
      {/* Header and Create API Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">My APIs</h2>
        <Button onClick={() => navigate("/apis/create")}>
          <Plus className="mr-2 h-4 w-4" /> Create API
        </Button>
      </div>

      {/* Search and Filter */}
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
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Categories</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setSearchTerm("general")}>General</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("finance")}>Finance</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("weather")}>Weather</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("social")}>Social</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchTerm("ai")}>AI</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* API List */}
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
                      <DropdownMenuItem onClick={() => navigate(`/apis/${api.id}`)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/apis/${api.id}/edit`)}>
                        Edit API
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteApiId(api.id)}
                      >
                        Delete API
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {api.category && (
                  <Badge variant="secondary" className="mt-2">
                    {api.category}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-muted-foreground" />
                      <span>{api.endpoints.length || 0} endpoints</span>
                    </div>
                    {api.analytics && (
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span>{api.analytics?.totalCalls || 0} calls</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {api.pricingModel === "PAID" ? `$${api.price?.toFixed(2)}` : "Free"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDateTime(api.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 p-3">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate(`/apis/${api.id}`)}
                >
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteApiId} onOpenChange={(open) => !open && setDeleteApiId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this API?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the API and all associated
              data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteApi}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete API"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Skeleton Loader for ApisList
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
  );
}

export default ApisList;