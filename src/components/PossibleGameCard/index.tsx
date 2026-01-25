import { cn } from '@/lib/utils';
import React from 'react';

// 这里的类型你可以直接引用你定义的 PossibleGameInfo
interface PossibleGameCardProps {
  name: string;
  path?: string;
  onSelect?: () => void;
}
const PossibleGameCard: React.FC<PossibleGameCardProps> = ({ name, path, onSelect }) => {
  return (
    <div className={cn(
      "group w-full my-2 flex items-center justify-between p-3 bg-zinc-900/40",
      "border border-zinc-800 rounded-lg hover: bg-zinc-800/60 transition-all cursor-default"
    )}>
      {/* 左侧信息区 */}
      <div className="flex flex-col min-w-0 mr-4">
        <span className="text-sm font-medium text-zinc-100 truncate">
          {name || "识别中..."}
        </span>
        {path && (
          <span className="text-[11px] text-zinc-500 truncate mt-0.5 font-mono">
            {path}
          </span>
        )}
      </div>

      {/* 右侧操作区：占满宽高比较短的关键在于这里的紧凑设计 */}
      <button
        onClick={onSelect}
        className="shrink-0 px-3 py-1 text-xs bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded hover:bg-blue-600 hover:text-white transition-colors"
      >
        选择
      </button>
    </div>
  );
};

export default PossibleGameCard;
