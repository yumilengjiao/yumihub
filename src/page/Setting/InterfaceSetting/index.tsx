import CommonCard from "@/components/CommonCard"
import SelectCard, { SettingOption } from "@/components/SelectCard"
import { Cmds } from "@/lib/enum"
import useConfigStore from "@/store/configStore"
import { invoke } from "@tauri-apps/api/core"
import { useEffect, useState } from "react"
import { t } from "@lingui/core/macro"

export default function InterfaceSetting() {
  const updateConfig = useConfigStore(s => s.updateConfig)
  const [fontFamilyVec, setFontFamilyVec] = useState<SettingOption[]>([{ label: t`系统默认`, value: "sys" }])
  const { config } = useConfigStore()
  // 主题模式
  const themeOpts = [{ label: t`随系统`, value: "System" }, { label: t`日间模式`, value: "Daytime" }, { label: t`夜间模式`, value: "Night" }]
  // 主题颜色
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

  // 获取所有字体
  useEffect(() => {
    invoke<string[]>(Cmds.GET_SYSTEM_FONTS).then(fonts => {
      const opts = fonts.map(f => ({ label: f, value: f }))
      setFontFamilyVec([{ label: "sys", value: "sys" }, ...opts])
    })
  }, [])


  // 辅助函数：切换 HTML 上的主题类名实现亮主体色切换
  const applyThemeColor = (themeClass: string) => {
    updateConfig(d => { d.interface.themeColor = themeClass })
    const html = document.documentElement
    // 移除所有已存在的自定义主题类
    colorOpts.forEach(opt => html.classList.remove(opt.value))
    // 添加选中的主题类
    html.classList.add(themeClass)
  }

  useEffect(() => {
    applyThemeColor(config.interface.themeColor)
  }, [config.interface.themeColor])


  return (
    <CommonCard title="界面" className="col-span-3 row-span-3">
      <SelectCard
        title="外观模式"
        options={opt}
        value="1"
        onValueChange={(n) => alert(n)} />
      <SelectCard
        title="主题色"
        options={opt} value="1"
        onValueChange={(n) => alert(n)} />
      <SelectCard
        title="窗口拖拽特效"
        options={opt}
        value="1"
        onValueChange={(n) => alert(n)} />
      <SelectCard
        title="侧边栏设置"
        options={opt}
        value="1"
        onValueChange={(n) => alert(n)} />
      <PathCard title="字体" path="/home/user/nihao" onSelect={() => console.log("nihc")} />

    </CommonCard>
  )
}

