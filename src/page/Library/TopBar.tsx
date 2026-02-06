import React, { useState, useRef, memo, useEffect } from 'react';
import {
  SortAsc, SortDesc, Search, ArrowUpDown, Trash2, X, Clock, Type,
  CalendarDays, Layout, CheckCircle2, GripVertical, Eraser
} from 'lucide-react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { cn } from '@/lib/utils';
import { t } from '@lingui/core/macro';
import { convertFileSrc } from '@tauri-apps/api/core';

import useGameStore from "@/store/gameStore";
import useConfigStore from "@/store/configStore";
import { GameMeta } from '@/types/game';

// 扩展 Props 类型，支持 passed 排序/过滤
interface TopToolbarProps {
  isAsc: boolean;
  onSearchChange: (value: string) => void;
  // 关键：增加了 'passed'
  onSortChange: (type: 'duration' | 'name' | 'lastPlayed' | 'passed') => void;
  onDeleteModeToggle: (isDeleteMode: boolean) => void;
  onOrderToggle: () => void;
  activeSort?: string; // 可选：用于高亮当前选中的排序项
}

const noScrollbarStyle: React.CSSProperties = {
  msOverflowStyle: 'none',
  scrollbarWidth: 'none',
};

// --- 右侧海报单项 (保持原样) ---
const GameGridItem = memo(({ game, isActive, onClick }: { game: GameMeta; isActive: boolean; onClick: () => void }) => {
  const coverUrl = game.localCover ? convertFileSrc(game.localCover) : game.cover;
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative w-full h-[210px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 border-[3px] bg-zinc-100",
        isActive ? "border-emerald-500 shadow-md scale-95" : "border-transparent hover:border-zinc-200 shadow-sm"
      )}
    >
      <img src={coverUrl} alt={game.name} className={cn("w-full h-full object-cover transition-all duration-500", isActive && "opacity-30 grayscale blur-[1px]")} />
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-emerald-500" strokeWidth={3} />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-white font-bold text-[10px] truncate leading-tight">{game.name}</p>
      </div>
    </div>
  );
});

