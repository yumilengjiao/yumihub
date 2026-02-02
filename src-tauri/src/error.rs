//! 自定义系统错误类型,让前端处理

use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Serialize)]
pub enum FileAction {
    Read,
    Write,
    Create,
}

#[derive(Debug, Error, Serialize)]
#[serde(tag = "type", content = "details")] // 给前端返回更友好的 JSON 结构
pub enum AppError {
    #[error("配置文件操作失败 | 动作: {action:?}, 路径: {path:?}, 原因: {message}")]
    Config {
        action: FileAction,
        path: String,
        message: String, // 将原始错误转为字符串存储，以便序列化
    },
    #[error("解析路径失败,路径:{0}---原始错误消息:{1}")]
    Resolve(String, String),

    #[error("数据库错误: {0}")]
    DB(String),

    #[error("文件系统错误: {0}")]
    File(String),

    #[error("获取锁失败: {0}")]
    Mutex(String),

    #[error("授权失败: {0}")]
    Auth(String),
}
