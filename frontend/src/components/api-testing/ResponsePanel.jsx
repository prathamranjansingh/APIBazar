import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import {
  Clock,
  AlertTriangle,
  Check,
  X,
  Copy,
  FileCode,
  FileJson,
  Server,
  Lock
} from "lucide-react";
import { toast } from "sonner";

const ResponsePanel = ({ testResponse, curlCommand }) => {
  const [activeTab, setActiveTab] = useState("body");

  const copyToClipboard = (text, message) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success(message);
      })
      .catch(err => {
        toast.error("Failed to copy to clipboard");
        console.error(err);
      });
  };

  const isJson = (str) => {
    try {
      return typeof JSON.parse(str) === 'object';
    } catch (e) {
      return false;
    }
  };

  const formatData = (data) => {
    if (typeof data === 'object') {
      return JSON.stringify(data, null, 2);
    }
    if (typeof data === 'string' && isJson(data)) {
      return JSON.stringify(JSON.parse(data), null, 2);
    }
    return data;
  };

  const getStatusClass = (status) => {
    if (status >= 200 && status < 300) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    if (status >= 400 && status < 500) return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
    if (status >= 500) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  };

  return (
    <div>
      <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className={getStatusClass(testResponse.response?.status)}>
            {testResponse.response?.status} {testResponse.response?.statusText}
          </Badge>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{testResponse.duration}ms</span>
          </div>
          {testResponse.response?.size && (
            <div className="text-sm text-muted-foreground">
              {Math.round(testResponse.response.size / 1024)}KB
            </div>
          )}
          {testResponse.cache === "HIT" && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              Cached
            </Badge>
          )}
        </div>
        <div className="flex items-center">
          {testResponse.success ? (
            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" />
              <span>Successful</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
              <X className="h-4 w-4" />
              <span>Failed</span>
            </div>
          )}
        </div>
      </div>
      {testResponse.publicTesting && (
        <div className="mb-6 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md p-3 text-amber-800 dark:text-amber-300">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium flex items-center gap-2">
                <Lock className="h-3.5 w-3.5" />
                Public Testing Mode
              </p>
              <p className="text-sm mt-1">{testResponse.publicTesting.message}</p>
              {testResponse.publicTesting.truncated && (
                <p className="text-sm mt-1">Response has been truncated. Purchase the API for complete results.</p>
              )}
            </div>
          </div>
        </div>
      )}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="body" className="flex-1">
            <FileJson className="h-4 w-4 mr-2" />
            Response Body
          </TabsTrigger>
          <TabsTrigger value="headers" className="flex-1">
            <Server className="h-4 w-4 mr-2" />
            Headers
          </TabsTrigger>
          {curlCommand && (
            <TabsTrigger value="curl" className="flex-1">
              <FileCode className="h-4 w-4 mr-2" />
              cURL
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="body" className="min-h-[300px]">
          {testResponse.error ? (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
              <h3 className="text-red-800 dark:text-red-300 font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Error
              </h3>
              <p className="text-red-700 dark:text-red-300 text-sm mb-2">
                {testResponse.error.message}
              </p>
              <CodeBlock language="json" showLineNumbers={false}>
                {JSON.stringify(testResponse.error, null, 2)}
              </CodeBlock>
            </div>
          ) : testResponse.response?.data ? (
            <div className="relative">
              <Button
                size="sm"
                variant="outline"
                className="absolute right-2 top-2 gap-1.5"
                onClick={() => copyToClipboard(
                  formatData(testResponse.response.data),
                  "Response copied to clipboard"
                )}
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </Button>
              <CodeBlock language={typeof testResponse.response.data === 'object' ? "json" : "text"}>
                {formatData(testResponse.response.data)}
              </CodeBlock>
            </div>
          ) : (
            <p className="text-muted-foreground p-4 text-center">No response data available</p>
          )}
        </TabsContent>
        <TabsContent value="headers" className="min-h-[300px]">
          {testResponse.response?.headers && Object.keys(testResponse.response.headers).length > 0 ? (
            <div className="relative">
              <Button
                size="sm"
                variant="outline"
                className="absolute right-2 top-2 gap-1.5"
                onClick={() => copyToClipboard(
                  JSON.stringify(testResponse.response.headers, null, 2),
                  "Headers copied to clipboard"
                )}
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </Button>
              <CodeBlock language="json" showLineNumbers={false}>
                {JSON.stringify(testResponse.response.headers, null, 2)}
              </CodeBlock>
            </div>
          ) : (
            <p className="text-muted-foreground p-4 text-center">No headers available</p>
          )}
        </TabsContent>
        {curlCommand && (
          <TabsContent value="curl" className="min-h-[300px]">
            <div className="relative">
              <Button
                size="sm"
                variant="outline"
                className="absolute right-2 top-2 gap-1.5"
                onClick={() => copyToClipboard(curlCommand, "cURL command copied to clipboard")}
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </Button>
              <CodeBlock language="bash">
                {curlCommand}
              </CodeBlock>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ResponsePanel;