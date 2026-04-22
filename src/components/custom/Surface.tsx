import { COMPONENT_MAP } from "@/lib/registry"
import { cn } from "@/lib/utils"
import { ThemeComponentProps, ThemeNode } from "@/types/node"
import React from "react"

/** 递归解析并渲染主题节点树 */
export function Surface({ node }: ThemeComponentProps) {
  if (!node) return null
  const Component = COMPONENT_MAP[node.nt] ?? COMPONENT_MAP["node"]
  const children = node.children?.map(child => <Surface key={child.id} node={child} />)
  return <Component node={node}>{children}</Component>
}

/** 基础容器组件 */
export default function SurfaceBase({
  node,
  children,
}: {
  node: ThemeNode
  children?: React.ReactNode
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
