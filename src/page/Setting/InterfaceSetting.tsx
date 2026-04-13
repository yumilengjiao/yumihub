import { useEffect, useState } from "react"
import { invoke } from "@tauri-apps/api/core"
import { open } from "@tauri-apps/plugin-dialog"
import { convertFileSrc } from "@tauri-apps/api/core"
import { Upload, Trash2 } from "lucide-react"
import { t } from "@lingui/core/macro"
import useConfigStore from "@/store/configStore"
import { Cmds } from "@/lib/enum"
import { SelectRow, SliderRow } from "@/components/common/SettingRow"
import type { SelectOption } from "@/components/common/SettingRow"
import { SettingSection } from "./SettingSection"
import { cn } from "@/lib/utils"

export default function InterfaceSetting() {
  const { config, updateConfig } = useConfigStore()
  const [fonts, setFonts] = useState<SelectOption[]>([{ label: t`系统默认`, value: "sys" }])
  const [themes, setThemes] = useState<SelectOption[]>([])

  useEffect(() => {
    invoke<string[]>(Cmds.GET_SYSTEM_FONTS).then(f =>
      setFonts([{ label: t`系统默认`, value: "sys" }, ...f.map(v => ({ label: v, value: v }))])
    )
    invoke<string[]>(Cmds.GET_ALL_THEME_NAMES).then(names =>
      setThemes(names.map(n => ({ label: n, value: n })))
    )
  }, [])

  const colorOptions: SelectOption[] = [
    { label: t`翡翠绿`, value: "theme-emerald", color: "#10b981" },
    { label: t`皇家蓝`, value: "theme-blue",    color: "#3b82f6" },
    { label: t`蔷薇粉`, value: "theme-rose",    color: "#f43f5e" },
    { label: t`极光紫`, value: "theme-violet",  color: "#8b5cf6" },
    { label: t`琥珀黄`, value: "theme-amber",   color: "#f59e0b" },
    { label: t`能量橙`, value: "theme-orange",  color: "#f97316" },
    { label: t`深海青`, value: "theme-cyan",    color: "#06b6d4" },
    { label: t`极客灰`, value: "theme-slate",   color: "#64748b" },
  ]

  const modeOptions: SelectOption[] = [
    { label: t`跟随系统`, value: "System" },
    { label: t`日间模式`, value: "Daytime" },
    { label: t`夜间模式`, value: "Night" },
  ]

  const applyColor = (cls: string) => {
    colorOptions.forEach(o => document.documentElement.classList.remove(o.value))
    document.documentElement.classList.add(cls)
    updateConfig(d => { d.interface.themeColor = cls })
  }

  const bg = config.interface.globalBackground

  const handlePickBg = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp"] }],
    })
    if (selected && typeof selected === "string") {
      updateConfig(d => { d.interface.globalBackground = { ...bg, path: selected } })
    }
  }

  return (
    <>
      <SettingSection title={t`主题`}>
        {themes.length > 0 && (
          <SelectRow
            label={t`主题文件`}
            options={themes}
            value={config.interface.theme}
            onValueChange={v => updateConfig(d => { d.interface.theme = v })}
          />
        )}
        <SelectRow
          label={t`明暗模式`}
          options={modeOptions}
          value={config.interface.themeMode}
          onValueChange={v => updateConfig(d => { d.interface.themeMode = v as any })}
        />
        <SelectRow
          label={t`主题颜色`}
          options={colorOptions}
          value={config.interface.themeColor}
          onValueChange={applyColor}
        />
        <SelectRow
          label={t`界面字体`}
          options={fonts}
          value={config.interface.fontFamily}
          onValueChange={v => updateConfig(d => { d.interface.fontFamily = v })}
        />
      </SettingSection>

      <SettingSection title={t`背景图片`}>
        {/* 背景预览与选择 */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-4">
            {/* 预览缩略图 */}
            <div className={cn(
              "w-20 h-12 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0 bg-zinc-100 dark:bg-zinc-800",
              bg.path && "ring-2 ring-custom-400"
            )}>
              {bg.path ? (
                <img
                  src={convertFileSrc(bg.path)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-600 text-xs">
                  {t`未设置`}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-zinc-400 truncate" title={bg.path}>
                {bg.path || t`未选择图片`}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handlePickBg}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-custom-500 hover:bg-custom-600 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <Upload size={12} /> {t`选择`}
              </button>
              {bg.path && (
                <button
                  onClick={() => updateConfig(d => { d.interface.globalBackground.path = "" })}
                  className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        <SliderRow
          label={t`背景不透明度`}
          min={0.1} max={1} step={0.01}
          value={bg.opacity}
          unit="%"
          onChange={v => updateConfig(d => { d.interface.globalBackground.opacity = v })}
        />
        <SliderRow
          label={t`背景模糊`}
          min={0} max={40} step={1}
          value={bg.blur}
          unit="px"
          onChange={v => updateConfig(d => { d.interface.globalBackground.blur = v })}
        />
      </SettingSection>

      <SettingSection title={t`其他`}>
        <SliderRow
          label={t`卡片不透明度`}
          min={0.3} max={1} step={0.01}
          value={config.interface.commonCardOpacity}
          onChange={v => updateConfig(d => { d.interface.commonCardOpacity = v })}
        />
      </SettingSection>
    </>
  )
}
