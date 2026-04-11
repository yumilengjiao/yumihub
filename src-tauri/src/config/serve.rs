//! config 模块消息循环监听及各字段的更新处理
//!
//! 每当前端调用 `update_config` 时，只有发生变化的子配置会通过消息系统
//! 发布事件，此处订阅并分发到各个处理函数。

use std::path::{Path, PathBuf};

use tauri::{async_runtime, AppHandle};
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_fs::FsExt;
use tauri_plugin_log::log::{debug, error, info, warn};

use crate::{
    companion::commands::refresh_companions,
    config::{
        entity::{Background, CloseBehavior, ConfigEvent, LogLevel, ThemeMode},
        GLOBAL_CONFIG,
    },
    message::{traits::MessageHub, CONFIG_MESSAGE_HUB},
    shortcut::commands::refresh_shortcuts,
    util::copy_dir_recursive,
};

// ---------------------------------------------------------------------------
// 写锁辅助宏
// ---------------------------------------------------------------------------

/// 获取 GLOBAL_CONFIG 写锁并执行闭包；失败时打印错误日志并返回。
macro_rules! write_config {
    ($body:expr) => {
        match GLOBAL_CONFIG.write() {
            Ok(mut config) => {
                let config: &mut crate::config::entity::Config = &mut config;
                #[allow(clippy::redundant_closure_call)]
                ($body)(config);
            }
            Err(e) => {
                error!("获取 config 写锁失败: {}", e);
                return;
            }
        }
    };
}

// ---------------------------------------------------------------------------
// 消息循环
// ---------------------------------------------------------------------------

