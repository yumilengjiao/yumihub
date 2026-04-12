//! 连携程序数据结构

use std::process::Child;

use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

/// 连携程序配置
#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Companion {
    pub id: Option<i32>,
    pub name: String,
    pub path: String,
    pub args: Option<String>,
    pub is_enabled: bool,
    /// 窗口是否随老板键一起隐藏
    pub is_window_managed: bool,
    /// `"app"` = 随程序启动，`"game"` = 随游戏启动
    pub trigger_mode: String,
    pub sort_order: i32,
    pub description: Option<String>,
}

/// 运行中的连携进程句柄
pub struct ActiveProcess {
    pub child: Child,
    pub is_window_managed: bool,
}
