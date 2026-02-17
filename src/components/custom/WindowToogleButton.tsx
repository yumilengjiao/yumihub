import React, { useEffect, useState, Suspense } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { cn } from "@/lib/utils";
import { DynamicIcon } from 'lucide-react/dynamic';
import { ThemeComponentProps } from "@/types/node";

export default function WindowToggleIcon({ node }: ThemeComponentProps) {
  const [isMax, setIsMax] = useState(false);
  const appWindow = getCurrentWindow();

  // 1. 从 props 拿两个状态的 icon name
  const {
    normalIcon,     // 比如 "expand"
    maximizedIcon,  // 比如 "minimize-2"
    size = 24,
    color,
    strokeWidth
  } = node.props || {};

  useEffect(() => {
    // 初始化
    appWindow.isMaximized().then(setIsMax);

    // 监听 Tauri 窗口调整
    const unlisten = appWindow.onResized(async () => {
      const maximized = await appWindow.isMaximized();
      setIsMax(maximized);
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, [appWindow]);

  // 2. 决定当前图标名
  const currentName = isMax ? maximizedIcon : normalIcon;

  // 3. 渲染逻辑：完全复刻你 AppIcon 的结构，保证样式统一
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center shrink-0 pointer-events-none", // 增加 none 防止干扰按钮点击
        node.className
      )}
      style={node.style as React.CSSProperties}
    >
      {currentName ? (
        <Suspense
          fallback={
            <div
              style={{ width: size, height: size }}
              className="animate-pulse bg-white/5 rounded-full"
            />
          }
        >
          <DynamicIcon
            name={currentName as any}
            size={size}
            color={color || "currentColor"}
            strokeWidth={strokeWidth || 2}
          />
        </Suspense>
      ) : (
        <div
          className="border border-dashed border-zinc-500 opacity-20"
          style={{ width: size, height: size }}
        />
      )}
    </div>
  );
}
