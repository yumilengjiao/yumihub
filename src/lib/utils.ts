import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { createBangumiParamsFromBootFile, createVNDBParamsFromBootFile, createYmgalQueryFromBootFile } from "./resolve"
import { requestVNDB } from "@/api/vndbApi"
import { requestBangumi } from "@/api/bangumiApi"
import { requestYml } from "@/api/ymGalApi"
import { PossibleGameInfo } from "@/types/game"

/**
 * 该函数由shadcn自动生成,使用与clsx相同
 * @param 输入的css类名集合
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * 用于发送网络请求识别游戏并加结果放入仓库
 * @param 游戏的启动文件的绝对路径
 */
export async function recognizeGame(gamePath: string): Promise<PossibleGameInfo> {
  const vndbParam = createVNDBParamsFromBootFile(gamePath)
  let vndbData = null
  try {
    vndbData = await requestVNDB(vndbParam)
    console.log(vndbData)
  } catch (error) {
    console.error("获取vndb数据失败: ", error)
  }

  const bangumiParam = createBangumiParamsFromBootFile(gamePath)
  let bangumiData = null
  try {
    bangumiData = await requestBangumi(bangumiParam)
    console.log(bangumiData)
  } catch (error) {
    console.error("获取bangumi数据失败: ", error)
  }

  const ymlgalParam = createYmgalQueryFromBootFile(gamePath)
  let ymlData = null
  try {
    ymlData = await requestYml(ymlgalParam)
  } catch (error) {
    console.error("获取ymlgal数据失败: ", error)
  }
  return {
    vndb: vndbData,
    bangumi: bangumiData,
    ymlgal: ymlData
  }
}
