import clsx from "clsx";
import './index.css'
import { GameList } from "@/components/GameList";


export default function Home() {

  return (
    <div className={clsx(
      'home'
    )}>
      <div className="grid grid-cols-12 gap-4 px-6 min-0 h-full">
        <div className="bg-blue-500 col-span-12 flex items-end">
          <GameList />
        </div>
      </div>
    </div >
  )
}

