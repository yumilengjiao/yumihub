// ── 游戏核心数据结构 ──────────────────────────────────────────────────────────

export interface GameMeta {
  id: string
  name: string
  absPath: string
  isPassed: boolean
  isDisplayed: boolean
  cover: string
  background: string
  localCover?: string
  localBackground?: string
  description: string
  developer: string
  saveDataPath?: string
  backupDataPath?: string
  playTime: number
  length?: number
  size?: number
  lastPlayedAt?: string
}

export type GameMetaList = GameMeta[]

export interface ArchiveEntry {
  name: string
  size: number
  isDir: boolean
  encrypted: boolean
}
