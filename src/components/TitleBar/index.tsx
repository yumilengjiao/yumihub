import { Expand, LampCeiling, Minimize2, Minus, X } from "lucide-react"
import MainButton from "./MainButton"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { cn } from "@/lib/utils"
import { ButtonGroupSeparator } from "./ButtonGroupSeparator"
import { useEffect, useState } from "react"
import useConfigStore from "@/store/configStore"
import { getNextThemeMode } from "@/hooks/useTheme"

export default function TitleBar() {
  const [isMax, setIsMax] = useState(false)
  const { config, updateConfig } = useConfigStore()
  const appWindow = getCurrentWindow()

  const handleSwitchTheme = () => {
    updateConfig(d => {
      d.interface.themeMode = getNextThemeMode(d.interface.themeMode)
    })
  }

  const handleClose = () => {
    config.system.closeButtonBehavior === "Hide"
      ? appWindow.hide()
      : appWindow.close()
  }

  useEffect(() => {
    const update = async () => setIsMax(await appWindow.isMaximized())
    update()
    const unlisten = appWindow.onResized(update)
    return () => { unlisten.then(f => f()) }
  }, [appWindow])

  return (
    <div
      className="fixed w-full h-[5vh] z-50 flex justify-end cursor-pointer"
      data-tauri-drag-region
    >
      <div
        className={cn(
          "relative flex justify-end pl-8 pr-5 rounded-bl-[70px]",
          "bg-background/40 backdrop-blur-sm cursor-default"
        )}
      >
        <MainButton onClick={handleSwitchTheme}>
          <LampCeiling className="h-full w-auto block" />
        </MainButton>
        <ButtonGroupSeparator />
        <MainButton onClick={() => appWindow.minimize()}>
          <Minus className="h-full w-auto block" />
        </MainButton>
        <ButtonGroupSeparator />
        <MainButton onClick={() => appWindow.toggleMaximize()}>
          {isMax
            ? <Minimize2 className="h-full w-auto block" />
            : <Expand className="h-full w-auto block" />
          }
        </MainButton>
        <ButtonGroupSeparator />
        <MainButton onClick={handleClose}>
          <X className="h-full w-auto block" />
        </MainButton>
      </div>
    </div>
  )
}
