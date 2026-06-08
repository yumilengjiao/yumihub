import type { GameMeta } from "../../types/game"

export type LibrarySortMode = "duration" | "name" | "lastPlayed" | "passed"

function timestamp(value?: string) {
  if (!value) return 0
  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

export function sortLibraryGames(
  games: GameMeta[],
  sortMode: LibrarySortMode,
  isAsc: boolean
) {
  if (sortMode === "passed") {
    return games.filter((game) => game.isPassed)
  }

  const direction = isAsc ? 1 : -1

  return [...games].sort((a, b) => {
    switch (sortMode) {
      case "duration":
        return ((a.playTime || 0) - (b.playTime || 0)) * direction
      case "name":
        return a.name.localeCompare(b.name, "zh-CN") * direction
      case "lastPlayed":
        return (timestamp(a.lastPlayedAt) - timestamp(b.lastPlayedAt)) * direction
      default:
        return 0
    }
  })
}
