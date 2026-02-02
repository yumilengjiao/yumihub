import GameList from "@/page/Home/GameList";
import './index.css'
import useGameStore from "@/store/gameStore";
import { cn } from "@/lib/utils";
import { convertFileSrc } from "@tauri-apps/api/core";


export default function Home() {
  const { selectedGame, gameMetaList } = useGameStore()
  console.log(gameMetaList)
  return (
    <div className='home relative' >
      {gameMetaList.map((g) => (
        <img
          key={g.id}
          src={g.local_background ? convertFileSrc(g.local_background) : g.background}
          decoding="async"
          // 这里根据 currentIndex 控制透明度，实现无缝切换
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-500 opacity-0 pointer-events-none",
            selectedGame?.id === g.id ? "opacity-100 " : "opacity-[0.001]"
          )}
        />
      ))}
      <div className="grid grid-cols-12 grid-rows-12 gap-4 min-0 h-full">
        <div className="col-span-12 flex items-end row-span-7">
        </div>
        <div className="col-span-12 flex items-end relative row-span-5">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm vague" />
          <GameList />
        </div>
      </div>
    </div>
  )
}

