import { Cmds } from "@/lib/enum"
import { ShortcutSetting } from "@/types/shortcut"
import { invoke } from "@tauri-apps/api/core"
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

interface ShortcutStore {
  shortcuts: ShortcutSetting[]
  fetchShortcuts: () => Promise<void>
  updateShortcuts: (shortcuts: ShortcutSetting[]) => Promise<void>
}

const useShortcutStore = create<ShortcutStore>()(
  immer((set) => ({
    shortcuts: [],

    async fetchShortcuts() {
      const data = await invoke<ShortcutSetting[]>(Cmds.GET_SHORTCUTS)
      set(s => { s.shortcuts = data })
    },

    async updateShortcuts(shortcuts) {
      set(s => { s.shortcuts = shortcuts })
      await invoke(Cmds.UPDATE_SHORTCUTS, { shortcuts })
    },
  }))
)

export default useShortcutStore
