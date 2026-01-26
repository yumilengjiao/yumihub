import { GameMeta, GameMetaList } from '@/types/game'
import { convertFileSrc } from '@tauri-apps/api/core'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

type GameStore = {
  selectedGame: GameMeta | null,
  gameMetaList: GameMetaList,
  updateSelectedGame: (game: GameMeta) => void,
  setGameMetaList: (gameMetaList: GameMetaList) => void,
  setGameMeta: (game: GameMeta) => void,
}

// 存储当前存在的所有的游戏元信息
const useGameStore = create<GameStore>()(
  immer((set) => ({
    selectedGame: null,
    gameMetaList: [],
    updateSelectedGame: (game) => {
      set((state) => {
        state.selectedGame = game
      })
    },
    setGameMetaList(gameMetaList) {
      set((state) => {
        state.gameMetaList = gameMetaList
      })
    },
    setGameMeta(game) {
      set((state) => {
        let index = state.gameMetaList.findIndex((g) => g.id = game.id)
        if (index != -1) {
          state.gameMetaList[index] = game
        } else {
          state.gameMetaList.push(game)
        }
      })
    }
  }))
)

export default useGameStore
