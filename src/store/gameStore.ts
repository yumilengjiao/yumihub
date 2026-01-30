import { GameMeta, GameMetaList } from '@/types/game'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

type GameStore = {
  selectedGame: GameMeta | null,
  gameMetaList: GameMetaList,
  updateSelectedGame: (game: GameMeta) => void,
  setGameMetaList: (gameMetaList: GameMetaList) => void,
  setGameMeta: (game: GameMeta) => void,
  filterGameMetaListByName: (name: string) => GameMetaList
  addGameMeta: (game: GameMeta) => void
}

// 存储当前存在的所有的游戏元信息
const useGameStore = create<GameStore>()(
  immer((set, get) => ({
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
    },

    /**
     * 根据名称过滤游戏列表
     * @param name - 搜索关键词
     * @returns 过滤后的新数组，如果关键词为空则返回原数组
    */
    filterGameMetaListByName(name: string): GameMeta[] {
      // 处理空字符串逻辑：如果是空串、空格或 null/undefined，直接返回原始集合
      if (!name || name.trim() === "") {
        // 这里假设你的 state 里存原始数据的是 state.gameMetaList
        return get().gameMetaList;
      }
      const searchKeyword = name.trim().toLowerCase();

      return get().gameMetaList.filter((game) => {
        return game.name.trim().toLowerCase().includes(searchKeyword);
      });
    },

    /**
     * 添加一个游戏到列表
     * @param game -新游戏信息
     */
    addGameMeta(game) {
      set((state) => {
        state.gameMetaList.push(game)
      })
    },
  }))
)

export default useGameStore
