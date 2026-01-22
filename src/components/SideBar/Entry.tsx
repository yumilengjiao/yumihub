import { cn } from "@/lib/utils"
import { ReactNode } from "react"
import { useLocation } from "react-router"

interface EntryProps {
  location?: string;
  children: ReactNode,
  secondTitle: string,
  onClick: () => void | null
}

export default function Entry({ location, children, secondTitle, onClick }: EntryProps) {
  const currentLocation = useLocation()
  return (
    <div className="py-1 w-full group mt-10 relative">
      {currentLocation.pathname === location &&
        <div className="absolute bg-primary h-full w-5 rounded-r-xl">
        </div>}
      <div
        onClick={onClick}
        className={cn(
          " flex items-center justify-between gap-3 px-4 py-3 rounded-2xl ",
          "px-20 min-h-20 cursor-pointer transition-all duration-200",
          "active:scale-[0.97] select-none text-muted-foreground hover:text-accent-foreground"
        )}
      >
        {/* 图标 */}
        <div className="shrink-0 transition-colors">
          {children}
        </div>

        {/* 文字：主轴对齐，禁止换行 */}
        <span className="text-5xl font-semibold tracking-wide whitespace-nowrap">
          {secondTitle}
        </span>
      </div>
    </div>
  )
}

