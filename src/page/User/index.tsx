import { useEffect, useMemo, useState } from "react"
import { invoke, convertFileSrc } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import { motion } from "framer-motion"
import { t } from "@lingui/core/macro"
import { Trans } from "@lingui/react/macro"
import {
  Trophy, Clock, Cpu, MemoryStick, HardDrive,
  Pencil, ChevronLeft, ChevronRight,
  Sun, Moon, Sunrise, Sunset, Coffee,
  Camera, Quote, PencilLine, Trash2, X,
} from "lucide-react"
import { ResponsiveCalendar } from "@nivo/calendar"
import { ResponsiveRadar } from "@nivo/radar"
import useUserStore from "@/store/userStore"
import useGameStore from "@/store/gameStore"
import useSessionStore from "@/store/sessionStore"
import { usePageBackground } from "@/hooks/usePageBackground"
import { Cmds } from "@/lib/enum"
import { cn } from "@/lib/utils"
import defaultAvatar from "@/assets/runasama😍😍😍😍.jpg"
import { Screenshot } from "@/types/screenshot"
import EditUserInfoDialog from "./EditUserInfoDialog"
import { DragScroller } from "./DragScroller"

// ── 暗色模式 ──────────────────────────────────────────────────────────────────
function useDark() {
  const [dark, setDark] = useState(document.documentElement.classList.contains("dark"))
  useEffect(() => {
    const ob = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains("dark"))
    )
    ob.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => ob.disconnect()
  }, [])
  return dark
}

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

// ── 分区标题 ──────────────────────────────────────────────────────────────────
function SectionTitle({ label, right }: { label: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-1 h-5 rounded-full bg-custom-500" />
        <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
          {label}
        </span>
      </div>
      {right}
    </div>
  )
}

// ── 年份导航 ──────────────────────────────────────────────────────────────────
function YearNav({ year, onPrev, onNext }: { year: string; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={onPrev} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors">
        <ChevronLeft size={16} className="text-zinc-400" />
      </button>
      <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400 w-12 text-center">{year}</span>
      <button
        onClick={onNext}
        disabled={Number(year) >= new Date().getFullYear()}
        className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-30"
      >
        <ChevronRight size={16} className="text-zinc-400" />
      </button>
    </div>
  )
}

// ── 月份导航 ──────────────────────────────────────────────────────────────────
function MonthNav({ year, month, onPrev, onNext }: { year: number; month: number; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={onPrev} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors">
        <ChevronLeft size={16} className="text-zinc-400" />
      </button>
      <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400 w-20 text-center">
        {year}-{String(month).padStart(2, "0")}
      </span>
      <button onClick={onNext} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors">
        <ChevronRight size={16} className="text-zinc-400" />
      </button>
    </div>
  )
}

// ── Activity 热力图 ───────────────────────────────────────────────────────────
function ActivityHeatmap({ year }: { year: string }) {
  const { sessions, fetchSessions } = useSessionStore()
  const dark = useDark()

  useEffect(() => { fetchSessions(year) }, [year])

  const data = useMemo(() => {
    const map = new Map<string, number>()
    sessions.forEach(s => {
      const k = s.playDate.substring(0, 10)
      map.set(k, (map.get(k) || 0) + s.durationMinutes)
    })
    return Array.from(map.entries()).map(([day, m]) => ({ day, value: +(m / 60).toFixed(1) }))
  }, [sessions])

  return (
    <div className="w-[1100px] h-full">
      <ResponsiveCalendar
        data={data}
        from={`${year}-01-01`} to={`${year}-12-31`}
        emptyColor={dark ? "#27272a" : "#f4f4f5"}
        monthBorderColor={dark ? "#09090b" : "#ffffff"}
        dayBorderColor={dark ? "#09090b" : "#ffffff"}
        colors={["#97e3d5", "#61cdbb", "#e8c1a0", "#f47560"]}
        minValue={0} maxValue={8}
        margin={{ top: 36, right: 10, bottom: 10, left: 44 }}
        theme={{
          text: { fontSize: 13, fill: dark ? "#71717a" : "#a1a1aa" },
          tooltip: { container: { background: dark ? "#18181b" : "#fff", color: dark ? "#fafafa" : "#18181b", fontSize: 13, borderRadius: 10 } },
        }}
      />
    </div>
  )
}

