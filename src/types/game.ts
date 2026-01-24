// 用于加载本地游戏配置的接口
export interface GameMeta {
  id: string
  name: string
  absPath: string
  cover: string
  background: string
  playTime: number
  size: number
}

export type GameMetaList = GameMeta[]

// 用于远程获取游戏元数据的接口
export interface GameInfo {
  name: string
  bootPath: string | null
  parentPath: String
}

//vndb查询的格式
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

//vndb返回的格式
export interface VNDBResponse {
  more: boolean
  results: Result[]
}

//vndb返回的结果
export interface Result {
  id: string
  image: Image
  title: string
}

//图片地址
export interface Image {
  url: string
}


//Bangumi查询的格式
export interface BangumiReq {
  keyword: string
  sort: string  //排序规则默认用match
  filter: Filter
}

//bangumi使用的过滤器
export interface Filter {
  type: number[] //--4为游戏类别
  tag: string[]
  nsfw: boolean
}


//bangumi返回的格式
export interface BangumiResponse {
  data: Datum[]
  total: number
  limit: number
  offset: number
}

export interface Datum {
  date: Date
  platform: string
  images: Images
  image: string
  summary: string
  name: string
  name_cn: string
  tags: Tag[]
  infobox: Infobox[]
  rating: Rating
  collection: Collection
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

export interface Collection {
  on_hold: number
  dropped: number
  wish: number
  collect: number
  doing: number
}

export interface Images {
  small: string
  grid: string
  large: string
  medium: string
  common: string
}

export interface Infobox {
  key: string
  value: ValueElement[] | string
}

export interface ValueElement {
  v: string
  k?: string
}

export interface Rating {
  rank: number
  total: number
  count: { [key: string]: number }
  score: number
}

export interface Tag {
  name: string
  count: number

}

