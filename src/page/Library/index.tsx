import useGameStore from "@/store/gameStore"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { convertFileSrc } from "@tauri-apps/api/core"
import TopBar from "./TopBar"
import AddGameButton from "./AddGameButton"
import { useEffect, useMemo, useState } from "react"
import { AnimatePresence } from "framer-motion"
import { motion } from 'framer-motion'
import { GameMeta } from "@/types/game"
import { X } from "lucide-react"
import { useNavigate } from "react-router"

export default function Library() {
  const { gameMetaList, discardGame, filterGameMetaListByName } = useGameStore()
  const [discardMode, setDiscardMode] = useState<boolean>(false)
  const [isAsc, setIsAsc] = useState<boolean>(false); // 默认降序（从大到小/最新）
  const [sortMode, setSortMode] = useState<"duration" | "name" | "lastPlayed">("lastPlayed")
  const [keyword, setKeyword] = useState<string>("")
  const navigate = useNavigate()

  const displayGames = useMemo(() => {
    return [...filterGameMetaListByName(keyword)].sort((ga, gb) => {
      let result = 0
      switch (sortMode) {
        case "duration":
          // 假设 duration 是数字，按时长从大到小排
          result = (gb.playTime || 0) - (ga.playTime || 0);
          break
        case "name":
          // 按名称字母顺序排
          result = ga.name.localeCompare(gb.name, 'zh-CN');
          break
        case "lastPlayed":
          const valA = ga?.lastPlayedAt ? new Date(ga.lastPlayedAt).getTime() : 0;
          const valB = gb?.lastPlayedAt ? new Date(gb.lastPlayedAt).getTime() : 0;
          result = valB - valA; // 降序：最新的在上面
          break;
        default:
          return 0;
      }
      return isAsc ? result : -result
    })
  }, [sortMode, keyword, isAsc, gameMetaList])

  useEffect(() => {
    return () => {
      // 当组件销毁时，退出删除模式
      setDiscardMode(false);
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col pt-[5vh] bg-primary-foreground">
      <AddGameButton />
      <div className="w-full flex-1/8 p-2">
        <TopBar
          isAsc={isAsc}
          onOrderToggle={() => setIsAsc(!isAsc)}
          onDeleteModeToggle={setDiscardMode}
          onSearchChange={setKeyword}
          onSortChange={setSortMode} />
      </div>
      <div className="w-full h-full overflow-y-auto p-2">
        <div className={cn(
          "grid gap-6 px-15 w-full",
          "grid-cols-[repeat(auto-fill,minmax(250px,1fr))]",
        )}>
          {displayGames.map((g: GameMeta) => (
            <Card
              key={g.id}
              className="relative overflow-hidden cursor-pointer border-3 ring-1 ring-black/5 shadow-xl shadow-blue-500/10"
              onClick={() => navigate(`/game/${g.id}`)}
            >
              {/* 1. 垃圾桶模式下的红色叉叉 */}
              <AnimatePresence>
                {discardMode && (
                  <motion.button
                    initial={{ scale: 0, opacity: 0, rotate: -45 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0, rotate: 45 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation(); // 阻止触发卡片的点击事件
                      discardGame(g.id)
                    }}
                    className="absolute top-3 right-3 z-30 w-10 h-10 bg-red-500/60 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <X size={24} strokeWidth={3} />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* 2. 原有的图片逻辑 */}
              <div className={cn(
                "w-full h-full transition-all duration-300",
                discardMode ? "scale-95 blur-[1px] grayscale-[0.3]" : "" // 模式开启时给图片一点视觉变化
              )}>
                <img
                  src={g.local_cover ? convertFileSrc(g.local_cover) : g.cover}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* 3. 如果想让卡片在删除模式下抖动，可以给外层加个动画容器 */}
              {discardMode && (
                <motion.div
                  animate={{ rotate: [0, -1, 1, -1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.3 }}
                  className="absolute inset-0 pointer-events-none ring-4 ring-red-500/20 rounded-lg"
                />
              )}
            </Card>
          ))}
        </div>
      </div>

    </div >
  )
}

