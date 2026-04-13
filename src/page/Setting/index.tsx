import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { usePageBackground } from "@/hooks/usePageBackground"
import { cn } from "@/lib/utils"
import BaseSetting from "./BaseSetting"
import InterfaceSetting from "./InterfaceSetting"
import ResourceSetting from "./ResourceSetting"
import AuthSetting from "./AuthSetting"
import SysSetting from "./SysSetting"
import { useLingui } from "@lingui/react"
import { t } from "@lingui/core/macro"

const TABS = [
  { id: "base", label: () => t`基础` },
  { id: "interface", label: () => t`外观` },
  { id: "system", label: () => t`系统` },
  { id: "resource", label: () => t`存储` },
  { id: "auth", label: () => t`权限` },
]

const PANEL: Record<string, React.FC> = {
  base: BaseSetting,
  interface: InterfaceSetting,
  system: SysSetting,
  resource: ResourceSetting,
  auth: AuthSetting,
}

export default function Setting() {
  const [active, setActive] = useState("base")
  const bgStyle = usePageBackground()
  const { i18n } = useLingui()
  const ActivePanel = PANEL[active]

  return (
    <div className="relative h-full w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950">
      {bgStyle && <div className="absolute inset-0 z-0 pointer-events-none" style={bgStyle} />}
      <div className="absolute inset-0 z-0 pointer-events-none bg-white/20 dark:bg-black/40" />

      <div className="relative z-10 flex flex-col h-full p-12">

        {/* 顶部 Tab 栏 */}
        <div className="px-12 pt-4 pb-0 shrink-0">
          <h1 className="text-3xl font-black text-zinc-800 dark:text-zinc-100 tracking-tight mb-6">
            Settings
          </h1>
          <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800">
            {TABS.map(tab => {
              const isActive = active === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActive(tab.id)}
                  className={cn(
                    "relative px-5 py-3 text-sm font-semibold transition-colors",
                    isActive
                      ? "text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  )}
                >
                  {tab.label()}
                  {isActive && (
                    <motion.div
                      layoutId="setting-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-custom-500 rounded-full"
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto min-h-0 px-12 pt-8 pb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <ActivePanel key={i18n.locale} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
