import { useEffect, useState } from "react"
import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import { motion } from "framer-motion"
import { Cpu, HardDrive, MemoryStick } from "lucide-react"
import useUserStore from "@/store/userStore"
import { Cmds } from "@/lib/enum"
import { cn } from "@/lib/utils"

export function SystemMonitor() {
  const [stats, setStats] = useState<{ cpuUsage: number; memoryUsage: number } | null>(null)
  const [diskUsage, setDiskUsage] = useState(0)
  const [disks, setDisks] = useState<string[]>([])
  const user = useUserStore(s => s.user)
  const { setUser } = useUserStore()

  useEffect(() => {
    const p = listen<{ cpuUsage: number; memoryUsage: number }>("sys-monitor", e => setStats(e.payload))
    invoke<string[]>(Cmds.GET_DISKS).then(setDisks).catch(() => {})
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
    <div className="space-y-5">
      {disks.length > 0 && (
        <div className="flex items-center gap-2">
          <HardDrive size={13} className="text-zinc-400 shrink-0" />
          <span className="text-xs text-zinc-400 font-semibold shrink-0">监控磁盘</span>
          <div className="flex flex-wrap gap-1.5 ml-1">
            {disks.map(disk => (
              <button
                key={disk}
                onClick={() => setUser({ selectedDisk: disk })}
                className={cn(
                  "text-[11px] font-bold px-2.5 py-0.5 rounded-lg transition-all",
                  user?.selectedDisk === disk
                    ? "bg-cyan-500/20 text-cyan-500 ring-1 ring-cyan-500/30"
                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                )}
              >
                {disk}
              </button>
            ))}
          </div>
        </div>
      )}

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
