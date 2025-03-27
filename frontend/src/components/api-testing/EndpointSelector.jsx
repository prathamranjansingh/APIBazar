"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

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
        return "bg-green-100 text-green-800"
      case "POST":
        return "bg-blue-100 text-blue-800"
      case "PUT":
        return "bg-yellow-100 text-yellow-800"
      case "DELETE":
        return "bg-red-100 text-red-800"
      case "PATCH":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  useEffect(() => {
    setSelectedEndpoint(selectedEndpoint)
  }, [selectedEndpoint, setSelectedEndpoint])

  return (
    <div className="w-full">
      <Input
        type="search"
        placeholder="Search endpoints..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />
      <ScrollArea className="h-[450px] pr-4">
        <div className="space-y-2 pb-2">
          {filteredEndpoints.map((endpoint) => (
            <div
              key={endpoint.id}
              className={`p-3 rounded-md cursor-pointer transition-colors ${
                selectedEndpoint === endpoint.id ? "bg-[#EF6606] text-primary-foreground" : "hover:bg-muted"
              }`}
              onClick={() => setSelectedEndpointInternal(endpoint.id)}
            >
              <div className="flex items-center gap-2 mb-1">
                {/* HTTP Method Badge */}
                <Badge
                  variant="outline"
                  className={`font-mono text-xs px-2 flex-shrink-0 ${
                    selectedEndpoint === endpoint.id
                      ? "bg-primary-foreground text-primary"
                      : getMethodColor(endpoint.method)
                  }`}
                >
                  {endpoint.method}
                </Badge>

                {/* Endpoint Path */}
                <span className="truncate text-sm">{endpoint.path}</span>
              </div>

              {/* Endpoint Name */}
              <div className="text-sm text-ellipsis overflow-hidden">{endpoint.name}</div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

export default EndpointSelector

