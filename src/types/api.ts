// ── VNDB ─────────────────────────────────────────────────────────────────────

export interface VNDBReq {
  filters?: any[]
  fields?: string
  sort?: string
  reverse?: boolean
  results?: number
  page?: number
  user?: null
  count?: boolean
  compact_filters?: boolean
  normalized_filters?: boolean
}

export interface VNDBResponse {
  more: boolean
  results: VNDBResult[]
}

export interface VNDBResult {
  alttitle: string
  average: number
  description: string
  developers: { id: string; name: string }[]
  id: string
  image: { url: string }
  length: number
  olang: string
  screenshots: { url: string }[]
  title: string
  titles: { lang: string; official: boolean; title: string }[]
}

// ── Bangumi ───────────────────────────────────────────────────────────────────

export interface BangumiReq {
  keyword: string
  sort: string
  filter: {
    type: number[]
    tag: string[]
    nsfw: boolean
  }
}

export interface BangumiResponse {
  data: BangumiSubject[]
  total: number
  limit: number
  offset: number
}

export interface BangumiSubject {
  date: string
  platform: string
  images: {
    small: string
    grid: string
    large: string
    medium: string
    common: string
  }
  image: string
  summary: string
  name: string
  name_cn: string
  tags: { name: string; count: number }[]
  infobox: { key: string; value: { v: string; k?: string }[] | string }[]
  rating: {
    rank: number
    total: number
    count: Record<string, number>
    score: number
  }
  id: number
  eps: number
  total_episodes: number
  meta_tags: string[]
  volumes: number
  series: boolean
  locked: boolean
  nsfw: boolean
  type: number
}
