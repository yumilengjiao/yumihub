//! 配置变更事件处理
//!
//! 监听 CONFIG_HUB，把各子配置的变更分发给对应的副作用函数。

use std::path::{Path, PathBuf};

use tauri::{AppHandle, Manager, async_runtime};
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_fs::FsExt;
use tauri_plugin_log::log::{error, info, warn};

use crate::{
    companion::commands::refresh_companions,
    config::{
        GLOBAL_CONFIG,
        entity::{Background, Config, ConfigEvent, LogLevel},
    },
    infra::fs::copy_dir,
    message::{CONFIG_HUB, traits::MessageHub},
    shortcut::commands::refresh_shortcuts,
};

// ── 写锁宏 ────────────────────────────────────────────────────────────────────
//
// 明确标注 Config 类型，避免闭包类型推断失败（E0282）

macro_rules! write_config {
    (|$cfg:ident| $body:expr) => {
        match GLOBAL_CONFIG.write() {
            Ok(mut guard) => {
                let $cfg: &mut Config = &mut guard;
                $body
            }
            Err(e) => {
                error!("获取 config 写锁失败: {}", e);
                return;
            }
        }
    };
}

// ── 对外暴露的初始化辅助 ──────────────────────────────────────────────────────

/// 设置日志等级并决定是否持久化到文件
/// 注意：tauri-plugin-log 注册后不能重新注册，所以通过 log::set_max_level 动态调整等级
pub fn apply_log_level(app_handle: &AppHandle, level: LogLevel, persist: bool) {
    let filter = match level {
        LogLevel::Trace => tauri_plugin_log::log::LevelFilter::Trace,
        LogLevel::Debug => tauri_plugin_log::log::LevelFilter::Debug,
        LogLevel::Warn => tauri_plugin_log::log::LevelFilter::Warn,
        LogLevel::Error => tauri_plugin_log::log::LevelFilter::Error,
        _ => tauri_plugin_log::log::LevelFilter::Info,
    };

    // 直接修改全局 log 过滤级别，无需重新注册插件
    tauri_plugin_log::log::set_max_level(filter);

    // 持久化设置变更时需要重新注册插件（因为 target 变了）
    // 只在首次初始化或 persist 设置变更时才重新注册
    let _ = app_handle; // 暂时保留签名兼容性
}

/// 给背景图片路径授权（在 config::init 里调用）
pub fn apply_background_permission(app_handle: &AppHandle, path: &Path) {
    if path.as_os_str().is_empty() {
        return;
    }
    if let Err(e) = app_handle.asset_protocol_scope().allow_file(path) {
        error!("授予背景图片访问权限失败: {}", e);
    }
}

