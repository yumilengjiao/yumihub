use tauri::RunEvent;

mod cmd;
mod config;
mod db;
mod error;
mod game;
mod life_cycle;
mod message;
mod resource;
mod sys;
mod user;
mod util;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(tauri_plugin_log::log::LevelFilter::Debug)
                .build(),
        )
        .plugin(tauri_plugin_system_info::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(life_cycle::init)
        .invoke_handler(tauri::generate_handler![
            //用户
            cmd::get_user_info,
            cmd::update_user_info,
            //游戏
            cmd::get_game_meta_by_id,
            cmd::get_game_meta_list,
            cmd::delete_game_by_id,
            cmd::delete_game_list,
            cmd::update_game,
            cmd::add_new_game,
            cmd::add_new_game_list,
            //配置
            cmd::get_config,
            cmd::update_config,
            //存档
            cmd::backup_archive,
            //其他
            cmd::get_start_up_path,
            cmd::get_system_fonts,
            cmd::get_game_size,
            cmd::get_disks,
            cmd::get_disk_usage,
            cmd::authorize_path_access
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app_handle, event| match event {
            RunEvent::Exit => life_cycle::exit(),
            RunEvent::ExitRequested { .. } => life_cycle::exit(),
            _ => {}
        })
}
