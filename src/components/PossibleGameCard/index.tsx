import { PossibleGameInfo } from '@/types/game';
import React, { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

const PossibleGameCard: React.FC<{ data: PossibleGameInfo }> = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSource, setActiveSource] = useState<'vndb' | 'bangumi' | 'ymlgal'>('vndb');

  // 数据提取逻辑
  const displayData = useMemo(() => {
    // vndb数据
    if (activeSource === 'vndb' && data.vndb?.results?.[0]) {
      const item = data.vndb.results[0];
      return {
        name: item.title,
        description: item.description,
        cover: item.image?.url,
        avatar: item.image?.url,
      };
    }
    // bangumi数据
    if (activeSource === 'bangumi' && data.bangumi?.data?.[0]) {
      const item = data.bangumi.data[0];
      return {
        name: item.name_cn || item.name,
        description: item.summary,
        cover: item.images?.large,
        avatar: item.images?.small,
      };
    }
    // 3. Ymgal (月幕) 数据
    if (activeSource === 'ymlgal' && data.ymlgal?.data?.result?.[0]) {
      const item = data.ymlgal.data.result[0];
      return {
        name: item.chineseName || item.name,
        // 月幕列表通常只有基本信息，这里拼一个简介
        description: `发行时间：${item.releaseDate ? new Date(item.releaseDate).toLocaleDateString() : '未知'}\n发行商：${item.orgName || '未知'}\n评分：${item.score || '暂无'}`,
        cover: item.mainImg,
        tag: `月幕评分: ${item.score || 'N/A'}`,
      };
    }
    return { name: "无数据", description: "该源未返回有效信息", cover: "", avatar: "" };
  }, [activeSource, data]);

  return (
    <div
      className={`
        relative w-full overflow-hidden transition-all duration-500 ease-in-out
        bg-zinc-900/60 border border-zinc-800 rounded-xl mb-3
        ${isExpanded ? 'h-80 p-5' : 'h-16 p-2 flex items-center cursor-pointer hover:bg-zinc-800/50'}
      `}
      onClick={() => !isExpanded && setIsExpanded(true)}
    >
      {/* 核心容器：确保左右布局 */}
      <div className="flex flex-row w-full h-full">

        {/* 左侧：封面/头像 (宽度固定，高度自适应) */}
        <div className={`
          flex-shrink-0 transition-all duration-500 ease-in-out overflow-hidden rounded-lg bg-zinc-800
          ${isExpanded ? 'w-44 h-full shadow-2xl' : 'w-12 h-12'}
        `}>
          <img
            src={isExpanded ? displayData.cover : displayData.avatar}
            className="w-full h-full object-cover"
            alt="game-cover"
          />
        </div>

        {/* 右侧：文字与交互区 (占据剩余全部宽度) */}
        <div className={`
          flex flex-col grow min-w-0 transition-all duration-500
          ${isExpanded ? 'ml-6' : 'ml-4 justify-center pr-8'}
        `}>

          {/* 标题 */}
          <h3 className={`
            font-black text-zinc-100 truncate transition-all duration-500
            ${isExpanded ? 'text-3xl mb-2' : 'text-sm'}
          `}>
            {displayData.name}
          </h3>

          {/* 只有展开时显示的简介和换源栏 */}
          {isExpanded && (
            <div className="flex flex-col flex-grow min-h-0 animate-in fade-in duration-700">
              {/* 简介文字：占据剩余空间 */}
              <p className="text-zinc-400 text-sm leading-relaxed line-clamp-5 overflow-y-auto pr-2 mt-2">
                {displayData.description || "暂无简介内容。"}
              </p>

              {/* 底部换源与确认栏 */}
              <div className="mt-auto pt-4 flex items-center justify-between border-t border-zinc-800">
                <div className="flex gap-2">
                  {(['vndb', 'bangumi', 'ymlgal'] as const).map((source) => (
                    <button
                      key={source}
                      disabled={!data[source]} // 如果该源没数据则禁用
                      onClick={(e) => { e.stopPropagation(); setActiveSource(source); }}
                      className={`
                        px-3 py-1 text-[10px] font-bold rounded uppercase transition-all
                        ${activeSource === source
                          ? 'bg-blue-600 text-white border border-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.4)]'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:text-zinc-300 disabled:opacity-30'}
                      `}
                    >
                      {source}
                    </button>
                  ))}
                </div>

                <Button className={cn(
                )}
                  onClick={() => { setIsExpanded(false) }}
                >
                  确认关联
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default PossibleGameCard