export const TopToolbar: React.FC<TopToolbarProps> = ({
  isAsc, onSearchChange, onSortChange, onDeleteModeToggle, onOrderToggle,
}) => {
  // --- 状态完全保持你的原始版本 ---
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState<boolean>(false);
  const [isDeleteMode, setIsDeleteMode] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isLayoutOpen, setIsLayoutOpen] = useState<boolean>(false);
  const { gameMetaList, setGameMeta } = useGameStore();
  const { config, updateConfig } = useConfigStore();
  const [localDisplayList, setLocalDisplayList] = useState<GameMeta[]>([]);

  // ... useEffect 和各种 handle 函数保持绝对不动 ...
  useEffect(() => {
    const orderIds: string[] = config.basic.gameDisplayOrder || [];
    const games = orderIds.map(id => gameMetaList.find(g => g.id === id)).filter((g): g is GameMeta => !!g);
    setLocalDisplayList(games);
  }, [config.basic.gameDisplayOrder, gameMetaList]);

  const handleToggleSearch = () => {
    if (isSearchOpen) {
      setIsSearchOpen(false);
      setQuery("");
      onSearchChange("");
    } else {
      setIsSearchOpen(true);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  };

  const handleToggleDeleteMode = () => {
    const nextMode = !isDeleteMode;
    setIsDeleteMode(nextMode);
    onDeleteModeToggle(nextMode);
  };

  const handleToggleDisplay = (gameId: string) => {
    const game = gameMetaList.find(g => g.id === gameId);
    if (!game) return;
    const isCurrentlyInOrder = (config.basic.gameDisplayOrder || []).includes(gameId);

    updateConfig(prev => {
      const order = prev.basic.gameDisplayOrder || [];
      prev.basic.gameDisplayOrder = isCurrentlyInOrder ? order.filter(id => id !== gameId) : [...order, gameId];
    });
    setGameMeta({ ...game, isDisplayed: !isCurrentlyInOrder });
  };

  const handleClearAll = () => {
    (config.basic.gameDisplayOrder || []).forEach(id => {
      const game = gameMetaList.find(g => g.id === id);
      if (game) setGameMeta({ ...game, isDisplayed: false });
    });
    updateConfig(prev => { prev.basic.gameDisplayOrder = []; });
  };

  // --- 仅在这里增加一个选项 ---
  const sortOptions = [
    { id: 'duration', label: t`按游玩时长`, icon: <Clock size={20} /> },
    { id: 'name', label: t`按名称排序`, icon: <Type size={20} /> },
    { id: 'lastPlayed', label: t`按最后游玩`, icon: <CalendarDays size={20} /> },
    { id: 'passed', label: t`仅看已通关`, icon: <CheckCircle2 size={20} className="text-emerald-500" /> }, // 新增
  ] as const;

  return (
    <div className="flex items-center justify-end gap-8 w-full px-12 pt-10">
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>

      {/* 1. 搜索 (不动) */}
      <motion.div layout animate={{ width: isSearchOpen ? 480 : 80, backgroundColor: isSearchOpen ? "rgb(244 244 245)" : "transparent" }} className={cn("h-20 flex flex-row-reverse items-center rounded-[28px] overflow-hidden", isSearchOpen ? "ring-2 ring-zinc-200" : "hover:bg-zinc-100")}>
        <button onClick={handleToggleSearch} className="w-20 h-20 shrink-0 flex items-center justify-center text-zinc-900 active:scale-95 transition-all">
          {isSearchOpen ? <X size={34} strokeWidth={2} className="text-zinc-500" /> : <Search size={34} strokeWidth={2} />}
        </button>
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex-1 pl-8">
              <input ref={inputRef} type="text" value={query} onChange={(e) => { setQuery(e.target.value); onSearchChange(e.target.value); }} placeholder="SEARCH..." className="w-full bg-transparent border-none outline-none text-2xl font-black text-zinc-900 tracking-tighter" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 2. 排序菜单 (仅在 map 里渲染新选项) */}
      <div className="relative">
        <ToolbarButton onClick={() => setIsSortMenuOpen(!isSortMenuOpen)} icon={<ArrowUpDown size={34} strokeWidth={2} />} active={isSortMenuOpen} />
        <AnimatePresence>
          {isSortMenuOpen && (
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="absolute right-0 mt-4 w-64 bg-white rounded-3xl shadow-2xl ring-1 ring-black/5 p-3 z-50">
              <button onClick={() => onOrderToggle()} className="w-full mb-2 flex items-center justify-between px-4 py-3 bg-zinc-50 hover:bg-zinc-100 rounded-2xl transition-all font-bold group">
                <span className="text-zinc-500">排序方向</span>
                <div className="flex items-center gap-2 text-blue-600 font-black">
                  {isAsc ? <><SortAsc size={20} /> 升序</> : <><SortDesc size={20} /> 降序</>}
                </div>
              </button>
              <div className="h-px bg-zinc-100 my-2" />
              {sortOptions.map((opt) => (
                <button key={opt.id} onClick={() => { onSortChange(opt.id as any); setIsSortMenuOpen(false); }} className="w-full flex items-center gap-4 px-4 py-4 hover:bg-zinc-100 rounded-2xl text-zinc-700 font-bold text-lg active:scale-95">
                  <span className="text-zinc-400">{opt.icon}</span>{opt.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. 布局管理入口 (不动) */}
      <ToolbarButton onClick={() => setIsLayoutOpen(true)} icon={<Layout size={34} strokeWidth={2} />} active={isLayoutOpen} />

      {/* 4. 删除模式 (不动) */}
      <ToolbarButton onClick={handleToggleDeleteMode} icon={isDeleteMode ? <X size={34} strokeWidth={2} /> : <Trash2 size={34} strokeWidth={2} />} danger={!isDeleteMode} active={isDeleteMode} className={isDeleteMode ? "bg-red-600 text-white hover:bg-red-700" : ""} />

      {/* --- 首页布局管理弹窗 (完全还原你的原始尺寸 w-350 h-260 和 结构) --- */}
      <AnimatePresence>
        {isLayoutOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLayoutOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }}
              className="relative w-350 h-260 bg-white rounded-[40px] shadow-2xl flex flex-col overflow-hidden border border-zinc-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8 border-b flex justify-between items-center bg-zinc-50/50">
                <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-3"><Layout size={24} /> 首页展示配置</h2>
                <button onClick={() => setIsLayoutOpen(false)} className="px-8 py-2.5 bg-zinc-900 text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-all">完成</button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* 左侧：拖拽列表 (不动) */}
                <div className="w-[300px] border-r flex flex-col bg-zinc-50/30">
                  <div className="p-6 flex justify-between items-center shrink-0">
                    <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">展示顺序</span>
                    {localDisplayList.length > 0 && <button onClick={handleClearAll} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg"><Eraser size={16} /></button>}
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 pb-6 no-scrollbar" style={noScrollbarStyle}>
                    <Reorder.Group axis="y" values={localDisplayList} onReorder={(newOrder) => {
                      setLocalDisplayList(newOrder);
                      updateConfig(p => { p.basic.gameDisplayOrder = newOrder.map(g => g.id); });
                    }}>
                      <AnimatePresence mode="popLayout">
                        {localDisplayList.map((game) => (
                          <ReorderItem key={game.id} game={game} onRemove={handleToggleDisplay} />
                        ))}
                      </AnimatePresence>
                    </Reorder.Group>
                  </div>
                </div>

                {/* 右侧：选择库 (不动) */}
                <div className="flex-1 bg-white flex flex-col">
                  <div className="p-6 text-[11px] font-black text-zinc-400 uppercase tracking-widest text-center shrink-0">点击海报添加至首页</div>
                  <div className="flex-1 overflow-y-auto p-6 pt-0 grid grid-cols-3 gap-y-8 gap-x-4 no-scrollbar align-content-start" style={{ ...noScrollbarStyle, gridAutoRows: 'max-content' }}>
                    {gameMetaList.map(game => (
                      <GameGridItem key={game.id} game={game} isActive={(config.basic.gameDisplayOrder || []).includes(game.id)} onClick={() => handleToggleDisplay(game.id)} />
                    ))}
                    <div className="h-10 col-span-3"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- 子组件 (保持原样) ---
const ReorderItem = memo(({ game, onRemove }: { game: GameMeta; onRemove: (id: string) => void }) => {
  const dragControls = useDragControls();
  const coverUrl = game.localCover ? convertFileSrc(game.localCover) : game.cover;
  return (
    <Reorder.Item value={game} dragControls={dragControls} dragListener={false} layout className="flex items-center gap-4 p-3 bg-white border border-zinc-100 rounded-2xl mb-3 shadow-sm select-none">
      <div className="cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-500" onPointerDown={(e) => dragControls.start(e)}><GripVertical size={18} /></div>
      <div className="w-10 h-12 rounded-lg overflow-hidden shrink-0 bg-zinc-50"><img src={coverUrl} className="w-full h-full object-cover" /></div>
      <span className="flex-1 font-bold text-xs truncate text-zinc-700">{game.name}</span>
      <button onClick={() => onRemove(game.id)} className="text-zinc-300 hover:text-rose-500 transition-colors"><X size={16} /></button>
    </Reorder.Item>
  );
});

const ToolbarButton: React.FC<{ icon: React.ReactNode; onClick: () => void; danger?: boolean; active?: boolean; className?: string; }> = ({ icon, onClick, danger, active, className }) => (
  <button onClick={onClick} className={cn("w-20 h-20 shrink-0 flex items-center justify-center rounded-[28px] transition-all active:scale-90", active ? "shadow-inner bg-zinc-100" : "text-zinc-900 hover:bg-zinc-100", danger && !active ? "text-zinc-400 hover:text-red-600 hover:bg-red-50" : "", className)}>
    {icon}
  </button>
);

export default TopToolbar;
