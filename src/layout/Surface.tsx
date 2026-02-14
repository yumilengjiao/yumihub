import { COMPONENT_MAP } from "@/lib/registry";
import { cn } from "@/lib/utils";
import { ThemeComponentProps, ThemeNode } from "@/types/node";


/**
 * 递归解析并渲染语法树（调度员）
 */
export default function Surface({ node }: ThemeComponentProps) {
  if (!node) return null;

  // 从 HashMap 中查表来确定组件
  const Component = COMPONENT_MAP[node.nt] ?? COMPONENT_MAP['Node'];

  // 递归调用 Surface 自身, 准备子元素
  const children = node.children?.map((child) => (
    <Surface key={child.id} node={child} />
  ));

  // 动态渲染查到的组件，并将整个 node 传下去
  return (
    <Component node={node}>
      {children}
    </Component>
  );
}

/**
 * 基础容器组件（画 div 的地方）
 */
export function SurfaceBase({ node, children }: { node: ThemeNode; children?: React.ReactNode }) {
  return (
    <div
      id={node.id}
      style={node.style}
      className={cn(
        node.className
      )}
    >
      {children}
    </div>
  );
}
