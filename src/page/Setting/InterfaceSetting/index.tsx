import CommonCard from "@/components/CommonCard"
import SelectCard, { SettingOption } from "@/components/SelectCard"
import { Cmds } from "@/lib/enum"
import useConfigStore from "@/store/configStore"
import { invoke } from "@tauri-apps/api/core"
import { useEffect, useState } from "react"
import { t } from "@lingui/core/macro"
import BackgroundSettingDialog from "./BackgroundSettingDialog" // 导入我们将要写的组件
import { Image as ImageIcon } from "lucide-react"
import StepSliderCard from "@/components/StepSliderCard"

export default function InterfaceSetting() {
  const updateConfig = useConfigStore(s => s.updateConfig)
  const { config } = useConfigStore()
  const [fontFamilyVec, setFontFamilyVec] = useState<SettingOption[]>([{ label: t`系统默认`, value: "sys" }])
  const [themeOpts, setThemeOpts] = useState<SettingOption[]>([])
  const [isBgDialogOpen, setIsBgDialogOpen] = useState(false)

  const themeModeOpts = [
    { label: t`随系统`, value: "System" },
    { label: t`日间模式`, value: "Daytime" },
    { label: t`夜间模式`, value: "Night" }
  ]

  const colorOpts = [
    { label: t`翡翠绿 (Emerald)`, value: "theme-emerald", color: "#10b981" },
    { label: t`皇家蓝 (Royal Blue)`, value: "theme-blue", color: "#3b82f6" },
    { label: t`蔷薇粉 (Rose)`, value: "theme-rose", color: "#f43f5e" },
    { label: t`极光紫 (Violet)`, value: "theme-violet", color: "#8b5cf6" },
    { label: t`琥珀黄 (Amber)`, value: "theme-amber", color: "#f59e0b" },
    { label: t`能量橙 (Orange)`, value: "theme-orange", color: "#f97316" },
    { label: t`深海青 (Cyan)`, value: "theme-cyan", color: "#06b6d4" },
    { label: t`极客灰 (Slate)`, value: "theme-slate", color: "#64748b" },
  ]

  useEffect(() => {
    invoke<string[]>(Cmds.GET_SYSTEM_FONTS).then(fonts => {
      const opts = fonts.map(f => ({ label: f, value: f }))
      setFontFamilyVec([{ label: "sys", value: "sys" }, ...opts])
    })
    invoke<string[]>(Cmds.GET_ALL_THEME_NAMES).then(themes => {
      setThemeOpts(themes.map(t => ({ label: t, value: t })))
    })
  }, [])

  const applyThemeColor = (themeClass: string) => {
    updateConfig(d => { d.interface.themeColor = themeClass })
    const html = document.documentElement
    colorOpts.forEach(opt => html.classList.remove(opt.value))
    html.classList.add(themeClass)
  }

  useEffect(() => {
    applyThemeColor(config.interface.themeColor)
  }, [config.interface.themeColor])

  return (
    <CommonCard title={t`个性化界面`} icon="🎨" className="dark:bg-zinc-800">
      <div className="space-y-1">
        {/* 新增：背景设置入口 */}
        <div
          onClick={() => setIsBgDialogOpen(true)}
          className="flex items-center justify-between p-6 rounded-4xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <ImageIcon size={18} className="text-zinc-500" />
            <span className="text-sm font-medium">{t`全局背景图片`}</span>
          </div>
          <span className="text-xs text-zinc-400">{config.interface.globalBackground?.path ? t`已设置` : t`未设置`}</span>
        </div>

        <SelectCard
          title={t`主题选择`}
          options={themeOpts}
          value={config.interface.theme}
          onValueChange={(v) => updateConfig(d => { d.interface.theme = v as any })} />
        <SelectCard
          title={t`主题模式`}
          options={themeModeOpts}
          value={config.interface.themeMode}
          onValueChange={(v) => updateConfig(d => { d.interface.themeMode = v as any })} />
        <SelectCard
          title={t`主题颜色`}
          options={colorOpts}
          value={config.interface.themeColor}
          onValueChange={(v) => applyThemeColor(v)} />
        <SelectCard
          title={t`选择应用字体`}
          options={fontFamilyVec}
          value={config?.interface?.fontFamily || "sys"}
          onValueChange={(font) => updateConfig(d => { d.interface.fontFamily = font })}
        />
        <div className="px-4 py-2">
          <StepSliderCard
            title={t`卡片不透明度`}
            min={0.3} max={1}
            step={0.01}
            value={config.interface.commonCardOpacity}
            onChange={(n: any) => updateConfig(d => { d.interface.commonCardOpacity = n })}
          />
        </div>

      </div>

      {/* 背景设置对话框 */}
      <BackgroundSettingDialog
        isOpen={isBgDialogOpen}
        onClose={() => setIsBgDialogOpen(false)}
      />
    </CommonCard>
  )
}
