// 定义这个“插槽”组件
import { Outlet } from "react-router";
import { ThemeComponentProps } from "@/types/node"; // 确保引入你的类型定义
import { cn } from "@/lib/utils";

const MainContentSlot = ({ node }: ThemeComponentProps) => {
  return (
    <main
      className={cn(
        "h-full w-full nihao overflow-auto relative transition-all duration-300 min-h-0",
        node.className
      )}
      style={{
        // 别忘了合并用户定义的行内样式
        minHeight: 0,
        ...node.style,
        ...(node.style as React.CSSProperties),
      }}
    >
      <Outlet />
    </main>
  );
};

export default MainContentSlot;
