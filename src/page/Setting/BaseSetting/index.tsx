import CommonCard from "@/components/CommonCard"
import SelectCard from "@/components/SelectCard"
import SwitchCard from "@/components/SwitchCard"
import useConfigStore from "@/store/configStore"
import { i18n } from "@lingui/core"
import { t } from "@lingui/core/macro"

export default function BaseSetting() {
  // 性能优化：仅订阅需要的字段
  const basic = useConfigStore(s => s.config.basic);
  const { config, updateConfig } = useConfigStore()

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
    <CommonCard title={t`基础设置`} icon="🛠️">
      <div className="space-y-1">
        <SwitchCard
          title={t`开机自启动`}
          checked={basic.autoStart}
          onCheckedChange={(v) => updateBasic('autoStart', v)}
        />
        <SwitchCard
          title={t`静默启动`}
          checked={basic.silentStart}
          onCheckedChange={(v) => updateBasic('silentStart', v)}
        />
        <SelectCard
          title={t`语言设置 / Language`}
          value={config.basic.language}
          options={langOpt}
          onValueChange={(v) => updateLanguage(v)}
        />
      </div>
    </CommonCard>
  );
}
