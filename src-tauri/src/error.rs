//! 统一错误类型
//!
//! 所有 `#[tauri::command]` 均返回 `Result<T, AppError>`。
//! `serde` 的 tag+content 让前端收到可解析的 JSON：
//! `{ "type": "Db", "details": "..." }`

use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Serialize)]
pub enum FileAction {
    Read,
    Write,
    Create,
}

#[derive(Debug, Error, Serialize)]
#[serde(tag = "type", content = "details")]
pub enum AppError {
    #[error("配置操作失败 | 动作:{action:?} 路径:{path} 原因:{message}")]
    Config {
        action: FileAction,
        path: String,
        message: String,
    },

    #[error("路径解析失败: {0} — {1}")]
    Resolve(String, String),

    #[error("数据库错误: {0}")]
    Db(String),

    #[error("文件系统错误: {0}")]
    Fs(String),

    #[error("锁获取失败: {0}")]
    Lock(String),

    #[error("权限错误: {0}")]
    Auth(String),

    #[error("进程错误: {0}")]
    Process(String),

    #[error("下载失败: {0}")]
    Network(String),

    #[error("{0}")]
    Generic(String),
}

// ── From 转换，减少调用处的 .map_err ──────────────────────────────────────

impl From<sqlx::Error> for AppError {
    fn from(e: sqlx::Error) -> Self {
        AppError::Db(e.to_string())
    }
}

impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        AppError::Fs(e.to_string())
    }
}

impl From<reqwest::Error> for AppError {
    fn from(e: reqwest::Error) -> Self {
        AppError::Network(e.to_string())
    }
}
