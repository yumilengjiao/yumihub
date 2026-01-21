import { useEffect, useState } from "react"
import { Card, CardContent } from "../ui/card"
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from "../ui/carousel"
import { cn } from "@/lib/utils"
import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import useGameStore from "@/store/gameStore";
import { GameMetaList } from "@/types/game";


export const GameList = (props: {}) => {
  // ... 在你的组件内部
  const [api, setApi] = useState<CarouselApi>()
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const { selectedGame, updateSelectedGame, gameMetaList, setGameMetaList } = useGameStore()


  //向状态管理系统拿数据
  async function getGamelist() {
    try {
      const gameList = await invoke<GameMetaList>('get_game_meta_list_cmd')
      setGameMetaList(gameList)

      updateSelectedGame(gameList[0])
    } catch (err) {
      console.error(err)
    }
  }
  useEffect(() => {
    getGamelist()
  }, [])

  return (
    <div className="overflow-hidden">
      {/* 总宽大小 */}
      <div className="pl-8 pb-2 text-6xl text-primary">
        {selectedGame?.name}
      </div>
      <Carousel
        opts={{
          dragFree: true,
          align: "start",
          duration: 60,
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
                currentIndex != index && "scale-80"
              )}>
                <div className=" w-full">
                  <img
                    src={convertFileSrc(g.cover)}
                    className="h-full w-full object-cover"
                  />
                </div>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div >
  )
}
