import { cn } from "@/lib/utils"
import useShortcutStore from "@/store/shortcutStore"
import { t } from "@lingui/core/macro"
import { Trans } from "@lingui/react/macro"
import { Keyboard, Save, X, RotateCcw } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

export function ShortcutManager({ onClose }: { onClose: () => void }) {
  const { shortcuts, updateShorts } = useShortcutStore()
  const [localShortcuts, setLocalShortcuts] = useState<ShortcutSetting[]>([])
  const [recordingId, setRecordingId] = useState<string | null>(null)

  const shortcutDetails = useMemo(() => ({
    launch_last: { name: t`启动上次游戏`, desc: t`一键拉起最后一次关闭的游戏及连携程序` },
    confirm_launch: { name: t`确认启动`, desc: t`在界面选中游戏时按回车直接启动` },
    focus_search: { name: t`聚焦搜索`, desc: t`快速定位到搜索框进行过滤` },
    nav_home: { name: t`切换至：主页`, desc: t`跳转到首页界面` },
    nav_library: { name: t`切换至：游戏库`, desc: t`跳转到我的游戏库` },
    nav_profile: { name: t`切换至：个人页面`, desc: t`跳转到个人中心` },
    nav_settings: { name: t`切换至：设置界面`, desc: t`跳转到系统设置` },
    boss_key: { name: t`老板键`, desc: t`全局隐藏窗口并静音` },
    global_wake: { name: t`全局唤醒`, desc: t`在任何界面调出程序主窗口` },
    emergency_stop: { name: t`紧急停止`, desc: t`强杀当前游戏及其关联的所有连携程序` },
    screenshot: { name: t`游戏截图`, desc: t`捕获当前游戏画面` },
  }), [])

  useEffect(() => {
    setLocalShortcuts(shortcuts)
  }, [shortcuts])

  useEffect(() => {
    if (!recordingId) return
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return

      const keys = []
      if (e.ctrlKey) keys.push("Control")
      if (e.altKey) keys.push("Alt")
      if (e.shiftKey) keys.push("Shift")
      if (e.metaKey) keys.push("Command")

      let mainKey = e.key === " " ? "Space" : e.key.length === 1 ? e.key.toUpperCase() : e.key
      keys.push(mainKey)
      const combo = keys.join("+")

      setLocalShortcuts(prev => prev.map(s =>
        s.id === recordingId ? { ...s, keyCombo: combo } : s
      ))
      setRecordingId(null)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [recordingId])

  return (
    <div
      className="fixed inset-0 z-100 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className={cn(
          "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 w-full max-w-4xl max-h-[80vh] rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - 白色背景 + 翡翠绿装饰 */}
        <div className="px-10 py-7 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-custom-50/30 dark:bg-custom-950/10">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-custom-500/10 rounded-2xl">
              <Keyboard className="w-8 h-8 text-custom-600 dark:text-custom-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight"><Trans>快捷键设置</Trans></h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium"><Trans>配置您的操作偏好，提升启动效率</Trans></p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors group">
            <X className="w-6 h-6 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100" />
          </button>
        </div>

        {/* 内容区域 - 隐藏下拉条 */}
        <div
          className="flex-1 overflow-y-auto px-10 py-6 space-y-3"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <style>{`
            div::-webkit-scrollbar { display: none }
          `}</style>

          {localShortcuts.map((s) => {
            const info = (shortcutDetails as any)[s.id]
            const isRecording = recordingId === s.id

            return (
              <div
                key={s.id}
                className={cn(
                  "flex items-center justify-between p-5 rounded-[1.5rem] border transition-all duration-300",
                  isRecording
                    ? "border-custom-500 bg-custom-50 dark:bg-custom-950/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                    : "border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-custom-200 dark:hover:border-custom-800 hover:bg-white dark:hover:bg-zinc-800/60"
                )}
              >
                <div className="flex-1 pr-10">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-zinc-800 dark:text-zinc-200">{info?.name || s.id}</span>
                    {s.isGlobal && (
                      <span className="px-2 py-0.5 text-[10px] bg-custom-100 dark:bg-custom-900/30 text-custom-700 dark:text-custom-400 border border-custom-200 dark:border-custom-800 rounded-md font-black uppercase tracking-widest">Global</span>
                    )}
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">{info?.desc || "暂无详细描述"}</p>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setRecordingId(s.id)}
                    className={cn(
                      "min-w-44 h-12 px-6 rounded-2xl font-mono text-sm font-black border-2 transition-all",
                      isRecording
                        ? "bg-custom-600 border-custom-500 text-white animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-custom-600 dark:text-custom-400 hover:border-custom-500 hover:shadow-sm"
                    )}
                  >
                    {isRecording ? t`请录制按键...` : (s.keyCombo || t`未绑定`)}
                  </button>

                  <button
                    onClick={() => setLocalShortcuts(prev => prev.map(item => item.id === s.id ? { ...item, keyCombo: null } : item))}
                    className="p-3 text-zinc-400 dark:text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-2xl transition-all"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-10 py-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-end items-center gap-6">
          <button
            onClick={onClose}
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-bold transition-colors"
          >
            <Trans>放弃修改</Trans>
          </button>
          <button
            onClick={async () => {
              await updateShorts(localShortcuts)
              onClose()
            }}
            className="flex items-center gap-3 px-10 py-3.5 bg-custom-600 hover:bg-custom-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-custom-500/30 active:scale-95 text-lg"
          >
            <Save className="w-6 h-6" /> <Trans>保存并应用</Trans>
          </button>
        </div>
      </div>
    </div>
  )
}
