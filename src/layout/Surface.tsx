import { COMPONENT_MAP } from "@/lib/registry";
import { cn } from "@/lib/utils";
import { ThemeComponentProps, ThemeNode } from "@/types/node";
import React from "react";


/**
 * 递归解析并渲染语法树（调度员）
 */
export function Surface({ node }: ThemeComponentProps) {
  if (!node) return null;

  const Component = COMPONENT_MAP[node.nt] ?? COMPONENT_MAP['node'];

  const children = node.children?.map((child) => (
    <Surface key={child.id} node={child} />
  ));

  console.log(node.id);

  return (
    <Component node={node}>
      {children}
    </Component>
  );
};

/**
 * 基础容器组件（画 div 的地方）
 */
export default function SurfaceBase({ node, children }: { node: ThemeNode; children?: React.ReactNode }) {
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
