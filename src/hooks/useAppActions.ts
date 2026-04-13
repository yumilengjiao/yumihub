import { useNavigate } from "react-router"
import { invoke } from "@tauri-apps/api/core"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { open } from "@tauri-apps/plugin-shell"
import { toast } from "sonner"
import useConfigStore from "@/store/configStore"
import useGameStore from "@/store/gameStore"
import { Cmds } from "@/lib/enum"
import { getNextThemeMode } from "@/hooks/useTheme"

interface ActionItem {
  command: string
  params?: Record<string, any>
}

export const useAppActions = () => {
  const navigate = useNavigate()
  const appWindow = getCurrentWindow()
  const { config, updateConfig } = useConfigStore()
  const { gameMetaList } = useGameStore()

  const COMMAND_MAP: Record<string, (params: any) => void> = {
    navigate: (params) => {
      if (params?.destination) navigate(params.destination)
    },

    windowManage: async (params) => {
      const op = params?.op
      if (!op) {
        const isMaximized = await appWindow.isMaximized()
        isMaximized ? await appWindow.unmaximize() : await appWindow.maximize()
        return
      }
      switch (op) {
        case "maximize": await appWindow.maximize(); break
        case "unmaximize": await appWindow.unmaximize(); break
        case "minimize": await appWindow.minimize(); break
        case "close":
          config.system.closeButtonBehavior === "Hide"
            ? await appWindow.hide()
            : await appWindow.close()
          break
        case "hide": await appWindow.hide(); break
        case "toggle": {
          const max = await appWindow.isMaximized()
          max ? await appWindow.unmaximize() : await appWindow.maximize()
          break
        }
      }
    },

    switchTheme: () => {
      updateConfig(d => {
        d.interface.themeMode = getNextThemeMode(d.interface.themeMode)
      })
    },

    alert: (params) => {
      toast(params?.content)
    },

    invoke: async (params) => {
      try {
        await invoke(params.cmd, params.args || {})
      } catch (err) {
        console.error("Tauri invoke 失败:", err)
      }
    },

    openLink: (params) => {
      if (params?.url) open(params.url)
    },

    startLastGame: () => {
      const sorted = [...gameMetaList].sort((a, b) => {
        const tA = a.lastPlayedAt ? new Date(a.lastPlayedAt).getTime() : 0
        const tB = b.lastPlayedAt ? new Date(b.lastPlayedAt).getTime() : 0
        return tB - tA
      })
      if (sorted.length > 0) {
        invoke(Cmds.START_GAME, { game: sorted[0] })
      }
    },

    // 兼容旧版 action 名称
    startUplastedGame: () => {
      COMMAND_MAP.startLastGame(null)
    },
  }

  const runActions = (actions: ActionItem | ActionItem[] | undefined) => {
    if (!actions) return
    const list = Array.isArray(actions) ? actions : [actions]
    list.forEach(action => {
      const exec = COMMAND_MAP[action.command]
      if (exec) exec(action.params)
      else console.warn(`未知 action: ${action.command}`)
    })
  }

  return { runActions }
}
