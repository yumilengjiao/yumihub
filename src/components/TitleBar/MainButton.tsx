import { cn } from "@/lib/utils";
import { Outlet } from "react-router";

interface MainButtonProps {
  children: React.ReactNode; // 声明接收 React 节点作为插槽
  onClick?: () => void;      // 顺便定义点击事件，方便对接 Tauri
  className?: string;
}

export default function MainButton({ children, onClick, className }: MainButtonProps) {
  return (
    <button onClick={onClick} className={cn(
      "h-full w-auto block p-2",
      className
    )}>
      {children}
    </button>
  )
}

