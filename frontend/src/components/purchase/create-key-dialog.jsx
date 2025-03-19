import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function CreateKeyDialog({ open, onOpenChange, apiName, onCreateKey }) {
  const [newKeyName, setNewKeyName] = useState("")
  const [keyNameError, setKeyNameError] = useState("")
  const [creatingKey, setCreatingKey] = useState(false)

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      setKeyNameError("Please provide a name for your API key")
      return
    }

    setKeyNameError("")
    setCreatingKey(true)

    try {
      const success = await onCreateKey(newKeyName)
      if (success) {
        setNewKeyName("")
      }
    } finally {
      setCreatingKey(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !creatingKey && newKeyName.trim()) {
      handleCreateApiKey()
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          // Reset form when dialog closes
          setNewKeyName("")
          setKeyNameError("")
        }
        onOpenChange(isOpen)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New API Key</DialogTitle>
          <DialogDescription>Generate a new API key to access {apiName}.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="keyName">Key Name</Label>
            <Input
              id="keyName"
              placeholder="My Project Key"
              value={newKeyName}
              onChange={(e) => {
                setNewKeyName(e.target.value)
                if (e.target.value.trim()) setKeyNameError("")
              }}
              onKeyDown={handleKeyDown}
              className="w-full"
              autoFocus
            />
            {keyNameError && <p className="text-sm text-destructive">{keyNameError}</p>}
          </div>
        </div>
        <DialogFooter className="flex justify-between items-center gap-2 flex-wrap sm:justify-end">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={creatingKey}>
            Cancel
          </Button>
          <Button onClick={handleCreateApiKey} disabled={creatingKey || !newKeyName.trim()} className="min-w-[120px]">
            {creatingKey ? "Generating..." : "Generate Key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

