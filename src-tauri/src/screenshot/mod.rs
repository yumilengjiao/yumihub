//! 截图模块
pub mod commands;
pub mod entity;

use crate::{config::read_config, error::AppError};
use tauri::{AppHandle, Runtime};

pub fn init<R: Runtime>(_handle: &AppHandle<R>) -> Result<(), AppError> {
    // 确保截图目录存在
    let path = read_config()?.storage.screenshot_path.clone();
    std::fs::create_dir_all(&path)?;
    Ok(())
}
