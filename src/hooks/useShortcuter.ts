import { useEffect } from "react"
import { useNavigate } from "react-router"
import useShortcutStore from "@/store/shortcutStore"
import useGameStore from "@/store/gameStore"
import { invoke } from "@tauri-apps/api/core"
import { Cmds } from "@/lib/enum"
import useConfigStore from "@/store/configStore"

export function useShortcutHandler() {
  const { shortcuts } = useShortcutStore()
  const { selectedGame } = useGameStore()
  const { config } = useConfigStore()
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log("现在: ", config.system.hotkeyActivation)
      // 如果正在打字，或不允许快捷键，不触发快捷键
      const target = e.target as HTMLElement
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable ||
        !config.system.hotkeyActivation
      ) {
        return
      }


      const keys = []
      if (e.ctrlKey) keys.push("Control")
      if (e.altKey) keys.push("Alt")
      if (e.shiftKey) keys.push("Shift")
      if (e.metaKey) keys.push("Command")

      // 如果只按了修饰键，不处理
      if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return

      let mainKey = e.key === " " ? "Space" : e.key.length === 1 ? e.key.toUpperCase() : e.key
      const currentCombo = [...keys, mainKey].join("+")

      // 查找匹配的快捷键
      const action = shortcuts.find(s => s.keyCombo === currentCombo)

      if (action) {
        e.preventDefault() // 拦截系统默认行为

        // 分发逻辑
        switch (action.id) {
          case "confirm_launch":
            invoke(Cmds.START_GAME, { game: selectedGame })
            break
          case "nav_home":
            navigate("/")
            break
          case "nav_library":
            navigate("/library")
            break
          case "nav_profile":
            navigate("/user")
            break
          case "nav_settings":
            navigate("/setting")
            break
          default:
            console.log("未定义的前端行为:", action.id)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [shortcuts, navigate, config.system.hotkeyActivation]) // 监听配置变化，确保快捷键实时生效
}
