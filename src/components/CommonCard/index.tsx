import * as React from "react"
import { cn } from "@/lib/utils"
interface GameCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  headerAction?: React.ReactNode;
}

const CommonCard = React.forwardRef<HTMLDivElement, GameCardProps>(
  ({ className, title, children, headerAction, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // 基础样式：大圆角、背景色、边框、阴影
          "rounded-[24px] border border-black/10 bg-zinc-50 backdrop-blur-md shadow-2xl",
          "flex flex-col overflow-hidden",
          className
        )}
        {...props}
      >
        {/* 如果有标题，显示标题栏 */}
        {title && (
          <div className="px-4 pt-4 flex justify-between items-center">
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            {headerAction}
          </div>
        )}

        {/* 内容区域 */}
        <div className="p-4 flex-1">
          {children}
        </div>
      </div>
    )
  }
)
CommonCard.displayName = "CommonCard"

export default CommonCard 
