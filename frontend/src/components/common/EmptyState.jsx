import React from 'react';

function EmptyState({ icon, title, description, action }) {
  return (
    <div className="text-center py-12 px-6 bg-muted/50 rounded-lg">
      <div className="mx-auto mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
      )}
      {action && action}
    </div>
  );
}

export default EmptyState;