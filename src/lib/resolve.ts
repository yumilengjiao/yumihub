import { BangumiReq, BangumiResponse, Datum, GameMeta, VNDBReq, VNDBResult, YmgalReq } from "@/types/game"


/**
 * 通过传入的游戏名创建向VNDB发送请求所需要的请求体
 * @param name 传入游戏名
 * @returns
 */
export const createVNDBParamsFromBootFile = (name: string) => {
  const vndbParam: VNDBReq = {
    filters: [
      "and",
      [
        "search",
        "=",
        name
      ],
      [
        "or",
        [
          "lang",
          "=",
          "zh-Hans"
        ],
        [
          "lang",
          "=",
          "zh-Hant"],
        [
          "lang",
          "=",
          "ja"
        ],
        [
          "lang",
          "=",
          "en"
        ]
      ]

    ],
    sort: "searchrank",
    fields: "title, image.url, alttitle, titles.lang, titles.title, titles.official, olang, length, average, description, screenshots.url, developers.name"
  }
  return vndbParam
}

/**
 * 通过传入的游戏名向Bangumi发送请求所需要的请求体
 * @param name 传入的游戏名字
 * @returns
 */
export const createBangumiParamsFromBootFile = (name: string) => {
  const bangumiParam: BangumiReq = {
    keyword: name,
    sort: "match",
    filter: {
      "type": [
        4
      ],
      "tag": [
        "Galgame"
      ],
      "nsfw": true
    }
  }
  return bangumiParam
}

/**
 * 通过传入的游戏名创建向Ymlgal发送请求所需要的请求参数
 * @param absPath 传入的游戏名 rance01
 * @returns
 */
export const createYmgalQueryFromBootFile = (name: string) => {
  const bangumiParam: YmgalReq = {
    keyword: name,
    mode: "list",
    pageNum: 1,
    pageSize: 1
  }
  return bangumiParam
}

/**
 * 将 Bangumi 数据转化并合并。
 * @param partial - 除去网络数据部分的游戏数据
 * @param bangumiRes - bangumu返回的游戏数据
 * @returns 返回完整的数据库结构的游戏数据
 */
export const transBangumiToGameMeta = (
  partial: Omit<GameMeta, 'cover' | 'background' | 'description' | 'developer'>,
  bangumiRes: Datum
): GameMeta => {

  // 提取同步字段
  const syncedData: Pick<GameMeta, 'cover' | 'background' | 'description' | 'developer'> = {
    cover: bangumiRes.images?.common || "",
    background: bangumiRes.images?.large || "",
    description: bangumiRes.summary || "",
    // 增加对“开发”、“制作”等不同 Key 的兼容
    developer: (bangumiRes.infobox?.find(g => ['开发', '制作', '开发商'].includes(g.key))?.value as string) || "",
  };

  // 2. 返回完整的 GameMeta
  return {
    ...partial,
    ...syncedData,
  };
};

/**
 * 将 VNDB 数据转化并合并。
 * @param partial - 除去网络数据部分的游戏数据
 * @param bangumiRes - vndb返回的游戏数据
 * @returns 返回完整的数据库结构的游戏数据
 */
export const transVNDBToGameMeta = (
  partial: Omit<GameMeta, 'cover' | 'background' | 'description' | 'developer'>,
  vndbRes: VNDBResult
): GameMeta => {

  // 提取同步字段
  const syncedData: Pick<GameMeta, 'cover' | 'background' | 'description' | 'developer'> = {
    cover: vndbRes.image.url || "",
    background: vndbRes.screenshots[0].url || "",
    description: vndbRes.description || "",
    // 增加对“开发”、“制作”等不同 Key 的兼容
    developer: vndbRes.developers[0].name || "",
  }

  // 2. 返回完整的 GameMeta
  return {
    ...partial,
    ...syncedData,
  };
};
