/**
 * @module 这个仓库存储了导入游戏信息时所有游戏的可能信息
 * 在网络io后的信息会存到这里
 */

import { Datum, GameMetaList, VNDBResult, YmResult } from "@/types/game";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { GameMeta } from "@/types/game";

//查询游戏获取的来自三个平台所有的数据
export interface PendingGameInfo {
  absPath: string | null
  vndb: VNDBResult | null
  bangumi: Datum | null
  ymgal: YmResult | null
}

interface PendingGameStore {
  //获取的所有数据
  pendingGames: PendingGameInfo[]
  //最终决定要持久化的数据
  readyGames: GameMetaList
  extendPendingGames: (param: PendingGameInfo | PendingGameInfo[]) => void
  addReadyGames: (game: GameMeta) => void
  updateReadyGame: (game: GameMeta) => void
  reset: () => void
  resetReadyGames: () => void
}

// 用来存储网络io时获取结果的仓库
const usePendingGameStore = create<PendingGameStore>()(
  immer((set) => ({
    pendingGames: [] as PendingGameInfo[],
    readyGames: [] as GameMetaList,
    extendPendingGames(param) {
      let isArray = Array.isArray(param)
      if (isArray) {
        set((state) => {
          state.pendingGames.push(...(param as PendingGameInfo[]))
        })
      } else {
        set((state) => {
          console.log("添加单个游戏")
          state.pendingGames.push(param as PendingGameInfo)
        })
      }
    },
    addReadyGames(game) {
      set((state) => {
        state.readyGames.push(game)
      })
    },
    updateReadyGame: (meta: GameMeta) => {
      set((state) => {
        // 寻找是否已经存在，存在则替换，不存在则添加
        const index = state.readyGames.findIndex(g => g.absPath === meta.absPath);
        if (index !== -1) {
          state.readyGames[index] = meta;
        } else {
          state.readyGames.push(meta);
        }
      });
    },
    reset() {
      set((state) => {
        state.pendingGames = []
      })
    },
    resetReadyGames() {
      set((state) => {
        state.readyGames = []
      })
    },
  }))
)

export default usePendingGameStore
