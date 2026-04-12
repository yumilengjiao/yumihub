//! 程序生命周期管理
//!
//! `init`：程序启动时按顺序初始化所有模块
//! `exit`：程序退出时做清理和持久化

use std::error::Error;

use tauri::{App, AppHandle, Manager};
use tauri_plugin_log::log;

#[cfg(target_os = "macos")]
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

#[cfg(target_os = "windows")]
use window_vibrancy::apply_acrylic;

use crate::{companion, config, db, resource, screenshot, shortcut, sys, theme, tray};

/// 程序启动初始化（在 Tauri setup 回调中调用）
pub fn init(app: &mut App) -> Result<(), Box<dyn Error>> {
    let win = app.get_webview_window("main").unwrap();

    // 毛玻璃效果
    #[cfg(target_os = "macos")]
    apply_vibrancy(&win, NSVisualEffectMaterial::HudWindow, None, None)
        .expect("apply_vibrancy 失败");

    #[cfg(target_os = "windows")]
    apply_acrylic(&win, None).expect("apply_acrylic 失败");

    let handle = app.handle();

    // 按依赖顺序初始化模块
    db::init(handle); // 1. 数据库（其他模块依赖 Pool）
    sys::init(handle); // 2. 系统监控 + 权限恢复
    config::init(handle)?; // 3. 配置（依赖 Pool）
    tray::init(handle)?; // 4. 托盘
    companion::init(handle); // 5. 连携程序
    shortcut::init(handle); // 6. 快捷键
    screenshot::init(handle); // 7. 截图目录
    resource::init(handle); // 8. 资源下载监听
    theme::init(handle)?; // 9. 主题

    log::info!("所有模块初始化完成");
    Ok(())
}

/// 程序退出清理（在 RunEvent::Exit 中调用）
pub fn exit(handle: &AppHandle) {
    log::info!("程序退出，开始清理...");

    // 保存配置到磁盘
    if let Err(e) = config::fs::save(handle) {
        tauri_plugin_log::log::error!("保存配置失败: {}", e);
    }

    // 关闭所有连携进程
    companion::exit();
}
