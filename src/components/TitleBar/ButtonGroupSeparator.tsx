import { cn } from "@/lib/utils";

interface SeparatorProps {
  className?: string;
  height?: string; // 支持自定义高度，比如 "40%"
}

export function ButtonGroupSeparator({ className, height = "h-[30%]" }: SeparatorProps) {
  return (
    <div className="flex items-center justify-center h-full px-1">
      <div
        className={cn(
          "w-0.5 rounded-full",
          "bg-linear-to-b from-transparent via-white/30 to-transparent",
          "shadow-[0_0_8px_rgba(255,255,255,0.2)]",
          height,
          className
        )}
      />
    </div>
  );
}
