// 用于加载本地游戏配置的接口
export interface GameMeta {
  id: string
  name: string
  absPath: string
  cover: string
  background: string
  local_cover?: string
  local_background?: string
  playTime: number
  size?: number
  length: number
  lastPlayedAt?: Date
}

export type GameMetaList = GameMeta[]

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
  results: VNDBResult[]
}

//vndb返回的结果
export interface VNDBResult {
  alttitle: string;
  average: number;
  description: string;
  id: string;
  image: Image;
  length: number;
  olang: string;
  screenshots: Image[];
  title: string;
  titles: Title[];
}

//图片地址
export interface Image {
  url: string
}

//别名(其他)标题
export interface Title {
  lang: string;
  official: boolean;
  title: string;
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

//bangumi返回的结果
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

//月幕请求时是Get请求没有对应的请求体,但对应的query参数在这依旧组织成一个结构
export interface YmgalReq {
  mode: string
  keyword: string
  pageNum: number
  pageSize: number
}
//月幕的响应结构
export interface YmgalResponse {
  success: boolean
  code: number
  data: Data
}

export interface Data {
  result: YmResult[]
  total: number
  hasNext: boolean
  pageNum: number
  pageSize: number
}

export interface YmResult {
  id: number
  name: string
  chineseName: string
  state: string
  weights: number
  mainImg: string
  publishVersion: number
  publishTime: Date
  publisher: number
  score: string
  orgId: number
  orgName: string
  releaseDate: Date
  haveChinese: boolean
}

