import React, { useMemo } from "react";
import useGameStore from "@/store/gameStore";
import { ThemeComponentProps } from "@/types/node";
import { cn } from "@/lib/utils";

export default function Description({ node }: ThemeComponentProps) {
  const { selectedGame } = useGameStore();

  const {
    mode = "gameDesc",
    content = "",
    variant = "default",
    lineClamp = 0,
    fontSize = 16,
    lineHeight = 1.6,
    textAlign = "left",
    width = "100%"
  } = node.props || {};

  const displayContent = useMemo(() => {
    switch (mode) {
      case "gameDesc":
        return selectedGame?.description || "暂无游戏简介";
      case "developer":
        return selectedGame?.developer || "未知开发者";
      case "custom":
      default:
        return content;
    }
  }, [mode, selectedGame, content]);

  // --- 视觉风格修正 ---
  const variantClasses = useMemo(() => {
    switch (variant) {
      case "faded":
        // 修正：不再仅仅是 opacity，而是定义一个具体的渐变类名
        return "relative overflow-hidden";
      case "card":
        return "bg-black/20 backdrop-blur-md p-4 rounded-xl border border-white/10";
      default:
        return "font-normal";
    }
  }, [variant]);

  // --- 真正的淡出样式 (Inline Style) ---
  const fadedStyle: React.CSSProperties = variant === "faded" ? {
    // 使用 WebkitMaskImage 实现从 100% 不透明到 0% 透明的渐变
    WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
    maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
  } : {};

  const clampStyle: React.CSSProperties = lineClamp > 0 ? {
    display: '-webkit-box',
    WebkitLineClamp: lineClamp,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  } : {};

  return (
    <div
      className={cn(
        "transition-all duration-300 whitespace-pre-wrap break-words",
        variantClasses,
        node.className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width, // 修正：宽度控制
        fontSize: fontSize + "px",
        lineHeight,
        textAlign: textAlign as any,
        ...clampStyle,
        ...fadedStyle, // 注入渐变样式
        ...(node.style as React.CSSProperties)
      }}
    >
      {displayContent}
    </div>
  );
}
