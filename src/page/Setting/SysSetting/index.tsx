import CommonCard from "@/components/CommonCard";
import SelectCard from "@/components/SelectCard";
import StepSliderCard from "@/components/StepSliderCard";
import SwitchCard from "@/components/SwitchCard";
import { useState } from "react";

export default function SysSetting() {
  let [isAccelerate, setIsAccelerate] = useState(false)
  let [concurrency, setConcurrency] = useState(5)
  let opt = [{ label: "最小化", value: "1" }, { label: "退出程序", value: "2" }]
  let logOpt = [{ label: "关闭", value: "1" }, { label: "(标准)Info", value: "2" }, { label: "(详细)Debug", value: "3" }]
  return (
    <CommonCard title="系统设置" className="col-span-3 row-span-3">
      <SelectCard
        title="关闭按钮行为"
        options={opt}
        value="1"
        onValueChange={(n) => alert(n)} />
      <SwitchCard
        title="启用硬件(GPU)加速"
        checked={isAccelerate}
        onCheckedChange={(accelerate) => setIsAccelerate(accelerate)}
      />
      <SelectCard
        title="日志记录级别"
        options={logOpt}
        value="1"
        onValueChange={(n) => alert(n)} />
      <StepSliderCard
        title="下载资源时并发数量"
        min={1}
        value={concurrency}
        max={32}
        onChange={(num) => setConcurrency(num)}
      />

    </CommonCard>
  )
}

