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
  const name = arr[arr.length - 2] || arr[arr.length - 1];
  if (!name) throw new Error(`无法从路径解析游戏名称: ${absPath}`);


  const vndbParam = createVNDBParamsFromBootFile(name)
  const bangumiParam = createBangumiParamsFromBootFile(name)
  const ymlgalParam = createYmgalQueryFromBootFile(name)

  const vndbData = await requestVNDB(vndbParam).catch(() => null);
  const bangumiData = await requestBangumi(bangumiParam).catch(() => null);
  const ymlData = await requestYml(ymlgalParam).catch(() => null);
  // 如果三个全是 null，说明彻底没网或没搜到，这时候可以抛个错
  if (!vndbData && !bangumiData && !ymlData) {
    throw new Error("ALL_SOURCES_FAILED");
  }
  return {
    absPath: absPath,
    vndb: vndbData?.results[0] || null,
    bangumi: bangumiData?.data[0] || null,
    ymgal: ymlData?.data.result[0] || null
  }
}
