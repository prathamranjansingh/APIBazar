"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Send } from "lucide-react"
import { toast } from "sonner"
import MarketplaceService from "@/lib/marketplace-service"

const EndpointTester = ({ api, endpoint }) => {
  const [testParams, setTestParams] = useState({})
  const [testHeaders, setTestHeaders] = useState(() => {
    const initialHeaders = {}
    if (endpoint.headers) {
      Object.keys(endpoint.headers).forEach((key) => {
        initialHeaders[key] = ""
      })
    }
    return initialHeaders
  })
  const [testBody, setTestBody] = useState("")
  const [testResponse, setTestResponse] = useState(null)
  const [testLoading, setTestLoading] = useState(false)
  const [showTestResponse, setShowTestResponse] = useState(false)

  // Handle test parameter change
  const handleParamChange = (key, value) => {
    setTestParams((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Handle test header change
  const handleHeaderChange = (key, value) => {
    setTestHeaders((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Handle test body change
  const handleBodyChange = (e) => {
    setTestBody(e.target.value)
  }

  // Test endpoint
  const handleTestEndpoint = async () => {
    if (!endpoint) return
    try {
      setTestLoading(true)
      setShowTestResponse(true)
      let parsedBody = null
      if (testBody) {
        try {
          parsedBody = JSON.parse(testBody)
        } catch (e) {
          setTestResponse({
            status: "error",
            statusCode: 400,
            data: { error: "Invalid JSON in request body" },
          })
          return
        }
      }
      const testData = {
        params: testParams,
        headers: testHeaders,
        body: parsedBody,
      }
      const response = await MarketplaceService.testEndpoint(api.id, endpoint.id, testData)
      setTestResponse(response)
    } catch (error) {
      setTestResponse({
        status: "error",
        statusCode: error.response?.status || 500,
        data: error.response?.data || { error: "An error occurred while testing the endpoint" },
      })
    } finally {
      setTestLoading(false)
    }
  }

  // Copy response to clipboard
  const handleCopyResponse = () => {
    if (!testResponse) return
    navigator.clipboard.writeText(JSON.stringify(testResponse, null, 2))
    toast.success("Response copied to clipboard")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Test {endpoint.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 sm:space-y-6">
          {/* Headers */}
          {endpoint.headers && Object.keys(endpoint.headers).length > 0 && (
            <div>
              <h3 className="text-sm sm:text-base font-medium mb-2">Headers</h3>
              <div className="grid gap-3 sm:gap-4">
                {Object.entries(endpoint.headers).map(([key, header]) => (
                  <div key={key} className="grid gap-1 sm:gap-2">
                    <Label htmlFor={`header-${key}`} className="text-xs sm:text-sm">
                      {key} {header.required && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id={`header-${key}`}
                      value={testHeaders[key] || ""}
                      onChange={(e) => handleHeaderChange(key, e.target.value)}
                      placeholder={header.description}
                      className="text-xs sm:text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Request Body */}
          {["POST", "PUT", "PATCH"].includes(endpoint.method) && (
            <div>
              <h3 className="text-sm sm:text-base font-medium mb-2">Request Body</h3>
              <div className="grid gap-1 sm:gap-2">
                <Label htmlFor="request-body" className="text-xs sm:text-sm">
                  JSON Body
                </Label>
                <Textarea
                  id="request-body"
                  value={testBody}
                  onChange={handleBodyChange}
                  placeholder="Enter JSON request body"
                  className="font-mono h-24 sm:h-32 text-xs sm:text-sm"
                />
              </div>
            </div>
          )}

          {/* Test Button */}
          <Button onClick={handleTestEndpoint} disabled={testLoading} className="w-full">
            {testLoading ? "Testing..." : "Test Endpoint"}
            <Send className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
          </Button>

          {/* Response */}
          {showTestResponse && (
            <div className="mt-4 sm:mt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm sm:text-base font-medium">Response</h3>
                <Button variant="ghost" size="sm" onClick={handleCopyResponse} disabled={!testResponse}>
                  <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="text-xs sm:text-sm">Copy</span>
                </Button>
              </div>
              <div className="rounded-md bg-muted p-3 sm:p-4 relative">
                {testLoading ? (
                  <div className="flex items-center justify-center h-24 sm:h-32">
                    <p className="text-sm">Loading response...</p>
                  </div>
                ) : testResponse ? (
                  <pre className="text-xs sm:text-sm overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(testResponse, null, 2)}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-24 sm:h-32">
                    <p className="text-xs sm:text-sm text-muted-foreground">No response yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default EndpointTester
