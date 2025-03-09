// src/components/api-detail/api-endpoints.jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash, Plus, Gauge } from "lucide-react"

export function ApiEndpoints({
  endpoints,
  baseUrl,
  isOwner,
  managementMode,
  onEdit,
  onDelete,
  onAdd
}) {
  const getMethodColor = (method) => {
    switch (method) {
      case "GET": return "bg-green-100 text-green-800 border-green-200"
      case "POST": return "bg-blue-100 text-blue-800 border-blue-200"
      case "PUT": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "DELETE": return "bg-red-100 text-red-800 border-red-200"
      case "PATCH": return "bg-purple-100 text-purple-800 border-purple-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatJson = (jsonData) => {
    if (!jsonData) return ""
    try {
      return JSON.stringify(jsonData, null, 2)
    } catch (e) {
      return String(jsonData)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <h2 className="text-2xl font-bold">API Endpoints</h2>
        {isOwner && managementMode && (
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" /> Add Endpoint
          </Button>
        )}
      </div>
      {endpoints.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No endpoints have been defined for this API yet.</p>
            {isOwner && managementMode && (
              <Button onClick={onAdd}>
                <Plus className="h-4 w-4 mr-2" /> Add Your First Endpoint
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {endpoints.map((endpoint) => (
            <Card key={endpoint.id} className="overflow-hidden">
              <CardHeader className="bg-muted/40">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getMethodColor(endpoint.method)}>
                        {endpoint.method}
                      </Badge>
                      <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                        {baseUrl}{endpoint.path}
                      </code>
                    </div>
                    <CardTitle className="text-lg">{endpoint.name}</CardTitle>
                  </div>
                  {isOwner && managementMode && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(endpoint)}
                      >
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDelete(endpoint)}
                      >
                        <Trash className="h-4 w-4 mr-2" /> Delete
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="py-4">
                {endpoint.description && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-1">Description</h4>
                    <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                  </div>
                )}
                {endpoint.rateLimit && (
                  <div className="mb-4 flex items-center">
                    <Gauge className="h-4 w-4 mr-1" />
                    <span className="text-sm">Rate Limit: {endpoint.rateLimit} req/min</span>
                  </div>
                )}
                {endpoint.parameters && endpoint.parameters.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Parameters</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Required</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {endpoint.parameters.map((param, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono">{param.name}</TableCell>
                            <TableCell>{param.required ? "Yes" : "No"}</TableCell>
                            <TableCell>{param.description || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {endpoint.requestBody && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Request Body</h4>
                    <pre className="bg-muted p-3 rounded-md overflow-x-auto font-mono text-sm">
                      {formatJson(endpoint.requestBody)}
                    </pre>
                  </div>
                )}
                {endpoint.responseSchema && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Response</h4>
                    <pre className="bg-muted p-3 rounded-md overflow-x-auto font-mono text-sm">
                      {formatJson(endpoint.responseSchema)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}