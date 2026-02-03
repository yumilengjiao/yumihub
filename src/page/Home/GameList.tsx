import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import useGameStore from "@/store/gameStore";
import { Play, Ghost } from "lucide-react";
import { Cmds } from "@/lib/enum";
import { GameMeta } from "@/types/game";

const GameList = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [displayGames, setDisplayGames] = useState<any[]>([]);

  const { selectedGame, updateSelectedGame, gameMetaList } = useGameStore();

  // 监听数据变化，同步显示列表
  useEffect(() => {
    const filtered = gameMetaList.filter(game => game.isDisplayed);
    setDisplayGames(filtered);

    // 初始选中逻辑
    if (filtered.length > 0) {
      if (!selectedGame || !filtered.find(g => g.id === selectedGame.id)) {
        updateSelectedGame(filtered[0]);
        setCurrentIndex(0);
      }
    } else {
      updateSelectedGame(null);
    }
  }, [gameMetaList]);

  // 启动回调
  const handleStartGame = (game: GameMeta, e: React.MouseEvent) => {
    e.stopPropagation();
    invoke(Cmds.START_GAME, { game: game })
  };

  if (displayGames.length === 0) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-1000">
          <Ghost size={120} className="text-white/5 mb-8" />
          <h2 className="text-5xl font-black text-white/10 tracking-[0.4em] uppercase"
            style={{ WebkitTextStroke: '1px rgba(255,255,255,0.02)' }}>
            Empty Library
          </h2>
          <p className="text-white/5 text-sm tracking-[0.6em] mt-6 font-light">
            请在库设置中添加首页展示项目
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* 游戏标题 */}
      <div className="pl-8 pb-2 text-6xl text-white font-bold" style={{ WebkitTextStroke: '2px black' }}>
        {selectedGame?.name}
      </div>

      <Carousel
        opts={{
          dragFree: true,
          align: "start",
          duration: 30,
          containScroll: false,
        }}
        className="pl-4"
        setApi={setApi}
      >
        <CarouselContent className="items-end w-screen">
          {displayGames.map((g, index) => (
            <CarouselItem
              key={g.id}
              className={cn(
                "duration-300 aspect-165/230",
                "rounded-b-2xl sm:basis-1/6 pl-4",
              )}
              onClick={() => {
                setCurrentIndex(index);
                updateSelectedGame(g);
                api?.scrollTo(index, false)
              }}
            >
              <Card className={cn(
                "relative group overflow-hidden border-none",
                "aspect-165/225 min-w-41.25 min-h-56.25 origin-bottom transition-all duration-300",
                currentIndex !== index && "scale-80",)
              }>
                {/* 恢复：非选中状态的黑色蒙罩 */}
                {currentIndex !== index && <div className="absolute bg-foreground opacity-45 w-full h-full z-10" />}

                {/* 恢复：仅在选中卡片上显示的悬浮启动按钮 */}
                {currentIndex === index && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={(e) => handleStartGame(g, e)}
                      className="w-26 h-26 flex items-center justify-center bg-emerald-500 hover:bg-emerald-400/90 text-white rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all active:scale-90"
                    >
                      <Play size={32} fill="white" className="ml-1" />
                    </button>
                  </div>
                )}

                <img
                  src={g.localCover ? convertFileSrc(g.localCover) : g.cover}
                  className="h-full w-full object-cover"
                />
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  )
}

export default GameList
