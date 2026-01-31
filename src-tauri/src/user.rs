use std::error::Error;

pub mod entity;

/// user模块初始化函数
pub fn init() -> Result<(), Box<dyn Error>> {
    //加载用户配置文件
    load_user_config()?;
    Ok(())
}

// 此函数用于加载配置文件，若配置文件不存在则会在用户配置文件目录创建配置文件
// 并写入默认配置，若文件存在则读取文件内容并加载到全局config变量中,文件格式
// 默认使用json
pub fn load_user_config() -> Result<(), Box<dyn Error>> {
    Ok(())
}

/// 持久化保存用户数据
pub fn save_data() -> Result<(), Box<dyn Error>> {
    Ok(())
}
