"use client";

import * as React from "react";
import { cn } from "@/app/lib/utils";

export interface SwitchProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
        <input
          type="checkbox"
          className={cn(
            "peer sr-only",
            className
          )}
          ref={ref}
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          {...props}
        />
        <div className={cn(
          "h-6 w-11 rounded-full transition-colors",
          checked ? "bg-blue-600" : "bg-gray-200"
        )}>
          <div className={cn(
            "absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          )} />
        </div>
      </div>
    );
  }
);

Switch.displayName = "Switch";

export { Switch }; 