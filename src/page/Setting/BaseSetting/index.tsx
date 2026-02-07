import CommonCard from "@/components/CommonCard"
import SelectCard from "@/components/SelectCard"
import SwitchCard from "@/components/SwitchCard"
import { cn } from "@/lib/utils"
import useConfigStore from "@/store/configStore"
import { i18n } from "@lingui/core"
import { t } from "@lingui/core/macro"
import { Keyboard, Plus, Settings2 } from "lucide-react"
import { useState } from "react"
import { CompanionManager } from "./CompanionManager"
import { ShortcutManager } from "./ShortcutManager"

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
      (draft.basic as any)[key] = val;
    });
  };

  const updateLanguage = (lang: string) => {
    updateBasic('language', lang)
    i18n.activate(lang)
  }

  const langOpt = [
    { label: "简体中文", value: "zh" },
    { label: "English", value: "en" },
    { label: "日本語", value: "ja" },
    { label: "한국인", value: "ko" }
  ];

  return (
    <CommonCard title={t`基础设置`} icon="🛠️" className="dark:bg-zinc-800">
      <div className="space-y-1">
        {/* 语言选择 */}
        <SelectCard
          title={t`语言设置 / Language`}
          value={config.basic.language}
          options={langOpt}
          onValueChange={(v) => updateLanguage(v)}
        />
        {/* 添加连携程序 */}
        <button
          onClick={() => setIsCompanionManagerOpen(true)}
          className={cn(
            "w-full h-16 mt-4 flex items-center justify-between px-6 rounded-xl transition-all",
            "bg-white border-2 hover:border-custom-500 text-zinc-950 dark:text-zinc-100 hover:bg-custom-50 ",
            "active:scale-[0.98] dark:bg-zinc-800"
          )}
        >
          <div className="flex items-center gap-3">
            <Settings2 className="w-6 h-6 text-custom-600" />
            <span className="text-2xl font-bold tracking-tight">{t`管理连携启动程序`}</span>
          </div>
          <Plus className="w-6 h-6 text-custom-600" />
        </button>
        {/* 快捷键设置 */}
        <button
          onClick={() => setIsShortcutManagerOpen(true)}
          className={cn(
            "w-full h-16 mt-3! mb-3! flex items-center justify-between px-6 rounded-xl transition-all",
            "bg-white border-2 hover:border-indigo-500 text-zinc-950 dark:text-zinc-100 hover:bg-indigo-50",
            "active:scale-[0.98] dark:bg-zinc-800"
          )}
        >
          <div className="flex items-center gap-3">
            <Keyboard className="w-6 h-6 text-indigo-600" />
            <span className="text-2xl font-bold tracking-tight">配置系统快捷键</span>
          </div>
          <div className="bg-indigo-100 text-indigo-600 text-xs px-2 py-1 rounded-md font-bold">HOTKEY</div>
        </button>
        {/* 开机自启动 */}
        <SwitchCard
          className="mb-3!"
          title={t`开机自启动`}
          checked={basic.autoStart}
          onCheckedChange={(v) => updateBasic('autoStart', v)}
        />
        {/* 静默启动 */}
        <SwitchCard
          title={t`静默启动`}
          checked={basic.silentStart}
          onCheckedChange={(v) => updateBasic('silentStart', v)}
        />
      </div>

      {/* 连携程序管理对话框 */}
      {isCompanionManagerOpen && (
        <CompanionManager onClose={() => setIsCompanionManagerOpen(false)} />
      )}
      {/* 快捷键管理对话框 */}
      {isShortcutManagerOpen && (
        <ShortcutManager onClose={() => setIsShortcutManagerOpen(false)} />
      )}
    </CommonCard>
  );
}
