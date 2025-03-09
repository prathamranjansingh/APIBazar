// src/components/api-detail/api-documentation.jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"

export function ApiDocumentation({ documentation, isOwner, managementMode, onEdit }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <h2 className="text-2xl font-bold">Documentation</h2>
        {isOwner && managementMode && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" /> Edit Documentation
          </Button>
        )}
      </div>
      <Card>
        <CardContent className="pt-6">
          <div
            className="prose prose-blue max-w-none"
            dangerouslySetInnerHTML={{ __html: documentation || "<p>No documentation provided.</p>" }}
          />
        </CardContent>
      </Card>
    </div>
  )
}