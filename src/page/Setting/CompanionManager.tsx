import { cn } from "@/lib/utils"
import { Cmds } from "@/lib/enum"
import { t } from "@lingui/core/macro"
import { Trans } from "@lingui/react/macro"
import { invoke } from "@tauri-apps/api/core"
import { open } from "@tauri-apps/plugin-dialog"
import { Plus, Trash2, CheckCircle2, Settings2, Loader2, X, FolderOpen, Layout } from "lucide-react"
import { useEffect, useState } from "react"
import useCompanionStore from "@/store/companionStore"
import { Companion } from "@/types/companion"

export function CompanionManager({ onClose }: { onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [locals, setLocals] = useState<Companion[]>([])
  const { updateCompanions } = useCompanionStore()

  useEffect(() => {
    invoke<Companion[]>(Cmds.GET_COMPANIONS)
      .then(data => setLocals(data))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const update = (i: number, field: keyof Companion, value: any) =>
    setLocals(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c))

  const pickFile = async (i: number) => {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Executable", extensions: ["exe", "cmd", "bat", "sh"] }],
    })
    if (selected && typeof selected === "string") {
      const name = selected.split(/[\\/]/).pop()?.replace(/\.[^/.]+$/, "") || ""
      setLocals(prev => prev.map((c, idx) =>
        idx === i
          ? { ...c, path: selected, name: c.name === "新程序" || !c.name ? name : c.name }
          : c
      ))
    }
  }

  const save = async () => {
    setIsSaving(true)
    try {
      await updateCompanions(locals)
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 w-full max-w-3xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-zinc-200/60 dark:border-zinc-700/60 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-custom-50 dark:bg-custom-950/30 rounded-xl">
              <Settings2 size={20} className="text-custom-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100"><Trans>连携程序管理</Trans></h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5"><Trans>配置随游戏或程序自动启动的辅助工具</Trans></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={18} className="text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
          {isLoading ? (
            <div className="h-40 flex items-center justify-center">
              <Loader2 size={28} className="animate-spin text-custom-500" />
            </div>
          ) : (
            <>
              {locals.map((item, i) => (
                <div
                  key={i}
                  className={cn(
                    "border rounded-2xl p-5 transition-all",
                    item.isEnabled
                      ? "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 hover:border-custom-300"
                      : "bg-zinc-100/50 dark:bg-zinc-800/30 border-zinc-100 dark:border-zinc-700/50 opacity-60"
                  )}
                >
                  {/* 标题行 */}
                  <div className="flex items-center gap-3 mb-4">
                    <button
                      onClick={() => setLocals(prev => prev.filter((_, idx) => idx !== i))}
                      className="w-7 h-7 flex items-center justify-center bg-red-50 dark:bg-red-950/30 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                    <input
                      className="flex-1 text-sm font-bold bg-transparent outline-none border-b border-transparent focus:border-custom-400 transition-all py-0.5 text-zinc-800 dark:text-zinc-200"
                      value={item.name}
                      onChange={e => update(i, "name", e.target.value)}
                      placeholder={t`程序名称`}
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      {/* 触发模式 */}
                      <div className="flex bg-zinc-100 dark:bg-zinc-700 rounded-lg p-0.5">
                        {(["app", "game"] as const).map(mode => (
                          <button
                            key={mode}
                            onClick={() => update(i, "triggerMode", mode)}
                            className={cn(
                              "px-3 py-1 text-xs font-semibold rounded-md transition-all",
                              item.triggerMode === mode
                                ? "bg-white dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100 shadow-sm"
                                : "text-zinc-400 hover:text-zinc-600"
                            )}
                          >
                            {mode === "app" ? t`随程序` : t`随游戏`}
                          </button>
                        ))}
                      </div>
                      {/* 窗口托管 */}
                      <label className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all select-none",
                        item.isWindowManaged
                          ? "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                          : "bg-zinc-100 dark:bg-zinc-700 border-zinc-200 dark:border-zinc-600 text-zinc-400"
                      )}>
                        <Layout size={12} />
                        <Trans>托管</Trans>
                        <input type="checkbox" className="sr-only" checked={item.isWindowManaged} onChange={e => update(i, "isWindowManaged", e.target.checked)} />
                      </label>
                      {/* 启用开关 */}
                      <label className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all select-none",
                        item.isEnabled
                          ? "bg-custom-50 dark:bg-custom-950/30 border-custom-100 dark:border-custom-800 text-custom-600 dark:text-custom-400"
                          : "bg-zinc-100 dark:bg-zinc-700 border-zinc-200 dark:border-zinc-600 text-zinc-400"
                      )}>
                        {item.isEnabled ? t`启用` : t`禁用`}
                        <input type="checkbox" className="sr-only" checked={item.isEnabled} onChange={e => update(i, "isEnabled", e.target.checked)} />
                      </label>
                    </div>
                  </div>

                  {/* 路径 */}
                  <div
                    onClick={() => pickFile(i)}
                    className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 cursor-pointer hover:border-custom-400 transition-colors mb-3"
                  >
                    <FolderOpen size={14} className="text-zinc-400 shrink-0" />
                    <span className="text-xs font-mono text-zinc-500 flex-1 truncate">
                      {item.path || t`点击选择可执行文件...`}
                    </span>
                  </div>

                  {/* 参数 */}
                  <input
                    className="w-full text-xs font-mono bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 outline-none focus:border-custom-400 transition-colors text-zinc-600 dark:text-zinc-400"
                    value={item.args || ""}
                    onChange={e => update(i, "args", e.target.value)}
                    placeholder={t`启动参数（可选），如 --windowed`}
                  />
                </div>
              ))}

              <button
                onClick={() => setLocals(prev => [...prev, {
                  name: "新程序", path: "", args: "", isEnabled: true,
                  isWindowManaged: true, triggerMode: "game",
                  sortOrder: prev.length + 1, description: "",
                }])}
                className="w-full py-8 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl text-zinc-400 hover:text-custom-500 hover:border-custom-400 transition-all flex items-center justify-center gap-2 text-sm font-semibold bg-transparent dark:hover:bg-zinc-800/30"
              >
                <Plus size={16} /> <Trans>添加新程序</Trans>
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
            <Trans>取消</Trans>
          </button>
          <button
            onClick={save}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-custom-500 hover:bg-custom-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-custom-500/20 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            <Trans>保存</Trans>
          </button>
        </div>
      </div>
    </div>
  )
}
