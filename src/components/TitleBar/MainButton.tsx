import React from "react";
import { cn } from "@/lib/utils";

const MainButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "h-full w-auto p-2 cursor-pointer flex items-center justify-center",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
MainButton.displayName = "MainButton";

export default MainButton
