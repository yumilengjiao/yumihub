import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { open } from "@tauri-apps/plugin-dialog"
import { FolderOpen, Eye, EyeOff } from "lucide-react"
import SuperSwitch from "@/components/common/SuperSwitch"
import { useState } from "react"
import { t } from "@lingui/core/macro"

// ── 基础行 ────────────────────────────────────────────────────────────────────
interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  description?: string
  children?: React.ReactNode
}

export function SettingRow({ label, description, children, className, ...props }: RowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-8 px-6 py-5",
        "hover:bg-zinc-50 dark:hover:bg-zinc-700/40 transition-colors group",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <Label className="text-base font-semibold text-zinc-800 dark:text-zinc-200 leading-none cursor-default">
          {label}
        </Label>
        {description && (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="flex items-center shrink-0">{children}</div>
    </div>
  )
}

// ── Switch ────────────────────────────────────────────────────────────────────
interface SwitchRowProps {
  label: string; description?: string
  checked: boolean; onCheckedChange: (v: boolean) => void; className?: string
}
export function SwitchRow({ label, description, checked, onCheckedChange, className }: SwitchRowProps) {
  return (
    <SettingRow label={label} description={description} className={className}>
      <SuperSwitch checked={checked} onChange={onCheckedChange} />
    </SettingRow>
  )
}

// ── Select ────────────────────────────────────────────────────────────────────
export interface SelectOption { label: string; value: string; color?: string }
interface SelectRowProps {
  label: string; description?: string; options: SelectOption[]
  value: string; onValueChange: (v: string) => void; className?: string
}
export function SelectRow({ label, description, options, value, onValueChange, className }: SelectRowProps) {
  return (
    <SettingRow label={label} description={description} className={className}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-10 min-w-44 border-none bg-zinc-100 dark:bg-zinc-700 rounded-xl text-sm font-semibold shadow-none focus:ring-0 focus:ring-offset-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl p-1">
          {options.map(opt => (
            <SelectItem
              key={opt.value} value={opt.value}
              className="rounded-lg text-sm font-medium py-2.5 focus:bg-custom-500 focus:text-white dark:text-zinc-200 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                {opt.color && (
                  <span className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10" style={{ backgroundColor: opt.color }} />
                )}
                {opt.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SettingRow>
  )
}

// ── Slider ────────────────────────────────────────────────────────────────────
interface SliderRowProps {
  label: string; description?: string; min: number; max: number; step?: number
  value: number; unit?: string; onChange: (v: number) => void; className?: string
}
export function SliderRow({ label, description, min, max, step = 1, value, unit = "", onChange, className }: SliderRowProps) {
  return (
    <SettingRow label={label} description={description} className={className}>
      <div className="flex items-center gap-4 w-64">
        <span className="text-base font-bold text-custom-500 w-14 text-right tabular-nums shrink-0">
          {value}{unit}
        </span>
        <Slider
          value={[value]} min={min} max={max} step={step}
          onValueChange={([v]) => onChange(v)}
          className="flex-1 [&_[role=slider]]:bg-custom-500 [&_[role=slider]]:border-2 [&_[role=slider]]:border-white [&_[role=slider]]:shadow-md [&_[role=slider]]:w-5 [&_[role=slider]]:h-5"
        />
      </div>
    </SettingRow>
  )
}

// ── Path ──────────────────────────────────────────────────────────────────────
interface PathRowProps {
  label: string; path?: string; readOnly?: boolean
  onSelect?: (path: string) => void; className?: string
}
export function PathRow({ label, path, readOnly = false, onSelect, className }: PathRowProps) {
  const isViewOnly = readOnly || !onSelect
  const handleClick = async () => {
    if (isViewOnly) return
    const selected = await open({ directory: true, multiple: false, defaultPath: path })
    if (selected && typeof selected === "string") onSelect?.(selected)
  }
  return (
    <SettingRow
      label={label}
      className={cn(!isViewOnly && "cursor-pointer", className)}
      onClick={handleClick}
    >
      <div className="flex items-center gap-3 max-w-80">
        <span className="text-sm font-mono text-zinc-400 truncate" title={path}>
          {path || t`未选择`}
        </span>
        {!isViewOnly && (
          <FolderOpen size={16} className="text-zinc-400 group-hover:text-custom-500 transition-colors shrink-0" />
        )}
      </div>
    </SettingRow>
  )
}

// ── Token ─────────────────────────────────────────────────────────────────────
interface TokenRowProps {
  label: string; value: string; placeholder?: string
  onChange: (v: string) => void; className?: string
}
export function TokenRow({ label, value, placeholder, onChange, className }: TokenRowProps) {
  const [visible, setVisible] = useState(false)
  return (
    <div className={cn("px-6 py-5", className)}>
      <Label className="text-xs font-black text-zinc-400 uppercase tracking-[0.18em] block mb-3">
        {label}
      </Label>
      <div className="relative">
        <Input
          type={visible ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-12 pr-12 bg-zinc-100 dark:bg-zinc-700 border-none rounded-xl text-sm font-mono focus-visible:ring-1 focus-visible:ring-custom-500"
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-custom-500 transition-colors"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  )
}
