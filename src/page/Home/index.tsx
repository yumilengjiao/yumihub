import useGameStore from "@/store/gameStore";
import { cn } from "@/lib/utils";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { GameList } from "@/components/GameList";


export default function Home() {
  const { selectedGame } = useGameStore()
  const [url, setUrl] = useState<string>("")
  useEffect(() => {
    setUrl(convertFileSrc(selectedGame?.background || "/nihao"))
    console.log(url)
  }, [selectedGame])

  return (
    <div className={cn(
      'home bg-cover bg-center'
    )}
      style={{
        // 使用内联样式确保 asset:// 协议能被正确解析
        backgroundImage: url ? `url("${url}")` : 'none',
        backgroundColor: '#1a1a1a' // 设置一个深色底色，没图时也不会白屏
      }}
    >
      <div className="grid grid-cols-12 gap-4 pl-6 min-0 h-full">
        <div className="col-span-12 flex items-end" >
          <GameList />
        </div>
      </div>
    </div >
  )
}

