import * as React from "react";
import { cn } from "../../lib/utils";

const Badge = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
  const baseStyles = "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none";

  const variants = {
    default: "border-transparent btn-accent shadow",
    secondary: "border-transparent bg-code-bg text-text-h",
    destructive: "border-transparent bg-rose-600 text-white shadow",
    outline: "border-border text-text hover:bg-code-bg",
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
  };

  return (
    <div
      ref={ref}
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    />
  );
});

Badge.displayName = "Badge";

export { Badge };
