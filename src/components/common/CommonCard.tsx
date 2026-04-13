import * as React from "react"
import { cn } from "@/lib/utils"
import useConfigStore from "@/store/configStore"

interface CommonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  icon?: React.ReactNode
  headerAction?: React.ReactNode
}

const CommonCard = React.memo(
  React.forwardRef<HTMLDivElement, CommonCardProps>(
    ({ className, title, icon, children, headerAction, style, ...props }, ref) => {
      const opacity = useConfigStore(s => s.config.interface.commonCardOpacity)

      return (
        <div
          ref={ref}
          className={cn(
            "rounded-[32px] border border-zinc-200/60 dark:border-zinc-700/60",
            "bg-white dark:bg-zinc-800 shadow-xl",
            "flex flex-col overflow-hidden transition-all duration-300",
            className
          )}
          style={{ opacity, ...style }}
          {...props}
        >
          {title && (
            <div className="px-8 pt-8 pb-0 flex justify-between items-center">
              <div className="flex items-center gap-3">
                {icon && (
                  <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-700 text-base shadow-inner">
                    {icon}
                  </span>
                )}
                <h3 className="text-sm font-black text-foreground/50 tracking-[0.15em] uppercase">
                  {title}
                </h3>
              </div>
              {headerAction}
            </div>
          )}

          <div className="p-6 pt-4 flex-1 h-full">
            <div className="flex flex-col gap-2 h-full">{children}</div>
          </div>
        </div>
      )
    }
  )
)
CommonCard.displayName = "CommonCard"

export default CommonCard
