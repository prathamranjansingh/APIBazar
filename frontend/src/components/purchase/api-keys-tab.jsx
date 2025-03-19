import { Key, Lock, Copy } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import EmptyState from "@/components/common/EmptyState"
import { toast } from "sonner"

export default function ApiKeysTab({ apiKeys, apiId, onCreateKey, onRevokeKey }) {
  // Copy to clipboard function
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  return (
    <>
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-lg font-medium">Your API Keys</h3>
        <Button size="sm" className="gap-1" onClick={onCreateKey}>
          <Key className="h-4 w-4 mr-1" />
          Create New Key
        </Button>
      </div>

      {apiKeys.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 bg-card/50">
          <EmptyState
            icon={<Lock className="h-8 w-8 text-muted-foreground" />}
            title="No API Keys Yet"
            description="Create a key to start using this API in your applications."
            action={<Button onClick={onCreateKey}>Generate API Key</Button>}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((key) => (
            <ApiKeyCard key={key.id} apiKey={key} onCopy={copyToClipboard} onRevoke={onRevokeKey} />
          ))}
        </div>
      )}
    </>
  )
}

function ApiKeyCard({ apiKey, onCopy, onRevoke }) {
  // Truncate key if it's too long
  const truncateKey = (key, maxLength = 40) => {
    if (!key || key.length <= maxLength) return key

    const start = key.substring(0, 10)
    const end = key.substring(key.length - 10)
    return `${start}...${end}`
  }

  const displayKey = truncateKey(apiKey.key)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3 px-4">
        <div className="flex justify-between items-center gap-2 flex-wrap">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            {apiKey.name}
            {!apiKey.isActive && (
              <Badge variant="outline" className="text-destructive border-destructive text-xs">
                Revoked
              </Badge>
            )}
          </CardTitle>
          <div className="text-xs text-muted-foreground">
            Created: {new Date(apiKey.createdAt).toLocaleDateString()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-2 px-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
                <div className="font-mono text-xs truncate flex-1 break-all" title={apiKey.key}>
                  {displayKey}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 shrink-0"
                  onClick={() => onCopy(apiKey.key)}
                  disabled={!apiKey.isActive}
                >
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copy API Key</span>
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to copy full API key</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardContent>
      <CardFooter className="py-3 px-4">
        <div className="flex justify-between items-center w-full gap-2 flex-wrap">
          <div className="text-sm">
            {apiKey.rateLimit && <span className="text-muted-foreground">Rate Limit: {apiKey.rateLimit}/hr</span>}
          </div>
          {apiKey.isActive && (
            <Button variant="destructive" size="sm" onClick={() => onRevoke(apiKey.id)}>
              Revoke Key
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

