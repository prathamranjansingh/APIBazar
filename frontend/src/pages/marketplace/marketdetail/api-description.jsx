"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Copy } from "lucide-react"
import { toast } from "sonner"

const ApiDescription = ({ api }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg sm:text-xl">Description</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-line text-sm sm:text-base">{api.description}</p>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-4 sm:mt-6">
          <div className="w-full sm:w-auto">
            <h4 className="font-medium text-xs sm:text-sm text-muted-foreground mb-1">Base URL</h4>
            <div className="flex items-center">
              <code className="bg-muted px-2 py-1 rounded text-xs sm:text-sm overflow-x-auto max-w-[200px] sm:max-w-none">
                <span className="truncate block">{api.baseUrl}</span>
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 ml-1 flex-shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(api.baseUrl)
                  toast.success("Base URL copied to clipboard")
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-xs sm:text-sm text-muted-foreground mb-1">Rate Limit</h4>
            <p className="text-sm sm:text-base">
              {api.rateLimit ? `${api.rateLimit} requests per minute` : "Unlimited"}
            </p>
          </div>
          <div>
            <h4 className="font-medium text-xs sm:text-sm text-muted-foreground mb-1">Created By</h4>
            <div className="flex items-center">
              <Avatar className="h-5 w-5 sm:h-6 sm:w-6 mr-2">
                <AvatarImage src={api.owner.picture || "/placeholder.svg"} alt={api.owner.name} />
                <AvatarFallback>{api.owner.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm sm:text-base">{api.owner.name}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ApiDescription
