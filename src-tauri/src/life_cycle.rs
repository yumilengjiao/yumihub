//! #该模块用于控制整个程序的生命周期
use crate::{
    companion,
    config::{self, fs},
    db, resource, screenshot, shortcut, sys, theme, tray,
    user::{self},
};
use std::error::Error;
use tauri::{App, AppHandle, Manager};
#[cfg(target_os = "windows")]
use window_vibrancy::apply_acrylic;
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

/// 初始化函数
pub fn init(app: &mut App) -> Result<(), Box<dyn Error>> {
    let window = app.get_webview_window("main").unwrap();

    #[cfg(target_os = "macos")]
    apply_vibrancy(&window, NSVisualEffectMaterial, None, None);

    #[cfg(target_os = "windows")]
    apply_acrylic(&window, None).expect("不支持当前平台");

    db::init(app.handle());
    sys::init(app.handle());
    config::init(app.handle())?;
    tray::init(app.handle())?;
    companion::init(app.handle());
    shortcut::init(app.handle());
    screenshot::init(app.handle());
    user::init()?;
    resource::init(app.handle());
    theme::init(app.handle())?;
    Ok(())
}

/// 程序结束函数,保存变量到本地
pub fn exit(app_handle: &AppHandle) {
    // 保存到配置文件
    fs::save_config(app_handle).expect("保存配置文件失败");
    // 清楚连携应用
    companion::exit();
}
