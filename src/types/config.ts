/**
 * 全局配置类型
 */
export interface Config {
  basic: Basic
  interface: Interface
  system: System
  storage: Storage
  auth: Authorization
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
  /** 所有游戏的根目录(用于防止所有游戏压缩后的目录) */
  galRootDir: string
  /** 是否允许下载游戏资源到本地 */
  allowDownloadingResources: boolean
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

// -----------------------------------------------------
// ------------------------授权配置---------------------
// -----------------------------------------------------
export interface Authorization {
  bangumiToken: string
}

