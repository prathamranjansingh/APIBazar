import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart, RefreshCcw } from "lucide-react"
import LineChart from "@/components/ui/line-chart"
import EmptyState from "@/components/common/EmptyState"

export default function AnalyticsTab({ analytics, isLoading, onRefresh }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Usage Analytics</h3>
          <Button variant="outline" size="sm" onClick={onRefresh} className="gap-1">
            <RefreshCcw className="h-4 w-4 mr-1" />
            Refresh Data
          </Button>
        </div>
        <div className="rounded-lg border border-dashed p-6 bg-card/50">
          <EmptyState
            icon={<BarChart className="h-8 w-8 text-muted-foreground" />}
            title="No Analytics Available"
            description="We don't have usage data for this API yet."
            action={<Button onClick={onRefresh}>Load Analytics</Button>}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Usage Analytics</h3>
        <Button variant="outline" size="sm" onClick={onRefresh} className="gap-1">
          <RefreshCcw className="h-4 w-4 mr-1" />
          Refresh Data
        </Button>
      </div>

      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base">Request Volume</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="h-64">
            <LineChart data={analytics.requestsOverTime || []} xField="date" yField="count" tooltipLabel="Requests" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ResponseCodesCard responseCodes={analytics.responseCodes} />
        <EndpointUsageCard endpointUsage={analytics.endpointUsage} />
      </div>
    </div>
  )
}

function ResponseCodesCard({ responseCodes }) {
  const getStatusCodeClass = (code) => {
    if (code.startsWith("2")) {
      return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
    } else if (code.startsWith("4")) {
      return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
    } else if (code.startsWith("5")) {
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
    }
    return ""
  }

  const getStatusText = (code) => {
    const statusTexts = {
      "200": "OK",
      "201": "Created",
      "400": "Bad Request",
      "401": "Unauthorized",
      "403": "Forbidden",
      "404": "Not Found",
      "429": "Too Many Requests",
      "500": "Server Error",
    }
    return statusTexts[code] || ""
  }

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-base">Response Codes</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="space-y-3">
          {responseCodes ? (
            Object.entries(responseCodes).map(([code, count]) => (
              <div key={code} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getStatusCodeClass(code)}>
                    {code}
                  </Badge>
                  <span className="text-sm">{getStatusText(code)}</span>
                </div>
                <span className="font-medium">{count}</span>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground">No data available</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function EndpointUsageCard({ endpointUsage }) {
  // Truncate endpoint path if it's too long
  const truncateEndpoint = (endpoint, maxLength = 30) => {
    if (endpoint.length <= maxLength) return endpoint

    const parts = endpoint.split("/")
    if (parts.length <= 2) return `${endpoint.substring(0, maxLength)}...`

    const start = parts.slice(0, 1).join("/")
    const end = parts.slice(-1).join("/")
    return `${start}/.../${end}`
  }

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-base">Endpoint Usage</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="space-y-3">
          {endpointUsage ? (
            Object.entries(endpointUsage)
              .sort((a, b) => b[1] - a[1])
              .map(([endpoint, count]) => (
                <div key={endpoint} className="flex justify-between items-center">
                  <div className="truncate max-w-[70%] text-sm" title={endpoint}>
                    {truncateEndpoint(endpoint)}
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))
          ) : (
            <p className="text-center text-muted-foreground">No data available</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

