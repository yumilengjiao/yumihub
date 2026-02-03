import { GameMetaList } from "@/types/game";
import { Trans } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";
import { Camera, Clock } from "lucide-react"; // 增加小图标提升精致感

const GameJourney = ({ games }: { games: GameMetaList }) => {
  // 1. 新用户空状态展示 (保留原逻辑)
  if (!games || games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <div className="text-6xl opacity-20 animate-pulse">🍃</div>
        <div>
          <h3 className="text-zinc-400 font-medium text-sm">
            <Trans>还没有开启任何物语</Trans>
          </h3>
          <p className="text-zinc-600 text-[11px] mt-2 leading-relaxed">
            <Trans>
              在游戏仓库添加你的第一款 Galgame，
              <br />
            </Trans>
            <Trans>让时间在这里留下足迹。</Trans>
          </p>
        </div>
      </div>
    );
  }

  // 模拟假数据：假设每个游戏有几张截图
  // 实际开发中，这些数据应来自 game 对象内部
  const mockScreenshots = [
    {
      url: "https://images.unsplash.com/photo-1614732414444-af9613f3f1a3?q=80&w=500",
      time: "2024-03-20 14:20",
    },
    {
      url: "https://images.unsplash.com/photo-1578632738981-433035c598b4?q=80&w=500",
      time: "2024-03-19 23:10",
    },
  ];

  return (
    <div className="flex flex-col h-full gap-5 overflow-y-auto pr-2 custom-scrollbar">
      {/* 头部装饰 */}
      <div className="flex justify-between items-end px-1 border-b border-zinc-800 pb-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
            Memory Gallery
          </span>
          <span className="text-[18px] text-zinc-200 font-serif italic">游玩历程</span>
        </div>
        <span className="text-[10px] text-zinc-600 font-mono">
          Items: {games.length.toString().padStart(2, "0")}
        </span>
      </div>

      <div className="grid gap-6">
        {games.map((game, index) => (
          <div
            key={game.id}
            className="group relative flex flex-col bg-zinc-900/40 border border-zinc-800/50 rounded-lg overflow-hidden transition-all duration-500 hover:border-zinc-700/50 hover:shadow-2xl hover:shadow-black/50"
          >
            {/* 1. 游戏截图展示区 (关键改动) */}
            <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
              <img
                src={mockScreenshots[index % 2].url} // 使用假截图
                alt="Screenshot"
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
              />

              {/* 截图左上角的时间戳标签 */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10 text-[9px] text-zinc-300 font-mono">
                <Camera size={10} className="text-zinc-400" />
                {mockScreenshots[index % 2].time}
              </div>

              {/* 底部信息遮罩 */}
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent pointer-events-none" />
            </div>

            {/* 2. 底部悬浮信息栏 */}
            <div className="absolute bottom-0 inset-x-0 p-3 flex gap-3 items-end">
              {/* 封面图：小尺寸悬浮感 */}
              <div className="w-14 h-20 flex-shrink-0 rounded shadow-2xl border border-white/10 overflow-hidden z-20 transform -translate-y-2 group-hover:-translate-y-3 transition-transform duration-500">
                <img
                  src={game.local_cover || game.cover}
                  alt={game.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* 文字信息 */}
              <div className="flex-1 min-w-0 pb-1 z-20">
                <h4 className="text-sm font-bold text-white truncate drop-shadow-md mb-1">
                  {game.name}
                </h4>
                <div className="flex items-center gap-3 text-zinc-400 text-[10px]">
                  <div className="flex items-center gap-1">
                    <Clock size={10} />
                    <span>{(game.playTime / 60).toFixed(1)}h</span>
                  </div>
                  <div className="h-2 w-[1px] bg-zinc-700" />
                  <span className="truncate">
                    {game.lastPlayedAt
                      ? game.lastPlayedAt
                      : t`尚未开始`}
                  </span>
                </div>
              </div>

              {/* 装饰图标 */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 pb-2">
                <div className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors border border-white/5">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameJourney
