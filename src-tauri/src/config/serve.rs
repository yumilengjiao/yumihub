use std::path::PathBuf;

use tauri::{async_runtime, AppHandle};
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_log::log::{error, info, warn};

use crate::{
    config::{entity::ConfigEvent, ASSETS_DIR, GLOBAL_CONFIG},
    message::{traits::MessageHub, CONFIG_MESSAGE_HUB},
    util::copy_dir_recursive,
};

/// config模块的消息队列循环监听函数
///
/// * `app_handler`: tauri_app句柄
fn listening_loop(app_handler: &AppHandle) {
    let handler = app_handler.clone();
    let mut rx = CONFIG_MESSAGE_HUB.subscribe();
    tauri::async_runtime::spawn(async move {
        while let Ok(e) = rx.recv().await {
            match e {
                ConfigEvent::Basic { base } => {}
                ConfigEvent::Storage { stroage } => {}
                ConfigEvent::System { sys } => {}
                ConfigEvent::Interface { interface } => {}
            }
        }
    });
}

// ----------------------------------------------------------
// ------------------------基础设置--------------------------
// ----------------------------------------------------------

/// 用于设置是否允许程序自启动
///
/// * `app_handler`: App句柄
/// * `yes`: true: 自启动，false: 不自启动
fn enable_auto_start(app_handler: AppHandle, yes: bool) {
    if !yes {
        let result = app_handler.autolaunch().disable();
        if let Err(e) = result {
            error!("取消程序自启动失败: {}", e);
        }
    } else {
        let result = app_handler.autolaunch().enable();
        if let Err(e) = result {
            error!("启动程序自启动失败: {}", e);
        }
    }
}

/// 用于设置程序是否静默启动
///
/// * `yes`: true: 静默启动，false: 禁止静默启动
fn enable_slient_start(yes: bool) {
    let result = GLOBAL_CONFIG.write();
    match result {
        Ok(mut config) => config.basic.silent_start = yes,
        Err(_) => {
            error!("获取config写锁失败");
        }
    }
}

/// 用于设置程序是否自动检查更新
///
/// * `yes`: 是否启动自动更新
fn enable_auto_update(yes: bool) {
    let result = GLOBAL_CONFIG.write();
    match result {
        Ok(mut config) => config.basic.auto_check_update = yes,
        Err(_) => {
            error!("获取config写锁失败");
        }
    }
}

/// 用于设置程序语言
///
/// * `language`: 程序语言
fn set_language(language: String) {
    let result = GLOBAL_CONFIG.write();
    match result {
        Ok(mut config) => config.basic.language = language,
        Err(_) => {
            error!("获取config写锁失败");
        }
    }
}

// ----------------------------------------------------------
// ------------------------界面设置--------------------------
// ----------------------------------------------------------

// ----------------------------------------------------------
// ------------------------界面设置--------------------------
// ----------------------------------------------------------

// ----------------------------------------------------------
// ------------------------备份设置--------------------------
// ----------------------------------------------------------

/// 用于改变资源下载路径,路径改变后开始迁移资源
///
/// * `path`: 新的资源下载路径
pub fn set_game_meta_data_load_path(path: String) {
    let result = GLOBAL_CONFIG.write();
    match result {
        Ok(mut config) => {
            let path_cp = path.clone();
            let assets_path: PathBuf = path.into();
            config.storage.game_save_path = assets_path;
            // 开始转移数据
            async_runtime::spawn(async move {
                let old_path = {
                    let guard = ASSETS_DIR.read();
                    if guard.is_err() {
                        warn!("无法获取资源路径");
                        return;
                    }
                    guard.unwrap().clone()
                };
                let new_path = PathBuf::from(&path_cp);

                // 检查旧路径是否存在
                if !old_path.exists() {
                    warn!("旧路径 {:?} 不存在，跳过迁移", old_path);
                    return;
                }

                // 创建新目标目录（确保父级目录都存在）
                if let Err(e) = std::fs::create_dir_all(&new_path) {
                    error!("无法创建新目录: {:?}", e);
                    return;
                }

                // 执行迁移
                match copy_dir_recursive(&old_path, &new_path).await {
                    Ok(_) => {
                        info!("资源复制成功，准备清理旧数据");
                        // 4. 复制成功后，删除旧文件夹
                        let _ = std::fs::remove_dir_all(old_path);
                        info!("旧资源已清理完毕");
                    }
                    Err(e) => error!("迁移失败: {:?}", e),
                }
            });
        }
        Err(_) => {
            error!("获取config写锁失败");
        }
    }
}

/// 设置全局的备份存档位置,在改变时转义备份文件
///
/// * `path`: 备份存档的目录
pub fn set_backup_path(path: String) {
    let result = GLOBAL_CONFIG.write();
    match result {
        Ok(mut config) => config.storage.game_save_path = path.into(),
        Err(_) => {
            error!("获取config写锁失败");
        }
    }
}
