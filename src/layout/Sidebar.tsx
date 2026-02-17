import { useMemo, useState, CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { Surface } from "./Surface";
import { ThemeComponentProps } from "@/types/node";

const SideBar = ({ node }: ThemeComponentProps) => {
  // 1. 从 Props 提取配置，zIndex 给个 100 起步更稳
  const {
    mode = "NormalFixed",
    side = "left",
    zIndex = 100,
  } = node.props || {};

  const [isHovered, setIsHovered] = useState(false);

  // 2. 计算外层容器样式 (决定占位)
  const outerStyle = useMemo(() => {
    // 强制转换为包含字符串索引的类型，解决 styles[side] 报错
    const styles: CSSProperties & Record<string, any> = {
      ...(node.style as CSSProperties),
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    };

    if (mode === "Trigger") {
      styles.position = "fixed";
      styles.top = 0;
      styles[side as string] = 0; // 这里的 side 会动态映射为 left: 0 或 right: 0
      styles.zIndex = zIndex;
      styles.width = "0px";   // 容器本身不占位
      styles.height = "100%";
      styles.pointerEvents = "none"; // 允许鼠标点击穿透到底层
    } else {
      styles.position = "relative";
      // 窄边栏占位逻辑
      if (mode === "ShortFixed" && (side === "left" || side === "right")) {
        styles.width = styles.width || "72px";
      }
    }
    return styles;
  }, [node.style, mode, side, zIndex]);

  // 3. 计算内部内容区样式 (决定动画和视觉)
  const contentStyle = useMemo(() => {
    const isHorizontal = side === "left" || side === "right";

    const styles: CSSProperties & Record<string, any> = {
      width: "100%",
      height: "100%",
      transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease, box-shadow 0.3s ease",
      pointerEvents: "auto", // 恢复交互，不被外层的 none 影响
    };

    if (mode === "Trigger") {
      const translateDir = isHorizontal ? "X" : "Y";
      // 计算偏移：左/上是负，右/下是正
      const offset = (side === "left" || side === "top") ? "-100%" : "100%";

      Object.assign(styles, {
        position: "absolute",
        top: 0,
        [side as string]: 0,
        // 如果后端没传具体宽度，给个默认值
        width: isHorizontal ? (node.style?.width || "150px") : "100vw",
        height: isHorizontal ? "100vh" : (node.style?.height || "80px"),
        backgroundColor: "rgba(20, 20, 20, 0.75)",
        // 动画逻辑
        transform: isHovered ? "translate(0,0)" : `translate${translateDir}(${offset})`,
        opacity: isHovered ? 1 : 0,
        boxShadow: isHovered ? "0 0 40px rgba(0,0,0,0.5)" : "none",
        zIndex: zIndex + 1
      });
    }

    return styles;
  }, [mode, side, isHovered, zIndex, node.style]);

  return (
    <>
      {/* 边缘感应区：zIndex 比内容再高 1 层，确保能被鼠标触发 */}
      {mode === "Trigger" && (
        <div
          onMouseEnter={() => setIsHovered(true)}
          style={{ zIndex: zIndex + 10 }}
          className={cn(
            "fixed bg-transparent transition-opacity",
            // 响应区域稍微宽一点（12px），方便触发
            side === "left" && "left-0 top-0 w-3 h-full",
            side === "right" && "right-0 top-0 w-3 h-full",
            side === "top" && "top-0 left-0 w-full h-3",
            side === "bottom" && "bottom-0 left-0 w-full h-3"
          )}
        />
      )}

      <aside
        id={node.id}
        // 鼠标进入内容区也要保持开启
        onMouseEnter={() => mode === "Trigger" && setIsHovered(true)}
        onMouseLeave={() => mode === "Trigger" && setIsHovered(false)}
        className={cn(
          "overflow-visible",
          mode !== "Trigger" && (side === "left" ? "border-r" : "border-l"),
          "border-white/10",
          node.className
        )}
        style={outerStyle}
      >
        <div style={contentStyle} className="relative shadow-2xl">
          {/* 这里渲染内部的组件 (比如 Col) */}
          {node.children?.map((child) => (
            <Surface key={child.id} node={child} />
          ))}
        </div>
      </aside>
    </>
  );
};

export default SideBar;
