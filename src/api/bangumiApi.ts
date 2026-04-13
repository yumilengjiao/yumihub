import { BangumiReq, BangumiResponse, BangumiSubject } from "@/types/api"
import { fetch } from "@tauri-apps/plugin-http"

export const requestBangumi = async (param: BangumiReq): Promise<BangumiResponse | null> => {
  try {
    const response = await fetch(import.meta.env.VITE_API_BANGUMI_VN_URL + "?limit=1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(param),
    })
    const rawData = await response.text()
    if (!response.ok) {
      console.error("Bangumi 服务器返回错误:", rawData)
      return null
    }
    return JSON.parse(rawData)
  } catch (e) {
    console.error("Bangumi 请求失败:", e)
    return null
  }
}

export const requestBangumiById = async (
  id: string,
  token?: string
): Promise<BangumiSubject | null> => {
  const url = import.meta.env.VITE_API_BANGUMI_VN_SUBJECT_URL + id

  const doFetch = (authToken?: string) =>
    fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": import.meta.env.VITE_API_USER_AGENT,
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    })

  try {
    let response = await doFetch(token)
    if (!response.ok && token) {
      console.warn(`带 Token 请求失败 (${response.status})，重试不带 Token...`)
      response = await doFetch()
    }
    if (!response.ok) {
      console.error(`Bangumi API 最终请求失败: ${response.status}`)
      return null
    }
    return await response.json()
  } catch (e) {
    console.error("Bangumi ById 请求异常:", e)
    return null
  }
}
