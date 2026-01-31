import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface SettingOption {
  label: string;
  value: string;
}

interface SelectCardProps {
  title: string;
  description?: string;
  options: SettingOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export default function SelectCard({
  title,
  description,
  options,
  value,
  onValueChange,
  className
}: SelectCardProps) {
  return (
    <div className={cn(
      "flex items-center justify-between gap-12 p-6 transition-all",
      className
    )}>
      <div className="flex flex-col space-y-3">
        <Label className="text-4xl font-black tracking-tight text-zinc-900 cursor-pointer">
          {title}
        </Label>
        {description && (
          <p className="text-xl text-zinc-500 font-medium">
            {description}
          </p>
        )}
      </div>

      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          className={cn(
            "border-none bg-zinc-100/50 shadow-none hover:bg-zinc-200/50  transition-all",
            "text-4xl! font-bold text-center! bg-zinc-200",
            "h-24 min-w-50 min-h-15 px-10 rounded-[24px] justify-between"
          )}
        >
          {/* 这里控制显示的文字 */}
          <SelectValue placeholder="未选择" />
        </SelectTrigger>

        {/* 下拉列表同步放大 */}
        <SelectContent className="bg-white border-zinc-200 shadow-2xl rounded-[24px] min-w-[300px] p-2">
          {options.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              className="text-[24px] py-6 px-8 rounded-xl text-zinc-900 focus:bg-violet-600 focus:text-white cursor-pointer font-bold mb-1"
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
