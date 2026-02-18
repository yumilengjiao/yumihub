import React, { useState, useEffect, useMemo } from "react";
import useGameStore from "@/store/gameStore";
import { ThemeComponentProps } from "@/types/node";
import { t } from "@lingui/core/macro"
import { cn } from "@/lib/utils";
import useUserStore from "@/store/userStore";

export default function Title({ node }: ThemeComponentProps) {
  const { selectedGame } = useGameStore();
  const username = useUserStore(state => state.user?.userName)
  const [currentTime, setCurrentTime] = useState(new Date());

  // 从 props 中解构配置
  const {
    mode = "gameName", // 模式：gameName | time | custom | greeting
    content = "",      // custom 模式下的文字内容
    variant = "Hero",  // 视觉风格：Hero | Subtle | Neon | Glass
    size = "text-6xl", // Tailwind 尺寸类名
    color = "text-white",
    timeFormat = "HH:mm:ss", // 时间格式（简单实现）
  } = node.props || {};

  // --- 时间更新 (只有在 time 模式下才运行) ---
  useEffect(() => {
    if (mode !== "time") return;
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [mode]);

  // --- 数据源切换 ---
  const displayContent = useMemo(() => {
    switch (mode) {
      case "gameName":
        return selectedGame?.name || "";
      case "time":
        const hours = String(currentTime.getHours()).padStart(2, '0');
        const mins = String(currentTime.getMinutes()).padStart(2, '0');
        const secs = String(currentTime.getSeconds()).padStart(2, '0');
        return timeFormat === "HH:mm:ss" ? `${hours}:${mins}:${secs}` : `${hours}:${mins}`;
      case "greeting":
        const hour = new Date().getHours();
        if (hour < 12) return t`早上好`;
        if (hour < 18) return "下午好";
        return "晚上好";
      case "user":
        return username
      case "custom":
      default:
        return content;
    }
  }, [mode, selectedGame, currentTime, content, timeFormat]);

  // --- 视觉风格切换 ---
  const variantClasses = useMemo(() => {
    switch (variant) {
      case "Hero": // 描边大标题
        return "font-black tracking-tighter drop-shadow-2xl";
      case "Subtle": // 优雅的副标题
        return "font-medium opacity-60 text-2xl tracking-wide";
      case "Neon": // 霓虹灯外发光
        return "font-bold drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]";
      case "Glass": // 适合放在毛玻璃背景上的文字
        return "font-semibold backdrop-blur-sm bg-white/10 px-4 py-1 rounded-lg border border-white/20";
      default:
        return "";
    }
  }, [variant]);

  // 你原本要求的描边样式（通过 style 注入）
  const strokeStyle: React.CSSProperties = variant === "Hero" ? {
    WebkitTextStroke: '2px black',
    paintOrder: 'stroke fill',
  } : {};

  return (
    <div
      className={cn(
        "transition-all duration-500 select-none",
        size,
        color,
        variantClasses,
        node.className
      )}
      style={{
        ...strokeStyle,
        ...(node.style as React.CSSProperties)
      }}
    >
      {displayContent}
    </div>
  );
}
