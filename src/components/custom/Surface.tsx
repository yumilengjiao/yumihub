import { COMPONENT_MAP } from "@/lib/registry"
import type { ThemeComponentProps } from "@/types/node"

/** 递归解析并渲染主题节点树 */
export function Surface({ node }: ThemeComponentProps) {
  if (!node) return null
  const Component = COMPONENT_MAP[node.nt] ?? COMPONENT_MAP["node"]
  const children = node.children?.map(child => <Surface key={child.id} node={child} />)
  return <Component node={node}>{children}</Component>
}
