import { useRef, useState, useMemo, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { motion, AnimatePresence } from 'framer-motion'
import { Cmds } from '@/lib/enum'
import useConfigStore from '@/store/configStore'
import { useLogStore } from '@/store/logStore'
import { usePageBackground } from '@/hooks/usePageBackground'
import { Trans } from '@lingui/react/macro'
import { t } from '@lingui/core/macro'
import { FolderOpen, Trash2, ChevronsDown, Terminal, Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LogLevel } from '@/store/logStore'

const LEVEL_META: Record<LogLevel, { label: string; dot: string; badge: string }> = {
  trace: { label: 'TRACE', dot: 'bg-zinc-400', badge: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400' },
  debug: { label: 'DEBUG', dot: 'bg-blue-400', badge: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  info: { label: 'INFO', dot: 'bg-emerald-400', badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  warn: { label: 'WARN', dot: 'bg-amber-400', badge: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  error: { label: 'ERROR', dot: 'bg-red-500', badge: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' },
}

const LEVEL_ACCENT: Record<LogLevel, string> = {
  trace: '', debug: '', info: '',
  warn: 'border-l-2 border-amber-400/50 bg-amber-500/3',
  error: 'border-l-2 border-red-500/60 bg-red-500/5',
}

export default function LogPage() {
  const { logs, clear } = useLogStore()
  const [filter, setFilter] = useState<LogLevel | 'all'>('all')
  const [search, setSearch] = useState('')
  const [logDir, setLogDir] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const [showSearch, setShowSearch] = useState(false)
  const { config } = useConfigStore()
  const bgStyle = usePageBackground()
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    invoke<string>(Cmds.GET_LOG_DIR).then(setLogDir).catch(() => { })
  }, [])

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs, autoScroll])

  const displayed = useMemo(() => {
    let result = filter === 'all' ? logs : logs.filter(l => l.level === filter)
    if (search.trim()) {
      const kw = search.trim().toLowerCase()
      result = result.filter(l => l.message.toLowerCase().includes(kw))
    }
    return result
  }, [logs, filter, search])

  const counts = useMemo(() =>
    logs.reduce((acc, l) => ({ ...acc, [l.level]: (acc[l.level] ?? 0) + 1 }), {} as Record<string, number>),
    [logs]
  )

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 60)
  }

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-zinc-100 dark:bg-zinc-900/95">
      {bgStyle && <div className="absolute inset-0 z-0 pointer-events-none" style={bgStyle} />}
      <div className="absolute inset-0 z-0 pointer-events-none bg-white/20 dark:bg-black/40" />

      <div className="relative z-10 flex flex-col h-full pt-14">

        {/* 页面标题 */}
        <div className="px-24 pr-16 pt-8 pb-4 shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1 h-6 rounded-full bg-custom-500" />
            <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Log</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                <Trans>实时</Trans>
              </span>
            </div>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium pl-4">
            <Trans>本次运行的所有日志，最多保留 2000 条</Trans>
          </p>
        </div>

        {/* 持久化提示 */}
        {!config.system.persistLog && (
          <div className="ml-26 mr-16 mb-3 shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-500/8 dark:bg-amber-500/6 border border-amber-400/25">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              <Trans>日志持久化未开启，重启后记录将清空。前往</Trans>
              <span className="font-black"> 设置 → 系统 </span>
              <Trans>可开启写入文件。</Trans>
            </p>
          </div>
        )}

        {/* 日志列表 */}
        <div className="flex-1 min-h-0 ml-26 mr-16 mb-4">
          <div className="h-full bg-white/80 dark:bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-200/60 dark:border-zinc-700/40 shadow-sm overflow-hidden flex flex-col">

            <AnimatePresence>
              {showSearch && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden shrink-0">
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-700/50">
                    <Filter size={13} className="text-zinc-400 shrink-0" />
                    <input
                      autoFocus
                      placeholder={t`搜索日志内容...`}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Escape' && setShowSearch(false)}
                      className="flex-1 bg-transparent text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 outline-none placeholder:text-zinc-400"
                    />
                    {search && <button onClick={() => setSearch('')}><X size={13} className="text-zinc-400 hover:text-zinc-600" /></button>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto min-h-0 py-2">
              {displayed.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 select-none">
                  <div className="w-14 h-14 rounded-3xl bg-zinc-100 dark:bg-zinc-700/50 flex items-center justify-center">
                    <Terminal size={22} className="text-zinc-300 dark:text-zinc-600" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-300 dark:text-zinc-600">
                    {search ? t`无匹配日志` : t`等待日志输出...`}
                  </p>
                </div>
              ) : (
                <div className="px-1">
                  {displayed.map(log => {
                    const meta = LEVEL_META[log.level]
                    return (
                      <div
                        key={log.id}
                        className={cn(
                          'flex items-start gap-3 px-3 py-1.5 mx-1 rounded-lg',
                          'hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-colors group',
                          LEVEL_ACCENT[log.level]
                        )}
                      >
                        <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-600 shrink-0 pt-px tabular-nums w-16">{log.time}</span>
                        <span className={cn('text-[10px] font-black mx-4 px-1.5 py-0.5 rounded-md shrink-0 uppercase w-12 text-center', meta.badge)}>{meta.label}</span>
                        <span className={cn(
                          'flex-1 text-xs font-mono leading-relaxed break-all',
                          log.level === 'error' ? 'text-red-700 dark:text-red-300 font-semibold' :
                            log.level === 'warn' ? 'text-amber-700 dark:text-amber-300' :
                              'text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-800 dark:group-hover:text-zinc-100 transition-colors'
                        )}>
                          {log.message}
                        </span>
                      </div>
                    )
                  })}
                  <div ref={bottomRef} className="h-2" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 底部工具栏 */}
        <div className="shrink-0 ml-26 mr-16 mb-6">
          <div className="flex items-center gap-2 px-4 py-3 bg-white/80 dark:bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-200/60 dark:border-zinc-700/40 shadow-sm">
            <div className="flex items-center gap-1 flex-1">
              <button
                onClick={() => setFilter('all')}
                className={cn('px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all',
                  filter === 'all' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50')}
              >
                ALL <span className="ml-1 opacity-60 tabular-nums">{logs.length}</span>
              </button>
              {(Object.keys(LEVEL_META) as LogLevel[]).map(lv => {
                const count = counts[lv] ?? 0
                if (count === 0 && filter !== lv) return null
                const meta = LEVEL_META[lv]
                return (
                  <button key={lv} onClick={() => setFilter(filter === lv ? 'all' : lv)}
                    className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all',
                      filter === lv ? cn(meta.badge, 'shadow-sm') : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50')}
                  >
                    <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', meta.dot)} />
                    {meta.label}
                    <span className="tabular-nums opacity-70">{count}</span>
                  </button>
                )
              })}
            </div>

            <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 shrink-0" />

            <button onClick={() => { setShowSearch(v => !v); if (showSearch) setSearch('') }}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all',
                showSearch ? 'bg-custom-500/10 text-custom-600 dark:text-custom-400' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50')}>
              <Filter size={13} /><Trans>搜索</Trans>
            </button>

            <button onClick={() => { setAutoScroll(v => !v); if (!autoScroll) bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all',
                autoScroll ? 'bg-custom-500/10 text-custom-600 dark:text-custom-400' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50')}>
              <ChevronsDown size={13} className={autoScroll ? 'animate-bounce' : ''} /><Trans>自动滚动</Trans>
            </button>

            {config.system.persistLog && logDir && (
              <button onClick={() => open(logDir)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-all">
                <FolderOpen size={13} /><Trans>日志目录</Trans>
              </button>
            )}

            <button onClick={clear}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
              <Trash2 size={13} /><Trans>清空</Trans>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
