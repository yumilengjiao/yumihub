import CalendarHeatMap from "./Calendar"
import GameJourney from "./GameJourney";
import MoreOptions from "@/components/MoreOption";
import ProfileHeader from "./ProfileHeader";
import Radar from "./Radar";
import { Avatar } from "@/components/SideBar/Avatar"
import ToolBox from "./Tool";
import CommonCard from "@/components/CommonCard"
import { CircleEllipsis, Clock, Trophy } from "lucide-react"
import { useEffect, useMemo, useState } from "react";
import { DragScroller } from "./DragScroller";
import EditUserInfoDialog from "./EditUserInfoDialog";
import { cn } from "@/lib/utils";
import SysMonitor from "./SysMonitor";
import { invoke } from "@tauri-apps/api/core";
import { Cmds } from "@/lib/enum";
import useUserStore from "@/store/userStore";
import { User as Account } from "@/types/user";
import { Trans } from "@lingui/react/macro";
import { t } from "@lingui/core/macro"



export default function User() {
  const [isEditingUser, setIsEditingUser] = useState(false)
  const [isDiskPickerOpen, setIsDiskPickerOpen] = useState(false)
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const [diskUsage, setDiskUsage] = useState<number>(0.0)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const { user, setUser } = useUserStore()
  console.log("用户信息: ", user)

  const handleUserInfo = () => {
    setIsEditingUser(true)
  }
  const selectDisk = () => {
    setIsDiskPickerOpen(true);
  }
  const handleDiskChange = async (path: string) => {
    try {
      setUser({ ...user, selectedDisk: path } as Account)
      let usage = await invoke<number>(Cmds.GET_DISK_USAGE, { path: path })
      setDiskUsage(usage)
    } catch (e) {
      console.error("获取磁盘使用率失败: ", e)
    }
  }

  useEffect(() => {
    handleDiskChange(user?.selectedDisk || "")
  }, [])

  return (
    <div className="h-full flex justify-center items-center bg-zinc-300 px-4">
      {/* ------------各种对话框组件------------- */}
      <EditUserInfoDialog isOpen={isEditingUser} onClose={() => setIsEditingUser(false)} />

      {isDiskPickerOpen && (
        <DiskPicker
          onSelect={(path) => handleDiskChange(path)}
          onClose={() => setIsDiskPickerOpen(false)}
        />
      )}

      {isYearPickerOpen && (
        <YearPicker
          currentYear={selectedYear}
          onSelect={(year) => setSelectedYear(year)}
          onClose={() => setIsYearPickerOpen(false)}
        />
      )}


      <div className="flex h-[90vh] w-[93vw] gap-4 mt-3">
        {/* 左侧长条卡片 (头像/成就/时间) */}
        <CommonCard className="w-35 h-full flex flex-col">
          <div className="w-full h-full flex flex-col justify-between">
            <div className="w-full flex flex-col gap-6">
              <Avatar className="w-full h-auto" />
              <div className="@container inline-size! w-full">
                <Trophy className="w-full h-auto" />
                <div className={cn(
                  "w-full text-center mt-2",
                  "text-[clamp(1rem,30cqw,5rem)]",
                  "leading-none font-bold italic"
                )}>
                  {user?.gamesCompletedNumber || 0}
                </div>
              </div>
              <div className="@container inline-size! w-full">
                <Clock className="w-full h-auto" />
                <div className={cn(
                  "w-full text-center mt-2",
                  "text-[clamp(1rem,30cqw,5rem)]",
                  "leading-none font-bold italic"
                )}>
                  {user?.totalPlayTime || 0}h
                </div>
              </div>
            </div>
            <div className="cursor-pointer">
              <CircleEllipsis className="w-full h-auto" />
            </div>
          </div>
        </CommonCard>

        {/* 右侧主内容区 */}
        <div className="flex-1 grid grid-cols-9 grid-rows-7 gap-4">

          {/* 顶部个人信息 (占 2 列) */}
          <CommonCard title="Profile" className="col-span-6 row-span-2" headerAction={
            <MoreOptions entries={[{ entryName: t`修改信息`, entryFunc: () => handleUserInfo() }]} />
          }>
            <ProfileHeader username={user?.userName || "user"} />
          </CommonCard>

          {/* 右上角黑色卡片 */}
          <CommonCard title={t`信息和工具`} className="bg-zinc-800 text-white col-span-3 row-span-1">
            <ToolBox companionPath="/" isCompanionEnabled={false} onCompanionToggle={() => { alert("nihao") }} />
          </CommonCard>
          {/* 右二黑色卡片 */}
          <CommonCard className="bg-zinc-800 col-span-3 row-span-3" >
            <Radar />
          </CommonCard>

          {/* 中间大块 (可以放热力图) */}
          <CommonCard
            title={`Activity (${selectedYear})`}
            headerAction={
              <MoreOptions
                entries={[{
                  entryName: t`选择年份`,
                  entryFunc: () => setIsYearPickerOpen(true)
                }]}
              />
            }
            className="col-span-4 row-span-5"
          >
            <DragScroller>
              {/* 传入 selectedYear 给热力图 */}
              <CalendarHeatMap year={selectedYear} />
            </DragScroller>
          </CommonCard>
          {/* 其他小方块 */}
          <CommonCard
            title="usage"
            className="bg-zinc-800 col-span-2 row-span-2"
            headerAction={<MoreOptions entries={[{ entryName: t`选择磁盘`, entryFunc: () => selectDisk() }]} />}>
            <SysMonitor diskUsage={diskUsage} />
          </CommonCard>

          <CommonCard className="col-span-5 row-span-3" >
            <GameJourney games={[]} />
          </CommonCard>
        </div>
      </div >

    </div >
  )
}

