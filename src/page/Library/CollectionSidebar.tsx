import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FolderHeart, Plus, Trash2, Pencil, Check, X, Library, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import useCollectionStore, { Collection } from '@/store/collectionStore'
import { toast } from 'sonner'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'

interface Props {
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export default function CollectionSidebar({ selectedId, onSelect }: Props) {
  const { collections, createCollection, deleteCollection, renameCollection } = useCollectionStore()
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return
    try {
      await createCollection(name)
      toast.success(t`"${name}" 已创建`)
    } catch { toast.error(t`创建失败`) }
    setNewName('')
    setCreating(false)
  }

  const handleDelete = async (col: Collection, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteCollection(col.id)
      if (selectedId === col.id) onSelect(null)
    } catch { toast.error(t`删除失败`) }
  }

  const handleRename = async (id: string) => {
    const name = editName.trim()
    if (!name) { setEditingId(null); return }
    try { await renameCollection(id, name) } catch { toast.error(t`重命名失败`) }
    setEditingId(null)
  }

  const startEdit = (col: Collection, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(col.id)
    setEditName(col.name)
  }

  const handleSelect = (id: string | null) => {
    onSelect(id)
    setOpen(false)
  }

  const activeCollection = collections.find(c => c.id === selectedId)

  return (
    <>
      {/* ── 触发标签 ─────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'fixed right-0 top-1/2 -translate-y-1/2 z-30',
          'flex flex-col items-center justify-center gap-2',
          'w-9 py-5 rounded-l-2xl',
          'transition-all duration-300 group',
          'border border-r-0',
          selectedId
            ? 'bg-custom-500/10 dark:bg-custom-500/15 border-custom-400/60 dark:border-custom-500/40 shadow-[0_0_20px_rgba(0,0,0,0.1)] hover:w-11 hover:bg-custom-500/15'
            : 'bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border-zinc-200/80 dark:border-zinc-700/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_4px_16px_rgba(0,0,0,0.08)] hover:w-11 hover:bg-white/90 dark:hover:bg-zinc-800/90'
        )}
        title={t`收藏夹`}
      >
        <FolderHeart
          size={15}
          className={cn(
            'transition-colors duration-200',
            selectedId ? 'text-custom-500' : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
          )}
        />
        <span
          className={cn(
            'text-[9px] font-black uppercase tracking-[0.2em] leading-none',
            '[writing-mode:vertical-rl] [text-orientation:mixed]',
            'transition-colors duration-200',
            selectedId ? 'text-custom-500/80' : 'text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-400'
          )}
        >
          {selectedId ? (activeCollection?.name?.slice(0, 6) ?? 'COL') : 'FOLDERS'}
        </span>
        {selectedId && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-1.5 h-1.5 rounded-full bg-custom-500" />
        )}
      </button>

      {/* ── 遮罩 ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── 浮动卡片 ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 16, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 440, damping: 38 }}
            className={cn(
              'fixed right-4 z-50',
              'top-1/2 -translate-y-1/2',
              'w-56 max-h-[68vh]',
              'flex flex-col',
              'rounded-2xl overflow-hidden',
              'bg-white/94 dark:bg-zinc-900/94 backdrop-blur-2xl',
              'shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_12px_48px_rgba(0,0,0,0.16),0_2px_8px_rgba(0,0,0,0.06)]',
              'dark:shadow-[0_0_0_1px_rgba(255,255,255,0.07),0_12px_48px_rgba(0,0,0,0.55)]',
            )}
          >
            {/* 顶部光泽线 */}
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent dark:via-white/15 pointer-events-none z-10" />

            {/* ── 头部 ── */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-custom-400/20 to-custom-600/20 dark:from-custom-500/25 dark:to-custom-700/25 flex items-center justify-center ring-1 ring-custom-400/20">
                  <FolderHeart size={14} className="text-custom-500" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-700 dark:text-zinc-200 leading-none">
                    <Trans>收藏夹</Trans>
                  </p>
                  <p className="text-[9px] text-zinc-400 dark:text-zinc-600 font-medium mt-0.5 leading-none">
                    {collections.length} <Trans>个</Trans>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setCreating(v => !v)}
                  className={cn(
                    'w-6 h-6 rounded-lg flex items-center justify-center transition-all',
                    creating
                      ? 'bg-custom-500/15 text-custom-500 rotate-45'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                  )}
                >
                  <Plus size={13} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-600"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* ── 新建输入框 ── */}
            <AnimatePresence>
              {creating && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  className="overflow-hidden shrink-0 px-3 pb-2"
                >
                  <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl px-3 py-2 border border-custom-300/50 dark:border-custom-700/40 ring-1 ring-custom-400/15 shadow-inner">
                    <input
                      autoFocus
                      placeholder={t`新收藏夹名称...`}
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleCreate()
                        if (e.key === 'Escape') { setCreating(false); setNewName('') }
                      }}
                      className="flex-1 min-w-0 bg-transparent text-xs font-semibold outline-none text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400"
                    />
                    <button onClick={handleCreate} className="shrink-0 p-0.5 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors">
                      <Check size={12} className="text-emerald-500" />
                    </button>
                    <button onClick={() => { setCreating(false); setNewName('') }} className="shrink-0 p-0.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                      <X size={12} className="text-zinc-400" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── 分割线 ── */}
            <div className="mx-4 mb-1.5 h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-zinc-700/60 shrink-0" />

            {/* ── 全库入口 ── */}
            <div className="px-2.5 pb-1 shrink-0">
              <button
                onClick={() => handleSelect(null)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left',
                  selectedId === null
                    ? 'bg-custom-500/10 text-custom-600 dark:text-custom-400 shadow-sm'
                    : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-700 dark:hover:text-zinc-300'
                )}
              >
                <Library size={13} className="shrink-0 opacity-80" />
                <span className="flex-1"><Trans>全部游戏</Trans></span>
                {selectedId === null && <div className="w-1 h-1 rounded-full bg-custom-500" />}
              </button>
            </div>

            {/* ── 收藏夹列表 ── */}
            <div className="flex-1 overflow-y-auto px-2.5 pb-2.5 min-h-0 space-y-0.5">
              <AnimatePresence initial={false}>
                {collections.map((col, i) => (
                  <motion.div
                    key={col.id}
                    initial={{ opacity: 0, y: -3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.025 }}
                  >
                    {editingId === col.id ? (
                      <div className="flex items-center gap-1.5 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-custom-300/30 dark:border-custom-700/30">
                        <input
                          autoFocus
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleRename(col.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          className="flex-1 min-w-0 bg-transparent text-xs font-semibold outline-none text-zinc-700 dark:text-zinc-200"
                        />
                        <button onClick={() => handleRename(col.id)} className="p-0.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/30">
                          <Check size={11} className="text-emerald-500" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700">
                          <X size={11} className="text-zinc-400" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSelect(col.id)}
                        className={cn(
                          'group/item w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left',
                          selectedId === col.id
                            ? 'bg-custom-500/10 text-custom-600 dark:text-custom-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]'
                            : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-700 dark:hover:text-zinc-300'
                        )}
                      >
                        <FolderHeart size={13} className="shrink-0 opacity-75" />
                        <span className="flex-1 truncate">{col.name}</span>

                        {/* 数量 badge，hover 时变为操作按钮 */}
                        <span className={cn(
                          'text-[10px] font-mono px-1.5 py-0.5 rounded-md transition-all group-hover/item:hidden',
                          selectedId === col.id
                            ? 'bg-custom-500/15 text-custom-500'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600'
                        )}>
                          {col.gameIds.length}
                        </span>
                        <span className="hidden group-hover/item:flex items-center gap-0.5 shrink-0">
                          <span onClick={e => startEdit(col, e)} className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                            <Pencil size={10} className="text-zinc-400" />
                          </span>
                          <span onClick={e => handleDelete(col, e)} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                            <Trash2 size={10} className="text-red-400" />
                          </span>
                        </span>
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {collections.length === 0 && !creating && (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <div className="w-11 h-11 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                    <Sparkles size={16} className="text-zinc-300 dark:text-zinc-600" />
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-semibold"><Trans>还没有收藏夹</Trans></p>
                    <p className="text-[10px] text-zinc-300 dark:text-zinc-700 mt-0.5"><Trans>点击 + 创建第一个</Trans></p>
                  </div>
                </div>
              )}
            </div>

            {/* ── 当前筛选状态条 ── */}
            <AnimatePresence>
              {selectedId && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="shrink-0 overflow-hidden"
                >
                  <div className="mx-3 mb-3 px-3 py-2 rounded-xl bg-gradient-to-r from-custom-500/8 to-custom-400/5 dark:from-custom-500/12 dark:to-custom-400/8 border border-custom-400/20 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-custom-500 shrink-0 animate-pulse" />
                    <span className="flex-1 text-[11px] font-semibold text-custom-600 dark:text-custom-400 truncate">
                      {activeCollection?.name}
                    </span>
                    <button
                      onClick={() => { onSelect(null); setOpen(false) }}
                      className="shrink-0 w-4 h-4 rounded-full bg-zinc-200/60 dark:bg-zinc-700/60 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                      <X size={9} className="text-zinc-500 hover:text-red-500" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 底部光泽线 */}
            <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-black/6 to-transparent dark:via-white/5 pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
