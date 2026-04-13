import { cn } from "@/lib/utils"
import useConfigStore from "@/store/configStore"

interface SectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function SettingSection({ title, description, children, className }: SectionProps) {
  const bgOpacity = useConfigStore(config => config.config.interface.commonCardOpacity)
  return (
    <div style={{ opacity: bgOpacity }} className={cn("mb-8", className)}>
      <div className="mb-3 px-1">
        <h3 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">{description}</p>
        )}
      </div>
      <div className={cn(
        "bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded-2xl overflow-hidden",
        "border border-zinc-200/60 dark:border-zinc-700/60 shadow-sm",
        "divide-y divide-zinc-100 dark:divide-zinc-700/60"
      )}>
        {children}
      </div>
    </div>
  )
}
