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
  const hotkeyActivation = useConfigStore(s => s.config.system.hotkeyActivation)
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable ||
        !hotkeyActivation
      ) return

      if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return

      const keys: string[] = []
      if (e.ctrlKey) keys.push("Control")
      if (e.altKey) keys.push("Alt")
      if (e.shiftKey) keys.push("Shift")
      if (e.metaKey) keys.push("Command")

      const mainKey = e.key === " " ? "Space" : e.key.length === 1 ? e.key.toUpperCase() : e.key
      const combo = [...keys, mainKey].join("+")

      const action = shortcuts.find(s => s.keyCombo === combo)
      if (!action) return

      e.preventDefault()

      switch (action.id) {
        case "confirm_launch":
          if (selectedGame) invoke(Cmds.START_GAME, { game: selectedGame })
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
          console.debug("未绑定前端处理的快捷键:", action.id)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [shortcuts, selectedGame, hotkeyActivation, navigate])
}
