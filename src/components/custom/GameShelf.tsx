import { useEffect, useState, useMemo, useRef } from "react"
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

// 定义组件私有 Props 接口
interface GameShelfUIProps {
  // --- 新增：接收通用样式和类名 ---
  className?: string
  style?: React.CSSProperties

  // --- 原有属性 ---
  height?: string
  itemBasis: string
  gap?: string
  variant?: 'scale' | 'border' | 'glow'
}

const GameShelfUI = ({
  // --- 新增解构 ---
  className,
  style,
  // --- 原有解构 ---
  itemBasis = "sm:basis-1/7",
  gap = "pl-4",
  variant = "scale"
}: GameShelfUIProps) => {
  const [api, setApi] = useState<CarouselApi>()
  const [currentIndex, setCurrentIndex] = useState<number>(0)

  const { selectedGame, gameMetaList, updateSelectedGame } = useGameStore()
  const { config } = useConfigStore()

  //@ts-ignore
  const TAILWIND_GENERATOR_HACK = [
    "sm:basis-1/4", "sm:basis-1/5", "sm:basis-1/6", "sm:basis-1/7", "sm:basis-1/8", "sm:basis-1/9", "sm:basis-1/10", "sm:basis-1/11", "sm:basis-1/12"
  ]
  // --- 逻辑完全保持不变 ---
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
        console.log("第一个游戏是", displayGames[0])
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

  const getCardStyles = (index: number) => {
    const isSelected = currentIndex === index

    switch (variant) {
      case 'border':
        return cn(
          "transition-all duration-300 bg-zinc-900",
          isSelected
            ? "z-10 ring-2 ring-purple-500 ring-offset-4 ring-offset-zinc-900"
            : "opacity-95"
        )
      case 'glow':
        return cn(
          "scale-100 transition-all duration-500",
          isSelected ? "shadow-[0_0_50px_rgba(139,92,246,0.6)] border-2 border-purple-400 z-10" : "opacity-80 blur-[1px]"
        )
      case 'scale':
      default:
        return cn(
          "origin-bottom transition-all duration-300",
          isSelected ? "scale-100 shadow-2xl shadow-custom-500/20" : "scale-85"
        )
    }
  }

  if (displayGames.length === 0) {
    return (
      <div
        // 这里的 Empty 状态也加上 className 和 style，确保布局一致
        className={cn("fixed inset-0 flex flex-col items-center justify-center pointer-events-none select-none", className)}
        style={style}
      >
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
    <div
      // --- 关键修改：应用 node 传入的 className 和 style ---
      // cn 会自动处理 merging，保留了原本的 overflow-hidden w-full
      className={cn("overflow-hidden w-full", className)}
      style={style}
    >
      <Carousel
        opts={{
          dragFree: true,
          align: "start",
          duration: 30,
          containScroll: false,
        }}
        className="ml-2"
        setApi={setApi}
      >
        <CarouselContent
          className={cn(
            "w-screen",
            variant === 'scale' ? "items-end" : "items-center py-4"
          )}
        >
          {displayGames.map((g, index) => (
            <CarouselItem
              key={g.id}
              className={cn(
                "duration-300 aspect-165/230",
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
                getCardStyles(index)
              )}>
                {/* 遮罩 */}
                {currentIndex !== index && (
                  <div className="absolute inset-0 bg-black opacity-45 z-10 transition-opacity duration-300" />
                )}

                {/* 播放按钮 */}
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

                {/* 图片 */}
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

// --- 适配器组件 ---
export const GameShelf: React.FC<ThemeComponentProps> = ({ node }) => {
  const {
    variant,
    basis
  } = node.props

  return (
    <GameShelfUI
      className={node.className}
      style={node.style}
      variant={variant}
      itemBasis={basis}
    />
  )
}

export default GameShelf
