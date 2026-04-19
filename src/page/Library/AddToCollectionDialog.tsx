import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FolderHeart, Check, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import useCollectionStore from '@/store/collectionStore'
import { toast } from 'sonner'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'

interface Props {
  gameId: string
  open: boolean
  onClose: () => void
}

export default function AddToCollectionDialog({ gameId, open, onClose }: Props) {
  const { collections, addGame, removeGame, createCollection } = useCollectionStore()
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  const toggle = async (collectionId: string, has: boolean) => {
    try {
      if (has) {
        await removeGame(collectionId, gameId)
      } else {
        await addGame(collectionId, gameId)
      }
    } catch {
      toast.error(t`操作失败`)
    }
  }

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return
    try {
      await createCollection(name)
      // 创建后自动加入
      const created = useCollectionStore.getState().collections.at(-1)
      if (created) await addGame(created.id, gameId)
      toast.success(t`已创建收藏夹并添加游戏`)
    } catch { toast.error(t`创建失败`) }
    setNewName('')
    setCreating(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 遮罩 */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* 面板 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <FolderHeart size={16} className="text-custom-500" />
                <span className="text-sm font-black text-zinc-800 dark:text-zinc-100">
                  <Trans>加入收藏夹</Trans>
                </span>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X size={14} className="text-zinc-400" />
              </button>
            </div>

            {/* 列表 */}
            <div className="max-h-64 overflow-y-auto py-2">
              {collections.length === 0 && (
                <p className="text-center text-xs text-zinc-400 py-6">
                  <Trans>还没有收藏夹，先新建一个吧</Trans>
                </p>
              )}
              {collections.map(col => {
                const has = col.gameIds.includes(gameId)
                return (
                  <button
                    key={col.id}
                    onClick={() => toggle(col.id, has)}
                    className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className={cn(
                      'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0',
                      has
                        ? 'bg-custom-500 border-custom-500'
                        : 'border-zinc-300 dark:border-zinc-600'
                    )}>
                      {has && <Check size={12} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className="flex-1 text-left text-sm font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                      {col.name}
                    </span>
                    <span className="text-xs text-zinc-300 font-mono">{col.gameIds.length}</span>
                  </button>
                )
              })}
            </div>

            {/* 新建 */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3">
              {creating ? (
                <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2">
                  <input
                    autoFocus
                    placeholder={t`新收藏夹名称...`}
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleCreate()
                      if (e.key === 'Escape') { setCreating(false); setNewName('') }
                    }}
                    className="flex-1 bg-transparent text-xs font-semibold outline-none text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400"
                  />
                  <button onClick={handleCreate}>
                    <Check size={13} className="text-emerald-500" />
                  </button>
                  <button onClick={() => { setCreating(false); setNewName('') }}>
                    <X size={13} className="text-zinc-400" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCreating(true)}
                  className="w-full flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-custom-500 transition-colors py-1"
                >
                  <Plus size={13} />
                  <Trans>新建收藏夹</Trans>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
