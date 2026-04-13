import { t } from "@lingui/core/macro"
import useConfigStore from "@/store/configStore"
import { SelectRow, SliderRow } from "@/components/common/SettingRow"
import { SettingSection } from "./SettingSection"

export default function SysSetting() {
  const { config, updateConfig } = useConfigStore()

  const closeOpts = [
    { label: t`最小化到托盘`, value: "Hide" },
    { label: t`直接退出`, value: "Exit" },
  ]
  const logOpts = [
    { label: "Trace", value: "Trace" },
    { label: "Debug", value: "Debug" },
    { label: "Info",  value: "Info"  },
    { label: "Warn",  value: "Warn"  },
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
    </>
  )
}
