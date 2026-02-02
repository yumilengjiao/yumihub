export interface User {
  id: string
  userName: string
  avatar: string
  gamesCount: number
  favoriteGame: string
  totalPlayTime: number
  gamesCompletedNumber: number
  selectedDisk: string | null
  lastPlayAt: string | null
  createdAt: string | null
}
