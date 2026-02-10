import { useEffect, useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
import { convertFileSrc, invoke } from '@tauri-apps/api/core'
import useGameStore from "@/store/gameStore"
import useConfigStore from "@/store/configStore" // 引入 configStore
import { Play, Ghost } from "lucide-react"
import { Cmds } from "@/lib/enum"
import { GameMeta } from "@/types/game"
import { Trans } from "@lingui/react/macro"

const GameList = () => {
  const [api, setApi] = useState<CarouselApi>()
  const [currentIndex, setCurrentIndex] = useState<number>(0)

  const { selectedGame, updateSelectedGame, gameMetaList } = useGameStore()
  const { config } = useConfigStore()

  // --- 根据 Config 中的 displayGameOrder 重组游戏列表 ---
  const displayGames = useMemo(() => {
    const orderIds = config.basic.gameDisplayOrder || []

    // 根据 ID 顺序找到对应的游戏对象
    // 同时确保该游戏确实存在于 gameMetaList 中且 isDisplayed 为 1 (双重保险)
    return orderIds
      .map(id => gameMetaList.find(game => game.id === id))
      .filter((game): game is GameMeta => !!game && game.isDisplayed)
  }, [gameMetaList, config.basic.gameDisplayOrder])

  // 监听显示列表变化，处理选中逻辑
  useEffect(() => {
    if (displayGames.length > 0) {
      // 如果当前没有选中游戏，或者选中的游戏不在现在的显示列表里了，默认选第一个
      const isSelectedValid = selectedGame && displayGames.some(g => g.id === selectedGame.id)

      if (!isSelectedValid) {
        updateSelectedGame(displayGames[0])
        setCurrentIndex(0)
        api?.scrollTo(0, false)
      } else {
        const newIdx = displayGames.findIndex(g => g.id === selectedGame?.id)
        setCurrentIndex(newIdx)
      }
    } else {
      updateSelectedGame(null)
    }
  }, [displayGames, api])

  // 启动回调
  const handleStartGame = (game: GameMeta, e: React.MouseEvent) => {
    e.stopPropagation()
    invoke(Cmds.START_GAME, { game: game })
  }

  // 空库状态
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
            <Trans>请在库设置中添加首页展示项目</Trans>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden">
      {/* 游戏标题：带外边描边效果 */}
      <div className="pl-8 pb-2 text-6xl text-white font-bold transition-all duration-500"
        style={{
          WebkitTextStroke: '2px black',
          paintOrder: 'stroke fill',
        }}>
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
                "rounded-b-2xl sm:basis-1/6 pl-4 cursor-pointer",
              )}
              onClick={() => {
                setCurrentIndex(index)
                updateSelectedGame(g)
                api?.scrollTo(index, false)
              }}
            >
              <Card className={cn(
                "relative group overflow-hidden border-none",
                "aspect-165/225 min-w-41.25 min-h-56.25 origin-bottom transition-all duration-300",
                currentIndex !== index ? "scale-80" : "scale-100 shadow-2xl shadow-custom-500/20",
              )}>
                {/* 非选中状态的黑色蒙罩 */}
                {currentIndex !== index && (
                  <div className="absolute inset-0 bg-black opacity-45 z-10 transition-opacity duration-300" />
                )}

                {/* 仅在选中卡片上显示的启动按钮 */}
                {currentIndex === index && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={(e) => handleStartGame(g, e)}
                      className="w-20 h-20 flex items-center justify-center bg-custom-500 hover:bg-custom-400 text-white rounded-full shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all active:scale-90"
                    >
                      <Play size={32} fill="white" className="ml-1" />
                    </button>
                  </div>
                )}

                <img
                  src={g.localCover ? convertFileSrc(g.localCover) : g.cover}
                  alt={g.name}
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
