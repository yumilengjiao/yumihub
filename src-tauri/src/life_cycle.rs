//! #该模块用于控制整个程序的生命周期
use crate::{
    config::{self, fs},
    state,
    user::{self},
};
use std::error::Error;
use tauri::App;

/// 初始化函数
pub fn init(app: &mut App) -> Result<(), Box<dyn Error>> {
    state::init();
    config::init(app)?;
    user::init(app)?;
    Ok(())
}

/// 程序结束函数
pub fn exit() {
    user::save_config().expect("保存用户数据失败");
    fs::save_config().expect("保存配置文件失败");
}
