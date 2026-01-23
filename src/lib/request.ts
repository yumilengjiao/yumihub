import { VNDB } from "@/types/game";
import { fetch } from "@tauri-apps/plugin-http";

// VNDB - 使用其 HTTPS API v2
export const requestVNDB = async (param: VNDB) => {
  try {
    const response = await fetch(import.meta.env.VITE_API_VNDB_VN_URL, {
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
// 2. Bangumi - 官方 API v0
// export const bgmApi = createBaseInstance('https://api.bgm.tv/v0');

// 3. YmGal (月幕) - 接口通常需要特殊的 User-Agent
// export const ymgalApi = createBaseInstance('https://www.ymgal.games/api');

