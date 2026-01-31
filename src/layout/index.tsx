import { Outlet } from "react-router";
import TitleBar from '@/components/TitleBar'
import SideBar from '@/components/SideBar'
import { GlobalConfirm } from "@/components/Message";
import { Toaster } from "sonner";
import useUserStore from "@/store/userStore";
import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";
import { User } from "@/types/user";
import useGameStore from "@/store/gameStore";
import { GameMetaList } from "@/types/game";
import { Cmds } from "@/lib/enum";
import { debug } from "@tauri-apps/plugin-log";
import useConfigStore from "@/store/configStore";
import { Config } from "@/types/config";

export default function index() {
  const { updateUser } = useUserStore()
  const { updateSelectedGame, setGameMetaList } = useGameStore()
  const { config, updateConfig } = useConfigStore()
  const fontFamily = useConfigStore(c => c.config.interface.fontFamily)
  console.log(config)

  //向状态管理系统拿数据
  async function getGamelist() {
    try {
      debug("程序启动,开始向后端获取游戏数据列表")
      const gameList = await invoke<GameMetaList>(Cmds.GET_GAME_META_LIST)
      setGameMetaList(gameList)

      if (gameList && gameList.length > 0) {
        updateSelectedGame(gameList[0])
      }
    } catch (err) {
      console.error(err)
    }
  }

  // 初始化用户数据
  async function getUserInfo() {
    try {
      const user: User = await invoke("get_user_info")
      updateUser(user)
    } catch (err) {
      console.error("获取用户信息失败")
    }
  }

  // 初始化配置数据
  async function getConfig() {
    try {
      debug("程序启动,开始向后端获取配置信息")
      const config = await invoke<Config>(Cmds.GET_CONFIG)
      updateConfig((oldConfig) => Object.assign(oldConfig, config))
    } catch (err) {
      console.error("无法获取config", err)
    }
  }

  useEffect(() => {
    getGamelist()
    getConfig()
    getUserInfo()
  }, [])


  useEffect(() => {
    const fontValue = fontFamily === "sys"
      ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      : `"${fontFamily}"`;

    // 创建或获取 style 标签
    let styleTag = document.getElementById('dynamic-font-style');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'dynamic-font-style';
      document.head.appendChild(styleTag);
    }

    // 💡 强行覆盖所有元素，特别是组件库的组件
    styleTag.innerHTML = `
    * { 
      font-family: ${fontValue} !important; 
    }
  `;
  }, [fontFamily]);

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

