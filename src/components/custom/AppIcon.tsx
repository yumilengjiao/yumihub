import React, { Suspense } from "react";
import { cn } from "@/lib/utils";
import { DynamicIcon } from 'lucide-react/dynamic'; // ✅ 官方新版动态组件
import { ThemeComponentProps } from "@/types/node";

export default function AppIcon({ node }: ThemeComponentProps) {
  // 建议把 strokeWidth 也从 props 里解构出来，增加定制上限
  const { name, size, color, strokeWidth } = node.props || {};

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center shrink-0",
        node.className
      )}
      style={node.style as React.CSSProperties}
    >
      {name ? (
        /* 官方的 DynamicIcon 内部使用了 React.lazy，
          所以外部必须包裹 Suspense，否则在图标加载瞬间会导致整棵组件树崩溃
        */
        <Suspense fallback={<div style={{ width: size || 24, height: size || 24 }} className="animate-pulse bg-white/5 rounded-full" />}>
          <DynamicIcon
            name={name as any} // 绕过类型检查，因为 name 来自你的 JSON
            size={size || 24}
            color={color || "currentColor"}
            strokeWidth={strokeWidth || 2}
          />
        </Suspense>
      ) : (
        // 占位符：防止没写 name 时页面布局塌陷
        <div
          className="border border-dashed border-zinc-500 opacity-20"
          style={{ width: size || 24, height: size || 24 }}
        />
      )}
    </div>
  )
}
