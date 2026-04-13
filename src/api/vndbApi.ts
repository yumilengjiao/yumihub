import { VNDBReq, VNDBResponse, VNDBResult } from "@/types/api"
import { fetch } from "@tauri-apps/plugin-http"

export const requestVNDB = async (param: VNDBReq): Promise<VNDBResponse | null> => {
  try {
    const response = await fetch(import.meta.env.VITE_API_VNDB_VN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(param),
    })
    const rawData = await response.text()
    if (!response.ok) {
      console.error("VNDB 服务器返回错误:", rawData)
      return null
    }
    return JSON.parse(rawData)
  } catch (e) {
    console.error("VNDB 请求失败:", e)
    return null
  }
}

export const requestVNDBById = async (id: string): Promise<VNDBResult | null> => {
  const param = {
    filters: ["id", "=", id],
    fields:
      "title, image.url, alttitle, titles.lang, titles.title, titles.official, olang, length, average, description, screenshots.url, developers.name",
  }
  try {
    const response = await fetch(import.meta.env.VITE_API_VNDB_VN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(param),
    })
    const rawData = await response.text()
    if (!response.ok) return null
    const parsed = JSON.parse(rawData)
    return parsed.results?.[0] ?? null
  } catch (e) {
    console.error("VNDB ById 请求失败:", e)
    return null
  }
}
