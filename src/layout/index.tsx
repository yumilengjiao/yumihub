import { Outlet } from "react-router";
import TitleBar from '@/components/TitleBar'
import SideBar from '@/components/SideBar'

export default function index() {
  return (
    <div className="layout">
      <SideBar />
      <TitleBar />
      <Outlet />
    </div>
  )
}

