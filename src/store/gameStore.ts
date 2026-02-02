import { Cmds } from '@/lib/enum'
import { GameMeta, GameMetaList } from '@/types/game'
import { invoke } from '@tauri-apps/api/core'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

type GameStore = {
  selectedGame: GameMeta | null,
  gameMetaList: GameMetaList,
  updateSelectedGame: (game: GameMeta) => void,
  setGameMetaList: (gameMetaList: GameMetaList) => void,
  setGameMeta: (game: GameMeta) => void,
  discardGame: (id: string) => Promise<void>,
  filterGameMetaListByName: (name: string) => GameMetaList
  getGameMetaById: (id: string) => GameMeta
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
    setGameMeta: (updatedGame: GameMeta) => {
      set((state) => ({
        gameMetaList: state.gameMetaList.map((g) =>
          g.id === updatedGame.id ? updatedGame : g
        ),
      }));
    },

    /**
     * 根据名称过滤游戏列表
     * @param name - 搜索关键词
     * @returns 过滤后的新数组，如果关键词为空则返回原数组
    */
    filterGameMetaListByName(name: string): GameMetaList {
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
     * 通过id从库中删除一个游戏
     * @param id - 要删除的游戏id
     */
    async discardGame(id) {
      try {
        await invoke(Cmds.DELETE_GAME_BY_ID, { id: id })
        set(state => {
          state.gameMetaList = state.gameMetaList.filter(g => g.id !== id)
        })
      } catch (err) {
        console.error(err)
      }
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

    /**
     * 使用id查询单个游戏信息
     * @param id - 游戏id
     * @returns 查找的游戏对象
     */
    getGameMetaById(id) {
      return get().gameMetaList.find(g => g.id === id)!
    },
  }))
)

export default useGameStore
