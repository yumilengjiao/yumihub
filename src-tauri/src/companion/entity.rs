use std::process::Child;

use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

//连携程序
#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Companion {
    pub id: Option<i32>, // 覆盖更新时，ID 是可选的
    pub name: String,
    pub path: String,
    pub args: Option<String>,
    pub is_enabled: bool,
    pub is_window_managed: bool, // 窗口是否被程序控制
    pub trigger_mode: String,    // "app" 或 "game"
    pub sort_order: i32,
    pub description: Option<String>,
}

// 活跃程序的模型
pub struct ActiveProcess {
    pub child: Child,
    pub is_window_managed: bool,
}
