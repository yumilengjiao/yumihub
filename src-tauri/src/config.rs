use std::{
    error::Error,
    path::PathBuf,
    sync::{OnceLock, RwLock},
};

use lazy_static::lazy_static;
use tauri::{App, Manager};

use crate::config::{entity::Config, fs::load_config};

pub mod entity;
mod fs;
pub mod synchronize;
mod util;

/// config包下的全局变量: 配置文件路径
pub static CONFIG_PATH_BUF: OnceLock<PathBuf> = OnceLock::new();
lazy_static! {
    /// config包下的全局变量: 配置文件变量
    pub static ref GLOBAL_CONFIG: RwLock<Config> = RwLock::new(Config::default());
}

/// config模块初始化函数
pub fn init(app: &mut App) -> Result<(), Box<dyn Error>> {
    //设置配置文件路径
    set_config_path(app.path().app_config_dir()?);
    //加载配置文件
    load_config()?;
    Ok(())
}

fn set_config_path(config_path: PathBuf) {
    CONFIG_PATH_BUF.set(config_path).unwrap();
}
