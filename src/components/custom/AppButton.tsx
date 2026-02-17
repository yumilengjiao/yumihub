import React from "react";
import { cn } from "@/lib/utils";
import { ThemeComponentProps } from "@/types/node";
import { useAppActions } from "@/hooks/useAppActions"; // 记得确保这个文件存在

export default function AppButton({
  node,
  children
}: ThemeComponentProps) {
  // 初始化动作执行器
  const { runActions } = useAppActions();

  // 解构 props，设置 variant 默认为 scale
  const { variant = "scale" } = node.props || {};

  // 定义变体样式映射表
  const variantStyles: Record<string, string> = {
    // scale: 经典的缩放效果
    scale: "transition-transform hover:scale-105 active:scale-95",

    // border: 预留透明边框防止抖动，Hover时变色
    border: "border-2 border-transparent hover:border-purple-500 transition-colors box-border",

    // glow: 霓虹发光效果 (利用 drop-shadow 或 box-shadow)
    glow: "transition-shadow hover:shadow-[0_0_15px_rgba(168,85,247,0.6)]",
  };

  // 获取当前变体对应的类名
  const activeVariantClass = variantStyles[variant as string] || variantStyles.scale;


  return (
    <button
      type="button"
      id={node.id}
      style={node.style as React.CSSProperties}
      className={cn(
        // === 基础样式 (Base) ===
        "bg-transparent p-0 m-0 cursor-pointer outline-none flex items-center justify-center select-none",
        // 禁用状态样式
        "disabled:opacity-50 disabled:cursor-not-allowed",

        // === 变体样式 (Variant) ===
        activeVariantClass,

        // === 用户自定义样式 (Custom) ===
        // JSON 里的 className 优先级最高，可以覆盖上面的样式
        node.className
      )}
      onClick={(e) => {
        // 阻止事件冒泡，防止触发父级卡片的点击事件
        e.stopPropagation();

        // 将配置的 actions 数组丢给执行器
        if (node.actions) {
          runActions(node.actions);
        }
      }}
    >
      {/* 渲染由 Surface 调度员分发下来的子节点 (图标、文字等) */}
      {children}
    </button>
  );
};
