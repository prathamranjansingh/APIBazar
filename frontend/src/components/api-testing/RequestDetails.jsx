import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
import { PlayIcon, LockIcon, AlertTriangleIcon } from "lucide-react";

const RequestDetails = ({
  endpoint,
  sampleRequest,
  executeTest,
  isLoading,
  isAuthenticated,
  hasPurchased,
  api,
  loginWithRedirect
}) => {
  const hasHeaders = sampleRequest.headers && Object.keys(sampleRequest.headers).length > 0;
  const hasQueryParams = sampleRequest.queryParams && Object.keys(sampleRequest.queryParams).length > 0;
  const hasBody = sampleRequest.body && Object.keys(sampleRequest.body).length > 0;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">{endpoint.name}</h2>
        <p className="text-muted-foreground mt-1">{endpoint.description || "No description provided"}</p>
      </div>
      <div className="bg-muted p-3 rounded-lg flex items-center gap-2 mb-6 font-mono text-sm overflow-auto">
        <Badge
          variant="outline"
          className={getMethodBadgeClass(sampleRequest.method)}
        >
          {sampleRequest.method}
        </Badge>
        <span className="truncate">{sampleRequest.url}</span>
      </div>
      <Accordion type="multiple" defaultValue={["headers", "queryParams", "body"].filter(section => {
        if (section === "headers") return hasHeaders;
        if (section === "queryParams") return hasQueryParams;
        if (section === "body") return hasBody;
        return false;
      })}>
        {hasHeaders && (
          <AccordionItem value="headers">
            <AccordionTrigger>Headers</AccordionTrigger>
            <AccordionContent>
              <CodeBlock language="json" showLineNumbers={false}>
                {JSON.stringify(sampleRequest.headers, null, 2)}
              </CodeBlock>
            </AccordionContent>
          </AccordionItem>
        )}
        {hasQueryParams && (
          <AccordionItem value="queryParams">
            <AccordionTrigger>Query Parameters</AccordionTrigger>
            <AccordionContent>
              <CodeBlock language="json" showLineNumbers={false}>
                {JSON.stringify(sampleRequest.queryParams, null, 2)}
              </CodeBlock>
            </AccordionContent>
          </AccordionItem>
        )}
        {hasBody && (
          <AccordionItem value="body">
            <AccordionTrigger>Request Body</AccordionTrigger>
            <AccordionContent>
              <CodeBlock language="json">
                {JSON.stringify(sampleRequest.body, null, 2)}
              </CodeBlock>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
      <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
        <Button
          onClick={executeTest}
          disabled={isLoading}
          className="w-full sm:w-auto gap-2"
          size="lg"
        >
          <PlayIcon className="h-4 w-4" />
          {isLoading ? "Testing..." : "Test Endpoint"}
        </Button>
        {api.pricingModel === 'PAID' && !hasPurchased && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <AlertTriangleIcon className="h-4 w-4 text-amber-500" />
            Testing with public limitations
          </div>
        )}
        {!isAuthenticated && (
          <Button
            variant="outline"
            onClick={() => loginWithRedirect()}
            className="w-full sm:w-auto gap-2"
          >
            <LockIcon className="h-4 w-4" />
            Log in for full access
          </Button>
        )}
      </div>
    </div>
  );
};

const getMethodBadgeClass = (method) => {
  switch (method.toUpperCase()) {
    case 'GET': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'POST': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'PUT': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
    case 'DELETE': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'PATCH': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

export default RequestDetails;