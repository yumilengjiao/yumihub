import { useMemo, useState, CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { Surface } from "./Surface";
import { ThemeComponentProps } from "@/types/node";

const SideBar = ({ node }: ThemeComponentProps) => {
  // 1. 完全从 node.props 获取模式，不依赖外部 config
  const {
    mode = "NormalFixed", // 默认模式：NormalFixed, ShortFixed, Trigger
    side = "left",
    zIndex = 50,
  } = node.props || {};

  const [isHovered, setIsHovered] = useState(false);

  // 2. 状态判定逻辑
  const isExpanded = useMemo(() => {
    if (mode === "NormalFixed") return true;
    if (mode === "ShortFixed") return false;
    return isHovered; // Trigger 模式下由 Hover 决定
  }, [mode, isHovered]);

  // 3. 样式计算
  const finalStyle = useMemo(() => {
    const isOverlay = mode === "Trigger";
    const isHorizontal = side === "left" || side === "right";

    // 基础样式：接受后端算好的位置 (gridColumn 等)
    const styles: CSSProperties = {
      ...(node.style as CSSProperties),
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    };

    if (isOverlay) {
      // --- 【Trigger 模式：完全脱离文档流】 ---
      // 使用 display: contents 让父级 Grid 容器忽略此节点的占位
      // 这样排在后面的 Page 就会自动填补原本 SideBar 的位置
      styles.display = "contents";
    } else {
      // --- 【Fixed 模式：保留占位】 ---
      styles.display = "flex";
      styles.flexDirection = "column";
      styles.position = "relative";
      styles.overflow = "hidden";

      // 处理 ShortFixed 宽度（如果后端没传固定宽度）
      if (mode === "ShortFixed" && isHorizontal) {
        styles.width = "64px";
      }
    }

    return styles;
  }, [node.style, mode, side, isHovered]);

  // 4. 浮层特有样式（仅在 Trigger 模式下应用到内部容器）
  const overlayInnerStyle: CSSProperties = useMemo(() => {
    if (mode !== "Trigger") return { width: "100%", height: "100%" };

    const isHorizontal = side === "left" || side === "right";
    const translateDir = isHorizontal ? "X" : "Y";
    const offset = (side === "left" || side === "top") ? "-100%" : "100%";

    return {
      position: "fixed",
      [side]: 0,
      top: 0,
      zIndex: zIndex,
      width: isHorizontal ? "160px" : "100vw",
      height: isHorizontal ? "100vh" : "60px",
      backgroundColor: "rgba(0, 0, 0, 0.55)",
      backdropFilter: "blur(8px)",
      transform: isHovered ? "translate(0,0)" : `translate${translateDir}(${offset})`,
      transition: "transform 0.3s ease, opacity 0.3s ease",
      boxShadow: isHovered ? "10px 0 30px rgba(0,0,0,0.5)" : "none",
      display: "flex",
      flexDirection: "column",
    };
  }, [mode, side, isHovered, zIndex]);

  return (
    <>
      {/* 边缘感应条：只有在 Trigger 模式下存在 */}
      {mode === "Trigger" && (
        <div
          onMouseEnter={() => setIsHovered(true)}
          className={cn(
            "fixed z-[101] bg-transparent transition-opacity",
            isHovered ? "pointer-events-none opacity-0" : "opacity-100",
            side === "left" && "left-0 top-0 w-2 h-full cursor-e-resize",
            side === "right" && "right-0 top-0 w-2 h-full cursor-w-resize"
          )}
        />
      )}

      <aside
        id={node.id}
        onMouseEnter={() => mode === "Trigger" && setIsHovered(true)}
        onMouseLeave={() => mode === "Trigger" && setIsHovered(false)}
        className={cn(
          "border-white/10",
          mode !== "Trigger" && (side === "left" ? "border-r" : "border-l"),
          node.className
        )}
        style={finalStyle}
      >
        <div
          className="flex-1 overflow-hidden"
          style={overlayInnerStyle}
        >
          {node.children?.map((child) => (
            <Surface
              key={child.id}
              node={{
                ...child,
                props: {
                  ...child.props,
                  isSidebarExpanded: isExpanded,
                  sidebarMode: mode
                }
              }}
            />
          ))}
        </div>
      </aside>
    </>
  );
};

export default SideBar;
