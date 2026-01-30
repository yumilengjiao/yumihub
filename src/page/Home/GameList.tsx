import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
import { convertFileSrc } from '@tauri-apps/api/core';
import useGameStore from "@/store/gameStore";

const GameList = () => {
  // ... 在你的组件内部
  const [api, setApi] = useState<CarouselApi>()
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const { selectedGame, updateSelectedGame, gameMetaList } = useGameStore()

  return (
    <div className="overflow-hidden">
      {/* 总宽大小 */}
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
        {/* 可视大小 */}
        <CarouselContent className="items-end w-screen">
          {gameMetaList.map((g, index) => (
            <CarouselItem
              key={g.id}
              className={cn(
                "duration-300 aspect-165/225", // 动画放在这里
                "rounded-b-2xl lg:basis-1/6 pl-4 ",
              )}
              onClick={(_) => {
                setCurrentIndex(index)
                updateSelectedGame(g)
                api?.scrollTo(index, false)
              }}
            >
              <Card className={cn(
                "object-cover border-none",
                "aspect-165/225  min-w-41.25 min-h-56.25 origin-bottom transition-all duration-300",
                currentIndex != index && "scale-80",
              )}>
                {currentIndex != index && <div className="absolute bg-foreground opacity-45 w-full h-full" />}
                <img
                  src={g.local_cover ? convertFileSrc(g.local_cover) : g.cover}
                  className="h-full w-full object-cover"
                />
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div >
  )
}

export default GameList