// ── 系统监控 ─────────────────────────────────────────────────────────────────
function SystemMonitor() {
  const [stats, setStats] = useState<{ cpuUsage: number; memoryUsage: number } | null>(null)
  const [diskUsage, setDiskUsage] = useState(0)
  const user = useUserStore(s => s.user)

  useEffect(() => {
    const p = listen<{ cpuUsage: number; memoryUsage: number }>("sys-monitor", e => setStats(e.payload))
    return () => { p.then(f => f()) }
  }, [])

  useEffect(() => {
    if (user?.selectedDisk)
      invoke<number>(Cmds.GET_DISK_USAGE, { path: user.selectedDisk }).then(setDiskUsage).catch(() => { })
  }, [user?.selectedDisk])

  const bars = [
    { label: "CPU", value: stats?.cpuUsage || 0, icon: <Cpu size={16} />, color: "#6366f1" },
    { label: "RAM", value: stats?.memoryUsage || 0, icon: <MemoryStick size={16} />, color: "#8b5cf6" },
    { label: "Disk", value: diskUsage, icon: <HardDrive size={16} />, color: "#06b6d4" },
  ]

  return (
    <div className="space-y-6">
      {bars.map(b => (
        <div key={b.label}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5 text-zinc-500 dark:text-zinc-400">
              {b.icon}
              <span className="text-sm font-semibold">{b.label}</span>
            </div>
            <span
              className="text-sm font-bold tabular-nums"
              style={{ color: b.value > 90 ? "#ef4444" : b.value > 70 ? "#f59e0b" : b.color }}
            >
              {b.value.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: b.value > 90 ? "#ef4444" : b.value > 70 ? "#f59e0b" : b.color }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(b.value, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── 制作商雷达图 ──────────────────────────────────────────────────────────────
function DeveloperRadar() {
  const { gameMetaList } = useGameStore()
  const dark = useDark()

  const data = useMemo(() => {
    const normalize = (name: string) => {
      const n = name.trim().toLowerCase()
      if (n.includes("key") || n.includes("visual arts")) return "Key"
      if (n.includes("yuzusoft") || n.includes("柚子")) return "Yuzusoft"
      if (n.includes("alicesoft")) return "AliceSoft"
      if (n.includes("august")) return "August"
      if (n.includes("smee")) return "SMEE"
      if (n.includes("nitroplus")) return "Nitroplus"
      return name.trim().split(/[/／、,，&|+]/)[0]?.trim() || t`未知`
    }
    const stats: Record<string, number> = {}
    gameMetaList.filter(g => g.isPassed && g.developer?.trim()).forEach(g => {
      const d = normalize(g.developer); stats[d] = (stats[d] || 0) + 1
    })
    return Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([tag, value]) => ({ tag, value }))
  }, [gameMetaList])

  if (!data.length) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-zinc-300 dark:text-zinc-700 font-semibold"><Trans>暂无通关数据</Trans></p>
      </div>
    )
  }

  return (
    <ResponsiveRadar
      data={data} keys={["value"]} indexBy="tag"
      margin={{ top: 48, right: 64, bottom: 30, left: 64 }}
      gridLabelOffset={14} gridLevels={3}
      fillOpacity={0.3} dotSize={6} dotBorderWidth={2}
      colors={["hsl(var(--custom-500))"]}
      dotColor={dark ? "#fff" : "hsl(var(--custom-500))"}
      dotBorderColor="hsl(var(--custom-500))"
      blendMode={dark ? "screen" : "multiply"}
      theme={{
        text: { fill: dark ? "#71717a" : "#9ca3af", fontSize: 12, fontWeight: 600 },
        grid: { line: { stroke: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" } },
        tooltip: { container: { background: dark ? "#18181b" : "#fff", color: dark ? "#fafafa" : "#18181b", fontSize: 12, borderRadius: 10 } },
      }}
    />
  )
}

// ── Journey 历程截图 ──────────────────────────────────────────────────────────
function JourneyPanel({ year, month }: { year: number; month: number }) {
  const [snapshots, setSnapshots] = useState<Screenshot[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    invoke<Screenshot[]>(Cmds.GET_SCREENSHOTS_BY_YEAR_MONTH, { year, month })
      .then(d => setSnapshots(d || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [year, month])

  const save = async (id: string, text: string) => {
    await invoke(Cmds.UPDATE_SCREENSHOT_BY_ID, { screenshotId: id, thoughts: text })
    setSnapshots(p => p.map(s => s.id === id ? { ...s, thoughts: text } : s))
    setEditingId(null)
  }

  const del = async (id: string) => {
    await invoke(Cmds.DELETE_SCREENSHOT_BY_ID, { screenshotId: id })
    setSnapshots(p => p.filter(s => s.id !== id))
    setDeletingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-zinc-300 dark:text-zinc-700">
        <Trans>加载中...</Trans>
      </div>
    )
  }

  if (!snapshots.length) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3 text-zinc-300 dark:text-zinc-700 bg-secondary/40 border-2">
        <Camera size={40} strokeWidth={1.5} />
        <p className="text-sm font-semibold"><Trans>本月暂无截图记录</Trans></p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-8">
      {snapshots.map(ss => (
        <div key={ss.id} className="flex flex-col gap-4 animate-in fade-in duration-500">

          {/* 截图 */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 shadow-lg">
            <img
              src={convertFileSrc(ss.filePath)}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <span className="text-xs text-white/80 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg font-semibold">
                {ss.createdAt?.substring(0, 10)}
              </span>
              {deletingId === ss.id ? (
                <div className="flex items-center gap-1.5">
                  <button onClick={() => del(ss.id)} className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow">
                    <Trash2 size={13} />
                  </button>
                  <button onClick={() => setDeletingId(null)} className="p-1.5 bg-black/60 text-white/70 rounded-lg hover:bg-black/80 transition-colors">
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeletingId(ss.id)}
                  className="p-1.5 bg-black/60 text-white/50 hover:text-red-400 rounded-lg transition-colors backdrop-blur-sm"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          {/* 感想 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Quote size={14} className="text-zinc-400" />
              <span className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">Thought</span>
            </div>
            {editingId === ss.id ? (
              <textarea
                autoFocus
                defaultValue={ss.thoughts || ""}
                onBlur={e => save(ss.id, e.target.value)}
                className="w-full h-24 bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-base text-zinc-700 dark:text-zinc-300 outline-none focus:border-custom-400 resize-none leading-relaxed"
              />
            ) : (
              <div
                onClick={() => setEditingId(ss.id)}
                className="group relative cursor-pointer bg-zinc-100/60 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 rounded-xl px-4 py-3 transition-colors min-h-[64px]"
              >
                <p className={cn(
                  "text-base leading-relaxed",
                  ss.thoughts
                    ? "text-zinc-700 dark:text-zinc-300"
                    : "text-zinc-300 dark:text-zinc-600 italic"
                )}>
                  {ss.thoughts || t`点击记录感想...`}
                </p>
                <PencilLine size={14} className="absolute top-3 right-3 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
