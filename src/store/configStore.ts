import { Cmds } from "@/lib/enum";
import { Config, SideBarMode, ThemeColor, ThemeMode } from "@/types/config";
import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface ConfigStore {
  config: Config
  updateConfig: (fn: (config: Config) => void) => void
}

const useConfigStore = create<ConfigStore>()(immer((set, get) => ({
  config: {
    basic: {
      autoStart: false,
      silentStart: false,
      autoCheckUpdate: false,
      language: "zh-cn",
    },
    interface: {
      themeMode: ThemeMode.Daytime,
      themeColor: ThemeColor.White,
      sidebarMode: SideBarMode.Trigger,
      fontFamily: "sys",
    },
    system: {
      closeButtonBehavior: "quit", // 假设默认行为
      logLevel: "info",
      downloadConcurrency: 3,
    },
    storage: {
      backupSavePath: "",
      metaSavePath: "",
    },
  },
  updateConfig(fn: (config: Config) => void) {
    set(state => {
      fn(state.config)
    })
    invoke(Cmds.UPDATE_CONFIG, { config: get().config })
  },
})))

export default useConfigStore
