// src/components/api-detail/api-subscription.jsx
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Key, Clipboard, Check, AlertTriangle } from "lucide-react"
import { useAuthenticatedApi } from "../../hooks/useAuthenticatedApi"
import { toast } from "sonner"

export function ApiSubscription({ api, isOwner, hasPurchased, onGenerateKey, onPurchase }) {
  const [apiKeys, setApiKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)
  const { get, delete: deleteRequest } = useAuthenticatedApi()

  useEffect(() => {
    const fetchApiKeys = async () => {
      if (!isOwner && !hasPurchased) return
      try {
        setLoading(true)
        const response = await get('/api/keys/me', { requireAuth: true })
        const keysForThisApi = Array.isArray(response) ? response.filter(key => key.apiId === api.id) : []
        setApiKeys(keysForThisApi)
      } catch (error) {
        console.error("Error fetching API keys:", error)
        toast.error("Error", {
          description: "Failed to load API keys.",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchApiKeys()
  }, [api.id, isOwner, hasPurchased])

  const handleRevokeKey = async (keyId) => {
    try {
      await deleteRequest(`/api/keys/${keyId}`, { requireAuth: true })
      setApiKeys(apiKeys.filter(key => key.id !== keyId))
      toast.success("Key Revoked", {
        description: "API key has been successfully revoked.",
      })
    } catch (error) {
      console.error("Error revoking API key:", error)
      toast.error("Error", {
        description: "Failed to revoke API key.",
      })
    }
  }

  const copyToClipboard = (key, id) => {
    navigator.clipboard.writeText(key)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Never expires"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  if (!isOwner && !hasPurchased) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Required</CardTitle>
          <CardDescription>
            You need to purchase this API to access its features.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Purchase Required</h3>
          <p className="text-center text-muted-foreground mb-6 max-w-md">
            This is a paid API. You need to purchase access before you can generate API keys and use its endpoints.
          </p>
          {api.pricingModel === "PAID" && (
            <Button onClick={onPurchase}>
              Purchase for ${api.price?.toFixed(2)}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">API Access</h2>
          <p className="text-muted-foreground">Manage your API keys for accessing this API</p>
        </div>
        <Button onClick={onGenerateKey}>
          <Key className="h-4 w-4 mr-2" /> Generate New Key
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>
            Use these API keys to authenticate your requests. Keep your API keys secure!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-md font-mono text-sm">
              <h4 className="text-sm font-semibold mb-2">Authentication Example</h4>
              <div className="overflow-x-auto">
                <pre>
                  {`curl -X GET "${api.baseUrl}/path" \\
  -H "X-API-Key: YOUR_API_KEY"`}
                </pre>
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <p>Loading API keys...</p>
              </div>
            ) : apiKeys.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key Name</TableHead>
                    <TableHead>API Key</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((apiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell>{apiKey.name || "API Key"}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <code className="bg-muted px-2 py-1 rounded text-xs">
                            {apiKey.key.substring(0, 8)}...{apiKey.key.substring(apiKey.key.length - 4)}
                          </code>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                          >
                            {copied === apiKey.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Clipboard className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(apiKey.createdAt)}</TableCell>
                      <TableCell>{formatDate(apiKey.expiresAt)}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRevokeKey(apiKey.id)}
                        >
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <Key className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground mb-4">No API keys found</p>
                <Button onClick={onGenerateKey}>
                  Generate Your First API Key
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}