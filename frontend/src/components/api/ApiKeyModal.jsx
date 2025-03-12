import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner"
import { AlertCircle, Copy, Key } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ApiKeyModal = ({ isOpen, onClose, api, onKeyCreated }) => {
  const [keyName, setKeyName] = useState(`${api?.name || "API"} Key`);
  const [rateLimit, setRateLimit] = useState(api?.rateLimit || 100);
  const [expiryOption, setExpiryOption] = useState("never");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState(null);

  const generateExpiryDate = () => {
    if (expiryOption === "never") return null;
    const now = new Date();
    if (expiryOption === "1day") {
      now.setDate(now.getDate() + 1);
    } else if (expiryOption === "7days") {
      now.setDate(now.getDate() + 7);
    } else if (expiryOption === "30days") {
      now.setDate(now.getDate() + 30);
    } else if (expiryOption === "90days") {
      now.setDate(now.getDate() + 90);
    }
    return now.toISOString();
  };

  const handleCreateKey = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: keyName,
          apiId: api.id,
          rateLimit: parseInt(rateLimit),
          expiresAt: generateExpiryDate()
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create API key");
      }
      const data = await response.json();
      setGeneratedKey(data);
      if (onKeyCreated) {
        onKeyCreated(data);
      }
    } catch (error) {
      console.error("Error creating API key:", error);
      toast({
        title: "Failed to create API key",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (generatedKey?.key) {
      navigator.clipboard.writeText(generatedKey.key);
      toast({
        title: "API Key copied",
        description: "The API key has been copied to clipboard",
      });
    }
  };

  const handleClose = () => {
    setGeneratedKey(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {generatedKey ? "API Key Generated" : "Create New API Key"}
          </DialogTitle>
          <DialogDescription>
            {generatedKey
              ? "Your API key has been generated. Please copy it now as you won't be able to see it again."
              : `Create a new API key for ${api?.name || "the API"}`
            }
          </DialogDescription>
        </DialogHeader>
        {generatedKey ? (
          <div className="space-y-4">
            <div className="bg-muted p-3 rounded-md flex items-center gap-2">
              <Key className="text-muted-foreground h-4 w-4 flex-shrink-0" />
              <code className="text-xs md:text-sm flex-1 overflow-hidden text-ellipsis">
                {generatedKey.key}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyKey}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 rounded-md p-3">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              <p className="text-xs">
                This API key will only be displayed once and cannot be retrieved later.                 Please store it securely.
              </p>
            </div>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span>{generatedKey.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate Limit:</span>
                <span>{generatedKey.rateLimit} requests/hour</span>
              </div>
              {generatedKey.expiresAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires:</span>
                  <span>{new Date(generatedKey.expiresAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="key-name">Key Name</Label>
              <Input
                id="key-name"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Enter a name for your API key"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate-limit">Rate Limit (requests per hour)</Label>
              <Input
                id="rate-limit"
                type="number"
                value={rateLimit}
                onChange={(e) => setRateLimit(e.target.value)}
                min="1"
                max="10000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiration</Label>
              <Select value={expiryOption} onValueChange={setExpiryOption}>
                <SelectTrigger id="expiry">
                  <SelectValue placeholder="Select expiration time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">No expiration</SelectItem>
                  <SelectItem value="1day">1 day</SelectItem>
                  <SelectItem value="7days">7 days</SelectItem>
                  <SelectItem value="30days">30 days</SelectItem>
                  <SelectItem value="90days">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
          {generatedKey ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={handleCopyKey}>
                <Copy className="h-4 w-4 mr-2" />
                Copy API Key
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleCreateKey} disabled={isLoading}>
                {isLoading ? "Creating..." : "Generate API Key"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyModal;