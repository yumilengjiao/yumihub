import { Cmds } from "@/lib/enum";
import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface shortcutStoreParams {
  shortcuts: ShortcutSetting[],
  fetchShortcuts: () => Promise<void>,
  updateShorts: (shortcuts: ShortcutSetting[]) => Promise<void>,
}

const useShortcutStore = create<shortcutStoreParams>()(immer((set) => ({
  shortcuts: [],
  async fetchShortcuts() {
    const shortcuts = await invoke<ShortcutSetting[]>(Cmds.GET_SHORTCUTS)
    set(state => {
      state.shortcuts = shortcuts
    })
  },
  async updateShorts(shortcuts) {
    set(state => {
      state.shortcuts = shortcuts
    })
    invoke(Cmds.UPDATE_SHORTCUTS, { shortcuts: shortcuts })
  },
})))

useShortcutStore.getState().fetchShortcuts()

export default useShortcutStore
