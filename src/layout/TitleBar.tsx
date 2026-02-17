import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ThemeComponentProps } from "@/types/node";

export default function TitleBar({ node, children }: ThemeComponentProps & { children?: React.ReactNode }) {
  const {
    thickness = "50px",
    zIndex = 50,
    variant = "Full",
    position = "absolute",
    align = variant === "Capsule" ? "center" : "end",
    // growthDirection 控制 children 增长方向 (row, row-reverse, col, col-reverse)
    growthDirection = "row",
  } = node.props || {};

  const isFull = variant === "Full";
  const isCapsule = variant === "Capsule";

  const visualClasses = useMemo(() => {
    const isSide = variant === "RightArc" || align === "start" || align === "end";

    return cn(
      "relative flex items-center transition-all duration-500",
      // 关键：为了不让拖拽的小手穿透到按钮缝隙，这里设为 default
      "cursor-default",

      isFull && "w-full h-full bg-background border-b border-white/5 px-6",
      isCapsule && "bg-black/80 backdrop-blur-2xl rounded-full border border-white/10 shadow-2xl px-6 mx-4 mt-2 h-[85%]",
      !isCapsule && !isFull && isSide && "bg-background/40 backdrop-blur-md px-4",
      variant === "RightArc" && "rounded-bl-[70px] pl-10 pr-6 border-l border-b border-white/5 h-full",

      node.className
    );
  }, [variant, align, isFull, isCapsule, node.className]);

  return (
    <div
      data-tauri-drag-region
      className={cn(
        "w-full flex items-start",
        // 只有这里才是真正想触发“小手”的地方
        "cursor-grab",
        position === "absolute" ? "absolute top-0 left-0" : "relative",
        align === "center" && "justify-center",
        align === "end" && "justify-end",
        align === "start" && "justify-start"
      )}
      style={{
        height: thickness,
        zIndex,
        ...(node.style as React.CSSProperties)
      }}
    >
      <div
        className={visualClasses}
        style={{ width: isFull ? "100%" : "auto" }}
      >
        {/* 内容外壳：设为 pointer-events-none 允许拖拽穿透 */}
        <div className="relative flex items-center w-full h-full justify-end pointer-events-none">
          {/* 按钮容器：恢复点击，并根据 growthDirection 决定生长方向 */}
          <div
            className={cn(
              "flex items-center gap-5 pointer-events-auto cursor-pointer",
              // 动态生长方向映射
              growthDirection === "row" && "flex-row",
              growthDirection === "row-reverse" && "flex-row-reverse",
              growthDirection === "col" && "flex-col",
              growthDirection === "col-reverse" && "flex-col-reverse"
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
