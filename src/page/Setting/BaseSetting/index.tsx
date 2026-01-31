import CommonCard from "@/components/CommonCard";
import SelectCard from "@/components/SelectCard";
import SwitchCard from "@/components/SwitchCard";
import useConfigStore from "@/store/configStore";

export default function BaseSetting() {
  // 性能优化：仅订阅需要的字段
  const basic = useConfigStore(s => s.config.basic);
  const updateConfig = useConfigStore(s => s.updateConfig);

  const updateBasic = (key: keyof typeof basic, val: any) => {
    updateConfig((draft) => {
      (draft.basic as any)[key] = val;
    });
  };

  const langOpt = [{ label: "简体中文", value: "zh-cn" }, { label: "English", value: "en" }];

  return (
    <CommonCard title="基础设置" icon="🛠️">
      <div className="space-y-1">
        <SwitchCard
          title="开机自启动"
          checked={basic.autoStart}
          onCheckedChange={(v) => updateBasic('autoStart', v)}
        />
        <SwitchCard
          title="静默启动"
          checked={basic.silentStart}
          onCheckedChange={(v) => updateBasic('silentStart', v)}
        />
        <SelectCard
          title="语言设置 / Language"
          value={basic.language}
          options={langOpt}
          onValueChange={(v) => updateBasic('language', v)}
        />
      </div>
    </CommonCard>
  );
}
