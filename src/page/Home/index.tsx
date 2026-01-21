import useGameStore from "@/store/gameStore";
import { cn } from "@/lib/utils";
import { convertFileSrc } from "@tauri-apps/api/core";
import { GameList } from "@/components/GameList";
import './index.css'


export default function Home() {
  const { selectedGame } = useGameStore()
  const url = selectedGame?.background ? convertFileSrc(selectedGame.background) : "";

  return (
    <div className={cn(
      'home bg-cover bg-center'
    )}
      style={{
        backgroundImage: url ? `url("${url}")` : 'none',
        backgroundColor: '#1a1a1a' // 设置一个深色底色，没图时不会白屏
      }}
    >
      <div className="grid grid-cols-12 grid-rows-12 gap-4 min-0 h-full">
        <div className="col-span-12 flex items-end row-span-7">

        </div>

        <div className="col-span-12 flex items-end relative row-span-5">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-md z-0 vague" />
          <GameList />
        </div>
      </div>
    </div >
  )
}

