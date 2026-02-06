use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tokio::sync::broadcast;

use crate::message::traits::{MessageEvent, MessageHub};

/// 全局配置类型
#[derive(Serialize, Deserialize, Default, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    pub basic: Basic,
    pub interface: Interface,
    pub system: System,
    pub storage: Storage,
}

// -----------------------------------------------------
// ------------------------界面配置---------------------
// -----------------------------------------------------

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Interface {
    pub theme_mode: ThemeMode,
    pub theme_color: ThemeColor,
    pub sidebar_mode: SideBarMode,
    pub font_family: String,
}

#[derive(Serialize, Deserialize, Default, Debug, Clone, PartialEq)]
pub enum ThemeMode {
    #[default]
    Daytime,
    Night,
}

#[derive(Serialize, Deserialize, Default, Debug, Clone, PartialEq)]
pub enum ThemeColor {
    #[default]
    White,
}

#[derive(Serialize, Deserialize, Default, Debug, Clone, PartialEq)]
pub enum SideBarMode {
    #[default]
    Trigger,
    NormalFixed,
    ShortFixed,
}

impl Default for Interface {
    fn default() -> Self {
        Self {
            theme_mode: ThemeMode::Daytime,
            theme_color: ThemeColor::White,
            sidebar_mode: SideBarMode::Trigger,
            font_family: "sys".into(),
        }
    }
}

// -----------------------------------------------------
// ------------------------基础配置---------------------
// -----------------------------------------------------

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Basic {
    pub auto_start: bool,
    pub silent_start: bool,
    pub auto_check_update: bool,
    pub language: String,
}

impl Default for Basic {
    fn default() -> Self {
        Self {
            auto_start: false,
            silent_start: false,
            auto_check_update: false,
            language: "zh".into(),
        }
    }
}

// -----------------------------------------------------
// ------------------------存储配置---------------------
// -----------------------------------------------------

/// 游戏相关资源路径
///
/// * `backup_save_path`: 游戏存档备份路径
/// * `meta_save_path`: 游戏资源下载路径
#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Storage {
    pub backup_save_path: PathBuf,
    pub meta_save_path: PathBuf,
    pub auto_backup: bool,
}

// -----------------------------------------------------
// ------------------------系统配置---------------------
// -----------------------------------------------------

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct System {
    pub companion: bool,
    pub hotkey_activation: bool,
    pub close_button_behavior: String,
    pub log_level: String,
    pub download_concurrency: i64,
}

impl Default for System {
    fn default() -> Self {
        Self {
            companion: true,
            hotkey_activation: true,
            close_button_behavior: "Exit".into(),
            log_level: "info".into(),
            download_concurrency: 5,
        }
    }
}

// -----------------------------------------------------
// ----------------------信息系统相关-------------------
// -----------------------------------------------------

/// config模块的消息事件
#[derive(Clone, Debug)]
pub enum ConfigEvent {
    // 基本配置任务
    Basic { base: Basic },
    // 数据库备份相关消息
    Storage { stroage: Storage },
    // 系统状态消息
    System { sys: System },
    // 界面任务
    Interface { interface: Interface },
}

impl MessageEvent for ConfigEvent {}

/// config模块集中式消息管理器
pub struct ConfigMessageHub {
    pub config_tx: broadcast::Sender<ConfigEvent>,
}

impl MessageHub<ConfigEvent> for ConfigMessageHub {
    fn new(capacity: usize) -> Self {
        let (tx, _) = broadcast::channel(capacity);
        Self { config_tx: tx }
    }

    // 提供一个便捷的订阅方法
    fn subscribe(&self) -> broadcast::Receiver<ConfigEvent> {
        self.config_tx.subscribe()
    }

    // 提供一个便捷的发布方法
    fn publish(&self, event: ConfigEvent) {
        let _ = self.config_tx.send(event);
    }
}
