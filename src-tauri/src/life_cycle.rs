//! #该模块用于控制整个程序的生命周期
use crate::{
    config::{self, fs},
    db, resource,
    user::{self},
};
use std::error::Error;
use tauri::App;

/// 初始化函数
pub fn init(app: &mut App) -> Result<(), Box<dyn Error>> {
    db::init(app.handle());
    config::init(app.handle())?;
    user::init()?;
    resource::init(app.handle());
    Ok(())
}

/// 程序结束函数,保存变量到本地
pub fn exit() {
    // 保存到配置文件
    fs::save_config().expect("保存配置文件失败");
}
