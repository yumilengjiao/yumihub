import React, { useState, useRef, ChangeEvent } from 'react';
import { SortAsc, SortDesc, Search, ArrowUpDown, Trash2, X, Clock, Type, CalendarDays } from 'lucide-react'; // 引入新图标
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TopToolbarProps {
  isAsc: boolean
  onSearchChange: (value: string) => void
  // 修改排序回调，传递具体的排序规则
  onSortChange: (type: 'duration' | 'name' | 'lastPlayed') => void
  // 删除模式切换回调
  onDeleteModeToggle: (isDeleteMode: boolean) => void
  onOrderToggle: () => void
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  isAsc,
  onSearchChange,
  onSortChange,
  onDeleteModeToggle,
  onOrderToggle,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState<boolean>(false);
  const [isDeleteMode, setIsDeleteMode] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // 处理删除模式切换
  const handleToggleDeleteMode = () => {
    const nextMode = !isDeleteMode;
    setIsDeleteMode(nextMode);
    onDeleteModeToggle(nextMode); // 留给你的逻辑接口
  };

  // 排序规则配置
  const sortOptions = [
    { id: 'duration', label: '按游玩时长', icon: <Clock size={20} /> },
    { id: 'name', label: '按名称排序', icon: <Type size={20} /> },
    { id: 'lastPlayed', label: '按最后游玩', icon: <CalendarDays size={20} /> },
  ] as const;

  return (
    <div className="flex items-center justify-end gap-4 w-full px-12 pt-10">

      {/* 搜索容器 */}
      <motion.div
        layout
        animate={{
          width: isSearchOpen ? 480 : 80,
          backgroundColor: isSearchOpen ? "rgb(244 244 245)" : "transparent"
        }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        className={cn(
          "h-20 flex flex-row-reverse items-center rounded-[28px] overflow-hidden transition-colors",
          isSearchOpen ? "ring-2 ring-zinc-200" : "hover:bg-zinc-100"
        )}
      >
        <button
          onClick={handleToggleSearch}
          className="w-20 h-20 flex-shrink-0 flex items-center justify-center text-zinc-900 active:scale-95 transition-all"
        >
          {isSearchOpen ? (
            <X size={44} strokeWidth={4} className="text-zinc-500" />
          ) : (
            <Search size={44} strokeWidth={4} />
          )}
        </button>

        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 pl-8"
            >
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setQuery(e.target.value);
                  onSearchChange(e.target.value);
                }}
                placeholder="SEARCH..."
                className="w-full bg-transparent border-none outline-none text-2xl font-black text-zinc-900 placeholder:text-zinc-300 tracking-tighter"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 排序按钮 + 弹窗容器 */}
      <div className="relative">
        <ToolbarButton
          onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
          icon={<ArrowUpDown size={44} strokeWidth={4} />}
          active={isSortMenuOpen}
        />

        <AnimatePresence>
          {isSortMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute right-0 mt-4 w-64 bg-white rounded-3xl shadow-2xl ring-1 ring-black/5 p-3 z-50 overflow-hidden"
            >
              <button
                onClick={() => onOrderToggle()} // 切换 isAsc 的值
                className="w-full mb-2 flex items-center justify-between px-4 py-3 bg-zinc-50 hover:bg-zinc-100 rounded-2xl transition-all group"
              >
                <span className="text-zinc-500 font-bold">排序方向</span>
                <div className="flex items-center gap-2 text-blue-600 font-black">
                  {isAsc ? (
                    <><SortAsc size={20} /> 升序</>
                  ) : (
                    <><SortDesc size={20} /> 降序</>
                  )}
                </div>
              </button>

              <div className="h-[1px] bg-zinc-100 my-2" />
              {sortOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    onSortChange(opt.id);
                    setIsSortMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-4 px-4 py-4 hover:bg-zinc-100 rounded-2xl transition-colors text-zinc-700 font-bold text-lg active:scale-95"
                >
                  <span className="text-zinc-400">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 删除模式切换按钮 */}
      <ToolbarButton
        onClick={handleToggleDeleteMode}
        icon={isDeleteMode ? <X size={44} strokeWidth={4} /> : <Trash2 size={44} strokeWidth={4} />}
        danger={!isDeleteMode}
        active={isDeleteMode}
        className={isDeleteMode ? "bg-red-600 text-white hover:bg-red-700" : ""}
      />
    </div >
  );
};

// 增强 ToolbarButton，支持 active 状态和自定义 className
const ToolbarButton: React.FC<{
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  active?: boolean;
  className?: string;
}> = ({
  icon, onClick, danger, active, className
}) => (
    <button
      onClick={onClick}
      className={cn(
        "w-20 h-20 shrink-0 flex items-center justify-center rounded-[28px] transition-all active:scale-90",
        active ? "shadow-inner" : "",
        danger
          ? "text-zinc-400 hover:text-red-600 hover:bg-red-50"
          : "text-zinc-900 hover:bg-zinc-100",
        className
      )}
    >
      {icon}
    </button>
  )

export default TopToolbar
