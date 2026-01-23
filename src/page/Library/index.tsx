import useGameStore from "@/store/gameStore"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { convertFileSrc } from "@tauri-apps/api/core"
import TopBar from "./TopBar"

export default function Library() {
  const { gameMetaList } = useGameStore()
  return (
    <div className="w-full h-full flex flex-col pt-[5vh] bg-primary-foreground">
      <div className="w-full flex-1/8 p-2">
        <TopBar />
      </div>
      <div className="w-full h-full overflow-y-auto p-2">
        <div className={cn(
          "grid gap-6 px-15 w-full",
          "grid-cols-[repeat(auto-fill,minmax(250px,1fr))]",
        )}>
          {gameMetaList.map((g) => (
            /* 关键 3: 必须锁死比例，防止内容溢出导致重叠 */
            <Card key={g.id} className="overflow-hidden cursor-pointer border-3 ring-1 ring-black/5 shadow-xl shadow-blue-500/10">
              <img
                src={convertFileSrc(g.cover)}
                className="w-full h-full object-cover"
              />
            </Card>
          ))}
        </div>
      </div>

    </div >
  )
}

