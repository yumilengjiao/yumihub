import { useEffect, useMemo, useState } from "react"
import { convertFileSrc } from "@tauri-apps/api/core"
import { motion } from "framer-motion"
import { t } from "@lingui/core/macro"
import { Trans } from "@lingui/react/macro"
import {
  Trophy, Clock,
  Pencil,
  Sun, Moon, Sunrise, Sunset, Coffee,
} from "lucide-react"
import useUserStore from "@/store/userStore"
import useGameStore from "@/store/gameStore"
import { usePageBackground } from "@/hooks/usePageBackground"
import { cn } from "@/lib/utils"
import defaultAvatar from "@/assets/runasama😍😍😍😍.jpg"
import EditUserInfoDialog from "./EditUserInfoDialog"
import { DragScroller } from "./DragScroller"
import { ActivityHeatmap } from "./ActivityHeatmap"
import { DeveloperRadar } from "./DeveloperRadar"
import { JourneyPanel } from "./JourneyPanel"
import { MonthNav, SectionTitle, YearNav } from "./UserNavigation"
import { SystemMonitor } from "./SystemMonitor"

// ── 主页面 ────────────────────────────────────────────────────────────────────
export default function User() {
  const { user, setUser } = useUserStore()
  const { gameMetaList } = useGameStore()
  const bgStyle = usePageBackground()
  const [editOpen, setEditOpen] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [journeyYear, setJourneyYear] = useState(new Date().getFullYear())
  const [journeyMonth, setJourneyMonth] = useState(new Date().getMonth() + 1)

  useEffect(() => {
    if (!user) return
    const count = gameMetaList.filter(g => g.isPassed).length
    const mins = gameMetaList.reduce((s, g) => s + (g.playTime || 0), 0)
    if (user.gamesCompletedNumber !== count || user.totalPlayTime !== mins)
      setUser({ gamesCompletedNumber: count, totalPlayTime: mins })
  }, [gameMetaList])

  const avatarSrc = useMemo(() => {
    const p = user?.avatar
    if (!p) return defaultAvatar
    if (p.startsWith("http")) return p
    try { return convertFileSrc(p) } catch { return defaultAvatar }
  }, [user?.avatar])

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h >= 5 && h < 11) return { text: t`早上好`, sub: t`新的一天，也要充满元气哦！`, icon: <Sunrise size={22} className="text-orange-400" /> }
    if (h >= 11 && h < 14) return { text: t`中午好`, sub: t`午饭吃了吗？记得休息一下。`, icon: <Sun size={22} className="text-yellow-400" /> }
    if (h >= 14 && h < 18) return { text: t`下午好`, sub: t`来杯咖啡吧，又是努力的一天。`, icon: <Coffee size={22} className="text-amber-500" /> }
    if (h >= 18 && h < 22) return { text: t`晚上好`, sub: t`辛苦了，开启一段精彩的故事吧。`, icon: <Sunset size={22} className="text-rose-400" /> }
    return { text: t`晚安`, sub: t`夜深了，推完这节就快去睡觉吧。`, icon: <Moon size={22} className="text-indigo-400" /> }
  }, [])

  const navYear = (dir: 1 | -1) => {
    const next = Number(selectedYear) + dir
    if (next > new Date().getFullYear()) return
    setSelectedYear(String(next))
  }

  const navMonth = (dir: 1 | -1) => {
    let m = journeyMonth + dir, y = journeyYear
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    setJourneyMonth(m); setJourneyYear(y)
  }

  return (
    <div className="relative h-full w-full overflow-y-auto overflow-x-hidden bg-zinc-100 dark:bg-zinc-900/95 pt-14">
      {bgStyle && <div className="absolute inset-0 z-0 pointer-events-none" style={bgStyle} />}
      <div className="absolute inset-0 z-0 pointer-events-none bg-white/20 dark:bg-black/40" />

      <div className="relative z-10 px-12 pt-14 pb-20 space-y-10 max-w-[85vw] mx-auto">

        {/* ─── 个人信息头 ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-8"
        >
          {/* 头像 */}
          <div
            className="relative w-24 h-24 rounded-3xl overflow-hidden cursor-pointer group shrink-0 shadow-xl"
            onClick={() => setEditOpen(true)}
          >
            <img src={avatarSrc} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Pencil size={20} className="text-white" />
            </div>
          </div>

          {/* 问候文字 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              {greeting.icon}
              <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                {greeting.text}，{user?.userName || "user"}
              </h1>
            </div>
            <p className="text-base text-zinc-400 dark:text-zinc-500">{greeting.sub}</p>
          </div>

          {/* 数据 */}
          <div className="flex items-center gap-10 shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 text-amber-400">
                <Trophy size={20} />
                <span className="text-sm font-semibold text-zinc-400"><Trans>通关</Trans></span>
              </div>
              <span className="text-5xl font-black text-zinc-800 dark:text-zinc-100 tabular-nums">
                {user?.gamesCompletedNumber || 0}
              </span>
            </div>
            <div className="w-px h-16 bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 text-blue-400">
                <Clock size={20} />
                <span className="text-sm font-semibold text-zinc-400"><Trans>时长</Trans></span>
              </div>
              <span className="text-5xl font-black text-zinc-800 dark:text-zinc-100 tabular-nums">
                {((user?.totalPlayTime || 0) / 60).toFixed(1)}
                <span className="text-2xl text-zinc-400 font-bold ml-1">h</span>
              </span>
            </div>
          </div>

          <button
            onClick={() => setEditOpen(true)}
            className="p-3 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-2xl transition-colors shrink-0"
          >
            <Pencil size={20} className="text-zinc-400" />
          </button>
        </motion.div>

        {/* ─── Activity 热力图（全宽） ─────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <SectionTitle
            label="Activity"
            right={
              <YearNav year={selectedYear} onPrev={() => navYear(-1)} onNext={() => navYear(1)} />
            }
          />
          <DragScroller height="h-85" className={
            cn(
              "border-2 bg-secondary/40"
            )
          }>
            <ActivityHeatmap year={selectedYear} />
          </DragScroller>
        </motion.div>

        {/* ─── 系统监控 + 雷达图 并排 ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <SectionTitle label="System" />
            <div className="h-64 bg-secondary/40 border-2 p-6">
              <SystemMonitor />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}>
            <SectionTitle label="Developers" />
            <div className="h-64 bg-secondary/40 border-2">
              <DeveloperRadar />
            </div>
          </motion.div>
        </div>

        {/* ─── Journey 历程截图（全宽） ───────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <SectionTitle
            label="Journey"
            right={
              <MonthNav
                year={journeyYear} month={journeyMonth}
                onPrev={() => navMonth(-1)} onNext={() => navMonth(1)}
              />
            }
          />
          <JourneyPanel year={journeyYear} month={journeyMonth} />
        </motion.div>

      </div>

      <EditUserInfoDialog isOpen={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  )
}