export function DiskPicker({ onSelect, onClose }: { onSelect: (path: string) => void, onClose: () => void }) {
  const [disks, setDisks] = useState<string[]>([]);

  useEffect(() => {
    invoke<string[]>(Cmds.GET_DISKS).then(setDisks);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-64 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        <div className="border-b border-zinc-800 p-3">
          <h3 className="text-sm font-medium text-zinc-400"><Trans>选择监控磁盘</Trans></h3>
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {disks.map((path) => (
            <button
              key={path}
              onClick={() => { onSelect(path); onClose(); }}
              className="flex w-full items-center px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors rounded-lg"
            >
              <span className="mr-2">💽</span>
              {path}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full border-t border-zinc-800 p-2 text-xs text-zinc-500 hover:bg-zinc-800"
        >
          <Trans>
            取消
          </Trans>
        </button>
      </div>
    </div>
  )
}

export function YearPicker({
  currentYear,
  onSelect,
  onClose
}: {
  currentYear: string,
  onSelect: (year: string) => void,
  onClose: () => void
}) {
  // 动态生成从 2026 到当前年份的列表
  const years = useMemo(() => {
    const startYear = 2026
    const endYear = new Date().getFullYear() // 获取当前系统时间的年份
    const list = []

    // 如果当前年份小于 2026 ，至少保证有 2026
    const effectiveEndYear = Math.max(startYear, endYear);

    for (let i = effectiveEndYear; i >= startYear; i--) {
      list.push(i.toString())
    }
    return list
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-48 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl text-white">
        <div className="border-b border-zinc-800 p-3 text-center">
          <h3 className="text-sm font-medium text-zinc-400">
            <Trans>选择统计年份</Trans>
          </h3>
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => { onSelect(year); onClose(); }}
              className={cn(
                "flex w-full items-center justify-center px-3 py-2 text-sm transition-colors rounded-lg",
                currentYear === year
                  ? "bg-zinc-700 text-white font-bold"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              )}
            >
              {year} <Trans>年</Trans>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full border-t border-zinc-800 p-2 text-xs text-zinc-500 hover:bg-zinc-800 transition-colors"
        >
          <Trans>取消</Trans>
        </button>
      </div>
    </div>
  )
}
