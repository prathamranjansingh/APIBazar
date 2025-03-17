import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

const EndpointSelector = ({ endpoints = [], selectedEndpoint, setSelectedEndpoint }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter endpoints based on search term
  const filteredEndpoints = endpoints
    ? endpoints.filter(
        (endpoint) =>
          endpoint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          endpoint.path.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Get color class based on HTTP method
  const getMethodColor = (method) => {
    switch (method.toUpperCase()) {
      case "GET":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "POST":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "PUT":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
      case "DELETE":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "PATCH":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="h-full">
      <h2 className="text-lg font-semibold mb-4">API Endpoints</h2>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search endpoints..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Endpoint List */}
      {!endpoints || endpoints.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          No endpoints available for this API
        </div>
      ) : (
        <ScrollArea className="h-[450px] pr-4">
          <div className="space-y-2">
            {filteredEndpoints.map((endpoint) => (
              <div
                key={endpoint.id}
                className={`p-3 rounded-md cursor-pointer transition-colors ${
                  selectedEndpoint === endpoint.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
                onClick={() => setSelectedEndpoint(endpoint.id)}
              >
                <div className="flex items-center gap-2 mb-1">
                  {/* HTTP Method Badge */}
                  <Badge
                    variant="outline"
                    className={`font-mono text-xs px-2 ${
                      selectedEndpoint === endpoint.id
                        ? "bg-primary-foreground text-primary"
                        : getMethodColor(endpoint.method)
                    }`}
                  >
                    {endpoint.method}
                  </Badge>

                  {/* Endpoint Path */}
                  <span className="truncate">{endpoint.path}</span>
                </div>

                {/* Endpoint Name */}
                <span className="text-sm">{endpoint.name}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default EndpointSelector;