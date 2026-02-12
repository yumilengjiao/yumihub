use tauri::RunEvent;

mod backup;
mod cmd;
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
mod tray;
mod user;
mod util;
mod theme;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_system_info::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(life_cycle::init)
        .invoke_handler(tauri::generate_handler![
            // 用户
            cmd::get_user_info,
            cmd::update_user_info,
            // 游戏
            cmd::get_game_meta_by_id,
            cmd::get_game_meta_list,
            cmd::delete_game_by_id,
            cmd::delete_game_list,
            cmd::update_game,
            cmd::add_new_game,
            cmd::add_new_game_list,
            cmd::start_game,
            cmd::get_sessions,
            cmd::get_sessions_by_year,
            // 压缩包
            cmd::get_archive_list,
            cmd::extract_archive,
            //游戏快照
            cmd::get_screenshots_by_year_month,
            cmd::update_screenshot_by_id,
            cmd::delete_screenshot_by_id,
            // 配置
            cmd::get_config,
            cmd::update_config,
            // 快捷键
            cmd::get_shortcuts,
            cmd::update_shortcuts,
            // 存档
            cmd::backup_archive,
            cmd::backup_archive_by_id,
            cmd::restore_all_archives,
            cmd::restore_archive_by_id,
            // 连携程序相关
            cmd::update_companions,
            cmd::get_companions,
            // 其他
            cmd::get_start_up_path,
            cmd::get_system_fonts,
            cmd::get_game_size,
            cmd::get_disks,
            cmd::get_disk_usage,
            cmd::authorize_path_access,
            cmd::clear_app_data
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| match event {
            RunEvent::Exit => life_cycle::exit(app_handle),
            RunEvent::ExitRequested { .. } => life_cycle::exit(app_handle),
            _ => {}
        })
}
