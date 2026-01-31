import CommonCard from "@/components/CommonCard";
import SelectCard, { SettingOption } from "@/components/SelectCard";
import { Cmds } from "@/lib/enum";
import useConfigStore from "@/store/configStore";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

export default function InterfaceSetting() {
  let opt = [{ label: "夜间模式", value: "1" }, { label: "浅色模式", value: "2" }]
  const { config, updateConfig } = useConfigStore()
  console.log(config)
  // 字体
  const [fontFamilyVec, setFontFamilyVec] = useState<SettingOption[]>([{ label: "sys", value: "sys" }])
  useEffect(() => {
    async function getFonts() {
      const fontVec = await invoke<string[]>(Cmds.GET_SYSTEM_FONTS)
      const opt = fontVec.map((font) => {
        return {
          label: font,
          value: font
        }
      })
      opt.push({ label: "sys", value: "sys" })
      setFontFamilyVec(opt)
    }
    getFonts()
  }, [])
  // 更新字体配置
  const updateFontFamily = (fontFamily: string) => {
    updateConfig((config) => {
      config.interface.fontFamily = fontFamily
    })
  }
  return (
    <CommonCard title="界面" className="col-span-3 row-span-3">
      <SelectCard
        title="外观模式"
        options={opt}
        value="1"
        onValueChange={(n) => alert(n)} />
      <SelectCard
        title="主题色"
        options={opt} value="1"
        onValueChange={(n) => alert(n)} />
      <SelectCard
        title="窗口拖拽特效"
        options={opt}
        value="1"
        onValueChange={(n) => alert(n)} />
      <SelectCard
        title="侧边栏设置"
        options={opt}
        value="1"
        onValueChange={(n) => alert(n)} />
      <SelectCard
        title="选择字体"
        options={fontFamilyVec}
        value={config.interface.fontFamily}
        onValueChange={(font) => updateFontFamily(font)} />


    </CommonCard>
  )
}

