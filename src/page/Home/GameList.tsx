import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
import { convertFileSrc } from '@tauri-apps/api/core';
import useGameStore from "@/store/gameStore";
import { Play } from "lucide-react"; // 确保导入了图标

const GameList = () => {
  const [api, setApi] = useState<CarouselApi>()
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const { selectedGame, updateSelectedGame, gameMetaList } = useGameStore()

  useEffect(() => {
    if (gameMetaList.length > 0) {
      updateSelectedGame(gameMetaList[0])
    }
  }, [gameMetaList])

  // 启动回调
  const handleStartGame = (gameName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    alert(`正在启动游戏: ${gameName}`);
  }

  return (
    <div className="overflow-hidden">
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
          {gameMetaList.map((g, index) => (
            <CarouselItem
              key={g.id}
              className={cn(
                "duration-300 aspect-165/230",
                "rounded-b-2xl sm:basis-1/6 pl-4",
              )}
              onClick={() => {
                setCurrentIndex(index)
                updateSelectedGame(g)
                api?.scrollTo(index, false)
              }}
            >
              <Card className={cn(
                "relative group overflow-hidden border-none", // 必须加 group
                "aspect-165/225 min-w-41.25 min-h-56.25 origin-bottom transition-all duration-300",
                currentIndex != index && "scale-80",
              )}>
                {/* 恢复你原本的逻辑：非选中状态的黑色蒙罩 */}
                {currentIndex != index && <div className="absolute bg-foreground opacity-45 w-full h-full z-10" />}

                {/* 新增：仅在选中卡片上显示的悬浮启动按钮 */}
                {currentIndex === index && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={(e) => handleStartGame(g.name, e)}
                      className="w-26 h-26 flex items-center justify-center bg-emerald-500 hover:bg-emerald-400/90 text-white rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all active:scale-90"
                    >
                      {/* 图标微调：ml-1 解决三角形视觉中心偏移 */}
                      <Play size={32} fill="white" className="ml-1" />
                    </button>
                  </div>
                )}

                <img
                  src={g.local_cover ? convertFileSrc(g.local_cover) : g.cover}
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
