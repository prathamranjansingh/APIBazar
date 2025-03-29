import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Search, Server } from "lucide-react"

const EndpointSelector = ({ endpoints, setSelectedEndpoint }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredEndpoints, setFilteredEndpoints] = useState(endpoints)
  const [selectedEndpoint, setSelectedEndpointInternal] = useState(null)

  useEffect(() => {
    setFilteredEndpoints(endpoints)
  }, [endpoints])

  useEffect(() => {
    const results = endpoints.filter((endpoint) => {
      const searchString = `${endpoint.name} ${endpoint.path} ${endpoint.method}`.toLowerCase()
      return searchString.includes(searchTerm.toLowerCase())
    })
    setFilteredEndpoints(results)
  }, [searchTerm, endpoints])

  const getMethodColor = (method) => {
    switch (method) {
      case "GET":
        return "bg-green-100 text-green-800 border-green-200"
      case "POST":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "PUT":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "DELETE":
        return "bg-red-100 text-red-800 border-red-200"
      case "PATCH":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  useEffect(() => {
    setSelectedEndpoint(selectedEndpoint)
  }, [selectedEndpoint, setSelectedEndpoint])

  return (
    <div className="w-full rounded-lg border border-border p-4 bg-card shadow-sm">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="search"
          placeholder="Search endpoints..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 bg-background border-muted focus-visible:ring-2 focus-visible:ring-offset-0"
        />
      </div>
      
      {filteredEndpoints.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-60 text-muted-foreground">
          <Server className="h-12 w-12 mb-2 opacity-30" />
          <p>No endpoints found</p>
        </div>
      ) : (
        <ScrollArea className="h-[450px] pr-4">
          <div className="space-y-2 pb-2">
            {filteredEndpoints.map((endpoint) => (
              <div
                key={endpoint.id}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                  selectedEndpoint === endpoint.id 
                    ? "bg-[#EF6606]/10 border-[#EF6606] shadow" 
                    : "hover:bg-muted/50 border-transparent hover:border-muted"
                }`}
                onClick={() => setSelectedEndpointInternal(endpoint.id)}
              >
                <div className="flex items-center gap-2 mb-2">
                  {/* HTTP Method Badge */}
                  <Badge
                    variant="outline"
                    className={`font-mono text-xs px-2 py-0.5 flex-shrink-0 font-semibold border ${
                      selectedEndpoint === endpoint.id
                        ? "bg-[#EF6606] text-white border-[#EF6606]"
                        : getMethodColor(endpoint.method)
                    }`}
                  >
                    {endpoint.method}
                  </Badge>

                  {/* Endpoint Path */}
                  <span className={`truncate font-mono text-sm ${selectedEndpoint === endpoint.id ? "text-[#EF6606] font-medium" : "text-foreground"}`}>
                    {endpoint.path}
                  </span>
                </div>

                {/* Endpoint Name */}
                <div className={`text-sm ${selectedEndpoint === endpoint.id ? "text-foreground" : "text-muted-foreground"}`}>
                  {endpoint.name}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

export default EndpointSelector