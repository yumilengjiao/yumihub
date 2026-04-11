use std::sync::Mutex;

use tauri::RunEvent;

use crate::theme::ThemeState;

mod backup;
mod commands;
mod companion;
mod config;
mod db;
mod error;
mod game;
mod life_cycle;
mod message;
mod resource;
mod screenshot;
mod shortcut;
mod sys;
mod theme;
mod tray;
mod user;
mod util;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_system_info::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(ThemeState {
            active: Mutex::new(None),
            all_names: Mutex::new(Vec::new()),
        })
        .setup(life_cycle::init)
        .invoke_handler(tauri::generate_handler![
            // 用户
            commands::get_user_info,
            commands::update_user_info,
            // 游戏
            commands::get_game_meta_by_id,
            commands::get_game_meta_list,
            commands::delete_game_by_id,
            commands::delete_all_games,
            commands::update_game,
            commands::add_new_game,
            commands::add_new_game_list,
            commands::start_game,
            commands::get_sessions,
            commands::get_sessions_by_year,
            // 压缩包
            commands::get_archive_list,
            commands::extract_archive,
            // 游戏截图
            commands::get_screenshots_by_year_month,
            commands::update_screenshot_by_id,
            commands::delete_screenshot_by_id,
            // 配置
            commands::get_config,
            commands::update_config,
            // 快捷键
            commands::get_shortcuts,
            commands::update_shortcuts,
            // 存档备份
            commands::backup_archive,
            commands::backup_archive_by_id,
            commands::restore_all_archives,
            commands::restore_archive_by_id,
            // 连携程序
            commands::update_companions,
            commands::get_companions,
            // 系统工具
            commands::get_start_up_path,
            commands::get_system_fonts,
            commands::get_game_size,
            commands::get_disks,
            commands::get_disk_usage,
            commands::authorize_path_access,
            commands::clear_app_data,
            commands::get_theme,
            commands::get_all_theme_names,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| match event {
            RunEvent::Exit => life_cycle::exit(app_handle),
            RunEvent::ExitRequested { .. } => life_cycle::exit(app_handle),
            _ => {}
        })
}
