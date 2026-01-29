export interface User {
  id: string
  userName: string
  avatar: string
  gamesCount: number
  //这里是游戏名
  favoriteGame: string
  totalPlayTime: number
  gamesCompletedNumber: number
  lastPlayAt: string | null
  createdAt: string | null
}
