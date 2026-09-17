import * as React from "react";
import { cn } from "../../lib/utils";

const Button = React.forwardRef(
  (
    {
      className,
      variant = "default",
      size = "default",
      type = "button",
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-lg text-xs font-bold transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50 select-none";

    const variants = {
      default: "btn-accent focus:ring-2 focus:ring-offset-0",
      outline:
        "border border-border bg-bg-card hover:bg-code-bg text-text-h focus:ring-2 focus:ring-accent/20 focus:ring-offset-0",
      secondary:
        "bg-code-bg hover:bg-border/50 text-text-h focus:ring-2 focus:ring-accent/20 focus:ring-offset-0",
      destructive:
        "bg-rose-600 hover:bg-rose-700 text-white focus:ring-2 focus:ring-rose-500/20 focus:ring-offset-0",
      ghost: "hover:bg-code-bg hover:text-text-h text-text",
      link: "text-accent hover:underline underline-offset-4 font-semibold",
    };

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3 rounded-lg text-[11px]",
      lg: "h-12 px-6 rounded-2xl text-sm",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        type={type}
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button };
