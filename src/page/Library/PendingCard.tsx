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

// API 与 工具函数
import { requestBangumiById } from '@/api/bangumiApi';
import { requestVNDBById } from '@/api/vndbApi';
import { recognizeGame } from '@/api/uniform';
import { transBangumiToGameMeta, transVNDBToGameMeta } from '@/lib/resolve'

// 类型定义
import { Datum, GameMeta, VNDBResult, YmResult } from "@/types/game";
import usePendingGameStore, { PendingGameInfo } from "@/store/pendingGamesStore";
import useGameStore from '@/store/gameStore';
import { Cmds } from '@/lib/enum';
import { Trans } from '@lingui/react/macro';
import { t } from '@lingui/core/macro'
import useConfigStore from '@/store/configStore';

interface PendingCardProps {
  pathList: string[];
  onConfirmAll?: (results: GameMeta[]) => void;
  onCancel: () => void;
}

// 扩展临时项目接口，包含 UI 交互状态
interface TemporaryItem {
  id: string;              // 内部前端唯一 ID
  absPath: string;         // 用户修正后的启动路径
  originalPath: string;    // 原始传入路径（用于文件夹识别）
  folderName: string;      // 文件夹名
  idInput: string;         // 输入框内的 ID
  activeSource: 'vndb' | 'bangumi';//  |'ymgal';
  gameInfo: PendingGameInfo | null; // 包含三个源的原始数据
  expanded: boolean;       // 是否展开
}

