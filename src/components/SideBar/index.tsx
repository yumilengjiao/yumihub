import { cn } from "@/lib/utils";
import Trigger from "./Trigger";
import { useState } from "react";
import Entry from "./Entry";
import { Gamepad2, House, Settings2, UserRound } from "lucide-react";
import { Avatar } from "./Avatar";
import { useNavigate } from "react-router";

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
      </div>
    </div >
  )
}

