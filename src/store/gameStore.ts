import { GameMeta, GameMetaList } from '@/types/game'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

type GameStore = {
  gameMetaList: GameMetaList,
  setGameMetaList: (gameMetaList: GameMetaList) => void,
  setGameMeta: (game: GameMeta) => void
}

const useGameStore = create<GameStore>()(
  immer((set) => ({
    gameMetaList: [],
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
