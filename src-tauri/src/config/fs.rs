use sqlx::SqlitePool;
use tauri::{AppHandle, Manager};
use tauri_plugin_log::log::{debug, error, info};

use crate::{
    config::{entity::Config, CONFIG_PATH, GLOBAL_CONFIG},
    error::{AppError, FileAction},
};
use std::fs;

// 此函数用于加载配置文件，若配置文件不存在则会在用户配置文件目录创建配置文件
// 并写入默认配置，若文件存在则读取文件内容并加载到全局config变量中,文件格式
// 默认使用json
pub fn load_config(app_handle: AppHandle) -> Result<(), AppError> {
    let config_path = CONFIG_PATH.get().unwrap();

    let backup_dir = app_handle
        .path()
        .app_local_data_dir()
        .expect("读取程序data目录失败")
        .join("backup");

    let assets_dir = app_handle
        .path()
        .app_local_data_dir()
        .expect("读取程序data目录失败")
        .join("assets");

    let screenshots_dir = app_handle
        .path()
        .app_local_data_dir()
        .expect("读取程序data目录失败")
        .join("screenshots");

    // 如果配置文件不存在则创建一个配置文件并赋予初始值
    if let Some(config_dir) = config_path.parent() {
        //创建程序目录
        fs::create_dir_all(config_dir).map_err(|e| AppError::Config {
            action: FileAction::Create,
            path: config_dir.to_string_lossy().into(),
            message: format!("无法创建配置目录: {}", e),
        })?;
        {
            let mut config = GLOBAL_CONFIG.write().unwrap();
            config.storage.backup_save_path = backup_dir.clone();
            config.storage.meta_save_path = assets_dir.clone();
            config.storage.screenshot_path = screenshots_dir.clone();
        }
    }
    if !config_path.exists() {
        // 创建配置文件并写入默认配置
        save_config(&app_handle)?
    }

    // 如果资源目录不存在则创建一个资源目录
    if !assets_dir.exists() {
        std::fs::create_dir_all(&*assets_dir).ok();
    }

    // 如果存档备份目录不存在则创建一个备份目录
    if !backup_dir.exists() {
        std::fs::create_dir_all(&*backup_dir).ok();
    }

    // 如果快照目录不存在则创建一个备份目录
    if !screenshots_dir.exists() {
        std::fs::create_dir_all(&*screenshots_dir).ok();
    }

    // 读取配置文件并加载到全局变量
    let file_text = fs::read_to_string(config_path).map_err(|e| AppError::Config {
        action: FileAction::Read,
        path: config_path.to_string_lossy().into(),
        message: e.to_string(),
    })?;
    // json解析配置文件
    match serde_json::from_str::<Config>(&file_text) {
        Ok(config) => {
            let mut origin_config = GLOBAL_CONFIG.write().unwrap();
            *origin_config = config;
        }
        Err(e) => {
            error!("解析JSON 失败: {}", e);
        }
    }
    Ok(())
}

/// 保存全局config变量到config.json文件中持久化存储,此函数是同步阻塞地将全局
/// 配置保存到磁盘上,一般会在程序退出时调用,而对于每种数据类型自己也有实现一
/// 个update方法，update方法用于更新本模块的GLOBAL_CONFIG(全局配置信息变量)内
/// 的数据
pub fn save_config(app_handle: &AppHandle) -> Result<(), AppError> {
    info!("程序退出：开始最后一次持久化配置");

    let pool = app_handle.state::<SqlitePool>();

    let latest_game_id = tauri::async_runtime::block_on(async {
        sqlx::query_scalar("SELECT id FROM games WHERE last_played_at IS NOT NULL ORDER BY last_played_at DESC LIMIT 1")
            .fetch_optional(pool.inner())
            .await
    }).map_err(|e| AppError::DB(format!("退出时查询失败: {}", e)))?;

    // 修改内存配置 (GLOBAL_CONFIG)
    {
        let mut config = GLOBAL_CONFIG.write().expect("获取写锁失败");
        // 这里解开 Option<String>
        if let Some(id) = latest_game_id {
            let order = &mut config.basic.game_display_order;
            if order.get(0) != Some(&id) {
                order.retain(|x| x != &id);
                order.insert(0, id);
                debug!("退出前已修正顺序");
            }
        }
    }

    // 同步写入文件
    let config_path_buf = CONFIG_PATH.get().ok_or_else(|| AppError::Config {
        action: FileAction::Write,
        path: "UNKNOWN".into(),
        message: "CONFIG_PATH未初始化".into(),
    })?;

    let json_data = {
        let config = GLOBAL_CONFIG.read().expect("获取读锁失败");
        serde_json::to_string_pretty(&*config).unwrap()
    };

    fs::write(config_path_buf, json_data).map_err(|e| AppError::Config {
        action: FileAction::Write,
        path: config_path_buf.to_string_lossy().into(),
        message: format!("退出保存失败: {}", e),
    })?;

    Ok(())
}
