import { Toaster } from "sonner"
import useUserStore from "@/store/userStore"
import { invoke } from "@tauri-apps/api/core"
import { useEffect } from "react"
import { User } from "@/types/user"
import useGameStore from "@/store/gameStore"
import { GameMetaList } from "@/types/game"
import { Cmds } from "@/lib/enum"
import { debug } from "@tauri-apps/plugin-log"
import useConfigStore from "@/store/configStore"
import { Config, ThemeMode } from "@/types/config"
import { i18n } from "@lingui/core"
import { useShortcutHandler } from "@/hooks/useShortcuter"
import { Surface } from "@/components/custom/Surface"
import { useThemeStore } from "@/store/themeStore"

export default function Layout() {
  const { setUser } = useUserStore()
  const {  setGameMetaList } = useGameStore()
  const { updateConfig } = useConfigStore()
  const { config } = useConfigStore()
  const fontFamily = useConfigStore(c => c.config.interface.fontFamily)
  const layoutTree = useThemeStore(t => t.theme?.layout.global)

  useShortcutHandler()

  /**
   * 暗色模式相关
   */
  const applyTheme = (mode: ThemeMode) => {
    const html = document.documentElement
    if (mode === ThemeMode.Night) {
      html.classList.add('dark')
    } else if (mode === ThemeMode.Daytime) {
      html.classList.remove('dark')
    } else if (mode === ThemeMode.System) {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      html.classList.toggle('dark', isSystemDark)
    }
  }

  // 响应式监听主题变化
  useEffect(() => {
    // 立即执行当前配置的主题
    applyTheme(config.interface.themeMode)

    // 如果是 System 模式，注册系统监听
    if (config.interface.themeMode === ThemeMode.System) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const listener = () => applyTheme(ThemeMode.System)
      mediaQuery.addEventListener('change', listener)
      return () => mediaQuery.removeEventListener('change', listener)
    }
  }, [config.interface.themeMode])

  /**
   * 获取所有的游戏信息
   */
  async function getGamelist() {
    try {
      debug("程序启动,开始向后端获取游戏数据列表")
      const gameList = await invoke<GameMetaList>(Cmds.GET_GAME_META_LIST)
      setGameMetaList(gameList)
    } catch (err) { console.error(err) }
  }

  /**
   * 获取用户信息
   */
  async function getUserInfo() {
    try {
      const user: User = await invoke(Cmds.GET_USER_INFO)
      setUser(user)
    } catch (err) { console.error("获取用户信息失败", err) }
  }

  /**
   * 获取配置信息
   */
  async function getConfig() {
    try {
      debug("程序启动,开始向后端获取配置信息")
      const config = await invoke<Config>(Cmds.GET_CONFIG)
      // 设置语言
      i18n.activate(config.basic.language)
      updateConfig((oldConfig) => Object.assign(oldConfig, config))
      // 这里应用主题色
      const html = document.documentElement
      // 添加选中的主题类
      html.classList.add(config.interface.themeColor)

    } catch (err) { console.error("无法获取config", err) }
  }

  useEffect(() => {
    getGamelist()
    getConfig()
    getUserInfo()
  }, [])

  // 动态字体注入
  useEffect(() => {
    const fontValue = fontFamily === "sys"
      ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      : `"${fontFamily}"`

    let styleTag = document.getElementById('dynamic-font-style')
    if (!styleTag) {
      styleTag = document.createElement('style')
      styleTag.id = 'dynamic-font-style'
      document.head.appendChild(styleTag)
    }
    styleTag.textContent = `
      :root { --main-font: ${fontValue} }
      body { font-family: var(--main-font) }
    `
  }, [fontFamily])

  return (
    <div className="h-screen w-full flex flex-col bg-transparent overflow-hidden font-main select-none">
      {/* 全局消息提示 */}
      <Toaster position="top-center" richColors />

      {layoutTree ? (
        <Surface node={layoutTree} />
      ) : (
        // 防止数据未加载时的白屏，给一个简单的 Loading 状态
        <div className="flex h-full w-full items-center justify-center text-zinc-500">
          Loading Theme Configuration...
        </div>
      )}
    </div >
  )
}