const PendingCard: React.FC<PendingCardProps> = ({ pathList, onCancel }) => {
  const [items, setItems] = useState<TemporaryItem[]>([]);
  const [isGlobalMatching, setIsGlobalMatching] = useState(false);
  const [matchProgress, setMatchProgress] = useState(0);
  const [singleLoading, setSingleLoading] = useState<string | null>(null);

  const { addReadyGames, resetReadyGames } = usePendingGameStore();
  const { addGameMeta } = useGameStore();

  const isMatchingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { config } = useConfigStore()

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // --- 初始化与路径处理 ---
  useEffect(() => {
    const init = async () => {
      const initialItems: TemporaryItem[] = pathList.map(p => {
        const normalizedPath = p.replace(/[\\/]+/g, '/');
        // 尝试从路径中提取文件夹名作为默认游戏名
        const parts = normalizedPath.split('/');
        const folderName = parts[parts.length - 1] || "Unknown Game";

        return {
          id: nanoid(),
          absPath: normalizedPath,
          originalPath: normalizedPath,
          folderName: folderName,
          idInput: "",
          activeSource: 'bangumi',
          gameInfo: null,
          expanded: false
        };
      });
      setItems(initialItems);

      // 自动修正每个项目的启动程序路径（Rust 后端逻辑）
      for (let i = 0; i < initialItems.length; i++) {
        try {
          const realExe: string = await invoke(Cmds.GET_START_UP_PATH, {
            parentPath: initialItems[i].originalPath
          });
          if (realExe) {
            const fixedPath = realExe.replace(/[\\/]+/g, '/');
            setItems(prev => prev.map((it, idx) =>
              idx === i ? { ...it, absPath: fixedPath } : it
            ));
          }
        } catch (e) {
          console.warn("自动搜寻执行文件失败:", initialItems[i].originalPath);
        }
      }
    };
    init();
    return () => clearTimer();
  }, [pathList]);

  // --- 核心转换逻辑 (应用你提供的工具函数逻辑) ---
  const getItemDisplayMeta = (item: TemporaryItem): GameMeta => {
    // 1. 构建 Partial Meta (基础字段)
    const partial: Omit<GameMeta, 'cover' | 'background' | 'description' | 'developer'> = {
      id: item.id,
      name: item.folderName,
      absPath: item.absPath,
      isPassed: false,
      isDisplayed: false,
      playTime: 0,
      length: 0,
    };

    const data = item.gameInfo;
    if (!data) return { ...partial, cover: '', background: '', description: t`未匹配数据`, developer: '' };

    // 2. 根据当前激活源调用对应的转换工具
    try {
      if (item.activeSource === 'bangumi' && data.bangumi) {
        return transBangumiToGameMeta(partial, data.bangumi as Datum);
      }

      if (item.activeSource === 'vndb' && data.vndb) {
        return transVNDBToGameMeta(partial, data.vndb as VNDBResult);
      }

      // TODO:将来对接ymgal源
      // if (item.activeSource === 'ymgal' && data.ymgal) {
      //   const y = data.ymgal as YmResult;
      //   return {
      //     ...partial,
      //     name: y.chineseName || y.name,
      //     cover: y.mainImg || "",
      //     background: y.mainImg || "",
      //     description: t`来自月幕 Galgame 的数据`,
      //     developer: y.orgName || ""
      //   };
      // }
    } catch (e) {
      console.error("转换出错:", e);
    }

    return { ...partial, cover: '', background: '', description: '', developer: '' };
  };

  // --- 业务操作逻辑 ---

  // 全局自动匹配
  const handleGlobalMatch = async () => {
    if (isGlobalMatching) return;
    setIsGlobalMatching(true);
    isMatchingRef.current = true;
    setMatchProgress(0);

    timerRef.current = setTimeout(() => {
      if (isMatchingRef.current) {
        isMatchingRef.current = false;
        setIsGlobalMatching(false);
        toast.error(t`匹配任务超时，请检查网络`);
      }
    }, 60000);

    try {
      for (let i = 0; i < items.length; i++) {
        if (!isMatchingRef.current) break;

        // recognizeGame 返回的是 PendingGameInfo { bangumi, vndb, ymgal, absPath }
        const res = await recognizeGame(items[i].absPath) as PendingGameInfo;

        setItems(prev => prev.map((it, idx) =>
          idx === i ? { ...it, gameInfo: res } : it
        ));
        setMatchProgress(Math.round(((i + 1) / items.length) * 100));
      }
      if (isMatchingRef.current) toast.success(t`全局匹配完成`);
    } catch (err) {
      toast.error(t`匹配过程中断`);
    } finally {
      clearTimer();
      setIsGlobalMatching(false);
      isMatchingRef.current = false;
    }
  };

  // 单个 ID 检索更新
  const handleSingleIdSearch = async (itemId: string) => {
    const item = items.find(it => it.id === itemId);
    if (!item || !item.idInput) return;

    setSingleLoading(itemId);
    try {
      let updatedGameInfo = { ...(item.gameInfo || { absPath: item.absPath, bangumi: null, vndb: null, ymgal: null }) };

      if (item.activeSource === 'bangumi') {
        const res = await requestBangumiById(item.idInput, config.auth.bangumiToken);
        if (res) updatedGameInfo.bangumi = res as Datum;
      } else if (item.activeSource === 'vndb') {
        const res = await requestVNDBById(item.idInput);
        if (res) updatedGameInfo.vndb = res;
      }

      setItems(prev => prev.map(it =>
        it.id === itemId ? { ...it, gameInfo: updatedGameInfo } : it
      ));
      toast.success(t`数据更新成功`);
    } catch (err) {
      toast.error(t`检索失败，请检查 ID 或网络`);
    } finally {
      setSingleLoading(null);
    }
  };

  // 最终确认提交
  const handleFinalConfirm = async () => {
    const loadingId = toast.loading(t`正在计算资源并导入...`);
    try {
      const finalGames: GameMeta[] = [];

      for (const item of items) {
        const meta = getItemDisplayMeta(item);
        // 调用 Rust 获取文件夹大小
        const dir = getParentDir(meta.absPath);
        const size = await invoke<number>(Cmds.GET_GAME_SIZE, { dir });

        finalGames.push({ ...meta, size });
      }

      // 同步到 Rust 后端数据库
      await invoke(Cmds.ADD_NEW_GAME_LIST, { games: finalGames });

      // 同步到前端全局 Store
      resetReadyGames();
      finalGames.forEach(g => {
        addReadyGames(g);
        addGameMeta(g);
      });

      toast.success(t`成功导入 ${finalGames.length} 个游戏`, { id: loadingId });
      onCancel(); // 关闭弹窗
    } catch (err) {
      toast.error(t`导入失败,id: `, { id: loadingId });
    }
  };

  // --- UI 渲染部分 (保持你原有的所有样式和动效) ---
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-800/50 backdrop-blur-xl p-8" onClick={onCancel}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl bg-white dark:bg-zinc-900 shadow-2xl rounded-[52px] flex flex-col h-[88vh] overflow-hidden relative"
      >
        {/* Header */}
        <div className="px-12 py-10 flex items-center justify-between bg-zinc-300 dark:bg-zinc-900 relative z-50">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-zinc-900 rounded-[22px] flex items-center justify-center text-white">
              <ListChecks size={32} />
            </div>
            <div>
              <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none dark:text-white">
                <Trans>批量导入确认</Trans>
              </h2>
              <p className="text-zinc-500 font-bold text-[10px] mt-2 uppercase opacity-60 italic">
                <Trans>{items.length} 个项目就绪</Trans>
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={onCancel} className="h-16 px-6 rounded-2xl group flex items-center gap-4 hover:bg-red-50">
            <div className="flex flex-col items-end leading-none">
              <span className="text-[9px] font-black text-zinc-400 uppercase">Cancel</span>
              <span className="text-xl font-black italic text-zinc-500 group-hover:text-red-500">取消操作</span>
            </div>
            <X size={32} className="text-zinc-800 dark:text-zinc-300 group-hover:text-red-500" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 relative z-50">
          <motion.div
            animate={{ width: `${matchProgress}%` }}
            className="h-full bg-custom-600 shadow-[0_0_15px_rgba(124,58,237,0.5)]"
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 relative z-10">
          <ScrollArea className="h-full px-12 pt-6 bg-zinc-100 dark:bg-zinc-800">
            <div className="grid grid-cols-1 gap-5 pb-10">
              {items.map((item) => {
                const meta = getItemDisplayMeta(item);
                return (
                  <div
                    key={item.id}
                    className="rounded-[40px] border border-zinc-200 dark:border-zinc-700/50 overflow-hidden hover:bg-zinc-300/30 dark:hover:bg-zinc-700/50 transition-all duration-300 group/card bg-white/50 dark:bg-zinc-800/50"
                  >
                    {/* Item Row */}
                    <div
                      className="p-6 flex items-center gap-7 cursor-pointer"
                      onClick={() => setItems(prev => prev.map(it => it.id === item.id ? { ...it, expanded: !it.expanded } : it))}
                    >
                      <div className="w-16 h-16 shrink-0 rounded-2xl bg-zinc-200 dark:bg-zinc-700 overflow-hidden border-2 border-white dark:border-zinc-600 shadow-sm">
                        {meta.cover ? (
                          <img src={meta.cover} className="w-full h-full object-cover" alt="cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400">
                            <FileCode size={24} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-zinc-900 dark:text-zinc-100 text-2xl truncate italic uppercase tracking-tighter">
                          {meta.name}
                        </h4>
                        <div className="flex items-center gap-2 px-3 py-1 mt-1 bg-zinc-200 dark:bg-zinc-700 border border-zinc-300/20 rounded-lg w-fit">
                          <HardDrive size={12} className="text-zinc-600 dark:text-zinc-400" />
                          <span className="text-[10px] font-mono text-zinc-800 dark:text-zinc-400 truncate max-w-[400px]">
                            {item.absPath}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-4">
                        {item.gameInfo && <Sparkles size={20} className="text-custom-500 animate-pulse" />}
                        <ChevronDown
                          size={28}
                          className={cn("text-zinc-300 transition-transform duration-500", item.expanded && "rotate-180")}
                        />
                      </div>
                    </div>

                    {/* Expandable Details */}
                    <AnimatePresence>
                      {item.expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          <div className="px-8 pb-8 pt-2 flex gap-8">
                            <div className="w-44 h-60 shrink-0 rounded-[24px] bg-zinc-200 dark:bg-zinc-700 overflow-hidden shadow-2xl border-4 border-white dark:border-zinc-600">
                              {meta.cover ? (
                                <img src={meta.cover} className="w-full h-full object-cover" alt="large cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-300 font-black">NO COVER</div>
                              )}
                            </div>

                            <div className="flex-1 flex flex-col gap-5 min-w-0">
                              <div className="flex items-center justify-between gap-4">
                                {/* Source Toggles */}
                                <div className="flex bg-zinc-200 dark:bg-zinc-600 p-1.5 rounded-2xl flex-none">
                                  {(['bangumi', 'vndb'] as const).map(src => (
                                    <button
                                      key={src}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setItems(prev => prev.map(it => it.id === item.id ? { ...it, activeSource: src } : it));
                                      }}
                                      className={cn(
                                        "px-5 py-2 text-[11px] font-black rounded-xl uppercase transition-all",
                                        item.activeSource === src
                                          ? "bg-white dark:bg-zinc-200 shadow-sm text-zinc-900"
                                          : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-900"
                                      )}
                                    >
                                      {src}
                                    </button>
                                  ))}
                                </div>

                                {/* ID Search Input */}
                                <div className="flex-none w-60 flex gap-2 p-1.5 bg-zinc-200 dark:bg-zinc-600 rounded-2xl border border-zinc-300/20">
                                  <input
                                    className="bg-transparent border-none outline-none flex-1 px-3 text-xs font-bold text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 min-w-0"
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

                                <Button
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    open({ filters: [{ name: 'Executable', extensions: ['exe', 'lnk', 'bat'] }] }).then(p => {
                                      if (p) setItems(prev => prev.map(it => it.id === item.id ? { ...it, absPath: p.toString().replace(/\\/g, '/') } : it));
                                    });
                                  }}
                                  className="flex-none rounded-xl border-custom-100 text-custom-500 font-black px-6 hover:bg-custom-50 dark:hover:bg-custom-900/30"
                                >
                                  修正路径
                                </Button>
                              </div>

                              <ScrollArea className="flex-1 bg-zinc-100 dark:bg-zinc-700/50 rounded-2xl p-6 border border-zinc-200/20 shadow-inner h-32">
                                <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300 italic leading-relaxed">
                                  {meta.description || t`暂无详细介绍。`}
                                </p>
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
        <div className="px-12 py-10 bg-zinc-100 dark:bg-zinc-900 flex items-center gap-8 shrink-0 relative z-[100] border-t border-zinc-200 dark:border-zinc-800">
          <Button
            onClick={handleGlobalMatch}
            disabled={isGlobalMatching}
            className={cn(
              "h-24 flex-1 rounded-[36px] font-black text-3xl gap-4 border-none shadow-none transition-all",
              isGlobalMatching ? "bg-custom-100 text-custom-400 opacity-100" : "bg-custom-600 text-white hover:bg-custom-700 hover:scale-[1.02] active:scale-95"
            )}
          >
            {isGlobalMatching ? (
              <div className="flex items-center gap-4">
                <Loader2 className="animate-spin" size={36} />
                <span className="text-4xl font-black">{matchProgress}%</span>
              </div>
            ) : (
              <>
                <Search size={36} strokeWidth={4} />
                <Trans>一键智能匹配</Trans>
              </>
            )}
          </Button>

          <Button
            onClick={handleFinalConfirm}
            disabled={isGlobalMatching || items.length === 0}
            className={cn(
              "h-24 flex-1 rounded-[36px] font-black text-3xl gap-4 border-none shadow-none transition-all",
              isGlobalMatching ? "bg-zinc-200 text-zinc-400 opacity-100" : "bg-zinc-900 text-white hover:bg-black hover:scale-[1.02] active:scale-95"
            )}
          >
            <Check size={40} strokeWidth={5} />
            <Trans>确认添加项目</Trans>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default PendingCard;
