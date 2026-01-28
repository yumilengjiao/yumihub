import CommonCard from "@/components/CommonCard";
import { PathCard } from "@/components/PathCard";
import SelectCard from "@/components/SelectCard";

export default function InterfaceSetting() {
  let opt = [{ label: "夜间模式", value: "1" }, { label: "浅色模式", value: "2" }]
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
      <PathCard title="字体" path="/home/user/nihao" onSelect={() => console.log("nihc")} />

    </CommonCard>
  )
}

