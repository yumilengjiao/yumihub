import CommonCard from "@/components/CommonCard";
import SelectCard, { SettingOption } from "@/components/SelectCard";
import { Cmds } from "@/lib/enum";
import useConfigStore from "@/store/configStore";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState, useMemo } from "react";

export default function InterfaceSetting() {
  const fontFamily = useConfigStore(s => s.config.interface.fontFamily || "sys");
  const updateConfig = useConfigStore(s => s.updateConfig);
  const [fontFamilyVec, setFontFamilyVec] = useState<SettingOption[]>([{ label: "系统默认", value: "sys" }]);
  const { config } = useConfigStore()

  useEffect(() => {
    invoke<string[]>(Cmds.GET_SYSTEM_FONTS).then(fonts => {
      const opts = fonts.map(f => ({ label: f, value: f }));
      setFontFamilyVec([{ label: "sys", value: "sys" }, ...opts]);
    });
  }, []);

  const themeOpts = [{ label: "日间模式", value: "Daytime" }, { label: "夜间模式", value: "Night" }];

  return (
    <CommonCard title="个性化界面" icon="🎨">
      <div className="space-y-1">
        <SelectCard
          title="外观主题"
          options={themeOpts}
          value={useConfigStore(s => s.config.interface.themeMode)}
          onValueChange={(v) => updateConfig(d => { d.interface.themeMode = v as any })} />
        <SelectCard
          title="主题颜色"
          options={themeOpts}
          value={useConfigStore(s => s.config.interface.themeColor)}
          onValueChange={(v) => updateConfig(d => { d.interface.themeColor = v as any })} />
        <SelectCard
          title="侧边栏显示"
          options={[{ label: "自动触发", value: "Trigger" },
          { label: "固定展示(正常)", value: "NormalFixed" },
          { label: "固定展示(短)", value: "ShortFixed" }]}
          value={useConfigStore(s => s.config.interface.sidebarMode)}
          onValueChange={(v) => updateConfig(d => { d.interface.sidebarMode = v as any })} />
        <SelectCard
          title="选择应用字体"
          options={fontFamilyVec} // 确保这个 state 渲染了
          value={config?.interface?.fontFamily || "sys"} // 增加可选链保护
          onValueChange={(font) => updateConfig(d => { d.interface.fontFamily = font })}
        />
      </div>
    </CommonCard>
  );
}
