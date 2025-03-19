import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import EndpointsTab from "./endpoints-tab"
import ApiKeysTab from "./api-keys-tab"
import AnalyticsTab from "./analytics-tab"

export default function ApiDetailsDialog({
  open,
  onOpenChange,
  api,
  apiKeys,
  analytics,
  loadingAnalytics,
  onTabChange,
  onCreateKey,
  onRevokeKey,
  onFetchAnalytics,
}) {
  const [activeTab, setActiveTab] = useState("endpoints")

  const handleTabChange = (value) => {
    setActiveTab(value)
    onTabChange(value)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-2 sticky top-0 z-10 bg-background border-b">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-2xl font-bold tracking-tight">{api.name}</DialogTitle>
            <Badge variant={api.pricingModel === "FREE" ? "secondary" : "default"} className="shrink-0">
              {api.pricingModel === "FREE" ? "Free" : `$${api.price}`}
            </Badge>
          </div>
          <DialogDescription className="flex items-center gap-2 text-sm">
            Created by {api.owner.name}
            {api.owner.profile?.bio && (
              <span className="text-xs text-muted-foreground truncate">{api.owner.profile.bio}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="endpoints" value={activeTab} onValueChange={handleTabChange} className="px-6">
          <TabsList className="grid w-full grid-cols-3 mb-4 sticky top-[73px] z-10 bg-background">
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="keys">API Keys</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Endpoints Tab */}
          <TabsContent value="endpoints" className="space-y-4 pb-6">
            <EndpointsTab api={api} />
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="keys" className="space-y-4 pb-6">
            <ApiKeysTab apiKeys={apiKeys} apiId={api.id} onCreateKey={onCreateKey} onRevokeKey={onRevokeKey} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4 pb-6">
            <AnalyticsTab analytics={analytics} isLoading={loadingAnalytics} onRefresh={onFetchAnalytics} />
          </TabsContent>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t sticky bottom-0 bg-background">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

