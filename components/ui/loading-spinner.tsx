import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "white" | "current";
}

export function LoadingSpinner({
  className,
  size = "md",
  color = "primary",
  ...props
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-[3px]",
    lg: "h-12 w-12 border-4"
  };

  const colorClasses = {
    primary: "border-primary-500 border-r-transparent",
    white: "border-white border-r-transparent",
    current: "border-current border-r-transparent"
  };

  return (
    <div
      className={cn(
        "inline-block animate-spin rounded-full",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}