import { YmgalReq, YmgalResponse } from "@/types/game"
import { fetch } from "@tauri-apps/plugin-http"

/**
 * 向Ymlgal平台发送游戏查询的请求,官方endpoint版本 v1
 * @param param 用于发送bangumi资源请求的请求体
 * @returns 模糊匹配,返回查找到的游戏数据(数组)
 */
export const requestYml = async (params: YmgalReq): Promise<YmgalResponse | null> => {
  const url = new URL(import.meta.env.VITE_API_YMGAL_VN_URL)
  url.searchParams.set("mode", params.mode)
  url.searchParams.set("keyword", params.keyword)
  url.searchParams.set("pageNum", params.pageNum.toString())
  url.searchParams.set("pageSize", params.pageSize.toString())
  try {
    const response = await fetch(url.toString(), {
      method: "Get",
      headers: {
        "Accept": "application/json",
        "charset": "utf-8",
        "version": "1",
        "Authorization": "Bearer dc34f893-f836-4f65-a9da-eef9245ef8c6"
      },
    })

    const rawData = await response.text()

    if (!response.ok) {
      console.error("服务器返回错误:", rawData)
      return null
    }

    // 确定是字符串后再手动解析
    return JSON.parse(rawData)

  } catch (e) {
    console.error("请求根本没发出去，检查 net.json 权限配置:", e)
    return null
  }
}
