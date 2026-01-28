import CommonCard from "@/components/CommonCard";
import SelectCard from "@/components/SelectCard";
import SwitchCard from "@/components/SwitchCard";
import { useState } from "react";

export default function BaseSetting() {
  let [isAutoBoot, setIsAutoBoot] = useState(false)
  let opt = [{ label: "中文", value: "1" }, { label: "English", value: "2" }]
  return (
    <CommonCard title="基础设置" className="col-span-3 row-span-2">
      <SwitchCard title="开机自启动" checked={isAutoBoot} onCheckedChange={() => setIsAutoBoot(!isAutoBoot)} />
      <SwitchCard title="静默启动" checked={isAutoBoot} onCheckedChange={() => setIsAutoBoot(!isAutoBoot)} />
      <SwitchCard title="自动检查更新" checked={isAutoBoot} onCheckedChange={() => setIsAutoBoot(!isAutoBoot)} />
      <SelectCard title="Language" value="1" options={opt} onValueChange={(v) => alert(v)} />
    </CommonCard>
  )
}
