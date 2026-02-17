import React from "react";
import { cn } from "@/lib/utils";
import { DynamicIcon } from 'lucide-react/dynamic';
import { useLocation } from "react-router"; // 仅保留路由判定，不负责跳转
import { ThemeComponentProps } from "@/types/node";
import { useAppActions } from "@/hooks/useAppActions";

export default function Entry({ node }: ThemeComponentProps) {
  const { pathname } = useLocation();
  const { runActions } = useAppActions();

  // 解构 Props
  const {
    title = "Item",
    icon = "house",
    path = "/", // path 此时仅用于判定 isActive 高亮
    showTitle = true,
    activeColor = "bg-custom-500",
    autoActive = true,
    active = false,
  } = node.props || {};

  // 状态判定 (保持你的嵌套路由判定逻辑)
  const getIsActive = () => {
    if (!autoActive) return active;
    if (pathname === path) return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    if (path === "/" && pathname === "/") return true;
    return false;
  };

  const isActive = getIsActive();

  return (
    <div
      className={cn(
        "w-full px-2 py-1",
        node.className
      )}
      style={node.style as React.CSSProperties}
    >
      <div
        id={node.id}
        onClick={(e) => {
          e.stopPropagation();
          if (node.actions) {
            runActions(node.actions);
          }
        }}
        className={cn(
          "group relative flex items-center h-16 cursor-pointer rounded-[24px] transition-all duration-300",
          "justify-start select-none w-full",

          isActive
            ? cn(activeColor, "text-white shadow-lg shadow-custom-300/50 scale-[1.02]")
            : "text-white hover:bg-zinc-100/10 hover:text-custom-400",

        )}
      >
        {/* 图标区域 */}
        <div className={cn(
          "flex items-center justify-center shrink-0 h-full transition-transform group-active:scale-95",
          showTitle ? "w-23" : "w-full"
        )}>
          <DynamicIcon
            name={icon as any}
            size={28}
            strokeWidth={2.5}
          />
        </div>

        {/* 标题区域 */}
        <div
          className={cn(
            "font-black text-lg tracking-tight transition-all duration-300 whitespace-nowrap",
            showTitle
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-4 pointer-events-none"
          )}
          style={{
            width: showTitle ? 'auto' : '0',
            marginLeft: showTitle ? '4px' : '0'
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}
