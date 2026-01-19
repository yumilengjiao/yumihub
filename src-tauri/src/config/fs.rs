use std::{error::Error, fs};

use crate::{
    config::{CONFIG_PATH_BUF, GLOBAL_CONFIG},
    error::{AppError, FileAction},
};

/// 加载配置文件，赋值全局配置变量
pub fn load_config() -> Result<(), Box<dyn Error>> {
    let config_path_buf = CONFIG_PATH_BUF.get().unwrap().join("config.json");
    let config_file_name = config_path_buf.to_str().unwrap();

    // 如果配置文件不存在则创建一个配置文件并赋予初始值
    if !config_path_buf.exists() {
        //讲默认配置变量转化成json格式字符串
        let json_data = serde_json::to_string_pretty(&*GLOBAL_CONFIG)
            .map_err(|_| AppError::JSON("json序列化失败".to_string()))?;
        //创建程序目录
        fs::create_dir_all(CONFIG_PATH_BUF.get().unwrap()).map_err(|e| AppError::Config {
            action: FileAction::Create,
            path: config_path_buf.to_string_lossy().into_owned(),
            message: format!("无法创建配置目录: {}", e),
        })?;
        //创建配置文件并写入默认配置
        fs::write(&config_path_buf, json_data).map_err(|e| AppError::Config {
            action: FileAction::Write,
            path: config_file_name.to_string(),
            message: format!("{},具体错误:{}", "写入config文件失败", e),
        })?;
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
