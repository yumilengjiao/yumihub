import { GameMeta, GameMetaList } from '@/types/game'
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

    /**
     * 用于更改当前在主页选中的游戏
     * @param game 新的选中的游戏数据
     */
    updateSelectedGame: (game) => {
      set((state) => {
        state.selectedGame = game
      })
    },

    /**
     * 用于初始化时调用初始前端仓库游戏列表数据
     * @param gameMetaList - 要设置的游戏列表数据
     */
    setGameMetaList(gameMetaList) {
      set((state) => {
        state.gameMetaList = gameMetaList
      })
    },

    /**
     * 用于修改一个已经存在的单个游戏的数据
     * @param game - 要用于修改的游戏数据
     */
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
