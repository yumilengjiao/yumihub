import { cn } from "@/lib/utils"
import useCompaionStore from "@/store/compaionStore"
import { Cmds } from "@/lib/enum"
import { t } from "@lingui/core/macro"
import { Trans } from "@lingui/react/macro"
import { invoke } from "@tauri-apps/api/core"
import { open } from "@tauri-apps/plugin-dialog"
import { Plus, Trash2, CheckCircle2, Settings2, Loader2, X, FolderOpen, Layout } from "lucide-react"
import { useEffect, useState } from "react"

export function CompanionManager({ onClose }: { onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [localCompanions, setLocalCompanions] = useState<Companion[]>([])
  const { updateCompanions } = useCompaionStore()

  useEffect(() => {
    const initData = async () => {
      try {
        const data = await invoke<Companion[]>(Cmds.GET_COMPAIONS)
        setLocalCompanions(data)
      } catch (error) {
        console.error("Fetch failed:", error)
      } finally {
        setIsLoading(false)
      }
    }
    initData()
  }, [])

  const handleUpdateField = (index: number, field: keyof Companion, value: any) => {
    setLocalCompanions(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handlePickFile = async (index: number) => {
    const selected = await open({
      multiple: false,
      filters: [{ name: 'Executable', extensions: ['exe', 'cmd', 'bat', 'sh'] }]
    })

    if (selected && typeof selected === 'string') {
      const fileName = selected.split(/[\\/]/).pop()?.replace(/\.[^/.]+$/, "")
      setLocalCompanions(prev => {
        const next = [...prev]
        next[index] = {
          ...next[index],
          path: selected,
          name: (next[index].name === '新程序' || !next[index].name) ? (fileName || next[index].name) : next[index].name
        }
        return next
      })
    }
  }

  const handleAddNew = () => {
    const newItem: Companion = {
      name: '新程序',
      path: '',
      args: '',
      isEnabled: true,
      isWindowManaged: true,
      triggerMode: 'game',
      sortOrder: localCompanions.length + 1,
      description: ''
    }
    setLocalCompanions([...localCompanions, newItem])
  }

  const handleRemove = (index: number) => {
    setLocalCompanions(localCompanions.filter((_, i) => i !== index))
  }

  const handleSaveAll = async () => {
    try {
      setIsSaving(true)
      await updateCompanions(localCompanions)
      onClose()
    } catch (error) {
      console.error("Save failed:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-100 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-zinc-200 dark:bg-zinc-900 border border-zinc-200/20 w-full max-w-4xl max-h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          div::-webkit-scrollbar { display: none }
          input[type=number]::-webkit-inner-spin-button, 
          input[type=number]::-webkit-outer-spin-button { 
            -webkit-appearance: none;
            margin: 0;
          }
          input[type=number] { -moz-appearance: textfield }
        `}</style>

        {/* Header */}
        <div className="px-10 py-7 border-b border-zinc-100/20 flex justify-between items-center bg-emerald-50/30 dark:bg-zinc-800">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-emerald-500/10 rounded-2xl">
              <Settings2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight"><Trans>连携程序管理</Trans></h2>
              <p className="text-foreground text-sm font-medium"><Trans>配置随游戏或程序自动启动的辅助工具</Trans></p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-zinc-100 rounded-full transition-colors group">
            <X className="w-6 h-6 text-zinc-400 group-hover:text-zinc-900" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-10 py-8 space-y-6 bg-white dark:bg-zinc-800" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4 text-zinc-400">
              <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
              <span className="font-bold tracking-widest text-sm uppercase"><Trans>加载配置中...</Trans></span>
            </div>
          ) : (
            <>
              {localCompanions.map((item, index) => (
                <div key={index} className={cn(
                  "group relative border-2 rounded-[2rem] p-8 transition-all duration-300",
                  item.isEnabled
                    ? "bg-zinc-200 dark:bg-zinc-700/30 border-zinc-100/20 hover:border-emerald-200 hover:bg-zinc-300 dark:hover:bg-zinc-600/70 hover:shadow-xl hover:shadow-emerald-500/5"
                    : "bg-zinc-100 dark:bg-zinc-700/30 border-zinc-50/20 opacity-60 grayscale-[0.5]"
                )}>

                  {/* 标题行 */}
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4 flex-1">
                      <button
                        onClick={() => handleRemove(index)}
                        className="w-10 h-10 shrink-0 bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl flex items-center justify-center transition-all active:scale-90"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <input
                        className="text-2xl font-black text-zinc-900 dark:text-zinc-200 bg-transparent outline-none border-b-2 border-transparent focus:border-emerald-500 transition-all flex-1 py-1"
                        value={item.name}
                        onChange={(e) => handleUpdateField(index, 'name', e.target.value)}
                        placeholder={t`程序名称`}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex flex-row bg-zinc-100/80 p-1.5 rounded-2xl border border-zinc-200/50">
                        <button
                          onClick={() => handleUpdateField(index, 'triggerMode', 'app')}
                          className={cn(
                            "px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap",
                            item.triggerMode === 'app' ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                          )}
                        >
                          <Trans>随程序</Trans>
                        </button>
                        <button
                          onClick={() => handleUpdateField(index, 'triggerMode', 'game')}
                          className={cn(
                            "px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap",
                            item.triggerMode === 'game' ? "bg-emerald-600 text-white shadow-md" : "text-zinc-500 hover:text-emerald-600"
                          )}
                        >
                          <Trans>随游戏</Trans>
                        </button>
                      </div>

                      <div className="hidden sm:block h-8 w-px bg-zinc-200 mx-1" />

                      {/* 窗口管理开关 */}
                      <label className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-2xl border transition-all cursor-pointer select-none",
                        item.isWindowManaged ? "bg-blue-50 border-blue-100 text-blue-700" : "bg-zinc-100 border-zinc-200 text-zinc-400"
                      )}>
                        <Layout className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
                          <Trans>窗口托管</Trans>
                        </span>
                        <input
                          type="checkbox"
                          checked={item.isWindowManaged}
                          onChange={(e) => handleUpdateField(index, 'isWindowManaged', e.target.checked)}
                          className="w-4 h-4 accent-blue-600 cursor-pointer"
                        />
                      </label>

                      {/* 启用开关 */}
                      <label className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all cursor-pointer select-none",
                        item.isEnabled ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-zinc-100 border-zinc-200 text-zinc-400"
                      )}>
                        <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
                          {item.isEnabled ? t`已启用` : t`已禁用`}
                        </span>
                        <input
                          type="checkbox"
                          checked={item.isEnabled}
                          onChange={(e) => handleUpdateField(index, 'isEnabled', e.target.checked)}
                          className="w-5 h-5 accent-emerald-600 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>

                  {/* 表单详情 */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-12 space-y-2">
                      <label className="text-zinc-400 font-bold text-[10px] uppercase ml-1 tracking-widest"><Trans>可执行文件路径</Trans></label>
                      <div className="relative group/path">
                        <input
                          readOnly
                          onClick={() => handlePickFile(index)}
                          className="w-full bg-white dark:bg-zinc-500 border border-zinc-200/20 rounded-2xl px-5 py-4 text-zinc-800 font-bold text-sm cursor-pointer hover:border-emerald-400 transition-all outline-none pr-32"
                          value={item.path}
                          placeholder={t`点击选择可执行文件...`}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 pointer-events-none transition-all group-hover/path:bg-emerald-600 group-hover/path:text-white">
                          <FolderOpen className="w-4 h-4" />
                          <Trans>浏览</Trans>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-9 space-y-2">
                      <label className="text-zinc-400 font-bold text-[10px] uppercase ml-1 tracking-widest"><Trans>启动参数</Trans></label>
                      <input
                        className="w-full dark:bg-zinc-500 border border-zinc-200/20 rounded-2xl px-5 py-4 text-zinc-800 text-sm font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 bg-white outline-none transition-all shadow-sm"
                        value={item.args}
                        onChange={(e) => handleUpdateField(index, 'args', e.target.value)}
                        placeholder="e.g. --windowed"
                      />
                    </div>

                    <div className="md:col-span-3 space-y-2">
                      <label className="text-zinc-400 font-bold text-[10px] uppercase ml-1 tracking-widest"><Trans>排序权重</Trans></label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          className="w-full dark:bg-zinc-500 border border-zinc-200/20 rounded-2xl px-5 py-4 text-zinc-800 text-sm font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 bg-white outline-none transition-all shadow-sm text-center appearance-none"
                          value={item.sortOrder}
                          onChange={(e) => handleUpdateField(index, 'sortOrder', parseInt(e.target.value) || 0)}
                        />
                        <div className="absolute right-2 flex flex-col gap-0.5">
                          <button
                            onClick={() => handleUpdateField(index, 'sortOrder', (item.sortOrder || 0) + 1)}
                            className="p-1 hover:text-emerald-500 text-zinc-300 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddNew}
                className="w-full py-12 border-2 border-dashed border-zinc-200/20 rounded-[2rem] text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50/50 hover:border-emerald-500 transition-all flex flex-col items-center justify-center gap-3 bg-zinc-50/30 dark:bg-zinc-700/30 dark:hover:bg-zinc-600"
              >
                <div className="w-14 h-14 bg-white dark:bg-zinc-900 border border-zinc-100/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-lg font-bold tracking-tight"><Trans>添加新的连携程序</Trans></span>
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-10 py-7 border-t border-zinc-100/20 bg-zinc-50/50 dark:bg-zinc-800 flex justify-end items-center gap-6">
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-bold transition-colors">
            <Trans>放弃修改</Trans>
          </button>
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-3 px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/30 active:scale-95 disabled:bg-zinc-300"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            <span className="text-lg"><Trans>保存连携配置</Trans></span>
          </button>
        </div>
      </div>
    </div>
  )
}
