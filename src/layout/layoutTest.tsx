import { Toaster } from "sonner"
import useUserStore from "@/store/userStore"
import useGameStore from "@/store/gameStore"
import useConfigStore from "@/store/configStore"
import { useShortcutHandler } from "@/hooks/useShortcuter"
import { invoke } from "@tauri-apps/api/core"
import { useEffect } from "react"
import { i18n } from "@lingui/core"
import { debug } from "@tauri-apps/plugin-log"
import { Cmds } from "@/lib/enum"

// 类型定义
import { User } from "@/types/user"
import { GameMetaList } from "@/types/game"
import { Config } from "@/types/config"
import { useThemeStore } from "@/store/themeStore"
import { Surface } from "./Surface"

export default function Layout() {
  // === Store ===
  const { setUser } = useUserStore()
  const { updateSelectedGame, setGameMetaList } = useGameStore()
  const { updateConfig } = useConfigStore()

  // 获取动态字体配置
  const fontFamily = useConfigStore(c => c.config.interface.fontFamily)

  // 🔥 获取全动态布局树 (原本的 SidebarMode 逻辑现在应该由 JSON 里的 SideBar 组件自己处理)
  const layoutTree = useThemeStore(t => t.themes[1]?.layout?.global)

  console.log("layoutTree", layoutTree)

  // === Hooks ===
  // 注册全局快捷键
  useShortcutHandler()

  // === 逻辑保持不变：初始化数据 ===

  /**
   * 获取所有的游戏信息
   */
  async function getGamelist() {
    try {
      debug("程序启动,开始向后端获取游戏数据列表")
      const gameList = await invoke<GameMetaList>(Cmds.GET_GAME_META_LIST)
      setGameMetaList(gameList)
      if (gameList && gameList.length > 0) {
        updateSelectedGame(gameList[0])
      }
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

      // 应用主题色 (Color Theme)
      const html = document.documentElement
      html.classList.add(config.interface.themeColor)

    } catch (err) { console.error("无法获取config", err) }
  }

  // 初始化请求
  useEffect(() => {
    // 使用 Promise.all 并行请求可能更快，但为了完全保留你原本的逻辑顺序，分开调用
    getGamelist()
    getConfig()
    getUserInfo()
  }, [])

  // === 逻辑保持不变：动态字体注入 ===
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

  // === 渲染层 ===
  return (
    <div className="h-screen w-full flex flex-col bg-transparent overflow-hidden font-main select-none">
      {/* 全局消息提示 */}
      <Toaster position="top-center" richColors />

      {/* 不再写死 TitleBar / SideBar / Grid。
         整个界面的结构完全由 JSON 树 (layoutTree) 决定。
         SideBar 和 MainContent (Outlet) 的位置关系由 layoutTree 的 Row/Col 嵌套关系决定。
      */}
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
