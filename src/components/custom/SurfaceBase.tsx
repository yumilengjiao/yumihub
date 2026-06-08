import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import type { ThemeNode } from "@/types/node"

export default function SurfaceBase({
  node,
  children,
}: {
  node: ThemeNode
  children?: ReactNode
}) {
  return (
    <div
      id={String(node.id)}
      style={node.style}
      className={cn("min-h-0 w-full h-full", node.className)}
    >
      {children}
    </div>
  )
}
