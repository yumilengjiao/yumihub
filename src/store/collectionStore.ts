import { invoke } from '@tauri-apps/api/core'
import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { Cmds } from '@/lib/enum'

export interface Collection {
  id: string
  name: string
  description?: string
  created_at?: string
  /** 前端缓存的 game id 列表 */
  gameIds: string[]
}

interface CollectionStore {
  collections: Collection[]
  fetchCollections: () => Promise<void>
  createCollection: (name: string, description?: string) => Promise<void>
  deleteCollection: (id: string) => Promise<void>
  renameCollection: (id: string, name: string) => Promise<void>
  addGame: (collectionId: string, gameId: string) => Promise<void>
  removeGame: (collectionId: string, gameId: string) => Promise<void>
}

const useCollectionStore = create<CollectionStore>()(
  immer((set) => ({
    collections: [],

    async fetchCollections() {
      const raw = await invoke<Omit<Collection, 'gameIds'>[]>(Cmds.GET_COLLECTIONS)
      // 并行拉取每个收藏夹内的 gameIds
      const withIds = await Promise.all(
        raw.map(async col => {
          const gameIds = await invoke<string[]>(Cmds.GET_COLLECTION_GAME_IDS, {
            collectionId: col.id,
          })
          return { ...col, gameIds }
        })
      )
      set(s => { s.collections = withIds })
    },

    async createCollection(name, description) {
      const id = nanoid()
      const col = await invoke<Omit<Collection, 'gameIds'>>(Cmds.CREATE_COLLECTION, {
        id, name, description,
      })
      set(s => { s.collections.push({ ...col, gameIds: [] }) })
    },

    async deleteCollection(id) {
      await invoke(Cmds.DELETE_COLLECTION, { collectionId: id })
      set(s => { s.collections = s.collections.filter(c => c.id !== id) })
    },

    async renameCollection(id, name) {
      await invoke(Cmds.RENAME_COLLECTION, { collectionId: id, name })
      set(s => {
        const c = s.collections.find(c => c.id === id)
        if (c) c.name = name
      })
    },

    async addGame(collectionId, gameId) {
      await invoke(Cmds.ADD_GAME_TO_COLLECTION, { collectionId, gameId })
      set(s => {
        const c = s.collections.find(c => c.id === collectionId)
        if (c && !c.gameIds.includes(gameId)) c.gameIds.push(gameId)
      })
    },

    async removeGame(collectionId, gameId) {
      await invoke(Cmds.REMOVE_GAME_FROM_COLLECTION, { collectionId, gameId })
      set(s => {
        const c = s.collections.find(c => c.id === collectionId)
        if (c) c.gameIds = c.gameIds.filter(id => id !== gameId)
      })
    },
  }))
)

export default useCollectionStore
