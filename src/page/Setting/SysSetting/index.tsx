import CommonCard from "@/components/CommonCard";
import SelectCard from "@/components/SelectCard";
import StepSliderCard from "@/components/StepSliderCard";
import useConfigStore from "@/store/configStore";
import { t } from "@lingui/core/macro"
import { useLingui } from "@lingui/react";

export default function SysSetting() {
  const system = useConfigStore(s => s.config.system);
  const updateConfig = useConfigStore(s => s.updateConfig);

  const closeOpts = [{ label: t`最小化至托盘`, value: "Hide" }, { label: t`直接退出程序`, value: "Exit" }];
  const logOpts = [
    { label: '详情 (Trace)', value: 'Trace' },
    { label: '调试 (Debug)', value: 'Debug' },
    { label: '标准 (Info)', value: 'Info' },
    { label: '警告 (Warn)', value: 'Warn' },
    { label: '错误 (Error)', value: 'Error' },
  ];
  const { i18n } = useLingui()

  return (
    <CommonCard key={i18n.locale} title={t`系统策略`} icon="⚙️" className="dark:bg-zinc-800">
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