/// 启动 config 消息循环，监听各子配置变更事件
pub fn listening_loop(app_handler: AppHandle) {
    let mut rx = CONFIG_MESSAGE_HUB.subscribe();

    tauri::async_runtime::spawn(async move {
        while let Ok(event) = rx.recv().await {
            match event {
                ConfigEvent::Basic { base } => {
                    debug!("基本设置开始更新");
                    enable_auto_start(app_handler.clone(), base.auto_start);
                    enable_silent_start(base.silent_start);
                    enable_auto_update(base.auto_check_update);
                    set_game_display_order(base.game_display_order);
                    set_language(base.language);
                }
                ConfigEvent::System { sys } => {
                    debug!("系统设置开始更新");
                    change_companion(app_handler.clone(), sys.companion);
                    change_hotkey_activation(app_handler.clone(), sys.hotkey_activation);
                    change_close_button_action(sys.close_button_behavior);
                    change_log_level(sys.log_level);
                    set_concurrent_number(sys.download_concurrency);
                }
                ConfigEvent::Interface { interface } => {
                    debug!("界面设置开始更新");
                    change_theme(interface.theme);
                    change_interface_mode(interface.theme_mode);
                    change_interface_color(interface.theme_color);
                    change_font_family(interface.font_family);
                    change_global_background(app_handler.clone(), interface.global_background);
                    change_common_card_opacity(interface.common_card_opacity);
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

// ---------------------------------------------------------------------------
// 基础设置
// ---------------------------------------------------------------------------

fn enable_auto_start(app_handler: AppHandle, yes: bool) {
    write_config!(|config: &mut crate::config::entity::Config| config.basic.auto_start = yes);

    let result = if yes {
        app_handler.autolaunch().enable()
    } else {
        app_handler.autolaunch().disable()
    };
    if let Err(e) = result {
        error!("{}自启动失败: {}", if yes { "启动" } else { "取消" }, e);
    }
}

fn enable_silent_start(yes: bool) {
    write_config!(|config: &mut crate::config::entity::Config| config.basic.silent_start = yes);
}

fn enable_auto_update(yes: bool) {
    write_config!(|config: &mut crate::config::entity::Config| config.basic.auto_check_update = yes);
}

fn set_game_display_order(new_order: Vec<String>) {
    write_config!(|config: &mut crate::config::entity::Config| config.basic.game_display_order = new_order);
}

fn set_language(language: String) {
    write_config!(|config: &mut crate::config::entity::Config| config.basic.language = language);
}

// ---------------------------------------------------------------------------
// 系统设置
// ---------------------------------------------------------------------------

fn change_companion(app_handler: AppHandle, activation: bool) {
    match GLOBAL_CONFIG.write() {
        Ok(mut config) => {
            config.system.companion = activation;
            tauri::async_runtime::spawn(async move {
                if let Err(e) = refresh_companions(&app_handler, false).await {
                    error!("无法刷新连携程序设置: {}", e);
                }
            });
        }
        Err(e) => error!("获取 config 写锁失败: {}", e),
    }
}

fn change_hotkey_activation(app_handler: AppHandle, activation: bool) {
    match GLOBAL_CONFIG.write() {
        Ok(mut config) => {
            config.system.hotkey_activation = activation;
            tauri::async_runtime::spawn(async move {
                if let Err(e) = refresh_shortcuts(&app_handler).await {
                    error!("无法刷新快捷键功能: {}", e);
                }
            });
        }
        Err(e) => error!("获取 config 写锁失败: {}", e),
    }
}

pub fn change_close_button_action(action: CloseBehavior) {
    write_config!(|config: &mut crate::config::entity::Config| config.system.close_button_behavior = action);
}

pub fn change_log_level(level: LogLevel) {
    write_config!(|config: &mut crate::config::entity::Config| config.system.log_level = level);
}

pub fn set_concurrent_number(num: i64) {
    write_config!(|config: &mut crate::config::entity::Config| config.system.download_concurrency = num);
}

// ---------------------------------------------------------------------------
// 界面设置
// ---------------------------------------------------------------------------

pub fn change_interface_mode(mode: ThemeMode) {
    write_config!(|config: &mut crate::config::entity::Config| config.interface.theme_mode = mode);
}

pub fn change_interface_color(color: String) {
    write_config!(|config: &mut crate::config::entity::Config| config.interface.theme_color = color);
}

pub fn change_theme(mode: String) {
    write_config!(|config: &mut crate::config::entity::Config| config.interface.theme = mode);
}

pub fn change_font_family(font: String) {
    write_config!(|config: &mut crate::config::entity::Config| config.interface.font_family = font);
}

pub fn change_global_background(app_handler: AppHandle, background: Background) {
    app_handler
        .fs_scope()
        .allow_file(Path::new(&background.path))
        .ok();
    write_config!(|config: &mut crate::config::entity::Config| config.interface.global_background = background);
}

pub fn change_common_card_opacity(opacity: f32) {
    write_config!(|config: &mut crate::config::entity::Config| config.interface.common_card_opacity = opacity);
}

// ---------------------------------------------------------------------------
// 存储设置（路径变更时异步迁移文件）
// ---------------------------------------------------------------------------

/// 通用路径迁移：比较新旧路径，不同时更新内存并异步复制文件
fn migrate_storage_path(
    new_path: PathBuf,
    get_old: impl Fn(&crate::config::entity::Config) -> PathBuf,
    set_new: impl Fn(&mut crate::config::entity::Config, PathBuf),
) {
    match GLOBAL_CONFIG.write() {
        Ok(mut config) => {
            let old_path = get_old(&config);

            let p1 = new_path.canonicalize().unwrap_or_else(|_| new_path.clone());
            let p2 = old_path.canonicalize().unwrap_or_else(|_| old_path.clone());
            if p1 == p2 {
                return;
            }

            set_new(&mut config, new_path.clone());

            async_runtime::spawn(async move {
                if !old_path.exists() {
                    warn!("旧路径 {:?} 不存在，跳过迁移", old_path);
                    return;
                }
                if let Err(e) = std::fs::create_dir_all(&new_path) {
                    error!("无法创建新目录: {:?}", e);
                    return;
                }
                match copy_dir_recursive(&old_path, &new_path).await {
                    Ok(_) => {
                        info!("资源复制成功，准备清理旧数据");
                        let _ = std::fs::remove_dir_all(old_path);
                        info!("旧资源已清理完毕");
                    }
                    Err(e) => error!("迁移失败: {:?}", e),
                }
            });
        }
        Err(_) => error!("获取 config 写锁失败"),
    }
}

pub fn set_game_meta_data_load_path(path: PathBuf) {
    migrate_storage_path(
        path,
        |c| c.storage.meta_save_path.clone(),
        |c, p| c.storage.meta_save_path = p,
    );
}

pub fn set_backup_path(path: PathBuf) {
    migrate_storage_path(
        path,
        |c| c.storage.backup_save_path.clone(),
        |c, p| c.storage.backup_save_path = p,
    );
}

pub fn set_screenshot_path(path: PathBuf) {
    // TODO: 路径变更时数据库里的截图路径字段也需要同步更新
    migrate_storage_path(
        path,
        |c| c.storage.screenshot_path.clone(),
        |c, p| c.storage.screenshot_path = p,
    );
}

pub fn set_gal_root_dir(path: PathBuf) {
    write_config!(|config: &mut crate::config::entity::Config| config.storage.gal_root_dir = path);
}

fn set_allow_downloading_resources(allowed: bool) {
    write_config!(|config: &mut crate::config::entity::Config| config.storage.allow_downloading_resources = allowed);
}

fn set_auto_back_up(is_enabled: bool) {
    write_config!(|config: &mut crate::config::entity::Config| config.storage.auto_backup = is_enabled);
}

// ---------------------------------------------------------------------------
// 权限设置
// ---------------------------------------------------------------------------

fn set_bangumi_token(bangumi_token: String) {
    write_config!(|config: &mut crate::config::entity::Config| config.auth.bangumi_token = bangumi_token);
}
