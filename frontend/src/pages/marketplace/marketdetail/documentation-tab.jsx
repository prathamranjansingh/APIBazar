import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Info, CheckCircle, X } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const DocumentationTab = ({ selectedEndpoint, api }) => {
  if (!selectedEndpoint) {
    return (
      <div className="flex items-center justify-center h-[300px] sm:h-[400px]">
        <div className="text-center px-4">
          <Info className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium">Select an endpoint</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Choose an endpoint from the sidebar to view its documentation
          </p>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center">
          <Badge
            className="mr-2 uppercase font-mono text-[10px] sm:text-xs"
            variant={
              selectedEndpoint.method === "GET"
                ? "secondary"
                : selectedEndpoint.method === "POST"
                  ? "default"
                  : selectedEndpoint.method === "PUT"
                    ? "outline"
                    : selectedEndpoint.method === "DELETE"
                      ? "destructive"
                      : "outline"
            }
          >
            {selectedEndpoint.method}
          </Badge>
          <CardTitle className="text-lg sm:text-xl truncate">{selectedEndpoint.name}</CardTitle>
        </div>
        <CardDescription className="font-mono overflow-hidden text-ellipsis whitespace-nowrap text-xs sm:text-sm">
          <span className="truncate block">
            {api.baseUrl}
            {selectedEndpoint.path}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm sm:text-base">{selectedEndpoint.description}</p>
        <Accordion type="single" collapsible defaultValue="headers">
          {/* Headers Section */}
          <AccordionItem value="headers">
            <AccordionTrigger className="text-sm sm:text-base font-medium">Headers</AccordionTrigger>
            <AccordionContent>
              {selectedEndpoint.headers && Object.keys(selectedEndpoint.headers).length > 0 ? (
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-2 sm:px-4 py-2 text-left font-medium">Name</th>
                        <th className="px-2 sm:px-4 py-2 text-left font-medium">Description</th>
                        <th className="px-2 sm:px-4 py-2 text-left font-medium">Required</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(selectedEndpoint.headers).map(([key, header]) => (
                        <tr key={key} className="border-b">
                          <td className="px-2 sm:px-4 py-2 font-mono">{key}</td>
                          <td className="px-2 sm:px-4 py-2">{header.description}</td>
                          <td className="px-2 sm:px-4 py-2">
                            {header.required ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No headers required for this endpoint</p>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Request Body Section */}
          {["POST", "PUT", "PATCH"].includes(selectedEndpoint.method) && (
            <AccordionItem value="requestBody">
              <AccordionTrigger className="text-sm sm:text-base font-medium">Request Body</AccordionTrigger>
              <AccordionContent>
                {selectedEndpoint.requestBody ? (
                  <div className="space-y-4">
                    <div className="rounded-md bg-muted p-2 sm:p-4 overflow-x-auto">
                      <pre className="text-xs sm:text-sm">{JSON.stringify(selectedEndpoint.requestBody, null, 2)}</pre>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No request body schema defined for this endpoint</p>
                )}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Response Schema Section */}
          <AccordionItem value="responseSchema">
            <AccordionTrigger className="text-sm sm:text-base font-medium">Response Schema</AccordionTrigger>
            <AccordionContent>
              {selectedEndpoint.responseSchema ? (
                <div className="space-y-4">
                  <div className="rounded-md bg-muted p-2 sm:p-4 overflow-x-auto">
                    <pre className="text-xs sm:text-sm">{JSON.stringify(selectedEndpoint.responseSchema, null, 2)}</pre>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No response schema defined for this endpoint</p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}

export default DocumentationTab
