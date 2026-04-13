import { Outlet } from "react-router"
import { ThemeComponentProps } from "@/types/node"
import { cn } from "@/lib/utils"
import React from "react"

const MainContentSlot = ({ node }: ThemeComponentProps) => (
  <main
    className={cn(
      "h-full w-full overflow-auto relative transition-all duration-300 min-h-0",
      node.className
    )}
    style={{ minHeight: 0, ...(node.style as React.CSSProperties) }}
  >
    <Outlet />
  </main>
)

export default MainContentSlot
