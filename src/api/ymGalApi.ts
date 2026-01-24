import { YmgalReq } from "@/types/game";
import { fetch } from "@tauri-apps/plugin-http";

// VNDB - 使用其 HTTPS API v1
export const requestYml = async (params: YmgalReq) => {
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
    });

    const rawData = await response.text();

    if (!response.ok) {
      console.error("服务器返回错误:", rawData);
      return null;
    }

    // 确定是字符串后再手动解析
    return JSON.parse(rawData);

  } catch (e) {
    console.error("请求根本没发出去，检查 net.json 权限配置:", e);
    return null;
  }
};
