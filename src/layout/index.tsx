import { Outlet } from "react-router"
import TitleBar from '@/components/TitleBar'
import SideBar from '@/components/SideBar' // 确保这里的路径指向你的 SideBar 文件夹
import { GlobalConfirm } from "@/components/Message"
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
import { Config } from "@/types/config"
import { cn } from "@/lib/utils"
import { i18n } from "@lingui/core"
import { useShortcutHandler } from "@/hooks/useShortcuter"

export default function Layout() {
  const { setUser } = useUserStore()
  const { updateSelectedGame, setGameMetaList } = useGameStore()
  const { updateConfig } = useConfigStore()
  const fontFamily = useConfigStore(c => c.config.interface.fontFamily)
  const sidebarMode = useConfigStore(c => c.config.interface.sidebarMode) || "Trigger"


  //向状态管理系统拿数据
  async function getGamelist() {
    try {
      info("程序启动,开始向后端获取游戏数据列表")
      const gameList = await invoke<GameMetaList>(Cmds.GET_GAME_META_LIST)
      setGameMetaList(gameList)

      if (gameList && gameList.length > 0) {
        updateSelectedGame(gameList[0])
      }
    } catch (err) {
      console.error(err)
    }
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
  }, [])
  // 初始化用户数据
  useEffect(() => {
    async function getUserInfo() {
      try {
        const user: User = await invoke("get_user_info")
        updateUser(user)
      } catch (err) {
        console.error("获取用户信息失败")
      }
    }
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
    <div className="layout">
      <GlobalConfirm />
      <Toaster />
      <SideBar />
      <TitleBar />
      <Outlet />
    </div>
  )
}

