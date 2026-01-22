import { Outlet } from "react-router";
import TitleBar from '@/components/TitleBar'

export default function index() {
  return (
    <div className="layout">
      <TitleBar />
      <Outlet />
    </div>
  )
}

