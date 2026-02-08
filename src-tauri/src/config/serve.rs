use std::path::PathBuf;

use tauri::{async_runtime, AppHandle};
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_log::log::{debug, error, info, warn};

use crate::{
    companion::commands::refresh_companions,
    config::{
        entity::{CloseBehavior, ConfigEvent, LogLevel, SideBarMode, ThemeMode},
        GLOBAL_CONFIG,
    },
    message::{traits::MessageHub, CONFIG_MESSAGE_HUB},
    shortcut::commands::refresh_shortcuts,
    util::copy_dir_recursive,
};

/// config模块的消息队列循环监听函数
///
/// * `app_handler`: tauri_app句柄
pub fn listening_loop(app_handler: AppHandle) {
    let mut rx = CONFIG_MESSAGE_HUB.subscribe();
    tauri::async_runtime::spawn(async move {
        while let Ok(event) = rx.recv().await {
            match event {
                ConfigEvent::Basic { base } => {
                    debug!("基本设置开始更新");
                    enable_auto_start(app_handler.clone(), base.auto_start);
                    enable_slient_start(base.silent_start);
                    enable_auto_update(base.auto_check_update);
                    set_game_display_order(base.game_display_order);
                    set_language(base.language);
                }
                ConfigEvent::System { sys } => {
                    debug!("系统设置开始更新");
                    change_compainion(app_handler.clone(), sys.companion);
                    change_hotkey_activation(app_handler.clone(), sys.hotkey_activation);
                    change_close_button_action(sys.close_button_behavior);
                    change_log_level(sys.log_level);
                    set_concurrent_number(sys.download_concurrency);
                }
                ConfigEvent::Interface { interface } => {
                    debug!("界面设置开始更新");
                    change_interface_mode(interface.theme_mode);
                    change_interface_color(interface.theme_color);
                    change_sidebar_mode(interface.sidebar_mode);
                    change_font_family(interface.font_family);
                }
                ConfigEvent::Storage { stroage } => {
                    debug!("备份设置开始更新");
                    set_game_meta_data_load_path(stroage.meta_save_path);
                    set_backup_path(stroage.backup_save_path);
                    set_screenshot_path(stroage.screenshot_path);
                    set_gal_root_dir(stroage.gal_root_dir);
                    set_allow_downloading_resources(stroage.allow_downloading_resources);
                    set_auto_back_up(stroage.auto_backup);
                }
                ConfigEvent::Authorization { auth } => {
                    debug!("权限设置开始更新");
                    set_bangumi_token(auth.bangumi_token);
                }
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

/// 修改首页展示游戏的排行顺序
///
/// * `new_order`: 新的游戏展示顺序
fn set_game_display_order(new_order: Vec<String>) {
    let result = GLOBAL_CONFIG.write();
    match result {
        Ok(mut config) => config.basic.game_display_order = new_order,
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
// ------------------------系统设置--------------------------
// ----------------------------------------------------------

/// 控制是否启用链式模式(启动游戏时其他自定义程序自动启动)
///
/// * `activation`: 激活状态
fn change_compainion(app_handler: AppHandle, activation: bool) {
    let result = GLOBAL_CONFIG.write();
    match result {
        Ok(mut config) => {
            config.system.companion = activation;
            tauri::async_runtime::spawn(async move {
                let result = refresh_companions(&app_handler, false).await;
                if result.is_err() {
                    error!("无法刷新连携程序设置");
                }
            });
        }
        Err(e) => {
            error!("{}", e);
        }
    }
}

/// 控制是否启用快捷键系统
///
/// * `activation`: 激活状态
fn change_hotkey_activation(app_handler: AppHandle, activation: bool) {
    let result = GLOBAL_CONFIG.write();
    match result {
        Ok(mut config) => {
            config.system.hotkey_activation = activation;
            tauri::async_runtime::spawn(async move {
                let result = refresh_shortcuts(&app_handler).await;
                if result.is_err() {
                    error!("无法刷新快捷键功能");
                }
            });
        }
        Err(e) => {
            error!("{}", e);
        }
    }
}

/// 改变关闭按钮的行为
///
/// * `action`: 关闭按钮的行为
pub fn change_close_button_action(action: CloseBehavior) {
    let result = GLOBAL_CONFIG.write();
    match result {
        Ok(mut config) => config.system.close_button_behavior = action,
        Err(e) => {
            error!("{}", e);
        }
    }
}

/// 改变日志记录级别
///
/// * `level`: 日志级别
pub fn change_log_level(level: LogLevel) {
    let result = GLOBAL_CONFIG.write();
    match result {
        Ok(mut config) => config.system.log_level = level,
        Err(e) => {
            error!("{}", e);
        }
    }
}

/// 改变日志记录级别
///
/// * `level`: 日志级别
pub fn set_concurrent_number(num: i64) {
    let result = GLOBAL_CONFIG.write();
    match result {
        Ok(mut config) => config.system.download_concurrency = num,
        Err(e) => {
            error!("{}", e);
        }
    }
}

// ----------------------------------------------------------
// ------------------------界面设置--------------------------
// ----------------------------------------------------------

/// 改变界面的外观模式
///
/// * `mode`: 外观模式--夜间或白天模式
pub fn change_interface_mode(mode: ThemeMode) {
    let result = GLOBAL_CONFIG.write();
    match result {
        Ok(mut config) => config.interface.theme_mode = mode,
        Err(e) => {
            error!("{}", e);
        }
    }
}

/// 改变主题色
///
/// * `mode`: 外观模式--夜间或白天模式
pub fn change_interface_color(color: String) {
    let result = GLOBAL_CONFIG.write();
    match result {
        Ok(mut config) => config.interface.theme_color = color,
        Err(e) => {
            error!("{}", e);
        }
    }
}

/// 改变侧边栏模式
///
/// * `mode`: 侧边栏模式
pub fn change_sidebar_mode(mode: SideBarMode) {
    let result = GLOBAL_CONFIG.write();
    match result {
        Ok(mut config) => config.interface.sidebar_mode = mode,
        Err(e) => {
            error!("{}", e);
        }
    }
}

pub fn change_font_family(font: String) {
    let result = GLOBAL_CONFIG.write();
    match result {
        Ok(mut config) => config.interface.font_family = font,
        Err(e) => {
            error!("{}", e);
        }
    }
}

// ----------------------------------------------------------
// ------------------------备份设置--------------------------
// ----------------------------------------------------------

/// 用于改变资源下载路径,路径改变后开始迁移资源
///
/// * `path`: 新的资源下载路径
pub fn set_game_meta_data_load_path(path: PathBuf) {
    let result = GLOBAL_CONFIG.write();
    match result {
        Ok(mut config) => {
            let path_cp = path.clone();
            let p1 = path.canonicalize().unwrap_or_else(|_| path.clone());
            let p2 = config
                .storage
                .meta_save_path
                .canonicalize()
                .unwrap_or_else(|_| config.storage.meta_save_path.clone());

            if p1 == p2 {
                return;
            }
            let old_path = config.storage.meta_save_path.clone();
            let assets_path: PathBuf = path;
            config.storage.meta_save_path = assets_path;
            // 开始转移数据
            async_runtime::spawn(async move {
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

/// 设置全局的备份存档位置,在改变时转移备份文件
///
/// * `path`: 备份存档的目录
pub fn set_backup_path(path: PathBuf) {
    let result = GLOBAL_CONFIG.write();
    match result {
        Ok(mut config) => {
            let old_path = config.storage.backup_save_path.clone();
            //改config全变量数据
            let cp_path = path.clone();
            let p1 = path.canonicalize().unwrap_or_else(|_| path.clone());
            let p2 = config
                .storage
                .backup_save_path
                .canonicalize()
                .unwrap_or_else(|_| config.storage.backup_save_path.clone());
            if p1 == p2 {
                return;
            }

            config.storage.backup_save_path = path;
            async_runtime::spawn(async move {
                let new_path: PathBuf = cp_path;

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

/// 用于更改快照文件目录
///
/// * `path`: 新的存放快照文件的目录
pub fn set_screenshot_path(path: PathBuf) {
    let result = GLOBAL_CONFIG.write();
    match result {
        Ok(mut config) => {
            let old_path = config.storage.screenshot_path.clone();
            //改config全变量数据
            let cp_path = path.clone();

            let p1 = path.canonicalize().unwrap_or_else(|_| path.clone());
            let p2 = config
                .storage
                .screenshot_path
                .canonicalize()
                .unwrap_or_else(|_| config.storage.screenshot_path.clone());
            if p1 == p2 {
                return;
            }

            config.storage.screenshot_path = path;
            async_runtime::spawn(async move {
                let new_path: PathBuf = cp_path;

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
                // TODO:这里数据库的数据也要一起改
                match copy_dir_recursive(&old_path, &new_path).await {
                    Ok(_) => {
                        info!("资源复制成功，准备清理旧数据");
                        // 复制成功后，删除旧文件夹
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

/// 用于设置所有游戏的根目录(实机是压缩包解压的根目录)
///
/// * `path`: 所有游戏的目录
pub fn set_gal_root_dir(path: PathBuf) {
    println!("config内的galroot被更新");
    let result = GLOBAL_CONFIG.write();
    match result {
        Ok(mut config) => config.storage.gal_root_dir = path,
        Err(e) => {
            error!("{}", e);
        }
    }
}

/// 改变是否允许下载资源字段
///
/// * `allowed`: 是否允许下载
fn set_allow_downloading_resources(allowed: bool) {
    let result = GLOBAL_CONFIG.write();
    match result {
        Ok(mut config) => config.storage.allow_downloading_resources = allowed,
        Err(e) => {
            error!("{}", e);
        }
    }
}

/// 改变自动备份字段
///
/// * `is_enabled`: 是否开启自动备份
fn set_auto_back_up(is_enabled: bool) {
    let result = GLOBAL_CONFIG.write();
    match result {
        Ok(mut config) => {
            config.storage.auto_backup = is_enabled;
        }
        Err(e) => {
            error!("{}", e);
        }
    }
}

// ----------------------------------------------------------
// ------------------------权限设置--------------------------
// ----------------------------------------------------------

fn set_bangumi_token(bangumi_token: String) {
    let result = GLOBAL_CONFIG.write();
    match result {
        Ok(mut config) => {
            config.auth.bangumi_token = bangumi_token;
        }
        Err(e) => {
            error!("{}", e);
        }
    }
}
