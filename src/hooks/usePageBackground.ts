import { useMemo } from "react"
import { convertFileSrc } from "@tauri-apps/api/core"
import useConfigStore from "@/store/configStore"

/**
 * 读取全局背景配置，返回可直接用于 style 的对象。
 * 为 null 表示未设置背景，不需要渲染背景层。
 */
export function usePageBackground() {
  const bg = useConfigStore(s => s.config.interface.globalBackground)

  return useMemo(() => {
    const path = bg?.path || ""
    if (!path.trim()) return null

    const blur = bg?.blur ?? 0
    const opacity = bg?.opacity ?? 1

    return {
      backgroundImage: `url("${convertFileSrc(path)}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      opacity,
      filter: blur > 0 ? `blur(${blur}px)` : "none",
      transform: blur > 0 ? `scale(${1 + blur * 0.015})` : "none",
      transition: "filter 0.3s ease, opacity 0.3s ease",
    } as React.CSSProperties
  }, [bg])
}
