import { useState } from "react"
import { createPortal } from "react-dom"
import { Settings2, Keyboard } from "lucide-react"
import { t } from "@lingui/core/macro"
import { useLingui } from "@lingui/react"
import useConfigStore from "@/store/configStore"
import { SelectRow, SwitchRow } from "@/components/common/SettingRow"
import { SettingSection } from "./SettingSection"
import { CompanionManager } from "./CompanionManager"
import { ShortcutManager } from "./ShortcutManager"
import { cn } from "@/lib/utils"

export default function BaseSetting() {
  const { config, updateConfig } = useConfigStore()
  const { i18n } = useLingui()
  const [companionOpen, setCompanionOpen] = useState(false)
  const [shortcutOpen, setShortcutOpen] = useState(false)

  const langOptions = [
    { label: "简体中文", value: "zh" },
    { label: "English", value: "en" },
    { label: "日本語", value: "ja" },
    { label: "한국인", value: "ko" },
  ]

  return (
    <>
      <SettingSection title={t`语言与启动`}>
        <SelectRow
          label={t`语言 / Language`}
          options={langOptions}
          value={config.basic.language}
          onValueChange={v => {
            updateConfig(d => { d.basic.language = v })
            i18n.activate(v)
          }}
        />
        <SwitchRow
          label={t`开机自启动`}
          checked={config.basic.autoStart}
          onCheckedChange={v => updateConfig(d => { d.basic.autoStart = v })}
        />
        <SwitchRow
          label={t`静默启动`}
          description={t`启动时不显示主窗口，在托盘中运行`}
          checked={config.basic.silentStart}
          onCheckedChange={v => updateConfig(d => { d.basic.silentStart = v })}
        />
      </SettingSection>

      <SettingSection title={t`功能扩展`}>
        <ActionRow
          icon={<Settings2 size={15} className="text-custom-500" />}
          label={t`连携启动程序`}
          description={t`配置随游戏或程序自动启动的辅助工具`}
          onClick={() => setCompanionOpen(true)}
        />
        <ActionRow
          icon={<Keyboard size={15} className="text-indigo-500" />}
          label={t`全局快捷键`}
          description={t`配置老板键、截图、启动等全局热键`}
          onClick={() => setShortcutOpen(true)}
        />
      </SettingSection>

      {companionOpen && createPortal(
        <CompanionManager onClose={() => setCompanionOpen(false)} />,
        document.body
      )}
      {shortcutOpen && createPortal(
        <ShortcutManager onClose={() => setShortcutOpen(false)} />,
        document.body
      )}
    </>
  )
}

function ActionRow({
  icon, label, description, onClick,
}: {
  icon: React.ReactNode
  label: string
  description?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 px-5 py-4 w-full text-left",
        "hover:bg-zinc-50 dark:hover:bg-zinc-700/40 transition-colors group"
      )}
    >
      <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-700 shrink-0">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 leading-none">{label}</p>
        {description && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{description}</p>
        )}
      </div>
      <span className="text-zinc-300 dark:text-zinc-600 group-hover:text-custom-400 transition-colors text-lg leading-none">›</span>
    </button>
  )
}
