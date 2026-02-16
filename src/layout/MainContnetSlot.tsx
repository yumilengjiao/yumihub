// 定义这个“插槽”组件
import { Outlet } from "react-router";
import { ThemeComponentProps } from "@/types/node"; // 确保引入你的类型定义
import { cn } from "@/lib/utils";

const MainContentSlot = ({ node }: ThemeComponentProps) => {
  // 从 node.props 中提取栅格值
  const { start, span } = node.props || {};

  return (
    <main
      className={cn(
        "h-full w-full overflow-auto relative transition-all duration-300",
        node.className
      )}
      style={{
        // 核心：将 JSON 里的布局属性映射到 CSS Grid
        gridColumn: `${start || 'auto'} / span ${span || 1}`,
        // 别忘了合并用户定义的行内样式
        ...node.style,
        ...(node.style as React.CSSProperties),
      }}
    >
      <Outlet />
    </main>
  );
};

export default MainContentSlot;
