import { t } from "@lingui/core/macro"
import { Trans } from "@lingui/react/macro"
import { RefreshCw, ExternalLink, CheckCircle2 } from "lucide-react"
import useConfigStore from "@/store/configStore"
import { SelectRow, SliderRow } from "@/components/common/SettingRow"
import { SettingSection } from "./SettingSection"
import { useUpdateChecker } from "@/hooks/useUpdateChecker"
import { openUrl } from "@tauri-apps/plugin-opener"

export default function SysSetting() {
  const { config, updateConfig } = useConfigStore()
  const { checking, updateInfo, lastChecked, checkUpdate } = useUpdateChecker()

  const closeOpts = [
    { label: t`最小化到托盘`, value: "Hide" },
    { label: t`直接退出`, value: "Exit" },
  ]
  const logOpts = [
    { label: "Trace", value: "Trace" },
    { label: "Debug", value: "Debug" },
    { label: "Info", value: "Info" },
    { label: "Warn", value: "Warn" },
    { label: "Error", value: "Error" },
  ]

  return (
    <>
      <SettingSection title={t`窗口行为`}>
        <SelectRow
          label={t`关闭按钮行为`}
          options={closeOpts}
          value={config.system.closeButtonBehavior}
          onValueChange={v => updateConfig(d => { d.system.closeButtonBehavior = v })}
        />
      </SettingSection>

      <SettingSection title={t`调试与性能`}>
        <SelectRow
          label={t`日志等级`}
          description={t`越低等级记录越多，Debug 以上仅在开发时使用`}
          options={logOpts}
          value={config.system.logLevel}
          onValueChange={v => updateConfig(d => { d.system.logLevel = v })}
        />
        <SliderRow
          label={t`最大下载并发数`}
          description={t`封面和背景图片的并行下载数量上限`}
          min={1} max={16}
          value={config.system.downloadConcurrency}
          onChange={v => updateConfig(d => { d.system.downloadConcurrency = v })}
        />
      </SettingSection>

      <SettingSection title={t`关于与更新`}>
        <div className="flex items-center justify-between gap-8 px-6 py-5">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              <Trans>当前版本</Trans>
            </span>
            <span className="text-xs text-zinc-400">
              v{updateInfo?.currentVersion ?? '...'}
              {lastChecked && (
                <span className="ml-2 text-zinc-300 dark:text-zinc-600">
                  · <Trans>上次检查</Trans> {lastChecked.toLocaleTimeString()}
                </span>
              )}
            </span>
          </div>

          {updateInfo?.hasUpdate ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                v{updateInfo.latestVersion} <Trans>可用</Trans>
              </span>
              <button
                onClick={() => openUrl(updateInfo.releaseUrl)}
                className="flex items-center gap-1.5 text-xs font-semibold text-custom-500 hover:text-custom-400 transition-colors"
              >
                <ExternalLink size={13} />
                <Trans>前往下载</Trans>
              </button>
            </div>
          ) : updateInfo && !updateInfo.hasUpdate ? (
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <Trans>已是最新版本</Trans>
            </div>
          ) : null}
        </div>

        <div className="px-6 p-5">
          <button
            onClick={checkUpdate}
            disabled={checking}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
            {checking ? <Trans>检查中...</Trans> : <Trans>检查更新</Trans>}
          </button>
        </div>
      </SettingSection>
    </>
  )
}
