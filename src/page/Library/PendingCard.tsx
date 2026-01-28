import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  FileCode, Check, HardDrive, Loader2, Search,
  X, WifiOff, ListChecks, Edit3, Sparkles, ChevronDown, Plus
} from 'lucide-react';
import { toast } from "sonner";
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { nanoid } from 'nanoid'

// 导入你的类型和仓库
import { GameMeta } from "@/types/game";
import usePendingGameStore, { PendingGameInfo } from "@/store/pendingGamesStore";
import { recognizeGame } from '@/api/uniform';

// 假设这是你定义的接口调用函数
// import { recognizeGame } from "@/api/game"; 

interface PendingCardProps {
  pathList: string[];
  onConfirmAll: (results: GameMeta[]) => void;
  onCancel: () => void;
}

const PendingCard: React.FC<PendingCardProps> = ({ pathList, onConfirmAll, onCancel }) => {
  const [items, setItems] = useState<any[]>([]);
  const [isGlobalMatching, setIsGlobalMatching] = useState(false);
  const [matchProgress, setMatchProgress] = useState(0);

  const { addReadyGames, resetReadyGames } = usePendingGameStore();
  const isMatchingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化
  const createItemObject = (path: string) => {
    const normalizedPath = path.replace(/[\\/]+/g, '/');
    const folderName = normalizedPath.split('/').filter(Boolean).pop() || "Unknown";
    return {
      id: Math.random().toString(36).substr(2, 9),
      originalPath: normalizedPath,
      folderName: folderName,
      exePath: `${normalizedPath}/game.exe`,
      activeSource: 'bangumi' as 'vndb' | 'bangumi' | 'ymgal',
      data: null as PendingGameInfo | null,
      expanded: false
    };
  };

  /**
   * 核心修正 1：对齐 PendingGameInfo 的真实嵌套结构
   * 确保从 VNDBResponse, BangumiResponse, YmgalResponse 中提取正确字段
   */
  const transformToGameMeta = (item: any): GameMeta => {
    const source = item.activeSource;
    const data = item.data as PendingGameInfo;

    let meta: GameMeta = {
      id: nanoid(),
      name: item.folderName,
      absPath: item.exePath,
      cover: '',
      background: '',
      playTime: 0,
      length: 0,
    };

    if (!data) return meta;

    try {
      if (source === 'bangumi' && data.bangumi?.data?.[0]) {
        const b = data.bangumi.data[0];
        meta.name = b.name_cn || b.name;
        meta.cover = b.images?.large || b.image || ''; // 适配 Images 对象
        meta.background = b.images?.common || '';
      }
      if (source === 'vndb' && data.vndb?.results?.[0]) {
        const v = data.vndb.results[0];
        meta.name = v.title;
        meta.cover = v.image?.url || '';
        meta.background = v.screenshots?.[0]?.url || v.image?.url || '';
        meta.length = v.length || 0;
      }
      else if (source === 'ymgal' && data.ymgal?.data?.result?.[0]) {
        const y = data.ymgal.data.result[0];
        meta.name = y.chineseName || y.name;
        meta.cover = y.mainImg || '';
        meta.background = y.mainImg || '';
      }
    } catch (e) {
      console.error("转换失败", e);
    }
    return meta;
  };

  useEffect(() => {
    const init = async () => {
      const initialItems = pathList.map(p => createItemObject(p));
      setItems(initialItems);
      // 自动探测启动项 (Rust 后端逻辑)
      for (let i = 0; i < initialItems.length; i++) {
        try {
          const realExe: string = await invoke('getGameStartUpProgram', { gamePath: initialItems[i].originalPath });
          if (realExe) {
            setItems(prev => prev.map((it, idx) => idx === i ? { ...it, exePath: realExe.replace(/[\\/]+/g, '/') } : it));
          }
        } catch (e) { }
      }
    };
    init();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleGlobalMatch = async () => {
    if (isGlobalMatching) return;
    setIsGlobalMatching(true);
    isMatchingRef.current = true;
    setMatchProgress(0);

    try {
      const total = items.length;
      for (let i = 0; i < total; i++) {
        if (!isMatchingRef.current) break;

        const res: PendingGameInfo = await recognizeGame(items[i].exePath)

        setItems(prev => prev.map((it, idx) => i === idx ? { ...it, data: res } : it));
        setMatchProgress(Math.round(((i + 1) / total) * 100));
      }
      toast.success("匹配完成");
    } catch (err) {
      toast.error("匹配失败");
    } finally {
      setIsGlobalMatching(false);
      isMatchingRef.current = false;
    }
  };

  const handleFinalConfirm = async () => {
    const loadingId = toast.loading("正在处理导入...");
    resetReadyGames();
    try {
      const finalGames = items.map(item => transformToGameMeta(item));
      finalGames.forEach(g => addReadyGames(g));
      await invoke("add_new_game_list", { games: finalGames });
      toast.success("导入成功", { id: loadingId });
      onConfirmAll(finalGames);
    } catch (err) {
      toast.error("导入失败", { id: loadingId });
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
              <h2 className="text-4xl font-black italic tracking-tighter uppercase">批量导入确认</h2>
              <p className="text-zinc-400 font-bold text-[10px] mt-1 uppercase opacity-60 italic">{items.length} 个项目就绪</p>
            </div>
          </div>
          <Button variant="ghost" onClick={onCancel} className="h-16 px-6 rounded-2xl group flex items-center gap-4 hover:bg-red-50">
            <div className="flex flex-col items-end leading-none"><span className="text-[9px] font-black text-zinc-400 uppercase">Cancel</span><span className="text-xl font-black italic text-zinc-500 group-hover:text-red-500">取消操作</span></div>
            <X size={32} className="text-zinc-300 group-hover:text-red-500" />
          </Button>
        </div>

        <div className="h-1.5 w-full bg-zinc-50 relative z-50"><motion.div animate={{ width: `${matchProgress}%` }} className="h-full bg-violet-600 shadow-[0_0_15px_rgba(124,58,237,0.5)]" /></div>

        <div className="flex-1 min-h-0 relative z-10">
          <ScrollArea className="h-full px-12 pt-6">
            <div className="grid grid-cols-1 gap-5 pb-10">
              {items.map((item) => {
                const info = item.data as PendingGameInfo | null;

                let view = { name: item.folderName, cover: '', desc: '' };
                if (item.activeSource === 'bangumi' && info?.bangumi?.data?.[0]) {
                  const d = info.bangumi.data[0];
                  view = { name: d.name_cn || d.name, cover: d.images?.large || d.image || '', desc: d.summary };
                }
                else if (item.activeSource === 'vndb' && info?.vndb?.results?.[0]) {
                  const d = info.vndb.results[0];
                  view = { name: d.title, cover: d.image?.url || '', desc: d.description };
                }
                else if (item.activeSource === 'ymgal' && info?.ymgal?.data?.result?.[0]) {
                  const d = info.ymgal.data.result[0];
                  view = { name: d.chineseName || d.name, cover: d.mainImg, desc: `发行时间: ${d.releaseDate || '未知'}` };
                }

                return (
                  <div key={item.id} className="bg-zinc-50/80 rounded-[40px] border border-zinc-100 overflow-hidden hover:bg-white transition-all duration-300 group/card">
                    <div className="p-6 flex items-center gap-7 cursor-pointer" onClick={() => setItems(prev => prev.map(it => it.id === item.id ? { ...it, expanded: !it.expanded } : it))}>
                      <div className="w-16 h-16 shrink-0 rounded-2xl bg-zinc-200 overflow-hidden border-2 border-white shadow-sm transition-transform group-hover/card:scale-105">
                        {view.cover ? <img src={view.cover} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-400"><FileCode size={24} /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-zinc-900 text-2xl truncate italic uppercase tracking-tighter">{view.name}</h4>
                        <div className="flex items-center gap-2 px-3 py-1 mt-1 bg-white/50 border border-zinc-200 rounded-lg w-fit">
                          <HardDrive size={12} className="text-zinc-400" />
                          <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[350px]">{item.exePath}</span>
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
                              {view.cover && <img src={view.cover} className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1 flex flex-col gap-5">
                              <div className="flex justify-between items-center">
                                <div className="flex gap-2">
                                  {['bangumi', 'vndb', 'ymgal'].map(src => (
                                    <button key={src} onClick={(e) => { e.stopPropagation(); setItems(prev => prev.map(it => it.id === item.id ? { ...it, activeSource: src as any } : it)); }} className={cn("px-5 py-2 text-[11px] font-black rounded-xl uppercase transition-all shadow-sm", item.activeSource === src ? "bg-violet-600 text-white" : "bg-white border border-zinc-100 text-zinc-400")}>{src}</button>
                                  ))}
                                </div>
                                <Button variant="outline" onClick={(e) => { e.stopPropagation(); open({ filters: [{ name: 'Exe', extensions: ['exe'] }] }).then(p => p && setItems(prev => prev.map(it => it.id === item.id ? { ...it, exePath: p.toString().replace(/\\/g, '/') } : it))); }} className="rounded-xl border-violet-100 text-violet-600 font-black px-6 hover:bg-violet-50">修正启动路径</Button>
                              </div>
                              <ScrollArea className="flex-1 bg-white rounded-[32px] p-6 border border-zinc-100 shadow-inner h-32">
                                <p className="text-sm font-bold text-zinc-500 italic leading-relaxed">{view.desc || "抓取成功后将在此同步简介信息..."}</p>
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
        <div className="px-12 py-10 bg-white border-t-2 border-zinc-50 flex items-center gap-8 shrink-0 relative z-[100] shadow-[0_-20px_50px_rgba(255,255,255,1)]">
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

export default PendingCard
