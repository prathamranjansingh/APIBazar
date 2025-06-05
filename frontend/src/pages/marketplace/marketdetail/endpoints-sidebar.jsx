"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

const EndpointsSidebar = ({ endpoints, selectedEndpoint, onSelectEndpoint }) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg sm:text-xl">Endpoints</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {endpoints.length} {endpoints.length === 1 ? "endpoint" : "endpoints"} available
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] sm:h-[calc(100vh-400px)] p-4 pt-0">
          {endpoints.map((endpoint) => (
            <div
              key={endpoint.id}
              className={`
                mb-2 p-2 sm:p-3 rounded-md cursor-pointer transition-colors
                ${
                  selectedEndpoint?.id === endpoint.id
                    ? "bg-primary/10 border-l-2 border-primary"
                    : "hover:bg-secondary/50"
                }
              `}
              onClick={() => onSelectEndpoint(endpoint)}
            >
              <div className="flex items-center">
                <Badge
                  className="mr-2 uppercase font-mono text-[10px] sm:text-xs"
                  variant={
                    endpoint.method === "GET"
                      ? "secondary"
                      : endpoint.method === "POST"
                        ? "default"
                        : endpoint.method === "PUT"
                          ? "outline"
                          : endpoint.method === "DELETE"
                            ? "destructive"
                            : "outline"
                  }
                >
                  {endpoint.method}
                </Badge>
                <span className="font-medium truncate text-sm sm:text-base">{endpoint.name}</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-mono truncate">{endpoint.path}</p>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export default EndpointsSidebar
