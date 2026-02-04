import CommonCard from "@/components/CommonCard";
import SelectCard from "@/components/SelectCard";
import StepSliderCard from "@/components/StepSliderCard";
import useConfigStore from "@/store/configStore";
import { t } from "@lingui/core/macro"
import { useLingui } from "@lingui/react";

export default function SysSetting() {
  const system = useConfigStore(s => s.config.system);
  const updateConfig = useConfigStore(s => s.updateConfig);

  const closeOpts = [{ label: t`最小化至托盘`, value: "Minimize" }, { label: t`直接退出程序`, value: "Quit" }];
  const logOpts = [{ label: t`关闭日志`, value: "Off" }, { label: t`标准 (Info)`, value: "Info" }, { label: t`详细 (Debug)`, value: "Debug" }];
  const { i18n } = useLingui()

  return (
    <CommonCard key={i18n.locale} title={t`系统策略`} icon="⚙️">
      <div className="space-y-1">
        <SelectCard
          title={t`点击关闭按钮时`}
          options={closeOpts}
          value={system.closeButtonBehavior}
          onValueChange={(v) => updateConfig(d => { d.system.closeButtonBehavior = v })}
        />
        <SelectCard
          title={t`日志追踪等级`}
          options={logOpts}
          value={system.logLevel}
          onValueChange={(v) => updateConfig(d => { d.system.logLevel = v })}
        />
        <div className="px-4 py-2">
          <StepSliderCard
            title={t` 最大下载并发数`}
            min={1} max={32}
            value={system.downloadConcurrency}
            onChange={(n: any) => updateConfig(d => { d.system.downloadConcurrency = n })}
          />
        </div>
      </div>
    </CommonCard >
  );
}
