"use client"

import { useState } from "react"
import { Copy, Info, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import EmptyState from "@/components/common/EmptyState"
import { toast } from "sonner"

export default function EndpointsTab({ api }) {
  // Copy to clipboard function
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  // Get method badge color
  const getMethodBadgeClass = (method) => {
    switch (method) {
      case "GET":
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
      case "POST":
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
      case "DELETE":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
      case "PUT":
      case "PATCH":
        return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
      default:
        return ""
    }
  }

  return (
    <>
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-lg font-medium">Available Endpoints</h3>
        <Badge variant="outline" className="font-mono text-xs">
          Base URL: {api.baseUrl}
        </Badge>
      </div>
      {api.endpoints.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 bg-card/50">
          <EmptyState
            icon={<Info className="h-8 w-8 text-muted-foreground" />}
            title="No Endpoints Available"
            description="This API doesn't have any documented endpoints yet."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {api.endpoints.map((endpoint) => (
            <EndpointCard
              key={endpoint.id}
              endpoint={endpoint}
              baseUrl={api.baseUrl}
              getMethodBadgeClass={getMethodBadgeClass}
              onCopy={copyToClipboard}
            />
          ))}
        </div>
      )}
    </>
  )
}

function EndpointCard({ endpoint, baseUrl, getMethodBadgeClass, onCopy }) {
  const [isOpen, setIsOpen] = useState(false)
  const fullUrl = `${baseUrl}${endpoint.path}`

  // Truncate URL if it's too long
  const truncateUrl = (url, maxLength = 40) => {
    if (url.length <= maxLength) return url

    const start = url.substring(0, maxLength / 2)
    const end = url.substring(url.length - maxLength / 2)
    return `${start}...${end}`
  }

  const displayUrl = truncateUrl(endpoint.path)
  const hasDetails = endpoint.headers || endpoint.requestBody || endpoint.responseSchema

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`font-mono text-xs ${getMethodBadgeClass(endpoint.method)}`}>
              {endpoint.method}
            </Badge>
            <CardTitle className="text-base font-medium">{endpoint.name}</CardTitle>
          </div>
          {endpoint.rateLimit && (
            <Badge variant="secondary" className="text-xs">
              {endpoint.rateLimit}/hr
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="py-2 px-4">
        <p className="text-sm text-muted-foreground mb-2">{endpoint.description || "No description provided"}</p>

        <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-md mb-2">
          <div className="font-mono text-xs truncate flex-1">
            <span className="text-muted-foreground">{baseUrl}</span>
            <span title={endpoint.path}>{displayUrl}</span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 shrink-0"
            onClick={() => onCopy(fullUrl)}
            title="Copy full URL"
          >
            <Copy className="h-4 w-4" />
            <span className="sr-only">Copy URL</span>
          </Button>
        </div>

        {/* Show request/response details if available */}
        {hasDetails && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center justify-between w-full p-2 text-sm">
                <span>Request/Response Details</span>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-3">
              {endpoint.headers && (
                <div className="text-xs">
                  <h4 className="font-semibold mb-1">Headers:</h4>
                  <pre className="bg-muted p-2 rounded-md overflow-x-auto text-xs">
                    {JSON.stringify(endpoint.headers, null, 2)}
                  </pre>
                </div>
              )}
              {endpoint.requestBody && (
                <div className="text-xs">
                  <h4 className="font-semibold mb-1">Request Body:</h4>
                  <pre className="bg-muted p-2 rounded-md overflow-x-auto text-xs">
                    {JSON.stringify(endpoint.requestBody, null, 2)}
                  </pre>
                </div>
              )}
              {endpoint.responseSchema && (
                <div className="text-xs">
                  <h4 className="font-semibold mb-1">Response Schema:</h4>
                  <pre className="bg-muted p-2 rounded-md overflow-x-auto text-xs">
                    {JSON.stringify(endpoint.responseSchema, null, 2)}
                  </pre>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  )
}

