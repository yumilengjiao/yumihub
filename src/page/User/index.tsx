import CalendarHeatMap from "./Calendar"
import DragScroller from "./DragScroller";
import GameJourney from "./GameJourney";
import MoreOptions from "@/components/MoreOption";
import ProfileHeader from "./ProfileHeader";
import ProgressBar from "./ProgressBar";
import Radar from "./Radar";
import { Avatar } from "@/components/SideBar/Avatar"
import ToolBox from "./Tool";
import UserCard from "@/components/UserCard"
import { CircleEllipsis, Clock, Trophy } from "lucide-react"
import "overlayscrollbars/overlayscrollbars.css";

const radarData = [
  {
    "tag": "fruity",
    "chardonay": 102,
  },
  {
    "tag": "bitter",
    "chardonay": 96,
  },
  {
    "tag": "heavy",
    "chardonay": 66,
  },
  {
    "tag": "strong",
    "chardonay": 67,
  },
  {
    "tag": "sunny",
    "chardonay": 29,
  }
]

export default function User() {
  return (
    <div className="h-full flex justify-center items-center bg-zinc-300">
      <div className="flex h-[90vh] w-[93vw] gap-4 mt-3">
        {/* 左侧长条卡片 (头像/成就/时间) */}
        <UserCard className="w-35 h-full flex flex-col">
          <div className="w-full h-full flex flex-col justify-between">
            <div className="w-full flex flex-col gap-6">
              <Avatar className="w-full h-auto" />
              <div>
                <Trophy className="w-full h-auto" />
                <div className="w-full text-[clamp(1rem,4cqw,3rem)] leading-none text-center">
                  12
                </div>
              </div>
              <div>
                <Clock className="w-full h-auto" />
                <div className="w-full text-[clamp(1rem,4cqw,2.5rem)] leading-none text-center">
                  1234h
                </div>
              </div>
            </div>
            <div className="cursor-pointer">
              <CircleEllipsis className="w-full h-auto" />
            </div>
          </div>
        </UserCard>

        {/* 右侧主内容区 */}
        <div className="flex-1 grid grid-cols-9 grid-rows-7 gap-4">

          {/* 顶部个人信息 (占 2 列) */}
          <UserCard title="Profile" className="col-span-6 row-span-2">
            <ProfileHeader username="yumilengjiao" />
          </UserCard>

          {/* 右上角黑色卡片 */}
          <UserCard title="信息和工具" className="bg-zinc-800 text-white col-span-3 row-span-1">
            <ToolBox companionPath="/" isCompanionEnabled={false} onCompanionToggle={() => { alert("nihao") }} />
          </UserCard>
          {/* 右二黑色卡片 */}
          <UserCard className="bg-zinc-800 col-span-3 row-span-3" >
            <Radar data={radarData} />
          </UserCard>

          {/* 中间大块 (可以放热力图) */}
          <UserCard title="Activity" headerAction={<MoreOptions entries={["选择年份"]} />} className="col-span-4 row-span-5">
            <DragScroller>
              <CalendarHeatMap />
            </DragScroller>
          </UserCard>

          {/* 其他小方块 */}
          <UserCard title="usage" className="bg-zinc-800 col-span-2 row-span-2" headerAction={<MoreOptions entries={["选择磁盘"]} />}>
            <div className="h-full w-full flex flex-col gap-5">
              <ProgressBar label="CPU" value={93} />
              <ProgressBar label="Memory" value={73} />
              <ProgressBar label="DISK" value={13} />
            </div>
          </UserCard>

          <UserCard className="col-span-5 row-span-3" >
            <GameJourney games={[]} />
          </UserCard>
        </div>
      </div >

    </div >
  )
}

