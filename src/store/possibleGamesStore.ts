/**
 * @module 这个仓库存储了导入游戏信息时所有游戏的可能信息
 * 在网络io后的信息会存到这里
 */

import { PossibleGameInfo } from "@/types/game";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface PossibleGameStore {
  possibleGames: PossibleGameInfo[]
  totalEntry: number
  extendPossibleGames: (param: PossibleGameInfo | PossibleGameInfo[]) => void
  reset: () => void
}

// 用来存储网络io时获取结果的仓库
const usePossibleGameStore = create<PossibleGameStore>()(
  immer((set) => ({
    possibleGames: [] as PossibleGameInfo[],
    totalEntry: 0,
    extendPossibleGames(param) {
      let isArray = Array.isArray(param)
      if (isArray) {
        set((state) => {
          state.possibleGames.push(...(param as PossibleGameInfo[]))
        })
      } else {
        set((state) => {
          console.log("添加单个游戏")
          state.possibleGames.push(param as PossibleGameInfo)
        })
      }
    },
    reset() {
      set((state) => {
        state.possibleGames = [],
          state.totalEntry = 0
      })
    }
  }))
)

export default usePossibleGameStore
