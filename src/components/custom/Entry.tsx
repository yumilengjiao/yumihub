import { useAppActions } from "@/hooks/useAppActions";
import { cn } from "@/lib/utils";
import { ThemeComponentProps } from "@/types/node";
import { DynamicIcon } from "lucide-react/dynamic";
import { useMemo } from "react";
import { useLocation } from "react-router";
// 1. 引入 Trans 组件，而不是 t 宏
import { Trans } from "@lingui/react/macro";

export default function Entry({ node }: ThemeComponentProps) {
  const { pathname } = useLocation();
  const { runActions } = useAppActions();

  const {
    title: rawTitle,
    icon = "house",
    path = "/",
    showTitle = true,
    activeColor = "bg-custom-500",
    autoActive = true,
    active = false,
  } = node.props || {};

  // 不需要 i18n 依赖，也不需要 useLingui
  const titleContent = useMemo(() => {
    if (rawTitle) return rawTitle;

    // 直接放入 <Trans> 组件。
    // 这些组件就像是“占位符”，它们自己会监听语言变化并渲染正确的文本。
    const pathMap: Record<string, React.ReactNode> = {
      "/": <Trans>首页</Trans>,
      "/library": <Trans>游戏</Trans>,
      "/user": <Trans>用户</Trans>,
      "/setting": <Trans>设置</Trans>,
    };

    return pathMap[path] || "Item";
  }, [rawTitle, path]); // 依赖里不需要 i18n 了

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
      className={cn("w-full px-2 py-1", node.className)}
      style={node.style as React.CSSProperties}
    >
      <div
        id={node.id}
        onClick={(e) => {
          e.stopPropagation();
          if (node.actions) runActions(node.actions);
        }}
        className={cn(
          "group relative flex items-center h-16 cursor-pointer rounded-[24px] transition-all duration-300",
          "justify-start select-none w-full",
          isActive
            ? cn(activeColor, "text-white shadow-lg shadow-custom-300/50 scale-[1.02]")
            : "text-white hover:bg-zinc-100/10 hover:text-custom-400",
        )}
      >
        <div className={cn(
          "flex items-center justify-center shrink-0 h-full transition-transform group-active:scale-95",
          showTitle ? "w-23" : "w-full"
        )}>
          <DynamicIcon name={icon as any} size={28} strokeWidth={2.5} />
        </div>

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
          {titleContent}
        </div>
      </div>
    </div>
  );
}
