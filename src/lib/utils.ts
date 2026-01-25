import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { createBangumiParamsFromBootFile, createVNDBParamsFromBootFile, createYmgalQueryFromBootFile } from "./resolve"
import { requestVNDB } from "@/api/vndbApi"
import { requestBangumi } from "@/api/bangumiApi"
import { requestYml } from "@/api/ymGalApi"
import { PossibleGameInfo } from "@/store/possibleGamesStore"

/**
 * 该函数由shadcn自动生成,使用与clsx相同
 * @param 输入的css类名集合
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * 用于发送网络请求识别游戏并加结果放入仓库
 * @param absPath 游戏绝对路径
 * @param mode 0--表示传入了启动程序路径，1--表示传入游戏目录路径
 */
export async function recognizeGame(absPath: string, mode: number): Promise<PossibleGameInfo> {
  // 兼容不同系统的路径分隔符
  const separator = absPath.includes("\\") ? "\\" : "/";
  const arr = absPath.split(separator);
  //拿名字
  let name: string | undefined = "";

  if (mode) {
    arr.filter(Boolean).pop()
    name = arr.pop()!
  } else {
    name = arr.filter(Boolean).pop()!
  }

  if (!name) {
    throw new Error(`无法从路径解析游戏名称: ${absPath}`);
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
    absPath: mode ? absPath + "nil.exe" : absPath,
    vndb: vndbData,
    bangumi: bangumiData,
    ymgal: ymlData
  }
}
