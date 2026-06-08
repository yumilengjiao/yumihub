import { useEffect, useState } from "react"
import { convertFileSrc, invoke } from "@tauri-apps/api/core"
import { t } from "@lingui/core/macro"
import { Trans } from "@lingui/react/macro"
import { Camera, PencilLine, Quote, Trash2, X } from "lucide-react"
import { Cmds } from "@/lib/enum"
import { cn } from "@/lib/utils"
import type { Screenshot } from "@/types/screenshot"

export function JourneyPanel({ year, month }: { year: number; month: number }) {
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
