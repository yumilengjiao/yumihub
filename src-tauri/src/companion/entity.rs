use std::{process::Child, sync::Mutex};

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
    pub trigger_mode: String, // "app" 或 "game"
    pub sort_order: i32,
    pub description: Option<String>,
}
