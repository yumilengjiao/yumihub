import { BangumiReq, BangumiSubject, VNDBReq, VNDBResult } from "@/types/api"
import { GameMeta } from "@/types/game"

export const createVNDBParams = (name: string): VNDBReq => ({
  filters: [
    "and",
    ["search", "=", name],
    ["or",
      ["lang", "=", "zh-Hans"],
      ["lang", "=", "zh-Hant"],
      ["lang", "=", "ja"],
      ["lang", "=", "en"],
    ],
  ],
  sort: "searchrank",
  fields:
    "title, image.url, alttitle, titles.lang, titles.title, titles.official, olang, length, average, description, screenshots.url, developers.name",
})

export const createBangumiParams = (name: string): BangumiReq => ({
  keyword: name,
  sort: "match",
  filter: { type: [4], tag: ["Galgame"], nsfw: true },
})

export const transBangumiToGameMeta = (
  partial: Omit<GameMeta, "cover" | "background" | "description" | "developer">,
  res: BangumiSubject
): GameMeta => ({
  ...partial,
  cover: res.images?.common || "",
  background: res.images?.large || "",
  description: res.summary || "",
  developer:
    (res.infobox?.find(g => ["开发", "制作", "开发商"].includes(g.key))?.value as string) || "",
})

export const transVNDBToGameMeta = (
  partial: Omit<GameMeta, "cover" | "background" | "description" | "developer">,
  res: VNDBResult
): GameMeta => ({
  ...partial,
  cover: res.image?.url || "",
  background: res.screenshots?.[0]?.url || "",
  description: res.description || "",
  developer: res.developers?.[0]?.name || "",
})
