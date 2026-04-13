import { createBangumiParams, createVNDBParams } from "@/lib/resolve"
import { requestVNDB } from "./vndbApi"
import { requestBangumi } from "./bangumiApi"
import { PendingGameInfo } from "@/store/pendingGamesStore"

/**
 * 通过游戏路径自动识别游戏，并行请求 VNDB 和 Bangumi
 * @param absPath 游戏可执行文件绝对路径
 */
export async function recognizeGame(absPath: string): Promise<PendingGameInfo> {
  const separator = absPath.includes("\\") ? "\\" : "/"
  const parts = absPath.split(separator).filter(Boolean)
  // 取倒数第二段（父目录名）作为游戏名
  const name = parts[parts.length - 2] || parts[parts.length - 1]
  if (!name) throw new Error(`无法从路径解析游戏名称: ${absPath}`)

  const [vndbData, bangumiData] = await Promise.all([
    requestVNDB(createVNDBParams(name)).catch(() => null),
    requestBangumi(createBangumiParams(name)).catch(() => null),
  ])

  if (!vndbData && !bangumiData) {
    throw new Error("ALL_SOURCES_FAILED")
  }

  return {
    absPath,
    vndb: vndbData?.results[0] ?? null,
    bangumi: bangumiData?.data[0] ?? null,
  }
}
