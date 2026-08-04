import { type ReactNode } from "react";
import { cn } from "../../utils/cn";

export type BadgeVariant =
  "success" | "warning" | "danger" | "info" | "default";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge = ({
  children,
  variant = "default",
  className,
}: BadgeProps) => {
  const variants = {
    success: "bg-success/10 text-success border border-success/20",
    warning: "bg-warning/10 text-warning border border-warning/20",
    danger: "bg-danger/10 text-danger border border-danger/20",
    info: "bg-info/10 text-info border border-info/20",
    default:
      "bg-surface-dark/10 text-textSecondary-light dark:text-textSecondary-dark border border-border-light dark:border-border-dark",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
};
