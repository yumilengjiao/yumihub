import { Outlet } from "react-router";
import TitleBar from '@/components/TitleBar'
import SideBar from '@/components/SideBar'
import { GlobalConfirm } from "@/components/Message";
import { Toaster } from "sonner";

export default function index() {
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

