import { cn } from "@/lib/utils";

const PageHeader = ({
  title,
  description,
  actions,
  className
}) => {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 sm:ml-auto">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;