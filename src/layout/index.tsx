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
import { info } from "@tauri-apps/plugin-log";

export default function index() {
  const { updateUser } = useUserStore()
  const { updateSelectedGame, setGameMetaList } = useGameStore()


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

