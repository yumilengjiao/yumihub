import { BangumiReq, VNDBReq, YmgalReq } from "@/types/game"


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
          "zh"
        ],
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
    fields: "title, image.url, alttitle, titles.lang, titles.title, titles.official, olang, length, average, description, screenshots.url"
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
