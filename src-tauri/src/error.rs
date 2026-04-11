//! 统一应用错误类型
//!
//! 所有 `#[tauri::command]` 函数都应返回 `Result<T, AppError>`，
//! 不再出现 `Result<T, String>` 的混用。

use serde::Serialize;
use thiserror::Error;

/// 文件操作动作，用于 Config 错误的上下文描述
#[derive(Debug, Serialize)]
pub enum FileAction {
    Read,
    Write,
    Create,
}

/// 应用统一错误枚举
///
/// `serde` 的 `tag + content` 模式让前端收到结构化 JSON：
/// `{ "type": "DB", "details": "..." }`
#[derive(Debug, Error, Serialize)]
#[serde(tag = "type", content = "details")]
pub enum AppError {
    #[error("配置文件操作失败 | 动作: {action:?}, 路径: {path}, 原因: {message}")]
    Config {
        action: FileAction,
        path: String,
        message: String,
    },

    #[error("解析路径失败，路径: {0}，原因: {1}")]
    Resolve(String, String),

    #[error("数据库错误: {0}")]
    DB(String),

    #[error("文件系统错误: {0}")]
    File(String),

    #[error("获取锁失败: {0}")]
    Mutex(String),

    #[error("授权失败: {0}")]
    Auth(String),

    #[error("进程错误: {0}")]
    Process(String),

    #[error("错误: {0}")]
    Generic(String),
}
