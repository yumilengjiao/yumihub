import { BangumiReq, BangumiResponse, Datum } from "@/types/game"
import { fetch } from "@tauri-apps/plugin-http"

/**
 * 向bangumi平台发送游戏查询的请求,官方endpoint版本 v0
 * @param param 用于发送bangumi资源请求的请求体
 * @returns 模糊匹配,返回查找到的游戏数据(数组)
 */
export const requestBangumi = async (param: BangumiReq): Promise<BangumiResponse | null> => {
  try {
    const response = await fetch(import.meta.env.VITE_API_BANGUMI_VN_URL + "?limit=1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(param)
    })

    const rawData = await response.text()

    if (!response.ok) {
      console.error("服务器返回错误:", rawData)
      return null
    }

    // 确定是字符串后再手动解析，或者确认没问题后直接 await response.json()
    return JSON.parse(rawData)

  } catch (e) {
    console.error("请求根本没发出去，检查 net.json 权限配置:", e)
    return null
  }
}

/**
 * 通过指定的id来获取bangumi上关于游戏信息
 * @param id bangumi条目id
 * @param token bangumi的账号token
 * @returns
 */
export const requestBangumiById = async (id: string, token?: string): Promise<Datum | null> => {
  const url = import.meta.env.VITE_API_BANGUMI_VN_SUBJECT_URL + id
  console.log("url是: ", url)

  // 辅助函数：发起请求
  const doFetch = async (authToken?: string) => {
    const headers: Record<string, string> = {
      "Accept": "application/json",
      "User-Agent": import.meta.env.VITE_API_USER_AGENT,
    }

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`
    }

    return await fetch(url, { method: "GET", headers })
  }

  try {
    // 第一次尝试：如果传入了 token，优先带 token 请求
    console.log("token是: ", token)
    let response = await doFetch(token)

    // 检查响应：如果是 4xx 或 5xx 错误，且第一次是带了 token 的
    if (!response.ok && token) {
      console.warn(`带 Token 请求失败 (${response.status})，尝试不带 Token 重发...`)
      response = await doFetch()
    }

    // 处理最终结果
    if (!response.ok) {
      const errorText = await response.json()
      console.error(`Bangumi API 最终请求失败: ${response.status}`, errorText.description)
      return null
    }

    return await response.json()
  } catch (e) {
    console.error("网络请求异常:", e)
    return null
  }
}
