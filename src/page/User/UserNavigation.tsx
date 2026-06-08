import type { ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function SectionTitle({ label, right }: { label: string; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-1 h-5 rounded-full bg-custom-500" />
        <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
          {label}
        </span>
      </div>
      {right}
    </div>
  )
}

export function YearNav({ year, onPrev, onNext }: { year: string; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={onPrev} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors">
        <ChevronLeft size={16} className="text-zinc-400" />
      </button>
      <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400 w-12 text-center">{year}</span>
      <button
        onClick={onNext}
        disabled={Number(year) >= new Date().getFullYear()}
        className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-30"
      >
        <ChevronRight size={16} className="text-zinc-400" />
      </button>
    </div>
  )
}

export function MonthNav({ year, month, onPrev, onNext }: { year: number; month: number; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={onPrev} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors">
        <ChevronLeft size={16} className="text-zinc-400" />
      </button>
      <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400 w-20 text-center">
        {year}-{String(month).padStart(2, "0")}
      </span>
      <button onClick={onNext} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors">
        <ChevronRight size={16} className="text-zinc-400" />
      </button>
    </div>
  )
}
