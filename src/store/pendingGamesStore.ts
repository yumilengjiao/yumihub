/**
 * 导入游戏时的临时数据仓库
 * 存储从各平台 API 获取的候选数据，用户确认后再持久化
 */

import { BangumiSubject, VNDBResult } from "@/types/api"
import { GameMeta, GameMetaList } from "@/types/game"
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

export interface PendingGameInfo {
  absPath: string | null
  vndb: VNDBResult | null
  bangumi: BangumiSubject | null
}

interface PendingGameStore {
  pendingGames: PendingGameInfo[]
  readyGames: GameMetaList
  extendPendingGames: (param: PendingGameInfo | PendingGameInfo[]) => void
  addReadyGame: (game: GameMeta) => void
  updateReadyGame: (game: GameMeta) => void
  reset: () => void
  resetReadyGames: () => void
}

const usePendingGameStore = create<PendingGameStore>()(
  immer((set) => ({
    pendingGames: [],
    readyGames: [],

    extendPendingGames(param) {
      set((state) => {
        if (Array.isArray(param)) {
          state.pendingGames.push(...param)
        } else {
          state.pendingGames.push(param)
        }
      })
    },

    addReadyGame(game) {
      set((state) => {
        state.readyGames.push(game)
      })
    },

    updateReadyGame(meta) {
      set((state) => {
        const index = state.readyGames.findIndex(g => g.absPath === meta.absPath)
        if (index !== -1) {
          state.readyGames[index] = meta
        } else {
          state.readyGames.push(meta)
        }
      })
    },

    reset() {
      set((state) => { state.pendingGames = [] })
    },

    resetReadyGames() {
      set((state) => { state.readyGames = [] })
    },
  }))
)

export default usePendingGameStore
