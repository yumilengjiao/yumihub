import { recognizeGame } from '@/api/uniform'
import { requestBangumiById } from '@/api/bangumiApi'
import { requestVNDBById } from '@/api/vndbApi'
import React, { useState, useRef, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from "@/components/ui/input"
import { Loader2, Search, X, Check, FileText, WifiOff, RefreshCw } from 'lucide-react'
import { cn, getParentDir } from "@/lib/utils"
import { toast } from "sonner"
import { PendingGameInfo } from '@/store/pendingGamesStore'
import { Datum, GameMeta, VNDBResult } from '@/types/game'
import { invoke } from '@tauri-apps/api/core'
import useGameStore from '@/store/gameStore'
import useConfigStore from '@/store/configStore'
import { SideBarMode } from "@/types/config"
import { nanoid } from 'nanoid'
import { Cmds } from '@/lib/enum'
import { Trans } from '@lingui/react/macro'
import { t } from '@lingui/core/macro'

// 导入你定义的转换工具
import { transBangumiToGameMeta, transVNDBToGameMeta } from '@/lib/resolve'

interface BigPendingCardProps {
  absPath: string
  onCancel: () => void
}

const BigPendingCard: React.FC<BigPendingCardProps> = ({ absPath, onCancel }) => {
  const [isFetching, setIsFetching] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [resultData, setResultData] = useState<PendingGameInfo | null>(null)
  const [activeSource, setActiveSource] = useState<'vndb' | 'bangumi' | 'ymgal'>('bangumi')
  const [searchId, setSearchId] = useState('')

  const { config } = useConfigStore()
  const { addGameMeta } = useGameStore()

  const sidebarMode = useConfigStore((state) => state.config.interface.sidebarMode)
  const xOffset = sidebarMode === SideBarMode.NormalFixed ? 75 : 0

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isRequestingRef = useRef(false)

  const extractedName = useMemo(() => {
    const parts = absPath.split(/[\\/]/).filter(Boolean)
    return parts.length >= 1 ? parts[parts.length - 1].replace(/\.exe$/i, '') : "Unknown"
  }, [absPath])

  // --- 数据显示映射逻辑 ---
  const displayInfo = useMemo(() => {
    if (!resultData) return null

    const partial: Omit<GameMeta, 'cover' | 'background' | 'description' | 'developer'> = {
      id: '',
      name: (activeSource === 'bangumi' ? (resultData.bangumi?.name_cn || resultData.bangumi?.name) : resultData.vndb?.alttitle) || extractedName,
      absPath: absPath,
      isPassed: false,
      isDisplayed: false,
      playTime: 0,
    }

    try {
      if (activeSource === 'bangumi' && resultData.bangumi) {
        const bData = Array.isArray((resultData.bangumi as any).data)
          ? (resultData.bangumi as any).data[0]
          : resultData.bangumi

        if (!bData) return null
        const meta = transBangumiToGameMeta(partial, bData as Datum)
        return {
          title: meta.name,
          desc: meta.description,
          developer: meta.developer,
          cover: meta.cover,
          background: meta.background
        }
      }

      if (activeSource === 'vndb' && resultData.vndb) {
        const vData = (resultData.vndb as any).results ? (resultData.vndb as any).results[0] : resultData.vndb
        if (!vData) return null

        const meta = transVNDBToGameMeta(partial, vData as VNDBResult)
        return {
          title: meta.name,
          desc: meta.description,
          developer: meta.developer,
          cover: meta.cover,
          background: meta.background
        }
      }

      // Ymgal 逻辑保持一致...
    } catch (e) {
      console.error("解析预览数据失败:", e)
    }
    return null
  }, [resultData, activeSource, extractedName, absPath])

    // VNDB 映射
    if (activeSource === 'vndb' && resultData.vndb?.results?.[0]) {
      const v = resultData.vndb.results[0] as VNDBResult;
      return {
        id: v.id,
        title: v.title || v.alttitle, // 修复 Property 'name' 不存在的问题
        desc: v.description || "暂无描述",
        cover: v.image?.url || ""
      };
    }

    // Ymgal 映射
    if (activeSource === 'ymgal' && resultData.ymgal?.data?.result?.[0]) {
      const y = resultData.ymgal.data.result[0] as YmResult;
      return {
        id: y.id?.toString(),
        title: y.chineseName || y.name,
        desc: "月幕数据源暂无详细介绍",
        cover: y.mainImg || ""
      };
    }

    return null;
  }, [resultData, activeSource]);

  // --- ID 搜索逻辑更新 ---
  const handleIdSearch = async () => {
    if (!searchId) return
    setIsUpdating(true)
    try {
      if (activeSource === 'bangumi') {
        const res = await requestBangumiById(searchId, config.auth.bangumiToken)
        // 注意：这里返回的 res 已经是 Datum 类型
        if (res) setResultData(prev => prev ? ({ ...prev, bangumi: res as Datum }) : { absPath, bangumi: res as Datum, vndb: null, ymgal: null })
      } else if (activeSource === 'vndb') {
        const res = await requestVNDBById(searchId)
        // VNDB 按 ID 查返回的是单条 VNDBResult
        if (res) setResultData(prev => prev ? ({ ...prev, vndb: res as any }) : { absPath, bangumi: null, vndb: res as any, ymgal: null })
      }
      toast.success(t`数据已同步`)
    } catch (err) {
      toast.error(t`查询失败，请检查 ID 是否正确`)
    } finally {
      setIsUpdating(false)
      setSearchId('')
    }
  }

  const handleFetchMetadata = async () => {
    setIsFetching(true)
    isRequestingRef.current = true
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      if (isRequestingRef.current) {
        setIsFetching(false)
        isRequestingRef.current = false
        toast.error(t`匹配超时`, { icon: <WifiOff className="text-red-500" size={18} /> })
      }
    }, 60000)

    try {
      const res = await recognizeGame(absPath)
      if (isRequestingRef.current) {
        setResultData(res)
        setIsFetching(false)
        isRequestingRef.current = false
        if (timerRef.current) clearTimeout(timerRef.current)

        // --- 核心逻辑：自动切换到有数据的源 ---
        if (res.bangumi) {
          setActiveSource('bangumi')
        } else if (res.vndb) {
          setActiveSource('vndb')
        } else if (res.ymgal) {
          setActiveSource('ymgal')
        }
      }
    } catch (err) {
      setIsFetching(false)
      isRequestingRef.current = false
      toast.error(t`网络请求失败`)
    }
  };

  const handleFinalConfirm = async (useAutoData: boolean) => {
    const loadingId = toast.loading(t`正在导入游戏...`)
    try {
      let dir = getParentDir(absPath)
      let size = await invoke<number>(Cmds.GET_GAME_SIZE, { dir: dir })

      const finalGame: GameMeta = {
        id: nanoid(),
        absPath: absPath,
        isPassed: false,
        isDisplayed: false,
        name: useAutoData ? (displayInfo?.title || extractedName) : extractedName,
        cover: useAutoData ? (displayInfo?.cover || "") : "",
        description: useAutoData ? (displayInfo?.desc || "") : "",
        developer: useAutoData ? (displayInfo?.developer || "") : "",
        background: useAutoData ? (displayInfo?.background || "") : "",
        playTime: 0,
        length: 0,
        size: size
      }

      await invoke("add_new_game", { game: finalGame })
      addGameMeta(finalGame)

      toast.success(t`导入成功`, { id: loadingId })
      onCancel()
    } catch (err) {
      toast.error(t`导入失败,id: `, { id: loadingId })
    }
  }

  const handleCancelAll = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    isRequestingRef.current = false
    setIsFetching(false)
    onCancel()
  }

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  return (
    <motion.div
      initial={false}
      animate={{ x: `calc(-50% + ${xOffset}px)` }}
      transition={{ type: "spring", stiffness: 400, damping: 40 }}
      className="fixed top-12 left-1/2 z-100 w-[95%] max-w-6xl pointer-events-none"
    >
      <div className="pointer-events-auto bg-zinc-100 dark:bg-zinc-800 shadow-2xl rounded-[32px] overflow-hidden border border-zinc-200/50 dark:border-zinc-700/50 flex flex-col">

        {/* --- 状态一：顶部栏 --- */}
        <div className="h-20 px-8 flex items-center justify-between gap-10">
          <div className="flex items-center gap-5 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-zinc-600 flex items-center justify-center text-white shrink-0 shadow-lg">
              <FileText size={28} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-black text-zinc-900 leading-none tracking-tighter uppercase truncate">
                {displayInfo?.title || extractedName}
              </h2>
              <p className="text-zinc-400 font-mono text-[10px] truncate mt-1.5 font-bold opacity-60">
                {absPath}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <AnimatePresence mode="wait">
              {isFetching ? (
                <motion.div key="loading" className="flex items-center gap-3 bg-zinc-50 border border-zinc-100 py-2 px-5 rounded-xl">
                  <Loader2 className="animate-spin text-zinc-900" size={20} strokeWidth={4} />
                  <span className="font-black text-xs text-zinc-900 tracking-widest uppercase">Matching...</span>
                  <Button variant="ghost" size="icon" onClick={handleCancelAll} className="w-8 h-8 rounded-full"><X size={16} /></Button>
                </motion.div>
              ) : !resultData ? (
                <motion.div key="btns" className="flex items-center gap-2">
                  <Button variant="ghost" onClick={handleCancelAll} className="h-12 px-5 text-sm font-black text-zinc-400">取消</Button>
                  <Button onClick={handleFetchMetadata} variant="outline" className="h-12 px-7 border-2 border-zinc-100 rounded-xl font-black text-sm gap-2">
                    <Search size={18} strokeWidth={3} /> 匹配元数据
                  </Button>
                  {/* 重加：状态一直接确认按钮 */}
                  <Button onClick={() => handleFinalConfirm(false)} className="h-12 px-8 bg-zinc-900 text-white rounded-xl font-black text-sm gap-2 shadow-lg">
                    <Check size={18} strokeWidth={3} /> 直接确认
                  </Button>
                </motion.div>
              ) : (
                <Button variant="ghost" size="icon" onClick={handleCancelAll} className="w-12 h-12 rounded-full hover:bg-zinc-100"><X size={24} className="text-zinc-400" /></Button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* --- 状态二：展开展示区 --- */}
        <AnimatePresence>
          {resultData && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-8 pb-10 pt-4 border-t-2 border-zinc-50">
              <div className="flex gap-10">
                <div className="flex flex-col gap-4 shrink-0">
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-64 h-80 rounded-[32px] overflow-hidden shadow-2xl border-4 border-white bg-zinc-100">
                    {displayInfo?.cover ? (
                      <img src={displayInfo.cover} className="w-full h-full object-cover" alt="cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-300 font-black">NO COVER</div>
                    )}
                  </motion.div>

                  <div className="flex gap-2 p-2 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <Input
                      placeholder={`${activeSource.toUpperCase()} ID...`}
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleIdSearch()}
                      className="h-9 bg-white border-none text-xs font-bold focus-visible:ring-0"
                    />
                    <Button size="icon" onClick={handleIdSearch} disabled={isUpdating} className="h-9 w-9 shrink-0 bg-zinc-900">
                      {isUpdating ? <Loader2 className="animate-spin text-white" size={14} /> : <RefreshCw size={14} className="text-white" />}
                    </Button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col pt-2">
                  <div className="flex justify-between items-start mb-5">
                    <h3 className="text-4xl font-black text-zinc-900 leading-none tracking-tighter uppercase italic flex-1 pr-4">
                      {displayInfo?.title || "未找到匹配数据"}
                    </h3>
                    <div className="flex bg-zinc-200 dark:bg-zinc-700 p-1.5 rounded-xl shrink-0 border border-zinc-300/50 dark:border-zinc-600">
                      {(['bangumi', 'vndb'] as const).map(src => (
                        <button
                          key={src}
                          onClick={() => { setActiveSource(src); setSearchId('') }}
                          className={cn(
                            "px-4 py-2 text-[10px] font-black rounded-lg uppercase transition-all",
                            activeSource === src
                              ? "bg-white dark:bg-zinc-200 shadow-md text-zinc-900"
                              : "text-zinc-400 hover:text-zinc-600"
                          )}
                        >
                          {src}
                        </button>
                      ))}
                    </div>
                  </div>

                  <ScrollArea className="flex-1 bg-zinc-50/50 rounded-[24px] p-6 mb-8 border border-zinc-100/50 h-48">
                    <p className="text-base leading-relaxed text-zinc-500 font-bold italic">
                      {displayInfo?.desc}
                    </p>
                  </ScrollArea>

                  <div className="flex justify-end gap-3">
                    <Button onClick={() => handleFinalConfirm(true)} className="h-20 px-14 bg-green-500 hover:bg-green-600 text-white rounded-[24px] font-black text-3xl gap-4 shadow-2xl transition-all active:scale-95">
                      <Check size={40} strokeWidth={6} /> 确认添加
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default BigPendingCard
