import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface PathCardProps {
  title: string;
  path?: string;
  onSelect: () => void; // 这里对接 Tauri 的 dialog 逻辑
  className?: string;
}

export function PathCard({ title, path, onSelect, className }: PathCardProps) {
  return (
    <div className={cn("flex items-center justify-between gap-12 p-6 transition-all", className)}>
      <div className="flex flex-col space-y-2">
        <Label className="text-4xl font-black tracking-tight text-zinc-900">
          {title}
        </Label>
        {/* 路径通常很长，用截断显示 */}
        <p className="text-xl text-zinc-500 font-mono truncate max-w-100">
          {path || "尚未选择路径..."}
        </p>
      </div>

      <Button
        onClick={onSelect}
        className={cn(
          "h-20 min-w-65 border-none bg-zinc-200 hover:bg-violet-100/80 shadow-none rounded-[28px] px-10",
          "flex items-center justify-center gap-6 group transition-all"
        )}
      >
        <span className="text-[28px] font-bold text-violet-600 group-hover:text-violet-700">
          浏览
        </span>
        <FolderOpen className="w-8 h-8 text-violet-600 group-hover:text-violet-700 group-hover:scale-110 transition-transform" />
      </Button>
    </div>
  );
}
