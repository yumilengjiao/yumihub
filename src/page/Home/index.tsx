import clsx from "clsx";
import './index.css'
import { Button } from "@/components/ui/button";
import { config } from "process";
import { GameList } from "@/components/GameList";

const configList = {
  guiConfig: null,
  hotKey: null,
  gameMetaList: [
    {
      "id": "123456",
      "name": "近月少女的礼仪",
      "absPath": "/game/jinyue",
      "cover": "resource/jinyue/jinyue.png",
      "background": "niahoa/nihao",
      "play_time": 12345,
      "size": 8500
    },
    {
      "id": "123457",
      "name": "纸上的魔法师",
      "absPath": "/game/kami",
      "cover": "resource/kami/jinyue.png",
      "background": "niahoa/nihao",
      "play_time": 789154,
      "size": 5700
    }
  ]
}

export default function Home() {
  return (
    <div className={clsx(
      'home'
    )}>
      <GameList />
    </div >
  )
}

