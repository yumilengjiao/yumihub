use std::error::Error;
use std::fs;
use std::path::PathBuf;
use std::sync::OnceLock;
use std::sync::RwLock;

use lazy_static::lazy_static;
use tauri::App;
use tauri::Manager;

use crate::error::AppError;
use crate::error::FileAction;
use crate::state::set_gui_info;
use crate::state::set_user_info;
use crate::state::traits::SyncData;
use crate::state::traits::UpdateConfig;
use crate::user::entity::User;

pub mod entity;

lazy_static! {
    pub static ref USER_PROFILE: RwLock<User> = RwLock::new(User::default());
    pub static ref USER_CONFIG_PATH_BUF: OnceLock<PathBuf> = OnceLock::new();
}

/// config模块初始化函数
pub fn init(app: &mut App) -> Result<(), Box<dyn Error>> {
    //设置配置文件路径
    set_config_path(app.path().app_config_dir()?.join("user.json"));
    //加载用户配置文件
    load_user_config()?;
    Ok(())
}

fn set_config_path(config_path: PathBuf) {
    USER_CONFIG_PATH_BUF.set(config_path).unwrap();
}

// 此函数用于加载配置文件，若配置文件不存在则会在用户配置文件目录创建配置文件
// 并写入默认配置，若文件存在则读取文件内容并加载到全局config变量中,文件格式
// 默认使用json
pub fn load_user_config() -> Result<(), Box<dyn Error>> {
    let config_path_buf = USER_CONFIG_PATH_BUF.get().unwrap();
    let config_file_name = config_path_buf.to_str().unwrap();

    // 如果配置文件不存在则创建一个配置文件并赋予初始值
    if !config_path_buf.exists() {
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
    // json解析配置文件
    match serde_json::from_str::<User>(&file_text) {
        Ok(user) => {
            println!("解析json文件成功");
            update_data(user);
        }
        Err(e) => {
            eprintln!("解析 JSON 失败: {}", e);
        }
    }
    Ok(())
}

/// 用于更改全局配置文件某些数据内容配置信息,通过传GameList，GameMeta等数据
/// 来自动实现GLOBAL_CONFIG的动态更新,并且实现数据同步到STATE_SYSTEM
pub fn update_data<T: UpdateConfig<User> + SyncData>(new_value: T) {
    {
        let mut user_profile = USER_PROFILE.write().expect("获取写锁失败");
        new_value.update(&mut user_profile);
    }

    //方法不放在update里,而是用sync_data，不然会造成死锁问题
    new_value.sync_data();
}

// 保存全局user变量到user.json文件中持久化存储,此函数是同步阻塞地将全局
// 配置保存到磁盘上,一般会在程序退出时调用,而对于每种数据类型自己也有实现一
// 个update方法，update方法用于更新本模块的GLOBAL_CONFIG(全局配置信息变量)内
// 的数据
// feature: 未来可能会在update方法里面异步的动态保存配置信息，动态维护一个配
// 置文件内容的hash值来决定save_config函数是否调用，目前是程序推出前save_config
// 函数被调用
pub fn save_config() -> Result<(), Box<dyn Error>> {
    let config_path_buf = USER_CONFIG_PATH_BUF.get().unwrap();
    let config_file_name = config_path_buf.to_str().unwrap();
    let user_profile = USER_PROFILE.read().expect("获取读锁失败");

    let json_data = serde_json::to_string_pretty(&*user_profile).unwrap();
    fs::write(config_path_buf, json_data).map_err(|e| AppError::Config {
        action: FileAction::Write,
        path: config_file_name.to_string(),
        message: format!("{},具体错误:{}", "写入config文件失败", e),
    })?;
    Ok(())
}

pub fn synchronize_user_to_state_system(new_user: &User) {
    set_user_info(new_user.clone());
}
