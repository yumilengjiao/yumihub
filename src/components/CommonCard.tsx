import * as React from "react"
import { cn } from "@/lib/utils"

interface CommonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
}

const CommonCard = React.forwardRef<HTMLDivElement, CommonCardProps>(
  ({ className, title, icon, children, headerAction, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[32px] border border-zinc-200/60 bg-white shadow-xl shadow-zinc-200/40",
          "flex flex-col overflow-hidden transition-all duration-300",
          className
        )}
        {...props}
      >
        {title && (
          <div className="px-8 pt-8 flex justify-between items-center">
            <div className="flex items-center gap-3">
              {icon && (
                <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-zinc-100 text-lg shadow-inner">
                  {icon}
                </span>
              )}
              <h3 className="text-2xl font-black text-zinc-800 tracking-tight uppercase italic">
                {title}
              </h3>
            </div>
            {headerAction}
          </div>
        )}

        <div className="p-6 pt-0 flex-1">
          <div className="flex flex-col gap-2 h-full">
            {children}
          </div>
        </div>
      </div>
    )
  }
)
CommonCard.displayName = "CommonCard"

export default CommonCard
