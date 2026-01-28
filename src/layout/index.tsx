import { Outlet } from "react-router";
import TitleBar from '@/components/TitleBar'
import SideBar from '@/components/SideBar'
import { GlobalConfirm } from "@/components/Message";

export default function index() {
  return (
    <div className="layout">
      <GlobalConfirm />
      <SideBar />
      <TitleBar />
      <Outlet />
    </div>
  )
}

