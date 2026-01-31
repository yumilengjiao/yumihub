import { GameMetaList } from "@/types/game";

const GameJourney = ({ games }: { games: GameMetaList }) => {
  // 1. 新用户空状态展示
  if (!games || games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <div className="text-6xl opacity-20">🍃</div>
        <div>
          <h3 className="text-zinc-400 font-medium text-sm">还没有开启任何物语</h3>
          <p className="text-zinc-600 text-[11px] mt-2">
            在游戏仓库添加你的第一款 Galgame，<br />
            让时间在这里留下足迹。
          </p>
        </div>
      </div>
    );
  }

  // 2. 有数据时的游玩历程列表
  return (
    <div className="flex flex-col h-full gap-4 overflow-y-auto pr-2 custom-scrollbar">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Recent Journey</span>
        <span className="text-[10px] text-zinc-600 italic">History Count: {games.length}</span>
      </div>

      {games.map((game) => (
        <div
          key={game.id}
          className="relative overflow-hidden group bg-zinc-900/40 border border-zinc-700/50 rounded-md p-2 hover:bg-zinc-800/60 transition-all duration-300"
        >
          {/* 背景微弱渐变图 (利用你接口里的 background) */}
          <div
            className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none bg-cover bg-center"
            style={{ backgroundImage: `url(${game.local_background || game.background})` }}
          />

          <div className="relative z-10 flex gap-3">
            {/* 封面 (优先使用本地封面) */}
            <div className="w-12 h-16 flex-shrink-0 rounded shadow-md overflow-hidden bg-zinc-800">
              <img
                src={game.local_cover || game.cover}
                alt={game.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* 核心信息 */}
            <div className="flex flex-col justify-between flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h4 className="text-xs font-bold text-zinc-200 truncate pr-2">{game.name}</h4>
                {/* 进度显示 (playTime / length) */}
                <span className="text-[9px] text-emerald-500/80 font-mono">
                  {Math.round((game.playTime / game.length) * 100)}%
                </span>
              </div>

              {/* 游玩统计条 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] text-zinc-500">
                  <span>游玩时长: {(game.playTime / 60).toFixed(1)}h</span>
                  <span>{game.lastPlayedAt ? game.lastPlayedAt.toLocaleDateString() : '尚未开始'}</span>
                </div>
                {/* 进度条 */}
                <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-zinc-600 to-zinc-400 transition-all duration-700"
                    style={{ width: `${Math.min(100, (game.playTime / game.length) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GameJourney;
