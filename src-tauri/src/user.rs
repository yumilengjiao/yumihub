use std::error::Error;

use tauri::App;

pub mod entity;

/// config模块初始化函数
pub fn init(app: &mut App) -> Result<(), Box<dyn Error>> {
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

// 保存全局user变量到user.json文件中持久化存储,此函数是同步阻塞地将全局
// 配置保存到磁盘上,一般会在程序退出时调用,而对于每种数据类型自己也有实现一
// 个update方法，update方法用于更新本模块的GLOBAL_CONFIG(全局配置信息变量)内
// 的数据
// feature: 未来可能会在update方法里面异步的动态保存配置信息，动态维护一个配
// 置文件内容的hash值来决定save_config函数是否调用，目前是程序推出前save_config
// 函数被调用
pub fn save_config() -> Result<(), Box<dyn Error>> {
    Ok(())
}
