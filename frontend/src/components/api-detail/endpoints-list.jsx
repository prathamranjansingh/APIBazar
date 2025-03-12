import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Eye } from "lucide-react";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import EndpointDetails from "./endpoint-details";

const EndpointsList = ({ endpoints, isOwner, onEdit, onDelete }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [endpointToDelete, setEndpointToDelete] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);

  const methodColors = {
    GET: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    POST: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    PUT: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
    DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    PATCH: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  };

  const handleDelete = (endpoint) => {
    setEndpointToDelete(endpoint);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (endpointToDelete) {
      await onDelete(endpointToDelete.id);
      setShowDeleteDialog(false);
      setEndpointToDelete(null);
    }
  };

  const viewEndpoint = (endpoint) => {
    setSelectedEndpoint(endpoint);
    setShowDetailsDialog(true);
  };

  if (!endpoints || endpoints.length === 0) {
    return (
      <div className="text-center p-6 bg-muted/30 rounded-md">
        <p className="text-muted-foreground">No endpoints defined for this API yet.</p>
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Method</TableHead>
            <TableHead>Path</TableHead>
            <TableHead className="hidden md:table-cell">Description</TableHead>
            <TableHead className="hidden md:table-cell w-[120px]">Rate Limit</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {endpoints.map((endpoint) => (
            <TableRow key={endpoint.id}>
              <TableCell>
                <Badge
                  variant="outline"
                  className={methodColors[endpoint.method] || "bg-gray-100 text-gray-800"}
                >
                  {endpoint.method}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {endpoint.path}
              </TableCell>
              <TableCell className="hidden md:table-cell truncate max-w-[200px]">
                {endpoint.description || "-"}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {endpoint.rateLimit || "Default"}
              </TableCell>
              <TableCell className="text-right space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => viewEndpoint(endpoint)}
                  title="View details"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {isOwner && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(endpoint)}
                      title="Edit endpoint"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(endpoint)}
                      title="Delete endpoint"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Endpoint"
        description={`Are you sure you want to delete the endpoint '${endpointToDelete?.method} ${endpointToDelete?.path}'? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
      />
      {selectedEndpoint && (
        <EndpointDetails
          endpoint={selectedEndpoint}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
        />
      )}
    </div>
  );
};

export default EndpointsList;