import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import MarketplaceService from '@/lib/marketplace-service';

const ApiMarketplace = () => {
  const navigate = useNavigate();
  const [apis, setApis] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    limit: 10,
  });
  const [categories, setCategories] = useState([
    'Data',
    'Finance',
    'Weather',
    'Social',
    'E-commerce',
    'Communication',
    'AI',
    'Analytics',
    'Maps',
    'Other',
  ]);

  // Fetch APIs with search and filter
  const fetchApis = async () => {
    try {
      setIsLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (searchQuery) {
        params.search = searchQuery;
      }
      if (category) {
        params.category = category;
      }
      const response = await MarketplaceService.getAllApis(params);
      setApis(response.data);
      setPagination({
        ...pagination,
        totalPages: response.pagination.totalPages,
      });
    } catch (error) {
      toast.error('Failed to load APIs');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchApis();
  }, [pagination.page, category]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page === 1) {
        fetchApis();
      } else {
        setPagination({ ...pagination, page: 1 });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle category change
  const handleCategoryChange = (value) => {
    setCategory(value === "all" ? "" : value);
    setPagination({ ...pagination, page: 1 });
  };

  // Navigate to API details
  const handleViewApi = (apiId) => {
    navigate(`/marketplace/${apiId}`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold">API Marketplace</h1>
        <p className="text-muted-foreground">
          Discover and connect to APIs for your applications
        </p>

        {/* Search and filter */}
        <div className="flex flex-col sm:flex-row gap-4 my-6">
          <div className="flex-1">
            <Input
              placeholder="Search APIs by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select onValueChange={handleCategoryChange}
            value={category === "" ? "all" : category}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* API Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-28" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {apis.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium">No APIs found</h3>
                <p className="text-muted-foreground mt-2">
                  Try changing your search criteria or check back later
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {apis.map((api) => (
                  <Card key={api.id} className="overflow-hidden flex flex-col h-full">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl truncate">{api.name}</CardTitle>
                        <Badge variant={api.pricingModel === 'FREE' ? 'secondary' : 'default'}>
                          {api.pricingModel === 'FREE' ? 'Free' : `$${api.price}`}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <span className="truncate">{api.category}</span>
                        <span className="text-muted-foreground text-xs">
                          • {api._count.purchasedBy} users
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm line-clamp-3">{api.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {api.endpoints.slice(0, 3).map((endpoint) => (
                          <Badge key={endpoint.id} variant="outline" className="text-xs">
                            {endpoint.method} {endpoint.path.split('/').pop()}
                          </Badge>
                        ))}
                        {api.endpoints.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{api.endpoints.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-2 border-t">
                      <div className="flex items-center text-sm">
                        <img
                          src={api.owner.picture || '/default-avatar.png'}
                          alt={api.owner.name}
                          className="w-6 h-6 rounded-full mr-2"
                        />
                        <span className="truncate">{api.owner.name}</span>
                      </div>
                      <Button onClick={() => handleViewApi(api.id)}>View Details</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Pagination className="mt-8">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        pagination.page > 1 &&
                        setPagination({ ...pagination, page: pagination.page - 1 })
                      }
                      className={
                        pagination.page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    // Logic to show current page and nearby pages
                    let pageNumber;
                    if (pagination.totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNumber = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNumber = pagination.totalPages - 4 + i;
                    } else {
                      pageNumber = pagination.page - 2 + i;
                    }
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          isActive={pageNumber === pagination.page}
                          onClick={() => setPagination({ ...pagination, page: pageNumber })}
                          className="cursor-pointer"
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        pagination.page < pagination.totalPages &&
                        setPagination({ ...pagination, page: pagination.page + 1 })
                      }
                      className={
                        pagination.page >= pagination.totalPages
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ApiMarketplace;