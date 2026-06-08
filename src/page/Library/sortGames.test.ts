import { describe, expect, test } from "bun:test"
import type { GameMeta } from "../../types/game"
import { sortLibraryGames } from "./sortGames"

const game = (overrides: Partial<GameMeta>): GameMeta => ({
  id: "id",
  name: "game",
  absPath: "",
  isPassed: false,
  isDisplayed: false,
  cover: "",
  background: "",
  description: "",
  developer: "",
  playTime: 0,
  ...overrides,
})

describe("sortLibraryGames", () => {
  test("sorts last played newest first by default", () => {
    const sorted = sortLibraryGames(
      [
        game({ id: "old", lastPlayedAt: "2024-01-01T00:00:00Z" }),
        game({ id: "new", lastPlayedAt: "2024-06-01T00:00:00Z" }),
        game({ id: "never" }),
      ],
      "lastPlayed",
      false
    )

    expect(sorted.map((item) => item.id)).toEqual(["new", "old", "never"])
  })

  test("sorts duration descending unless ascending is selected", () => {
    const games = [
      game({ id: "short", playTime: 10 }),
      game({ id: "long", playTime: 120 }),
    ]

    expect(sortLibraryGames(games, "duration", false).map((item) => item.id)).toEqual([
      "long",
      "short",
    ])
    expect(sortLibraryGames(games, "duration", true).map((item) => item.id)).toEqual([
      "short",
      "long",
    ])
  })

  test("filters passed games without mutating source order", () => {
    const sorted = sortLibraryGames(
      [
        game({ id: "a", isPassed: false }),
        game({ id: "b", isPassed: true }),
      ],
      "passed",
      false
    )

    expect(sorted.map((item) => item.id)).toEqual(["b"])
  })
})
