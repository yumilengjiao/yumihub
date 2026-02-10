import { createBangumiParamsFromBootFile, createVNDBParamsFromBootFile, createYmgalQueryFromBootFile } from "@/lib/resolve"
import { requestVNDB } from "./vndbApi"
import { requestBangumi } from "./bangumiApi"
import { requestYml } from "./ymGalApi"
import { PendingGameInfo } from "@/store/pendingGamesStore"

/**
 * 用于发送网络请求识别游戏并加结果放入仓库
 * @param absPath 游戏绝对路径
 * @returns 返回所有数据源拿到的数据,每个数据源的单个数据
 */
export async function recognizeGame(absPath: string): Promise<PendingGameInfo> {
  // 兼容不同系统的路径分隔符
  const separator = absPath.includes("\\") ? "\\" : "/"
  const arr = absPath.split(separator).filter(Boolean)
  //拿名字
  let name: string | undefined = ""

  // 父目录就是默认名字
  name = arr[arr.length - 2]

  if (!name) {
    // 如果路径层级只有一级，拿不到倒数第二个，则回退到最后一个
    name = arr[arr.length - 1]
  }

  if (!name) {
    throw new Error(`无法从路径解析游戏名称: ${absPath}`)
  }

  const vndbParam = createVNDBParamsFromBootFile(name)
  let vndbData = null
  try {
    vndbData = await requestVNDB(vndbParam)
    console.log(vndbData)
  } catch (error) {
    console.error("获取vndb数据失败: ", error)
  }

  const bangumiParam = createBangumiParamsFromBootFile(name)
  let bangumiData = null
  try {
    bangumiData = await requestBangumi(bangumiParam)
    console.log(bangumiData)
  } catch (error) {
    console.error("获取bangumi数据失败: ", error)
  }

  const ymlgalParam = createYmgalQueryFromBootFile(name)
  let ymlData = null
  try {
    ymlData = await requestYml(ymlgalParam)
  } catch (error) {
    console.error("获取ymlgal数据失败: ", error)
  }
  return {
    absPath: absPath,
    vndb: vndbData?.results[0] || null,
    bangumi: bangumiData?.data[0] || null,
    ymgal: ymlData?.data.result[0] || null
  }
}
