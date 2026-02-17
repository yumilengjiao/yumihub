import { cn } from "@/lib/utils"
import Trigger from "./Trigger"
import { useState, useMemo } from "react"
import Entry from "./Entry"
import { House, UserRound, Settings2, Gamepad2, TestTube } from "lucide-react"
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

  return (
    <>
      {sidebarMode === "Trigger" && <Trigger onEnter={() => setIsHovered(true)} />}

      <aside
        onMouseEnter={() => sidebarMode === "Trigger" && setIsHovered(true)}
        onMouseLeave={() => sidebarMode === "Trigger" && setIsHovered(false)}
        className={containerClass}
      >
        <div className="flex flex-col h-full py-10">
          <div className="flex flex-col items-center mb-12">
            <Avatar className={cn(
              "transition-all duration-400 ring-3 ring-white shadow-xl h-24 w-24 rounded-[32px]",
            )} />
            <div className="h-6 flex items-center justify-center mt-4">
              <span className={cn(
                "text-[10px] font-black text-custom-500 tracking-[0.2em] uppercase transition-all duration-300",
                isExpanded ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
              )}>
                DASHBOARD
              </span>
            </div>
          </div>

          <nav className="flex-1 px-3 space-y-4">
            <Entry isActive={location.pathname === "/"} isExpanded={isExpanded} title={t`主页`} onClick={() => navigate("/")}>
              <House size={28} strokeWidth={2.5} />
            </Entry>
            <Entry isActive={location.pathname === "/library"} isExpanded={isExpanded} title={t`游戏`} onClick={() => navigate("/library")}>
              <Gamepad2 size={28} strokeWidth={2.5} />
            </Entry>
            <Entry isActive={location.pathname === "/user"} isExpanded={isExpanded} title={t`个人`} onClick={() => navigate("/user")}>
              <UserRound size={28} strokeWidth={2.5} />
            </Entry>
            <Entry isActive={location.pathname === "/setting"} isExpanded={isExpanded} title={t`设置`} onClick={() => navigate("/setting")}>
              <Settings2 size={28} strokeWidth={2.5} />
            </Entry>
            <Entry isActive={location.pathname === "/testpage"} isExpanded={isExpanded} title={t`测试页`} onClick={() => navigate("/testpage")}>
              <TestTube size={28} strokeWidth={2.5} />
            </Entry>
          </nav>

          {
            sidebarMode != "Trigger" &&
            <div className={cn("px-8 transition-opacity duration-500", isExpanded ? "opacity-100" : "opacity-0")}>
              <div className="h-1 w-full bg-linear-to-r from-transparent via-custom-200 to-transparent rounded-full" />
            </div>
          }
        </div>
      </aside >
    </>
  )
}
