import { useEffect, useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
import { convertFileSrc, invoke } from '@tauri-apps/api/core'
import useGameStore from "@/store/gameStore"
import useConfigStore from "@/store/configStore"
import { Play, Ghost } from "lucide-react"
import { Cmds } from "@/lib/enum"
import { GameMeta } from "@/types/game"
import { Trans } from "@lingui/react/macro"
import { ThemeComponentProps } from "@/types/node"

// 定义组件私有 Props 接口，用于 UI 渲染
interface GameShelfUIProps {
  height?: string;
  itemBasis?: string;
  gap?: string;
  variant?: 'scale' | 'border' | 'glow';
}

const GameShelfUI = ({
  height = "h-auto",
  itemBasis = "sm:basis-1/6",
  gap = "pl-4",
  variant = "scale"
}: GameShelfUIProps) => {
  const [api, setApi] = useState<CarouselApi>()
  const [currentIndex, setCurrentIndex] = useState<number>(0)

  const { selectedGame, gameMetaList, updateSelectedGame } = useGameStore()
  const { config } = useConfigStore()

  // --- 完全保留你的原版逻辑 ---
  const displayGames = useMemo(() => {
    const orderIds = config.basic.gameDisplayOrder || []
    return orderIds
      .map(id => gameMetaList.find(game => game.id === id))
      .filter((game): game is GameMeta => !!game && game.isDisplayed)
  }, [gameMetaList, config.basic.gameDisplayOrder])

  useEffect(() => {
    if (displayGames.length > 0) {
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
  }, [displayGames, api, selectedGame?.id])

  const handleStartGame = (game: GameMeta, e: React.MouseEvent) => {
    e.stopPropagation()
    invoke(Cmds.START_GAME, { game: game })
  }

  // --- 样式计算：根据 variant 决定类名 ---
  const getCardStyles = (index: number) => {
    const isSelected = currentIndex === index;

    switch (variant) {
      case 'border':
        return cn(
          "transition-all duration-300 bg-zinc-900",
          isSelected
            ? "z-10 ring-2 ring-purple-500 ring-offset-4 ring-offset-zinc-900"
            : "opacity-50"
        );
      case 'glow': // 变体：等大 + 霓虹光晕
        return cn(
          "scale-100 transition-all duration-500",
          isSelected ? "shadow-[0_0_50px_rgba(139,92,246,0.6)] border-2 border-purple-400 z-10" : "opacity-40 blur-[1px]"
        );
      case 'scale': // 变体：原版缩放
      default:
        return cn(
          "origin-bottom transition-all duration-300",
          isSelected ? "scale-100 shadow-2xl shadow-custom-500/20" : "scale-80"
        );
    }
  }

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
    <div className={cn("overflow-hidden w-full")}>
      {/* 标题：保留原版样式 */}
      <div className="pl-8 pb-2 text-6xl text-white font-bold transition-all duration-500"
        style={{
          WebkitTextStroke: '2px black',
          paintOrder: 'stroke fill',
        }}>
        {selectedGame?.name}
      </div>

      <Carousel
        opts={{
          dragFree: true,   // 保留拖拽自由
          align: "start",   // 保留对齐
          duration: 30,     // 保留动画时间
          containScroll: false,
        }}
        className="ml-2"
        setApi={setApi}
      >
        <CarouselContent
          className={cn(
            "w-screen",
            variant === 'scale' ? "items-end" : "items-center py-10" // 非缩放模式给点上下间距留给边框/光晕
          )}
        >
          {displayGames.map((g, index) => (
            <CarouselItem
              key={g.id}
              className={cn(
                "duration-300 aspect-165/230", // 强制比例锁定
                itemBasis,
                gap,
                "cursor-pointer"
              )}
              onClick={() => {
                setCurrentIndex(index)
                updateSelectedGame(g)
                api?.scrollTo(index, false)
              }}
            >
              <Card className={cn(
                "relative group overflow-hidden border-none",
                "aspect-165/225 min-w-41.25 min-h-56.25",
                getCardStyles(index) // 根据变体应用样式
              )}>
                {/* 遮罩：保留原版 */}
                {currentIndex !== index && (
                  <div className="absolute inset-0 bg-black opacity-45 z-10 transition-opacity duration-300" />
                )}

                {/* 播放按钮：保留原版 */}
                {currentIndex === index && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={(e) => handleStartGame(g, e)}
                      className="w-20 h-20 flex items-center justify-center bg-custom-500 hover:bg-custom-400 text-white rounded-full shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all active:scale-90"
                    >
                      <Play size={32} fill="white" className="ml-1" />
                    </button>
                  </div>
                )}

                {/* 图片：强制铺满，防止比例不一导致的高矮问题 */}
                <img
                  src={g.localCover ? convertFileSrc(g.localCover) : g.cover}
                  alt={g.name}
                  className="h-full w-full object-cover select-none"
                />
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  )
}

// --- 适配器组件：对接低代码引擎 ---
export const GameShelf: React.FC<ThemeComponentProps> = ({ node }) => {
  const style = node.style || {};

  return (
    <GameShelfUI
      height={style.height as string}
      gap={style.gap as string}
      itemBasis={style.itemBasis as string}
      variant={style.variant as any}
    />
  );
};

export default GameShelf;
