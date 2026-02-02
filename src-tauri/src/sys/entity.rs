use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

/// 系统的某些硬件的状态
///
/// * `cpu_usage`: cpu使用率
/// * `memory_usage`: 内存使用率
#[derive(Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "camelCase")]
pub struct SystemStats {
    pub cpu_usage: f64,
    pub memory_usage: f64,
}

/// 可访问的权限文件
///
/// * `id`: 唯一标识
/// * `file_path`: 文件路
/// * `authorized_at`: 添加文件时的时间
#[derive(FromRow, Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthScope {
    pub id: String,
    pub path: String,
    pub authorized_at: Option<DateTime<Local>>,
}
