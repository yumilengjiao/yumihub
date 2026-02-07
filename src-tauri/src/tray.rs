//! 托盘模块

use std::error::Error;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};

/// 托盘模块初始化函数
pub fn init(app_handle: &AppHandle) -> Result<(), Box<dyn Error>> {
    let quit_i = MenuItem::with_id(app_handle, "quit", "退出", true, None::<&str>)?;
    let show_i = MenuItem::with_id(app_handle, "show", "显示窗口", true, None::<&str>)?;

    let menu = Menu::with_items(app_handle, &[&show_i, &quit_i])?;

    let _tray = TrayIconBuilder::with_id("main-tray") // 给托盘一个 ID
        .icon(app_handle.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false) // 重要：设为 false，否则左键会弹出菜单而不是触发点击事件
        // --- 处理图标本身的事件（左键点击） ---
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        // --- 处理菜单项事件（右键点开后的选项） ---
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => {
                app.exit(0);
            }
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            _ => {}
        })
        .build(app_handle)?;

    Ok(())
}
