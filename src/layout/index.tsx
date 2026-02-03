import { Outlet } from "react-router";
import TitleBar from '@/components/TitleBar'
import SideBar from '@/components/SideBar' // 确保这里的路径指向你的 SideBar 文件夹
import { GlobalConfirm } from "@/components/Message";
import { Toaster } from "sonner";
import useUserStore from "@/store/userStore";
import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";
import { User } from "@/types/user";
import useGameStore from "@/store/gameStore";
import { GameMeta, GameMetaList } from "@/types/game";
import { Cmds } from "@/lib/enum";
import { debug } from "@tauri-apps/plugin-log";
import useConfigStore from "@/store/configStore";
import { Config } from "@/types/config";
import { cn } from "@/lib/utils";
import { i18n } from "@lingui/core"

export default function Layout() {
  const { setUser } = useUserStore()
  const { updateSelectedGame, setGameMetaList, setGameMeta } = useGameStore()
  const { updateConfig } = useConfigStore()
  const fontFamily = useConfigStore(c => c.config.interface.fontFamily)
  const sidebarMode = useConfigStore(c => c.config.interface.sidebarMode) || "Trigger"

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
      : `"${fontFamily}"`;

    let styleTag = document.getElementById('dynamic-font-style');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'dynamic-font-style';
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = `
      :root { --main-font: ${fontValue}; }
      body { font-family: var(--main-font); }
    `;
  }, [fontFamily]);

  return (
    <div className="h-screen w-full flex flex-col bg-transparent overflow-hidden font-main">
      <Toaster position="top-center" richColors />
      <GlobalConfirm />
      <TitleBar />

      {/* 栅格布局容器 */}
      <div className={cn(
        "flex-1 relative overflow-hidden",
        // 只有固定模式才使用栅格占位
        sidebarMode !== "Trigger" ? "grid" : "block"
      )}
        style={sidebarMode !== "Trigger" ? {
          gridTemplateColumns: sidebarMode === "NormalFixed" ? "140px 1fr" : "66px 1fr"
        } : {}}>

        <SideBar />

        {/* 主内容区 */}
        <main className={cn(
          "h-full overflow-auto transition-all duration-300",
          "bg-zinc-900/50 relative z-0"
        )}>
          <Outlet />
        </main>
      </div>
    </div >
  )
}

