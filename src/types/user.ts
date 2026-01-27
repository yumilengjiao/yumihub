export interface User {
  id: string;
  userName: string;
  avatar: string;
  localAvatar: string;
  gamesCount: number; // Rust i64 对应 JS number
  favoriteVnId: string;
  totalPlayTime: number;
  gamesCompletedNumber: number;
  lastPlayAt: string | null;
  createdAt: string | null;
}
