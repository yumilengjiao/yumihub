use std::{error::Error, fs};

use crate::{
    config::{entity::UpdateConfig, CONFIG_PATH_BUF, GLOBAL_CONFIG},
    error::{AppError, FileAction},
};

/// 此函数用于加载配置文件，若配置文件不存在则会在用户配置文件目录创建配置文件
/// 并写入默认配置，若文件存在则读取文件内容并加载到全局config变量中,文件格式
/// 默认使用json
pub fn load_config() -> Result<(), Box<dyn Error>> {
    let config_path_buf = CONFIG_PATH_BUF.get().unwrap().join("config.json");
    let config_file_name = config_path_buf.to_str().unwrap();

    // 如果配置文件不存在则创建一个配置文件并赋予初始值
    if !config_path_buf.exists() {
        //创建程序目录
        fs::create_dir_all(CONFIG_PATH_BUF.get().unwrap()).map_err(|e| AppError::Config {
            action: FileAction::Create,
            path: config_path_buf.to_string_lossy().into_owned(),
            message: format!("无法创建配置目录: {}", e),
        })?;
        //创建配置文件并写入默认配置
        save_config()?
    }

    println!("{:?}", config_file_name);

    //读取配置文件并加载到全局变量
    let file_text = fs::read_to_string(config_file_name).map_err(|e| AppError::Config {
        action: FileAction::Read,
        path: config_file_name.to_string(),
        message: e.to_string(),
    })?;
    println!("{}", file_text);
    Ok(())
}

/// 用于更改全局配置文件配置信息
/// 程序关闭时也会默认执行此任务
pub fn update_config<T: UpdateConfig>(new_value: T) {
    let mut global_config = GLOBAL_CONFIG.write().expect("获取写锁失败");
    new_value.update(&mut *global_config);
    synchronize_global_config_to_the_state();
}

/// 保存全局config变量到config.json文件中持久化存储
pub fn save_config() -> Result<(), Box<dyn Error>> {
    let config_path_buf = CONFIG_PATH_BUF.get().unwrap().join("config.json");
    let config_file_name = config_path_buf.to_str().unwrap();
    let config_read_only = GLOBAL_CONFIG.read().expect("获取读锁失败");

    let json_data = serde_json::to_string_pretty(&*config_read_only).unwrap();
    fs::write(&config_path_buf, json_data).map_err(|e| AppError::Config {
        action: FileAction::Write,
        path: config_file_name.to_string(),
        message: format!("{},具体错误:{}", "写入config文件失败", e),
    })?;
    Ok(())
}

pub fn synchronize_global_config_to_the_state() {}
