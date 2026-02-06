import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface SettingOption { label: string; value: string; }
interface SelectCardProps {
  title: string;
  description?: string;
  options: SettingOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export default function SelectCard({ title, description, options, value, onValueChange, className }: SelectCardProps) {
  return (
    <div className={cn("flex items-center justify-between gap-8 p-6 rounded-[24px] hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-all", className)}>
      <div className="flex flex-col space-y-1">
        <Label className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 cursor-pointer">{title}</Label>
        {description && <p className="text-sm text-zinc-500 dark:text-zinc-100 font-medium">{description}</p>}
      </div>

      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="border-none bg-zinc-100 shadow-none hover:bg-zinc-200 transition-all text-xl font-bold h-16 min-w-40 px-6 rounded-2xl">
          <SelectValue placeholder="未选择" />
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-zinc-600 border-zinc-900/20 dark:border-zinc-200/20 shadow-2xl rounded-2xl p-2">
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-lg py-3 rounded-xl focus:bg-emerald-500 focus:text-white font-bold cursor-pointer">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
