import { VNDBReq, VNDBResponse, VNDBResult } from "@/types/game"
import { fetch } from "@tauri-apps/plugin-http"

/**
 * 向VNDB平台发送游戏查询的请求,官方endpoint版本v2
 * @param param 用于发送VNDB资源请求的请求体
 * @returns 模糊匹配,返回查找到的游戏数据(数组)
 */
export const requestVNDB = async (param: VNDBReq): Promise<VNDBResponse | null> => {
  try {
    const response = await fetch(import.meta.env.VITE_API_VNDB_VN_URL, {
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

    // 确定是字符串后再手动解析
    return JSON.parse(rawData)

  } catch (e) {
    console.error("请求根本没发出去，检查 net.json 权限配置:", e)
    return null
  }
}

/**
 * 通过条目id向VNDB平台发送游戏查询的请求
 * @param id vndb条目的id
 * @returns 精确匹配,返回查找到的游戏数据
 */
export const requestVNDBById = async (id: string): Promise<VNDBResult | null> => {
  const param = {
    "filters": [
      "id", "=", id
    ],
    "fields": "title, image.url, alttitle, titles.lang, titles.title, titles.official, olang, length, average, description, screenshots.url, developers.name"
  }
  try {
    const response = await fetch(import.meta.env.VITE_API_VNDB_VN_URL, {
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

    // 确定是字符串后再手动解析
    if (JSON.parse(rawData).results.length > 0)
      return JSON.parse(rawData).results[0]
    else
      return null

  } catch (e) {
    console.error("请求根本没发出去，检查 net.json 权限配置:", e)
    return null
  }
}

