import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface SettingOption {
  label: string
  value: string
  color?: string // 用于存储颜色代码，如 #10b981
}

interface SelectCardProps {
  title: string
  description?: string
  options: SettingOption[]
  value: string
  onValueChange: (value: string) => void
  className?: string
}

export default function SelectCard({ title, description, options, value, onValueChange, className }: SelectCardProps) {

  return (
    <div className={cn("flex items-center justify-between gap-8 p-6 rounded-[24px] hover:bg-zinc-200 dark:hover:bg-zinc-700/50 transition-all", className)}>
      <div className="flex flex-col space-y-1">
        <Label className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 cursor-pointer">{title}</Label>
        {description && <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{description}</p>}
      </div>

      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="border-none bg-zinc-200 dark:bg-zinc-700 shadow-none hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all text-xl font-bold h-16 min-w-48 px-6 rounded-2xl dark:text-zinc-100">
          <div className="flex items-center gap-3">
            <SelectValue placeholder="未选择" />
          </div>
        </SelectTrigger>

        <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-900/20 dark:border-zinc-700 shadow-2xl rounded-2xl p-2">
          {options.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              className="text-lg py-3 rounded-xl focus:bg-emerald-500 focus:text-white dark:focus:bg-emerald-600 font-bold cursor-pointer dark:text-zinc-200"
            >
              <div className="flex items-center gap-3">
                {/* 列表项中的小圆圈 */}
                {opt.color && (
                  <div
                    className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10 shrink-0"
                    style={{ backgroundColor: opt.color }}
                  />
                )}
                {opt.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
