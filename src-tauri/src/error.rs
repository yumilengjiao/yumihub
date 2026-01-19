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
    #[error("未找到文件:{0}")]
    NotFound(String),
    #[error("配置文件操作失败 | 动作: {action:?}, 路径: {path:?}, 原因: {message}")]
    Config {
        action: FileAction,
        path: String,
        message: String, // 将原始错误转为字符串存储，以便序列化
    },

    #[error("JSON 解析失败: {0}")]
    JSON(String),

    #[error("系统路径获取失败: {0}")]
    Env(String),
}
