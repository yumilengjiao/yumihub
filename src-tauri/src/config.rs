use std::{error::Error, path::PathBuf, sync::OnceLock};

use lazy_static::lazy_static;
use tauri::{App, Manager};

use crate::config::{entity::Config, fs::load_config};

mod entity;
mod fs;

/// config包下的全局变量
pub static CONFIG_PATH_BUF: OnceLock<PathBuf> = OnceLock::new();
lazy_static! {
    pub static ref GLOBAL_CONFIG: Config = Config::default();
}

/// config模块初始化函数
pub fn init(app: &mut App) -> Result<(), Box<dyn Error>> {
    set_config_path(app.path().app_config_dir()?);
    //加载配置文件
    load_config()?;
    Ok(())
}

fn set_config_path(config_path: PathBuf) {
    CONFIG_PATH_BUF.set(config_path).unwrap();
}
