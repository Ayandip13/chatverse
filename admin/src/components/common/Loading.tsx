import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

export const Loading = ({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={cn("flex items-center justify-center p-5", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizes[size])} />
    </div>
  );
};
