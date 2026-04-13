import { useEffect } from "react"
import { ThemeMode } from "@/types/config"
import useConfigStore from "@/store/configStore"

/** 根据 ThemeMode 把 dark class 加到 html 上 */
export function applyThemeMode(mode: ThemeMode) {
  const html = document.documentElement
  if (mode === ThemeMode.Night) {
    html.classList.add("dark")
  } else if (mode === ThemeMode.Daytime) {
    html.classList.remove("dark")
  } else {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    html.classList.toggle("dark", isDark)
  }
}

/** 在 Night / Daytime 之间切换，如果当前是 System 先判断系统状态再取反 */
export function getNextThemeMode(current: ThemeMode): ThemeMode {
  if (current === ThemeMode.System) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? ThemeMode.Daytime
      : ThemeMode.Night
  }
  return current === ThemeMode.Night ? ThemeMode.Daytime : ThemeMode.Night
}

/** 监听 themeMode 变化并同步到 DOM，在 Layout 里挂一次即可 */
export function useThemeSync() {
  const themeMode = useConfigStore(s => s.config.interface.themeMode)

  useEffect(() => {
    applyThemeMode(themeMode)

    if (themeMode === ThemeMode.System) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)")
      const listener = () => applyThemeMode(ThemeMode.System)
      mq.addEventListener("change", listener)
      return () => mq.removeEventListener("change", listener)
    }
  }, [themeMode])
}
