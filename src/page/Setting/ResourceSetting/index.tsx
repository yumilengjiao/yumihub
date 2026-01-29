import CommonCard from "@/components/CommonCard";
import { PathCard } from "@/components/PathCard";

export default function ResourceSetting() {
  return (
    <CommonCard title="资源/备份" className="col-span-3 row-span-3">
      <PathCard title="游戏备份存档路径" onSelect={() => console.log("未选择")} />
      <PathCard title="游戏元数据下载路径" onSelect={() => console.log("未选择")} />
      <PathCard title="游戏元存档备份路径" onSelect={() => console.log("未选择")} />
    </CommonCard>
  )
}

