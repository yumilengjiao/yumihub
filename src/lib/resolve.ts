import { BangumiReq, VNDBReq, YmgalReq } from "@/types/game"


/**
 * 通过传入的游戏启动路径创建向VNDB发送请求所需要的请求体
 * @param absPath 传入的启动程序名字的绝对路径,如/home/user/rance/rance01.exe
 * @returns
 */
export const createVNDBParamsFromBootFile = (absPath: string) => {
  const arr = absPath.split("/")
  const name = arr[arr.length - 2]
  const vndbParam: VNDBReq = {
    filters: [
      "search",
      "=",
      name
    ],
    fields: "title, image.url"
  }
  return vndbParam
}

/**
 * 通过传入的游戏启动路径创建向Bangumi发送请求所需要的请求体
 * @param absPath 传入的启动程序名字的绝对路径,如/home/user/rance/rance01.exe
 * @returns
 */
export const createBangumiParamsFromBootFile = (absPath: string) => {
  const arr = absPath.split("/")
  const name = arr[arr.length - 2]
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
 * 通过传入的游戏启动路径创建向Ymlgal发送请求所需要的请求参数
 * @param absPath 传入的启动程序名字的绝对路径,如/home/user/rance/rance01.exe
 * @returns
 */
export const createYmgalQueryFromBootFile = (absPath: string) => {
  const arr = absPath.split("/")
  const name = arr[arr.length - 2]
  const bangumiParam: YmgalReq = {
    keyword: name,
    mode: "list",
    pageNum: 1,
    pageSize: 1
  }
  return bangumiParam
}
