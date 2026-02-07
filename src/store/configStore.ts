import { Cmds } from "@/lib/enum";
import { Config, SideBarMode, ThemeMode } from "@/types/config";
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
      gameDisplayOrder: [],
      language: "zh-cn",
    },
    interface: {
      themeMode: ThemeMode.Daytime,
      themeColor: "Emerald",
      sidebarMode: SideBarMode.Trigger,
      fontFamily: "sys",
    },
    system: {
      companion: false,
      hotkeyActivation: false,
      closeButtonBehavior: "quit", // 假设默认行为
      logLevel: "info",
      downloadConcurrency: 3,
    },
    storage: {
      backupSavePath: "",
      metaSavePath: "",
      screenshotPath: "",
      autoBackup: false,
    },
  },
  updateConfig(fn: (config: Config) => void) {
    console.log("开始更新配置信息")
    set(state => {
      fn(state.config)
    })
    try {
      invoke(Cmds.UPDATE_CONFIG, { config: get().config })
      console.log("更新完成")
    } catch (error) {
      console.error("更新配置信息失败", error)
    }
  },
})))

export default useConfigStore
