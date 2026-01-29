import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label";
import SuperSwitch from "@/components/SuperSwitch";

interface SettingSwitchItemProps {
  title: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}
export function SwitchCard({
  title,
  description,
  checked,
  onCheckedChange,
  className
}: SettingSwitchItemProps) {
  return (
    <div className={cn(
      "flex items-center justify-between space-x-6 rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:bg-white/10",
      className
    )}>
      <div className="flex items-center gap-5">

        <div className="flex flex-col space-y-2">
          <Label className="text-4xl font-bold tracking-tight text-zinc-900 cursor-pointer" htmlFor={title}>
            {title}
          </Label>
          {/* 4. 描述变大：从 text-xs 变为 text-base */}
          {description && (
            <p className="text-base text-zinc-400">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* 5. 开关变大：使用 scale 属性进行整体缩放是最快且不破坏 shadcn 布局的方法 */}
      <div className="flex items-center justify-center h-full">
        <SuperSwitch checked={checked} onChange={onCheckedChange} />
      </div>
    </div>
  );
}

export default SwitchCard
