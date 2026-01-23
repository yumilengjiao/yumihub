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
  name: string,
  bootPath: string | null,
  parentPath: String,
}

//vndb查询的格式
export interface VNDB {
  filters?: any[];
  fields?: string;
  sort?: string;
  reverse?: boolean;
  results?: number;
  page?: number;
  user?: null;
  count?: boolean;
  compact_filters?: boolean;
  normalized_filters?: boolean;
}

//vndb放回的格式
export interface VNDBResponse {
  more: boolean;
  results: Result[];
}

export interface Result {
  id: string;
  image: Image;
  title: string;
}

export interface Image {
  url: string;
}
