import { Expand, LampCeiling, Minimize2, Minus, X } from "lucide-react"
import MainButton from "./MainButton"
import { getCurrentWindow, Window } from '@tauri-apps/api/window'
import { cn } from "@/lib/utils"
import { ButtonGroupSeparator } from "./ButtonGroupSeparator"
import { useEffect, useState } from "react"
import useConfigStore from "@/store/configStore"
import { ThemeMode } from "@/types/config"


// 窗口操作辅助函数
const minisizeWindow = (window: Window) => window.minimize()
const toogleMaximizeWindow = (window: Window) => window.toggleMaximize()
const closeWindow = (window: Window) => window.close()
const hideWindow = (window: Window) => window.hide()

export default function TitleBar() {
  const [isMax, setIsMax] = useState(false)
  const { config, updateConfig } = useConfigStore()
  const appWindow = getCurrentWindow()

  const applyTheme = (mode: ThemeMode) => {
    const html = document.documentElement
    if (mode === ThemeMode.Night) {
      html.classList.add('dark')
    } else if (mode === ThemeMode.Daytime) {
      html.classList.remove('dark')
    } else if (mode === ThemeMode.System) {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      html.classList.toggle('dark', isSystemDark)
    }
  }

  // 响应式监听主题变化
  useEffect(() => {
    // 1. 立即执行当前配置的主题
    applyTheme(config.interface.themeMode)

    // 2. 如果是 System 模式，注册系统监听
    if (config.interface.themeMode === ThemeMode.System) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const listener = () => applyTheme(ThemeMode.System)
      mediaQuery.addEventListener('change', listener)
      return () => mediaQuery.removeEventListener('change', listener)
    }
  }, [config.interface.themeMode])

  // 灯泡按钮点击：在 Night 和 Daytime 之间切换
  const handleSwitchTheme = () => {
    let nextMode: ThemeMode

    // 如果当前是 System，点一下根据当前系统状态切到相反模式
    if (config.interface.themeMode === ThemeMode.System) {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      nextMode = isSystemDark ? ThemeMode.Daytime : ThemeMode.Night
    } else {
      // 否则在白天/黑夜间互切
      nextMode = config.interface.themeMode === ThemeMode.Night
        ? ThemeMode.Daytime
        : ThemeMode.Night
    }

    updateConfig(d => { d.interface.themeMode = nextMode })
  }

  // --- 窗口管理逻辑 ---
  const execteCloseWindow = () => {
    // 这里的 "Exit" 建议也检查一下是否是枚举，目前按你之前的代码逻辑
    if (config.system.closeButtonBehavior === "Exit") {
      closeWindow(appWindow)
    } else {
      hideWindow(appWindow)
    }
  }

  useEffect(() => {
    const updateIsMax = async () => {
      const maximized = await appWindow.isMaximized()
      setIsMax(maximized)
    }

    updateIsMax()

    // 监听窗口大小改变及最大化状态
    const unlisten = appWindow.onResized(() => {
      updateIsMax()
    })

    return () => {
      unlisten.then(f => f())
    }
  }, [appWindow])

  return (
    <div className="fixed w-full h-[5vh] z-50 flex justify-end cursor-pointer" data-tauri-drag-region>
      <div className={cn(
        "relative flex justify-end pl-8 pr-5 rounded-bl-[70px]",
        "bg-background/40 backdrop-blur-sm cursor-default"
      )}>
        {/* 灯泡：切换主题 */}
        <MainButton onClick={handleSwitchTheme}>
          <LampCeiling className="h-full w-auto block" />
        </MainButton>

        <ButtonGroupSeparator />

        {/* 最小化 */}
        <MainButton onClick={() => minisizeWindow(appWindow)}>
          <Minus className="h-full w-auto block" />
        </MainButton>

        <ButtonGroupSeparator />

        {/* 最大化 / 还原 */}
        <MainButton onClick={() => toogleMaximizeWindow(appWindow)}>
          {!isMax ? (
            <Expand className="h-full w-auto block" />
          ) : (
            <Minimize2 className="h-full w-auto block" />
          )}
        </MainButton>

        <ButtonGroupSeparator />

        {/* 关闭按钮（根据配置隐藏或退出） */}
        <MainButton onClick={execteCloseWindow}>
          <X className="h-full w-auto block" />
        </MainButton>
      </div>
    </div>
  )
}
