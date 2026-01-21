import { useEffect, useState } from "react"
import { Card, CardContent } from "../ui/card"
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from "../ui/carousel"
import { cn } from "@/lib/utils"
import { invoke } from '@tauri-apps/api/core';
import useGameStore from "@/store/gameStore";
import { GameMeta, GameMetaList } from "@/types/game";


export const GameList = (props: {}) => {
  // ... 在你的组件内部
  const [api, setApi] = useState<CarouselApi>()
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [selectedGame, setSelectedGame] = useState<GameMeta>()
  const { gameMetaList, setGameMetaList } = useGameStore()


  //向状态管理系统拿数据
  async function getGamelist() {
    try {
      const gameList = await invoke<GameMetaList>('get_game_meta_list_cmd')
      setGameMetaList(gameList)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    getGamelist()
    if (!api) return
    // 监听滚动事件
    api.on("select", () => {
      // selectedScrollSnap() 会返回当前对齐在“激活位置”的索引
      // setCurrentIndex(api.selectedScrollSnap())
    })

  }, [api])
  return (
    <div className="overflow-hidden">
      <div className={cn(
        "pl-8 pb-4 text-6xl"
      )}>
        {selectedGame?.name}
      </div>
      {/* 总宽大小 */}
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
                "rounded-b-2xl lg:basis-1/6 pl-4",
              )}
              onClick={(_) => {
                setCurrentIndex(index)
                setSelectedGame(g)
                api?.scrollTo(index, false)
              }}
            >
              <Card className={cn(
                "bg-amber-950 object-cover border-none",
                "aspect-165/225  min-w-41.25 min-h-56.25 origin-bottom transition-all duration-300",
                currentIndex != index && "scale-80"
              )}>
                <CardContent className=" flex aspect-square items-center justify-center">
                  <span className="text-3xl font-semibold">{index + 1}</span>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div >
  )
}
