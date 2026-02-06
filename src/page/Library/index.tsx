import useGameStore from "@/store/gameStore"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { convertFileSrc } from "@tauri-apps/api/core"
import TopBar from "./TopBar"
import AddGameButton from "./AddGameButton"
import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { GameMeta } from "@/types/game"
import { X, SearchX, LibraryBig } from "lucide-react"
import { useNavigate } from "react-router"
import { Trans } from "@lingui/react/macro"

export default function Library() {
  const { gameMetaList, discardGame, filterGameMetaListByName } = useGameStore()
  const [discardMode, setDiscardMode] = useState<boolean>(false)
  const [isAsc, setIsAsc] = useState<boolean>(false)
  const [sortMode, setSortMode] = useState<"duration" | "name" | "lastPlayed" | "passed">("lastPlayed")
  const [keyword, setKeyword] = useState<string>("")
  const navigate = useNavigate()

  const displayGames = useMemo(() => {
    if (sortMode == "passed") {
      return filterGameMetaListByName(keyword).filter(g => g.isPassed)
    }
    return [...filterGameMetaListByName(keyword)].sort((ga, gb) => {
      let result = 0
      switch (sortMode) {
        case "duration":
          result = (gb.playTime || 0) - (ga.playTime || 0);
          break
        case "name":
          result = ga.name.localeCompare(gb.name, 'zh-CN');
          break
        case "lastPlayed":
          const valA = ga?.lastPlayedAt ? new Date(ga.lastPlayedAt).getTime() : 0;
          const valB = gb?.lastPlayedAt ? new Date(gb.lastPlayedAt).getTime() : 0;
          result = valB - valA;
          break;
        default:
          return 0;
      }
      return isAsc ? result : -result
    })
  }, [sortMode, keyword, isAsc, gameMetaList])

  useEffect(() => {
    return () => {
      setDiscardMode(false);
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col pt-[5vh] bg-primary-foreground relative min-h-screen">
      {/* 保持原样：添加游戏按钮 */}
      <AddGameButton />

      {/* 保持原样：顶部工具栏 */}
      <div className="w-full shrink-0 p-2 z-10">
        <TopBar
          isAsc={isAsc}
          onOrderToggle={() => setIsAsc(!isAsc)}
          onDeleteModeToggle={setDiscardMode}
          onSearchChange={setKeyword}
          onSortChange={setSortMode}
        />
      </div>

      {/* 列表区域 */}
      <div className="w-full flex-1 overflow-y-auto p-2">
        {displayGames.length > 0 ? (
          <div className={cn(
            "grid gap-6 px-15 w-full",
            "grid-cols-[repeat(auto-fill,minmax(150px,1fr))]"
          )}>
            {displayGames.map((g: GameMeta) => (
              <Card
                key={g.id}
                className="aspect-165/230 relative overflow-hidden cursor-pointer
                border-3 ring-1 ring-black/5 shadow-xl shadow-blue-500/10"
                onClick={() => navigate(`/game/${g.id}`)}
              >
                <AnimatePresence>
                  {discardMode && (
                    <motion.button
                      initial={{ scale: 0, opacity: 0, rotate: -45 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0, opacity: 0, rotate: 45 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        discardGame(g.id)
                      }}
                      className="absolute top-3 right-3 z-30 w-10 h-10 bg-red-500/60 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600"
                    >
                      <X size={24} strokeWidth={3} />
                    </motion.button>
                  )}
                </AnimatePresence>

                <div className={cn(
                  "w-full h-full transition-all duration-300",
                  discardMode ? "scale-95 blur-[1px] grayscale-[0.3]" : ""
                )}>
                  <img
                    src={g.localCover ? convertFileSrc(g.localCover) : g.cover}
                    className="w-full h-full object-cover"
                    alt={g.name}
                  />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-700">
              <div className="p-10 rounded-full bg-black/3 mb-6">
                {keyword ? (
                  <SearchX size={100} className="text-black/10" />
                ) : (
                  <LibraryBig size={100} className="text-black/10" />
                )}
              </div>
              <h3 className="text-3xl font-bold text-black/20 tracking-[0.2em] uppercase">
                <Trans>
                  {keyword ? "无匹配项" : "库中无数据"}
                </Trans>
              </h3>
              <p className="text-black/10 text-base mt-4 tracking-widest font-light">
                <Trans>
                  {keyword ? "尝试调整搜索关键词" : "点击上方按钮开始收藏游戏"}
                </Trans>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
