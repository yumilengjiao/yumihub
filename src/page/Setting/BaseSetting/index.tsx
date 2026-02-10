import CommonCard from "@/components/CommonCard";
import SelectCard from "@/components/SelectCard";
import SwitchCard from "@/components/SwitchCard";
import { useState } from "react";

export default function BaseSetting() {
  // 基本设置的信息
  const basic = useConfigStore(s => s.config.basic)
  const { config, updateConfig } = useConfigStore()
  // 控制连携程序全屏对话框状态
  const [isCompanionManagerOpen, setIsCompanionManagerOpen] = useState(false)
  // 控制快捷键全屏对话框状态
  const [isShortcutManagerOpen, setIsShortcutManagerOpen] = useState(false)

  const updateBasic = (key: keyof typeof basic, val: any) => {
    updateConfig((draft) => {
      (draft.basic as any)[key] = val
    })
  }

  const updateLanguage = (lang: string) => {
    updateBasic('language', lang)
    i18n.activate(lang)
  }

  const langOpt = [
    { label: "简体中文", value: "zh" },
    { label: "English", value: "en" },
    { label: "日本語", value: "ja" },
    { label: "한국인", value: "ko" }
  ]

  return (
    <CommonCard title="基础设置" className="col-span-3 row-span-2">
      <SwitchCard title="开机自启动" checked={isAutoBoot} onCheckedChange={() => setIsAutoBoot(!isAutoBoot)} />
      <SwitchCard title="静默启动" checked={isAutoBoot} onCheckedChange={() => setIsAutoBoot(!isAutoBoot)} />
      <SwitchCard title="自动检查更新" checked={isAutoBoot} onCheckedChange={() => setIsAutoBoot(!isAutoBoot)} />
      <SelectCard title="Language" value="1" options={opt} onValueChange={(v) => alert(v)} />
    </CommonCard>
  )
}
