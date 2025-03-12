import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CopyCheck, Eye, EyeOff } from 'lucide-react';

function ApiKeyDisplay({ apiKey, onCopy, onRevoke, isRevokable = true }) {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const handleCopy = () => {
    onCopy(apiKey.key);
  };

  const handleRevoke = () => {
    if (window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      onRevoke(apiKey.id);
    }
  };

  const formatApiKey = (key) => {
    if (!key) return '';
    if (isVisible) return key;
    // Only show first 4 and last 4 characters
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  return (
    <div className="p-3 bg-muted rounded-md">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium text-sm">{apiKey.name}</h4>
        <div className="text-xs text-muted-foreground">
          {new Date(apiKey.createdAt).toLocaleDateString()}
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <code className="bg-background p-2 rounded text-xs font-mono flex-1 truncate">
          {formatApiKey(apiKey.key)}
        </code>
        <Button
          size="icon"
          variant="ghost"
          onClick={toggleVisibility}
          className="h-8 w-8"
        >
          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleCopy}
          className="h-8 w-8"
          disabled={!apiKey.isActive}
        >
          <CopyCheck className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex justify-between items-center">
        <div className="text-xs text-muted-foreground">
          {apiKey.rateLimit && `Rate limit: ${apiKey.rateLimit}/hour`}
          {apiKey.expiresAt && ` • Expires: ${new Date(apiKey.expiresAt).toLocaleDateString()}`}
        </div>
        {isRevokable && apiKey.isActive && (
          <Button variant="destructive" size="sm" onClick={handleRevoke}>
            Revoke
          </Button>
        )}
      </div>
    </div>
  );
}

export default ApiKeyDisplay;