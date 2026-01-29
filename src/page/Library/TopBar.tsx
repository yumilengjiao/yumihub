import React, { useState, useRef, ChangeEvent } from 'react';
import { Search, ArrowUpDown, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { open } from '@tauri-apps/plugin-dialog'
import AddGameButton from './AddGameButton';

interface TopToolbarProps {
  onSearchChange: (value: string) => void;
  onSortClick: () => void;
  onDeleteClick: () => void;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  onSearchChange,
  onSortClick,
  onDeleteClick,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
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

  return (
    /* 整体工具栏：靠右对齐 */
    <div className="flex items-center justify-end gap-4 w-full px-12 pt-10">

      {/* 搜索容器：通过 flex-row-reverse 让内部的 Input 出现在图标左边 */}
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
        {/* 图标按钮：因为它在 flex-row-reverse 容器的最前面，它会固定在组件的最右侧 */}
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

        {/* 输入框：因为容器是 flex-row-reverse，它会向左侧延伸 */}
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

      {/* 排序按钮 */}
      <ToolbarButton
        onClick={onSortClick}
        icon={<ArrowUpDown size={44} strokeWidth={4} />}
      />

      {/* 删除按钮 */}
      <ToolbarButton
        onClick={onDeleteClick}
        icon={<Trash2 size={44} strokeWidth={4} />}
        danger
      />
    </div >
  );
};

const ToolbarButton: React.FC<{ icon: React.ReactNode; onClick: () => void; danger?: boolean }> = ({
  icon, onClick, danger
}) => (
  <button
    onClick={onClick}
    className={cn(
      "w-20 h-20 flex-shrink-0 flex items-center justify-center rounded-[28px] transition-all active:scale-90",
      danger
        ? "text-zinc-400 hover:text-red-600 hover:bg-red-50"
        : "text-zinc-900 hover:bg-zinc-100"
    )}
  >
    {icon}
  </button>
)
export default TopToolbar
