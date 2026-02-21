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
import useConfigStore from "@/store/configStore"

export default function Library() {
  const { gameMetaList, discardGame, filterGameMetaListByName } = useGameStore()
  // 获取全局背景配置（此时它应该是一个包含 path, opacity, blur 等属性的对象）
  const globalBackground = useConfigStore(state => state.config.interface.globalBackground)
  const [discardMode, setDiscardMode] = useState<boolean>(false)
  const [isAsc, setIsAsc] = useState<boolean>(false)
  const [sortMode, setSortMode] = useState<"duration" | "name" | "lastPlayed" | "passed">("lastPlayed")
  const [keyword, setKeyword] = useState<string>("")
  const navigate = useNavigate()

  // --- 解析背景配置属性 ---
  const { bgPath, bgOpacity, bgBlur } = useMemo(() => {
    // 兼容处理：如果 globalBackground 还是原来的字符串，就把它当成路径
    if (typeof globalBackground === "string") {
      return { bgPath: globalBackground, bgOpacity: 1, bgBlur: 0 }
    }
    // 否则正常解析对象中的属性（提供默认值防崩溃）
    return {
      bgPath: globalBackground.path || "",
      bgOpacity: globalBackground.opacity ?? 1, // 默认不透明
      bgBlur: globalBackground.blur ?? 0        // 默认不模糊
    }
  }, [globalBackground])

  // --- 生成独立背景层的样式 ---
  const bgStyle = useMemo(() => {
    if (!bgPath || bgPath.trim() === "") return null;
    console.log("图片的背景地址: ", bgPath)

    return {
      backgroundImage: `url("${convertFileSrc(bgPath)}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      opacity: bgOpacity,
      filter: bgBlur > 0 ? `blur(${bgBlur}px)` : "none",
      // 核心优化：模糊会导致图片边缘往内缩露出底色，使用稍微放大来完美掩盖边缘
      transform: bgBlur > 0 ? `scale(${1 + bgBlur * 0.02})` : "none",
    };
  }, [bgPath, bgOpacity, bgBlur]);

  const displayGames = useMemo(() => {
    if (sortMode == "passed") {
      return filterGameMetaListByName(keyword).filter(g => g.isPassed)
    }
    return [...filterGameMetaListByName(keyword)].sort((ga, gb) => {
      let result = 0
      switch (sortMode) {
        case "duration":
          result = (gb.playTime || 0) - (ga.playTime || 0)
          break
        case "name":
          result = ga.name.localeCompare(gb.name, 'zh-CN')
          break
        case "lastPlayed":
          const valA = ga?.lastPlayedAt ? new Date(ga.lastPlayedAt).getTime() : 0
          const valB = gb?.lastPlayedAt ? new Date(gb.lastPlayedAt).getTime() : 0
          result = valB - valA
          break
        default:
          return 0
      }
      return isAsc ? result : -result
    })
  }, [sortMode, keyword, isAsc, gameMetaList])

  useEffect(() => {
    return () => {
      setDiscardMode(false)
    }
  }, [])

  return (
    <div className="w-full h-full flex flex-col bg-zinc-200 dark:bg-zinc-900 relative pt-5 overflow-hidden">

      {bgStyle && (
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={bgStyle}
        />
      )}

      {/* 原有内容：给内容层加上 relative 和 z-10，确保它们浮在背景图上面 */}
      <div className="relative z-10">
        <AddGameButton />
      </div>

      {/* 保持原样：顶部工具栏 */}
      <div className="w-full shrink-0 p-2 relative z-10">
        <TopBar
          isAsc={isAsc}
          onOrderToggle={() => setIsAsc(!isAsc)}
          onDeleteModeToggle={setDiscardMode}
          onSearchChange={setKeyword}
          onSortChange={setSortMode}
        />
      </div>

      {/* 列表区域 */}
      <div className="w-full flex-1 overflow-y-auto min-h-0 p-2 h-100 relative z-10">
        {
          displayGames.length > 0 ? (
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
                          e.stopPropagation()
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
          )
        }
      </div>
    </div>
  )
}
