import { useState } from 'react';
import { Home, Gamepad2, Settings, Trophy, Library } from 'lucide-react';
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: Home, label: "HOME" },
  { icon: Library, label: "LIBRARY" },
  { icon: Gamepad2, label: "GAMES" },
  { icon: Trophy, label: "ACHIEVE" },
  { icon: Settings, label: "CONFIG" },
];

export default function RadialSidebar() {
  const [active, setActive] = useState(false);

  return (
    <div
      className="fixed left-0 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center"
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
    >
      {/* 触发区域：侧边的小条 */}
      <div className={cn(
        "w-2 h-32 bg-primary/40 rounded-r-full transition-all duration-500",
        active ? "opacity-0 scale-y-150" : "opacity-100"
      )} />

      {/* 轮盘容器 */}
      <div className={cn(
        "absolute left-[-50px] w-[400px] h-[400px] transition-all duration-700 ease-out-expo",
        active ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-90 pointer-events-none"
      )}>
        {/* 背景圆弧装饰 */}
        <div className="absolute inset-0 rounded-full border-[40px] border-primary/5 shadow-[0_0_50px_rgba(var(--primary),0.2)]" />

        {menuItems.map((item, index) => {
          // 计算每个菜单项的角度 (180度平分)
          const angle = (index / (menuItems.length - 1)) * 180 - 90;

          return (
            <div
              key={item.label}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group"
              style={{
                transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(160px) rotate(${-angle}deg)`
              }}
            >
              {/* 单个菜单项 */}
              <div className="relative flex flex-col items-center gap-2 group cursor-pointer">
                {/* 图标背景渐变 */}
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
                  "bg-background border-2 border-primary/20 text-primary",
                  "group-hover:scale-125 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-[0_0_20px_rgba(var(--primary),0.5)]"
                )}>
                  <item.icon size={28} strokeWidth={2.5} />
                </div>

                {/* 文字：大字号、斜体、渐变 */}
                <span className={cn(
                  "opacity-0 scale-50 blur-sm transition-all duration-300",
                  "text-xl font-black italic tracking-tighter uppercase text-primary",
                  "group-hover:opacity-100 group-hover:scale-100 group-hover:blur-0"
                )}>
                  {item.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
