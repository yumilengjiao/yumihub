import { cn } from "@/lib/utils"
import useShortcutStore from "@/store/shortcutStore"
import { t } from "@lingui/core/macro"
import { Trans } from "@lingui/react/macro"
import { Keyboard, Save, X, RotateCcw } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { ShortcutSetting } from "@/types/shortcut"

export function ShortcutManager({ onClose }: { onClose: () => void }) {
  const { shortcuts, updateShortcuts } = useShortcutStore()
  const [locals, setLocals] = useState<ShortcutSetting[]>([])
  const [recording, setRecording] = useState<string | null>(null)

  const details = useMemo(() => ({
    launch_last:    { name: t`启动上次游戏`,    desc: t`快速拉起最后一次关闭的游戏` },
    confirm_launch: { name: t`确认启动`,        desc: t`选中游戏时按此键直接启动` },
    nav_home:       { name: t`切换至主页`,      desc: t`跳转到首页` },
    nav_library:    { name: t`切换至游戏库`,    desc: t`跳转到游戏库` },
    nav_profile:    { name: t`切换至个人页面`,  desc: t`跳转到个人中心` },
    nav_settings:   { name: t`切换至设置`,      desc: t`跳转到设置页` },
    boss_key:       { name: t`老板键`,          desc: t`全局隐藏所有窗口` },
    emergency_stop: { name: t`紧急停止`,        desc: t`强制关闭游戏及所有连携程序` },
    screenshot:     { name: t`截图`,            desc: t`捕获当前游戏画面` },
  } as Record<string, { name: string; desc: string }>), [])

  useEffect(() => { setLocals(shortcuts) }, [shortcuts])

  useEffect(() => {
    if (!recording) return
    const handler = (e: KeyboardEvent) => {
      e.preventDefault()
      if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return
      const keys: string[] = []
      if (e.ctrlKey) keys.push("Control")
      if (e.altKey) keys.push("Alt")
      if (e.shiftKey) keys.push("Shift")
      if (e.metaKey) keys.push("Command")
      const main = e.key === " " ? "Space" : e.key.length === 1 ? e.key.toUpperCase() : e.key
      keys.push(main)
      setLocals(prev => prev.map(s => s.id === recording ? { ...s, keyCombo: keys.join("+") } : s))
      setRecording(null)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [recording])

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 w-full max-w-2xl max-h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-zinc-200/60 dark:border-zinc-700/60 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-custom-50 dark:bg-custom-950/30 rounded-xl">
              <Keyboard size={20} className="text-custom-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100"><Trans>快捷键设置</Trans></h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5"><Trans>点击绑定区域后按下目标按键组合</Trans></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={18} className="text-zinc-400" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
          {locals.map(s => {
            const info = details[s.id]
            const isRec = recording === s.id
            return (
              <div
                key={s.id}
                className={cn(
                  "flex items-center justify-between px-4 py-3.5 rounded-xl transition-all",
                  isRec
                    ? "bg-custom-50 dark:bg-custom-950/20 border border-custom-200 dark:border-custom-800"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60 border border-transparent"
                )}
              >
                <div className="flex-1 pr-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      {info?.name || s.id}
                    </span>
                    {s.isGlobal && (
                      <span className="px-1.5 py-0.5 text-[9px] font-black bg-custom-100 dark:bg-custom-900/30 text-custom-600 dark:text-custom-400 rounded uppercase tracking-wider">
                        Global
                      </span>
                    )}
                  </div>
                  {info?.desc && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{info.desc}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRecording(s.id)}
                    className={cn(
                      "min-w-36 h-9 px-4 rounded-xl font-mono text-xs font-bold border-2 transition-all",
                      isRec
                        ? "bg-custom-500 border-custom-400 text-white animate-pulse"
                        : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-custom-400"
                    )}
                  >
                    {isRec ? t`按下按键...` : (s.keyCombo || t`未绑定`)}
                  </button>
                  <button
                    onClick={() => setLocals(prev => prev.map(item => item.id === s.id ? { ...item, keyCombo: null } : item))}
                    className="p-2 text-zinc-300 dark:text-zinc-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
            <Trans>取消</Trans>
          </button>
          <button
            onClick={async () => { await updateShortcuts(locals); onClose() }}
            className="flex items-center gap-2 px-6 py-2 bg-custom-500 hover:bg-custom-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-custom-500/20 active:scale-95"
          >
            <Save size={14} /> <Trans>保存</Trans>
          </button>
        </div>
      </div>
    </div>
  )
}
