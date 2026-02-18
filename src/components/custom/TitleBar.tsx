import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ThemeComponentProps } from "@/types/node";

export default function TitleBar({ node, children }: ThemeComponentProps & { children?: React.ReactNode }) {
  const {
    thickness = "50px",
    zIndex = 50,
    variant = "Full",
    position = "absolute",
    // 位置控制
    align = "end",          // start (左) | center | end (右)
    valign = "top",         // top (上) | bottom (下)
    // 布局控制
    orientation = "horizontal", // horizontal (横条) | vertical (竖条)
    growthDirection = "row",    // row | row-reverse | col | col-reverse
    // 样式微调
    cornerRadius = "70px",
  } = node.props || {};

  console.log("Titlebar", node)

  const isFull = variant === "Full";
  const isVertical = orientation === "vertical";

  // 1. 核心样式计算
  const visualClasses = useMemo(() => {
    // 基础磨砂玻璃效果
    const base = "relative flex items-center transition-all duration-500 cursor-default bg-background/40 backdrop-blur-md border-white/5";

    // 如果不是 CornerArc，也不是 Capsule，就是标准直角矩形
    if (variant === "Full" || variant === "Default") {
      return cn(
        base,
        isVertical ? "w-full h-full border-r flex-col py-4" : "w-full h-full border-b px-6",
        node.className
      );
    }

    if (variant === "Capsule") {
      return cn(
        "bg-black/80 backdrop-blur-2xl rounded-full border border-white/10 shadow-2xl flex items-center justify-center",
        isVertical ? "w-[85%] py-6 my-2 mx-auto flex-col" : "h-[85%] px-6 mx-4 my-auto",
        node.className
      );
    }

    // --- CornerArc 专用逻辑 (四个象限判定) ---
    if (variant === "CornerArc") {
      const isTop = valign === "top";
      const isLeft = align === "start";

      // 1. 决定切哪个角 (反向切角：比如在左上位置，切的是右下角)
      let radiusClass = "";
      if (isTop && isLeft) radiusClass = `rounded-br-[${cornerRadius}]`; // 左上位置 -> 切右下
      if (isTop && !isLeft) radiusClass = `rounded-bl-[${cornerRadius}]`; // 右上位置 -> 切左下
      if (!isTop && isLeft) radiusClass = `rounded-tr-[${cornerRadius}]`; // 左下位置 -> 切右上
      if (!isTop && !isLeft) radiusClass = `rounded-tl-[${cornerRadius}]`; // 右下位置 -> 切左上

      // 2. 决定边框在哪边 (贴边的位置不需要边框，靠内的位置需要)
      let borderClass = "";
      if (isTop) borderClass += " border-b"; else borderClass += " border-t";
      if (isLeft) borderClass += " border-r"; else borderClass += " border-l";

      // 3. 决定内边距 (避让圆角)
      const paddingClass = isVertical
        ? (isTop ? "pb-12 pt-6" : "pt-12 pb-6") // 竖条时避让上下
        : (isLeft ? "pr-12 pl-6" : "pl-12 pr-6"); // 横条时避让左右

      return cn(base, radiusClass, borderClass, paddingClass, isVertical && "flex-col", node.className);
    }

    return cn(base, node.className);
  }, [variant, align, valign, isVertical, cornerRadius, node.className]);

  // 2. 容器定位逻辑
  const containerStyle = useMemo(() => {
    // 处理 Flex 对齐
    let justifyClass = "";
    if (align === "start") justifyClass = "justify-start";
    else if (align === "center") justifyClass = "justify-center";
    else justifyClass = "justify-end";

    return cn(
      "flex pointer-events-none", // 外层 pointer-events-none 防止遮挡，但在 visualClasses 里恢复
      position === "absolute" ? "absolute" : "relative",

      // 垂直定位
      valign === "top" ? "top-0" : "bottom-0",

      // 水平定位
      align === "start" ? "left-0" : align === "center" ? "left-0 right-0" : "right-0",

      // 宽高模式
      isVertical ? "h-full" : "w-full",

      // 对齐内容
      justifyClass,
      valign === "top" ? "items-start" : "items-end"
    );
  }, [position, valign, align, isVertical]);

  return (
    <div
      data-tauri-drag-region
      className={cn(containerStyle, "pointer-events-auto cursor-grab")}
      style={{
        zIndex,
        // 根据方向设定厚度
        [isVertical ? "width" : "height"]: thickness,
        ...(node.style as React.CSSProperties)
      }}
    >
      {/* 视觉层 + 交互层 */}
      <div
        className={cn(visualClasses, "cursor-default")}
        style={{
          width: isFull && !isVertical ? "100%" : "auto",
          height: isFull && isVertical ? "100%" : "auto"
        }}
      >
        {/* 内容排布层 */}
        <div
          className={cn(
            "flex items-center gap-5 cursor-pointer w-full h-full justify-center", // 居中内容
            // 核心：growthDirection 决定图标怎么排
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
  );
}
