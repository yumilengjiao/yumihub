import { Outlet } from "react-router";
import TitleBar from '@/components/TitleBar'
import SideBar from '@/components/SideBar'
import { GlobalConfirm } from "@/components/Message";
import { toast, Toaster } from "sonner";
import useUserStore from "@/store/userStore";
import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";
import { User } from "@/types/user";

export default function index() {
  const { updateUser } = useUserStore()
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

