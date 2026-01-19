//! #该模块用于控制各个模块初始化的顺序

use crate::{config, state};
use std::error::Error;
use tauri::App;

/// 初始化函数,该模块唯一被外部调用的接口
pub fn init(app: &mut App) -> Result<(), Box<dyn Error>> {
    state::init();
    config::init(app)?;
    Ok(())
}
