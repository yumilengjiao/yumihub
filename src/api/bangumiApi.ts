import { BangumiReq, BangumiResponse, Datum } from "@/types/game";
import { fetch } from "@tauri-apps/plugin-http";

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
    });

    const rawData = await response.text();

    if (!response.ok) {
      console.error("服务器返回错误:", rawData);
      return null;
    }

    // 确定是字符串后再手动解析，或者确认没问题后直接 await response.json()
    return JSON.parse(rawData);

  } catch (e) {
    console.error("请求根本没发出去，检查 net.json 权限配置:", e);
    return null;
  }
};

/**
 * 通过指定的id来获取bangumi上关于游戏信息
 * @param id bangumi条目id
 * @returns
 */
export const requestBangumiById = async (id: string): Promise<Datum | null> => {
  try {
    const response = await fetch(import.meta.env.VITE_API_BANGUMI_VN_SUBJECT_URL + id, {
      method: "GET"
    })
    const rawData = await response.text();

    if (!response.ok) {
      console.error("服务器返回错误:", rawData);
      return null
    }
    // 确定是字符串后再手动解析，或者确认没问题后直接 await response.json()
    return JSON.parse(rawData);
  } catch (e) {
    console.error("请求根本没发出去，检查 net.json 权限配置:", e);
    return null;
  }
}