/// 启动事件监听循环（在 config::init 里调用）
pub fn start_listener(app: AppHandle) {
    let mut rx = CONFIG_HUB.subscribe();
    async_runtime::spawn(async move {
        while let Ok(event) = rx.recv().await {
            match event {
                ConfigEvent::Basic { base } => {
                    set_auto_start(app.clone(), base.auto_start);
                    write_config!(|c| c.basic.silent_start = base.silent_start);
                    write_config!(|c| c.basic.auto_check_update = base.auto_check_update);
                    write_config!(|c| c.basic.game_display_order = base.game_display_order);
                    write_config!(|c| c.basic.language = base.language);
                }
                ConfigEvent::System { sys } => {
                    set_companion(app.clone(), sys.companion);
                    set_hotkey(app.clone(), sys.hotkey_activation);
                    write_config!(|c| c.system.close_button_behavior = sys.close_button_behavior);
                    write_config!(|c| c.system.download_concurrency = sys.download_concurrency);
                    // 日志等级或持久化设置变更时重新应用
                    let level_changed = GLOBAL_CONFIG
                        .read()
                        .map(|c| c.system.log_level != sys.log_level)
                        .unwrap_or(false);
                    let persist_changed = GLOBAL_CONFIG
                        .read()
                        .map(|c| c.system.persist_log != sys.persist_log)
                        .unwrap_or(false);
                    write_config!(|c| c.system.log_level = sys.log_level.clone());
                    write_config!(|c| c.system.persist_log = sys.persist_log);
                    if level_changed || persist_changed {
                        apply_log_level(&app, sys.log_level, sys.persist_log);
                    }
                }
                ConfigEvent::Interface { interface } => {
                    write_config!(|c| c.interface.theme = interface.theme);
                    write_config!(|c| c.interface.theme_mode = interface.theme_mode);
                    write_config!(|c| c.interface.theme_color = interface.theme_color);
                    write_config!(|c| c.interface.font_family = interface.font_family);
                    write_config!(
                        |c| c.interface.common_card_opacity = interface.common_card_opacity
                    );
                    set_global_background(app.clone(), interface.global_background);
                }
                ConfigEvent::Storage { storage } => {
                    migrate_path(
                        storage.meta_save_path,
                        |c| c.storage.meta_save_path.clone(),
                        |c, p| c.storage.meta_save_path = p,
                    );
                    migrate_path(
                        storage.backup_save_path,
                        |c| c.storage.backup_save_path.clone(),
                        |c, p| c.storage.backup_save_path = p,
                    );
                    migrate_path(
                        storage.screenshot_path,
                        |c| c.storage.screenshot_path.clone(),
                        |c, p| c.storage.screenshot_path = p,
                    );
                    write_config!(|c| c.storage.gal_root_dir = storage.gal_root_dir);
                    write_config!(|c| c.storage.allow_downloading_resources =
                        storage.allow_downloading_resources);
                    write_config!(|c| c.storage.auto_backup = storage.auto_backup);
                }
                ConfigEvent::Authorization { auth } => {
                    write_config!(|c| c.auth.bangumi_token = auth.bangumi_token);
                }
            }
        }
    });
}

// ── 需要副作用的设置项 ────────────────────────────────────────────────────────

fn set_auto_start(app: AppHandle, yes: bool) {
    write_config!(|c| c.basic.auto_start = yes);
    let result = if yes {
        app.autolaunch().enable()
    } else {
        app.autolaunch().disable()
    };
    if let Err(e) = result {
        error!("{}自启动失败: {}", if yes { "启用" } else { "禁用" }, e);
    }
}

fn set_companion(app: AppHandle, enabled: bool) {
    write_config!(|c| c.system.companion = enabled);
    async_runtime::spawn(async move {
        if let Err(e) = refresh_companions(&app, false).await {
            error!("刷新连携程序失败: {}", e);
        }
    });
}

fn set_hotkey(app: AppHandle, enabled: bool) {
    write_config!(|c| c.system.hotkey_activation = enabled);
    async_runtime::spawn(async move {
        if let Err(e) = refresh_shortcuts(&app).await {
            error!("刷新快捷键失败: {}", e);
        }
    });
}

fn set_global_background(app: AppHandle, bg: Background) {
    let _ = app.fs_scope().allow_file(Path::new(&bg.path));
    write_config!(|c| c.interface.global_background = bg);
}

/// 存储路径变更：更新内存配置并异步迁移文件
fn migrate_path(
    new_path: PathBuf,
    get_old: impl Fn(&Config) -> PathBuf,
    set_new: impl Fn(&mut Config, PathBuf) + Send + 'static,
) {
    let (old_path, is_same) = match GLOBAL_CONFIG.read() {
        Ok(cfg) => {
            let old = get_old(&cfg);
            let p1 = new_path.canonicalize().unwrap_or_else(|_| new_path.clone());
            let p2 = old.canonicalize().unwrap_or_else(|_| old.clone());
            (old, p1 == p2)
        }
        Err(e) => {
            error!("读取 config 失败: {}", e);
            return;
        }
    };

    if is_same {
        return;
    }

    write_config!(|c| set_new(c, new_path.clone()));

    async_runtime::spawn(async move {
        if !old_path.exists() {
            warn!("旧路径 {:?} 不存在，跳过迁移", old_path);
            return;
        }
        if let Err(e) = std::fs::create_dir_all(&new_path) {
            error!("创建新目录失败: {}", e);
            return;
        }
        match copy_dir(&old_path, &new_path).await {
            Ok(_) => {
                info!("目录迁移成功");
                let _ = std::fs::remove_dir_all(&old_path);
            }
            Err(e) => error!("目录迁移失败: {}", e),
        }
    });
}
