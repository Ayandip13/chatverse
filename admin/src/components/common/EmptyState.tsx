import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-10 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 text-textMuted-light dark:text-textMuted-dark">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-textMain-light dark:text-textMain-dark mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-textSecondary-light dark:text-textSecondary-dark max-w-md mb-5">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};
