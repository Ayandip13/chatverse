import { cn } from "../../utils/cn";

export const Skeleton = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "animate-pulse bg-border-light dark:bg-border-dark rounded-md",
        className,
      )}
    />
  );
};
