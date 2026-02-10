import CalendarHeatMap from "./Calendar"
import GameJourney from "./GameJourney"
import MoreOptions from "@/components/MoreOption"
import ProfileHeader from "./ProfileHeader"
import Radar from "./Radar"
import ToolBox from "./Tool"
import CommonCard from "@/components/CommonCard"
import { Clock, Trophy, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { DragScroller } from "./DragScroller"
import EditUserInfoDialog from "./EditUserInfoDialog"
import { cn } from "@/lib/utils"
import SysMonitor from "./SysMonitor"
import { invoke } from "@tauri-apps/api/core"
import { Cmds } from "@/lib/enum"
import useUserStore from "@/store/userStore"
import { User as Account } from "@/types/user"
import { Trans } from "@lingui/react/macro"
import { t } from "@lingui/core/macro"
import useGameStore from "@/store/gameStore"


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
  const [isEditingUser, setIsEditingUser] = useState(false)
  const [isDiskPickerOpen, setIsDiskPickerOpen] = useState(false)
  const [diskUsage, setDiskUsage] = useState<number>(0.0)
  const { gameMetaList } = useGameStore()
  // 热力图的控制
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  // 快照显示的控制
  const [journeyYear, setJourneyYear] = useState(new Date().getFullYear()) // 历程专用
  const [journeyMonth, setJourneyMonth] = useState(new Date().getMonth() + 1) // 历程专用

  // 热力图
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false)
  // 快照
  const [isJourneyPickerOpen, setIsJourneyPickerOpen] = useState(false)
  const { user, setUser } = useUserStore()

  const handleUserInfo = () => {
    setIsEditingUser(true)
  }
  const selectDisk = () => {
    setIsDiskPickerOpen(true)
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

  useEffect(() => {
    console.log("触发了更新")
    if (!user) return

    const count = gameMetaList.filter(g => g.isPassed).length
    const totalMinutes = gameMetaList.reduce((prev, g) => prev + (g.playTime || 0), 0)

    const needUpdate = user.gamesCompletedNumber !== count || user.totalPlayTime !== totalMinutes

    if (needUpdate) {
      setUser({
        gamesCompletedNumber: count,
        totalPlayTime: totalMinutes
      })
    }
  }, [gameMetaList])

  return (
    <div className="h-full flex justify-center items-center bg-zinc-300">
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

      {isJourneyPickerOpen && (
        <YearMonthPicker
          currentYear={journeyYear}
          currentMonth={journeyMonth}
          onSelect={(y: number, m: number) => {
            setJourneyYear(y)
            setJourneyMonth(m)
          }}
          onClose={() => setIsJourneyPickerOpen(false)}
        />
      )}


      <div className="flex h-[90vh] w-[93vw] gap-4 mt-3">
        {/* 左侧长条卡片 (头像/成就/时间) */}
        <CommonCard className="w-35 h-full flex flex-col">
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
            {/* <div className="cursor-pointer"> */}
            {/*   <CircleEllipsis className="w-full h-auto" /> */}
            {/* </div> */}
          </div>
        </CommonCard>

        {/* 右侧主内容区 */}
        <div className="flex-1 grid grid-cols-9 grid-rows-7 gap-4">

          {/* 顶部个人信息 (占 2 列) */}
          <CommonCard title="Profile" className="col-span-6 row-span-2" headerAction={
            <MoreOptions entries={[{ entryName: "修改信息", entryFunc: handleUserInfo }]} />
          }>
            <ProfileHeader username="yumilengjiao" />
          </CommonCard>

          {/* 右上角黑色卡片 */}
          <CommonCard title="信息和工具" className="bg-zinc-800 text-white col-span-3 row-span-1">
            <ToolBox companionPath="/" isCompanionEnabled={false} onCompanionToggle={() => { alert("nihao") }} />
          </CommonCard>
          {/* 右二黑色卡片 */}
          <CommonCard className="bg-zinc-800 col-span-3 row-span-3" >
            <Radar data={radarData} />
          </CommonCard>

          {/* 中间大块 (可以放热力图) */}
          <CommonCard
            title="Activity"
            headerAction={<MoreOptions entries={[{ entryName: "选择年份", entryFunc: () => alert("你好") }]} />}
            className="col-span-4 row-span-5">
            < DragScroller >
              <CalendarHeatMap />
            </DragScroller>
          </CommonCard>

          {/* 其他小方块 */}
          <CommonCard
            title="usage"
            className="bg-zinc-800 col-span-2 row-span-2"
            headerAction={<MoreOptions entries={[{ entryName: "选择磁盘", entryFunc: () => alert("你好啊") }]} />}>
            <div className="h-full w-full flex flex-col gap-5">
              <ProgressBar label="CPU" value={93} />
              <ProgressBar label="Memory" value={73} />
              <ProgressBar label="DISK" value={13} />
            </div>
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
  const [disks, setDisks] = useState<string[]>([])

  useEffect(() => {
    invoke<string[]>(Cmds.GET_DISKS).then(setDisks)
  }, [])

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
              onClick={() => {
                onSelect(path)
                onClose()
              }}
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
    const effectiveEndYear = Math.max(startYear, endYear)

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
              onClick={() => {
                onSelect(year)
                onClose()
              }}
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

export function YearMonthPicker({ currentYear, currentMonth, onSelect, onClose }: any) {
  const years = [2024, 2025, 2026] // 根据需求写死或动态生成
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-zinc-200"><Trans>选择历程日期</Trans></h3>
          <X className="cursor-pointer text-zinc-500 hover:text-white" onClick={onClose} />
        </div>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {years.map(y => (
              <button key={y} onClick={() => onSelect(y, currentMonth)} className={cn("px-4 py-1.5 rounded-full text-xs transition-all", currentYear === y ? "bg-white text-black font-bold" : "bg-zinc-800 text-zinc-400")}>{y}</button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {months.map(m => (
              <button key={m} onClick={() => onSelect(currentYear, m)} className={cn("py-2 rounded-lg text-xs transition-all", currentMonth === m ? "bg-zinc-200 text-black font-bold" : "bg-zinc-800 text-zinc-400")}>{m}月</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
