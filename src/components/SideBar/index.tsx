import { cn } from "@/lib/utils"
import Trigger from "./Trigger"
import { useState, useMemo } from "react"
import Entry from "./Entry"
import { House, UserRound, Settings2, Gamepad2 } from "lucide-react"
import { Avatar } from "./Avatar"
import { useNavigate, useLocation } from "react-router"
import useConfigStore from "@/store/configStore"
import { t } from "@lingui/core/macro"

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const sidebarMode = useConfigStore(s => s.config.interface.sidebarMode) || "Trigger"
  const [isHovered, setIsHovered] = useState(false)

  // 展开逻辑：Fixed 模式锁死状态，Trigger 模式响应 Hover
  const isExpanded = useMemo(() => {
    if (sidebarMode === "NormalFixed") return true
    if (sidebarMode === "ShortFixed") return false
    return isHovered
  }, [sidebarMode, isHovered])

  // 容器样式逻辑
  const containerClass = useMemo(() => {
    const base = "h-full flex flex-col transition-all duration-300 ease-in-out border-r border-white/10 shadow-xl"
    switch (sidebarMode) {
      case "NormalFixed":
        return cn(base, "relative w-full translate-x-0")
      case "ShortFixed":
        return cn(base, "relative w-full translate-x-0")
      case "Trigger":
      default:
        // Trigger 模式必须用 fixed 悬浮在内容之上
        return cn(
          base,
          "fixed left-0 top-0 z-50 w-[160px] bg-black/55",
          isHovered ? "translate-x-0" : "-translate-x-full shadow-none"
        )
    }
  }, [sidebarMode, isHovered])

export default function index() {
  const [active, setActive] = useState(false)
  const navigate = useNavigate()
  return (
    <div>
      <Trigger onEnter={() => setActive(true)} />

      {/* 侧边栏 */}
      <div
        onMouseLeave={() => setActive(false)}
        className={cn(
          // 半透明背景 + 强力毛玻璃
          "fixed w-[20vw]  left-0 top-0 h-full z-50 transition-all duration-300 ease-in-out",
          "bg-white/5 backdrop-blur-2xl border-r border-primary/30 shadow-[20px_0_50px_rgba(0,0,0,0.3)]",
          active ? "translate-x-0" : "-translate-x-full overflow-hidden"
        )}
      >
        <div className={cn(
          "flex flex-col items-center pt-5"
        )}>
          <Avatar className="h-35 w-35 " />
          <Entry location="/" secondTitle="主页" onClick={() => {
            navigate("/")
          }}>
            <House className="h-full w-auto" />
          </Entry>
          <Entry location="/user" secondTitle="用户" onClick={() => {
            navigate("/user")
          }}>
            <UserRound className="h-full w-auto" />
          </Entry>
          <Entry location="/library" secondTitle="仓库" onClick={() => {
            navigate("/library")
          }}>
            <Gamepad2 className="h-full w-auto" />
          </Entry>
          <Entry location="/setting" secondTitle="设置" onClick={() => {
            navigate("/setting")
          }}>
            <Settings2 className="h-full w-auto" />
          </Entry>
        </div>
      </aside >
    </>
  )
}

