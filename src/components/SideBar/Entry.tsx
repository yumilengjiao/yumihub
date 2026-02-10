import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface EntryProps {
  children: ReactNode
  title: string
  isExpanded: boolean
  isActive?: boolean
  onClick: () => void
}

export default function Entry({ children, title, isExpanded, isActive, onClick }: EntryProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex items-center h-16 cursor-pointer rounded-[24px] transition-all duration-300",
        "justify-start overflow-hidden",

        isActive
          ? "bg-custom-500 text-white shadow-lg shadow-custom-300/50 scale-[1.02]"
          : "text-white hover:bg-zinc-100 hover:text-custom-600"
      )}
    >

      <div className="flex items-center justify-center shrink-0 w-23 h-full transition-transform group-active:scale-90">
        {children}
      </div>

      <div className={cn(
        "font-black text-lg tracking-tight transition-all duration-300 whitespace-nowrap",
        isExpanded
          ? "opacity-100 translate-x-0"
          : "opacity-0 -translate-x-4 pointer-events-none"
      )}
        // 使用宽度过渡来撑开容器
        style={{
          width: isExpanded ? 'auto' : '0',
          marginLeft: isExpanded ? '4px' : '0'
        }}
      >
        {title}
      </div>
    </div>
  )
}
