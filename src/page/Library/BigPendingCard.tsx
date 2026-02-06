import { recognizeGame } from '@/api/uniform';
import { requestBangumiById } from '@/api/bangumiApi';
import { requestVNDBById } from '@/api/vndbApi';
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from "@/components/ui/input";
import { Loader2, Search, X, Check, FileText, WifiOff, RefreshCw } from 'lucide-react';
import { cn, getParentDir } from "@/lib/utils";
import { toast } from "sonner";
import { PendingGameInfo } from '@/store/pendingGamesStore';
import { BangumiResponse, GameMeta, VNDBResult, YmResult } from '@/types/game';
import { invoke } from '@tauri-apps/api/core';
import useGameStore from '@/store/gameStore';
import useConfigStore from '@/store/configStore';
import { SideBarMode } from "@/types/config";
import { nanoid } from 'nanoid';
import { Cmds } from '@/lib/enum';
import { Trans } from '@lingui/react/macro';
import { t } from '@lingui/core/macro';

interface BigPendingCardProps {
  absPath: string;
  onCancel: () => void;
}

const BigPendingCard: React.FC<BigPendingCardProps> = ({ absPath, onCancel }) => {
  const [isFetching, setIsFetching] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [resultData, setResultData] = useState<PendingGameInfo | null>(null);
  const [activeSource, setActiveSource] = useState<'vndb' | 'bangumi' | 'ymgal'>('bangumi');
  const [searchId, setSearchId] = useState('');

  const { addGameMeta } = useGameStore();

  //侧边栏适配变量
  const sidebarMode = useConfigStore((state) => state.config.interface.sidebarMode);
  const xOffset = sidebarMode === SideBarMode.NormalFixed ? 75 : 0;

  // --- 核心定时器与请求引用 (接回你之前的逻辑) ---
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isRequestingRef = useRef(false);

  const extractedName = useMemo(() => {
    const parts = absPath.split(/[\\/]/).filter(Boolean);
    return parts.length >= 2 ? parts[parts.length - 2] : parts[0] || "Unknown";
  }, [absPath]);

  // --- 数据映射逻辑 ---
  const displayInfo = useMemo(() => {
    if (!resultData) return null;
    if (activeSource === 'bangumi' && resultData.bangumi) {
      const d = (resultData.bangumi as BangumiResponse).data[0];
      if (!d) return null;
      return {
        id: d.id?.toString(),
        title: d.name_cn || d.name,
        desc: d.summary || t`暂无描述`,
        developer: d.infobox?.find(info => info.key === "开发")?.value,
        cover: d.images?.large || d.image || "",
        background: d.images?.large || d.image || ""
      };
    }
    if (activeSource === 'vndb' && resultData.vndb?.results?.[0]) {
      const v = resultData.vndb.results[0] as VNDBResult;
      return {
        id: v.id,
        title: v.title || v.alttitle,
        desc: v.description || t`暂无描述`,
        developer: v.developers?.[0]?.name,
        cover: v.image?.url || "",
        background: v.screenshots?.[0]?.url
      };
    }
    if (activeSource === 'ymgal' && resultData.ymgal?.data?.result?.[0]) {
      const y = resultData.ymgal.data.result[0] as YmResult;
      return {
        id: y.id?.toString(),
        title: y.chineseName || y.name,
        desc: t`该数据源暂无详细介绍`,
        developer: y.publisher,
        cover: y.mainImg || "",
        background: y.mainImg || ""
      };
    }
    return null;
  }, [resultData, activeSource]);

  // --- 搜索 ID 逻辑 ---
  const handleIdSearch = async () => {
    if (!searchId) return;
    setIsUpdating(true);
    try {
      if (activeSource === 'bangumi') {
        const res = await requestBangumiById(searchId);
        if (res) setResultData(prev => prev ? ({ ...prev, bangumi: res as any }) : null);
      } else if (activeSource === 'vndb') {
        const res = await requestVNDBById(searchId);
        if (res && res.results?.length > 0) setResultData(prev => prev ? ({ ...prev, vndb: res }) : null);
      }
      toast.success(t`数据已同步`);
    } catch (err) {
      toast.error(t`查询失败`);
    } finally {
      setIsUpdating(false);
      setSearchId('');
    }
  };

  // --- 核心：带超时的元数据请求 (完整接回) ---
  const handleFetchMetadata = async () => {
    setIsFetching(true);
    isRequestingRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      if (isRequestingRef.current) {
        setIsFetching(false);
        isRequestingRef.current = false;
        toast.error(t`匹配超时`, { icon: <WifiOff className="text-red-500" size={18} /> });
      }
    }, 60000);

    try {
      const res = await recognizeGame(absPath);
      if (isRequestingRef.current) {
        setResultData(res);
        setIsFetching(false);
        isRequestingRef.current = false;
        if (timerRef.current) clearTimeout(timerRef.current);
      }
    } catch (err) {
      setIsFetching(false);
      isRequestingRef.current = false;
      toast.error(t`请求发生错误`);
    }
  };

  const handleFinalConfirm = async (useAutoData: boolean) => {
    let dir = getParentDir(absPath);
    let size = await invoke<number>(Cmds.GET_GAME_SIZE, { dir: dir });
    const finalGame: GameMeta = {
      id: nanoid(),
      absPath: absPath,
      isPassed: false,
      isDisplayed: false,
      name: useAutoData ? (displayInfo?.title || extractedName) : extractedName,
      cover: useAutoData ? (displayInfo?.cover || "") : "",
      description: displayInfo?.desc || "",
      developer: displayInfo?.developer as string || "",
      background: useAutoData ? (displayInfo?.background || "") : "",
      playTime: 0,
      length: 0,
      size: size
    };
    try {
      await invoke("add_new_game", { game: finalGame });
      addGameMeta(finalGame);
      onCancel();
      toast.success(t`导入成功`);
    } catch (err) {
      toast.error(t`导入失败`);
    }
  };

  const handleCancelAll = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    isRequestingRef.current = false;
    setIsFetching(false);
    setResultData(null);
    onCancel();
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <motion.div
      initial={false}
      animate={{ x: `calc(-50% + ${xOffset}px)` }}
      transition={{ type: "spring", stiffness: 400, damping: 40 }}
      className="fixed top-12 left-1/2 z-100 w-[95%] max-w-6xl pointer-events-none"
    >
      <div className="pointer-events-auto bg-zinc-100 dark:bg-zinc-800 shadow-2xl rounded-[32px] overflow-hidden border border-zinc-100/20 flex flex-col">

        {/* --- Header --- */}
        <div className="h-20 px-8 flex items-center justify-between gap-10 shrink-0 bg-zinc-100 dark:bg-zinc-800 relative z-30">
          <div className="flex items-center gap-5 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-white shrink-0">
              <FileText size={28} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-black dark:text-foreground/80 leading-none tracking-tighter uppercase truncate">
                {displayInfo?.title || extractedName}
              </h2>
              <p className="text-zinc-600 dark:text-zinc-200 font-mono text-[10px] truncate mt-1.5 font-bold opacity-60">
                {absPath}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <AnimatePresence mode="wait">
              {isFetching ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 bg-zinc-200 border border-zinc-100 py-2 px-5 rounded-xl">
                  <Loader2 className="animate-spin text-zinc-900" size={20} strokeWidth={4} />
                  <span className="font-black text-xs text-zinc-900 tracking-widest uppercase">Matching...</span>
                  <Button variant="ghost" size="icon" onClick={handleCancelAll} className="w-8 h-8 rounded-full"><X size={16} /></Button>
                </motion.div>
              ) : !resultData ? (
                <motion.div key="btns" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Button variant="ghost" onClick={handleCancelAll} className="h-12 px-5 text-sm rounded-2xl font-black text-zinc-400"><Trans>取消</Trans></Button>
                  <Button onClick={handleFetchMetadata} className="h-12 px-8 dark:bg-zinc-200 rounded-xl text-sm gap-2">
                    <Search size={18} strokeWidth={3} /><Trans> 匹配元数据</Trans>
                  </Button>
                  <Button onClick={() => handleFinalConfirm(false)} className="h-12 px-8 dark:bg-zinc-200 rounded-xl text-sm gap-2">
                    <Check size={18} strokeWidth={3} /><Trans> 直接确认</Trans>
                  </Button>
                </motion.div>
              ) : (
                <Button key="close-x" variant="ghost" size="icon" onClick={handleCancelAll} className="w-12 h-12 rounded-full hover:bg-zinc-100">
                  <X size={24} className="text-zinc-400" />
                </Button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* --- Content Area --- */}
        <AnimatePresence>
          {resultData && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-8 pb-10 pt-4 ">
              <div className="flex gap-10">
                <div className="w-64 flex flex-col gap-4 shrink-0">
                  <div className="w-64 h-80 rounded-[32px] overflow-hidden shadow-2xl border-3 dark:border-zinc-600 bg-zinc-900">
                    {displayInfo?.cover ? (
                      <img src={displayInfo.cover} className="w-full h-full object-cover" alt="cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-900 font-black">NO COVER</div>
                    )}
                  </div>
                  <div className="flex gap-2 p-2 bg-zinc-300 dark:bg-zinc-700 rounded-2xl border border-zinc-100/20">
                    <Input
                      placeholder="ID..."
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleIdSearch()}
                      className="h-9 bg-zinc-300 dark:bg-zinc-700 border-none text-xs font-bold focus-visible:ring-0"
                    />
                    <Button size="icon" onClick={handleIdSearch} className="h-9 w-9 rounded-2xl bg-zinc-300 dark:bg-zinc-700 shrink-0">
                      {isUpdating ? <Loader2 className="animate-spin text-zinc-900 dark:text-white hover:text-zinc-900" size={14} /> : <RefreshCw size={14} className="text-zinc-900 dark:text-foreground" />}
                    </Button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-w-0 h-100">
                  <div className="flex justify-between items-start mb-5 shrink-0">
                    <h3 className="text-4xl font-black text-zinc-900 dark:text-foreground leading-none tracking-tighter uppercase italic flex-1 pr-4 truncate">
                      {displayInfo?.title || t`未找到匹配数据`}
                    </h3>
                    <div className="flex bg-zinc-300 dark:bg-zinc-700 p-1.5 rounded-xl shrink-0">
                      {['bangumi', 'vndb', 'ymgal'].map(src => (
                        <button key={src} onClick={() => { setActiveSource(src as any); setSearchId(''); }} className={cn("px-4 py-2 text-[10px] font-black rounded-lg uppercase transition-all", activeSource === src ? "bg-white shadow-sm text-zinc-900" : "text-zinc-400")}>{src}</button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 mb-8 relative">
                    <ScrollArea className="h-full bg-zinc-300 dark:bg-zinc-800 rounded-[10px] p-6 border border-zinc-100/10 overflow-hidden">
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={activeSource}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="text-base leading-relaxed text-zinc-700 dark:text-foreground font-bold italic w-full break-all whitespace-pre-wrap"
                        >
                          {displayInfo?.desc || t`暂无详细介绍`}
                        </motion.p>
                      </AnimatePresence>
                    </ScrollArea>
                  </div>

                  <div className="flex justify-end shrink-0">
                    <Button onClick={() => handleFinalConfirm(true)} className="h-20 px-14 bg-green-500 hover:bg-green-600 text-white rounded-[24px] font-black text-3xl gap-4 shadow-2xl transition-all active:scale-95">
                      <Check size={40} strokeWidth={6} /><Trans> 确认添加</Trans>
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
