//! 系统托盘模块

use std::error::Error;

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};

pub fn init(handle: &AppHandle) -> Result<(), Box<dyn Error>> {
    let quit = MenuItem::with_id(handle, "quit", "退出", true, None::<&str>)?;
    let show = MenuItem::with_id(handle, "show", "显示窗口", true, None::<&str>)?;
    let menu = Menu::with_items(handle, &[&show, &quit])?;

    TrayIconBuilder::with_id("main-tray")
        .icon(handle.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { button: MouseButton::Left, .. } = event {
                show_main_window(tray.app_handle());
            }
        })
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => app.exit(0),
            "show" => show_main_window(app),
            _ => {}
        })
        .build(handle)?;

    Ok(())
}

fn show_main_window(app: &AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.show();
        let _ = win.set_focus();
    }
}
