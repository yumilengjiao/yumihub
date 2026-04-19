import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FolderHeart, Plus, Trash2, Pencil, Check, X, ChevronRight, Library } from 'lucide-react'
import { cn } from '@/lib/utils'
import useCollectionStore, { Collection } from '@/store/collectionStore'
import { toast } from 'sonner'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'

interface Props {
  selectedId: string | null          // null = 全库
  onSelect: (id: string | null) => void
}

export default function CollectionSidebar({ selectedId, onSelect }: Props) {
  const { collections, createCollection, deleteCollection, renameCollection } = useCollectionStore()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return
    try {
      await createCollection(name)
      toast.success(t`收藏夹 "${name}" 已创建`)
    } catch { toast.error(t`创建失败`) }
    setNewName('')
    setCreating(false)
  }

  const handleDelete = async (col: Collection, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteCollection(col.id)
      if (selectedId === col.id) onSelect(null)
      toast.success(t`已删除 "${col.name}"`)
    } catch { toast.error(t`删除失败`) }
  }

  const handleRename = async (id: string) => {
    const name = editName.trim()
    if (!name) { setEditingId(null); return }
    try {
      await renameCollection(id, name)
    } catch { toast.error(t`重命名失败`) }
    setEditingId(null)
  }

  const startEdit = (col: Collection, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(col.id)
    setEditName(col.name)
  }

  return (
    <div className="flex flex-col h-full w-52 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white/30 dark:bg-zinc-900/40 backdrop-blur-sm">
      {/* 标题 */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <span className="text-xs font-black uppercase tracking-widest text-zinc-400">
          <Trans>收藏夹</Trans>
        </span>
        <button
          onClick={() => setCreating(true)}
          className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title={t`新建收藏夹`}
        >
          <Plus size={14} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200" />
        </button>
      </div>

      {/* 全库入口 */}
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'flex items-center gap-2.5 px-4 py-2.5 mx-2 rounded-xl text-sm font-semibold transition-colors text-left',
          selectedId === null
            ? 'bg-custom-500/10 text-custom-600 dark:text-custom-400'
            : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200'
        )}
      >
        <Library size={14} />
        <span><Trans>全部游戏</Trans></span>
      </button>

      {/* 分隔线 */}
      <div className="mx-4 my-2 h-px bg-zinc-200 dark:bg-zinc-800" />

      {/* 收藏夹列表 */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        <AnimatePresence initial={false}>
          {collections.map(col => (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
            >
              {editingId === col.id ? (
                <div className="flex items-center gap-1 px-2 py-1.5">
                  <input
                    autoFocus
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRename(col.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    className="flex-1 min-w-0 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-2 py-1 text-xs font-semibold outline-none border border-custom-400"
                  />
                  <button onClick={() => handleRename(col.id)} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <Check size={12} className="text-emerald-500" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <X size={12} className="text-zinc-400" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onSelect(col.id)}
                  className={cn(
                    'group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left',
                    selectedId === col.id
                      ? 'bg-custom-500/10 text-custom-600 dark:text-custom-400'
                      : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200'
                  )}
                >
                  <FolderHeart size={14} className="shrink-0" />
                  <span className="flex-1 truncate">{col.name}</span>
                  <span className="text-[10px] text-zinc-300 dark:text-zinc-600 font-mono shrink-0">
                    {col.gameIds.length}
                  </span>
                  {/* hover 操作按钮 */}
                  <span className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                    <span
                      onClick={e => startEdit(col, e)}
                      className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    >
                      <Pencil size={11} className="text-zinc-400" />
                    </span>
                    <span
                      onClick={e => handleDelete(col, e)}
                      className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                      <Trash2 size={11} className="text-red-400" />
                    </span>
                  </span>
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {collections.length === 0 && !creating && (
          <div className="px-3 py-6 text-center text-xs text-zinc-300 dark:text-zinc-700 font-semibold">
            <Trans>暂无收藏夹</Trans>
            <br />
            <Trans>点击 + 新建一个</Trans>
          </div>
        )}
      </div>

      {/* 新建输入框 */}
      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-2 pb-3 overflow-hidden"
          >
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-2 py-1.5 border border-custom-400/50">
              <FolderHeart size={13} className="text-custom-400 shrink-0" />
              <input
                autoFocus
                placeholder={t`收藏夹名称...`}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreate()
                  if (e.key === 'Escape') { setCreating(false); setNewName('') }
                }}
                className="flex-1 bg-transparent text-xs font-semibold outline-none text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400"
              />
              <button onClick={handleCreate} className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700">
                <Check size={12} className="text-emerald-500" />
              </button>
              <button onClick={() => { setCreating(false); setNewName('') }} className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700">
                <X size={12} className="text-zinc-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
