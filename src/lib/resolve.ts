import { BangumiReq, VNDBReq, YmgalReq } from "@/types/game"

//用于从dialog读取的路径构造vndb的请求体
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

//用于从dialog读取的路径构造bangumi的请求体
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

//用于从dialog读取的路径构造ymgal请求参数
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
