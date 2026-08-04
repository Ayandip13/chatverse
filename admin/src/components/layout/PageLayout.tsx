import type { ReactNode } from "react";

interface PageLayoutProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export const PageLayout = ({
  title,
  description,
  action,
  children,
}: PageLayoutProps) => {
  return (
    <div className="flex flex-col h-full space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 font-bold text-textMain-light dark:text-textMain-dark">
            {title}
          </h1>
          {description && (
            <p className="mt-xs text-textSecondary-light dark:text-textSecondary-dark">
              {description}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
};
