import CommonCard from "@/components/CommonCard";
import SelectCard, { SettingOption } from "@/components/SelectCard";
import { Cmds } from "@/lib/enum";
import useConfigStore from "@/store/configStore";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { t } from "@lingui/core/macro"

export default function InterfaceSetting() {
  const updateConfig = useConfigStore(s => s.updateConfig);
  const [fontFamilyVec, setFontFamilyVec] = useState<SettingOption[]>([{ label: t`系统默认`, value: "sys" }]);
  const { config } = useConfigStore()

  useEffect(() => {
    invoke<string[]>(Cmds.GET_SYSTEM_FONTS).then(fonts => {
      const opts = fonts.map(f => ({ label: f, value: f }));
      setFontFamilyVec([{ label: "sys", value: "sys" }, ...opts]);
    });
  }, []);

  const themeOpts = [{ label: t`随系统`, value: "Sys" },{ label: t`日间模式`, value: "Daytime" }, { label: t`夜间模式`, value: "Night" }];

return (
  <CommonCard title={t`个性化界面`} icon="🎨" className="dark:bg-zinc-800">
    <div className="space-y-1">
      <SelectCard
        title={t`外观主题`}
        options={themeOpts}
        value={useConfigStore(s => s.config.interface.themeMode)}
        onValueChange={(v) => updateConfig(d => { d.interface.themeMode = v as any })} />
      <SelectCard
        title={t`主题颜色`}
        options={themeOpts}
        value={useConfigStore(s => s.config.interface.themeColor)}
        onValueChange={(v) => updateConfig(d => { d.interface.themeColor = v as any })} />
      <SelectCard
        title={t`侧边栏显示`}
        options=
        {[{ label: t`自动触发`, value: "Trigger" },
        { label: t`固定展示(正常)`, value: "NormalFixed" },
        { label: t`固定展示(短)`, value: "ShortFixed" }]}
        value={useConfigStore(s => s.config.interface.sidebarMode)}
        onValueChange={(v) => updateConfig(d => { d.interface.sidebarMode = v as any })} />
      <SelectCard
        title={t`选择应用字体`}
        options={fontFamilyVec} // 确保这个 state 渲染了
        value={config?.interface?.fontFamily || "sys"} // 增加可选链保护
        onValueChange={(font) => updateConfig(d => { d.interface.fontFamily = font })}
      />
    </div>
  </CommonCard>
);
}
