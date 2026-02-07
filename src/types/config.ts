/**
 * 全局配置类型
 */
export interface Config {
  basic: Basic;
  interface: Interface;
  system: System;
  storage: Storage;
}

// -----------------------------------------------------
// ------------------------基础配置---------------------
// -----------------------------------------------------

export interface Basic {
  autoStart: boolean
  silentStart: boolean
  autoCheckUpdate: boolean
  language: string
  gameDisplayOrder: string[]
}

// -----------------------------------------------------
// ------------------------界面配置---------------------
// -----------------------------------------------------

export interface Interface {
  themeMode: ThemeMode;
  themeColor: string;
  sidebarMode: SideBarMode;
  fontFamily: string;
}

export enum ThemeMode {
  System = "System",
  Daytime = "Daytime",
  Night = "Night",
}


export enum SideBarMode {
  Trigger = "Trigger",
  NormalFixed = "NormalFixed",
  ShortFixed = "ShortFixed",
}

// -----------------------------------------------------
// ------------------------存储配置---------------------
// -----------------------------------------------------

export interface Storage {
  /** 游戏存档备份路径 */
  backupSavePath: string
  /** 游戏资源保存路径 */
  metaSavePath: string
  /** 游戏快照保存路径 */
  screenshotPath: string
  /** 是否自动备份 */
  autoBackup: boolean
}

// -----------------------------------------------------
// ------------------------系统配置---------------------
// -----------------------------------------------------

export interface System {
  companion: boolean
  hotkeyActivation: boolean
  /** 关闭按钮行为 */
  closeButtonBehavior: string
  logLevel: string
  /** 下载并发量上限 */
  downloadConcurrency: number // Rust 中的 i64 对应 TS 的 number
}

