import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, getParentDir } from '@/lib/utils';
import {
  FileCode, Check, HardDrive, Loader2, Search,
  X, ListChecks, ChevronDown, RefreshCw, Sparkles
} from 'lucide-react';
import { toast } from "sonner";
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { nanoid } from 'nanoid';

import { requestBangumiById } from '@/api/bangumiApi';
import { requestVNDBById } from '@/api/vndbApi';
import { recognizeGame } from '@/api/uniform';

import { BangumiResponse, Datum, Developer, GameMeta } from "@/types/game";
import usePendingGameStore, { PendingGameInfo } from "@/store/pendingGamesStore";
import useGameStore from '@/store/gameStore';
import { Cmds } from '@/lib/enum';

interface PendingCardProps {
  pathList: string[];
  onConfirmAll: (results: GameMeta[]) => void;
  onCancel: () => void;
}

const PendingCard: React.FC<PendingCardProps> = ({ pathList, onCancel }) => {
  const [items, setItems] = useState<any[]>([]);
  const [isGlobalMatching, setIsGlobalMatching] = useState(false);
  const [matchProgress, setMatchProgress] = useState(0);
  const [singleLoading, setSingleLoading] = useState<string | null>(null);

  const { addReadyGames, resetReadyGames } = usePendingGameStore();
  const { addGameMeta } = useGameStore();
  const isMatchingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const createItemObject = (path: string) => {
    const normalizedPath = path.replace(/[\\/]+/g, '/');
    const folderName = normalizedPath.split('/').filter(Boolean).pop() || "Unknown";
    return {
      id: nanoid(),
      originalPath: normalizedPath,
      folderName: folderName,
      exePath: `${normalizedPath}/game.exe`,
      activeSource: 'bangumi' as 'vndb' | 'bangumi' | 'ymgal',
      data: null as PendingGameInfo | null,
      expanded: false,
      idInput: ''
    };
  };

  // --- 核心修改：精准提取各源描述并确保不为空 ---
  const transformToGameMeta = (item: any): GameMeta => {
    const source = item.activeSource;
    const data = item.data as PendingGameInfo;

    let meta: GameMeta = {
      id: nanoid(),
      name: item.folderName,
      absPath: item.exePath,
      cover: '',
      background: '',
      description: '', // 默认为空，后续填充
      developer: '',
      playTime: 0,
      length: 0,
      lastPlayedAt: undefined,
    };

    if (!data) return meta;

    try {
      if (source === 'bangumi') {
        const b = (data.bangumi as BangumiResponse)?.data && (data.bangumi as BangumiResponse).data[0]
        if (b) {
          meta.name = b.name_cn || b.name;
          meta.cover = b.images?.large || b.image || '';
          meta.background = b.images?.common || '';
          meta.description = b.summary || ''; // 绑定 Bangumi 简介
          meta.developer = (b.infobox.find(info => info.key === "开发") as { key: string, value: string }).value || ""
        }
      } else if (source === 'vndb') {
        const v = data.vndb?.results ? data.vndb.results[0] : (data.vndb as any);
        if (v) {
          meta.name = v.title || v.name
          meta.cover = v.image?.url || ''
          meta.background = v.screenshots?.[0]?.url || v.image?.url || ''
          meta.length = v.length || 0
          meta.developer = v.developers[0].name
          meta.description = v.description || ''
        }
      } else if (source === 'ymgal') {
        const y = data.ymgal?.data?.result?.[0]
        if (y) {
          meta.name = y.chineseName || y.name
          meta.cover = y.mainImg || ''
          meta.background = y.mainImg || ''
          meta.developer = ""
          // 月幕结果中如果存在简介字段（根据通用接口惯例尝试提取）
          meta.description = (y as any).description || (y as any).chineseName || y.name || ''
        }
      }
    } catch (e) {
      console.error("转换元数据出错:", e);
    }

    // 强制检查：如果描述为空，填充占位符，确保提交到后端不是空字符串
    if (!meta.description || meta.description.trim() === "") {
      meta.description = `${meta.name} - 暂无详细介绍。`;
    }

    return meta;
  };

  useEffect(() => {
    const init = async () => {
      const initialItems = pathList.map(p => createItemObject(p));
      setItems(initialItems);
      for (let i = 0; i < initialItems.length; i++) {
        try {
          const realExe: string = await invoke('get_start_up_path', { parentPath: initialItems[i].originalPath });
          if (realExe) {
            setItems(prev => prev.map((it, idx) => idx === i ? { ...it, exePath: realExe.replace(/[\\/]+/g, '/') } : it));
          }
        } catch (e) { }
      }
    };
    init();
    return () => clearTimer();
  }, [pathList]);

  // 处理匹配元数据任务
  const handleGlobalMatch = async () => {
    if (isGlobalMatching) return;
    setIsGlobalMatching(true);
    isMatchingRef.current = true;
    setMatchProgress(0);

    timerRef.current = setTimeout(() => {
      if (isMatchingRef.current) {
        isMatchingRef.current = false;
        setIsGlobalMatching(false);
        toast.error("匹配任务超时，请检查网络");
      }
    }, 60000);

    try {
      for (let i = 0; i < items.length; i++) {
        if (!isMatchingRef.current) break;
        const res = await recognizeGame(items[i].exePath);
        setItems(prev => prev.map((it, idx) => i === idx ? { ...it, data: res } : it));
        setMatchProgress(Math.round(((i + 1) / items.length) * 100));
      }
      if (isMatchingRef.current) toast.success("全局匹配完成");
    } catch (err) {
      toast.error("匹配中断");
    } finally {
      clearTimer();
      setIsGlobalMatching(false);
      isMatchingRef.current = false;
    }
  };

  const handleSingleIdSearch = async (itemId: string) => {
    const item = items.find(it => it.id === itemId);
    if (!item || !item.idInput) return;
    setSingleLoading(itemId);
    const singleTimer = setTimeout(() => {
      if (singleLoading === itemId) {
        setSingleLoading(null);
        toast.error("请求超时");
      }
    }, 15000);

    try {
      if (item.activeSource === 'bangumi') {
        const res = await requestBangumiById(item.idInput);
        if (res) setItems(prev => prev.map(it => it.id === itemId ? { ...it, data: { ...it.data, bangumi: res } } : it));
      } else if (item.activeSource === 'vndb') {
        const res = await requestVNDBById(item.idInput);
        if (res) setItems(prev => prev.map(it => it.id === itemId ? { ...it, data: { ...it.data, vndb: res } } : it));
      }
      clearTimeout(singleTimer);
      toast.success("ID 检索成功");
    } catch (err) {
      clearTimeout(singleTimer);
      toast.error("检索失败");
    } finally {
      setSingleLoading(null);
    }
  };

  // 最终确认时要保存到数据库的数据
  const handleFinalConfirm = async () => {
    // 提前转换，用于校验
    const finalGames = items.map(item => transformToGameMeta(item));
    // 获取所有游戏的大小
    for (const game of finalGames) {
      let dir = getParentDir(game.absPath)
      let size = await invoke<number>(Cmds.GET_GAME_SIZE, { dir: dir })
      game.size = size
    }

    const loadingId = toast.loading("正在处理导入...");
    resetReadyGames();
    try {
      // 提交到后端 Rust
      await invoke("add_new_game_list", { games: finalGames });

      // 更新前端 Store
      finalGames.forEach(g => {
        addReadyGames(g);
        addGameMeta(g);
      });

      toast.success("导入成功", { id: loadingId });
      onCancel();
    } catch (err) {
      toast.error("导入失败", { id: loadingId });
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xl p-8" onClick={onCancel}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-6xl bg-white shadow-2xl rounded-[52px] flex flex-col h-[88vh] overflow-hidden relative">

        {/* Header */}
        <div className="px-12 py-10 flex items-center justify-between bg-white relative z-50">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-zinc-900 rounded-[22px] flex items-center justify-center text-white"><ListChecks size={32} /></div>
            <div>
              <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">批量导入确认</h2>
              <p className="text-zinc-400 font-bold text-[10px] mt-2 uppercase opacity-60 italic">{items.length} 个项目就绪</p>
            </div>
          </div>
          <Button variant="ghost" onClick={onCancel} className="h-16 px-6 rounded-2xl group flex items-center gap-4 hover:bg-red-50">
            <div className="flex flex-col items-end leading-none"><span className="text-[9px] font-black text-zinc-400 uppercase">Cancel</span><span className="text-xl font-black italic text-zinc-500 group-hover:text-red-500">取消操作</span></div>
            <X size={32} className="text-zinc-300 group-hover:text-red-500" />
          </Button>
        </div>

        <div className="h-1.5 w-full bg-zinc-50 relative z-50">
          <motion.div animate={{ width: `${matchProgress}%` }} className="h-full bg-violet-600 shadow-[0_0_15px_rgba(124,58,237,0.5)]" />
        </div>

        <div className="flex-1 min-h-0 relative z-10">
          <ScrollArea className="h-full px-12 pt-6">
            <div className="grid grid-cols-1 gap-5 pb-10">
              {items.map((item) => {
                const meta = transformToGameMeta(item);
                return (
                  <div key={item.id} className="bg-zinc-50/80 rounded-[40px] border border-zinc-100 overflow-hidden hover:bg-white transition-all duration-300 group/card">
                    <div className="p-6 flex items-center gap-7 cursor-pointer" onClick={() => setItems(prev => prev.map(it => it.id === item.id ? { ...it, expanded: !it.expanded } : it))}>
                      <div className="w-16 h-16 shrink-0 rounded-2xl bg-zinc-200 overflow-hidden border-2 border-white shadow-sm">
                        {meta.cover ? <img src={meta.cover} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-400"><FileCode size={24} /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-zinc-900 text-2xl truncate italic uppercase tracking-tighter">{meta.name}</h4>
                        <div className="flex items-center gap-2 px-3 py-1 mt-1 bg-white/50 border border-zinc-200 rounded-lg w-fit">
                          <HardDrive size={12} className="text-zinc-400" />
                          <span className="text-[10px] font-mono text-zinc-400 truncate max-w-100">{item.exePath}</span>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-4">
                        {item.data && <Sparkles size={20} className="text-violet-500 animate-pulse" />}
                        <ChevronDown size={28} className={cn("text-zinc-300 transition-transform duration-500", item.expanded && "rotate-180")} />
                      </div>
                    </div>

                    <AnimatePresence>
                      {item.expanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                          <div className="px-8 pb-8 pt-2 flex gap-8">
                            <div className="w-44 h-60 shrink-0 rounded-[32px] bg-zinc-100 overflow-hidden shadow-2xl border-4 border-white">
                              {meta.cover ? <img src={meta.cover} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-300 font-black">NO COVER</div>}
                            </div>

                            <div className="flex-1 flex flex-col gap-5 min-w-0">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex bg-zinc-100 p-1.5 rounded-2xl flex-none">
                                  {['bangumi', 'vndb', 'ymgal'].map(src => (
                                    <button key={src} onClick={(e) => { e.stopPropagation(); setItems(prev => prev.map(it => it.id === item.id ? { ...it, activeSource: src as any } : it)); }} className={cn("px-5 py-2 text-[11px] font-black rounded-xl uppercase transition-all", item.activeSource === src ? "bg-white shadow-sm text-zinc-900" : "text-zinc-400 hover:text-zinc-600")}>{src}</button>
                                  ))}
                                </div>

                                <div className="flex-none w-60 flex gap-2 p-1.5 bg-zinc-100 rounded-2xl border border-zinc-200/50">
                                  <input
                                    className="bg-transparent border-none outline-none flex-1 px-3 text-xs font-bold text-zinc-600 placeholder:text-zinc-400 min-w-0"
                                    placeholder={`${item.activeSource.toUpperCase()} ID...`}
                                    value={item.idInput}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => setItems(prev => prev.map(it => it.id === item.id ? { ...it, idInput: e.target.value } : it))}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSingleIdSearch(item.id)}
                                  />
                                  <Button
                                    size="icon"
                                    onClick={(e) => { e.stopPropagation(); handleSingleIdSearch(item.id); }}
                                    disabled={singleLoading === item.id || !item.idInput}
                                    className="h-8 w-8 rounded-xl bg-zinc-900 hover:bg-black shrink-0"
                                  >
                                    {singleLoading === item.id ? <Loader2 size={14} className="animate-spin text-white" /> : <RefreshCw size={14} className="text-white" />}
                                  </Button>
                                </div>

                                <Button variant="outline" onClick={(e) => { e.stopPropagation(); open({ filters: [{ name: 'Exe', extensions: ['exe'] }] }).then(p => p && setItems(prev => prev.map(it => it.id === item.id ? { ...it, exePath: p.toString().replace(/\\/g, '/') } : it))); }} className="flex-none rounded-xl border-violet-100 text-violet-600 font-black px-6 hover:bg-violet-50">修正路径</Button>
                              </div>

                              <ScrollArea className="flex-1 bg-white rounded-[32px] p-6 border border-zinc-100 shadow-inner h-32">
                                {/* 这里直接展示 meta.description，它会随源切换动态改变 */}
                                <p className="text-sm font-bold text-zinc-500 italic leading-relaxed">{meta.description}</p>
                              </ScrollArea>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="px-12 py-10 bg-white border-t-2 border-zinc-50 flex items-center gap-8 shrink-0 relative z-100 shadow-[0_-20px_50px_rgba(255,255,255,1)]">
          <Button onClick={handleGlobalMatch} disabled={isGlobalMatching} className={cn("h-24 flex-1 rounded-[36px] font-black text-3xl gap-4 border-none shadow-none", isGlobalMatching ? "bg-violet-100 text-violet-400 opacity-100" : "bg-violet-600 text-white hover:bg-violet-700")}>
            {isGlobalMatching ? <div className="flex items-center gap-4"><Loader2 className="animate-spin" size={36} /><span className="text-4xl font-black">{matchProgress}%</span></div> : <><Search size={36} strokeWidth={4} />匹配元数据</>}
          </Button>
          <Button onClick={handleFinalConfirm} disabled={isGlobalMatching || items.length === 0} className={cn("h-24 flex-1 rounded-[36px] font-black text-3xl gap-4 border-none shadow-none", isGlobalMatching ? "bg-zinc-100 text-zinc-300 opacity-100" : "bg-zinc-900 text-white hover:bg-black")}>
            <Check size={40} strokeWidth={5} /> 确认添加项目
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default PendingCard;
